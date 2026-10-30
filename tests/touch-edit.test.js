import test from 'node:test';
import assert from 'node:assert/strict';
import {rmSync} from 'node:fs';
import {fixture} from './helpers/editor-fixture.js';
import {loadProject,prepareProject} from '../src/local-pipeline.js';
import {buildPreviewASS} from '../src/local-preview.js';
import {validateSfxEvents,prepareCustomSfx,customSfxFilter} from '../src/custom-sfx.js';
test('manual caption transforms survive normalization, change ASS and reject foreign or unsafe values',()=>{
 const f=fixture();try{
  const project=loadProject(f.profiles.test),base=prepareProject(project,{profileImages:false});
  const id=base.plan.captions[0].id;
  const moved=prepareProject(project,{profileImages:false,captionTransforms:{[id]:{dx:20,dy:-100,scale:1.2}}});
  assert.equal(moved.settings.captionTransforms[id].dx,20);
  assert.notEqual(buildPreviewASS(base.plan),buildPreviewASS(moved.plan));
  const oversized=prepareProject(project,{profileImages:false,captionTransforms:{[id]:{dx:0,dy:0,scale:4}}});
  assert.equal(oversized.settings.captionTransforms[id].scale,4);
  assert.notEqual(buildPreviewASS(base.plan),buildPreviewASS(oversized.plan));
  assert.throws(()=>prepareProject(project,{profileImages:false,captionTransforms:{[id]:{dx:0,dy:0,scale:13}}}));
  assert.throws(()=>prepareProject(project,{captionTransforms:{[id]:{dx:0,dy:0,scale:Infinity}}}));
  assert.throws(()=>prepareProject(project,{captionTransforms:{'seg-999999':{dx:0,dy:0,scale:1}}}));
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('SFX trim binds source interval, updates end and uses atrim in actual audio filter',()=>{
 const id='a'.repeat(64),asset={kind:'sfx',assetId:id,sha256:id,rights:'owned',localFile:'/fixture.wav',duration:2};
 const events=[{assetId:id,start:1,sourceIn:.5,duration:.4,gain:.3}];
 validateSfxEvents(events);
 const sfx=prepareCustomSfx(events,5,()=>asset);
 assert.equal(sfx.events[0].end,1.4);
 assert.match(customSfxFilter(sfx,5,1,'audio').join(';'),/atrim=start=0.5:duration=0.3999999999999999/);
 assert.throws(()=>prepareCustomSfx([{...events[0],sourceIn:1.9}],5,()=>asset));
 assert.throws(()=>validateSfxEvents([{...events[0],duration:-1}]));
});
