import test from 'node:test';import assert from 'node:assert/strict';
import {compileMasterDirectorSource} from '../src/master-director-source-timeline.js';
const id='a'.repeat(64),composition={schema:'sues-remotion-layers/v1',sourceSha256:id,fps:30,durationFrames:30,layers:[]};
const params=()=>({composition,sourceSha256:id,sourceTiming:'cfr30-verified',sourceHasAudio:true,sourceFit:'fill',sourceDuration:2,timeMap:{sourceDuration:2,spans:[{sourceIn:0,sourceOut:.5,editIn:0,editOut:.5},{sourceIn:1,sourceOut:1.5,editIn:.5,editOut:1}]}});
test('maps source cuts to exact contiguous frame sequences',()=>{
 const result=compileMasterDirectorSource(params());assert.equal(result.status,'READY_FOR_SOURCE_STAGING');
 assert.deepEqual(result.composition.source.spans,[{sourceInFrame:0,startFrame:0,endFrame:15},{sourceInFrame:30,startFrame:15,endFrame:30}]);
});
test('refuses unverified CFR, changed source or non-frame-aligned cuts',()=>{
 for(const mutate of [p=>p.sourceTiming='unknown',p=>p.sourceSha256='b'.repeat(64),p=>p.timeMap.spans[0].sourceOut=.51,p=>p.sourceHasAudio=false,p=>p.timeMap.spans[1].sourceOut=2.5]){
  const p=params();mutate(p);assert.equal(compileMasterDirectorSource(p).status,'BLOCKED');
 }
});
