const {getUser,ensureWorkspace}=require('./_auth');
module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET'&&req.method!=='POST')return res.status(405).json({ok:false,error:'GET or POST only'});
  try{const user=await getUser(req);if(!user)return res.status(401).json({ok:false,code:'SESSION_REQUIRED',error:'Your session is missing or expired. Sign in again.'});const membership=await ensureWorkspace(user);if(!membership?.workspace?.id)return res.status(409).json({ok:false,code:'WORKSPACE_NOT_READY',error:'Your account is valid, but no workspace could be assigned.'});return res.status(200).json({ok:true,user:{id:user.id,email:user.email,name:user.user_metadata?.full_name||user.user_metadata?.name||''},workspace:membership.workspace,role:membership.role,services:{supabase:true,brevo:!!process.env.BREVO_API_KEY,openai:!!process.env.OPENAI_API_KEY},version:'3.0'});}catch(e){console.error('Workspace setup failed',e);return res.status(500).json({ok:false,code:'WORKSPACE_SETUP_FAILED',error:e.message||'Workspace setup failed'});}
};
