const {getUser,ensureWorkspace,logActivity}=require('./_auth');

function clean(value,max=2000){return String(value??'').replace(/\0/g,'').trim().slice(0,max)}
function extractText(data){
  if(typeof data?.output_text==='string'&&data.output_text.trim())return data.output_text;
  for(const item of data?.output||[]){for(const part of item?.content||[]){if(part?.type==='output_text'&&part.text)return part.text;}}
  return '';
}
function safeLead(input={}){
  const allowed=['company','contact','contactName','role','email','website','category','product','revenueRaw','status','linkedin','notes','fitScore'];
  const result={};for(const key of allowed){if(input[key]!==undefined&&input[key]!==null)result[key]=clean(input[key],1200)}return result;
}
module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST')return res.status(405).json({ok:false,error:'POST only'});
  try{
    const user=await getUser(req);if(!user)return res.status(401).json({ok:false,error:'Sign in again before using AI.'});
    const membership=await ensureWorkspace(user);const workspace=membership.workspace||{};
    const apiKey=process.env.OPENAI_API_KEY||'';if(!apiKey)return res.status(503).json({ok:false,code:'OPENAI_NOT_CONFIGURED',error:'OpenAI is not connected yet. Add OPENAI_API_KEY in Vercel and redeploy.'});
    const body=typeof req.body==='string'?JSON.parse(req.body):req.body||{};
    const lead=safeLead(body.lead||{});const campaign=body.campaign||{};
    if(!lead.company&&!lead.website&&!lead.email)return res.status(400).json({ok:false,error:'Select a lead with at least a company, website, or email.'});
    const schema={type:'object',additionalProperties:false,properties:{
      opportunity_score:{type:'integer',minimum:0,maximum:100},
      evidence_confidence:{type:'string',enum:['Low','Medium','High']},
      commercial_observation:{type:'string'},decision_motivation:{type:'string'},likely_objection:{type:'string'},
      recommended_angle:{type:'string'},reply_goal:{type:'string'},email_opening:{type:'string'},cta:{type:'string'},
      subject_lines:{type:'array',minItems:3,maxItems:3,items:{type:'string'}},
      sequence_guidance:{type:'array',minItems:4,maxItems:4,items:{type:'object',additionalProperties:false,properties:{step:{type:'integer'},purpose:{type:'string'},angle:{type:'string'}},required:['step','purpose','angle']}}
    },required:['opportunity_score','evidence_confidence','commercial_observation','decision_motivation','likely_objection','recommended_angle','reply_goal','email_opening','cta','subject_lines','sequence_guidance']};
    const system=`You are Margin AI, the commercial intelligence engine inside MarginBusiness Leads. You help senior B2B operators approach Amazon and ecommerce companies. Use only evidence supplied by the user. Never invent company facts, revenue, marketplace presence, performance, pain points, or personal information. Clearly distinguish an observation from a hypothesis. Keep language calm, senior, specific, and commercially useful. Avoid flattery, hype, generic compliments, fear tactics, and fake personalization. The opening must be usable in a real email but must not claim facts not supplied.`;
    const input=[{role:'system',content:[{type:'input_text',text:system}]},{role:'user',content:[{type:'input_text',text:`Analyze this lead for the campaign and return the required structured intelligence.\nLead evidence: ${JSON.stringify(lead)}\nCampaign context: ${JSON.stringify({name:clean(campaign.name,200),template:clean(campaign.template,100),market:clean(campaign.market,100),offer:clean(campaign.offer,500)})}`}]}];
    const requestBody={model:process.env.OPENAI_MODEL||'gpt-5-mini',input,store:false,text:{verbosity:'low',format:{type:'json_schema',name:'margin_lead_analysis',strict:true,schema}}};
    const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify(requestBody)});
    const data=await response.json();if(!response.ok)throw new Error(data?.error?.message||`OpenAI HTTP ${response.status}`);
    const text=extractText(data);if(!text)throw new Error('OpenAI returned no structured analysis');
    const analysis=JSON.parse(text);
    await logActivity({workspaceId:workspace.id,userId:user.id,eventType:'ai_analysis_completed',entityType:'lead',entityId:clean(body.lead?.id,200)||null,metadata:{model:data.model||requestBody.model,company:lead.company||null,usage:data.usage||null}}).catch(()=>{});
    return res.status(200).json({ok:true,analysis,model:data.model||requestBody.model,workspace:{id:workspace.id,name:workspace.name},usage:data.usage||null});
  }catch(error){console.error('Margin AI error',error);return res.status(500).json({ok:false,error:clean(error?.message||'AI analysis failed',800)});}
};
