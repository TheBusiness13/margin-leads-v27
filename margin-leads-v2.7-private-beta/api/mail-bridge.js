const DAILY_LIMIT = Number(process.env.DAILY_LIMIT || 100);
const MAX_PER_REQUEST = Number(process.env.MAX_PER_REQUEST || 100);
const DEFAULT_PROVIDER = String(process.env.DEFAULT_PROVIDER || 'brevo').toLowerCase();
const CONCURRENCY = Math.max(1, Math.min(10, Number(process.env.SEND_CONCURRENCY || 5)));
const ENDPOINTS = {brevo:'https://api.brevo.com/v3/smtp/email',sendgrid:'https://api.sendgrid.com/v3/mail/send',resend:'https://api.resend.com/emails'};
function reply(res,status,payload){res.status(status).json(payload)}
function clean(v,max=5000){return String(v??'').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,'').trim().slice(0,max)}
function validEmail(v){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v||'').trim())}
function htmlEscape(v){return String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;')}
function textToHtml(t){return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:#111827;">${htmlEscape(t).replace(/\n/g,'<br>')}</div>`}
function configured(p){if(p==='brevo')return !!process.env.BREVO_API_KEY;if(p==='sendgrid')return !!process.env.SENDGRID_API_KEY;if(p==='resend')return !!process.env.RESEND_API_KEY;if(p==='mailgun')return !!(process.env.MAILGUN_API_KEY&&process.env.MAILGUN_DOMAIN);return false}
async function parseProviderResponse(provider,response){const raw=await response.text();let data=null;try{data=raw?JSON.parse(raw):null}catch{}if(response.ok)return{ok:true,provider,status:response.status,messageId:data?.messageId||data?.id||response.headers.get('x-message-id')||null};const m=data?.message||data?.error||raw||'Unknown provider error';return{ok:false,provider,status:response.status,error:`${provider.toUpperCase()} HTTP ${response.status}: ${typeof m==='string'?m:JSON.stringify(m)}`}}
function validateEmailPayload(e){if(!validEmail(clean(e?.to,320)))return'Invalid recipient email';if(!clean(e?.subject,250))return'Missing subject';if(!clean(e?.textContent,12000))return'Missing body';return null}
async function sendBrevo(sender,replyTo,optOut,email){const er=validateEmailPayload(email);if(er)return{ok:false,error:er};const text=clean(email.textContent,12000);const payload={sender:{name:clean(sender.name||'MarginBusiness',160),email:clean(sender.email,320)},to:[{email:clean(email.to,320),...(clean(email.name,160)?{name:clean(email.name,160)}:{})}],subject:clean(email.subject,250),textContent:text,htmlContent:textToHtml(text),tags:['lead-radar','marginbusiness','v2-6']};if(validEmail(replyTo?.email))payload.replyTo={email:clean(replyTo.email,320)};if(validEmail(optOut))payload.headers={'List-Unsubscribe':`<mailto:${clean(optOut,320)}?subject=unsubscribe>`,'X-Lead-Radar':'MarginBusiness Lead Radar v2.6'};return parseProviderResponse('brevo',await fetch(ENDPOINTS.brevo,{method:'POST',headers:{accept:'application/json','content-type':'application/json','api-key':process.env.BREVO_API_KEY},body:JSON.stringify(payload)}))}
async function sendSendGrid(sender,replyTo,optOut,email){const er=validateEmailPayload(email);if(er)return{ok:false,error:er};const text=clean(email.textContent,12000);const payload={personalizations:[{to:[{email:clean(email.to,320),...(clean(email.name,160)?{name:clean(email.name,160)}:{})}]}],from:{email:clean(sender.email,320),name:clean(sender.name||'MarginBusiness',160)},subject:clean(email.subject,250),content:[{type:'text/plain',value:text},{type:'text/html',value:textToHtml(text)}],categories:['lead-radar','marginbusiness']};if(validEmail(replyTo?.email))payload.reply_to={email:clean(replyTo.email,320)};if(validEmail(optOut))payload.headers={'List-Unsubscribe':`<mailto:${clean(optOut,320)}?subject=unsubscribe>`};return parseProviderResponse('sendgrid',await fetch(ENDPOINTS.sendgrid,{method:'POST',headers:{accept:'application/json','content-type':'application/json',authorization:`Bearer ${process.env.SENDGRID_API_KEY}`},body:JSON.stringify(payload)}))}
async function sendResend(sender,replyTo,optOut,email){const er=validateEmailPayload(email);if(er)return{ok:false,error:er};const text=clean(email.textContent,12000),fe=clean(sender.email,320),fn=clean(sender.name||'MarginBusiness',160),te=clean(email.to,320),tn=clean(email.name,160);const payload={from:fn?`${fn} <${fe}>`:fe,to:[tn?`${tn} <${te}>`:te],subject:clean(email.subject,250),text,html:textToHtml(text),tags:[{name:'app',value:'lead-radar'}]};if(validEmail(replyTo?.email))payload.reply_to=[clean(replyTo.email,320)];if(validEmail(optOut))payload.headers={'List-Unsubscribe':`<mailto:${clean(optOut,320)}?subject=unsubscribe>`};return parseProviderResponse('resend',await fetch(ENDPOINTS.resend,{method:'POST',headers:{accept:'application/json','content-type':'application/json',authorization:`Bearer ${process.env.RESEND_API_KEY}`},body:JSON.stringify(payload)}))}
async function sendMailgun(sender,replyTo,optOut,email){const er=validateEmailPayload(email);if(er)return{ok:false,error:er};const form=new URLSearchParams(),fe=clean(sender.email,320),fn=clean(sender.name||'MarginBusiness',160),te=clean(email.to,320),tn=clean(email.name,160),text=clean(email.textContent,12000);form.set('from',fn?`${fn} <${fe}>`:fe);form.set('to',tn?`${tn} <${te}>`:te);form.set('subject',clean(email.subject,250));form.set('text',text);form.set('html',textToHtml(text));form.set('o:tag','lead-radar');if(validEmail(replyTo?.email))form.set('h:Reply-To',clean(replyTo.email,320));if(validEmail(optOut))form.set('h:List-Unsubscribe',`<mailto:${clean(optOut,320)}?subject=unsubscribe>`);const base=String(process.env.MAILGUN_BASE_URL||'https://api.mailgun.net').replace(/\/$/,'');const auth=Buffer.from(`api:${process.env.MAILGUN_API_KEY}`).toString('base64');return parseProviderResponse('mailgun',await fetch(`${base}/v3/${process.env.MAILGUN_DOMAIN}/messages`,{method:'POST',headers:{accept:'application/json',authorization:`Basic ${auth}`,'content-type':'application/x-www-form-urlencoded'},body:form.toString()}))}
async function sendWithProvider(p,s,r,o,e){if(!configured(p))return{ok:false,error:`Provider not configured: ${p}`};if(p==='brevo')return sendBrevo(s,r,o,e);if(p==='sendgrid')return sendSendGrid(s,r,o,e);if(p==='resend')return sendResend(s,r,o,e);if(p==='mailgun')return sendMailgun(s,r,o,e);return{ok:false,error:`Unsupported provider: ${p}`}}
async function mapWithConcurrency(items,limit,worker){const results=new Array(items.length);let cursor=0;async function run(){while(true){const i=cursor++;if(i>=items.length)return;try{results[i]=await worker(items[i],i)}catch(e){results[i]={ok:false,error:e?.message||'Unexpected send error'}}}}await Promise.all(Array.from({length:Math.min(limit,items.length)},run));return results}


const {getUser,ensureWorkspace,canSend,logActivity,recentActivity,sentTodayForWorkspace}=require('./_auth');
function legacyTokenValid(req,body){
  const expected=String(process.env.BRIDGE_TOKEN||'');
  const provided=String(req.headers['x-leadradar-token']||body?.token||'');
  return !!expected && provided===expected;
}
async function requestIdentity(req,body){
  const user=await getUser(req);
  if(user){
    const membership=await ensureWorkspace(user);
    return {mode:'supabase',user,membership};
  }
  const allowLegacy=String(process.env.ALLOW_LEGACY_BRIDGE_TOKEN||'true').toLowerCase()!=='false';
  if(allowLegacy&&legacyTokenValid(req,body))return {mode:'legacy',user:null,membership:{workspace:{id:null,name:'Legacy workspace',plan:'internal'},role:'owner'}};
  return null;
}
module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST')return reply(res,405,{ok:false,error:'POST only'});
  const body=typeof req.body==='string'?(()=>{try{return JSON.parse(req.body)}catch{return null}})():req.body;
  if(!body||typeof body!=='object')return reply(res,400,{ok:false,error:'Invalid JSON'});
  const provider=clean(body.provider||DEFAULT_PROVIDER,30).toLowerCase();
  const action=clean(body.action,30).toLowerCase();
  try{
    const identity=await requestIdentity(req,body);
    if(!identity)return reply(res,401,{ok:false,error:'Sign in again. Your session is missing or expired.'});
    const {user,membership,mode}=identity;
    const workspace=membership.workspace||{};
    const workspaceId=workspace.id||null;
    const role=membership.role||'reviewer';
    const persistent=mode==='supabase'&&!!workspaceId;
    const today=persistent?await sentTodayForWorkspace(workspaceId):0;

    if(action==='ping'){
      return reply(res,200,{ok:true,runtime:'vercel-node',version:'2.9',serverDate:new Date().toISOString(),authMode:mode,role,workspace:{id:workspaceId,name:workspace.name||'Private Workspace',plan:workspace.plan||'beta'},dailyLimit:DAILY_LIMIT,maxPerRequest:MAX_PER_REQUEST,sentToday:today,remainingToday:Math.max(0,DAILY_LIMIT-today),selectedProvider:provider,providerConfigured:configured(provider),configuredProviders:{brevo:configured('brevo'),sendgrid:configured('sendgrid'),mailgun:configured('mailgun'),resend:configured('resend')},databaseConfigured:persistent,persistence:persistent?'supabase':'legacy-local'});
    }
    if(action==='logs'||action==='metrics'){
      const activity=persistent?await recentActivity(workspaceId,body.limit||200):[];
      const events=activity.map(row=>{const m=row.metadata||{};return {...row,provider:m.provider||null,campaign:m.campaign||null,campaign_id:m.campaignId||null,sequence_step:m.sequenceStep||null,lead_id:row.entity_id||m.leadId||null,recipient:m.recipient||m.to||null,message_id:m.messageId||null,success:row.event_type==='email_sent'||!String(row.event_type||'').includes('failed'),error:m.error||null};});
      const totals={sent:0,failed:0,attempted:0,delivered:0,opened:0,clicked:0,bounced:0,unsubscribed:0,complained:0};
      for(const row of events){const t=String(row.event_type||'');if(t==='email_sent'){totals.sent++;totals.attempted++;}else if(t==='email_failed'){totals.failed++;totals.attempted++;}else if(t==='email_delivered')totals.delivered++;else if(t==='email_opened')totals.opened++;else if(t==='email_clicked')totals.clicked++;else if(t==='email_bounced')totals.bounced++;else if(t==='email_unsubscribed')totals.unsubscribed++;else if(t==='email_complained')totals.complained++;}
      return reply(res,200,{ok:true,provider,authMode:mode,workspace,databaseConfigured:persistent,serverDate:new Date().toISOString(),totals,events,sentToday:today,remainingToday:Math.max(0,DAILY_LIMIT-today)});
    }
    if(action==='event'||action==='webhook'){
      if(!persistent)return reply(res,400,{ok:false,error:'Persistent workspace logging is required for provider events'});
      const incoming=Array.isArray(body.events)?body.events:[body];let stored=0;
      for(const e of incoming){const type=clean(e.event||e.type||'event',80).toLowerCase();await logActivity({workspaceId,userId:user.id,eventType:`email_${type.replace(/^email_/,'')}`,entityType:'email',entityId:clean(e.leadId||e.messageId,240)||null,metadata:{...e,provider:e.provider||provider}});stored++;}
      return reply(res,200,{ok:true,stored});
    }
    if(!canSend(role))return reply(res,403,{ok:false,error:`Your ${role} role can review outreach but cannot send emails.`});
    const sender=body.sender||{},replyTo=body.replyTo||{},optOut=clean(body.optOutEmail,320),emails=Array.isArray(body.emails)?body.emails:[];
    if(!validEmail(sender.email))return reply(res,400,{ok:false,error:'Invalid sender email'});
    if(!emails.length)return reply(res,400,{ok:false,error:'No emails supplied'});
    if(emails.length>MAX_PER_REQUEST)return reply(res,400,{ok:false,error:`Too many emails in one request. Max ${MAX_PER_REQUEST}`});
    if(!configured(provider))return reply(res,500,{ok:false,error:`Selected provider is not configured in Vercel Environment Variables: ${provider}`});
    if(today>=DAILY_LIMIT)return reply(res,429,{ok:false,error:'Daily workspace sending limit reached',sentToday:today,remainingToday:0});
    if(emails.length>DAILY_LIMIT-today)return reply(res,429,{ok:false,error:'Batch exceeds the remaining workspace daily limit',sentToday:today,remainingToday:DAILY_LIMIT-today});

    const rawResults=await mapWithConcurrency(emails,CONCURRENCY,async email=>{
      const result=await sendWithProvider(provider,sender,replyTo,optOut,email);
      const row={leadId:clean(email?.leadId,200),to:clean(email?.to,320),provider,ok:!!result.ok,...(result.messageId?{messageId:result.messageId}:{}),...(!result.ok?{error:clean(result.error||'Unknown error',1000)}:{})};
      if(persistent)await logActivity({workspaceId,userId:user.id,eventType:row.ok?'email_sent':'email_failed',entityType:'lead',entityId:row.leadId||null,metadata:{recipient:row.to,provider,campaign:clean(body.campaign?.name,240),campaignId:clean(body.campaign?.id,240),sequenceStep:clean(body.sequenceStep,80),messageId:row.messageId||null,error:row.error||null,subject:clean(email?.subject,250)}}).catch(()=>{});
      return row;
    });
    const sent=rawResults.filter(r=>r.ok).length,failed=rawResults.length-sent;
    const sentNow=persistent?await sentTodayForWorkspace(workspaceId):sent;
    return reply(res,200,{ok:true,provider,authMode:mode,workspace:{id:workspaceId,name:workspace.name},sent,failed,attempted:emails.length,results:rawResults,databaseConfigured:persistent,persistence:persistent?'supabase':'legacy-local',sentToday:sentNow,remainingToday:Math.max(0,DAILY_LIMIT-sentNow)});
  }catch(error){console.error('Margin Leads v2.9 API error',error);return reply(res,500,{ok:false,error:clean(error?.message||'Internal server error',1200)});}
};
