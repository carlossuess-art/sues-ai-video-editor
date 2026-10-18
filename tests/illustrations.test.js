import test from 'node:test';
import assert from 'node:assert/strict';
import {rmSync} from 'node:fs';
import {fixture} from './helpers/editor-fixture.js';
import {loadProject,prepareProject} from '../src/local-pipeline.js';
import {prepareIllustrations,illustrationFilters} from '../src/illustrations.js';
import {buildPreviewFilter} from '../src/local-preview.js';
test('soft image resources require source binding, provenance, safe geometry and a distinct spatial mask',()=>{
 const f=fixture();try{
  const project=loadProject(f.profiles.test),plan=prepareProject(project).plan;plan.source.sha256='a'.repeat(64);
  const item={assetId:'test-horizon',rights:'owned',role:'illustration',sourceSha256:plan.source.sha256,sha256:'b'.repeat(64),localFile:'/tmp/scene.png',timeSpace:'edit-timeline',start:2,end:3,box:{left:120,right:900,top:140,bottom:420},featherPx:100,fadeSeconds:.2};
  const valid=prepareIllustrations([item],plan,project.inputs.visionFrames);assert.equal(valid[0].mask,'soft-bottom');
  assert.throws(()=>prepareIllustrations([{...item,sourceSha256:'c'.repeat(64)}],plan,project.inputs.visionFrames),/bound to this source/);
  assert.throws(()=>prepareIllustrations([{...item,role:'style-reference'}],plan,project.inputs.visionFrames),/illustration role/);
  assert.throws(()=>prepareIllustrations([{...item,box:{...item.box,top:600,bottom:1000}}],plan,project.inputs.visionFrames),/face/);
  assert.throws(()=>prepareIllustrations([item,{...item,assetId:'second'}],plan,project.inputs.visionFrames),/overlap/);
  const graph=illustrationFilters(valid,'base',1);assert.ok(graph.filters.join(';').includes("a='alpha(X,Y)*clip((280-Y)/100,0,1)'"));assert.ok(graph.filters.join(';').includes('alpha=1'));assert.ok(graph.filters.join(';').includes('repeatlast=0'));
  plan.illustrations=valid;const composed=buildPreviewFilter(plan);assert.ok(composed.indexOf('geq=')<composed.indexOf('ass=filename='));
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
