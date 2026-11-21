import test from 'node:test';import assert from 'node:assert/strict';
import {validateTemporalMatteEvidence} from '../../src/engine-next/temporal-matte-evidence.js';
const hash='a'.repeat(64);const sample={schema:'sues-modnet-temporal-candidate/v1',status:'CANDIDATE_NOT_VERIFIED',sourceSha256:hash,modelSha256:hash,outputSha256:hash,startSeconds:9.5,durationSeconds:4,frames:120,fps:30,width:512,height:896,coverageMin:.4,coverageMax:.6};
const probe={codec_name:'ffv1',pix_fmt:'gray',width:512,height:896,nb_frames:'120'};
test('accepts only temporally bound 120-frame mask as unverified candidate',()=>{const r=validateTemporalMatteEvidence(sample,probe,{sourceSha256:hash,expectedStart:9.5,expectedFrames:120});assert.equal(r.visualQA,false);assert.equal(r.end,13.5);});
test('rejects missing time, source, codec, frame count or invented QA status',()=>{
 for(const v of [{...sample,sourceSha256:'f'.repeat(64)},{...sample,status:'APPROVED'},{...sample,frames:119},{...sample,startSeconds:9.51},{...sample,coverageMax:2}])assert.throws(()=>validateTemporalMatteEvidence(v,probe,{sourceSha256:hash,expectedStart:9.5,expectedFrames:120}));
 assert.throws(()=>validateTemporalMatteEvidence(sample,{...probe,nb_frames:'119'}));
});