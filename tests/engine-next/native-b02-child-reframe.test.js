import test from 'node:test';import assert from 'node:assert/strict';
import {stageB02ChildReframe as stage} from '../../src/engine-next/native-b02-child-reframe.js';
const base=()=>({width:1080,height:1920,fps:30,inPoint:9.5,outPoint:13.5,revision:17,
 media:[{id:'m_sues_b02_child_refined50_qa',src:'/media/sues-child-despill50.png'}],clips:[
 {id:'sues_video_source',locked:true},{id:'sues_audio_original',locked:true},
 {id:'sues_b02_child_review_only',mediaId:'m_sues_b02_child_refined50_qa',start:9.5,duration:4,track:'V2',props:{x:340,y:-160,scale:.85,opacity:1},transitionIn:{type:'fade',duration:.3},transitionOut:{type:'fade',duration:.3}},
 {id:'sues_b02_carlos_foreground_luma_qa',props:{matteTrack:'V4'}},
 {id:'sues_b02_temporal_luma_qa',track:'V4'},
 {id:'sues_hyperframes_gold_3d_review_only',disabled:true}]});
test('child frame candidate changes only three child geometry fields with source and matte protected',()=>{
 const before=base(),copy=structuredClone(before),{candidate,proposal}=stage(before,{x:180,y:-250,scale:.73});
 assert.deepEqual(before,copy);assert.equal(candidate.revision,18);
 assert.deepEqual(candidate.clips.filter(c=>c.id!=='sues_b02_child_review_only'),before.clips.filter(c=>c.id!=='sues_b02_child_review_only'));
 assert.deepEqual(candidate.clips[2].props,{x:180,y:-250,scale:.73,opacity:1});
 assert.equal(proposal.status,'REAL_NATIVE_PREVIEW_REQUIRED_NOT_APPROVED');
});
test('rejects bad bounding geometry or unsafe stale clip state',()=>{
 for(const q of [{x:0,y:-250,scale:.73},{x:180,y:-250,scale:2},{x:180,y:-99,scale:.73},{x:NaN,y:-250,scale:.73}])assert.throws(()=>stage(base(),q));
 const x=base();x.clips[0].locked=false;assert.throws(()=>stage(x,{x:180,y:-250,scale:.73}));
 const y=base();y.clips[2].props.x=0;assert.throws(()=>stage(y,{x:180,y:-250,scale:.73}));
 const z=base();z.clips[3].props.matteTrack='V1';assert.throws(()=>stage(z,{x:180,y:-250,scale:.73}));
 const q=base();q.media[0].src='/media/not-the-verified-image.png';assert.throws(()=>stage(q,{x:180,y:-250,scale:.73}));
 const w=base();w.outPoint=13;assert.throws(()=>stage(w,{x:180,y:-250,scale:.73}));
});
