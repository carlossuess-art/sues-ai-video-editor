import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyDirectorPlanTransform} from '../../src/engine-next/fablecut-director-plan-proof.js';
const revision='a'.repeat(64),decisionId='b'.repeat(64),fingerprint='c'.repeat(64);
const request={projectId:'p_158404',revision:54,clipId:'B02',x:327,y:-20,scale:.7};
const operation={id:'move-B02',renderer:'native',effect:'fablecut-transform-exact/v1',parameters:{...request}};
const verified={mode:'approve',view:{status:'READY_FOR_CHOICE',fingerprint,projectFingerprint:'d'.repeat(64)},plan:{operations:[operation]}};
const store=(plan=verified,head=revision)=>({current:()=>({revision:head}),approved:async()=>plan});
const input={storyRevision:revision,decisionId,operationId:'move-B02',request};
test('only an exact plan operation with a current explicit approval yields a proof',async()=>{
 const result=await verifyDirectorPlanTransform({...input,store:store()});
 assert.equal(result.ok,true);assert.equal(result.planFingerprint,fingerprint);
 assert.equal(result.decisionId,decisionId);
});
test('head changes, review-only and autonomous mode cannot authorize a creative transform',async()=>{
 assert.equal((await verifyDirectorPlanTransform({...input,store:store(verified,'e'.repeat(64))})).reason,'STALE_STORY_HEAD');
 for(const mode of ['review','autonomous']){
  const outcome=await verifyDirectorPlanTransform({...input,store:store({...verified,mode})});
  assert.equal(outcome.ok,false);
 }
 assert.equal((await verifyDirectorPlanTransform({...input,store:store(null)})).ok,false);
});
test('exact geometry, project identity and operation cannot be silently changed',async()=>{
 for(const changed of [{x:328},{revision:55},{projectId:'p_wrong'},{clipId:'other'},{scale:.8}])
  assert.equal((await verifyDirectorPlanTransform({...input,request:{...request,...changed},store:store()})).reason,'TRANSFORM_DIFFERS_FROM_PLAN');
 assert.equal((await verifyDirectorPlanTransform({...input,operationId:'other',store:store()})).ok,false);
 assert.equal((await verifyDirectorPlanTransform({...input,store:store({...verified,plan:{operations:[operation,operation]}})})).ok,false);
});
test('does not infer transform rights from existing B-roll or other native operations',async()=>{
 for(const effect of ['broll-fullframe','caption-edit','transform']){
  const plan={...verified,plan:{operations:[{...operation,effect}]}};
  assert.equal((await verifyDirectorPlanTransform({...input,store:store(plan)})).reason,'OPERATION_NOT_NATIVE_TRANSFORM');
 }
 const extra={...operation,parameters:{...request,force:true}};
 assert.equal((await verifyDirectorPlanTransform({...input,store:store({...verified,plan:{operations:[extra]}})})).ok,false);
 assert.equal((await verifyDirectorPlanTransform({...input,store:{current:()=>{throw Error('disk unavailable');},approved:async()=>verified}})).ok,false);
});

test('approval loaded while story head advances is rejected before native authorization',async()=>{
 let head=revision;const unstable={current:()=>({revision:head}),approved:async()=>{head='e'.repeat(64);return verified;}};
 const result=await verifyDirectorPlanTransform({...input,store:unstable});
 assert.deepEqual(result,{ok:false,reason:'STALE_STORY_HEAD'});
});
test('native bounds and invalid geometry are rejected even when the creative plan repeats them',async()=>{
 for(const changed of [{x:3001},{x:-3001},{y:3001},{y:-3001},{scale:.049},{scale:8.01},{revision:-1},
  {x:Infinity},{y:NaN},{scale:Infinity}]){
  const requested={...request,...changed};
  const plan={...verified,plan:{operations:[{...operation,parameters:{...requested}}]}};
  const result=await verifyDirectorPlanTransform({...input,request:requested,store:store(plan)});
  assert.equal(result.ok,false,JSON.stringify(changed));
  assert.equal(result.reason,'INVALID_TRANSFORM_VALUES');
 }
 for(const changed of [{x:3000,y:-3000,scale:.05},{x:-3000,y:3000,scale:8}]){
  const requested={...request,...changed};
  const plan={...verified,plan:{operations:[{...operation,parameters:{...requested}}]}};
  assert.equal((await verifyDirectorPlanTransform({...input,request:requested,store:store(plan)})).ok,true);
 }
});
