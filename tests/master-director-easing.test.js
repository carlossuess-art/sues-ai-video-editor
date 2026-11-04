import test from 'node:test';
import assert from 'node:assert/strict';
import {masterEasing} from '../experiments/remotion-cta/src/masterEasing.js';
test('standard easing curves preserve endpoints and expected midpoint values',()=>{
 for(const name of ['linear','ease-in','ease-out','ease-in-out']){assert.equal(masterEasing(name,0),0);assert.equal(masterEasing(name,1),1);}
 assert.equal(masterEasing('linear',.5),.5);
 assert.ok(Math.abs(masterEasing('ease-in',.5)-.3153568)<1e-6);
 assert.ok(Math.abs(masterEasing('ease-out',.5)-.6846432)<1e-6);
 assert.ok(Math.abs(masterEasing('ease-in-out',.5)-.5)<1e-6);
 assert.throws(()=>masterEasing('spring',.5),/Unsupported/);
 assert.throws(()=>masterEasing('linear',NaN),/Invalid/);
});
