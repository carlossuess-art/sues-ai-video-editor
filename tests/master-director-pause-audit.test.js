import test from 'node:test';
import assert from 'node:assert/strict';
import {auditMasterPauseCandidates,suggestMasterPauseCandidates} from '../src/master-director-pause-audit.js';
const duration=12,words=[{start:0,end:1,text:'Una'},{start:3,end:4,text:'voz'},{start:5,end:5.5,text:'fluye'},{start:7,end:7.5,text:'bien'},{start:9,end:10,text:'hoy'}];
test('no proposed cut ever acquires execution approval from objective evidence',()=>{
 const report=auditMasterPauseCandidates({words,candidates:[{start:1.1,end:2.4}],duration});
 assert.equal(report.status,'REVIEW_ONLY_NOT_APPROVED');assert.equal(report.technicalCandidates,1);
 assert.equal(report.candidates[0].status,'PENDING_PERCEPTUAL_QA');
 assert.equal(report.candidates[0].durationFrames,39);
 assert.equal(report.canExecute,false);assert.equal(report.approved,false);
});
test('protects expressive silences and does not pretend to listen',()=>{
 const a=auditMasterPauseCandidates({words,candidates:[{start:1.1,end:2.4,expressive:true}],duration});
 assert.equal(a.expressiveCandidates,1);assert.equal(a.candidates[0].status,'EXPRESSIVE_PAUSE_LISTEN_FIRST');
});
test('blocks overlapping speech, insufficient margin, missing boundaries, and tiny pauses',()=>{
 const a=auditMasterPauseCandidates({words,candidates:[{start:.8,end:1.2},{start:1.1,end:2.95},{start:4.601,end:4.610},{start:9.5,end:9.7},{start:10.5,end:10.8}],duration});
 assert.equal(a.candidates[0].code,'OVERLAPS_SPEECH');
 assert.equal(a.candidates[1].code,'OVERLAPPING_CUTS');
 assert.equal(a.candidates[2].code,'CUT_WITHOUT_COMPLETE_FRAME');
 assert.equal(a.candidates[3].code,'OVERLAPS_SPEECH');
 assert.equal(a.candidates[4].code,'UNBOUNDED_SPEECH_GAP');
});
test('cut leaving less than 0.67s pauses is blocked',()=>{
 const a=auditMasterPauseCandidates({words,candidates:[{start:1.1,end:2.8}],duration});
 assert.equal(a.candidates[0].code,'INSUFFICIENT_RETAINED_PAUSE');
});
test('untrusted transcript and unsafe candidates fail closed',()=>{
 assert.equal(auditMasterPauseCandidates({words:[{start:1,end:0,text:'bad'}],candidates:[],duration}).code,'UNTRUSTED_TRANSCRIPT');
 const a=auditMasterPauseCandidates({words,candidates:[{start:2,end:1},{start:2,end:4,approved:true}],duration});
 assert.equal(a.blockedCandidates,2);
});

test('automatically suggested cuts retain voice gap, never claim approval and respect frame boundaries',()=>{
 const suggestions=suggestMasterPauseCandidates([{start:0,end:1,text:'antes'},{start:3,end:4,text:'después'}]);
 assert.equal(suggestions.length,1);
 const result=auditMasterPauseCandidates({words:[{start:0,end:1,text:'antes'},{start:3,end:4,text:'después'}],candidates:suggestions,duration:4});
 assert.equal(result.technicalCandidates,1);assert.equal(result.approved,false);assert.equal(result.canExecute,false);
 assert.ok(result.candidates[0].remainingGapSeconds>=.67);
 const noGap=suggestMasterPauseCandidates([{start:0,end:1,text:'a'},{start:1.2,end:2,text:'b'}]);
 assert.deepEqual(noGap,[]);
});
