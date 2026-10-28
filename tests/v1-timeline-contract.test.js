import test from 'node:test';
import assert from 'node:assert/strict';
import {rmSync} from 'node:fs';
import {fixture} from './helpers/editor-fixture.js';
import {loadProject,prepareProject} from '../src/local-pipeline.js';
import {externalCatalog,reviewExternalPlan} from '../src/external-edit-plan.js';
import {captionPresentation} from '../src/caption-presentation.js';
import {buildPreviewASS} from '../src/local-preview.js';
test('Director receives edited timing and rejects a plan from before cuts',()=>{
 const f=fixture();try{
  const project=loadProject(f.profiles.test),settings={sourceCuts:[{start:0,end:1}]};
  const catalog=externalCatalog(project,settings);
  assert.equal(catalog.timeSpace,'edit-timeline');assert.equal(catalog.duration,23);
  assert.equal(catalog.sourceTimeMap.spans[0].sourceIn,1);
  const plan={...catalog.example,operations:[{type:'caption',captionId:catalog.captions[0].id,text:'Corregido'}]};
  assert.equal(reviewExternalPlan(JSON.stringify(plan),{project,settings}).canApply,true);
  delete plan.timelineFingerprint;
  assert.throws(()=>reviewExternalPlan(JSON.stringify(plan),{project,settings}),/línea temporal/);
  plan.timelineFingerprint=catalog.timelineFingerprint;
  assert.throws(()=>reviewExternalPlan(JSON.stringify(plan),{project,settings:{sourceCuts:[{start:0,end:1.5}]}}),/línea temporal/);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('caption manual timing preserves voice, graphics, original words and reversible settings',()=>{
 const f=fixture();try{
  const project=loadProject(f.profiles.test),before=prepareProject(project),c=before.plan.captions[0];
  const after=prepareProject(project,{captionTimingOverrides:{[c.id]:{start:c.start+.1,end:c.end+.1}}});
  assert.equal(after.plan.captions[0].start,c.start+.1);
  assert.equal(after.plan.captions[0].wordCues[0].start,c.wordCues[0].start+.1);
  assert.equal(after.plan.source.sha256,before.plan.source.sha256);
  assert.equal(after.plan.duration,before.plan.duration);
  assert.equal(prepareProject(project).plan.captions[0].start,c.start);
  assert.throws(()=>prepareProject(project,{captionTimingOverrides:{[c.id]:{start:1,end:100}}}),/outside/);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('main graphic replaces only literal complete caption; other spoken information relocates',()=>{
 const base={layout:{caption:{left:120,right:900,top:650,bottom:850}},graphics:[{type:'grid',start:1,end:4,heading:'AYUDAR',bodyLines:['TAMBIÉN ES TRABAJO']}]};
 assert.equal(captionPresentation(base,{text:'también es trabajo',start:2,end:3}).action,'replace');
 assert.equal(captionPresentation(base,{text:'que yo',start:2,end:3}).action,'relocate');
 assert.equal(captionPresentation(base,{text:'trabajo',source:'manual',start:2,end:3}).action,'relocate');
 assert.equal(captionPresentation(base,{text:'trabajo',start:.5,end:2}).action,'relocate');
 const plan={...base,graphics:[],foregroundEffects:{events:[{type:'behind-text',start:1,end:4,lines:['CAMBIO','PROFUNDO']}]}};
 const p=captionPresentation(plan,{text:'transformación',start:2,end:3});assert.equal(p.action,'relocate');assert.ok(p.box.top>=1440);
});

test('Director can suppress a semantic duplicate without changing speech or restoring manual decisions',()=>{
 const f=fixture();try{
  const project=loadProject(f.profiles.test),settings={hiddenCaptionIds:['seg-001']},catalog=externalCatalog(project,settings),caption=catalog.captions[1];
  const review=operations=>reviewExternalPlan(JSON.stringify({...catalog.example,operations}),{project,settings});
  const op={type:'caption-visibility',captionId:caption.id,hidden:true,reason:'El gráfico conserva toda la información de esta frase'};
  const r=review([op]);assert.equal(r.canApply,true);assert.ok(r.changes.hiddenCaptionIds.includes('seg-001'));assert.ok(r.changes.hiddenCaptionIds.includes(caption.id));
  const changed=prepareProject(project,r.changes),before=prepareProject(project,settings);assert.equal(changed.plan.duration,before.plan.duration);assert.deepEqual(changed.plan.timeMap,before.plan.timeMap);assert.deepEqual(changed.plan.captions.map(c=>c.text),before.plan.captions.map(c=>c.text));
  assert.equal(review([{...op,hidden:false}]).canApply,false);assert.equal(review([{...op,captionId:'seg-999'}]).canApply,false);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
