"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {parseSingleRange:p}=require("../sues-http-range.cjs");
test("valid direct and suffix single ranges",()=>{
 assert.deepEqual(p("bytes=0-1023",5000),{start:0,end:1023});
 assert.deepEqual(p("bytes=500-",5000),{start:500,end:4999});
 assert.deepEqual(p("bytes=4990-9000",5000),{start:4990,end:4999});
 assert.deepEqual(p("bytes=-10",5000),{start:4990,end:4999});
 assert.deepEqual(p("bytes=-9000",5000),{start:0,end:4999});
});
test("rejects impossible, malformed and multi ranges",()=>{
 for(const r of ["bytes=5000-5001","bytes=100-99","bytes=-0","bytes=-",
 "bytes=foo","bytes=0-1,3-4","other=0-1","bytes=99999999999999999999999-"])
  assert.equal(p(r,5000),null,r);
 assert.equal(p("bytes=0-1",0),null);
});
