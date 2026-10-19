import test from 'node:test';
import assert from 'node:assert/strict';
import {rmSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fixture} from './helpers/editor-fixture.js';
import {createEditorServer} from '../src/editor-server.js';
const probe=async()=>({streams:[{codec_type:'video',width:1080,height:1920},{codec_type:'audio'}],format:{duration:24}});
test('original playback is private, seekable and bound to the prepared job source',async()=>{
 const f=fixture(),app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles,intakeProbe:probe});
 try{
  const url=(await app.listen()).split('/#')[0];
  assert.equal((await fetch(url+'/api/profiles/test/source')).status,401);
  const login=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}}),headers={Cookie:login.headers.get('set-cookie').split(';')[0],'X-Sues-Request':'editor'};
  const job=app.jobs.create('test');
  for(const path of ['/api/profiles/test/source','/api/jobs/'+job.id+'/source']){
   const r=await fetch(url+path,{headers:{...headers,Range:'bytes=1-3'}});assert.equal(r.status,206);assert.equal(await r.text(),'ixt');assert.equal(r.headers.get('accept-ranges'),'bytes');assert.equal(r.headers.get('cache-control'),'no-store');
   const head=await fetch(url+path,{method:'HEAD',headers});assert.equal(head.status,200);assert.equal(head.headers.get('content-length'),'7');assert.equal((await head.arrayBuffer()).byteLength,0);
   assert.equal((await fetch(url+path,{headers:{...headers,Range:'bytes=999-'}})).status,416);
  }
  writeFileSync(join(f.dir,'source.mp4'),'changed');assert.equal((await fetch(url+'/api/jobs/'+job.id+'/source',{headers})).status,409);
  assert.equal((await fetch(url+'/api/profiles/unknown/source',{headers})).status,404);
 }finally{await app.close();rmSync(f.dir,{recursive:true,force:true});}
});
test('unanalysed uploads expose name and original playback, never another transcript',async()=>{
 const f=fixture(),app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles,intakeProbe:probe});
 try{
  const url=(await app.listen()).split('/#')[0],login=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}}),headers={Cookie:login.headers.get('set-cookie').split(';')[0],'X-Sues-Request':'editor'};
  const r=await fetch(url+'/api/uploads?name='+encodeURIComponent('C:\\private\\new-video.mp4'),{method:'POST',headers:{...headers,'Content-Type':'video/mp4'},body:'a new video'}),u=await r.json();assert.equal(r.status,201);assert.equal(u.state,'NEEDS_ANALYSIS');assert.equal(u.profileId,null);assert.equal(u.name,'new-video.mp4');assert.equal(u.duration,24);assert.equal(u.width,1080);
  const media='/api/uploads/'+u.id+'/media';assert.equal((await fetch(url+media)).status,401);assert.equal((await fetch(url+media,{headers:{...headers,Range:'bytes=0-4'}})).status,206);
  assert.equal((await fetch(url+'/api/jobs',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({profileId:'upload-'+u.id})})).status,404);
  writeFileSync(join(f.dir,'jobs/uploads',u.id+'.video'),'tampered');assert.equal((await fetch(url+media,{headers})).status,409);
  const shell=await fetch(url);assert.match(shell.headers.get('content-security-policy'),/media-src 'self' blob:/);
 }finally{await app.close();rmSync(f.dir,{recursive:true,force:true});}
});
