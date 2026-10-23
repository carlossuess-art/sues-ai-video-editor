import test from 'node:test';
import assert from 'node:assert/strict';
import {rmSync} from 'node:fs';
import {fixture} from './helpers/editor-fixture.js';
import {loadProject,prepareProject} from '../src/local-pipeline.js';
import {reviewInstructionExecution} from '../src/instruction-execution.js';
import {planInstructions} from '../src/instruction-director.js';

test('the actual captions-only DOPAMIN failure cannot pass instruction review',()=>{
 const f=fixture();try{
  const project=loadProject(f.profiles.test);project.inputs.camera.mode='full-frame-fit';project.inputs.visionFrames.forEach(f=>f.faces=[]);
  project.inputs.transcript.words.forEach((w,i)=>w.text=['Hola','qué','tal'][i%3]);
  const settings={styleId:'SUES_DOPAMIN',autoRecipe:true,musicEnabled:true,zoomIntensity:.6,motions:true,sfxEnabled:true};
  const p=prepareProject(project,settings),proposal=planInstructions('DOPAMIN; con recursos animados; con efectos de sonido; zoom al 60 %; música al 12 %',settings);
  const review=reviewInstructionExecution(proposal,p.plan);
  assert.equal(review.canApply,false);assert.equal(review.execution.captionsOnly,true);assert.equal(review.execution.musicPresent,false);assert.equal(review.execution.missing.length,5);
  assert.match(review.unsupported.join(' '),/sin análisis de encuadre/);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('requested music is blocked without an actual mix, while explicitly silent CALMA is allowed',()=>{
 const f=fixture();try{
  const project=loadProject(f.profiles.test),plan=prepareProject(project).plan;
  assert.equal(reviewInstructionExecution(planInstructions('música al 12 %'),plan).canApply,false);
  assert.equal(reviewInstructionExecution(planInstructions('sin música'),plan).canApply,true);
  const withMix={...plan,audioMix:{gain:.12}};
  assert.equal(reviewInstructionExecution(planInstructions('música al 12 %'),withMix).canApply,true);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
