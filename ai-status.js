const {getUser,ensureWorkspace}=require('./_auth');
module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET')return res.status(405).json({ok:false,error:'GET only'});
  try{const user=await getUser(req);if(!user)return res.status(401).json({ok:false,error:'Authentication required'});const membership=await ensureWorkspace(user);return res.status(200).json({ok:true,connected:!!process.env.OPENAI_API_KEY,model:process.env.OPENAI_MODEL||'gpt-5-mini',workspace:{id:membership.workspace?.id,name:membership.workspace?.name},role:membership.role});}catch(e){return res.status(500).json({ok:false,error:e.message||'AI status unavailable'});}
};
