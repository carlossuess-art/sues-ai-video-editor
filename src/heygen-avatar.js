/** HeyGen V3 adapter. No calls are made unless a key is configured. */
const BASE='https://api.heygen.com';
const ID=/^[a-zA-Z0-9_-]{1,128}$/;
export class HeyGenError extends Error {
 constructor(status){super(status===401||status===403?'HeyGen credentials or entitlement rejected':status===429?'HeyGen rate limit':'HeyGen request failed');this.status=status;}
}
export function createHeyGen({apiKey=process.env.HEYGEN_API_KEY,fetcher=fetch,allowCharge=process.env.HEYGEN_ALLOW_PAID_GENERATION==='true'}={}){
 const required=()=>{if(!apiKey)throw new Error('HeyGen API key not configured');};
 async function request(method,path,payload){
  required();
  const response=await fetcher(BASE+path,{method,headers:{'x-api-key':apiKey,'Accept':'application/json',...(payload?{'Content-Type':'application/json'}:{})},...(payload?{body:JSON.stringify(payload)}:{}) ,signal:AbortSignal.timeout(30000),redirect:'error'});
  if(!response.ok)throw new HeyGenError(response.status);
  return response.json();
 }
 return {
  configured:()=>Boolean(apiKey),
  canGenerate:()=>Boolean(apiKey&&allowCharge),
  async listAvatars(){return request('GET','/v3/avatars');},
  async listLooks(){return request('GET','/v3/avatars/looks?avatar_type=digital_twin&ownership=private');},
  async getVideo(id){if(!ID.test(id))throw new Error('Invalid video ID');return request('GET','/v3/videos/'+encodeURIComponent(id));},
  async createVideo({avatarId,script,voiceId,audioUrl,approved=false}){
   if(!allowCharge||!approved)throw new Error('Paid generation requires explicit approval');
   if(!ID.test(avatarId||''))throw new Error('Invalid avatar ID');
   const hasText=typeof script==='string'&&script.trim().length>0;
   const hasAudio=typeof audioUrl==='string'&&audioUrl.trim().length>0;
   if(hasText===hasAudio)throw new Error('Provide either script or audio URL');
   if(hasText&&(script.length>4000||(voiceId&&!ID.test(voiceId))))throw new Error('Invalid script or voice ID');
   if(hasAudio){const u=new URL(audioUrl);if(u.protocol!=='https:'||u.username||u.password)throw new Error('HTTPS audio URL required');}
   const input=hasText?{script:script.trim(),...(voiceId?{voice_id:voiceId}:{})}:{audio_url:audioUrl};
   return request('POST','/v3/videos',{type:'avatar',avatar_id:avatarId,engine:{type:'avatar_iii'},aspect_ratio:'9:16',resolution:'1080p',output_format:'mp4',...input});
  }
 };
}
