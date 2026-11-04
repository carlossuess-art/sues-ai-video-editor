import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MASTER_RULE_PRECEDENCE,masterDirectorFingerprint,reviewMasterDirectorPlan,auditMasterDirectorExecution
} from '../src/master-director-gate.js';

const source='a'.repeat(64),master='b'.repeat(64),assetSha='c'.repeat(64),output='d'.repeat(64);
const sample=()=>({
  schema:'sues-master-director/v1',
  source:{sha256:source,type:'original',editable:true,flattened:false},
  timeline:{fingerprint:'edit-v1',timeSpace:'edit-timeline',fps:30,duration:6},
  rules:{version:'rules-v1',precedence:[...MASTER_RULE_PRECEDENCE],unresolvedConflicts:[],
    lockedMasters:[{id:'tapiz-antracita',sha256:master}]},
  scenes:[
    {id:'intro',start:0,end:3,purpose:'Presentar el conflicto'},
    {id:'desarrollo',start:3,end:6,purpose:'Desarrollar el argumento'}
  ],
  operations:[
    {id:'caption-1',sceneId:'intro',renderer:'native',effect:'caption',start:.2,end:2.8,
      reason:'Subtitular las palabras pronunciadas',dependsOn:[],requiredQA:['rendered-frame','time-sync']},
    {id:'broll-1',sceneId:'desarrollo',renderer:'remotion',effect:'subject-occlusion',start:3.1,end:5.7,
      reason:'Reforzar la metáfora sin cubrir al sujeto',dependsOn:['caption-1'],
      resourceId:'video-licensed-1',requiredQA:['rendered-frame','motion-playback']}
  ]
});
const context=()=>({
 sourceSha256:source,timelineFingerprint:'edit-v1',approvedRuleVersion:'rules-v1',
 masterHashes:{'tapiz-antracita':master},
 rendererCapabilities:{native:['caption'],remotion:['subject-occlusion']},
 licensedAssets:{'video-licensed-1':{sha256:assetSha,rightsVerified:true,commercialUseAllowed:true}},
 trustedVerifierIds:['qa-sistema']
});
const ready=()=>{
 const p=sample(),r=context();r.approvedPlanFingerprint=masterDirectorFingerprint(p);return {p,r};
};
const manifest=p=>({fingerprint:masterDirectorFingerprint(p),operations:p.operations.map(o=>({
 id:o.id,renderer:o.renderer,effect:o.effect,start:o.start,end:o.end,outputSha256:output
}))});
const qaPass=p=>({fingerprint:masterDirectorFingerprint(p),completed:true,verifierId:'qa-sistema',
 evidence:p.operations.map(o=>({operationId:o.id,proofs:o.requiredQA.map(kind=>({kind,passed:true,artifactSha256:output}))}))});

test('the brain awaits explicit approval even when the draft is valid',()=>{
 const p=sample(),r=context(),result=reviewMasterDirectorPlan(p,r);
 assert.equal(result.status,'AWAITING_PLAN_APPROVAL');
 r.approvedPlanFingerprint=result.fingerprint;
 assert.equal(reviewMasterDirectorPlan(p,r).status,'READY_TO_EXECUTE');
 assert.equal(auditMasterDirectorExecution(p,r,manifest(p)).status,'QA_REJECTED');
});

test('a flattened MP4, foreign timeline, or changed approved master blocks execution',()=>{
 const {p,r}=ready();
 p.source.flattened=true;
 assert.ok(reviewMasterDirectorPlan(p,r).issues.some(x=>x.code==='EDITABLE_ORIGINAL_REQUIRED'));
 p.source.flattened=false;
 r.timelineFingerprint='edit-v2';
 assert.ok(reviewMasterDirectorPlan(p,r).issues.some(x=>x.code==='TIMELINE_CONTRACT_MISMATCH'));
 r.timelineFingerprint='edit-v1';
 r.masterHashes['tapiz-antracita']='e'.repeat(64);
 assert.ok(reviewMasterDirectorPlan(p,r).issues.some(x=>x.code==='MASTER_MISMATCH'));
});

test('unsupported renderer capability cannot be silently substituted',()=>{
 const {p,r}=ready();r.rendererCapabilities.remotion=[];
 assert.ok(reviewMasterDirectorPlan(p,r).issues.some(x=>x.code==='RENDERER_CAPABILITY_UNVERIFIED'));
 p.operations[1].effect='simple-overlay';
 assert.ok(reviewMasterDirectorPlan(p,r).issues.some(x=>x.code==='RENDERER_CAPABILITY_UNVERIFIED'));
});

test('unlicensed assets, rule conflicts, missing narrative purpose and coverage are blockers',()=>{
 const {p,r}=ready();r.licensedAssets['video-licensed-1'].commercialUseAllowed=false;
 assert.ok(reviewMasterDirectorPlan(p,r).issues.some(x=>x.code==='ASSET_RIGHTS_UNVERIFIED'));
 r.licensedAssets['video-licensed-1'].commercialUseAllowed=true;
 p.rules.unresolvedConflicts=['tapiz'];
 assert.ok(reviewMasterDirectorPlan(p,r).issues.some(x=>x.code==='UNRESOLVED_RULE_CONFLICTS'));
 p.rules.unresolvedConflicts=[];
 p.scenes[0].purpose='';
 assert.ok(reviewMasterDirectorPlan(p,r).issues.some(x=>x.code==='SCENE_TIMELINE_OR_PURPOSE_INVALID'));
 p.scenes[0].purpose='Una entrada';
 p.scenes[1].end=5;
 assert.ok(reviewMasterDirectorPlan(p,r).issues.some(x=>x.code==='SCENE_COVERAGE_INCOMPLETE'));
});

test('missing dependencies and dependency cycles are rejected before rendering',()=>{
 const {p,r}=ready();p.operations[1].dependsOn=['missing'];
 assert.ok(reviewMasterDirectorPlan(p,r).issues.some(x=>x.code==='MISSING_DEPENDENCY'));
 p.operations[1].dependsOn=['caption-1'];p.operations[0].dependsOn=['broll-1'];
 assert.ok(reviewMasterDirectorPlan(p,r).issues.some(x=>x.code==='DEPENDENCY_CYCLE'));
});

test('revision changes invalidate plan approval and old QA proofs',()=>{
 const {p,r}=ready(),oldApproval=r.approvedPlanFingerprint;
 const originalPass=qaPass(p);
 p.operations[0].reason='Subtitular exactamente cada palabra nueva';
 assert.notEqual(masterDirectorFingerprint(p),oldApproval);
 assert.equal(reviewMasterDirectorPlan(p,r).status,'AWAITING_PLAN_APPROVAL');
 r.approvedPlanFingerprint=masterDirectorFingerprint(p);
 r.qaPasses=[originalPass,originalPass];
 assert.ok(auditMasterDirectorExecution(p,r,manifest(p)).issues.some(x=>x.code==='TWO_INDEPENDENT_QA_PASSES_REQUIRED'));
});

test('two complete QA passes and matching manifest still require final creative acceptance',()=>{
 const {p,r}=ready(),m=manifest(p);
 r.qaPasses=[qaPass(p),qaPass(p)];
 assert.equal(auditMasterDirectorExecution(p,r,m).status,'AWAITING_CREATIVE_ACCEPTANCE');
 r.creativeAcceptedFingerprint=masterDirectorFingerprint(p);
 assert.equal(auditMasterDirectorExecution(p,r,m).status,'READY_FOR_RELEASE');
 r.qaPasses[1].evidence[1].proofs[0].passed=false;
 assert.ok(auditMasterDirectorExecution(p,r,m).issues.some(x=>x.code==='QA_PROOF_MISSING_OR_FAILED'));
});

test('a renderer declaration alone never proves its executed output',()=>{
 const {p,r}=ready();
 r.qaPasses=[qaPass(p),qaPass(p)];
 const m=manifest(p);m.operations[0].end=2.6;
 assert.ok(auditMasterDirectorExecution(p,r,m).issues.some(x=>x.code==='EXECUTED_OPERATION_MISMATCH'));
});
