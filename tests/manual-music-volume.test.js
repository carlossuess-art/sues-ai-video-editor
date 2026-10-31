import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../web/manual-adjust.js',import.meta.url),'utf8');
const start=source.indexOf('   const updateGain=n=>{'),end=source.indexOf('   const commitGain=',start);
assert.ok(start>=0&&end>start);
function update(e,time,value) {
 const context={e,beforeGain:null,snapshot:()=>structuredClone(e),localTime:()=>time,millis:t=>Math.round(t*1000)/1000,
  volumeAtHead:()=>e.keyframes?.findIndex(k=>Math.abs(k.time-time)<1/60)??-1,
  slider:{},numeric:{},window:{}};
 vm.runInNewContext(source.slice(start,end)+'\nupdateGain('+value+')',context);
}
test('changing an animated music volume between keys creates a key at the playhead',()=>{
 const e={gain:.3,keyframes:[{time:0,value:.45}]};
 update(e,2,15);assert.equal(e.gain,.3);assert.equal(e.keyframes.length,2);assert.equal(e.keyframes[1].value,.15);assert.equal(e.keyframes[1].time,2);
 update(e,2,0);assert.equal(e.keyframes.length,2);assert.equal(e.keyframes[1].value,0);
 update(e,4,35);assert.equal(e.keyframes[2].value,.35);assert.equal(e.keyframes[0].value,.45);
});
test('unanimated music retains the existing whole-track volume control',()=>{
 const e={gain:.3,keyframes:[]};update(e,2,15);assert.equal(e.gain,.15);assert.equal(e.keyframes.length,0);
});
