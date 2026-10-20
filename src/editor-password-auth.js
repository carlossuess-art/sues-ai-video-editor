import {randomBytes,scryptSync,scrypt,createHmac,createHash,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
const derive=promisify(scrypt);
export const ADMIN_EMAIL='carlossuess@gmail.com';
export const SESSION_SECONDS=30*24*60*60;
const pattern=/^scrypt-v1\$([0-9a-f]{32})\$([0-9a-f]{128})$/;
export const validPasswordRecord=record=>typeof record==='string'&&pattern.test(record);
export function createPasswordRecord(password,{salt=randomBytes(16).toString('hex')}={}){
 if(typeof password!=='string'||password.length<12||Buffer.byteLength(password)>1024)throw new Error('Contraseña no válida: mínimo 12 caracteres');
 if(!/^[0-9a-f]{32}$/.test(salt))throw new Error('Salt inválido');
 return 'scrypt-v1$'+salt+'$'+scryptSync(password,Buffer.from(salt,'hex'),64,{N:16384,r:8,p:1}).toString('hex');
}
export function verifyPassword(password,record){
 if(typeof password!=='string'||Buffer.byteLength(password)>1024||!validPasswordRecord(record))return false;
 const [,salt,hash]=pattern.exec(record);
 return timingSafeEqual(scryptSync(password,Buffer.from(salt,'hex'),64,{N:16384,r:8,p:1}),Buffer.from(hash,'hex'));
}
export async function verifyPasswordAsync(password,record){
 if(typeof password!=='string'||Buffer.byteLength(password)>1024||!validPasswordRecord(record))return false;
 const [,salt,hash]=pattern.exec(record);
 return timingSafeEqual(await derive(password,Buffer.from(salt,'hex'),64,{N:16384,r:8,p:1}),Buffer.from(hash,'hex'));
}
export function createLoginLimiter({now=Date.now}={}){
 const attempts=new Map(),window=15*60*1000;
 const prune=()=>{for(const [key,item] of attempts)if(now()-item.start>=window)attempts.delete(key);};
 return {
  allowed(key){prune();return (attempts.get(key)?.failures??0)<5;},
  fail(key){prune();if(!attempts.has(key)&&attempts.size>=1024)attempts.delete(attempts.keys().next().value);const x=attempts.get(key);if(x)x.failures++;else attempts.set(key,{start:now(),failures:1});},
  clear(key){attempts.delete(key);},
 };
}
export function authorizedEmail(value){return typeof value==='string'&&value.trim().toLowerCase()===ADMIN_EMAIL;}
export function passwordSessions(token,record,{now=Date.now}={}){
 const key=createHash('sha256').update(token+'\0'+record).digest();
 const sign=payload=>createHmac('sha256',key).update(payload).digest('hex');
 return {
  issue(){const payload='s1.'+(Math.floor(now()/1000)+SESSION_SECONDS)+'.'+randomBytes(16).toString('hex');return payload+'.'+sign(payload);},
  valid(value){if(!record||typeof value!=='string'||!/^s1\.[0-9]{10}\.[0-9a-f]{32}\.[0-9a-f]{64}$/.test(value))return false;const parts=value.split('.'),expires=Number(parts[1]),time=Math.floor(now()/1000);if(expires<=time||expires>time+SESSION_SECONDS)return false;return timingSafeEqual(Buffer.from(parts[3],'hex'),Buffer.from(sign(parts.slice(0,3).join('.')),'hex'));}
 };
}
