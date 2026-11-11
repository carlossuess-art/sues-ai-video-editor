import test from 'node:test';import assert from 'node:assert/strict';
import {compileVerifiedWordCaptions as compile} from '../../src/engine-next/progressive-captions.js';
const w=[{text:'No',start:0,end:.18},{text:'pierdas',start:.2,end:.52},{text:'tu',start:.54,end:.71},{text:'voz.',start:.73,end:1}];
const opts={sourceSha256:'a'.repeat(64),timelineFingerprint:'b'.repeat(64),humanReviewed:true,
 reviewIssues:[],timelineProven:true,geometryVerified:true,anchorX:0,anchorY:350,words:w};
test('conserves every spoken word progressively, including negation, on 30fps grid',()=>{
 const a=compile(opts);assert.equal(a.status,'REVIEW_LAYERS_DISABLED');assert.equal(a.clips.length,4);
 assert.deepEqual(a.clips.map(c=>c.props.text),['No','No pierdas','No pierdas tu','No pierdas tu voz.']);
 assert.ok(a.clips.every(c=>c.disabled&&c.kind==='text'&&c.track==='V5'));
 assert.ok(a.manifest.every((m,i)=>m.wordIndex===i&&m.endFrame>m.startFrame));
});
test('refuses unreviewed real-ASR words and unknown source map',()=>{
 const x=compile({...opts,humanReviewed:false,reviewIssues:['low-confidence'],timelineProven:false});
 assert.equal(x.status,'BLOCKED');assert.equal(x.clips.length,0);assert.equal(x.wordCount,4);
});
test('refuses mixed-frame word collisions, gaps in geometry and missing source signatures',()=>{
 for(const p of [{anchorY:undefined},{sourceSha256:undefined},{words:[w[0],{text:'repeated',start:.01,end:.08}]}]){
  const x=compile({...opts,...p});assert.equal(x.status,'BLOCKED');assert.equal(x.clips.length,0);
 }
});
test('never silently truncates an overlong word',()=>{
 const a=compile({...opts,words:[{text:'extraordinariamenteincomprensiblelarguisimapalabra',start:0,end:1}]});
 assert.equal(a.status,'BLOCKED');assert.ok(a.blocked.some(x=>x.startsWith('UNSAFE_LONG_WORD')));
});