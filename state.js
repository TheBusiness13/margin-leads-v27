const {getUser,ensureWorkspace,serviceFetch,jsonOrError}=require('./_auth');
module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  try{
    const user=await getUser(req); if(!user)return res.status(401).json({ok:false,error:'Sign in again.'});
    const m=await ensureWorkspace(user), wid=m.workspace.id;
    if(req.method==='GET'){
      const rows=await jsonOrError(await serviceFetch(`workspace_app_state?workspace_id=eq.${encodeURIComponent(wid)}&select=state,updated_at&limit=1`));
      return res.status(200).json({ok:true,hasState:!!rows?.[0],state:rows?.[0]?.state||{},updatedAt:rows?.[0]?.updated_at||null});
    }
    if(req.method==='PUT'||req.method==='POST'){
      const state=req.body?.state; if(!state||typeof state!=='object'||Array.isArray(state))return res.status(400).json({ok:false,error:'Invalid workspace state'});
      const bytes=Buffer.byteLength(JSON.stringify(state)); if(bytes>4_000_000)return res.status(413).json({ok:false,error:'Workspace data is too large for this beta account'});
      const r=await serviceFetch('workspace_app_state?on_conflict=workspace_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({workspace_id:wid,state,updated_by:user.id,updated_at:new Date().toISOString()})});
      if(!r.ok)await jsonOrError(r); return res.status(200).json({ok:true,bytes});
    }
    return res.status(405).json({ok:false,error:'GET or PUT only'});
  }catch(e){console.error('state api',e);return res.status(500).json({ok:false,error:e.message||'Workspace state failed'});}
};
