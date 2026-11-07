import test from 'node:test';import assert from 'node:assert/strict';
import {checkExportParityEvidence,summarizeDecodedFrameHashes} from '../../src/engine-next/export-parity-audit.js';
const video={codec_name:'h264',width:1080,height:1920,r_frame_rate:'30/1',nb_frames:'15'};
test('reports similarity as evidence, not release approval',()=>{const x=checkExportParityEvidence({video,expectedFrames:15,ssim:{all:.976552}});assert.equal(x.highSimilarity,true);assert.equal(x.cinematicQA,false);assert.equal(x.frames,15);});
test('rejects wrong fps, dimensions, frame count and missing similarity',()=>{
 for(const v of [{...video,nb_frames:'14'}, {...video,height:1080},{...video,r_frame_rate:'29/1'}])assert.throws(()=>checkExportParityEvidence({video:v,expectedFrames:15,ssim:{all:.9}}));
 assert.throws(()=>checkExportParityEvidence({video,expectedFrames:15,ssim:{all:NaN}}));
});

test('reports decoded frame identities without claiming a no-duplicate cinematic rule',()=>{
 const frame=h=>`0, 0, 0, 1, 1, ${h}`;
 const s=summarizeDecodedFrameHashes(`#format: frame checks\n${frame('a'.repeat(32))}\n${frame('b'.repeat(32))}\n${frame('b'.repeat(32))}\n`,{expectedFrames:3});
 assert.equal(s.decodedFrames,3);assert.equal(s.distinctFrames,2);assert.equal(s.adjacentDuplicateFrames,1);assert.equal(s.cinematicQA,false);
 assert.throws(()=>summarizeDecodedFrameHashes(frame('a'.repeat(32)),{expectedFrames:3}));
});