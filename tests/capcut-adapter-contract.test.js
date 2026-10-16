import test from 'node:test';
import assert from 'node:assert/strict';
import {validateCapcutRequest,adapterBoundary} from '../src/capcut-adapter-contract.js';

test('CapCut is optional and protected by clone/lint boundary',()=>{
 const b=adapterBoundary();assert.equal(b.criticalForV1,false);
 assert.equal(validateCapcutRequest({version:'1.0',action:'preview',projectRef:'draft:1',cloneOriginal:true,validateBeforeOpen:true}),true);
});
test('direct original modification is rejected',()=>{
 assert.throws(()=>validateCapcutRequest({version:'1.0',action:'apply_style',projectRef:'x',cloneOriginal:false,validateBeforeOpen:true}));
});
