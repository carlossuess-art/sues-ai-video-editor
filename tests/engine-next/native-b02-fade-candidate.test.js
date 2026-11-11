import test from 'node:test';import assert from 'node:assert/strict';
import {draftB02ChildFade as stage} from '../../src/engine-next/native-b02-fade-candidate.js';
const p=()=>({name:'QA',fps:30,width:1080,height:1920,revision:16,
 clips:[{id:'sues_video_source',locked:true},{id:'sues_audio_original',locked:true},
 {id:'sues_b02_child_review_only',start:9.5,duration:4,track:'V2',props:{opacity:1}},
 {id:'sues_b02_temporal_luma_qa',track:'V4'},
 {id:'sues_b02_carlos_foreground_luma_qa',props:{matteTrack:'V4'}},
 {id:'sues_hyperframes_gold_3d_review_only',disabled:true}]});
test('9-frame IN/OUT fades only the children overlay and preserves 5 other layers',()=>{
 const before=p(),copy=structuredClone(before);const out=stage(before);
 assert.deepEqual(before,copy);assert.equal(out.candidate.revision,17);
 assert.deepEqual(out.candidate.clips.filter((c,i)=>i!==2),before.clips.filter((c,i)=>i!==2));
 assert.deepEqual(out.candidate.clips[2].transitionIn,{type:'fade',duration:.3});
 assert.deepEqual(out.candidate.clips[2].transitionOut,{type:'fade',duration:.3});
 assert.equal(out.proposal.state,'VISUAL_QA_PENDING_NOT_APPROVED');
});
test('source protection, version and real matte binding are required',()=>{
 for(const i of [0,1]){const x=p();x.clips[i].locked=false;assert.throws(()=>stage(x));}
 const x=p();x.clips[4].props.matteTrack='V2';assert.throws(()=>stage(x));
 const y=p();y.clips[5].disabled=false;assert.throws(()=>stage(y));
 const z=p();z.revision=-1;assert.throws(()=>stage(z));
});
test('cannot overwrite an existing transition or silently alter its timing',()=>{
 const x=p();x.clips[2].transitionIn={type:'fade',duration:1};assert.throws(()=>stage(x));
 assert.throws(()=>stage(p(),{fadeFrames:16}));assert.throws(()=>stage(p(),{fadeFrames:2}));
 assert.equal(stage(p(),{fadeFrames:12}).proposal.durationSeconds,.4);
});
