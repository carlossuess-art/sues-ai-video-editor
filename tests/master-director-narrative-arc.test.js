import test from 'node:test';
import assert from 'node:assert/strict';
import {auditMasterDirectorArc} from '../src/master-director-narrative-arc.js';
import {inspectMasterDirectorStory} from '../src/master-director-story.js';
const timeline={fps:30,duration:60,fingerprint:'timeline1',timeSpace:'edit-timeline'};
const phases=['hook','development','emotional-fall','transformation','moral','cta'];
const spans=[[0,3],[3,20],[20,32],[32,47],[47,55],[55,60]];
const arc=()=>phases.map((phase,i)=>({
 id:'beat'+i,phase,start:spans[i][0],end:spans[i][1],
 purpose:'Narrar el momento '+phase,
 evidence:[{kind:'transcript-word',wordId:'w'+i}]
}));
const registry=()=>({arcPolicy:'reel-v1',wordAnchors:Object.fromEntries(
 spans.map(([a,b],i)=>['w'+i,{time:(a+b)/2,text:'texto'+i}]))});
const review=(beats=arc(),r=registry())=>auditMasterDirectorArc({arc:beats},r,timeline);
test('approved viral-copy arc can be verified against the actual transcript',()=>{
 const x=review();assert.equal(x.status,'VALIDATED_ARC');assert.deepEqual(x.issues,[]);
});
test('hook, emotional fall, transformation, moral and CTA are mandatory for reel',()=>{
 const a=arc();a.splice(2,1);
 assert.equal(review(a).status,'SCRIPT_REVIEW_REQUIRED');
 assert.ok(review(a).issues.some(x=>x.code==='REEL_ARC_SEQUENCE_INVALID'));
});
test('optional second emotional fall requires a second transformation in sequence',()=>{
 const a=arc(),r=registry();
 a.splice(4,0,{id:'second-fall',phase:'second-fall',start:47,end:49,purpose:'Segunda caída',
  evidence:[{kind:'transcript-word',wordId:'second-fall'}]},
 {id:'second-transformation',phase:'second-transformation',start:49,end:51,purpose:'Segundo giro',
  evidence:[{kind:'transcript-word',wordId:'second-transform'}]});
 a[6].start=51;
 r.wordAnchors['second-fall']={time:48};r.wordAnchors['second-transform']={time:50};
 assert.equal(review(a,r).status,'VALIDATED_ARC',JSON.stringify(review(a,r).issues));
 a[5].phase='development';assert.equal(review(a,r).status,'SCRIPT_REVIEW_REQUIRED');
});
test('a beat without audio/video evidence must be flagged, not invented',()=>{
 const a=arc();a[2].evidence=[{kind:'transcript-word',wordId:'made-up'}];
 assert.ok(review(a).issues.some(x=>x.code==='REEL_BEAT_EVIDENCE_UNVERIFIED'));
});
test('a verified nonverbal hook can use a real audited video frame',()=>{
 const a=arc(),r=registry();a[0].evidence=[{kind:'audited-frame',frameId:'frame-001'}];
 r.frameEvidence={'frame-001':{verified:true,time:.3}};
 assert.equal(review(a,r).status,'VALIDATED_ARC');
 r.frameEvidence['frame-001'].verified=false;
 assert.ok(review(a,r).issues.some(x=>x.code==='REEL_BEAT_EVIDENCE_UNVERIFIED'));
});
test('times cannot overlap, leave gaps or shorten the CTA',()=>{
 const a=arc();a[3].start=34;
 assert.ok(review(a).issues.some(x=>x.code==='REEL_BEAT_TIMING_INVALID'));
 a[3].start=32;a[5].end=59;
 assert.ok(review(a).issues.some(x=>x.code==='REEL_ARC_COVERAGE_INCOMPLETE'));
});
test('non-reel projects do not accidentally receive a forced viral-copy structure',()=>{
 const r=registry();r.arcPolicy='none';
 assert.equal(review([],r).status,'NOT_APPLICABLE');
});
test('a reel with only technically correct scenes still fails without a verified arc',()=>{
 const original='a'.repeat(64),master='b'.repeat(64);
 const s={schema:'sues-master-story/v1',sourceSha256:original,timeline:{...timeline},
  visual:{mode:'brand-sues'},
  narrative:{centralMessage:'Superar un bloqueo',intendedExperience:'Del miedo a la libertad',
   scenes:[{id:'whole',start:0,end:60,purpose:'Vídeo completo de prueba'}],motifs:[]},
  resources:[],
  operations:[{id:'flash',sceneId:'whole',start:1,end:2,track:'transition',
   renderer:'native',effect:'transition-native',reason:'Una pausa con intención',
   parameters:{kind:'warm'},dependsOn:[],requiredQA:['rendered-frame','motion-playback']}]
 };
 const r={...registry(),sourceSha256:original,timelineFingerprint:'timeline1',
   approvedRuleVersion:'rules-v1',unresolvedRuleConflicts:[],
   lockedMastersByMode:{'brand-sues':[{id:'tapiz',sha256:master}]},
   masterHashes:{tapiz:master},rendererCapabilities:{native:['transition-native']}};
 assert.ok(inspectMasterDirectorStory(s,r).issues.some(x=>x.code==='REEL_ARC_MISSING'));
 s.narrative.arc=arc();
 assert.equal(inspectMasterDirectorStory(s,r).status,'READY_FOR_PLAN_REVIEW',
  JSON.stringify(inspectMasterDirectorStory(s,r).issues));
});

test('observed arc records missing phases without inventing them',()=>{
 const r={...registry(),arcPolicy:'reel-observed-v2'};const a=arc().filter(x=>['hook','development','transformation','cta'].includes(x.phase));
 a[1].end=32;a[2].start=32;a[2].end=55;a[3].start=55;
 const result=review(a,r);assert.equal(result.status,'VALIDATED_ARC',JSON.stringify(result.issues));
 assert.deepEqual(result.unobservedPhases,['emotional-fall','moral']);
});
test('observed arc still requires grounded evidence and ordered phases',()=>{
 const r={...registry(),arcPolicy:'reel-observed-v2'};const a=arc();a[2].evidence=[{kind:'transcript-word',wordId:'not-real'}];
 assert.ok(review(a,r).issues.some(i=>i.code==='REEL_BEAT_EVIDENCE_UNVERIFIED'));
 a[2].phase='cta';assert.ok(review(a,r).issues.some(i=>i.code==='REEL_ARC_SEQUENCE_INVALID'));
 assert.equal(auditMasterDirectorArc({},r,timeline).status,'SCRIPT_REVIEW_REQUIRED');
});
