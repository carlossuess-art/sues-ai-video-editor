import test from 'node:test';import assert from 'node:assert/strict';
import {dispatchDirectorNativeTransform,FableCutDirectorDispatchError} from '../../src/engine-next/fablecut-director-dispatcher.js';
const id='p_3c0550a1dd';const clip={id:'child',kind:'image',track:'V2',props:{x:300,y:0,scale:.5},disabled:true};
function setup(){let revision=54,changed=structuredClone(clip);const audits=[];let invoked=0;
 return {audits, get invoked(){return invoked;},readProject:async()=>({projectId:id,data:{revision,tracks:[{id:'V1'},{id:'V2'}],clips:[{id:'source',kind:'video',track:'V1',locked:true,props:{}},changed]}}),
 authorize:async()=>true,audit:async x=>{audits.push(x);},invokeMcp:async(name,args)=>{invoked++;assert.equal(name,'fablecut_patch_project');assert.equal(args.baseRevision,54);revision++;changed={...changed,props:{...changed.props,...args.ops[0].set.props}};return 'Patched (revision 55): updated child';}};
}
const req={actor:'sues-master-director',approvalId:'review_20261108_B02',projectId:id,revision:54,clipId:'child',x:311,y:10,scale:.7};
test('approved command dispatches native CAS once and audits verified state',async()=>{
 const deps=setup(),res=await dispatchDirectorNativeTransform(req,deps);assert.equal(res.revision,55);assert.equal(deps.invoked,1);
 assert.deepEqual(deps.audits.map(a=>a.stage),['approved-before-dispatch','committed-verified']);
 assert.deepEqual(deps.audits[1].to,{x:311,y:10,scale:.7});
});
test('denies when approval missing, stale project, or unapproved override',async()=>{
 const deps=setup();await assert.rejects(dispatchDirectorNativeTransform(req,{...deps,authorize:async()=>false}),e=>e.code==='FORBIDDEN');
 await assert.rejects(dispatchDirectorNativeTransform({...req,revision:53},deps),e=>e.code==='CONFLICT');
 await assert.rejects(dispatchDirectorNativeTransform({...req,force:true},deps),e=>e.code==='INPUT');
 assert.equal(deps.invoked,0);
});
test('never retries a rejected MCP change and records incident',async()=>{
 const deps=setup();await assert.rejects(dispatchDirectorNativeTransform(req,{...deps,invokeMcp:async()=>{throw Error('CONFLICT rev55')}}),e=>e.code==='MCP_FAILURE');
 assert.deepEqual(deps.audits.map(a=>a.stage),['approved-before-dispatch','dispatch-failed']);
});
test('unverifiable MCP result is rejected instead of inventing commit',async()=>{
 const deps=setup();await assert.rejects(dispatchDirectorNativeTransform(req,{...deps,invokeMcp:async()=> 'OK'}),e=>e.code==='UNVERIFIED');
});
