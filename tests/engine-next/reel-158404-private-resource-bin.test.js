import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {stageVerifiedResourceBin,VERIFIED_BIN_CANDIDATES} from '../../src/engine-next/reel-158404-private-resource-bin.js';
const gap=JSON.parse(readFileSync(new URL('../../docs/engine-next/REEL_158404_ENGINE_GAP_LEDGER.json',import.meta.url)));
function fixture(){
 const project={width:1080,height:1920,fps:30,revision:31,inPoint:0,outPoint:73.766667,
   media:[{id:'m_sues_158404_video',src:'/media/sues-158404-original.mp4'},{id:'m_sues_158404_audio',src:'/media/sues-158404-voice.m4a'},
     ...Array.from({length:8},(_,i)=>({id:`m${i}`,src:`/media/local${i}.mp4`}))],
   clips:[{id:'sues_video_source',locked:true,kind:'video',track:'V1',start:0,duration:73.766667},
          {id:'sues_audio_original',locked:true,kind:'audio',track:'A1',start:0,duration:73.766667},
          {id:'sues_b02_child_review_only',kind:'image',track:'V2',start:9.5,duration:4},
          {id:'sues_b02_carlos_foreground_luma_qa',kind:'video',track:'V3',start:9.5,duration:4},
          {id:'sues_b02_temporal_luma_qa',kind:'video',track:'V4',start:9.5,duration:4},
          {id:'sues_b01_applause_pexels_review_only',kind:'video',track:'V2',start:3.2,duration:2.4},
          {id:'sues_title_after_word',kind:'text',start:2.28,duration:.85,disabled:true},
          {id:'sues_alpha_hand_review_only',kind:'video',start:22.88,duration:.96,disabled:true},
          {id:'sues_hyperframes_gold_3d_review_only',kind:'video',start:10.6,duration:1.2,disabled:true}]};
 const crosswalk={schema:'sues-native-reel-review-bridge/v1',operationCount:49,pendingUninstantiatedOperations:30,
   nativeMultilayerCandidateOperations:2,limitations:[],operations:gap.operations.map(op=>({operationId:op.operationId,
     state:['shot-1-2','shot-2-2'].includes(op.operationId)?'TECHNICAL_NATIVE_CANDIDATE':
       op.track==='camera'?'AUTHENTIC_SOURCE_CONTINUOUS':
       ['title-1','GIF-STOP-overlay'].includes(op.operationId)?'STAGED_DISABLED':'NOT_STAGED',
     clipIds:[],reason:'Original plan not instantiated',creativeApproved:false,renderProvenForFullOperation:false}))};
 const evidence=VERIFIED_BIN_CANDIDATES.map(x=>({slot:x.slot,filename:x.sourceFilename,sha256:x.sha256,bytes:x.bytes,
   width:x.width,height:x.height,frames:x.frames,duration:x.duration,fps:x.fps,kind:x.kind,
   sampleRate:x.sampleRate,channels:x.channels}));
 return {project,crosswalk,evidence};
}
test('all four authenticated files are visible only as library candidates, preserving 49 planned operations',()=>{
 const f=fixture(),copy=structuredClone(f);
 const {nativeProject:p,crosswalk:c,availability:a}=stageVerifiedResourceBin(f.project,f.crosswalk,gap,f.evidence);
 assert.deepEqual(f,copy);assert.equal(p.revision,32);assert.equal(p.clips.length,9);assert.equal(p.media.length,14);
 assert.deepEqual(p.clips,f.project.clips);assert.equal(c.operations.length,49);
 assert.equal(c.pendingUninstantiatedOperations,30);assert.equal(c.nativeMultilayerCandidateOperations,2);
 assert.equal(a.assetCount,4);assert.equal(a.activeClipsAdded,0);assert.equal(a.all49OperationsPreserved,true);
 assert.equal(a.userApproval,false);assert.equal(a.noMediaGenerated,true);
 assert.deepEqual(a.items.map(x=>x.slot),['B04','B05','M03','IMPACT']);
 for(const v of a.items){assert.equal(v.timelineClipCreated,false);assert.equal(v.creativeApproved,false);}
 for(const id of ['shot-4-2','shot-5-2','shot-5-3','impact-0000']){
  const op=c.operations.find(x=>x.operationId===id);
  assert.equal(op.state,'NOT_STAGED');assert.equal(op.libraryCandidateAvailable,true);
 }
});
test('reject substituted assets, rights/clip approvals, changed source or partial inventory',()=>{
 const changes=[
  f=>f.evidence[0].sha256='a'.repeat(64),
  f=>f.evidence[1].width=120,
  f=>f.evidence[2].frames=159,
  f=>f.evidence[3].duration=1.1,
  f=>f.project.clips[0].locked=false,
  f=>f.project.clips[6].disabled=false,
  f=>f.crosswalk.pendingUninstantiatedOperations=29,
  f=>f.crosswalk.operations.find(x=>x.operationId==='shot-5-2').state='APPROVED',
  f=>f.project.media.pop(),
 ];
 for(const change of changes){const f=fixture();change(f);assert.throws(()=>stageVerifiedResourceBin(f.project,f.crosswalk,gap,f.evidence));}
});
