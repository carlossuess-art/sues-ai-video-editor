import test from 'node:test';import assert from 'node:assert/strict';
import {proposeVfrCfr30Map} from '../src/master-director-vfr-timeline.js';
const sourceSha256='a'.repeat(64);
const make=()=>({sourceSha256,frames:[0,.05,.07,.11,.14,.17].map(x=>({best_effort_timestamp_time:String(x)})),sourceDuration:.2,audioStart:0,audioDuration:.2});
test('VFR proposal maps each CFR presentation instant to a known preceding frame',()=>{
 const r=proposeVfrCfr30Map(make());assert.equal(r.status,'VFR_DERIVATION_PROPOSED_NOT_APPROVED');
 assert.equal(r.targetFrameCount,6);assert.deepEqual(r.segments.map(s=>s.sourceFrame),[0,1,2,3,4]);
 assert.equal(r.duplicateCount,1);assert.equal(r.mappingSha256.length,64);
 assert.equal(proposeVfrCfr30Map(make()).mappingSha256,r.mappingSha256);
});
test('VFR proposal blocks broken evidence, gaps, time shift and insufficient audio',()=>{
 const corrupt=[p=>p.frames[2].best_effort_timestamp_time='.05',p=>p.frames[1].best_effort_timestamp_time='bad',p=>delete p.frames[1].best_effort_timestamp_time,p=>p.audioStart=.1,p=>p.audioDuration=.1,p=>p.sourceDuration=.4,p=>p.sourceSha256='bad'];
 for(const mutate of corrupt){const p=make();mutate(p);assert.equal(proposeVfrCfr30Map(p).status,'BLOCKED');}
});
test('VFR proposal never labels its mapping as verified CFR or approval',()=>{
 const r=proposeVfrCfr30Map(make());assert.notEqual(r.status,'SOURCE_CFR30_VERIFIED');
 assert.ok(r.requires.includes('AUDIO_SYNC_EVIDENCE'));
});

[executed on device: srv1841004 (02556f29-b0ec-42da-81b0-a7ef0e517c98)]