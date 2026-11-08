import test from 'node:test';import assert from 'node:assert/strict';
import {evaluateB02TechnicalClosure as audit} from '../../src/engine-next/b02-proof-closure.js';
const A='a'.repeat(64),B='b'.repeat(64),C='c'.repeat(64);
const fixture=()=>({
  sourceSha256:A,matteSha256:B,actualVideoSha256:C,
  project:{fps:30,width:1080,height:1920,inPoint:9.5,outPoint:13.5,
   clips:[{id:'sues_video_source',mediaId:'o',locked:true},
     {id:'sues_audio_original',mediaId:'a',locked:true},
     {id:'sues_b02_child_review_only',start:9.5,duration:4,track:'V2',props:{x:180,y:-250,scale:.73},transitionIn:{type:'fade',duration:.3},transitionOut:{type:'fade',duration:.3}},
     {id:'sues_b02_temporal_luma_qa',mediaId:'m',track:'V4'},
     {id:'sues_b02_carlos_foreground_luma_qa',track:'V3',props:{matteTrack:'V4'}},
     {id:'sues_hyperframes_gold_3d_review_only',disabled:true}],
   media:[{id:'o',src:'/media/sues-158404-original.mp4'},{id:'a',src:'/media/sues-158404-voice.m4a'},
      {id:'m',src:'/media/sues-158404-b02-modnet-luma-120.mp4'}]},
  nativeAudit:{technicalChecksPassed:true,nativeReportOk:true,frameCount:120,frameRate:30,frameHashes:{distinctFrames:120,adjacentDuplicateFrames:0},ssimMinimum:.966,mp4Sha256:C},
  sourceRoi:{status:'SOURCE_BACKGROUND_TECHNICAL_PASS',frames:120,belowThreshold:0,minSSIM:.965,sourceSha256:A,renderedSha256:C},
  temporalMatte:{status:'TEMPORAL_MATTE_CONTINUITY_TECHNICAL_PASS',frames:120,sourceSha256:B,alertFrameIndices:[]}});
test('consistent verified B02 evidence reaches technical ready, never cinematic approval',()=>{
 const x=fixture();const before=structuredClone(x);const a=audit(x);assert.deepEqual(x,before);
 assert.equal(a.technicalReady,true);assert.deepEqual(a.technicalFailures,[]);assert.equal(a.cinematicQA,false);assert.equal(a.approvedByCarlos,false);
 assert.equal(a.fullReelCompleted,false);assert.equal(a.creativeBlockers.length,7);
});
test('source/voice protection, mask/track and exact media mapping fail closed',()=>{
 const a=fixture();a.project.clips[1].locked=false;assert.ok(audit(a).technicalFailures.includes('original-video-voice-not-locked'));
 const b=fixture();b.project.clips[4].props.matteTrack='V2';assert.ok(audit(b).technicalFailures.includes('matte-or-gold-protection-broken'));
 const c=fixture();c.project.media[0].src='/media/evil.mp4';assert.ok(audit(c).technicalFailures.includes('original-asset-binding-changed'));
});
test('faked or stale source, wrong video hash, discontinuous matte and inaccurate renderer cannot pass',()=>{
 const a=fixture();a.nativeAudit.mp4Sha256='d'.repeat(64);assert.ok(audit(a).technicalFailures.includes('native-120f-export-proof-failed'));
 const b=fixture();b.sourceRoi.minSSIM=.82;assert.ok(audit(b).technicalFailures.includes('authentic-source-vfr-timing-proof-failed'));
 const c=fixture();c.temporalMatte.alertFrameIndices=[5];assert.ok(audit(c).technicalFailures.includes('temporal-matte-continuity-proof-failed'));
 const d=fixture();d.project.outPoint=13.4;assert.ok(audit(d).technicalFailures.includes('wrong-b02-canvas-or-window'));
});
