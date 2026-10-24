import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {fixture} from './helpers/editor-fixture.js';
import {createEditorServer} from '../src/editor-server.js';
import {createPasswordRecord} from '../src/editor-password-auth.js';
test('password session survives fresh requests and a server restart with the same private key',async()=>{
 const f=fixture(),directory=join(f.dir,'jobs'),passwordFile=join(f.dir,'password'),token='a'.repeat(64);
 writeFileSync(passwordFile,createPasswordRecord('Only-Synthetic-Test-2026'));
 let app=createEditorServer({directory,profiles:f.profiles,token,passwordFile});
 try{
  let base=(await app.listen()).split('/#')[0];
  const login=await fetch(base+'/api/login',{method:'POST',headers:{'Content-Type':'application/json','X-Sues-Request':'editor'},body:JSON.stringify({email:'carlossuess@gmail.com',password:'Only-Synthetic-Test-2026'})});
  assert.equal(login.status,200);const setCookie=login.headers.get('set-cookie'),cookie=setCookie.split(';')[0];
  assert.match(setCookie,/HttpOnly/);assert.match(setCookie,/Max-Age=2592000/);assert.match(setCookie,/Expires=/);
  for(let i=0;i<3;i++)assert.equal((await fetch(base+'/api/health',{headers:{Cookie:cookie}})).status,200);
  await app.close();app=createEditorServer({directory,profiles:f.profiles,token,passwordFile});base=(await app.listen()).split('/#')[0];
  assert.equal((await fetch(base+'/api/health',{headers:{Cookie:cookie}})).status,200);
  assert.equal((await fetch(base+'/api/health')).status,401);
 }finally{await app.close();rmSync(f.dir,{recursive:true,force:true});}
});
test('startup hides credential form until authentication is actually checked',()=>{
 const html=readFileSync(new URL('../web/index.html',import.meta.url),'utf8'),js=readFileSync(new URL('../web/app.js',import.meta.url),'utf8');
 assert.match(html,/id="login-screen" hidden/);assert.match(html,/id="auth-loading"/);
 const start=js.indexOf('async function init()'),end=js.indexOf('async function loadDesign',start),init=js.slice(start,end);
 assert.ok(init.indexOf("await api('health')")<init.indexOf('await refreshProfiles()'));
 assert.ok(init.indexOf('authenticated(true)')<init.indexOf('await refreshProfiles()'));
 assert.match(init,/if\(e.status===401\)/);assert.match(init,/if\(!sessionConfirmed\)/);
});
