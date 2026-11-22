"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),os=require("node:os"),path=require("node:path");
const {createSegmentedExports}=require("../sues-segmented-export.js");
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
test("cancelling an in-flight export never publishes a final MP4",async()=>{
 const d=fs.mkdtempSync(path.join(os.tmpdir(),"sues-cancel-"));
 const old1=process.env.SUES_WINDOW_REUSE,old2=process.env.SUES_EXPORT_REUSE;
 process.env.SUES_WINDOW_REUSE="0";process.env.SUES_EXPORT_REUSE="0";
 try{
  const projectFile=path.join(d,"project.json"),exportsDir=path.join(d,"exports");
  fs.mkdirSync(exportsDir);fs.writeFileSync(projectFile,JSON.stringify({fps:30,clips:[
   {id:"one",kind:"video",start:0,duration:1,in:0,props:{}}],media:[]}));
  const cancelled=[],jobs={request(){return{id:"dummy"}},get(){return{status:"running",progress:.1}},
   cancel(id){cancelled.push(id)},releaseWorker:async()=>true};
  const engine=createSegmentedExports({jobs,projectFile,exportsDir,chunkFrames:15});
  const j=engine.request();
  await delay(40);engine.cancel(j.id);
  await delay(1200);
  assert.equal(engine.get(j.id).status,"cancelled");
  assert.equal(engine.get(j.id).src,null);
  assert(cancelled.includes("dummy"));
  assert(!fs.readdirSync(exportsDir).some(x=>x.endsWith(".mp4")));
 }finally{
  if(old1===undefined)delete process.env.SUES_WINDOW_REUSE;else process.env.SUES_WINDOW_REUSE=old1;
  if(old2===undefined)delete process.env.SUES_EXPORT_REUSE;else process.env.SUES_EXPORT_REUSE=old2;
  fs.rmSync(d,{recursive:true,force:true});
 }
});
