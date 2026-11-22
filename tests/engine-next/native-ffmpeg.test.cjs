"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict"),fs=require("fs"),os=require("os"),path=require("path"),{execFileSync}=require("child_process");
const Native=require(process.env.SUES_NATIVE_FFMPEG_MODULE||"../../src/engine-next/sues-native-ffmpeg.cjs");
const ff=(args)=>execFileSync("ffmpeg",["-nostdin","-hide_banner","-loglevel","error",...args],{timeout:30000,maxBuffer:1024*1024});
test("Native FFmpeg candidate exports only the proven simple FableCut subset",()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),"sues-native-"));
 try{
  const media=path.join(root,"media");fs.mkdirSync(media);
  const video=path.join(media,"v.mp4"),audio=path.join(media,"a.wav");
  ff(["-f","lavfi","-i","color=c=blue:s=64x64:r=30:d=1","-frames:v","30","-c:v","libx264","-pix_fmt","yuv420p","-preset","ultrafast","-threads","1","-y",video]);
  ff(["-f","lavfi","-i","anullsrc=cl=stereo:r=48000","-t","1","-ac","2","-ar","48000","-y",audio]);
  const proj={width:64,height:64,fps:30,tracks:[{id:"V1",kind:"video"},{id:"A1",kind:"audio"}],media:[{id:"v",kind:"video",src:"/media/v.mp4",width:64,height:64,fps:30,duration:1},{id:"a",kind:"audio",src:"/media/a.wav",duration:1}],clips:[{id:"v",kind:"video",track:"V1",mediaId:"v",start:0,in:0,duration:1,props:{volume:0}},{id:"a",kind:"audio",track:"A1",mediaId:"a",start:0,in:0,duration:1,props:{volume:1,gain:0,channelMode:"stereo"}}]};
  const ok=Native.evaluate(proj,{dataDir:root});
  assert.equal(ok.ok,true,JSON.stringify(ok));
  const out=path.join(root,"final.mp4");
  const args=Native.command(ok,out);
  ff(args.slice(6));
  const info=JSON.parse(execFileSync("ffprobe",["-v","error","-show_entries","format=duration:stream=codec_name,codec_type,nb_frames","-of","json",out],{timeout:10000}).toString());
  assert.equal(info.streams.find(s=>s.codec_type==="video").nb_frames,"30");
  assert.equal(info.streams.find(s=>s.codec_type==="audio").codec_name,"aac");
  const fails=[
   [{...proj.clips[0],props:{}},proj.clips[1]],
   [{...proj.clips[0],props:{volume:0,scale:1.02}},proj.clips[1]],
   [proj.clips[0],{...proj.clips[1],props:{volume:1,gain:1}}],
   [{...proj.clips[0],props:{volume:0,futureEffect:1}},proj.clips[1]],
   [...proj.clips,{id:"title",kind:"comp",track:"V2",start:0,duration:1,compId:"x"}]
  ];
  for(const clips of fails)assert.equal(Native.evaluate({...proj,clips},{dataDir:root}).ok,false);
  assert.throws(()=>Native.command({ok:false},out));
  console.log("Native FFmpeg: 30 video frames + AAC; unknown effects, audio gain and composites blocked");
 }finally{fs.rmSync(root,{recursive:true,force:true})}
});
