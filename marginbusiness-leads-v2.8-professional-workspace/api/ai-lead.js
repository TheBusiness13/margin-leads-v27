async function verifyUser(req){
  const token=String(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
  const url=process.env.SUPABASE_URL||'',key=process.env.SUPABASE_ANON_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'';
  if(!url||!key)throw new Error('Supabase authentication is not configured');
  if(!token)throw new Error('Authentication required');
  const r=await fetch(`${url}/auth/v1/user`,{headers:{apikey:key,Authorization:`Bearer ${token}`}});if(!r.ok)throw new Error('Invalid or expired session');return r.json();
}
function extractText(data){return data.output_text||data.output?.flatMap(x=>x.content||[]).find(x=>x.type==='output_text')?.text||''}
module.exports=async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'POST only'});
  try{await verifyUser(req);if(!process.env.OPENAI_API_KEY)return res.status(503).json({error:'OPENAI_API_KEY is not configured in Vercel'});
    const body=typeof req.body==='string'?JSON.parse(req.body):req.body||{};const lead=body.lead||{},campaign=body.campaign||{};
    const prompt=`You are the commercial intelligence engine for Margin Leads, a premium B2B outreach platform. Analyze the lead using only supplied evidence. Never invent facts. Separate observation from hypothesis. Return strict JSON with keys: opportunity_score (0-100), evidence_confidence (Low|Medium|High), decision_motivation, likely_objection, recommended_angle, reply_goal, email_opening, cta. Keep each text field concise and executive. Lead: ${JSON.stringify(lead)} Campaign: ${JSON.stringify(campaign)}`;
    const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-4.1-mini',input:prompt,text:{format:{type:'json_schema',name:'lead_analysis',strict:true,schema:{type:'object',additionalProperties:false,properties:{opportunity_score:{type:'integer'},evidence_confidence:{type:'string'},decision_motivation:{type:'string'},likely_objection:{type:'string'},recommended_angle:{type:'string'},reply_goal:{type:'string'},email_opening:{type:'string'},cta:{type:'string'}},required:['opportunity_score','evidence_confidence','decision_motivation','likely_objection','recommended_angle','reply_goal','email_opening','cta']}}}})});
    const data=await r.json();if(!r.ok)throw new Error(data.error?.message||'OpenAI request failed');const text=extractText(data);return res.status(200).json({ok:true,analysis:JSON.parse(text)});
  }catch(e){return res.status(401).json({ok:false,error:e.message||'AI analysis failed'})}
}
