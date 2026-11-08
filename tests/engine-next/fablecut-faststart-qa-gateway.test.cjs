'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const {createFaststartQaGateway,fileSHA}=require('../../ops/fablecut-faststart-qa-gateway.cjs');
const builder=path.resolve(__dirname,'../../scripts/engine-next/build-native-faststart-cache.py');
async function fixture(){
 const root=await fsp.mkdtemp(path.join(os.tmpdir(),'sues-gateway-fixture-')),mediaDir=path.join(root,'media');
 await fsp.mkdir(mediaDir);
 const src=path.join(mediaDir,'original.mp4');
 execFileSync('ffmpeg',['-v','error','-nostdin','-f','lavfi','-i','testsrc2=size=160x288:rate=30:duration=0.35',
  '-f','lavfi','-i','sine=frequency=440:sample_rate=48000:duration=0.35',
  '-c:v','libx264','-preset','ultrafast','-pix_fmt','yuv420p','-c:a','aac',
  '-movflags','+frag_keyframe+empty_moov','-shortest',src],{timeout:25000});
 await fsp.writeFile(path.join(root,'project.json'),JSON.stringify({revision:2,media:[{id:'source',src:'/media/original.mp4'}],clips:[{id:'V1',mediaId:'source',locked:true}]}));
 const sourceSha256=await fileSHA(src);
 const create=()=>createFaststartQaGateway({dataDir:root,sourceName:'original.mp4',cacheName:'original-faststart.mp4',sourceSha256,builderPath:builder,host:'127.0.0.1'});
 return {root,src,sourceSha256,cache:path.join(mediaDir,'original-faststart.mp4'),manifest:path.join(mediaDir,'original-faststart.mp4.verified.json'),create};
}
test('gateway automatically builds, verifies and reuses genuine source-preserving cache with concurrent video layers',{timeout:60000},async()=>{
 const v=await fixture();try{
  const originalBefore=await fsp.readFile(v.src);
  const g=v.create();const [a,b]=await Promise.all([g.binding(),g.binding()]);
  assert.deepEqual(a,b);assert.ok(a.verified);assert.ok(a.videoPacketCount>0);assert.ok(a.audioPacketCount>0);
  assert.equal(a.decoderOnly,true);assert.equal(a.production,false);
  assert.deepEqual(await fsp.readFile(v.src),originalBefore);
  assert.equal(a.cacheSha256,await fileSHA(v.cache));
  const repeat=await g.binding();assert.deepEqual(repeat,a);
 }finally{await fsp.rm(v.root,{recursive:true,force:true})}
});
test('gateway refuses mutated cache, modified source and missing partial manifest; never silently substitutes', {timeout:60000},async()=>{
 const v=await fixture();try{
  const g=v.create();await g.binding();
  const cache=await fsp.readFile(v.cache);cache[60]^=1;await fsp.writeFile(v.cache,cache);
  await assert.rejects(g.binding(),/Cache SHA changed/);
  await fsp.unlink(v.cache);
  await assert.rejects(g.binding(),/Incomplete cache and manifest/);
  await fsp.unlink(v.manifest);
  await g.binding();
  const source=await fsp.readFile(v.src);source[40]^=1;await fsp.writeFile(v.src,source);
  await assert.rejects(g.binding(),/Original source SHA changed/);
 }finally{await fsp.rm(v.root,{recursive:true,force:true})}
});
test('gateway refuses public bind, ambiguous names, stale active project and symlink cache', {timeout:60000},async()=>{
 const v=await fixture();try{
  assert.throws(()=>createFaststartQaGateway({dataDir:v.root,sourceName:'../original.mp4',cacheName:'b.mp4',sourceSha256:v.sourceSha256,builderPath:builder}),/unsafe/);
  assert.throws(()=>createFaststartQaGateway({dataDir:v.root,sourceName:'original.mp4',cacheName:'b.mp4',sourceSha256:v.sourceSha256,builderPath:builder,host:'0.0.0.0'}),/unsafe/);
  const g=v.create();await g.binding();
  const text=(await fsp.readFile(path.join(v.root,'project.json'),'utf8')).replace('"locked":true','"locked":false');
  await fsp.writeFile(path.join(v.root,'project.json'),text);
  await assert.rejects(g.binding(),/protected authentic source/);
  await fsp.writeFile(path.join(v.root,'project.json'),JSON.stringify({media:[{id:'source',src:'/media/original.mp4'}],clips:[{mediaId:'source',locked:true}]}));
  await fsp.unlink(v.cache);await fsp.symlink(v.src,v.cache);
  await assert.rejects(g.binding(),/Not a regular data asset/);
 }finally{await fsp.rm(v.root,{recursive:true,force:true})}
});
