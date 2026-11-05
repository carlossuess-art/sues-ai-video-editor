import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {MasterHybridRequests} from '../src/master-director-hybrid-requests.js';
const a='a'.repeat(64),b='b'.repeat(64);
test('durable hybrid journal is private, validates identity, and never promotes a terminal record',()=>{
 const dir=mkdtempSync(join(tmpdir(),'sues-hybrid-runs-'));
 try{
  const q=new MasterHybridRequests(dir),requestId=randomUUID();
  assert.equal(q.get(requestId),null);
  const run=q.create({requestId,revision:a,decisionId:b});
  assert.equal(run.status,'RUNNING');
  const childId=randomUUID();run.childId=childId;run.step='NATIVE_RENDERING';
  assert.equal(q.save(run).childId,childId);
  assert.equal(q.get(requestId).step,'NATIVE_RENDERING');
  assert.equal(q.records().length,1);
  assert.throws(()=>q.create({requestId,revision:a,decisionId:b}),e=>e.code==='EEXIST');
  assert.throws(()=>q.save({...run,childId:randomUUID()}),/Native child identity changed/);
  run.status='READY';run.previewId=randomUUID();run.step='HUMAN_QA_PENDING';assert.equal(q.save(run).status,'READY');
  assert.throws(()=>q.save({...run,status:'RUNNING'}),/terminal/);
  assert.equal(q.records()[0].final,false);
 }finally{rmSync(dir,{recursive:true,force:true})}
});
test('tampered requests and unapproved revision cannot be silently resumed',()=>{
 const dir=mkdtempSync(join(tmpdir(),'sues-hybrid-runs-'));
 try{const q=new MasterHybridRequests(dir),requestId=randomUUID(),run=q.create({requestId,revision:a,decisionId:b});
  assert.throws(()=>q.create({requestId:randomUUID(),revision:'untrusted',decisionId:b}),/Invalid hybrid approval/);
  const path=q.path(requestId);writeFileSync(path,JSON.stringify({...run,childId:'../../bad'}));
  assert.throws(()=>q.get(requestId),/Invalid hybrid request record/);
  assert.throws(()=>q.path('../bad'),/Invalid hybrid request ID/);
 }finally{rmSync(dir,{recursive:true,force:true})}
});
test('interrupted hybrid attempts prevent duplicate automatic recovery',()=>{
 const dir=mkdtempSync(join(tmpdir(),'sues-hybrid-runs-'));
 try{const q=new MasterHybridRequests(dir),r=q.create({requestId:randomUUID(),revision:a,decisionId:b});
  assert.equal(q.hasInterrupted(),false);
  r.status='INTERRUPTED';r.step='NEEDS_OPERATOR_DIAGNOSIS';q.save(r);
  assert.equal(q.hasInterrupted(),true);
 }finally{rmSync(dir,{recursive:true,force:true})}
});
