import test from 'node:test';
import assert from 'node:assert/strict';
import {rmSync} from 'node:fs';
import {fixture} from './helpers/editor-fixture.js';
import {loadProject,prepareProject} from '../src/local-pipeline.js';
import {externalCatalog} from '../src/external-edit-plan.js';
import {planInstructions} from '../src/instruction-director.js';
import {masterDirectorFingerprint} from '../src/master-director-gate.js';
import {reviewMasterDirectorNative} from '../src/master-director-native-review.js';

const master='b'.repeat(64);
const prepare=()=>{
 const f=fixture(),project=loadProject(f.profiles.test),
 settings=prepareProject(project,{}).settings,catalog=externalCatalog(project,settings);
 const plan={
  schema:'sues-master-director/v1',
  source:{sha256:catalog.sourceSha256,type:'original',editable:true,flattened:false},
  timeline:{fingerprint:catalog.timelineFingerprint,timeSpace:'edit-timeline',fps:30,duration:catalog.duration},
  rules:{version:'rules-approved',precedence:['safety-and-rights','explicit-user-approval','locked-masters','project','profile','scene'],
   unresolvedConflicts:[],lockedMasters:[{id:'tapiz',sha256:master}]},
  scenes:[{id:'video',start:0,end:catalog.duration,purpose:'Una historia original completa'}],
  operations:[{id:'flash',sceneId:'video',renderer:'native',effect:'transition-native',
   track:'transition',start:3.1,end:3.5,reason:'Una transición justificada por el discurso',
   dependsOn:[],requiredQA:['rendered-frame','motion-playback'],
   parameters:{kind:'warm'}}]
 };
 const registry={
  sourceSha256:catalog.sourceSha256,timelineFingerprint:catalog.timelineFingerprint,
  approvedRuleVersion:'rules-approved',masterHashes:{tapiz:master},
  rendererCapabilities:{native:['transition-native']},licensedAssets:{},
  approvedPlanFingerprint:masterDirectorFingerprint(plan)
 };
 return {f,project,settings,catalog,plan,registry};
};
test('the existing native editor accepts one exact transition without making a job',()=>{
 const x=prepare();
 try{
  const original=JSON.stringify(x.settings);
  const out=reviewMasterDirectorNative({...x,assets:[],commandPlanner:planInstructions});
  assert.equal(out.status,'READY_FOR_EDITOR_PREVIEW',JSON.stringify(out.issues));
  assert.equal(out.canExecute,false);
  assert.equal(out.nativePlan.operations.length,1);
  assert.equal(out.preview.rows[0].status,'ready');
  assert.equal(JSON.stringify(x.settings),original);
 }finally{rmSync(x.f.dir,{recursive:true,force:true})}
});
test('native editor preserves its own rejection gates even after master approval',()=>{
 const x=prepare();
 try{
  x.plan.operations[0].start=23.1;x.plan.operations[0].end=23.5;
  x.registry.approvedPlanFingerprint=masterDirectorFingerprint(x.plan);
  const out=reviewMasterDirectorNative({...x,assets:[],commandPlanner:planInstructions});
  assert.notEqual(out.status,'READY_FOR_EDITOR_PREVIEW');
  assert.equal(out.nativePlan,null);
 }finally{rmSync(x.f.dir,{recursive:true,force:true})}
});
test('unverified creative operation cannot bypass master review',()=>{
 const x=prepare();
 try{
  delete x.registry.approvedPlanFingerprint;
  const out=reviewMasterDirectorNative({...x,assets:[],commandPlanner:planInstructions});
  assert.equal(out.status,'AWAITING_PLAN_APPROVAL');
  assert.equal(out.nativePlan,null);
 }finally{rmSync(x.f.dir,{recursive:true,force:true})}
});
test('an invalid payload cannot acquire a synthetic fallback',()=>{
 const x=prepare();
 try{
  x.plan.operations[0].parameters={kind:'warm',blurRadiusPx:24};
  x.registry.approvedPlanFingerprint=masterDirectorFingerprint(x.plan);
  const out=reviewMasterDirectorNative({...x,assets:[],commandPlanner:planInstructions});
  assert.equal(out.status,'NEEDS_ENGINE_OR_RESOURCE_WORK');
  assert.equal(out.nativePlan,null);
 }finally{rmSync(x.f.dir,{recursive:true,force:true})}
});


test('native structured list is validated by the real editor without replacing prior settings',()=>{
 const x=prepare();try{
  const c=x.catalog.captions.find(c=>c.start>0&&c.end-c.start>=1&&c.end<x.catalog.duration-3);assert.ok(c);
  x.plan.operations=[{id:'list',sceneId:'video',renderer:'native',effect:'elements-native',track:'graphics',start:c.start,end:c.end,reason:'Estructurar las ideas expresadas',dependsOn:[],requiredQA:['rendered-frame','motion-playback','narrative-review'],parameters:{format:'LIST',items:[{captionId:c.id,label:'Una idea real'}],coversPresenter:true,replace:false}}];
  x.registry.rendererCapabilities.native.push('elements-native');x.registry.approvedPlanFingerprint=masterDirectorFingerprint(x.plan);
  const out=reviewMasterDirectorNative({...x,assets:[],commandPlanner:planInstructions});assert.equal(out.status,'READY_FOR_EDITOR_PREVIEW',JSON.stringify(out));
  assert.equal(out.nativePlan.operations[0].format,'LIST');assert.equal(x.settings.elements,undefined);
  x.settings.elements={format:'LIST',items:[{captionId:c.id,label:'Anterior'}]};
  x.catalog=externalCatalog(x.project,x.settings);x.plan.timeline.fingerprint=x.catalog.timelineFingerprint;x.registry.timelineFingerprint=x.catalog.timelineFingerprint;x.registry.approvedPlanFingerprint=masterDirectorFingerprint(x.plan);
  const blocked=reviewMasterDirectorNative({...x,assets:[],commandPlanner:planInstructions});assert.equal(blocked.status,'NATIVE_PREVIEW_REJECTED');assert.match(JSON.stringify(blocked.issues),/sustitución explícita/);
 }finally{rmSync(x.f.dir,{recursive:true,force:true})}
});
