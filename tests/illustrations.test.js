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

test('subject-aware resources move below a high face, stay stable and reverse their feather without covering captions',()=>{
 const f=fixture();try{
  const project=loadProject(f.profiles.test),plan=prepareProject(project).plan;plan.source.sha256='a'.repeat(64);
  const item={assetId:'walking-support',rights:'owned',role:'illustration',sourceSha256:plan.source.sha256,sha256:'b'.repeat(64),localFile:'/tmp/scene.png',timeSpace:'edit-timeline',start:2,end:3,placement:'auto-subject',featherPx:100,fadeSeconds:.2};
  const high=project.inputs.visionFrames.map(frame=>({...frame,faces:frame.faces.map(face=>({...face,y:180,height:300,leftEye:{x:520,y:280},rightEye:{x:560,y:280}}))}));
  const lower=prepareIllustrations([item],plan,high)[0];assert.equal(lower.placement.zone,'below-face');assert.equal(lower.box.top,880);assert.equal(lower.mask,'soft-top');assert.ok(lower.box.bottom<plan.layout.caption.top);assert.ok(illustrationFilters([lower],'base',1).filters[0].includes("a='alpha(X,Y)*clip(Y/100,0,1)'"));
  const upper=prepareIllustrations([item],plan,project.inputs.visionFrames)[0];assert.equal(upper.box.top,180);assert.equal(upper.mask,'soft-bottom');
  const occupied=[{...high[0],time:2},{...project.inputs.visionFrames[0],time:2.5},{...high[0],time:3}];
  assert.throws(()=>prepareIllustrations([item],plan,occupied),/no hay espacio seguro/);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});

test('photographic motion and edge-to-edge supports keep face and caption collision checks',()=>{
 const f=fixture();try{
  const project=loadProject(f.profiles.test),plan=prepareProject(project).plan;plan.source.sha256='a'.repeat(64);
  const item={assetId:'photo-support',rights:'owned',role:'illustration',sourceSha256:plan.source.sha256,sha256:'b'.repeat(64),localFile:'/tmp/photo.png',timeSpace:'edit-timeline',start:2,end:3,edgeToEdge:true,motion:'slow-push',box:{left:0,right:1080,top:0,bottom:400},featherPx:140,fadeSeconds:.2};
  const valid=prepareIllustrations([item],plan,project.inputs.visionFrames),filters=illustrationFilters(valid,'base',1).filters.join(';');
  assert.ok(filters.includes('alphaextract'));assert.ok(filters.includes('alphamerge'));assert.equal((filters.match(/zoompan=/g)??[]).length,2);
  assert.deepEqual(valid[0].box,item.box);
  assert.throws(()=>prepareIllustrations([{...item,edgeToEdge:false}],plan,project.inputs.visionFrames),/safe resource box/);
  assert.throws(()=>prepareIllustrations([{...item,motion:'unbounded'}],plan,project.inputs.visionFrames),/image motion/);
  assert.throws(()=>prepareIllustrations([{...item,box:{left:0,right:1080,top:400,bottom:1000}}],plan,project.inputs.visionFrames),/face/);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
