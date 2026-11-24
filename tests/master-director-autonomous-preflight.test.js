import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {reviewAutonomousPreproduction} from '../src/master-director-autonomous-preflight.js';
const H=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const a='a'.repeat(64),b='b'.repeat(64),c='c'.repeat(64);
const make=()=>{
 const story={schema:'sues-master-story/v1',sourceSha256:a,
 timeline:{fingerprint:'timeline-01',fps:30,duration:60,timeSpace:'edit-timeline'},
 visual:{mode:'brand-sues'},
 narrative:{centralMessage:'Liberación de bloqueos emocionales',intendedExperience:'Tensión y apertura gradual',
  scenes:[{id:'s1',start:0,end:60,purpose:'Explicar el cambio emocional'}]},
 resources:[{id:'object',source:'library',assetId:'asset1',expectedSha256:c}],
 operations:[{id:'op1',sceneId:'s1',start:10,end:12,track:'broll',effect:'subject-occlusion',
  renderer:'remotion',resourceRef:'object',reason:'Objeto de profundidad detrás de Carlos',
  parameters:{layer:2},dependsOn:[],requiredQA:['rendered-frame','motion-playback','narrative-review']}]
 };
 const registry={sourceSha256:a,timelineFingerprint:'timeline-01',approvedRuleVersion:'rules-v1',unresolvedRuleConflicts:[],
 lockedMastersByMode:{'brand-sues':[{id:'tapiz',sha256:b}]},masterHashes:{tapiz:b},
 rendererCapabilities:{remotion:['subject-occlusion']},licensedAssets:{asset1:{sha256:c,rightsVerified:true,commercialUseAllowed:true}}};
 const fp=H(story),project={projectId:'p_ac513f2e6a',revision:396,sourceSha256:a,timelineFingerprint:'timeline-01',media:[{id:'media1'}]};
 const evidence={projectId:project.projectId,projectRevision:396,
 director:{version:'1.7.4',loadedCompleteRules:true,rulesFingerprint:b,references:Array.from({length:8},(_,i)=>({id:'ref'+i,sha256:b}))},
 sourceAnalysis:{sha256:a,transcriptWordTimesVerified:true,videoFramesInspected:true,faceAndHandsAnalyzed:true,inspectedIntervals:[[0,60]]},
 humanAvPlan:{fingerprint:fp,complete:true,operationIds:['op1']},technicalPlan:{fingerprint:fp,complete:true,operationIds:['op1']},
 wordSelection:{status:'APPROVED_EXISTING',selectionFingerprint:b},
 assets:{object:{resourceId:'object',assetId:'asset1',sha256:c,projectId:project.projectId,fablecutMediaId:'media1',
 registeredInProject:true,physicalShaVerified:true,nativeDecodeVerified:true,visualContentVerified:true,rightsVerified:true}},
 masks:{op1:{operationId:'op1',sourceSha256:a,projectId:project.projectId,verifiedOnOriginal:true,
 noFaceOrHandOcclusion:true,alphaAndFeatherVerified:true,samples:[{time:10,evidenceRef:'frame10'},
 {time:11,evidenceRef:'frame11'},{time:12,evidenceRef:'frame12'}]}},
 preflight:{creative:{status:'PASS',evidenceRef:'QA1'},technical:{status:'PASS',evidenceRef:'QA2'}},
 nativeMapping:{fingerprint:fp,projectId:project.projectId,supported:true,operationIds:['op1']}};
 return {story,registry,project,evidence};
};
test('complete preproduction is ready to plan, never automatically approved to execute',()=>{
 const r=reviewAutonomousPreproduction(make());
 assert.equal(r.status,'PREPRODUCTION_READY_NOT_APPROVED');assert.equal(r.canPlanBatches,true);assert.equal(r.canExecute,false);
});
test('Drive-only resource is NOT an imported and decoded FableCut asset',()=>{
 const x=make();x.evidence.assets.object.registeredInProject=false;
 assert.ok(reviewAutonomousPreproduction(x).issues.some(i=>i.code==='FABLECUT_MEDIA_NOT_READY'));
});
test('unverified mask boundaries and protagonist occlusion block all montage',()=>{
 const x=make();x.evidence.masks.op1.noFaceOrHandOcclusion=false;
 assert.ok(reviewAutonomousPreproduction(x).issues.some(i=>i.code==='SUBJECT_MASK_VISUAL_PROOF_MISSING'));
});
test('missing training, word selection or an audit blocks',()=>{
 const x=make();x.evidence.director.references=[];x.evidence.wordSelection.status='PENDING';
 x.evidence.preflight.creative.status='PENDING';const r=reviewAutonomousPreproduction(x);
 assert.ok(r.issues.some(i=>i.code==='FILM_DIRECTOR_TRAINING_NOT_PROVEN'));
 assert.ok(r.issues.some(i=>i.code==='PLAN_COVERAGE_OR_WORD_SELECTION_MISSING'));
 assert.ok(r.issues.some(i=>i.code==='DOUBLE_PREFLIGHT_MISSING'));
});
test('project revision or original changed since planning is stale',()=>{
 const x=make();x.project.revision++;assert.ok(reviewAutonomousPreproduction(x).issues.some(i=>i.code==='PROJECT_OR_SOURCE_STALE'));
});
test('missing graph coverage or unlicensed media fails closed',()=>{
 const x=make();x.evidence.nativeMapping.operationIds=[];x.registry.licensedAssets.asset1.rightsVerified=false;
 const r=reviewAutonomousPreproduction(x);
 assert.ok(r.issues.some(i=>i.code==='EXECUTABLE_MAPPING_NOT_COMPLETE'));
 assert.ok(r.issues.some(i=>i.code==='LIBRARY_ASSET_UNVERIFIED'));
});

test('evidence flag cannot substitute for actual registration in project.media',()=>{
 const x=make();x.project.media=[];const r=reviewAutonomousPreproduction(x);
 assert.ok(r.issues.some(i=>i.code==='FABLECUT_MEDIA_NOT_READY'));
});
test('three repeated mask snapshots do not cover entrance middle and exit',()=>{
 const x=make();x.evidence.masks.op1.samples=[{time:10,evidenceRef:'a'},{time:10,evidenceRef:'b'},{time:10,evidenceRef:'c'}];
 const r=reviewAutonomousPreproduction(x);
 assert.ok(r.issues.some(i=>i.code==='SUBJECT_MASK_VISUAL_PROOF_MISSING'));
});
