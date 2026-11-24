import test from 'node:test';
import assert from 'node:assert/strict';
import {planAutonomousBatches,bindBatchForCAS,verifyBatchReadback} from '../src/engine-next/fablecut-autonomous-batch-plan.js';
const mk=n=>({projectId:'p_ac513f2e6a',storyRevision:'a'.repeat(64),
 operations:Array.from({length:n},(_,i)=>({id:'op'+i,dependsOn:i?['op'+(i-1)]:[]})),
 commands:Array.from({length:n},(_,i)=>({id:'op'+i,action:'set_volume',clipId:'c'+i,volume:.3}))});
test('1000 operations become ten complete dependent batches without execution',()=>{
 const p=planAutonomousBatches(mk(1000));
 assert.equal(p.batchCount,10);assert.equal(p.status,'PLAN_ONLY_NOT_AUTHORIZED');
 assert.equal(p.batches.flatMap(b=>b.operationIds).length,1000);
 assert.ok(p.batches.every((b,i)=>b.commands.length===100&&b.previousBatchId===(p.batches[i-1]?.batchId??null)));
});
test('topological sort repairs reversed operations',()=>{
 const a=mk(3);a.operations.reverse();
 assert.deepEqual(planAutonomousBatches(a).batches[0].operationIds,['op0','op1','op2']);
});
test('rejects missing maps, duplicates, cycles and greater-than-native batch size',()=>{
 const a=mk(5);a.commands.pop();assert.throws(()=>planAutonomousBatches(a),/COVERAGE_INVALID/);
 const b=mk(5);b.commands[1].id='op0';assert.throws(()=>planAutonomousBatches(b),/COMMAND_MAPPING_INVALID/);
 const c=mk(5);c.operations[0].dependsOn=['op4'];assert.throws(()=>planAutonomousBatches(c),/DEPENDENCY_CYCLE/);
 const d=mk(5);d.operations[0].dependsOn=['missing'];assert.throws(()=>planAutonomousBatches(d),/DEPENDENCY_MISSING/);
 assert.throws(()=>planAutonomousBatches({...mk(101),limit:101}),/BATCH_LIMIT_UNSUPPORTED/);
});
test('binding requires verified project and receipts require persistence',()=>{
 const b=planAutonomousBatches(mk(3)).batches[0],p={projectId:'p_ac513f2e6a',revision:17,clips:[],tracks:[],media:[]};
 assert.throws(()=>bindBatchForCAS(b,p),/NATIVE_BINDING_UNVERIFIED/);
 const req=bindBatchForCAS(b,p,{trustedProjectId:'p_ac513f2e6a'});
 assert.equal(req.baseRevision,17);assert.ok(!('approval' in req));
 const receipts=b.operationIds.map(operationId=>({operationId}));
 assert.equal(verifyBatchReadback(b,receipts.slice(1),{beforeRevision:17,afterRevision:18,persisted:true}).status,'RECONCILE_BEFORE_RETRY');
 assert.equal(verifyBatchReadback(b,receipts,{beforeRevision:17,afterRevision:18,persisted:false}).status,'RECONCILE_BEFORE_RETRY');
 assert.equal(verifyBatchReadback(b,receipts,{beforeRevision:17,afterRevision:18,persisted:true}).status,'READBACK_AND_RECEIPTS_VERIFIED');
});
