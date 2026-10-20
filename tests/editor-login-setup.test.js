import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,existsSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {loginSetup} from '../src/editor-login-setup.js';
import {verifyPassword,passwordSessions} from '../src/editor-password-auth.js';
test('setup is expiring, single use, atomically persisted, and reset revokes previous sessions',()=>{
 const dir=mkdtempSync(join(tmpdir(),'sues-setup-')),file=join(dir,'admin-password-hash'),setupFile=join(dir,'admin-setup.json'),token='e'.repeat(64),pass='Synthetic-Setup-Password-2026';let clock=1792475400000;
 const record=()=>({version:1,tokenSha256:createHash('sha256').update(token).digest('hex'),expiresAt:clock/1000+1800});const setup=loginSetup(file,{now:()=>clock});
 try{
  assert.equal(setup.available(),false);writeFileSync(setupFile,JSON.stringify(record()));assert.equal(setup.available(),true);
  assert.throws(()=>setup.apply('f'.repeat(64),pass),/incorrecto/);assert.throws(()=>setup.apply(token,'short'),/mínimo/);assert.equal(existsSync(file),false);assert.equal(setup.available(),true);
  const hash=setup.apply(token,pass);assert.equal(verifyPassword(pass,readFileSync(file,'utf8').trim()),true);assert.ok(!readFileSync(file,'utf8').includes(pass));assert.equal(setup.available(),false);assert.throws(()=>setup.apply(token,pass),/incorrecto/);
  const old=passwordSessions('a'.repeat(64),hash,{now:()=>clock}).issue();writeFileSync(setupFile,JSON.stringify(record()));const fresh=setup.apply(token,'Replacement-Setup-Password-2026');assert.equal(passwordSessions('a'.repeat(64),fresh,{now:()=>clock}).valid(old),false);
  writeFileSync(setupFile,JSON.stringify(record()));clock+=1801*1000;assert.equal(setup.available(),false);assert.throws(()=>setup.apply(token,pass),/caducado/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
