import test from 'node:test';import assert from 'node:assert/strict';
import {createBoundDirectorPlanVerifier} from '../../src/engine-next/fablecut-director-job-binding.js';
const jobId='a0e00000-0000-4000-8000-000000000001',other='b0e00000-0000-4000-8000-000000000002';
const storyRevision='a'.repeat(64),decisionId='b'.repeat(64),fingerprint='c'.repeat(64);
const request={projectId:'p_158404',revision:54,clipId:'B02',x:327,y:0,scale:.7};
const operationId='move-B02',plan={mode:'approve',view:{status:'READY_FOR_CHOICE',fingerprint,projectFingerprint:'d'.repeat(64)},plan:{operations:[{id:operationId,renderer:'native',effect:'fablecut-transform-exact/v1',parameters:request}]}};
const store={current:()=>({revision:storyRevision}),approved:async()=>plan};
const binding={verified:true,jobId,nativeProjectId:request.projectId,suesProjectId:'sues-project'};
const deps={resolveBinding:async()=>binding,getJob:async()=>({id:jobId,projectId:'sues-project',intermediate:false}),getStore:async()=>store};
const query={storyRevision,decisionId,operationId,request};
test('server-owned exact native-to-SUES-job binding permits valid plan proof',async()=>{
 const v=createBoundDirectorPlanVerifier(deps),proof=await v(query);
 assert.equal(proof.ok,true);assert.equal(proof.jobId,jobId);assert.equal(proof.nativeProjectId,request.projectId);
});
test('rejects an unbound, ambiguous, forged or mismatched native project',async()=>{
 for(const b of [null,{...binding,verified:false},{...binding,nativeProjectId:'p_other'},
   {...binding,jobId:'../bad'},{...binding,jobId:other}]){
  const v=createBoundDirectorPlanVerifier({...deps,resolveBinding:async()=>b});
  const result=await v(query);assert.equal(result.ok,false);
 }
});
test('rejects foreign SUES project, intermediate job, and unavailable trusted dependency',async()=>{
 for(const job of [null,{id:jobId,projectId:'another'},{id:jobId,projectId:'sues-project',intermediate:true}]){
  const v=createBoundDirectorPlanVerifier({...deps,getJob:async()=>job});assert.equal((await v(query)).ok,false);
 }
 assert.equal((await createBoundDirectorPlanVerifier({...deps,resolveBinding:async()=>{throw Error('offline');}})(query)).ok,false);
 assert.equal((await createBoundDirectorPlanVerifier({...deps,getStore:async()=>null})(query)).ok,false);
});
test('a different plan or native geometry cannot inherit the matching job approval',async()=>{
 const v=createBoundDirectorPlanVerifier(deps);
 assert.equal((await v({...query,request:{...request,x:333}})).ok,false);
 assert.equal((await v({...query,operationId:'other'})).ok,false);
});
