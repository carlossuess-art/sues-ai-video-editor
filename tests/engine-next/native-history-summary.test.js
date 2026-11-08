import test from 'node:test';import assert from 'node:assert/strict';
import {summarizeNativeHistory} from '../../src/engine-next/native-history-summary.js';
const current={revision:53};const id='p_3c0550a1dd';
const v=(n,revision=53)=>({v:n,revision,name:'Auto-save',created:'2026-11-07T21:30:31.746Z',kind:'auto',final:false});
const make=versions=>({project:current,projectId:id,versionResponse:{project:id,versions}});
test('returns bounded read-only history from matching FableCut project',()=>{
 const out=summarizeNativeHistory(make([v(11,53),v(10,49),v(9,47)]));
 assert.equal(out.currentRevision,53);assert.equal(out.versionCount,3);
 assert.deepEqual(out.versions.map(x=>x.version),[11,10,9]);
 assert.equal(out.canRestore,false);assert.equal(out.readOnly,true);
 assert.ok(!('action' in out.versions[0]));
});
test('caps visible records without losing total count',()=>{
 const out=summarizeNativeHistory(make(Array.from({length:20},(_,i)=>v(20-i,53-i))));
 assert.equal(out.versions.length,8);assert.equal(out.versionCount,20);
});
test('rejects mismatched IDs, future revisions, duplicated numbers and unsorted versions',()=>{
 assert.throws(()=>summarizeNativeHistory({...make([v(11)]),versionResponse:{project:'p_different',versions:[v(11)]}}));
 assert.throws(()=>summarizeNativeHistory(make([v(11,99)])));
 assert.throws(()=>summarizeNativeHistory(make([v(11),v(11)])));
 assert.throws(()=>summarizeNativeHistory(make([v(9),v(11)])));
});
