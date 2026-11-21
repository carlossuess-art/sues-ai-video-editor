import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {stageReel158404B01Candidate,B01_NATIVE_CANDIDATE} from '../../src/engine-next/reel-158404-b01-native-candidate.js';
const g=JSON.parse(readFileSync(new URL('../../docs/engine-next/REEL_158404_ENGINE_GAP_LEDGER.json',import.meta.url)));
const src='9e06f49c30731d8a57aed312cfb46281bcffb7b3d5d62bf5a2164333944ccaad',voice='4ef5fdaa558de448dcc8f42bfd69cbbc6f41e1d7df99c977ae55731f55fb70c0';
const evidence={fileSha256:B01_NATIVE_CANDIDATE.assetSha256,fileBytes:1312406,videoEvidence:{codec:'h264',width:1080,height:1920,fps:30,duration:2.4,frames:72}};
function fixture(){
 const clips=[
 {id:'sues_video_source',kind:'video',track:'V1',start:0,in:0,duration:73.766667,locked:true,props:{x:0,y:0,scale:1,fit:'cover'}},
 {id:'sues_audio_original',kind:'audio',track:'A1',start:0,in:0,duration:73.766667,locked:true,props:{volume:.8}},
 {id:'sues_b02_child_review_only',kind:'image',track:'V2',start:9.5,in:0,duration:4,props:{x:180,y:-250,scale:.73}},
 {id:'sues_alpha_hand_review_only',kind:'video',track:'V3',start:22.88,in:0,duration:.96,disabled:true},
 {id:'sues_title_after_word',kind:'text',track:'V4',start:2.28,in:0,duration:.85,disabled:true},
 {id:'sues_hyperframes_gold_3d_review_only',kind:'video',track:'V5',start:10.6,in:0,duration:1.2,disabled:true},
 {id:'sues_b02_carlos_foreground_luma_qa',kind:'video',track:'V3',start:9.5,in:9.5,duration:4},
 {id:'sues_b02_temporal_luma_qa',kind:'video',track:'V4',start:9.5,in:0,duration:4}
 ];
 const project={name:'7 scenes provisional review',revision:29,width:1080,height:1920,fps:30,clips,
  media:Array.from({length:9},(_,i)=>({id:'m'+i,src:'/media/resource'+i})),markers:[{t:0,label:'S01'}],inPoint:0,outPoint:73.766667};
 const coverage={schema:'sues-native-reel-review-bridge/v1',operationCount:49,pendingUninstantiatedOperations:31,stagedFableCutRevision:28,nativeMultilayerCandidateOperations:1,
  originalSourceSha256:src,originalVoiceSha256:voice,sourceDurationSeconds:73.766667,
  guardrails:{noArtisticApproval:true},limitations:[],operations:g.operations.map(o=>({operationId:o.operationId,sceneId:o.sceneId,
    planStart:o.start,planEnd:o.end,state:'NOT_STAGED',clipIds:[],creativeApproved:false,renderProvenForFullOperation:false}))};
 return {project,coverage};
}
test('only verified 72f Pexels B01 attaches as full-frame native unapproved clip and retains 49 ops',()=>{
 const f=fixture(),old=structuredClone(f),{nativeProject:p,crosswalk:c}=stageReel158404B01Candidate(f.project,f.coverage,g,evidence);
 assert.deepEqual(f,old);assert.equal(p.revision,30);assert.equal(p.clips.length,9);assert.equal(p.media.length,10);
 assert.deepEqual(p.clips.slice(0,8),f.project.clips);
 const b=p.clips.at(-1);assert.equal(b.id,B01_NATIVE_CANDIDATE.clipId);assert.equal(b.start,3.2);assert.equal(b.duration,2.4);
 assert.equal(b.track,'V2');assert.equal(b.kind,'video');assert.equal(b.props.volume,0);assert.equal(b.props.fit,'cover');
 assert.deepEqual(b.transitionIn,{type:'fade',duration:.2});assert.deepEqual(b.transitionOut,{type:'fade',duration:.2});
 assert.equal(c.operations.length,49);assert.equal(c.pendingUninstantiatedOperations,30);assert.equal(c.nativeMultilayerCandidateOperations,2);assert.equal(c.additionalCandidateResources.length,1);
 assert.equal(c.additionalCandidateResources[0].thirdPartyConsentVerified,false);assert.equal(c.additionalCandidateResources[0].cinematicApproval,false);
});
test('never accepts substituted asset, out-of-context duration, unlocked source or mismatched approved operations',()=>{
 for(const f of [
  (p,c,e)=>e.fileSha256='a'.repeat(64),
  (p,c,e)=>e.videoEvidence.duration=2.5,
  (p,c,e)=>e.videoEvidence.frames=71,
  (p,c,e)=>p.clips[0].locked=false,
  (p,c,e)=>p.clips[3].disabled=false,
  (p,c,e)=>c.operations.find(x=>x.operationId==='shot-1-2').state='APPROVED',
  (p,c,e)=>c.originalVoiceSha256='bad',
 ]){
  const {project,coverage}=fixture();const check=structuredClone(evidence);f(project,coverage,check);
  assert.throws(()=>stageReel158404B01Candidate(project,coverage,g,check));
 }
});
