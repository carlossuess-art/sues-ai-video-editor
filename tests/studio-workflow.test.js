import test from 'node:test';
import assert from 'node:assert/strict';
import {rmSync,mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {fixture} from './helpers/editor-fixture.js';
import {createEditorServer} from '../src/editor-server.js';
import {verifyProjectBackup} from '../src/project-backup.js';
import {loadProject,prepareProject} from '../src/local-pipeline.js';
import {buildPreviewASS,buildPreviewFilter} from '../src/local-preview.js';
test('authenticated studio uploads resources, edits a real plan, exports and restores a portable backup',async()=>{
 const f=fixture(),app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles,assetProbe:async(_,kind)=>kind==='image'?{streams:[{codec_type:'video',codec_name:'png',width:800,height:300}],format:{format_name:'png_pipe'}}:{streams:[{codec_type:'audio',codec_name:'pcm_s16le'}],format:{format_name:'wav',duration:30}}});
 try{
  const launch=await app.listen(),url=launch.split('/#')[0],session=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}}),headers={Cookie:session.headers.get('set-cookie').split(';')[0],'X-Sues-Request':'editor'};
  const api=async(path,method='GET',data)=>{const r=await fetch(url+'/api/'+path,{method,headers:{...headers,'Content-Type':'application/json'},...(data?{body:JSON.stringify(data)}:{})});const body=await r.json();assert.ok(r.ok,JSON.stringify(body));return body;};
  assert.equal((await fetch(url+'/api/assets')).status,401);
  const upload=async(kind,content)=>{const r=await fetch(url+'/api/assets?'+new URLSearchParams({kind,rights:'owned',name:'Mi '+kind}),{method:'POST',headers:{...headers,'Content-Type':'application/octet-stream'},body:content});assert.equal(r.status,201);return r.json();};
  const image=await upload('image','image-test-content'),music=await upload('audio','audio-test-content');assert.equal((await api('assets')).length,2);
  const media=await fetch(url+'/api/assets/'+image.id+'/media',{headers:{...headers,Range:'bytes=0-3'}});assert.equal(media.status,206);assert.equal(await media.text(),'imag');
  let job=await api('jobs','POST',{profileId:'test'});job=await api('jobs/'+job.id,'PATCH',{settings:{musicAssetId:music.id,musicGain:.06,duckMusic:false,imageEvents:[{assetId:image.id,start:2,end:3}],graphicCards:[{captionId:'seg-005',type:'grid'}],keywordOverrides:{'seg-001':{word:2,level:'exceptional',style:'green'}},transitions:[{captionId:'seg-003',type:'warm'}]}});
  const before=app.jobs.plan(job.id),review=await api('jobs/'+job.id+'/review');assert.ok(!JSON.stringify(review).includes(f.dir));assert.equal(review.music.assetId,music.id);assert.ok(review.events.some(e=>e.type==='image'));assert.ok(review.events.some(e=>e.type==='grid'));
  const result=await api('jobs/'+job.id+'/backup','POST',{});assert.equal(result.ready,true);const again=await api('jobs/'+job.id+'/backup','POST',{});assert.equal(result.sha256,again.sha256);
  const download=await fetch(url+'/api/jobs/'+job.id+'/backup',{headers});assert.equal(download.status,200);const archive=join(f.dir,'project.tar');writeFileSync(archive,Buffer.from(await download.arrayBuffer()));const restored=join(f.dir,'restored');mkdirSync(restored);execFileSync('tar',['-xf',archive,'-C',restored]);assert.equal(verifyProjectBackup(restored).valid,true);
  const restoredSettings=JSON.parse(readFileSync(join(restored,'settings.json')));assert.equal(restoredSettings.musicAssetId,null);assert.deepEqual(restoredSettings.imageEvents,[]);const prepared=prepareProject(loadProject(join(restored,'project.json')),restoredSettings);assert.equal(buildPreviewASS(prepared.plan),buildPreviewASS(before.manifest));assert.equal(buildPreviewFilter(prepared.plan),buildPreviewFilter(before.manifest));
  await api('jobs/'+job.id,'PATCH',{settings:{zoomIntensity:0}});assert.equal((await api('jobs/'+job.id)).backupReady,false);await api('jobs/'+job.id+'/undo','POST',{});assert.equal((await api('jobs/'+job.id)).settings.musicAssetId,music.id);
 }finally{await app.close();rmSync(f.dir,{recursive:true,force:true});}
});
