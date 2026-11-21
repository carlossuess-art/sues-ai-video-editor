import test from 'node:test';import assert from 'node:assert/strict';
import {retimeNativeTextClip} from '../../src/engine-next/clip-timing.js';
function fixture(){return {fps:30,tracks:[{id:'V1'},{id:'V6'}],clips:[{id:'voice',kind:'audio',track:'V1',start:0,duration:30,locked:true},{id:'word',kind:'text',track:'V6',start:10,duration:.2,disabled:true,locked:false,props:{text:'PRUEBA'}}],media:[{id:'m',kind:'video'}]};}
test('retimes one text by exact frames preserving all other media, clip states and project original',()=>{
 const p=fixture(),o=retimeNativeTextClip(p,{clipId:'word',startFrame:330,durationFrames:12});
 assert.equal(o.project.clips[1].start,11);assert.equal(o.project.clips[1].duration,.4);assert.equal(o.project.clips[1].disabled,true);
 assert.equal(o.project.clips[0].start,0);assert.equal(p.clips[1].start,10);assert.deepEqual(o.project.media,p.media);
});
test('rejects timing of video, locked text, missing tracks and subframe values',()=>{
 for(const id of ['voice','missing'])assert.throws(()=>retimeNativeTextClip(fixture(),{clipId:id,startFrame:100,durationFrames:10}));
 for(const v of [NaN,10.5,-1,9001,Infinity])assert.throws(()=>retimeNativeTextClip(fixture(),{clipId:'word',startFrame:v,durationFrames:6}));
 const p=fixture();p.clips[1].locked=true;assert.throws(()=>retimeNativeTextClip(p,{clipId:'word',startFrame:200,durationFrames:10}));
 const q=fixture();q.tracks.pop();assert.throws(()=>retimeNativeTextClip(q,{clipId:'word',startFrame:200,durationFrames:10}));
});
