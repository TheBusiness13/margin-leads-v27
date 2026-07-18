const SUPABASE_URL = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function bearer(req){
  const raw=String(req.headers.authorization||'');
  return raw.toLowerCase().startsWith('bearer ')?raw.slice(7).trim():'';
}
async function getUser(req){
  const token=bearer(req);
  if(!token||!SUPABASE_URL||!SUPABASE_ANON_KEY)return null;
  const r=await fetch(`${SUPABASE_URL}/auth/v1/user`,{headers:{apikey:SUPABASE_ANON_KEY,Authorization:`Bearer ${token}`}});
  if(!r.ok)return null;
  return r.json();
}
async function serviceFetch(path,options={}){
  if(!SUPABASE_URL||!SUPABASE_SERVICE_ROLE_KEY)throw new Error('Supabase service-role environment variables are missing');
  const headers={apikey:SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,'Content-Type':'application/json',...(options.headers||{})};
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`,{...options,headers});
}
async function jsonOrError(r){
  const txt=await r.text();let d=null;try{d=txt?JSON.parse(txt):null}catch{}
  if(!r.ok)throw new Error(d?.message||d?.error||txt||`Supabase HTTP ${r.status}`);
  return d;
}
async function ensureWorkspaceEntitlements(workspace){
  if(!workspace?.id)throw new Error('Workspace is missing');
  const wid=encodeURIComponent(workspace.id);
  const trialEnds=workspace.trial_ends_at||new Date(Date.now()+14*86400000).toISOString();

  const subRows=await jsonOrError(await serviceFetch(`workspace_subscriptions?workspace_id=eq.${wid}&select=workspace_id&limit=1`));
  if(!Array.isArray(subRows)||!subRows[0]){
    const subRes=await serviceFetch('workspace_subscriptions',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({workspace_id:workspace.id,plan_code:'trial',status:'trialing',trial_ends_at:trialEnds})});
    if(!subRes.ok)await jsonOrError(subRes);
  }

  const creditRows=await jsonOrError(await serviceFetch(`workspace_credit_balances?workspace_id=eq.${wid}&select=workspace_id,balance&limit=1`));
  if(!Array.isArray(creditRows)||!creditRows[0]){
    const creditRes=await serviceFetch('workspace_credit_balances',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({workspace_id:workspace.id,balance:10,lifetime_granted:10,period_granted:10,period_ends_at:trialEnds})});
    if(!creditRes.ok)await jsonOrError(creditRes);
    const ledgerRes=await serviceFetch('credit_ledger',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({workspace_id:workspace.id,user_id:workspace.owner_id||null,amount:10,balance_after:10,reason:'Protected trial grant',reference_id:'trial-initial-grant',metadata:{source:'workspace_bootstrap'}})});
    if(!ledgerRes.ok)await jsonOrError(ledgerRes);
  }
}

async function ensureWorkspace(user){
  // Every account receives and uses a workspace owned by that exact user.
  const ownerRes=await serviceFetch(`workspaces?owner_id=eq.${encodeURIComponent(user.id)}&select=id,name,slug,plan,owner_id,trial_ends_at&order=created_at.asc&limit=1`);
  const owned=await jsonOrError(ownerRes);
  if(Array.isArray(owned)&&owned[0]){
    const workspace=owned[0];
    const memRows=await jsonOrError(await serviceFetch(`workspace_members?workspace_id=eq.${encodeURIComponent(workspace.id)}&user_id=eq.${encodeURIComponent(user.id)}&select=workspace_id&limit=1`));
    if(!Array.isArray(memRows)||!memRows[0]){
      const memRes=await serviceFetch('workspace_members',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({workspace_id:workspace.id,user_id:user.id,role:'owner'})});
      if(!memRes.ok)await jsonOrError(memRes);
    }
    await ensureWorkspaceEntitlements(workspace);
    return {workspace,role:'owner'};
  }

  const email=String(user.email||'user');
  const name=String(user.user_metadata?.workspace_name||user.user_metadata?.full_name||user.user_metadata?.name||email.split('@')[0]||'Private Workspace').slice(0,100);
  const slugBase=name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40)||'workspace';
  const slug=`${slugBase}-${String(user.id).slice(0,8)}`;
  const trialEnds=new Date(Date.now()+14*86400000).toISOString();
  const createRes=await serviceFetch('workspaces',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({name,slug,owner_id:user.id,plan:'trial',signup_source:user.app_metadata?.provider||'email',trial_started_at:new Date().toISOString(),trial_ends_at:trialEnds})});
  const created=await jsonOrError(createRes);const workspace=Array.isArray(created)?created[0]:created;
  if(!workspace?.id)throw new Error('Could not create the private workspace');
  const memRes=await serviceFetch('workspace_members',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({workspace_id:workspace.id,user_id:user.id,role:'owner'})});
  if(!memRes.ok)await jsonOrError(memRes);
  await ensureWorkspaceEntitlements({...workspace,owner_id:user.id,trial_ends_at:trialEnds});
  return {workspace:{...workspace,plan:'trial'},role:'owner'};
}
function normalizeMembership(row){
  const w=Array.isArray(row.workspaces)?row.workspaces[0]:row.workspaces;
  return {workspace:w||{id:row.workspace_id,name:'Private Workspace',plan:'beta'},role:String(row.role||'reviewer').toLowerCase()};
}
function canSend(role){return ['owner','admin','operator'].includes(String(role||'').toLowerCase());}
async function logActivity({workspaceId,userId,eventType,entityType='email',entityId=null,metadata={}}){
  const r=await serviceFetch('activity_logs',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({workspace_id:workspaceId,user_id:userId,event_type:eventType,entity_type:entityType,entity_id:entityId,metadata})});
  if(!r.ok)await jsonOrError(r);
}
async function recentActivity(workspaceId,limit=100){
  const n=Math.max(1,Math.min(250,Number(limit)||100));
  const r=await serviceFetch(`activity_logs?workspace_id=eq.${encodeURIComponent(workspaceId)}&select=id,created_at,event_type,entity_type,entity_id,metadata&order=created_at.desc&limit=${n}`);
  return jsonOrError(r);
}
async function sentTodayForWorkspace(workspaceId){
  const since=new Date();since.setUTCHours(0,0,0,0);
  const r=await serviceFetch(`activity_logs?workspace_id=eq.${encodeURIComponent(workspaceId)}&event_type=eq.email_sent&created_at=gte.${encodeURIComponent(since.toISOString())}&select=id`,{headers:{Prefer:'count=exact'}});
  if(!r.ok)await jsonOrError(r);
  const range=r.headers.get('content-range')||'';const total=Number(range.split('/')[1]);
  if(Number.isFinite(total))return total;
  const rows=await r.json();return Array.isArray(rows)?rows.length:0;
}
async function isPlatformAdmin(userId){const r=await serviceFetch(`platform_admins?user_id=eq.${encodeURIComponent(userId)}&select=user_id&limit=1`);const d=await jsonOrError(r);return !!(Array.isArray(d)&&d[0]);}
module.exports={getUser,ensureWorkspace,canSend,logActivity,recentActivity,sentTodayForWorkspace,serviceFetch,jsonOrError,isPlatformAdmin};
