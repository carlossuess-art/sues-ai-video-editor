import test from 'node:test';
import assert from 'node:assert/strict';
import {buildTimeMap,editToSource,sourceIntervalToEdit,mapCameraToEdit,sampleEditedCamera} from '../src/time-map.js';
const camera={keyframes:[{time:0,x:0,y:0,width:100,height:160,zoom:1},{time:20,x:100,y:200,width:100,height:160,zoom:1}]};
test('edit cut boundary selects following source segment, end holds final endpoint',()=>{
 const m=buildTimeMap([{in:0,out:12},{in:13,out:20}],20);
 assert.equal(m.duration,19);assert.equal(editToSource(m,11.999).sourceTime,11.999);
 assert.deepEqual(editToSource(m,12),{sourceTime:13,segmentIndex:1});
 assert.equal(editToSource(m,19).sourceTime,20);assert.throws(()=>editToSource(m,19.1));
});
test('source intervals split around removed regions and preserve repeats/reorder',()=>{
 const m=buildTimeMap([{in:5,out:8},{in:1,out:3},{in:5,out:8}],10);
 assert.deepEqual(sourceIntervalToEdit(m,6,7).map(s=>[s.start,s.end]),[[1,2],[6,7]]);
 assert.deepEqual(sourceIntervalToEdit(m,3,5),[]);assert.equal(editToSource(m,3).sourceTime,1);
});
test('camera interpolation stays in source time and cuts retain two independent endpoint spans',()=>{
 const m=buildTimeMap([{in:0,out:2},{in:18,out:20}],20),spans=mapCameraToEdit(camera,m);
 assert.equal(spans[0].keyframes.at(-1).x,10);assert.equal(spans[1].keyframes[0].x,90);
 assert.equal(sampleEditedCamera(camera,m,2).x,90);assert.equal(sampleEditedCamera(camera,m,1).x,5);
});
test('reject invalid source spans without sorting or silently repairing',()=>{
 for(const segments of [[],[{in:0,out:0}],[{in:-1,out:1}],[{in:0,out:11}],[{in:0,out:Infinity}]])assert.throws(()=>buildTimeMap(segments,10));
 assert.throws(()=>sourceIntervalToEdit(buildTimeMap([{in:0,out:10}],10),3,2));
});
