import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {readFileSync,writeFileSync,existsSync,readdirSync,rmSync,unlinkSync,statSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {fixture} from './helpers/editor-fixture.js';
import {VideoIntake} from '../src/video-intake.js';
import {createEditorServer} from '../src/editor-server.js';
const probe=async()=>({streams:[{codec_type:'video',width:1080,height:1920},{codec_type:'audio'}],format:{duration:'24'}});
function request(data='fixture',length=Buffer.byteLength(data)){const r=Readable.from([Buffer.from(data)]);r.headers={'content-type':'video/mp4','content-length':String(length)};return r;}
function boundFixture(){const f=fixture(),config=JSON.parse(readFileSync(f.profiles.test));config.source.sha256=createHash('sha256').update('fixture').digest('hex');writeFileSync(f.profiles.test,JSON.stringify(config));return f;}
test('upload replaces missing original through a hash-bound profile, preserves source and survives restart',async()=>{
 const f=boundFixture();try{unlinkSync(join(f.dir,'source.mp4'));const intake=new VideoIntake(join(f.dir,'uploads'),f.profiles,{probe});const first=await intake.receive(request());assert.equal(first.state,'READY');assert.ok(first.profileId.startsWith('upload-'));assert.equal(statSync(join(f.dir,'uploads',first.id+'.video')).mode&0o777,0o600);assert.equal(existsSync(join(f.dir,'source.mp4')),false);const again=await intake.receive(request());assert.equal(again.id,first.id);assert.equal(intake.list().length,1);const restored=new VideoIntake(join(f.dir,'uploads'),{test:f.profiles.test},{probe});assert.equal(restored.list()[0].state,'READY');assert.equal(readFileSync(join(f.dir,'uploads',first.id+'.video'),'utf8'),'fixture');}finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('unrelated videos never inherit another transcript, and missing assets are explicit',async()=>{
 const f=boundFixture();try{const intake=new VideoIntake(join(f.dir,'uploads'),f.profiles,{probe});assert.equal((await intake.receive(request('other'))).state,'NEEDS_ANALYSIS');unlinkSync(join(f.dir,'transcript.json'));assert.equal((await intake.receive(request())).state,'WAITING_ASSETS');}finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('invalid, truncated, oversized and simultaneous uploads leave no partial file',async()=>{
 const f=boundFixture();try{const directory=join(f.dir,'uploads'),intake=new VideoIntake(directory,f.profiles,{probe});await assert.rejects(intake.receive(request('short',20)),/incompleta/);await assert.rejects(intake.receive(request('large',251*1024*1024)),/250 MiB/);await assert.rejects(intake.receive(request('too long',2)),/Tamaño/);const invalid=new VideoIntake(directory,f.profiles,{probe:async()=>({streams:[],format:{duration:1}})});await assert.rejects(invalid.receive(request()),/no válido/);intake.busy=true;await assert.rejects(intake.receive(request()),/busy/);assert.deepEqual(readdirSync(directory),[]);}finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('upload endpoint authenticates before bytes, supports empty studio, and creates CALMA through HTTP',async()=>{
 const f=boundFixture();unlinkSync(join(f.dir,'source.mp4'));const app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles,intakeProbe:probe});try{
 const url=(await app.listen()).split('/#')[0];assert.equal((await fetch(url+'/api/uploads',{method:'POST',body:'fixture',headers:{'Content-Type':'video/mp4'}})).status,401);
 const login=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}}),headers={Cookie:login.headers.get('set-cookie').split(';')[0],'X-Sues-Request':'editor'};
 const profiles=await(await fetch(url+'/api/profiles',{headers})).json();assert.equal(profiles[0].ready,false);assert.equal((await fetch(url+'/api/design?profileId=test',{headers})).status,200);
 assert.equal((await fetch(url+'/api/uploads',{method:'POST',headers:{...headers,Origin:'https://evil.example','Content-Type':'video/mp4'},body:'fixture'})).status,403);
 const result=await fetch(url+'/api/uploads',{method:'POST',headers:{...headers,'Content-Type':'video/mp4'},body:'fixture'});assert.equal(result.status,201);const uploaded=await result.json();assert.equal(uploaded.state,'READY');assert.ok(!JSON.stringify(uploaded).includes(f.dir));
 const job=await fetch(url+'/api/jobs',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({profileId:uploaded.profileId})});assert.equal(job.status,201);assert.equal((await job.json()).state,'PREVIEW_READY');
 }finally{await app.close();rmSync(f.dir,{recursive:true,force:true});}
});
test('private analysis import binds to source bytes, validates timings, and survives restart',async()=>{
 const f=boundFixture();try{
 const config=JSON.parse(readFileSync(f.profiles.test));config.depthTextPath='old-source-mask.json';writeFileSync(f.profiles.test,JSON.stringify(config));
 const intake=new VideoIntake(join(f.dir,'uploads'),f.profiles,{probe}),uploaded=await intake.receive(request('new video'));
 const analysis={sourceSha256:uploaded.id,transcript:JSON.parse(readFileSync(join(f.dir,'transcript.json'))),camera:JSON.parse(readFileSync(join(f.dir,'camera.json'))),vision:JSON.parse(readFileSync(join(f.dir,'vision.json')))};
 assert.throws(()=>intake.importAnalysis(uploaded.id,{...analysis,sourceSha256:'0'.repeat(64)}),/SHA256 mismatch/);
 assert.throws(()=>intake.importAnalysis(uploaded.id,{...analysis,transcript:{...analysis.transcript,sourceDuration:100}}),/duration mismatch/);
 assert.throws(()=>intake.importAnalysis(uploaded.id,{...analysis,camera:{keyframes:[]}}),/camera frames|camera zoom/);
 assert.equal(intake.list()[0].state,'NEEDS_ANALYSIS');assert.ok(!readdirSync(join(f.dir,'uploads')).some(n=>n.startsWith('analysis-')));
 const result=intake.importAnalysis(uploaded.id,analysis);assert.equal(result.state,'READY');assert.equal(JSON.parse(readFileSync(join(f.dir,'uploads',uploaded.id+'.project.json'))).depthTextPath,undefined);assert.throws(()=>intake.importAnalysis(uploaded.id,analysis),/already ready/);
 const restored=new VideoIntake(join(f.dir,'uploads'),{test:f.profiles.test},{probe});assert.equal(restored.list()[0].state,'READY');assert.ok(!JSON.stringify(restored.list()).includes(f.dir));
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('bounded upload library admits idempotent retries at capacity and rejects a fifth distinct video',async()=>{
 const f=boundFixture();try{const intake=new VideoIntake(join(f.dir,'uploads'),f.profiles,{probe});for(const v of ['one','two','three','four'])await intake.receive(request(v));assert.equal(intake.list().length,4);assert.ok(await intake.receive(request('one')));await assert.rejects(intake.receive(request('five')),/Límite de 4/);assert.equal(intake.list().length,4);assert.ok(!readdirSync(join(f.dir,'uploads')).some(n=>n.startsWith('.incoming-')));}finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('silent, rotated incorrectly and tampered stored videos fail without replacing the original',async()=>{
 const f=boundFixture();try{
 const directory=join(f.dir,'uploads');
 let intake=new VideoIntake(directory,f.profiles,{probe:async()=>({streams:[{codec_type:'video',width:1080,height:1920}],format:{duration:24}})});await assert.rejects(intake.receive(request()),/pista de voz/);
 intake=new VideoIntake(directory,f.profiles,{probe:async()=>({streams:[{codec_type:'video',width:1080,height:1920,side_data_list:[{rotation:45}]},{codec_type:'audio'}],format:{duration:24}})});await assert.rejects(intake.receive(request()),/Orientación/);
 intake=new VideoIntake(directory,f.profiles,{probe});const uploaded=await intake.receive(request());const path=join(directory,uploaded.id+'.video');writeFileSync(path,'changed');await assert.rejects(intake.receive(request()),/integrity changed/);assert.equal(readFileSync(path,'utf8'),'changed');assert.ok(!readdirSync(directory).some(n=>n.startsWith('.incoming-')));
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('aborted streaming upload cleans its temporary file and releases the single upload slot',async()=>{
 const f=boundFixture();try{const directory=join(f.dir,'uploads'),intake=new VideoIntake(directory,f.profiles,{probe});const broken=Readable.from((async function*(){yield Buffer.from('part');throw new Error('connection lost');})());broken.headers={'content-type':'video/mp4','content-length':'100'};await assert.rejects(intake.receive(broken),/connection lost/);assert.equal(intake.busy,false);assert.deepEqual(readdirSync(directory),[]);assert.equal((await intake.receive(request())).state,'READY');}finally{rmSync(f.dir,{recursive:true,force:true});}
});

test('configured upload capacity admits a fifth source, remains bounded and preserves idempotent retries',async()=>{
 const f=boundFixture();try{const dir=join(f.dir,'uploads'),intake=new VideoIntake(dir,f.profiles,{probe,maxUploads:6});
  for(let n=0;n<6;n++)await intake.receive(request('distinct-'+n));assert.deepEqual(intake.capacity(),{used:6,max:6,remaining:0,maxVideoBytes:250*1024*1024});
  await assert.rejects(intake.receive(request('seventh')),/Límite de 6/);await intake.receive(request('distinct-0'));assert.equal(intake.records().length,6);
  for(const maxUploads of [0,33,1.5,NaN,'16'])assert.throws(()=>new VideoIntake(join(f.dir,'bad'),f.profiles,{probe,maxUploads}),/Límite/);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('the studio exposes its configured upload capacity without weakening authentication',async()=>{
 const f=boundFixture(),app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles,intakeProbe:probe,maxUploads:16});try{const u=new URL(await app.listen()),base=u.origin;assert.equal((await fetch(base+'/api/health')).status,401);const r=await fetch(base+'/api/health',{headers:{Cookie:'sues_session='+app.token}});assert.equal(r.status,200);assert.deepEqual((await r.json()).uploadCapacity,{used:0,max:16,remaining:16,maxVideoBytes:250*1024*1024});}finally{await app.close();rmSync(f.dir,{recursive:true,force:true});}
});
