import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateMotionAsset,indexMotionLibrary,instantiateMotion} from '../src/motion-library.js';
const items=()=>JSON.parse(readFileSync(new URL('../examples/motions/catalog.sample.json',import.meta.url)));
test('catalog items validate and index',()=>{
 const c=items();for(const m of c) assert.equal(validateMotionAsset(m),true);
 const i=indexMotionLibrary(c);assert.equal(i.findByReason('comparison')[0].id,'COMPARE_YES_NO_01');
});
test('blurred resource requires dynamic bindings',()=>{
 const m=items().find(x=>x.id==='BLURRED_RESOURCE_01');
 const x=instantiateMotion(m,{resource:'asset://proof','resource-title':'Referencia'});
 assert.equal(x.layers.find(l=>l.id==='resource').content,'asset://proof');
});
test('duplicate ids are rejected',()=>{
 const c=items();assert.throws(()=>indexMotionLibrary([c[0],c[0]]));
});
