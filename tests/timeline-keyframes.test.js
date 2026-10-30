import test from 'node:test';
import assert from 'node:assert/strict';
import {validateKeyframes,sampleKeyframes,audioVolumeExpression} from '../src/timeline-keyframes.js';
test('keyframes normalize and interpolate without mutating originals',()=>{
 const k=[{time:0,value:.8},{time:1,value:0},{time:2,value:.8}];
 assert.deepEqual(validateKeyframes(k,{duration:3}),k);
 assert.equal(sampleKeyframes(k,.5,1),.4);assert.equal(sampleKeyframes(k,1,1),0);assert.equal(sampleKeyframes(k,1.5,1),.4);
 assert.ok(audioVolumeExpression(k,.8).includes('if(lt(t,1)'));
 for(const bad of [[{time:3.1,value:0}],[{time:1,value:-.1}],[{time:1,value:.5},{time:1,value:.4}],[{time:0,value:NaN}]])assert.throws(()=>validateKeyframes(bad,{duration:3}));
});
