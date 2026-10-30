import test from 'node:test';
import assert from 'node:assert/strict';
import {rmSync} from 'node:fs';
import {fixture} from './helpers/editor-fixture.js';
import {loadProject,prepareProject} from '../src/local-pipeline.js';
import {buildPreviewASS,buildVideoPassFilter} from '../src/local-preview.js';
test('caption-scale keyframes alter actual ASS subtitles and video render graph still isolates audio',()=>{
 const f=fixture();try{
  const p=loadProject(f.profiles.test),baseline=prepareProject(p,{profileImages:false});
  const c=baseline.plan.captions[0],duration=c.end-c.start;
  assert.ok(duration>.35);
  const keys=[{time:0,value:1},{time:.15,value:2.5},{time:.3,value:1}];
  const edit=prepareProject(p,{profileImages:false,captionScaleKeyframes:{[c.id]:keys}});
  const ass=buildPreviewASS(edit.plan);
  assert.match(ass,/\\t\(0,150,\\fscx/);assert.match(ass,/\\t\(150,300,\\fscx/);
  assert.ok(!buildPreviewASS(baseline.plan).includes('\\t(0,150,\\fscx'));
  assert.ok(buildVideoPassFilter(edit.plan).includes('[video]'));
  assert.throws(()=>prepareProject(p,{profileImages:false,captionScaleKeyframes:{[c.id]:[{time:duration+1,value:1}]}}),/fuera del fragmento/);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
