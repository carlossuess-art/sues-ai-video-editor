// Google OpenID Connect, authorization code flow. No provider tokens are persisted.
import {randomBytes,createHash,createPublicKey,verify,timingSafeEqual} from 'node:crypto';
import {readFileSync,lstatSync} from 'node:fs';
import {ADMIN_EMAIL} from './editor-password-auth.js';
export const GOOGLE_CALLBACK='/api/auth/google/callback';
const AUTH='https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN='https://oauth2.googleapis.com/token';
const KEYS='https://www.googleapis.com/oauth2/v3/certs';
const same=(a,b)=>typeof a==='string'&&typeof b==='string'&&Buffer.byteLength(a)===Buffer.byteLength(b)&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
export function readGoogleConfig(file){
 let info;try{info=lstatSync(file);}catch(e){if(e.code==='ENOENT')return null;throw e;}
 if(!info.isFile()||(info.mode&0o077)||info.size>16384)throw Error('Google OAuth configuration must be a private regular file');
 let config;try{config=JSON.parse(readFileSync(file,'utf8'));}catch{throw Error('Invalid Google OAuth configuration');}
 if(!config||!/^[-a-zA-Z0-9.]{10,256}\.apps\.googleusercontent\.com$/.test(config.clientId)||typeof config.clientSecret!=='string'||config.clientSecret.length<10||config.clientSecret.length>1024)throw Error('Invalid Google OAuth configuration');
 return {clientId:config.clientId,clientSecret:config.clientSecret};
}
export function googleAuth({config,publicOrigin,fetcher=fetch,now=Date.now}){
 if(!config)return null;
 if(!publicOrigin||new URL(publicOrigin).protocol!=='https:'||new URL(publicOrigin).origin!==publicOrigin)throw Error('Google OAuth requires canonical HTTPS origin');
 const redirectUri=publicOrigin+GOOGLE_CALLBACK,pending=new Map();let keys=[],keysUntil=0,keyRequest,busy=0;
 const prune=()=>{for(const [state,p] of pending)if(p.expires<=now())pending.delete(state);};
 async function json(url,options={}){
  const response=await fetcher(url,{...options,redirect:'error',signal:AbortSignal.timeout(8000)});
  if(!response.ok)throw Error('Google request rejected');
  const chunks=[];let size=0;for await(const chunk of response.body){size+=chunk.length;if(size>65536)throw Error('Google response too large');chunks.push(chunk);}
  return JSON.parse(Buffer.concat(chunks).toString());
 }
 async function publicKeys(){
  if(now()<keysUntil)return keys;
  if(!keyRequest)keyRequest=json(KEYS).then(data=>{if(!Array.isArray(data.keys)||data.keys.length>20)throw Error('Invalid Google keys');keys=data.keys;keysUntil=now()+300000;return keys;}).finally(()=>{keyRequest=null;});
  return keyRequest;
 }
 async function identity(jwt,nonce){
  if(typeof jwt!=='string'||jwt.length>16384)throw Error('Invalid identity');
  const parts=jwt.split('.');if(parts.length!==3||parts.some(p=>!p||!/^[A-Za-z0-9_-]+$/.test(p)))throw Error('Invalid identity');
  const header=JSON.parse(Buffer.from(parts[0],'base64url')),claims=JSON.parse(Buffer.from(parts[1],'base64url'));
  if(header.alg!=='RS256'||typeof header.kid!=='string'||header.kid.length>256||header.crit)throw Error('Invalid identity algorithm');
  const key=(await publicKeys()).find(k=>k.kid===header.kid&&k.kty==='RSA'&&(!k.use||k.use==='sig')&&(!k.alg||k.alg==='RS256'));
  if(!key)throw Error('Unknown identity key');
  const publicKey=createPublicKey({key,format:'jwk'});
  if(publicKey.asymmetricKeyDetails.modulusLength<2048||!verify('RSA-SHA256',Buffer.from(parts[0]+'.'+parts[1]),publicKey,Buffer.from(parts[2],'base64url')))throw Error('Invalid identity signature');
  const aud=Array.isArray(claims.aud)?claims.aud:[claims.aud],time=Math.floor(now()/1000);
  if(!['https://accounts.google.com','accounts.google.com'].includes(claims.iss)||!aud.includes(config.clientId)||(aud.length>1&&!claims.azp)||(claims.azp&&claims.azp!==config.clientId)||!Number.isSafeInteger(claims.exp)||claims.exp<=time||!Number.isSafeInteger(claims.iat)||claims.iat>time+60||claims.iat<time-3600||claims.exp<=claims.iat||!same(claims.nonce,nonce)||claims.email!==ADMIN_EMAIL||claims.email_verified!==true||typeof claims.sub!=='string'||!claims.sub||claims.sub.length>255)throw Error('Identity not permitted');
 }
 const transient=(value,age)=>`sues_google=${value}; HttpOnly; Secure; SameSite=Lax; Path=/api/auth/google; Max-Age=${age}`;
 return {
  begin(){
   prune();if(pending.size>=128)throw Error('Too many pending logins');
   const state=randomBytes(32).toString('hex'),binding=randomBytes(32).toString('hex'),nonce=randomBytes(32).toString('hex'),verifier=randomBytes(32).toString('base64url');
   pending.set(state,{binding,nonce,verifier,expires:now()+600000});
   const params=new URLSearchParams({client_id:config.clientId,redirect_uri:redirectUri,response_type:'code',scope:'openid email',state,nonce,code_challenge:createHash('sha256').update(verifier).digest('base64url'),code_challenge_method:'S256',login_hint:ADMIN_EMAIL,prompt:'select_account'});
   return {url:AUTH+'?'+params,cookie:transient(binding,600)};
  },
  clearCookie:()=>transient('',0),
  async complete(params,cookies){
   prune();const state=params.get('state'),p=pending.get(state),binding=/(?:^|;\s*)sues_google=([^;]+)/.exec(cookies??'')?.[1];
   if(!p||!same(binding,p.binding)||params.getAll('state').length!==1)throw Error('Invalid OAuth state');
   pending.delete(state); // Single use even when Google denies or the exchange fails.
   if(params.has('error')||params.getAll('code').length!==1||!params.get('code')||params.get('code').length>4096||busy>=2)throw Error('Google login rejected');
   busy++;
   try{
    const data=await json(TOKEN,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({code:params.get('code'),client_id:config.clientId,client_secret:config.clientSecret,redirect_uri:redirectUri,grant_type:'authorization_code',code_verifier:p.verifier})});
    await identity(data.id_token,p.nonce);
   }finally{busy--;}
  }
 };
}
