const {getUser,ensureWorkspace,serviceFetch,jsonOrError}=require('./_auth');
module.exports=async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 try{
  const user=await getUser(req);if(!user)return res.status(401).json({ok:false,error:'Sign in again.'});
  const m=await ensureWorkspace(user), wid=m.workspace.id;
  const [b,s,l]=await Promise.all([
   serviceFetch(`workspace_credit_balances?workspace_id=eq.${wid}&select=*&limit=1`).then(jsonOrError),
   serviceFetch(`workspace_subscriptions?workspace_id=eq.${wid}&select=*&limit=1`).then(jsonOrError),
   serviceFetch(`credit_ledger?workspace_id=eq.${wid}&select=id,amount,balance_after,reason,reference_id,metadata,created_at&order=created_at.desc&limit=25`).then(jsonOrError)
  ]);
  return res.status(200).json({ok:true,balance:b?.[0]||null,subscription:s?.[0]||null,ledger:l||[]});
 }catch(e){return res.status(500).json({ok:false,error:e.message||'Could not load credits'});}
};
