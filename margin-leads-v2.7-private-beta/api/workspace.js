const {getUser,ensureWorkspace}=require('./_auth');
module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET'&&req.method!=='POST')return res.status(405).json({ok:false,error:'GET or POST only'});
  try{
    const user=await getUser(req);if(!user)return res.status(401).json({ok:false,error:'Authentication required'});
    const membership=await ensureWorkspace(user);
    return res.status(200).json({ok:true,user:{id:user.id,email:user.email},workspace:membership.workspace,role:membership.role});
  }catch(e){return res.status(500).json({ok:false,error:e.message||'Workspace setup failed'});}
};
