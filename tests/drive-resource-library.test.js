import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,readdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';import {join} from 'node:path';import {createHash} from 'node:crypto';
import {DriveResourceCache,loadAuditedDrive} from '../src/drive-resource-library.js';
import {MediaLibrary} from '../src/media-library.js';
import {searchPrivateLibrary} from '../src/private-library-search.js';
import {createEditorServer} from '../src/editor-server.js';
import {fixture} from './helpers/editor-fixture.js';
const bytes=Buffer.from('verified video test fixture'),sha=createHash('sha256').update(bytes).digest('hex');
function setup(){
 const dir=mkdtempSync(join(tmpdir(),'sues-demand-'));mkdirSync(join(dir,'library'));
 const card={driveId:'driveResource_123',kind:'video-candidate',decodeStatus:'pass',bytesVerified:true,sha256:sha,
  bytes:bytes.length,visibleContentEs:'Carretera recta entre árboles con luz naranja',editorialTitleEs:'Carretera al amanecer',proposedUsesEs:['avance','camino'],sampleReviewCount:4,catalogueNumber:'BR-0199'};
 const data={schema:'sues-resource-audit/v1',cards:[card],byteDuplicateGroups:[]};
 const save=()=>writeFileSync(join(dir,'library','audited-drive-v1.json'),JSON.stringify(data));save();
 writeFileSync(join(dir,'library','official-library-v1.json'),JSON.stringify({runtimeItems:[]}));
 writeFileSync(join(dir,'library','purchased-source-index-309-v1.json'),JSON.stringify({items:[]}));
 const probe=async()=>({streams:[{codec_type:'video',codec_name:'h264',width:720,height:1280,avg_frame_rate:'30/1'}],format:{format_name:'mov,mp4,m4a,3gp,3g2,mj2',duration:'10.2'}});
 return {dir,data,save,card,probe,assets:new MediaLibrary(join(dir,'assets'),{probe}),clean:()=>rmSync(dir,{recursive:true,force:true})};
}
test('reviewed descriptions enter search; exact and visual duplicate exclusions apply across indices',()=>{
 const f=setup();try{
  const twin={...f.card,driveId:'driveResource_456',selectionExcluded:true};f.data.cards.push(twin);f.data.byteDuplicateGroups=[{sha256:sha,driveIds:[f.card.driveId,twin.driveId]}];f.save();
  writeFileSync(join(f.dir,'library','purchased-source-index-309-v1.json'),JSON.stringify({items:[{id:twin.driveId,originalName:'Carretera duplicada',installedInEditor:false}]}));
  const r=searchPrivateLibrary(f.dir,'carretera');assert.equal(r.results.length,1);assert.equal(r.results[0].catalogueNumber,'BR-0199');assert.equal(r.results[0].needsMaterialization,true);assert.equal(r.approvedToAutoPublish,false);
  assert.ok(!JSON.stringify(r).includes('https://'));assert.ok(loadAuditedDrive(f.dir).excluded.has(twin.driveId));
 }finally{f.clean();}
});
test('on-demand bytes are hash verified, installed by existing MediaLibrary and reused without a second download',async()=>{
 const f=setup();let calls=0;try{
  const cache=new DriveResourceCache(f.dir,{fetcher:async(url,options)=>{calls++;assert.equal(url.hostname,'drive.usercontent.google.com');assert.equal(options.redirect,'error');return new Response(bytes,{headers:{'content-type':'video/mp4','content-length':String(bytes.length)}});}});
  const first=await cache.materialize(f.card.driveId,{assets:f.assets,rights:'licensed'});assert.equal(first.asset.id,sha);assert.equal(first.cacheHit,false);assert.equal(first.approvedForProduction,false);
  assert.equal((await cache.materialize(f.card.driveId,{assets:f.assets,rights:'licensed'})).cacheHit,true);assert.equal(calls,1);assert.equal(f.assets.list().length,1);
  assert.deepEqual(readFileSync(f.assets.resolve(sha).localFile),bytes);
 }finally{f.clean();}
});
test('login pages, changed hashes, excluded clips and exceeded quota fail without registering media',async()=>{
 for(const type of ['login','hash','excluded','quota']){
  const f=setup();try{
   if(type==='excluded'){f.card.selectionExcluded=true;f.save();}
   const cache=new DriveResourceCache(f.dir,{capBytes:type==='quota'?1:128*1024*1024,fetcher:async()=>new Response(type==='hash'?Buffer.alloc(bytes.length):bytes,{headers:{'content-type':type==='login'?'text/html':'video/mp4'}})});
   await assert.rejects(cache.materialize(f.card.driveId,{assets:f.assets,rights:'licensed'}));
   assert.equal(f.assets.list().length,0);assert.ok(!readdirSync(cache.root).some(n=>n.startsWith('.incoming')||n==='.lock'));
  }finally{f.clean();}
 }
});
test('cache eviction never deletes previously installed media or bound resources',async()=>{
 const f=setup();try{
  const cache=new DriveResourceCache(f.dir,{capBytes:bytes.length,fetcher:async()=>new Response(bytes,{headers:{'content-type':'video/mp4'}})});
  await cache.materialize(f.card.driveId,{assets:f.assets,rights:'licensed'});
  const other=Buffer.from('second verified video fixture'),id=createHash('sha256').update(other).digest('hex');
  f.data.cards.push({...f.card,driveId:'driveResource_789',sha256:id,bytes:other.length});f.save();
  cache.capBytes=other.length;cache.fetcher=async()=>new Response(other,{headers:{'content-type':'video/mp4'}});
  await cache.materialize('driveResource_789',{assets:f.assets,rights:'licensed'});
  assert.equal(readdirSync(cache.root).filter(n=>n.endsWith('.media')).length,1);
  assert.equal(f.assets.resolve(sha).id,sha);assert.equal(f.assets.resolve(id).id,id);
 }finally{f.clean();}
});
test('materialization endpoint requires session and CSRF header before touching Drive',async()=>{
 const f=fixture(),app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles});app.jobs.autoStart=false;
 try{
  const url=(await app.listen()).split('/#')[0],body=JSON.stringify({driveId:'driveResource_123',rights:'licensed'});
  assert.equal((await fetch(url+'/api/library/materialize',{method:'POST',headers:{'Content-Type':'application/json'},body})).status,401);
  const s=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}});
  const cookie=s.headers.get('set-cookie').split(';')[0];
  assert.equal((await fetch(url+'/api/library/materialize',{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json'},body})).status,403);
 }finally{await app.close();rmSync(f.dir,{recursive:true,force:true});}
});
