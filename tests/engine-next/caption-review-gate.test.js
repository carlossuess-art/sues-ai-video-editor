import test from 'node:test';import assert from 'node:assert/strict';
import {auditAsrCaptionWindow} from '../../src/engine-next/caption-review-gate.js';
const args={sourceSha256:'a'.repeat(64),voiceSha256:'b'.repeat(64),start:9.5,end:13.5};
const words=[{text:'antes',start:9.15,end:9.4,confidence:.9},{text:'molestar,',start:9.5,end:9.94,confidence:.97},{text:'hacer',start:10.44,end:10.62,confidence:.436},{text:'funciona,',start:13.16,end:13.5,confidence:.93},{text:'después',start:13.86,end:14.1,confidence:.91}];
test('flags exact edge words and confidence without silently removing boundary context',()=>{
 const d=auditAsrCaptionWindow({...args,words});assert.equal(d.candidateWordCount,3);
 assert.deepEqual(d.candidates.map(x=>x.text),['molestar,','hacer','funciona,']);
 assert.ok(d.issues.some(x=>x.code==='LOW_CONFIDENCE'&&x.sourceIndex===2));
 assert.ok(d.issues.some(x=>x.code==='LEFT_BOUNDARY_MAY_CLIP_WORD'));
 assert.ok(d.issues.some(x=>x.code==='RIGHT_BOUNDARY_MAY_CLIP_WORD'));
 assert.ok(d.boundaryContext.some(x=>x.text==='antes'));assert.ok(d.boundaryContext.some(x=>x.text==='después'));
 assert.equal(d.stagedClipCount,0);assert.equal(d.automaticallyApproved,false);
});
test('never promotes apparently high confidence words to approved captions',()=>{
 const d=auditAsrCaptionWindow({...args,words:[{text:'sí',start:10,end:10.25,confidence:1}]});
 assert.equal(d.status,'REQUIRES_HUMAN_REVIEW');assert.equal(d.geometryVerified,false);assert.equal(d.stagedClipCount,0);
});
test('detects subframe words, boundaries, overlaps and rejects fabricated sources',()=>{
 const d=auditAsrCaptionWindow({...args,words:[{text:'a',start:9.5,end:9.51,confidence:1},{text:'b',start:9.52,end:9.9,confidence:1}]});
 assert.ok(d.issues.some(x=>x.code==='SUBFRAME_DURATION'));
 assert.throws(()=>auditAsrCaptionWindow({...args,sourceSha256:'invalid',words}));
 assert.throws(()=>auditAsrCaptionWindow({...args,words:[words[2],words[0]]}));
});
