import http from 'node:http';
import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync,readFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {fixture} from './helpers/editor-fixture.js';
import {googleFixture,googleConfig} from './helpers/google-fixture.js';
import {createEditorServer} from '../src/editor-server.js';
import {createPasswordRecord,passwordSessions} from '../src/editor-password-auth.js';
test('real HTTP Google callback issues persistent session; password and emergency login preserved',async()=>{
 const f=fixture(),g=googleFixture(),passwordFile=join(f.dir,'admin-password-hash'),record=createPasswordRecord('Synthetic-Passphrase-123'),googleOAuthFile=join(f.dir,'google-oauth.json'),token='a'.repeat(64);
 writeFileSync(passwordFile,record,{mode:0o600});writeFileSync(googleOAuthFile,JSON.stringify(googleConfig),{mode:0o600});
 const app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles,passwordFile,googleOAuthFile,googleOAuthFetch:g.fetcher,token,publicOrigin:'https://editor.suesholistics.com'});
 try{
  await app.listen();const base='http://127.0.0.1:'+app.server.address().port;
  const request=(path,options={})=>new Promise((resolve,reject)=>{const req=http.request(base+path,{method:options.method??'GET',headers:{Host:'editor.suesholistics.com',...options.headers}},res=>{const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>{const headers=new Headers();for(let i=0;i<res.rawHeaders.length;i+=2)headers.append(res.rawHeaders[i],res.rawHeaders[i+1]);resolve({status:res.statusCode,headers,json:async()=>JSON.parse(Buffer.concat(chunks).toString())});});});req.on('error',reject);req.end(options.body);});
  assert.deepEqual(await (await request('/api/auth/options')).json(),{google:true});
  assert.equal((await request('/api/auth/google/start',{method:'POST'})).status,403);
  assert.equal((await request('/api/auth/google/start',{method:'POST',headers:{'X-Sues-Request':'editor',Origin:'https://evil.example'}})).status,403);
  const start=await request('/api/auth/google/start',{method:'POST',headers:{'X-Sues-Request':'editor'}}),target=new URL((await start.json()).url);g.setNonce(target.searchParams.get('nonce'));
  const callback='/api/auth/google/callback?'+new URLSearchParams({state:target.searchParams.get('state'),code:'code'});
  const reply=await request(callback,{headers:{Cookie:start.headers.get('set-cookie').split(';')[0]}});assert.equal(reply.status,303);assert.equal(reply.headers.get('location'),'/');
  const cookie=reply.headers.getSetCookie().find(c=>c.startsWith('sues_session='));assert.match(cookie,/HttpOnly; SameSite=Strict.*Max-Age=2592000; Expires=[^;]+; Secure/);
  const value=cookie.split(';')[0].split('=')[1];assert.equal(passwordSessions(token,record).valid(value),true);
  assert.equal((await request('/api/jobs',{headers:{Cookie:cookie.split(';')[0]}})).status,200);
  const replay=await request(callback,{headers:{Cookie:start.headers.get('set-cookie').split(';')[0]}});assert.equal(replay.headers.get('location'),'/?google=failed');assert.equal(replay.headers.getSetCookie().some(c=>c.startsWith('sues_session=')),false);
  const pass=await request('/api/login',{method:'POST',headers:{'X-Sues-Request':'editor','Content-Type':'application/json'},body:JSON.stringify({email:'carlossuess@gmail.com',password:'Synthetic-Passphrase-123'})});assert.equal(pass.status,200);
  assert.equal((await request('/api/session',{method:'POST',headers:{Authorization:'Bearer '+token}})).status,200);
  assert.equal(readFileSync(passwordFile,'utf8'),record);
 }finally{await app.close();rmSync(f.dir,{recursive:true,force:true});}
});
test('unconfigured Google cannot issue sessions and does not expose private config',async()=>{
 const f=fixture(),app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles});
 try{const base=(await app.listen()).split('/#')[0];assert.deepEqual(await(await fetch(base+'/api/auth/options')).json(),{google:false});assert.equal((await fetch(base+'/api/auth/google/start',{method:'POST',headers:{'X-Sues-Request':'editor'}})).status,503);const r=await fetch(base+'/api/auth/google/callback?state=bad&code=bad',{redirect:'manual'});assert.equal(r.headers.get('location'),'/?google=failed');assert.equal(r.headers.get('set-cookie').includes('sues_session='),false);}finally{await app.close();rmSync(f.dir,{recursive:true,force:true});}
});
