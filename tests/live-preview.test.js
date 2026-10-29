import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,writeFileSync,statSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fixture} from './helpers/editor-fixture.js';
import {loadProject,prepareProject,fileSha256} from '../src/local-pipeline.js';
import {buildPreviewASS} from '../src/local-preview.js';
import {editableBasePlan,editableBaseKey,LivePreviews} from '../src/live-preview.js';
test('the clean plate removes editable pixels while caption changes reuse the same camera cache',()=>{
 const f=fixture();try{
  const project=loadProject(f.profiles.test),before=prepareProject(project,{motions:false,profileImages:false}),id=before.plan.captions[0].id;
  const moved=prepareProject(project,{...before.settings,captionTransforms:{[id]:{dx:15,dy:20,scale:1.1}}});
  assert.equal(editableBaseKey('job',project,before),editableBaseKey('job',project,moved));
  const camera=structuredClone(before);camera.plan.camera.keyframes[0].x+=2;
  assert.notEqual(editableBaseKey('job',project,before),editableBaseKey('job',project,camera));
  const base=editableBasePlan(before.plan);
  assert.equal(base.captions.length,0);assert.equal(base.selectedMedia.length,0);assert.equal(base.foregroundEffects,null);
  assert.deepEqual(before.plan.captions.map(c=>c.id),moved.plan.captions.map(c=>c.id));
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('real caption ASS events carry the layer ID; text is not executable markup',()=>{
 const f=fixture();try{
  const project=loadProject(f.profiles.test),p=prepareProject(project,{motions:false,profileImages:false}),id=p.plan.captions[0].id;
  const ass=buildPreviewASS(p.plan);assert.match(ass,new RegExp(',Caption,'+id+',0,0,0,,'));
  assert.ok(ass.includes('[Events]'));
  const c=structuredClone(p.plan);c.captions[0].text='{evil}';c.captions[0].lines=['{evil}'];c.captions[0].source='manual';
  assert.ok(buildPreviewASS(c).includes('｛evil｝'));
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('live cache media cannot be addressed with a foreign job or arbitrary filesystem part',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'sues-live-')),key='a'.repeat(64);
 try{
  const cache=new LivePreviews(dir,{}),file=join(dir,'base.mp4');writeFileSync(file,'data');
  cache.tasks.set(key,{key,jobId:'owner-job',state:'READY',files:{base:{file,sha256:fileSha256(file),size:statSync(file).size,mime:'video/mp4'}}});
  assert.equal(cache.media('owner-job',key,'base').file,file);
  writeFileSync(file,'evil');assert.throws(()=>cache.media('owner-job',key,'base'),/changed/);writeFileSync(file,'data');
  assert.throws(()=>cache.media('foreign-job',key,'base'),/not found/);
  for(const part of ['../access/token','/etc/passwd','constructor','a-zzzz'])assert.throws(()=>cache.media('owner-job',key,part),/not found/);
  assert.throws(()=>cache.scene('owner-job',{fingerprint:'x',settings:{},command:'rm -rf /'}),/Invalid live preview request/);
  await cache.close();
 }finally{rmSync(dir,{recursive:true,force:true});}
});
