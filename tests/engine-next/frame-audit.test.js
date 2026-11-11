import test from 'node:test';import assert from 'node:assert/strict';
import {parseSsim,assessFrameEvidence} from '../../src/engine-next/frame-audit.js';
test('extracts exact RGB SSIM evidence from FFmpeg stderr',()=>{
 const report='[Parsed_ssim_0 @ 0x1] SSIM R:0.874580 (9.016336) G:0.877654 (9.124099) B:0.875105 (9.034558) All:0.875780 (9.058076)';
 assert.deepEqual(parseSsim(report),{r:.874580,g:.877654,b:.875105,all:.875780});
});
test('rejects blank, repeated or fabricated SSIM evidence',()=>{
 for(const s of ['', 'All:1.0', 'SSIM R:NaN G:1 B:1 All:1', 'SSIM R:2 (1) G:1 (1) B:1 (1) All:2'])assert.throws(()=>parseSsim(s));
});
test('reports audit evidence without confusing it with visual QA',()=>{
 const rows=[{time:.4,width:1080,height:1920,ssim:{all:.875}},{time:2.5,width:1080,height:1920,ssim:{all:.861}}];
 const result=assessFrameEvidence(rows,{expectedCount:2});assert.equal(result.status,'EVIDENCE_ONLY_NOT_CINEMATIC_QA');assert.equal(result.minimumSsim,.861);
 assert.throws(()=>assessFrameEvidence(rows,{expectedCount:3}));
});