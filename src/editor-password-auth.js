import {randomBytes,scryptSync,timingSafeEqual} from 'node:crypto';

const EMAIL='carlossuess@gmail.com';
const MAX_ATTEMPTS=5;
const WINDOW_MS=15*60*1000;
export const ADMIN_EMAIL=EMAIL;

export function createPasswordRecord(password,{salt=randomBytes(16).toString('hex')}={}){
 if(typeof password!=='string'||password.length<12||Buffer.byteLength(password)>1024)throw new Error('Contraseña no válida: mínimo 12 caracteres');
 if(!/^[0-9a-f]{32}$/.test(salt))throw new Error('Salt inválido');
 const derived=scryptSync(password,Buffer.from(salt,'hex'),64,{N:16384,r:8,p:1}).toString('hex');
 return 'scrypt-v1$'+salt+'$'+derived;
}
export function verifyPassword(password,record){
 if(typeof password!=='string'||Buffer.byteLength(password)>1024||typeof record!=='string')return false;
 const m=/^scrypt-v1\$([0-9a-f]{32})\$([0-9a-f]{128})$/.exec(record);
 if(!m)return false;
 const actual=scryptSync(password,Buffer.from(m[1],'hex'),64,{N:16384,r:8,p:1});
 return timingSafeEqual(actual,Buffer.from(m[2],'hex'));
}
export function createLoginLimiter({now=Date.now}={}){
 const attempts=new Map();
 return {
  allowed(key){const x=attempts.get(key);if(!x)return true;if(now()-x.start>=WINDOW_MS){attempts.delete(key);return true;}return x.failures<MAX_ATTEMPTS;},
  fail(key){const x=attempts.get(key),time=now();if(!x||time-x.start>=WINDOW_MS)attempts.set(key,{start:time,failures:1});else x.failures++;},
  clear(key){attempts.delete(key);},
 };
}
export function authorizedEmail(value){return typeof value==='string'&&value.trim().toLowerCase()===EMAIL;}
