import test from 'node:test';import assert from 'node:assert/strict';
import {classifyMasterSource} from '../src/master-director-source-probe.js';
const good=()=>({frames:Array.from({length:60},(_,i)=>({best_effort_timestamp_time:String(i/30)})),streams:[{codec_type:'video',width:1080,height:1920,sample_aspect_ratio:'1:1'},{codec_type:'audio',start_time:'0.000000',duration:'2.000000'}]});
test('requires every source timestamp to match the 30 fps frame grid',()=>{
 const r=classifyMasterSource(good());assert.equal(r.status,'SOURCE_CFR30_VERIFIED');assert.equal(r.sourceDuration,2);
 const p=good();p.frames[15].best_effort_timestamp_time='.55';assert.equal(classifyMasterSource(p).status,'BLOCKED');
});
test('refuses missing or ambiguous source audio and malformed frame timestamps',()=>{
 const p=good();p.streams.pop();assert.equal(classifyMasterSource(p).status,'BLOCKED');
 const q=good();q.frames[1].best_effort_timestamp_time='unknown';assert.equal(classifyMasterSource(q).status,'BLOCKED');
 const r=good();r.streams[1].start_time='.1';assert.equal(classifyMasterSource(r).status,'BLOCKED');
 const t=good();t.streams[0].tags={rotate:'90'};assert.equal(classifyMasterSource(t).status,'BLOCKED');
});
