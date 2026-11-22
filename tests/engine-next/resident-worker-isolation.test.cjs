"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict");
const {createExportJobs}=require(process.env.SUES_JOBS_MODULE||"../../fablecut/export-jobs.js");
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test("private resident worker jobs cannot be selected externally or leak into public SSE",async()=>{
 const events=[],tickets=[],cancellations=[];
 const worker={async dispatch(ticket){tickets.push(ticket)},cancel(){cancellations.push(true)},shutdown(){}};
 const jobs=createExportJobs({worker,editors:()=>1,broadcast:(...x)=>events.push(x),url:()=>{throw Error("no headless launch")}});
 try{
  assert.throws(()=>jobs.request({where:"worker",snapshot:{clips:[],media:[]}}),/where must/);
  const job=jobs.request({where:"worker",trustedWorker:true,sourceSession:"parent-1",kind:"audio",snapshot:{clips:[{id:"clip"}],media:[]},revision:8});
  assert.equal(job.via,"worker");await tick();
  assert.equal(events.length,0);
  assert.equal(tickets.length,1);
  assert.equal(tickets[0].sourceSession,"parent-1");
  assert.equal(tickets[0].snapshot.clips[0].id,"clip");
  assert.equal(jobs.claim(job.id),true);
  assert.deepEqual(jobs.report(job.id,{progress:0.5}),{cancel:false});
  assert.equal(jobs.get(job.id).progress,0.5);
  jobs.cancel(job.id);assert.equal(jobs.get(job.id).status,"cancelled");
  assert.equal(cancellations.length,1);
  const j2=jobs.request({where:"worker",trustedWorker:true,sourceSession:"parent-2",kind:"export",snapshot:{clips:[],media:[]}});
  await tick();assert.equal(tickets.at(-1).sourceSession,"parent-2");
  jobs.failActiveWorker("lost");assert.equal(jobs.get(j2.id).status,"failed");
  const j3=jobs.request({where:"worker",trustedWorker:true,snapshot:{clips:[],media:[]}});
  jobs.fail(j3.id,"error");assert.equal(jobs.get(j3.id).status,"failed");
 }finally{jobs.shutdown()}
});

test("resident worker rejects malformed 64-character Unicode tokens without crashing",()=>{
 const {createResidentWorker}=require(process.env.SUES_RESIDENT_MODULE||"../../src/engine-next/sues-resident-chromium.cjs");
 const worker=createResidentWorker({port:1,debugPort:2});
 try{
  assert.equal(worker.checkToken("x".repeat(64)),false);
  assert.equal(worker.checkToken("é".repeat(64)),false);
  assert.equal(worker.checkToken("😀".repeat(32)),false);
  assert.equal(worker.checkToken(""),false);
 }finally{worker.shutdown()}
});
