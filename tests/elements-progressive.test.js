import test from 'node:test';
import assert from 'node:assert/strict';
import {rmSync} from 'node:fs';
import {fixture} from './helpers/editor-fixture.js';
import {loadProject,prepareProject} from '../src/local-pipeline.js';
import {buildPreviewASS} from '../src/local-preview.js';
test('seven sequential reasons persist as one composition while each text has its own voice-timed reveal',()=>{
 const f=fixture();try{
  const project=loadProject(f.profiles.test),source=project.inputs.source;
  source.duration=project.inputs.transcript.sourceDuration=70;
  project.inputs.camera.keyframes.at(-1).time=70;project.inputs.visionFrames.at(-1).time=70;
  project.inputs.transcript.words=Array.from({length:7},(_,i)=>['La','razón',String(i+1),'explica','algo.'].map((text,j)=>({text,start:3+i*8+j*.36,end:3+i*8+(j+1)*.36}))).flat();
  const base=prepareProject(project,{profileImages:false}),captions=base.plan.captions;
  assert.ok(captions.length>=7,'each reason has a timed caption anchor');
  const items=Array.from({length:7},(_,i)=>({captionId:captions[i*2].id,label:'Razón número '+(i+1),revealOffset:i===3?.2:0}));
  const result=prepareProject(project,{profileImages:false,elements:{format:'LIST',items}});
  const blocks=result.plan.elements;
  assert.equal(blocks.length,7);
  assert.ok(blocks.every(e=>e.compositionId==='LIST-page-0'));
  assert.equal(blocks[0].compositionEnd,blocks[6].end);
  assert.equal(blocks[6].compositionStart,blocks[0].start);
  assert.ok(blocks[3].revealAt>blocks[3].start);
  const ass=buildPreviewASS(result.plan);
  assert.equal((ass.match(/LAS RAZONES/g)??[]).length,1,'only one composition header');
  for(let i=0;i<7;i++)assert.ok(ass.includes('Razón número '+(i+1)));
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('true-or-false provides a correctly timed answer reveal, not just a text label',()=>{
 const f=fixture();try{
  const project=loadProject(f.profiles.test),c=prepareProject(project).plan.captions;
  const result=prepareProject(project,{elements:{format:'TRUE_FALSE',items:[{captionId:c[0].id,endCaptionId:c[1].id,label:'¿Meditar es pensar?',answer:'false',revealOffset:.2}]}});
  const e=result.plan.elements[0],ass=buildPreviewASS(result.plan);
  assert.ok(e.revealAt>e.start);assert.ok(ass.includes('FALSO'));
  assert.ok(ass.includes('VERDADERO O FALSO'));
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
