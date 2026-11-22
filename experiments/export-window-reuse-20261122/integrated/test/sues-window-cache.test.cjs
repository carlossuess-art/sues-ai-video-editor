"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),os=require("node:os"),path=require("node:path");
const {execFileSync}=require("node:child_process");
const Store=require("../sues-window-cache.cjs");
test("validates an MP4 before reuse and rejects tampering or missing files",()=>{
 const d=fs.mkdtempSync(path.join(os.tmpdir(),"sues-cache-test-"));
 try{
  const f=path.join(d,"original.mp4");
  execFileSync("ffmpeg",["-nostdin","-hide_banner","-loglevel","error","-y",
   "-f","lavfi","-i","color=c=black:s=160x90:r=30",
   "-f","lavfi","-i","anullsrc=channel_layout=stereo:sample_rate=48000",
   "-t","0.5","-c:v","libx264","-threads","1","-pix_fmt","yuv420p",
   "-c:a","aac","-shortest",f],{timeout:30000});
  const opts={exportsDir:d,windows:[{startFrame:0,endFrame:15,key:"abc"}],frames:15,fps:30};
  assert(Store.remember({...opts,src:"/exports/original.mp4"}));
  const found=Store.lookup(opts);
  assert.equal(found?.reused,1);
  assert.equal(found?.sha256,Store.shaFile(f));
  assert.equal(Store.lookup({...opts,windows:[{...opts.windows[0],key:"def"}]}).reused,0);
  fs.appendFileSync(f,Buffer.from([1,2,3]));
  assert.equal(Store.lookup(opts),null);
  assert.equal(Store.remember({...opts,src:"/exports/../bad.mp4"}),false);
 }finally{fs.rmSync(d,{recursive:true,force:true})}
});
test("symlinked output is never cached",()=>{
 const d=fs.mkdtempSync(path.join(os.tmpdir(),"sues-cache-sym-"));
 try{
  fs.symlinkSync("/etc/hosts",path.join(d,"evil.mp4"));
  assert.equal(Store.remember({exportsDir:d,src:"/exports/evil.mp4",windows:[],frames:15,fps:30}),false);
 }finally{fs.rmSync(d,{recursive:true,force:true})}
});
