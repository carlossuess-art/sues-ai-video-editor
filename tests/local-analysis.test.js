import test from 'node:test';
import assert from 'node:assert/strict';
import {join} from 'node:path';
import {readFileSync,writeFileSync,rmSync} from 'node:fs';
import {fixture} from './helpers/editor-fixture.js';
import {createEditorServer} from '../src/editor-server.js';
import {projectConfig} from '../src/video-intake.js';
import {loadProject,prepareProject} from '../src/local-pipeline.js';
import {buildPreviewFilter} from '../src/local-preview.js';

test('offline mailbox is private, idempotent, bound to source, restartable and fails closed',async()=>{
 const f=fixture(),directory=join(f.dir,'jobs'),options={directory,profiles:f.profiles,intakeProbe:async()=>({streams:[{codec_type:'video',width:1280,height:720},{codec_type:'audio'}],format:{duration:24}})};
 let app=createEditorServer(options);
 const session=async()=>{const url=(await app.listen()).split('/#')[0],r=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}});return {url,headers:{Cookie:r.headers.get('set-cookie').split(';')[0],'Content-Type':'application/json','X-Sues-Request':'editor'}};};
 try{
  let {url,headers}=await session();const original=readFileSync(join(f.dir,'source.mp4'));
  const u=await (await fetch(url+'/api/uploads',{method:'POST',headers:{...headers,'Content-Type':'video/mp4'},body:original})).json(),endpoint='/api/uploads/'+u.id+'/transcribe',mailbox=join(directory,'uploads','asr');
  assert.equal((await fetch(url+endpoint)).status,401);
  assert.equal((await fetch(url+endpoint,{method:'POST',headers:{Cookie:headers.Cookie}})).status,403);
  assert.equal((await fetch(url+endpoint,{method:'POST',headers,body:'{}'})).status,400);
  writeFileSync(join(mailbox,'worker.json'),JSON.stringify({engine:'faster-whisper-base-int8',at:Date.now()}));
  const request=()=>fetch(url+endpoint,{method:'POST',headers,body:'{}'});
  assert.equal((await request()).status,202);const before=readFileSync(join(mailbox,u.id+'.request.json'));await request();assert.deepEqual(readFileSync(join(mailbox,u.id+'.request.json')),before);
  const post=body=>fetch(url+'/api/uploads/'+u.id+'/brief',{method:'POST',headers,body:JSON.stringify(body)});
  assert.equal((await post({prompt:'prueba',styleId:'SUES_DOPAMIN',projectTitle:'Viaje'})).status,200);
  assert.equal((await post({prompt:'x',styleId:'invalid'})).status,400);
  await app.close();app=createEditorServer(options);({url,headers}=await session());
  assert.equal((await (await fetch(url+endpoint,{headers})).json()).state,'QUEUED');
  // Simulated worker output: this is a contract test, NOT actual Whisper inference.
  const transcript=JSON.parse(readFileSync(join(f.dir,'transcript.json'))),result={sourceSha256:u.id,transcript,camera:{mode:'full-frame-fit',keyframes:[0,24].map(time=>({time,x:0,y:0,width:1280,height:720,zoom:1}))},vision:{method:'not-performed',frames:[0,24].map(time=>({time,frameWidth:1280,frameHeight:720,faces:[]}))}};
  writeFileSync(join(mailbox,u.id+'.result.json'),JSON.stringify(result));writeFileSync(join(mailbox,u.id+'.status.json'),JSON.stringify({state:'COMPLETE'}));
  const done=await (await fetch(url+endpoint,{headers})).json();assert.equal(done.upload.state,'READY');assert.equal(done.upload.brief.styleId,'SUES_DOPAMIN');assert.equal(done.upload.brief.projectTitle,'Viaje');
  const project=loadProject(join(directory,'uploads',u.id+'.project.json')),prepared=prepareProject(project,{styleId:'SUES_DOPAMIN'}),filter=buildPreviewFilter(prepared.plan);
  assert.equal(prepared.director.decisions.length,0);assert.equal(prepared.plan.camera.mode,'full-frame-fit');assert.match(filter,/force_original_aspect_ratio=decrease/);assert.match(filter,/pad=1080:1920/);assert.doesNotMatch(filter,/crop=w=/);assert.equal(prepared.plan.duration,24);assert.equal(prepared.director.audit.omittedWords,0);
  assert.deepEqual(readFileSync(join(directory,'uploads',u.id+'.video')),original);assert.equal(app.jobs.list().length,0);
  assert.equal(projectConfig(join(directory,'uploads',u.id+'.project.json')).source.sha256,u.id);
  assert.equal((await request()).status,202);
 }finally{await app.close();rmSync(f.dir,{recursive:true,force:true});}
});
