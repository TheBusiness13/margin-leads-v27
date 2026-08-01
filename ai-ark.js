const {getUser,ensureWorkspace,serviceFetch,jsonOrError,logActivity}=require('./_auth');

const BASE='https://api.ai-ark.com/api/developer-portal/v1';
function clean(v,max=5000){return String(v??'').replace(/\0/g,'').trim().slice(0,max)}
function safeInt(v,min,max,fallback){const n=Number(v);return Number.isFinite(n)?Math.max(min,Math.min(max,Math.floor(n))):fallback}
function parseBody(req){if(typeof req.body==='string'){try{return JSON.parse(req.body)}catch{return {}}}return req.body||{}}
function safePayload(input,maxSize=100){
  const p=input&&typeof input==='object'&&!Array.isArray(input)?JSON.parse(JSON.stringify(input)):{};
  p.page=safeInt(p.page,0,100000,0);p.size=safeInt(p.size,1,maxSize,10);
  delete p.webhook;
  return p;
}
async function aiArk(path,{method='GET',body}={}){
  const key=process.env.AI_ARK_API_KEY||'';
  if(!key)throw Object.assign(new Error('AI Ark is not connected. Add AI_ARK_API_KEY in Vercel and redeploy.'),{status:503,code:'AI_ARK_NOT_CONFIGURED'});
  const headers={'X-TOKEN':key,'Content-Type':'application/json'};
  const r=await fetch(`${BASE}${path}`,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
  const raw=await r.text();let data;try{data=raw?JSON.parse(raw):null}catch{data={raw}}
  if(!r.ok){const msg=data?.message||data?.error||data?.detail||`AI Ark HTTP ${r.status}`;throw Object.assign(new Error(clean(msg,1200)),{status:r.status,details:data});}
  return data;
}
async function getBalance(workspaceId){
  const rows=await jsonOrError(await serviceFetch(`workspace_credit_balances?workspace_id=eq.${encodeURIComponent(workspaceId)}&select=balance&limit=1`));
  return Number(rows?.[0]?.balance||0);
}
async function consumeCredits(workspaceId,userId,amount,referenceId,metadata){
  const rows=await jsonOrError(await serviceFetch('rpc/consume_workspace_credits',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({p_workspace_id:workspaceId,p_user_id:userId,p_amount:amount,p_reason:'ai_ark_verified_email',p_reference_id:referenceId,p_metadata:metadata||{}})}));
  return Array.isArray(rows)?rows[0]:rows;
}
module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  try{
    const user=await getUser(req);if(!user)return res.status(401).json({ok:false,error:'Sign in again.'});
    const membership=await ensureWorkspace(user),workspace=membership?.workspace;
    if(!workspace?.id)return res.status(409).json({ok:false,error:'Workspace unavailable.'});
    const body=parseBody(req),action=clean(body.action,80);
    if(req.method!=='POST')return res.status(405).json({ok:false,error:'POST only'});
    if(action==='health'){
      const balance=await getBalance(workspace.id);
      return res.status(200).json({ok:true,configured:!!process.env.AI_ARK_API_KEY,balance});
    }
    if(action==='searchCompanies'){
      const payload=safePayload(body.payload,100);
      const data=await aiArk('/companies',{method:'POST',body:payload});
      await logActivity({workspaceId:workspace.id,userId:user.id,eventType:'ai_ark_company_search',entityType:'integration',metadata:{page:payload.page,size:payload.size}}).catch(()=>{});
      return res.status(200).json({ok:true,data});
    }
    if(action==='searchPeople'){
      const payload=safePayload(body.payload,100);
      const data=await aiArk('/people',{method:'POST',body:payload});
      await logActivity({workspaceId:workspace.id,userId:user.id,eventType:'ai_ark_people_search',entityType:'integration',metadata:{page:payload.page,size:payload.size}}).catch(()=>{});
      return res.status(200).json({ok:true,data});
    }
    if(action==='exportPeople'){
      const payload=safePayload(body.payload,10);
      const cost=payload.size;
      const balance=await getBalance(workspace.id);
      if(balance<cost)return res.status(402).json({ok:false,code:'CREDITS_REQUIRED',error:`This export needs ${cost} Margin Credits, but only ${balance} remain.`,balance});
      const data=await aiArk('/people/export',{method:'POST',body:payload});
      const trackId=clean(data?.trackId||data?.track_id||data?.id,200);
      const ref=`aiark-${trackId||Date.now()}`;
      const result=await consumeCredits(workspace.id,user.id,cost,ref,{trackId:trackId||null,requested:cost});
      if(!result?.ok)return res.status(402).json({ok:false,code:'CREDITS_REQUIRED',error:result?.message||'Could not reserve Margin Credits.',balance:result?.balance??balance});
      await logActivity({workspaceId:workspace.id,userId:user.id,eventType:'ai_ark_email_export_started',entityType:'integration',entityId:trackId||null,metadata:{requested:cost}}).catch(()=>{});
      return res.status(200).json({ok:true,data,trackId,credits:{used:cost,remaining:result.balance}});
    }
    if(action==='exportStatus'){
      const trackId=encodeURIComponent(clean(body.trackId,200));if(!trackId)return res.status(400).json({ok:false,error:'Track ID required.'});
      const data=await aiArk(`/people/export/${trackId}/statistics`);
      return res.status(200).json({ok:true,data});
    }
    if(action==='exportResults'){
      const trackId=encodeURIComponent(clean(body.trackId,200));if(!trackId)return res.status(400).json({ok:false,error:'Track ID required.'});
      const page=safeInt(body.page,0,100000,0),size=safeInt(body.size,1,100,100);
      const data=await aiArk(`/people/export/${trackId}/inquiries?page=${page}&size=${size}`);
      await logActivity({workspaceId:workspace.id,userId:user.id,eventType:'ai_ark_results_loaded',entityType:'integration',entityId:decodeURIComponent(trackId),metadata:{page,size}}).catch(()=>{});
      return res.status(200).json({ok:true,data});
    }
    return res.status(400).json({ok:false,error:'Unknown AI Ark action.'});
  }catch(e){
    console.error('AI Ark integration error',e);
    return res.status(Number(e.status)||500).json({ok:false,code:e.code||null,error:clean(e.message||'AI Ark request failed.',1200),details:e.details||null});
  }
};
