import test from 'node:test';import assert from 'node:assert/strict';
import {checkExportParityEvidence} from '../../src/engine-next/export-parity-audit.js';
const video={codec_name:'h264',width:1080,height:1920,r_frame_rate:'30/1',nb_frames:'15'};
test('reports similarity as evidence, not release approval',()=>{const x=checkExportParityEvidence({video,expectedFrames:15,ssim:{all:.976552}});assert.equal(x.highSimilarity,true);assert.equal(x.cinematicQA,false);assert.equal(x.frames,15);});
test('rejects wrong fps, dimensions, frame count and missing similarity',()=>{
 for(const v of [{...video,nb_frames:'14'}, {...video,height:1080},{...video,r_frame_rate:'29/1'}])assert.throws(()=>checkExportParityEvidence({video:v,expectedFrames:15,ssim:{all:.9}}));
 assert.throws(()=>checkExportParityEvidence({video,expectedFrames:15,ssim:{all:NaN}}));
});