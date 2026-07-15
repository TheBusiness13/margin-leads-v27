module.exports=async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'POST only'});
 const admin=String(req.headers['x-admin-token']||'');if(!process.env.BETA_ADMIN_TOKEN||admin!==process.env.BETA_ADMIN_TOKEN)return res.status(403).json({error:'Invalid admin token'});
 const body=typeof req.body==='string'?JSON.parse(req.body):req.body||{};if(!body.email)return res.status(400).json({error:'Email required'});
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)return res.status(503).json({error:'Supabase admin environment variables are missing'});
 const r=await fetch(`${url}/auth/v1/invite`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({email:body.email,data:{full_name:body.name||'',workspace_name:body.workspace||body.name||'Private Workspace'},redirect_to:body.redirectTo||'https://app.marginleads.online'})});const d=await r.json();return res.status(r.status).json(r.ok?{ok:true,user:d}:{ok:false,error:d.msg||d.message||'Invite failed'});
}
