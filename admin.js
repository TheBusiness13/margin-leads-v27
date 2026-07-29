const {getUser,serviceFetch,jsonOrError,isPlatformAdmin}=require('./_auth');
module.exports=async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 try{
  const user=await getUser(req);if(!user)return res.status(401).json({ok:false,error:'Sign in again.'});
  if(!await isPlatformAdmin(user.id))return res.status(403).json({ok:false,error:'Admin access required.'});
  if(req.method==='GET'){
   const rows=await jsonOrError(await serviceFetch('workspaces?select=id,name,slug,plan,account_status,max_users,max_leads,ai_daily_limit,created_at,workspace_subscriptions(plan_code,status,current_period_end,trial_ends_at),workspace_credit_balances(balance,lifetime_used)&order=created_at.desc&limit=250'));
   return res.status(200).json({ok:true,workspaces:rows||[]});
  }
  if(req.method==='POST'){
   const body=typeof req.body==='string'?JSON.parse(req.body):req.body||{};const wid=String(body.workspaceId||'');
   if(!wid)return res.status(400).json({ok:false,error:'workspaceId required'});
   if(body.action==='grant_credits'){
    const amount=Math.max(1,Math.min(100000,Number(body.amount)||0));
    const r=await serviceFetch('rpc/grant_workspace_credits',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({p_workspace_id:wid,p_amount:amount,p_reason:'admin_grant',p_reference_id:String(body.referenceId||''),p_metadata:{granted_by:user.id}})});
    const d=await jsonOrError(r);return res.status(200).json({ok:true,balance:Array.isArray(d)?d[0]:d});
   }
   if(body.action==='set_status'){
    const status=['active','suspended'].includes(body.status)?body.status:'active';
    await jsonOrError(await serviceFetch(`workspaces?id=eq.${wid}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({account_status:status,updated_at:new Date().toISOString()})}));
    return res.status(200).json({ok:true,status});
   }
   return res.status(400).json({ok:false,error:'Unknown admin action'});
  }
  return res.status(405).json({ok:false,error:'GET or POST only'});
 }catch(e){return res.status(500).json({ok:false,error:e.message||'Admin request failed'});}
};
