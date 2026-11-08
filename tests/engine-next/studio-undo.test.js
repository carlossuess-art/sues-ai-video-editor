import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {runInNewContext} from 'node:vm';
const module={exports:{}};runInNewContext(readFileSync(new URL('../../web/engine-next-undo.js',import.meta.url),'utf8'),{module});const {capture,request}=module.exports;
const projectId='p_3c0550a1dd';
const project=(revision,clipId)=>({projectId,revision,clips:[{id:clipId}]});
test('transform undo uses former values with revision of newly saved NLE project',()=>{
 const c=capture({kind:'transform',projectId,clip:{id:'gold',kind:'video',x:24,y:-350,scale:.8},previousRevision:53,savedRevision:54});
 const v=request(c,project(54,'gold'));assert.equal(v.path,'/api/engine-next/clip-transform');
 assert.equal(v.payload.expectedRevision,54);assert.equal(v.payload.x,24);assert.equal(v.payload.y,-350);assert.equal(v.payload.scale,.8);
 assert.throws(()=>request(c,project(55,'gold')),/changed/);
 assert.throws(()=>request(c,{...project(54,'gold'),projectId:'p_different'}),/changed/);
});
test('text timing and title size have distinct inverse endpoints and preserve 30 fps frames',()=>{
 const c=capture({kind:'timing',projectId,clip:{id:'t1',kind:'text',start:9.5,duration:1.2},previousRevision:12,savedRevision:13});
 const r=request(c,project(13,'t1'));assert.equal(r.path,'/api/engine-next/clip-timing');assert.equal(r.payload.startFrame,285);assert.equal(r.payload.durationFrames,36);
 const t=capture({kind:'title',projectId,clip:{id:'t1',kind:'text',fontSize:56},previousRevision:13,savedRevision:14});
 assert.equal(request(t,project(14,'t1')).payload.fontSize,56);
});
test('cannot undo locked clips, wrong schema, missing clip or invent revision changes',()=>{
 assert.throws(()=>capture({kind:'transform',projectId,clip:{id:'source',kind:'video',locked:true,x:0,y:0,scale:1},previousRevision:1,savedRevision:2}));
 assert.throws(()=>capture({kind:'title',projectId,clip:{id:'t1',kind:'text',fontSize:180},previousRevision:1,savedRevision:2}));
 assert.throws(()=>capture({kind:'title',projectId,clip:{id:'t1',kind:'text',fontSize:56},previousRevision:2,savedRevision:2}));
 const c=capture({kind:'title',projectId,clip:{id:'t1',kind:'text',fontSize:56},previousRevision:3,savedRevision:4});
 assert.throws(()=>request(c,project(4,'unknown')));
 assert.throws(()=>request({...c,schema:'fake'},project(4,'t1')));
});
