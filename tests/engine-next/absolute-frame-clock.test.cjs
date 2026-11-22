"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
function absoluteTime(startFrame,localFrame,fps){return (startFrame+localFrame)/fps}
test("absolute integer frame times are bit-for-bit identical for arbitrary chunk partitions",()=>{
 for(const fps of [24,25,30,60]){
  for(const chunkFrames of [15,30,90,180]){
   for(let global=0;global<4000;global++){
    const base=Math.floor(global/chunkFrames)*chunkFrames;
    const local=global-base;
    assert.ok(Object.is(absoluteTime(base,local,fps),global/fps),`frame ${global}, fps ${fps}, window ${chunkFrames}`);
   }
  }
 }
});
test("float summation at an edit cut is not equivalent to the global frame clock",()=>{
 const wrong=540/30+91/30;
 const correct=631/30;
 assert.notEqual(wrong,correct);
 assert.equal(absoluteTime(540,91,30),correct);
 assert.equal(absoluteTime(630,1,30),correct);
});
test("candidate compositor uses absolute global time when QA app path is supplied",()=>{
 if(!process.env.SUES_QA_APP_JS)return;
 const code=fs.readFileSync(process.env.SUES_QA_APP_JS,"utf8");
 assert.match(code,/exportFrameWindow\.startFrame\s*\+\s*f\)\s*\/\s*fps/);
 assert.match(code,/seekVideosTo\(t,/);
 assert.match(code,/prepareFrameAssets\(t\)/);
 assert.match(code,/drawFrame\(t\)/);
});
