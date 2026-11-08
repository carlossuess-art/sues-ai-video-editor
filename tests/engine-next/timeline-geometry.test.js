import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {fileURLToPath} from 'node:url';import {runInNewContext} from 'node:vm';
const module={exports:{}};runInNewContext(readFileSync(fileURLToPath(new URL('../../web/engine-next-timeline.js',import.meta.url)),'utf8'),{module});const geometry=module.exports;
test('projects original 73s video and 4s B02 overlay into one 30fps lane',()=>{
 const clips=[{start:0,duration:73.76667},{start:9.5,duration:4}];const total=geometry.duration(clips);
 assert.ok(total>73&&total<74);
 const b=geometry.bounds(clips[1],total);assert.ok(b.left>12&&b.left<14);assert.ok(b.width>5&&b.width<6);
});
test('clamps hidden and out-of-bounds clips to stable screen geometry',()=>{
 const x=geometry.bounds({start:120,duration:2},73);assert.equal(x.left,100);assert.equal(x.width,0);
 assert.equal(geometry.duration([{start:-1,duration:20}]),1);
 assert.throws(()=>geometry.bounds({start:0,duration:-1},73));
});
test('snaps to actual source frames rather than estimated per-click seconds',()=>{
 assert.equal(geometry.snap(10.017,73,30),10.033333333333333);
 assert.equal(geometry.snap(-2,73,30),0);assert.equal(geometry.snap(77,73,30),73);
 assert.equal(geometry.stamp(9.5),'00:09:15');assert.equal(geometry.stamp(60),'01:00:00');
});
