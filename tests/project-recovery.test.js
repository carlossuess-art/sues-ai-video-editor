import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,rmSync,readdirSync,statSync} from 'node:fs';
import {join} from 'node:path';
import {Readable} from 'node:stream';
import {execFileSync} from 'node:child_process';
import {fixture} from './helpers/editor-fixture.js';
import {loadProject,prepareProject,fileSha256} from '../src/local-pipeline.js';
import {buildPreviewASS,buildPreviewFilter} from '../src/local-preview.js';
import {createProjectBackup} from '../src/project-backup.js';
import {ProjectRecovery} from '../src/project-recovery.js';
import {createEditorServer} from '../src/editor-server.js';

function request(bytes,length=bytes.length){const r=Readable.from([bytes]);r.headers={'content-type':'application/x-tar','content-length':String(length)};return r;}
async function copy(f,settings={}){
 const p=loadProject(f.profiles.test),prepared=prepareProject(p,settings),directory=join(f.dir,'copy');
 await createProjectBackup(p,prepared,directory);
 const tar=join(f.dir,'copy.tar');execFileSync('tar',['-cf',tar,'-C',directory,'.']);
 return {prepared,bytes:readFileSync(tar),tar};
}
test('private TAR recovery preserves source, ASS/filter and settings and rehydrates after restart',async()=>{
 const f=fixture();try{
  const input=await copy(f,{zoomIntensity:.6,sfxEnabled:true,sfxGain:.2}),profiles={...f.profiles},dir=join(f.dir,'recoveries'),store=new ProjectRecovery(dir,profiles),before=fileSha256(join(f.dir,'source.mp4'));
  const result=await store.receive(request(input.bytes));assert.equal(result.reused,false);assert.equal(store.list().length,1);
  const restored=prepareProject(loadProject(profiles[result.profileId]),store.settings(result.profileId));
  assert.equal(restored.settings.sfxEnabled,true);assert.equal(restored.settings.zoomIntensity,.6);
  assert.equal(buildPreviewASS(restored.plan),buildPreviewASS(input.prepared.plan));assert.equal(buildPreviewFilter(restored.plan),buildPreviewFilter(input.prepared.plan));
  assert.equal(fileSha256(join(f.dir,'source.mp4')),before);assert.equal(statSync(join(dir,result.id,'project/media/original.media')).mode&0o777,0o600);
  const retry=await store.receive(request(input.bytes));assert.equal(retry.id,result.id);assert.equal(retry.reused,true);assert.equal(store.list().length,1);
  const againProfiles={...f.profiles},again=new ProjectRecovery(dir,againProfiles);assert.equal(again.list().length,1);assert.ok(againProfiles[result.profileId]);assert.ok(!JSON.stringify(again.list()).includes(f.dir));
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('invalid, truncated, corrupt and disconnected recovery leaves no staging or profile',async()=>{
 const f=fixture();try{
  const input=await copy(f),profiles={...f.profiles},dir=join(f.dir,'recoveries'),store=new ProjectRecovery(dir,profiles);
  await assert.rejects(store.receive(request(Buffer.from('invalid'))),/TAR/);
  await assert.rejects(store.receive(request(input.bytes,input.bytes.length+1)),/incompleta/);
  const interrupted=Readable.from((async function*(){yield input.bytes.subarray(0,100);throw new Error('connection lost');})());interrupted.headers={'content-type':'application/x-tar','content-length':String(input.bytes.length)};
  await assert.rejects(store.receive(interrupted),/connection lost/);
  writeFileSync(join(f.dir,'copy/analysis/transcript.json'),'changed');const tar=join(f.dir,'changed.tar');execFileSync('tar',['-cf',tar,'-C',join(f.dir,'copy'),'.']);await assert.rejects(store.receive(request(readFileSync(tar))),/hash mismatch/);
  assert.equal(store.busy,false);assert.deepEqual(readdirSync(dir),[]);assert.deepEqual(profiles,f.profiles);
  const wrong=request(input.bytes);wrong.headers['content-type']='application/gzip';await assert.rejects(store.receive(wrong),/formato TAR/);
  await assert.rejects(store.receive(request(input.bytes,513*1024*1024)),/512 MiB/);
  assert.equal((await store.receive(request(input.bytes))).reused,false);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('restore endpoint authenticates before bytes, rejects another origin and reuses the job on retry/restart',async()=>{
 const f=fixture();let app;try{
  const input=await copy(f,{zoomIntensity:.5}),directory=join(f.dir,'jobs');
  app=createEditorServer({directory,profiles:{...f.profiles}});
  let url=(await app.listen()).split('/#')[0];
  const post=(headers={})=>fetch(url+'/api/recoveries',{method:'POST',headers:{'Content-Type':'application/x-tar',...headers},body:input.bytes});
  assert.equal((await post()).status,401);
  let login=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}}),headers={Cookie:login.headers.get('set-cookie').split(';')[0],'X-Sues-Request':'editor'};
  assert.equal((await post({...headers,Origin:'https://evil.example'})).status,403);
  const noIntent={...headers};delete noIntent['X-Sues-Request'];assert.equal((await post(noIntent)).status,403);
  const response=await post(headers);assert.equal(response.status,201);const result=await response.json();assert.equal(result.job.state,'PREVIEW_READY');assert.equal(result.job.settings.zoomIntensity,.5);assert.ok(!JSON.stringify(result).includes(f.dir));
  assert.equal((await(await post(headers)).json()).job.id,result.job.id);assert.equal(app.jobs.list().length,1);
  await app.close();app=createEditorServer({directory,profiles:{...f.profiles}});url=(await app.listen()).split('/#')[0];
  login=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}});headers={Cookie:login.headers.get('set-cookie').split(';')[0],'X-Sues-Request':'editor'};
  assert.equal((await(await post(headers)).json()).job.id,result.job.id);assert.equal(app.jobs.list().length,1);
  const profiles=await(await fetch(url+'/api/profiles',{headers})).json();assert.ok(profiles.find(p=>p.id===result.recovery.profileId)?.ready);
 }finally{if(app)await app.close();rmSync(f.dir,{recursive:true,force:true});}
});
test('recovery serializes streams and accepts retries at capacity without retaining a fifth copy',async()=>{
 const f=fixture();try{
  const input=await copy(f),dir=join(f.dir,'recoveries'),store=new ProjectRecovery(dir,{...f.profiles});
  let release;const gate=new Promise(r=>release=r),stream=Readable.from((async function*(){await gate;yield input.bytes;})());stream.headers={'content-type':'application/x-tar','content-length':String(input.bytes.length)};
  const first=store.receive(stream);await assert.rejects(store.receive(request(input.bytes)),/en proceso/);release();await first;
  for(let i=1;i<4;i++)await store.receive(request(Buffer.concat([input.bytes,Buffer.alloc(512*i)])));
  assert.equal(store.list().length,4);assert.equal((await store.receive(request(input.bytes))).reused,true);
  await assert.rejects(store.receive(request(Buffer.concat([input.bytes,Buffer.alloc(512*4)]))),/cuatro/);
  assert.equal(store.list().length,4);assert.ok(!readdirSync(dir).some(n=>n.startsWith('.')));
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
