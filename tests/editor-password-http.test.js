import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import http from 'node:http';
import {fixture} from './helpers/editor-fixture.js';
import {createEditorServer} from '../src/editor-server.js';
import {createPasswordRecord,passwordSessions,SESSION_SECONDS} from '../src/editor-password-auth.js';
const pass='Synthetic-Private-QA-2026';
const record=createPasswordRecord(pass);
const headers={'Content-Type':'application/json','X-Sues-Request':'editor'};
function setup(){const f=fixture(),directory=join(f.dir,'jobs'),passwordFile=join(f.dir,'access/admin-password-hash');mkdirSync(join(f.dir,'access'));writeFileSync(passwordFile,record,{mode:0o600});return {...f,directory,passwordFile};}
const login=(url,password=pass,email='carlossuess@gmail.com',extra={})=>fetch(url+'/api/login',{method:'POST',headers:{...headers,...extra},body:JSON.stringify({email,password})});
test('password session persists after restart, protects projects, logs out, and emergency link survives',async()=>{
 const f=setup(),token='c'.repeat(64),options={directory:f.directory,profiles:f.profiles,passwordFile:f.passwordFile,token};let app=createEditorServer(options);
 try{
  let url=(await app.listen()).split('/#')[0];assert.equal((await fetch(url+'/api/jobs')).status,401);
  assert.equal((await login(url,'incorrect-password')).status,401);
  assert.equal((await login(url,pass,'other@example.com')).status,401);
  const response=await login(url);assert.equal(response.status,200);const cookie=response.headers.get('set-cookie');assert.match(cookie,/HttpOnly/);assert.match(cookie,/SameSite=Strict/);assert.match(cookie,new RegExp('Max-Age='+SESSION_SECONDS));assert.ok(!cookie.includes(token));
  const auth={...headers,Cookie:cookie.split(';')[0]};
  const created=await fetch(url+'/api/jobs',{method:'POST',headers:auth,body:JSON.stringify({profileId:'test'})});assert.equal(created.status,201);const job=await created.json();const source=readFileSync(join(f.dir,'source.mp4'));const project=readFileSync(f.profiles.test);
  await app.close();app=createEditorServer(options);url=(await app.listen()).split('/#')[0];
  const jobs=await (await fetch(url+'/api/jobs',{headers:auth})).json();assert.equal(jobs[0].id,job.id);assert.deepEqual(readFileSync(join(f.dir,'source.mp4')),source);assert.deepEqual(readFileSync(f.profiles.test),project);
  const logout=await fetch(url+'/api/logout',{method:'POST',headers:auth,body:'{}'});assert.equal(logout.status,200);assert.match(logout.headers.get('set-cookie'),/Max-Age=0/);
  const emergency=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+token}});assert.equal(emergency.status,200);
  await app.close();writeFileSync(f.passwordFile,createPasswordRecord('Another-QA-Password-2026'));app=createEditorServer(options);url=(await app.listen()).split('/#')[0];
  assert.equal((await fetch(url+'/api/jobs',{headers:auth})).status,401);assert.equal((await login(url)).status,401);assert.equal((await login(url,'Another-QA-Password-2026')).status,200);
  assert.equal((await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+token}})).status,200);
 }finally{if(app.server.listening)await app.close();rmSync(f.dir,{recursive:true,force:true});}
});
test('HTTP rejects CSRF, malformed/oversize input, unknown mail and excessive attempts without accepting forged IP',async()=>{
 const f=setup(),app=createEditorServer({directory:f.directory,profiles:f.profiles,passwordFile:f.passwordFile});
 try{
  const url=(await app.listen()).split('/#')[0];
  assert.equal((await login(url,pass,undefined,{Origin:'https://evil.example'})).status,403);
  assert.equal((await fetch(url+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status,403);
  for(const body of ['null','[]','{','x'.repeat(5000)])assert.equal((await fetch(url+'/api/login',{method:'POST',headers,body})).status,400);
  for(let i=0;i<5;i++)assert.equal((await login(url,'incorrect-password',undefined,{'X-Forwarded-For':'1.2.3.'+i})).status,401);
  assert.equal((await login(url)).status,429);
 }finally{await app.close();rmSync(f.dir,{recursive:true,force:true});}
});
test('unconfigured login fails closed and bad hash does not acquire jobs lock',async()=>{
 const f=fixture(),directory=join(f.dir,'jobs'),passwordFile=join(f.dir,'hash');writeFileSync(passwordFile,'invalid');
 try{assert.throws(()=>createEditorServer({directory,profiles:f.profiles,passwordFile}),/hash file/);const app=createEditorServer({directory,profiles:f.profiles});try{const url=(await app.listen()).split('/#')[0];assert.equal((await login(url)).status,503);}finally{await app.close();}}finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('signed sessions reject expiry, tampering and password reset',()=>{
 let clock=1792475400000;const sessions=passwordSessions('a'.repeat(64),record,{now:()=>clock}),cookie=sessions.issue();assert.equal(sessions.valid(cookie),true);assert.equal(sessions.valid(cookie.slice(0,-1)+'z'),false);assert.equal(passwordSessions('b'.repeat(64),record).valid(cookie),false);clock+=SESSION_SECONDS*1000;assert.equal(sessions.valid(cookie),false);
});
test('public HTTPS login cookie is Secure without trusting forwarded protocol',async()=>{
 const f=setup(),app=createEditorServer({directory:f.directory,profiles:f.profiles,passwordFile:f.passwordFile,publicOrigin:'https://editor.example.com'});
 try{await app.listen();const result=await new Promise((resolve,reject)=>{const req=http.request({hostname:'127.0.0.1',port:app.server.address().port,path:'/api/login',method:'POST',headers:{...headers,Host:'editor.example.com',Origin:'https://editor.example.com','X-Forwarded-Proto':'http'}},res=>{res.resume();res.on('end',()=>resolve({status:res.statusCode,cookie:res.headers['set-cookie'][0]}));});req.on('error',reject);req.end(JSON.stringify({email:'carlossuess@gmail.com',password:pass}));});assert.equal(result.status,200);assert.match(result.cookie,/; Secure/);assert.match(result.cookie,/Max-Age=2592000/);
 }finally{await app.close();rmSync(f.dir,{recursive:true,force:true});}
});
