import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareFilmDirectorBaseTrack} from '../src/master-director-brief-base-track.js';
const hash=c=>c.repeat(64);
const annex={schema:'sues-master-film-brief-translation/v1',canExecute:false,approved:false,
 translationCoverage:{lostLines:0},sourceBriefSha256:hash('d'),sourceSha256:hash('a'),
 originalSha256:hash('b'),timelineFingerprint:hash('c'),fps:30,duration:3,
 workingClock:'verified-CFR30-no-cuts',scenes:[{id:'scene-01',editStart:0,editEnd:3,
 shots:[
 {id:'a',sceneId:'scene-01',kind:'camera',base:'CARLOS',sourceStart:0,sourceEnd:1,editStart:0,editEnd:1,sourceLine:1,overlayResourceHints:['M01']},
 {id:'b',sceneId:'scene-01',kind:'broll',base:'B01',resourceHint:'B01',sourceStart:1,sourceEnd:2,editStart:1,editEnd:2,sourceLine:2,overlayResourceHints:[]},
 {id:'c',sceneId:'scene-01',kind:'motion',base:'M02',resourceHint:'M02',sourceStart:2,sourceEnd:3,editStart:2,editEnd:3,sourceLine:3,overlayResourceHints:[]}
 ]}]};
test('the complete base track preserves source audio and all resource slot timings',()=>{
 const x=prepareFilmDirectorBaseTrack(annex);
 assert.equal(x.status,'PREPARED_NOT_EXECUTABLE');assert.equal(x.frameCount,90);
 assert.equal(x.shotCount,3);assert.equal(x.segments[0].preservation,'RETAIN_ORIGINAL_CAMERA_WITH_SOURCE_AUDIO');
 assert.equal(x.segments[0].overlays[0].slot,'M01');
 assert.equal(x.segments[1].transitionPolicy,'IN_AND_OUT_MUST_BE_EXPLICITLY_APPROVED');
 assert.equal(x.segments[1].resourceSlot,'B01');assert.equal(x.segments[2].resourceSlot,'M02');
 assert.deepEqual(x.resourceRequirements.map(r=>r.slot),['M01','B01','M02']);
 assert.ok(x.segments.every(s=>s.sourceAudioPolicy==='CONTINUOUS_ORIGINAL_RECORDING_NO_UNAPPROVED_CUTS'));
 assert.ok(x.segments.every(s=>s.canExecute===false));
 assert.equal(x.approved,false);assert.equal(x.canExecute,false);
});
test('uncovered frames and untrusted timeline lineage block the new EDL',()=>{
 const gap=structuredClone(annex);gap.scenes[0].shots[1].editStart=1.2;
 assert.equal(prepareFilmDirectorBaseTrack(gap).code,'SHOT_COVERAGE_NOT_SAFE');
 const different=structuredClone(annex);different.timelineFingerprint='unverified';
 assert.equal(prepareFilmDirectorBaseTrack(different).code,'SOURCE_TIMELINE_LINEAGE_NOT_VERIFIED');
 const wrongClock=structuredClone(annex);wrongClock.workingClock='original-VFR';
 assert.equal(prepareFilmDirectorBaseTrack(wrongClock).code,'SOURCE_TIMELINE_LINEAGE_NOT_VERIFIED');
});
