import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,copyFileSync,rmSync,statSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fixture} from './helpers/editor-fixture.js';
import {createEditorServer} from '../src/editor-server.js';
import {fileSha256} from '../src/local-pipeline.js';
import {bundleDigest,validateRenderResult} from '../src/render-worker.js';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
test('draft fragments are exact-window private renders, cached, source-preserving, and never final versions',async()=>{
 const f=fixture();let app;
 try{
  const config=read(f.profiles.test),source=join(f.dir,'source.mp4');
  rmSync(source);
  execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','testsrc2=size=108x192:rate=30:duration=12','-f','lavfi','-i','sine=frequency=440:sample_rate=48000:duration=6','-f','lavfi','-i','sine=frequency=880:sample_rate=48000:duration=6','-filter_complex','[1:a][2:a]concat=n=2:v=0:a=1[a]','-map','0:v','-map','[a]','-c:v','libx264','-threads','1','-preset','ultrafast','-c:a','aac','-shortest',source]);
  config.source={duration:12,width:108,height:192};config.fontDirectory=resolve('assets/fonts');
  writeFileSync(f.profiles.test,JSON.stringify(config));
  writeFileSync(join(f.dir,'camera.json'),JSON.stringify({mode:'full-frame-fit',keyframes:[0,12].map(time=>({time,x:0,y:0,width:108,height:192,zoom:1}))}));
  writeFileSync(join(f.dir,'vision.json'),JSON.stringify({frames:[0,12].map(time=>({time,frameWidth:108,frameHeight:192,faces:[]}))}));
  const transcript=read(join(f.dir,'transcript.json'));transcript.sourceDuration=12;writeFileSync(join(f.dir,'transcript.json'),JSON.stringify(transcript));
  const before=fileSha256(source),options={directory:join(f.dir,'jobs'),profiles:f.profiles,token:'a'.repeat(64)};
  app=createEditorServer(options);let base=(await app.listen()).split('/#')[0];
  const login=async()=>{const r=await fetch(base+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}});return {Cookie:r.headers.get('set-cookie').split(';')[0],'Content-Type':'application/json','X-Sues-Request':'editor'};};
  let headers=await login();
  const settings={sourceCuts:[{start:4,end:6}],motions:false,profileImages:false,musicEnabled:false,voiceGain:1};
  const job=app.jobs.create('test',settings),record=app.jobs.get(job.id);record.state='DONE';app.jobs.save(record);
  const fingerprint=record.fingerprint,path='/api/jobs/'+job.id+'/adjust-preview';
  assert.equal((await fetch(base+path,{method:'POST'})).status,401);
  const request={fingerprint,settings:{...settings,hiddenCaptionIds:['seg-001']},start:6,duration:2};
  const post=body=>fetch(base+path,{method:'POST',headers,body:JSON.stringify(body)});
  assert.equal((await post({...request,fingerprint:'old'})).status,409);
  assert.equal((await post({...request,duration:90})).status,400);
  const r=await post(request);assert.equal(r.status,202);let result=await r.json();const key=result.key;
  assert.equal((await (await post(request)).json()).key,key);
  const other=app.jobs.create('test',settings);assert.throws(()=>app.jobs.render(other.id),/previsualización/);
  for(let i=0;result.state==='RUNNING'&&i<600;i++){await new Promise(r=>setTimeout(r,100));result=await (await fetch(base+path+'?key='+key,{headers})).json();}
  assert.equal(result.state,'READY',JSON.stringify(result));assert.equal(result.isFinalExport,false);
  const file=join(options.directory,'adjustment-previews',key,'fragment.mp4'),timestamp=statSync(file).mtimeMs;
  const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',file],{encoding:'utf8'}));
  const v=probe.streams.find(s=>s.codec_type==='video');assert.equal(v.width,540);assert.equal(v.height,960);assert.ok(Math.abs(Number(probe.format.duration)-2)<.04);
  const pcm=execFileSync('ffmpeg',['-v','error','-ss','0.2','-i',file,'-t','0.5','-map','0:a:0','-ac','1','-ar','48000','-f','f32le','-']);
  const samples=new Float32Array(pcm.buffer.slice(pcm.byteOffset,pcm.byteOffset+pcm.byteLength));
  const power=freq=>{let c=0,s=0;for(let i=0;i<samples.length;i++){c+=samples[i]*Math.cos(2*Math.PI*freq*i/48000);s+=samples[i]*Math.sin(2*Math.PI*freq*i/48000);}return Math.hypot(c,s);};
  assert.ok(power(880)>power(440)*10,'fragment uses late audio after source cuts');
  const media=await fetch(base+path+'?key='+key+'&media=1',{headers:{...headers,Range:'bytes=1024-2047'}});assert.equal(media.status,206);assert.equal((await media.arrayBuffer()).byteLength,1024);
  assert.equal((await fetch(base+path+'?key='+key+'&media=1')).status,401);
  assert.throws(()=>validateRenderResult({version:'1.0',provider:'local-ffmpeg',jobId:job.id,attempt:1,fingerprint,bundleDigest:bundleDigest(join(options.directory,'adjustment-previews',key,'bundle')),sourceSha256:before,source,bundle:join(options.directory,'adjustment-previews',key,'bundle'),output:file,log:join(f.dir,'worker.log'),duration:2}),/fragment is not a final export/);
  assert.equal(record.fingerprint,fingerprint);assert.deepEqual(record.settings.sourceCuts,settings.sourceCuts);assert.equal(fileSha256(source),before);
  await app.close();app=createEditorServer(options);base=(await app.listen()).split('/#')[0];headers=await login();
  const cached=await (await post(request)).json();assert.equal(cached.key,key);assert.equal(cached.state,'READY');assert.equal(statSync(file).mtimeMs,timestamp);
  const cancelled=await (await post({...request,start:0})).json();await fetch(base+path+'?key='+cancelled.key,{method:'DELETE',headers,body:'{}'});let stopped;for(let i=0;i<100;i++){stopped=await (await fetch(base+path+'?key='+cancelled.key,{headers})).json();if(stopped.state!=='RUNNING')break;await new Promise(r=>setTimeout(r,50));}assert.equal(stopped.state,'CANCELLED');assert.equal(app.jobs.previewBusy,false);

 }finally{if(app)await app.close();rmSync(f.dir,{recursive:true,force:true});}
});
