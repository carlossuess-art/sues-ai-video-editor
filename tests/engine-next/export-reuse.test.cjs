"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict");
const fs=require("fs"),os=require("os"),path=require("path"),{execFileSync}=require("child_process");
const Reuse=require(process.env.SUES_EXPORT_REUSE_MODULE||"../../src/engine-next/sues-export-reuse.cjs");
const deps=["app.js","index.html","server.js","comp.js","motion.js","sues-export-audio.js","sues-segmented-export.js","sues-export-background.js"];
test("SUES export reuse: same byte-identical project/media/program yields cached MP4; every change invalidates",()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),"sues-cache-qa-"));
 const initial=process.env.SUES_EXPORT_REUSE;
 try{
  process.env.SUES_EXPORT_REUSE="1";
  const appDir=path.join(tmp,"app"),mediaDir=path.join(tmp,"media"),exportsDir=path.join(tmp,"exports");
  for(const d of [appDir,mediaDir,exportsDir])fs.mkdirSync(d);
  for(const d of deps)fs.writeFileSync(path.join(appDir,d),"original:"+d);
  const media=path.join(mediaDir,"source.mp4");fs.writeFileSync(media,"original media");
  const projectFile=path.join(tmp,"project.json");
  const project={name:"qa",fps:30,width:64,height:64,revision:1,clips:[{id:"v",kind:"video",mediaId:"v",start:0,duration:.5}],media:[{id:"v",src:"/media/source.mp4"}]};
  fs.writeFileSync(projectFile,JSON.stringify(project));
  const params=()=>({projectFile,appDir,profile:"webcodecs",chunkFrames:5});
  const key=Reuse.fingerprint(params());assert.match(key,/^[0-9a-f]{64}$/);
  const movie=path.join(exportsDir,"test.mp4");
  execFileSync("ffmpeg",["-v","error","-nostdin","-f","lavfi","-i","color=c=black:s=64x64:r=30:d=0.5","-f","lavfi","-i","anullsrc=r=48000:cl=stereo","-frames:v","15","-t","0.5","-c:v","libx264","-preset","ultrafast","-threads","1","-c:a","aac","-b:a","48k","-y",movie],{timeout:25000});
  assert.equal(Reuse.remember({exportsDir,key,frames:15,fps:30,src:"/exports/test.mp4"}),true);
  assert.equal(Reuse.lookup({exportsDir,key,frames:15,fps:30}).src,"/exports/test.mp4");
  assert.equal(Reuse.lookup({exportsDir,key,frames:16,fps:30}),null);
  assert.equal(Reuse.lookup({exportsDir,key,frames:15,fps:25}),null);
  const changedProfile=Reuse.fingerprint({...params(),profile:"delivery"});
  assert.notEqual(changedProfile,key);assert.equal(Reuse.lookup({exportsDir,key:changedProfile,frames:15,fps:30}),null);
  fs.writeFileSync(media,"altered original media");assert.notEqual(Reuse.fingerprint(params()),key);
  fs.writeFileSync(media,"original media");
  project.revision=2;fs.writeFileSync(projectFile,JSON.stringify(project));assert.notEqual(Reuse.fingerprint(params()),key);
  project.revision=1;fs.writeFileSync(projectFile,JSON.stringify(project));
  fs.appendFileSync(path.join(appDir,"motion.js"),"engine change");assert.notEqual(Reuse.fingerprint(params()),key);
  fs.writeFileSync(path.join(appDir,"motion.js"),"original:motion.js");
  assert.equal(Reuse.fingerprint(params()),key);
  const fd=fs.openSync(movie,"r+");try{fs.writeSync(fd,Buffer.from([0]),0,1,Math.max(0,fs.statSync(movie).size-1))}finally{fs.closeSync(fd)}
  assert.equal(Reuse.lookup({exportsDir,key,frames:15,fps:30}),null,"tampered MP4 cannot hit cache");
  process.env.SUES_EXPORT_REUSE="0";assert.equal(Reuse.fingerprint(params()),null);
  console.log("SUES export reuse: hashing, invalidation, tamper, codec and FPS PASS");
 }finally{
  process.env.SUES_EXPORT_REUSE=initial??"0";
  fs.rmSync(tmp,{recursive:true,force:true});
 }
});
