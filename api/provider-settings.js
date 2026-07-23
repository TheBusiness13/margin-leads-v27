const {getUser,ensureWorkspace}=require('./_auth');
const {getWorkspaceProvider,saveWorkspaceProvider,deleteWorkspaceProvider}=require('./_provider');

function clean(v,max=1000){return String(v??'').trim().slice(0,max)}
module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  try{
    const user=await getUser(req);
    if(!user)return res.status(401).json({ok:false,error:'Sign in again.'});
    const membership=await ensureWorkspace(user);
    const workspaceId=membership?.workspace?.id;
    if(!workspaceId)return res.status(409).json({ok:false,error:'Workspace unavailable.'});

    if(req.method==='GET'){
      const provider=clean(req.query?.provider||'brevo',30).toLowerCase();
      const row=await getWorkspaceProvider(workspaceId,provider).catch(()=>null);
      return res.status(200).json({ok:true,provider,configured:!!row,settings:row?.settings||{},updatedAt:row?.updatedAt||null});
    }

    if(req.method==='POST'){
      const body=typeof req.body==='string'?JSON.parse(req.body):req.body||{};
      const action=clean(body.action||'save',30).toLowerCase();
      const provider=clean(body.provider||'brevo',30).toLowerCase();
      if(!['brevo','sendgrid','resend','mailgun'].includes(provider))return res.status(400).json({ok:false,error:'Unsupported provider.'});

      if(action==='delete'){
        await deleteWorkspaceProvider(workspaceId,provider);
        return res.status(200).json({ok:true,configured:false});
      }

      const apiKey=clean(body.apiKey,500);
      if(apiKey.length<12)return res.status(400).json({ok:false,error:'Enter a valid provider API key.'});
      const settings={
        domain:clean(body.domain,255),
        baseUrl:clean(body.baseUrl,500)
      };
      await saveWorkspaceProvider(workspaceId,provider,apiKey,settings);
      return res.status(200).json({ok:true,provider,configured:true});
    }
    return res.status(405).json({ok:false,error:'GET or POST only'});
  }catch(e){
    return res.status(500).json({ok:false,error:e.message||'Provider settings failed'});
  }
};
