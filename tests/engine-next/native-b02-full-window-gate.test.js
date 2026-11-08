import test from 'node:test';import assert from 'node:assert/strict';
import {checkB02FullWindowInputs as check} from '../../src/engine-next/native-b02-full-window-gate.js';
const H='a'.repeat(64);
const ids=['sues_video_source','sues_audio_original','sues_b02_child_review_only','sues_b02_carlos_foreground_luma_qa','sues_b02_temporal_luma_qa','sues_hyperframes_gold_3d_review_only'];
const example=()=>({project:{inPoint:9.5,outPoint:13.5,width:1080,height:1920,fps:30,
 clips:ids.map((id,i)=>({id,locked:i<2,disabled:i===5,start:i>1&&i<5?9.5:0,duration:4,track:i===4?'V4':i===3?'V3':'V2',props:i===3?{matteTrack:'V4'}:{}}))},
 job:{job:{status:'done',range:'in-out',progress:1,result:{outputs:[{ok:true,report:{ok:true,checks:[{ok:true,text:'120 frames'}]}}]}},browserErrors:[]},
 video:{codec_name:'h264',width:1080,height:1920,avg_frame_rate:'30/1',nb_read_frames:'120',duration:'4.0000'},
 audio:{codec_name:'aac',sample_rate:'48000',channels:2,duration:4},
 hashes:{decodedFrames:120,distinctFrames:120,adjacentDuplicateFrames:0},refs:[10,11.5,13].map(time=>({time,all:.98,nativeFrameSha256:H}))});
test('full B02 proof requires 120 distinct native frames and never grants cinematic approval',()=>{const r=check(example());assert.equal(r.ok,true);assert.equal(r.cinematicQA,false);assert.equal(r.ssimMinimum,.98)});
test('missing/duplicate frames and bad export checks fail closed',()=>{for(const changed of [{decodedFrames:119},{distinctFrames:119},{adjacentDuplicateFrames:1}]){const x=example();Object.assign(x.hashes,changed);assert.throws(()=>check(x));}const a=example();a.job.job.result.outputs[0].report.ok=false;assert.throws(()=>check(a));const b=example();b.job.browserErrors.push('js error');assert.throws(()=>check(b));});
test('no permission to edit source and no gold in creative B02 variant',()=>{for(const i of [0,1]){const x=example();x.project.clips[i].locked=false;assert.throws(()=>check(x));}const x=example();x.project.clips[5].disabled=false;assert.throws(()=>check(x));const y=example();y.project.clips[3].props.matteTrack='V1';assert.throws(()=>check(y));});
test('rejects truncated window, wrong FPS, nonnative/corrupted sample timestamps',()=>{const x=example();x.project.outPoint=11.5;assert.throws(()=>check(x));const y=example();y.video.avg_frame_rate='25/1';assert.throws(()=>check(y));const z=example();z.refs[0].time=9.9;assert.throws(()=>check(z));});

test('audio drift and low preview similarity prevent full technical certification',()=>{const a=example();a.audio.duration=3.6;assert.throws(()=>check(a));const b=example();b.refs[0].all=.5;const r=check(b);assert.equal(r.highSampledSimilarity,false);assert.equal(r.technicalChecksPassed,false);assert.equal(r.cinematicQA,false)});
