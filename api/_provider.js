const crypto=require('crypto');
const {serviceFetch,jsonOrError}=require('./_auth');

function encryptionKey(){
  const raw=String(process.env.PROVIDER_ENCRYPTION_KEY||'');
  if(raw.length<32)throw new Error('PROVIDER_ENCRYPTION_KEY must be at least 32 characters');
  return crypto.createHash('sha256').update(raw).digest();
}
function encryptSecret(value){
  const iv=crypto.randomBytes(12);
  const cipher=crypto.createCipheriv('aes-256-gcm',encryptionKey(),iv);
  const encrypted=Buffer.concat([cipher.update(String(value),'utf8'),cipher.final()]);
  const tag=cipher.getAuthTag();
  return Buffer.concat([iv,tag,encrypted]).toString('base64');
}
function decryptSecret(payload){
  const buf=Buffer.from(String(payload||''),'base64');
  if(buf.length<29)throw new Error('Stored provider secret is invalid');
  const iv=buf.subarray(0,12),tag=buf.subarray(12,28),data=buf.subarray(28);
  const decipher=crypto.createDecipheriv('aes-256-gcm',encryptionKey(),iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data),decipher.final()]).toString('utf8');
}
async function getWorkspaceProvider(workspaceId,provider){
  const r=await serviceFetch(`workspace_mail_providers?workspace_id=eq.${encodeURIComponent(workspaceId)}&provider=eq.${encodeURIComponent(provider)}&enabled=eq.true&select=provider,secret_cipher,settings,updated_at&limit=1`);
  const d=await jsonOrError(r);
  const row=Array.isArray(d)?d[0]:null;
  if(!row)return null;
  return {provider:row.provider,apiKey:decryptSecret(row.secret_cipher),settings:row.settings||{},updatedAt:row.updated_at};
}
async function saveWorkspaceProvider(workspaceId,provider,apiKey,settings={}){
  const body={workspace_id:workspaceId,provider,secret_cipher:encryptSecret(apiKey),settings,enabled:true,updated_at:new Date().toISOString()};
  const r=await serviceFetch('workspace_mail_providers?on_conflict=workspace_id,provider',{
    method:'POST',
    headers:{Prefer:'resolution=merge-duplicates,return=representation'},
    body:JSON.stringify(body)
  });
  return jsonOrError(r);
}
async function deleteWorkspaceProvider(workspaceId,provider){
  const r=await serviceFetch(`workspace_mail_providers?workspace_id=eq.${encodeURIComponent(workspaceId)}&provider=eq.${encodeURIComponent(provider)}`,{method:'DELETE',headers:{Prefer:'return=minimal'}});
  if(!r.ok)await jsonOrError(r);
}
module.exports={getWorkspaceProvider,saveWorkspaceProvider,deleteWorkspaceProvider};
