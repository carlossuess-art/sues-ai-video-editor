import test from 'node:test';import assert from 'node:assert/strict';
import {parsePsnr,isolateQuadrantChange} from '../../src/engine-next/layer-isolation-audit.js';
test('parses changed and unchanged region PSNR',()=>{
 assert.equal(parsePsnr('[Parsed_psnr_2] PSNR r:27.6 g:24.7 b:20.0 a:inf average:18.290612 min:18 max:18'),18.290612);
 assert.equal(parsePsnr('[Parsed_psnr_2] PSNR r:inf g:inf b:inf a:inf average:inf min:inf max:inf'),Infinity);
});
test('rejects fabricated or repeated numeric reports',()=>{
 assert.throws(()=>parsePsnr(''));assert.throws(()=>parsePsnr('average:18'));
 assert.throws(()=>parsePsnr('PSNR r:1 average:18\nPSNR r:2 average:20'));
});
test('requires pixel difference only in expected quadrant, not proof of cinematic quality',()=>{
 const x=isolateQuadrantChange({'top-left':Infinity,'top-right':18.29,'bottom-left':Infinity,'bottom-right':Infinity});
 assert.equal(x.status,'VISIBLE_CHANGE_CONFINED_TO_EXPECTED_QUADRANT');assert.equal(x.cinematicQA,false);
 assert.equal(isolateQuadrantChange({...x.scores,'bottom-right':25}).status,'NOT_ISOLATED');
 assert.throws(()=>isolateQuadrantChange({'top-right':20}));
});