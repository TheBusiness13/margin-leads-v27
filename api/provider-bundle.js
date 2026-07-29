const {getUser,ensureWorkspace,serviceFetch,jsonOrError}=require('./_auth');
const {getWorkspaceProvider,saveWorkspaceProvider}=require('./_provider');
function clean(v,max=1000){return String(v??'').trim().slice(0,max)}
async function sf(path,options){return jsonOrError(await serviceFetch(path,options))}
module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET'&&req.method!=='POST')return res.status(405).json({ok:false,error:'GET or POST only'});
  try{
    const user=await getUser(req);
    if(!user)return res.status(401).json({ok:false,error:'Sign in again.'});
    const membership=await ensureWorkspace(user);
    const workspaceId=membership?.workspace?.id;
    if(!workspaceId)return res.status(409).json({ok:false,error:'Workspace unavailable.'});
    const provider=clean((req.method==='GET'?req.query?.provider:req.body?.provider)||'brevo',30).toLowerCase();
    if(!['brevo','sendgrid','resend','mailgun'].includes(provider))return res.status(400).json({ok:false,error:'Unsupported provider.'});
    if(req.method==='GET'){
      const [connection,profiles]=await Promise.all([
        getWorkspaceProvider(workspaceId,provider).catch(()=>null),
        sf(`ml_provider_profiles?workspace_id=eq.${encodeURIComponent(workspaceId)}&provider=eq.${encodeURIComponent(provider)}&select=*&limit=1`).catch(()=>[])
      ]);
      return res.status(200).json({ok:true,provider,configured:!!connection,settings:connection?.settings||{},profile:Array.isArray(profiles)?profiles[0]||null:null,updatedAt:connection?.updatedAt||null});
    }
    const body=typeof req.body==='string'?JSON.parse(req.body):req.body||{};
    const existing=await getWorkspaceProvider(workspaceId,provider).catch(()=>null);
    const apiKey=clean(body.apiKey,500);
    if(!existing&&!apiKey)return res.status(400).json({ok:false,error:`Enter the ${provider} API key for the first connection.`});
    const profile={workspace_id:workspaceId,provider,from_name:clean(body.fromName,300),from_email:clean(body.fromEmail,500),reply_to:clean(body.replyTo,500),opt_out_email:clean(body.optOutEmail,500),compliance_line:clean(body.complianceLine||'soft',30),domain:clean(body.domain,500),updated_by:user.id,updated_at:new Date().toISOString()};
    if(!/^\S+@\S+\.\S+$/.test(profile.from_email))return res.status(400).json({ok:false,error:'Enter a valid sender email.'});
    const settings={domain:profile.domain,fromName:profile.from_name,fromEmail:profile.from_email,replyTo:profile.reply_to,optOutEmail:profile.opt_out_email,complianceLine:profile.compliance_line};
    await saveWorkspaceProvider(workspaceId,provider,apiKey||existing.apiKey,settings);
    await sf('ml_provider_profiles?on_conflict=workspace_id,provider',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify(profile)});
    return res.status(200).json({ok:true,provider,configured:true,profile});
  }catch(e){
    console.error('provider bundle failed',e);
    return res.status(500).json({ok:false,error:e.message||'Provider save failed'});
  }
};