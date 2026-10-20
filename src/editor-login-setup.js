import {readFileSync,writeFileSync,renameSync,lstatSync,existsSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {createHash,timingSafeEqual,randomBytes} from 'node:crypto';
import {createPasswordRecord} from './editor-password-auth.js';
export function loginSetup(passwordFile,{now=Date.now}={}){
 const file=join(dirname(passwordFile),'admin-setup.json');
 const read=()=>{try{if(lstatSync(file).isSymbolicLink())return null;const x=JSON.parse(readFileSync(file,'utf8'));return x.version===1&&/^[a-f0-9]{64}$/.test(x.tokenSha256)&&Number.isSafeInteger(x.expiresAt)&&x.expiresAt>now()/1000?x:null;}catch{return null;}};
 return {
  available:()=>!!read(),
  apply(token,password){
   const x=read();if(!x||typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token)||!timingSafeEqual(createHash('sha256').update(token).digest(),Buffer.from(x.tokenSha256,'hex')))throw new Error('Enlace de configuración incorrecto, caducado o utilizado. Genera otro desde el servidor.');
   const record=createPasswordRecord(password),suffix=randomBytes(8).toString('hex'),temporary=passwordFile+'.pending-'+suffix,used=file+'.used-'+suffix;
   if(existsSync(passwordFile)&&lstatSync(passwordFile).isSymbolicLink())throw new Error('Configuración de acceso no disponible');
   writeFileSync(temporary,record+'\n',{mode:0o600,flag:'wx'});
   // Consume first, restore if atomic publication fails. Never keep a reusable link after success.
   renameSync(file,used);
   try{renameSync(temporary,passwordFile);}catch(error){renameSync(used,file);throw error;}
   return record;
  }
 };
}
