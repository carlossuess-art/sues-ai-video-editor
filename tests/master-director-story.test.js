import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectMasterDirectorStory,compileMasterDirectorStory} from '../src/master-director-story.js';
import {reviewMasterDirectorPlan} from '../src/master-director-gate.js';
const source='a'.repeat(64),master='b'.repeat(64),asset='c'.repeat(64);
const sample=()=>({
 schema:'sues-master-story/v1',sourceSha256:source,
 timeline:{fingerprint:'edit-001',timeSpace:'edit-timeline',fps:30,duration:60},
 visual:{mode:'brand-sues'},
 narrative:{centralMessage:'El miedo y la libertad',intendedExperience:'Una tensión que termina liberándose',
  scenes:[{id:'intro',start:0,end:30,purpose:'Introducir el miedo'},
          {id:'cierre',start:30,end:60,purpose:'Resolver el miedo'}],
  motifs:[{id:'cadena',setupSceneId:'intro',payoffSceneId:'cierre',
    meaning:'La cadena cerrada reaparece y se rompe'}]},
 resources:[{id:'cadena-recurso',source:'library',assetId:'chain-verified',expectedSha256:asset}],
 operations:[
  {id:'cadena-entrada',sceneId:'intro',start:5,end:8,track:'broll',effect:'subject-occlusion',
   renderer:'remotion',resourceRef:'cadena-recurso',motifId:'cadena',
   reason:'Mostrar la opresión sin tapar al sujeto',parameters:{layer:1},
   dependsOn:[],requiredQA:['rendered-frame','motion-playback','narrative-review']},
  {id:'cadena-salida',sceneId:'cierre',start:51,end:54,track:'broll',effect:'subject-occlusion',
   renderer:'remotion',resourceRef:'cadena-recurso',motifId:'cadena',
   reason:'Recuperar la metáfora en su desenlace',parameters:{layer:1},
   dependsOn:['cadena-entrada'],speechAnchor:{wordId:'word-51',offsetFrames:0},
   requiredQA:['rendered-frame','motion-playback','narrative-review']}
 ]
});
const trusted=()=>({
 sourceSha256:source,timelineFingerprint:'edit-001',approvedRuleVersion:'rules-v1',
 masterHashes:{'sues-tapiz-antracita':master},
 lockedMastersByMode:{'brand-sues':[{id:'sues-tapiz-antracita',sha256:master}]},
 rendererCapabilities:{remotion:['subject-occlusion']},
 licensedAssets:{'chain-verified':{sha256:asset,rightsVerified:true,commercialUseAllowed:true}},
 approvedReferenceIds:['replica-158623'],wordAnchors:{'word-51':{time:52,text:'liberación'}}
});
test('a long-distance story motif becomes a single auditable orchestration plan',()=>{
 const r=trusted(),s=sample(),out=compileMasterDirectorStory(s,r);
 assert.equal(out.status,'READY_FOR_PLAN_REVIEW');
 assert.deepEqual(out.plan.creativeContext.motifs.map(m=>[m.setupSceneId,m.payoffSceneId]),[['intro','cierre']]);
 assert.equal(out.plan.operations[1].resourceId,'chain-verified');
 assert.equal(reviewMasterDirectorPlan(out.plan,r).status,'AWAITING_PLAN_APPROVAL');
});
test('an ideal missing B-roll becomes a creation request, not a cheaper effect',()=>{
 const s=sample();s.resources=[{id:'cadena-recurso',source:'generate',kind:'video',
  creationBrief:'Realistic chain breaking behind the foreground subject'}];
 const out=compileMasterDirectorStory(s,trusted());
 assert.equal(out.status,'NEEDS_RESOURCES');
 assert.equal(out.plan,null);assert.equal(out.assetRequests.length,1);
});
test('generated video can be used only after rights, hash and catalogue registration',()=>{
 const s=sample();s.resources=[{id:'cadena-recurso',source:'generate',kind:'video',
  creationBrief:'Realistic chain breaking behind the foreground subject'}];
 const r=trusted();r.generatedAssets={'cadena-recurso':{assetId:'new-video',sha256:asset}};
 assert.equal(inspectMasterDirectorStory(s,r).status,'NEEDS_RESOURCES');
 r.licensedAssets['new-video']={sha256:asset,rightsVerified:true,commercialUseAllowed:true};
 assert.equal(compileMasterDirectorStory(s,r).plan.operations[0].resourceId,'new-video');
});
test('brand visuals cannot be replaced by an unauthorized reference',()=>{
 const s=sample();s.visual={mode:'reference-exact',referenceId:'not-allowed'};
 assert.ok(inspectMasterDirectorStory(s,trusted()).issues.some(x=>x.code==='REFERENCE_NOT_AUTHORIZED'));
});
test('locked tapiz sha is read from trusted registry, not from creative prompt',()=>{
 const r=trusted();r.masterHashes['sues-tapiz-antracita']='f'.repeat(64);
 assert.ok(inspectMasterDirectorStory(sample(),r).issues.some(x=>x.code==='MASTERS_NOT_VERIFIED'));
});
test('source or cut revision invalidates the story',()=>{
 const r=trusted();r.timelineFingerprint='other';
 assert.ok(inspectMasterDirectorStory(sample(),r).issues.some(x=>x.code==='TIMELINE_NOT_VERIFIED'));
});
test('word-linked animation needs real transcription evidence',()=>{
 const r=trusted();r.wordAnchors={};
 assert.ok(inspectMasterDirectorStory(sample(),r).issues.some(x=>x.code==='SPEECH_ANCHOR_UNVERIFIED'));
});
test('metaphor must have both setup and payoff operations',()=>{
 const s=sample();delete s.operations[1].motifId;
 assert.ok(inspectMasterDirectorStory(s,trusted()).issues.some(x=>x.code==='MOTIF_NOT_EXECUTED_BOTH_SIDES'));
});
test('unlicensed asset is never silently accepted',()=>{
 const r=trusted();r.licensedAssets['chain-verified'].commercialUseAllowed=false;
 assert.ok(inspectMasterDirectorStory(sample(),r).issues.some(x=>x.code==='LIBRARY_ASSET_UNVERIFIED'));
});
test('renderer must support requested effect',()=>{
 const r=trusted();r.rendererCapabilities.remotion=[];
 assert.ok(inspectMasterDirectorStory(sample(),r).issues.some(x=>x.code==='CAPABILITY_UNVERIFIED'));
});
test('a sound event must include listening and sync checks',()=>{
 const s=sample();s.operations[0].track='sfx';s.operations[0].requiredQA=['rendered-frame'];
 assert.ok(inspectMasterDirectorStory(s,trusted()).issues.some(x=>x.code==='QA_INSUFFICIENT'));
});
test('scene gaps and circular dependencies stop compilation',()=>{
 const s=sample();s.narrative.scenes[1].start=31;
 assert.ok(inspectMasterDirectorStory(s,trusted()).issues.some(x=>x.code==='SCENE_TIMING_INVALID'));
 s.narrative.scenes[1].start=30;s.operations[0].dependsOn=['cadena-salida'];
 assert.ok(inspectMasterDirectorStory(s,trusted()).issues.some(x=>x.code==='DEPENDENCY_CYCLE'));
});
test('resource references cannot be fabricated by the skill',()=>{
 const s=sample();s.operations[0].resourceRef='not-in-inventory';
 assert.ok(inspectMasterDirectorStory(s,trusted()).issues.some(x=>x.code==='UNKNOWN_RESOURCE'));
});
