const {getUser,ensureWorkspace,serviceFetch,jsonOrError}=require('./_auth');

function clean(v,max=5000){return String(v??'').trim().slice(0,max)}
function iso(v){const d=new Date(v||0);return Number.isFinite(d.getTime())?d.toISOString():null}
async function sf(path,options){return jsonOrError(await serviceFetch(path,options))}

async function readAll(workspaceId){
  const wid=encodeURIComponent(workspaceId);
  const [campaignRows,leadRows,sequenceRows,jobRows,itemRows,senderRows]=await Promise.all([
    sf(`ml_campaigns?workspace_id=eq.${wid}&select=*&order=created_at.asc`),
    sf(`ml_leads?workspace_id=eq.${wid}&select=*&order=created_at.asc`),
    sf(`ml_campaign_sequences?workspace_id=eq.${wid}&select=*`),
    sf(`ml_send_jobs?workspace_id=eq.${wid}&select=*&order=created_at.desc&limit=100`),
    sf(`ml_send_job_items?workspace_id=eq.${wid}&select=*&order=id.asc&limit=5000`),
    sf(`ml_sender_profiles?workspace_id=eq.${wid}&select=*&limit=1`)
  ]);
  const leadsByCampaign=new Map();
  for(const row of leadRows||[]){
    const list=leadsByCampaign.get(row.campaign_id)||[];
    const data=row.data&&typeof row.data==='object'?row.data:{};
    list.push({
      ...data,
      id:row.id,rowNumber:row.row_number,company:row.company||'',contact:row.contact||'',
      role:row.role||'',email:row.email||'',website:row.website||'',linkedin:row.linkedin||'',
      category:row.category||'',product:row.product||'',revenue:Number(row.revenue||0),
      revenueRaw:row.revenue_raw||'',source:row.source||'',importProfile:row.import_profile||'Standard',
      status:row.status||'New',sequenceStep:row.sequence_step||'email1',
      lastSentStep:row.last_sent_step||null,lastSentAt:row.last_sent_at||null,
      nextSendAt:row.next_send_at||null,replyStatus:row.reply_status||null,stopped:!!row.stopped
    });
    leadsByCampaign.set(row.campaign_id,list);
  }
  const sequenceByCampaign=new Map((sequenceRows||[]).map(r=>[r.campaign_id,r.steps||[]]));
  const itemsByJob=new Map();
  for(const row of itemRows||[]){const list=itemsByJob.get(row.job_id)||[];list.push(row);itemsByJob.set(row.job_id,list)}
  return {
    campaigns:(campaignRows||[]).map(c=>({
      id:c.id,name:c.name,source:c.source||'Manual',profile:c.profile||'Standard',
      status:c.status||'active',createdAt:c.created_at,updatedAt:c.updated_at,
      sequence:sequenceByCampaign.get(c.id)||null,leads:leadsByCampaign.get(c.id)||[]
    })),
    sendJobs:(jobRows||[]).map(j=>({...j,items:itemsByJob.get(j.id)||[]})),
    senderProfile:(senderRows||[])[0]||null
  };
}

async function syncCampaigns(workspaceId,userId,campaigns){
  if(!Array.isArray(campaigns))throw new Error('Campaigns must be an array');
  const campaignRows=[],leadRows=[],sequenceRows=[];
  for(const c of campaigns){
    const id=clean(c.id,200); if(!id)continue;
    campaignRows.push({
      id,workspace_id:workspaceId,name:clean(c.name||'Untitled campaign',300),
      source:clean(c.source||'Manual',200),profile:clean(c.profile||'Standard',100),
      status:clean(c.status||'active',50),created_by:userId,
      created_at:iso(c.createdAt)||new Date().toISOString(),updated_at:new Date().toISOString()
    });
    const steps=Array.isArray(c.sequence)?c.sequence:null;
    if(steps)sequenceRows.push({workspace_id:workspaceId,campaign_id:id,steps,updated_by:userId,updated_at:new Date().toISOString()});
    for(const l of Array.isArray(c.leads)?c.leads:[]){
      const lid=clean(l.id,240); if(!lid)continue;
      const known=['id','rowNumber','company','contact','role','email','website','linkedin','category','product','revenue','revenueRaw','source','importProfile','status','sequenceStep','lastSentStep','lastSentAt','nextSendAt','replyStatus','stopped'];
      const extra={};for(const [k,v] of Object.entries(l)){if(!known.includes(k))extra[k]=v}
      leadRows.push({
        id:lid,workspace_id:workspaceId,campaign_id:id,row_number:Number(l.rowNumber)||null,
        company:clean(l.company,500),contact:clean(l.contact,500),role:clean(l.role,500),
        email:clean(l.email,500),website:clean(l.website,1000),linkedin:clean(l.linkedin,1000),
        category:clean(l.category,500),product:clean(l.product,1000),revenue:Number(l.revenue)||0,
        revenue_raw:clean(l.revenueRaw,200),source:clean(l.source||c.source,200),
        import_profile:clean(l.importProfile||c.profile||'Standard',100),
        status:clean(l.status||'New',100),sequence_step:clean(l.sequenceStep||'email1',50),
        last_sent_step:clean(l.lastSentStep,50)||null,last_sent_at:iso(l.lastSentAt),
        next_send_at:iso(l.nextSendAt),reply_status:clean(l.replyStatus,100)||null,
        stopped:!!l.stopped,data:extra,updated_at:new Date().toISOString()
      });
    }
  }
  if(campaignRows.length)await sf('ml_campaigns?on_conflict=id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(campaignRows)});
  if(sequenceRows.length)await sf('ml_campaign_sequences?on_conflict=campaign_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(sequenceRows)});
  if(leadRows.length)await sf('ml_leads?on_conflict=id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(leadRows)});
  return {campaigns:campaignRows.length,leads:leadRows.length};
}

module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  try{
    const user=await getUser(req);if(!user)return res.status(401).json({ok:false,error:'Sign in again.'});
    const membership=await ensureWorkspace(user),workspaceId=membership?.workspace?.id;
    if(!workspaceId)return res.status(409).json({ok:false,error:'Workspace unavailable.'});
    if(req.method==='GET')return res.status(200).json({ok:true,...await readAll(workspaceId)});
    if(req.method!=='POST'&&req.method!=='PUT'&&req.method!=='DELETE')return res.status(405).json({ok:false,error:'GET, POST, PUT or DELETE only'});
    const body=typeof req.body==='string'?JSON.parse(req.body):req.body||{};
    const action=clean(body.action||'',50);

    if(action==='syncCampaigns'){
      const result=await syncCampaigns(workspaceId,user.id,body.campaigns||[]);
      return res.status(200).json({ok:true,...result});
    }
    if(action==='deleteCampaign'){
      const id=clean(body.campaignId,240);if(!id)return res.status(400).json({ok:false,error:'Campaign ID required'});
      await sf(`ml_campaigns?workspace_id=eq.${encodeURIComponent(workspaceId)}&id=eq.${encodeURIComponent(id)}`,{method:'DELETE',headers:{Prefer:'return=minimal'}});
      return res.status(200).json({ok:true});
    }
    if(action==='saveSenderProfile'){
      const p=body.profile||{};
      const row={workspace_id:workspaceId,provider:clean(p.provider||'brevo',30),from_name:clean(p.fromName,300),from_email:clean(p.fromEmail,500),reply_to:clean(p.replyTo,500),opt_out_email:clean(p.optOutEmail,500),compliance_line:clean(p.complianceLine||'soft',30),updated_by:user.id,updated_at:new Date().toISOString()};
      await sf('ml_sender_profiles?on_conflict=workspace_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(row)});
      return res.status(200).json({ok:true,profile:row});
    }
    if(action==='createSendJob'){
      const job=body.job||{},items=Array.isArray(body.items)?body.items:[];
      const id=clean(job.id,240);if(!id)return res.status(400).json({ok:false,error:'Job ID required'});
      const row={id,workspace_id:workspaceId,campaign_id:clean(job.campaignId,240)||null,campaign_name:clean(job.campaignName,300),provider:clean(job.provider||'brevo',30),sequence_step:clean(job.sequenceStep||'email1',50),status:clean(job.status||'ready',30),recipient_count:items.length,payload:job.payload||{},created_by:user.id,created_at:new Date().toISOString(),updated_at:new Date().toISOString()};
      await sf('ml_send_jobs?on_conflict=id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(row)});
      if(items.length){
        const rows=items.map(i=>({workspace_id:workspaceId,job_id:id,campaign_id:row.campaign_id,lead_id:clean(i.leadId,240)||null,recipient:clean(i.to,500),subject:clean(i.subject,1000),status:'ready'}));
        await sf('ml_send_job_items',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify(rows)});
      }
      return res.status(200).json({ok:true,jobId:id});
    }
    if(action==='updateSendJob'){
      const id=clean(body.jobId,240);if(!id)return res.status(400).json({ok:false,error:'Job ID required'});
      const p=body.patch||{},row={status:clean(p.status,30)||undefined,sent_count:Number.isFinite(Number(p.sentCount))?Number(p.sentCount):undefined,failed_count:Number.isFinite(Number(p.failedCount))?Number(p.failedCount):undefined,result:p.result||undefined,started_at:iso(p.startedAt)||undefined,completed_at:iso(p.completedAt)||undefined,updated_at:new Date().toISOString()};
      Object.keys(row).forEach(k=>row[k]===undefined&&delete row[k]);
      await sf(`ml_send_jobs?workspace_id=eq.${encodeURIComponent(workspaceId)}&id=eq.${encodeURIComponent(id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify(row)});
      if(Array.isArray(p.items)){
        for(const i of p.items){
          const leadId=clean(i.leadId,240);if(!leadId)continue;
          const ir={status:clean(i.status,30)||'failed',provider_message_id:clean(i.messageId,500)||null,error:clean(i.error,3000)||null,sent_at:i.status==='sent'?new Date().toISOString():null};
          await sf(`ml_send_job_items?workspace_id=eq.${encodeURIComponent(workspaceId)}&job_id=eq.${encodeURIComponent(id)}&lead_id=eq.${encodeURIComponent(leadId)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify(ir)});
        }
      }
      return res.status(200).json({ok:true});
    }
    return res.status(400).json({ok:false,error:'Unknown action'});
  }catch(e){console.error('data api',e);return res.status(500).json({ok:false,error:e.message||'Data operation failed'});}
};
