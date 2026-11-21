import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stageReel158404NativeAssembly} from '../../src/engine-next/reel-158404-native-assembly.js';
const gap=JSON.parse(readFileSync(new URL('../../docs/engine-next/REEL_158404_ENGINE_GAP_LEDGER.json',import.meta.url)));
const SOURCE='9e06f49c30731d8a57aed312cfb46281bcffb7b3d5d62bf5a2164333944ccaad';
const VOICE='4ef5fdaa558de448dcc8f42bfd69cbbc6f41e1d7df99c977ae55731f55fb70c0';
const opts={actualSourceSha256:SOURCE,actualVoiceSha256:VOICE};
const props={x:0,y:0,scale:1,volume:1};
function fixture(){
 const clips=[
 {id:'sues_video_source',mediaId:'m_sues_158404_video',kind:'video',track:'V1',start:0,in:0,duration:73.766667,locked:true,props:{...props}},
 {id:'sues_audio_original',mediaId:'m_sues_158404_audio',kind:'audio',track:'A1',start:0,in:0,duration:73.766667,locked:true,props:{...props,volume:.8}},
 {id:'sues_b02_child_review_only',mediaId:'m_sues_b02_child_refined50_qa',kind:'image',track:'V2',start:9.5,in:0,duration:4,props:{...props,x:180,y:-250,scale:.73},transitionIn:{type:'fade',duration:.3},transitionOut:{type:'fade',duration:.3}},
 {id:'sues_alpha_hand_review_only',mediaId:'m_stop',kind:'video',track:'V3',start:22.88,in:0,duration:.96,props:{...props},disabled:true},
 {id:'sues_title_after_word',kind:'text',track:'V4',start:2.28,in:0,duration:.85,props:{...props}},
 {id:'sues_hyperframes_gold_3d_review_only',kind:'video',mediaId:'m_gold',track:'V5',start:10.6,in:0,duration:1.2,props:{...props},disabled:true},
 {id:'sues_b02_carlos_foreground_luma_qa',mediaId:'m_sues_158404_video',kind:'video',track:'V3',start:9.5,in:9.5,duration:4,props:{...props,matte:'luma',matteTrack:'V4'}},
 {id:'sues_b02_temporal_luma_qa',mediaId:'m_sues_b02_modnet_luma_qa',kind:'video',track:'V4',start:9.5,in:0,duration:4,props:{...props}}
 ];
 const media=[
 {id:'m_sues_158404_video',src:'/media/sues-158404-original.mp4'},
 {id:'m_sues_158404_audio',src:'/media/sues-158404-voice.m4a'},
 {id:'m_sues_b02_child_refined50_qa',src:'/media/sues-child-despill50.png'},
 {id:'m_sues_b02_modnet_luma_qa',src:'/media/sues-158404-b02-modnet-luma-120.mp4'},
 ...Array.from({length:5},(_,i)=>({id:['m_stop','m_gold','extra3','extra4','extra5'][i],src:'/media/resource'+i+'.png'}))
 ];
 return {name:'B02 authentic QA',width:1080,height:1920,fps:30,revision:27,media,clips,
 tracks:[{id:'V5',kind:'video'},{id:'V4',kind:'video'},{id:'V3',kind:'video'},{id:'V2',kind:'video'},{id:'V1',kind:'video'},{id:'A1',kind:'audio'}],
 markers:[{t:9.5,label:'B02 original cue',color:'orange'}],inPoint:9.5,outPoint:13.5,delivery:{preset:'instagram-reels'}};
}
test('full native review timeline contains all 49 scene operations without claiming completion',()=>{
 const before=fixture(),copy=structuredClone(before),{nativeProject:n,coverage:c}=stageReel158404NativeAssembly(before,gap,opts);
 assert.deepEqual(before,copy);assert.equal(n.revision,before.revision+1);
 assert.equal(n.inPoint,0);assert.equal(n.outPoint,73.766667);assert.equal(c.plannedDurationSeconds,73.753467);
 assert.equal(c.sceneCount,7);assert.equal(c.operationCount,49);assert.equal(c.operations.length,49);
 assert.equal(new Set(c.operations.map(x=>x.operationId)).size,49);
 assert.equal(c.cameraOperationsCoveredByContinuousSource,15);assert.equal(c.nativeMultilayerCandidateOperations,1);
 assert.equal(c.disabledLayerCandidates,2);assert.equal(c.pendingUninstantiatedOperations,31);
 assert.equal(n.clips.length,before.clips.length);assert.deepEqual(n.media,before.media);
 assert.deepEqual(n.clips.filter(x=>x.id!=='sues_title_after_word'),before.clips.filter(x=>x.id!=='sues_title_after_word'));
 assert.equal(n.clips.find(x=>x.id==='sues_title_after_word').disabled,true);
 assert.equal(c.operations.find(x=>x.operationId==='shot-2-2').clipIds.length,3);
 assert.equal(c.operations.find(x=>x.operationId==='GIF-STOP-overlay').state,'STAGED_DISABLED');
 assert.equal(c.operations.find(x=>x.operationId==='title-3').state,'NOT_STAGED');
 assert.equal(c.operations.find(x=>x.operationId==='captions-2').state,'NOT_STAGED');
 assert.equal(c.operations.find(x=>x.operationId==='music-scene-07').state,'NOT_STAGED');
 assert.ok(n.markers.length>=15);assert.ok(n.markers.find(m=>m.label.startsWith('S07')));
 for(const op of c.operations){assert.equal(op.creativeApproved,false);assert.equal(op.renderProvenForFullOperation,false)}
 assert.equal(c.guardrails.productionChanged,false);assert.equal(c.guardrails.quantizationNotSilentlyApplied,true);
});
test('fail closed on truncated, changed or falsely approved operation ledger',()=>{
 const a=structuredClone(gap);a.operations.pop();assert.throws(()=>stageReel158404NativeAssembly(fixture(),a,opts),/ledger/);
 const b=structuredClone(gap);b.operations[1].operationId=b.operations[0].operationId;assert.throws(()=>stageReel158404NativeAssembly(fixture(),b,opts),/operation/);
 const c=structuredClone(gap);c.operations[5].start=15;assert.throws(()=>stageReel158404NativeAssembly(fixture(),c,opts),/gap/);
 const d=structuredClone(gap);d.approvedByCarlos=true;assert.throws(()=>stageReel158404NativeAssembly(fixture(),d,opts),/ledger/);
 const e=structuredClone(gap);e.operations.find(x=>x.operationId==='title-4').creativeApproved=true;assert.throws(()=>stageReel158404NativeAssembly(fixture(),e,opts),/operation/);
});
test('fail closed when protected voice, V3 matte, source SHA, B02 geometry or imported clips change',()=>{
 const changes=[
 p=>p.clips[0].locked=false,p=>p.clips[1].duration=73,p=>p.clips[2].props.scale=.8,
 p=>p.clips[6].props.matteTrack='V5',p=>p.clips[7].duration=3,
 p=>p.clips.push({id:'new',kind:'video',start:2,duration:3})
 ];
 for(const change of changes){const x=fixture();change(x);assert.throws(()=>stageReel158404NativeAssembly(x,gap,opts));}
 assert.throws(()=>stageReel158404NativeAssembly(fixture(),gap,{...opts,actualSourceSha256:'0'.repeat(64)}),/source/);
 assert.throws(()=>stageReel158404NativeAssembly(fixture(),gap,{...opts,actualVoiceSha256:'bad'}),/voice/);
});
