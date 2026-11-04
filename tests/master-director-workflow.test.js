import test from 'node:test';
import assert from 'node:assert/strict';
import {masterDirectorFingerprint} from '../src/master-director-gate.js';
import {buildMasterDirectorReview,decideMasterDirectorWork,assessMasterDirectorDelivery} from '../src/master-director-workflow.js';
const source='a'.repeat(64),master='b'.repeat(64),asset='c'.repeat(64),output='d'.repeat(64);
const plan=()=>({
 schema:'sues-master-director/v1',
 source:{sha256:source,type:'original',editable:true,flattened:false},
 timeline:{fingerprint:'edit-01',timeSpace:'edit-timeline',fps:30,duration:6},
 rules:{version:'approved-rules-v1',precedence:['safety-and-rights','explicit-user-approval','locked-masters','project','profile','scene'],unresolvedConflicts:[],lockedMasters:[{id:'tapiz01',sha256:master}]},
 creativeContext:{centralMessage:'Vencer el miedo',intendedExperience:'Liberación'},
 scenes:[{id:'hook',start:0,end:3,phase:'hook',purpose:'Plantear el problema'},
         {id:'release',start:3,end:6,phase:'transformation',purpose:'Resolver el conflicto'}],
 operations:[{id:'broll01',sceneId:'hook',renderer:'native',effect:'broll',track:'broll',start:.1,end:2.9,reason:'Mostrar el miedo como cadena',resourceId:'asset01',dependsOn:[],requiredQA:['rendered-frame','motion-playback','narrative-review']}]
});
const registry=(p)=>({
 sourceSha256:source,timelineFingerprint:'edit-01',approvedRuleVersion:'approved-rules-v1',
 masterHashes:{tapiz01:master},rendererCapabilities:{native:['broll']},
 licensedAssets:{asset01:{sha256:asset,rightsVerified:true,commercialUseAllowed:true,
  title:'Cadena cinematográfica',kind:'video',origin:'google-drive',
  previewUrl:'https://drive.google.com/file/d/validid/view'}},
 approvedPlanFingerprint:masterDirectorFingerprint(p),
 approvedProviders:['local-renderer'],approvedBalances:{'local-renderer':5},
 reservedBalances:{'local-renderer':2}
});
const choose=(p,mode)=>({userVerified:true,decisionId:'choice01',fingerprint:masterDirectorFingerprint(p),mode});
const render=p=>({status:'complete',fingerprint:masterDirectorFingerprint(p),outputSha256:output,playable:true,projectEditable:true,duration:6});
test('review contains scene-by-scene timeline and one real resource link',()=>{
 const p=plan(),r=registry(p),x=buildMasterDirectorReview(p,r);
 assert.equal(x.status,'READY_FOR_CHOICE');
 assert.equal(x.timeline[0].phase,'hook');
 assert.equal(x.timeline[0].operations[0].reason,'Mostrar el miedo como cadena');
 assert.equal(x.resources.length,1);
 assert.equal(x.resources[0].origin,'google-drive');
 assert.equal(x.resources[0].previewAvailable,true);
});
test('no link is invented for resources with absent or unsafe preview URLs',()=>{
 const p=plan(),r=registry(p);r.licensedAssets.asset01.previewUrl='javascript:alert(1)';
 assert.equal(buildMasterDirectorReview(p,r).resources[0].previewUrl,null);
});
test('no user choice means no execution',()=>{
 const p=plan(),r=registry(p);
 assert.equal(decideMasterDirectorWork(p,r,{provider:'local-renderer',estimatedUSD:0}).status,'AWAITING_PLAN_CHOICE');
});
test('review selection pauses preparation and exposes plan rather than executing',()=>{
 const p=plan(),r=registry(p);r.planChoice=choose(p,'review');
 assert.equal(decideMasterDirectorWork(p,r,{provider:'local-renderer',estimatedUSD:0}).status,'REVIEW_REQUESTED');
});
test('untrusted choice never approves a plan',()=>{
 const p=plan(),r=registry(p);r.planChoice={...choose(p,'autonomous'),userVerified:false};
 assert.equal(decideMasterDirectorWork(p,r,{provider:'local-renderer',estimatedUSD:0}).status,'AWAITING_PLAN_CHOICE');
});
test('autonomous mode cannot authorize unapproved provider or overspend',()=>{
 const p=plan(),r=registry(p);r.planChoice=choose(p,'autonomous');
 assert.equal(decideMasterDirectorWork(p,r,{provider:'paid-cloud',estimatedUSD:1}).status,'NEEDS_COST_APPROVAL');
 assert.equal(decideMasterDirectorWork(p,r,{provider:'local-renderer',estimatedUSD:4}).status,'NEEDS_COST_APPROVAL');
});
test('approved prepaid budget is net of reserved spending and never publishes',()=>{
 const p=plan(),r=registry(p);r.planChoice=choose(p,'autonomous');
 const x=decideMasterDirectorWork(p,r,{provider:'local-renderer',estimatedUSD:3});
 assert.equal(x.status,'READY_TO_EXECUTE');assert.equal(x.mayPublish,false);
 assert.equal(x.spendPermission,'PREAPPROVED_BALANCE');
});
test('autonomous choice without registered approval still does not execute',()=>{
 const p=plan(),r=registry(p);r.planChoice=choose(p,'autonomous');delete r.approvedPlanFingerprint;
 assert.equal(decideMasterDirectorWork(p,r,{provider:'local-renderer',estimatedUSD:0}).status,'AWAITING_PLAN_APPROVAL_RECORD');
});
test('unknown price cannot execute and free operations can',()=>{
 const p=plan(),r=registry(p);r.planChoice=choose(p,'approve');
 assert.equal(decideMasterDirectorWork(p,r,{provider:'local-renderer'}).status,'COST_ESTIMATE_REQUIRED');
 assert.equal(decideMasterDirectorWork(p,r,{provider:'local-renderer',estimatedUSD:0}).status,'READY_TO_EXECUTE');
});
test('only verified playable and editable render can be offered provisionally',()=>{
 const p=plan(),r=registry(p),f={kind:'optional-operation',failedOperationIds:['broll01']};
 const x=assessMasterDirectorDelivery(p,r,render(p),f);
 assert.equal(x.status,'PROVISIONAL_EXPORT_OPTION');
 assert.equal(x.mayPublish,false);assert.equal(x.requiresUserExportDecision,true);
 assert.ok(x.options.includes('finish-manually-in-capcut'));
});
test('no render, wrong timeline or flattened project prevents provisional export',()=>{
 const p=plan(),r=registry(p),f={kind:'optional-operation',failedOperationIds:['broll01']};
 assert.equal(assessMasterDirectorDelivery(p,r,{},f).status,'REPAIR_REQUIRED');
 assert.equal(assessMasterDirectorDelivery(p,r,{...render(p),fingerprint:'bad'},f).status,'REPAIR_REQUIRED');
 assert.equal(assessMasterDirectorDelivery(p,r,{...render(p),projectEditable:false},f).status,'REPAIR_REQUIRED');
});
test('unknown failed operation cannot masquerade as benign defect',()=>{
 const p=plan(),r=registry(p);
 assert.equal(assessMasterDirectorDelivery(p,r,render(p),{kind:'optional-operation',failedOperationIds:['other']}).status,'BLOCKED');
});
test('without independent QA a playable file is not declared final',()=>{
 const p=plan(),r=registry(p);
 assert.equal(assessMasterDirectorDelivery(p,r,render(p),{kind:'none',failedOperationIds:[]}).status,'PROVISIONAL_EXPORT_OPTION');
 r.creativeAcceptedFingerprint=masterDirectorFingerprint(p);r.finalQAAcceptedFingerprint=masterDirectorFingerprint(p);
 // A claimed QA flag alone must not certify a real file.
 assert.equal(assessMasterDirectorDelivery(p,r,render(p),{kind:'none',failedOperationIds:[]}).status,'PROVISIONAL_EXPORT_OPTION');
 r.trustedVerifierIds=['qa-system'];
 r.qaPasses=['qa-first','qa-second'].map(runId=>({fingerprint:masterDirectorFingerprint(p),completed:true,verifierId:'qa-system',runId,
   evidence:p.operations.map(op=>({operationId:op.id,proofs:op.requiredQA.map(kind=>({kind,passed:true,artifactSha256:output}))}))}));
 const verified={...render(p),executionManifest:{fingerprint:masterDirectorFingerprint(p),operations:p.operations.map(op=>({id:op.id,renderer:op.renderer,effect:op.effect,start:op.start,end:op.end,outputSha256:output}))}};
 const x=assessMasterDirectorDelivery(p,r,verified,{kind:'none',failedOperationIds:[]});
 assert.equal(x.status,'FINAL_FILE_REVIEW');assert.equal(x.mayPublish,false);
});

test('the review offers both supervision and autonomous mode with a narrative phase timeline',()=>{
 const p=plan(),r=registry(p);
 p.creativeContext.arc=[
  {id:'beat-hook',phase:'hook',start:0,end:3,purpose:'Interrumpir el scroll'},
  {id:'beat-change',phase:'transformation',start:3,end:6,purpose:'Cambiar perspectiva'}
 ];
 const view=buildMasterDirectorReview(p,r);
 assert.equal(view.status,'READY_FOR_CHOICE');
 assert.ok(view.choices.includes('autonomous'));
 assert.equal(view.narrativeTimeline[0].phase,'hook');
 assert.equal(view.narrativeTimeline[0].start,0);
 assert.ok(view.narrativeTimeline[1].operations.length>0);
});
