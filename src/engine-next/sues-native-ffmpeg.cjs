"use strict";
const fs=require("fs"),path=require("path"),crypto=require("crypto"),{execFileSync,spawn}=require("child_process");
const n=(x,d)=>x==null?d:Number(x);
const equal=(a,b)=>Math.abs(n(a,b)-b)<1e-8;
const rejects={ok:false};
function evaluate(project,{dataDir}={}){
 const failure=(code,clip)=>({ok:false,reason:code,...(clip?{clip}:{}),engine:"existing-compositor"});
 if(!project||!Array.isArray(project.clips)||!Array.isArray(project.media))return failure("INVALID_PROJECT");
 if(n(project.fps,30)!==30||!Number.isInteger(project.width)||!Number.isInteger(project.height))return failure("UNSUPPORTED_CANVAS");
 if(Array.isArray(project.tracks)&&project.tracks.some(t=>t.muted===true||t.solo===true||t.gain!=null||t.volume!=null))return failure("TRACK_AUDIO_OR_SOLO_UNSUPPORTED");
 const mediaById=new Map(project.media.map(m=>[m.id,m]));
 const disabled=new Set(project.disabledTracks||[]),clips=project.clips.filter(c=>c.disabled!==true&&!disabled.has(c.track));
 const videos=[],audios=[],root=path.resolve(dataDir||".");
 const exact=(t)=>Number.isFinite(t)&&Math.abs(t*30-Math.round(t*30))<0.00001;
 function safeMedia(c,kind){
  const m=mediaById.get(c.mediaId),u=m?.src;
  if(!m||m.kind!==kind||typeof u!=="string"||!u.startsWith("/media/")||u.includes("?")||u.includes("#"))return null;
  const name=decodeURIComponent(u.slice(7));
  if(!name||name.includes("..")||name.includes("\\")||name.startsWith("/"))return null;
  const file=path.resolve(root,"media",name);
  try{const p=fs.realpathSync(file);if(!p.startsWith(root+path.sep)||!fs.statSync(p).isFile())return null;return {file,p,m}}catch{return null}
 }
 function safeProps(c){
  if(Object.keys(c).some(k=>!["id","mediaId","kind","track","start","in","duration","name","props","disabled","keyframes"].includes(k)))return false;
  if(c.keyframes&&Object.keys(c.keyframes).length)return false;
  if(c.parent||c.mask||c.filters||c.trackMatte||c.trackMask||p?.autoOrient||n(p?.pathOffset,0)!==0||!['start',undefined].includes(p?.pathAlign))return false;
  if(c.transitions?.length||c.fades?.length)return false;
  const p=c.props||{};
  const vals={x:0,y:0,scale:1,rotation:0,opacity:1,anchorX:0,anchorY:0,trimStart:0,trimEnd:100,trimOffset:0,speed:1,blur:0,brightness:100,contrast:100,saturation:100,hue:0,grayscale:0,sepia:0,invert:0,temperature:0,tint:0,vignette:0,shake:0,rgbSplit:0,grain:0,motionBlur:0,cropL:0,cropR:0,cropT:0,cropB:0,cornerRadius:0};
  for(const [k,v] of Object.entries(vals))if(!equal(p[k],v))return false;
  if(p.bgRemove||p.flipH||p.flipV||p.chromaKey||(!["normal",undefined].includes(p.blend))||(!["none",undefined].includes(p.filterPreset)))return false;
  if(!["contain","cover",undefined].includes(p.fit))return false;
  if(c.kind==="video"&&!equal(n(p.volume,1),0))return false;
  if(c.kind==="audio"&&(!equal(p.volume,1)||!equal(p.gain,0)||!equal(p.pan,0)||!equal(p.duck,0)||!['stereo',undefined].includes(p.channelMode)))return false;
  return true;
 }
 for(const c of clips){
  if(!["video","audio"].includes(c.kind))return failure("GRAPHIC_OR_COMPOSITE_REQUIRES_BROWSER",c.id);
  if(c.kind==="video"&&c.track!=="V1")return failure("VIDEO_OVERLAY_REQUIRES_BROWSER",c.id);
  if(c.kind==="audio"&&c.track!=="A1")return failure("AUDIO_MIX_REQUIRES_BROWSER",c.id);
  if(!safeProps(c))return failure("DYNAMIC_OR_FILTERED_CLIP_REQUIRES_BROWSER",c.id);
  if(![c.start,c.in,c.duration].every(exact)||c.start<0||c.in<0||c.duration<=0)return failure("NON_FRAME_EXACT_TIMING",c.id);
  const m=safeMedia(c,c.kind);if(!m)return failure("MEDIA_UNRESOLVED_OR_NONLOCAL",c.id);
  if(Number.isFinite(m.m.duration)&&c.in+c.duration>m.m.duration+0.05)return failure("SOURCE_TIME_EXCEEDS_MEDIA",c.id);
  const to={id:c.id,file:m.file,startFrame:Math.round(c.start*30),inFrame:Math.round(c.in*30),frames:Math.round(c.duration*30)};
  if(c.kind==="video"){
   if(m.m.width!==project.width||m.m.height!==project.height||m.m.fps!==30)return failure("VIDEO_GEOMETRY_OR_FPS_UNKNOWN",c.id);
   videos.push(to)
  }else audios.push(to)
 }
 videos.sort((a,b)=>a.startFrame-b.startFrame);
 if(!videos.length)return failure("NO_BASE_VIDEO");
 let pos=0;for(const v of videos){if(v.startFrame!==pos)return failure("OVERLAP_OR_GAP_IN_BASE_VIDEO",v.id);pos+=v.frames}
 if(audios.length>1)return failure("MULTITRACK_AUDIO_REQUIRES_MIXER");
 if(audios.length&&!(audios[0].startFrame===0&&audios[0].frames===pos))return failure("AUDIO_CUT_OR_GAP_REQUIRES_MIXER");
 const result={ok:true,engine:"native-ffmpeg",fps:30,width:project.width,height:project.height,frames:pos,video:videos,audio:audios[0]||null};
 return result;
}
function command(plan,output,{preset="veryfast",crf=25}={}){
 if(!plan?.ok||plan.engine!=="native-ffmpeg")throw Error("Native output is forbidden without a successful fidelity preflight");
 const args=["-nostdin","-y","-hide_banner","-loglevel","error","-filter_complex_threads","1"];
 const streams=[];let index=0;
 for(const clip of plan.video){
  args.push("-ss",String(clip.inFrame/30),"-t",String(clip.frames/30),"-i",clip.file);
  streams.push(`[${index}:v]trim=start=0:duration=${clip.frames/30},setpts=PTS-STARTPTS,fps=30,format=yuv420p[v${index}]`);
  index++;
 }
 if(plan.audio){
  args.push("-ss",String(plan.audio.inFrame/30),"-t",String(plan.audio.frames/30),"-i",plan.audio.file);
  streams.push(`[${index}:a]atrim=start=0:duration=${plan.frames/30},asetpts=PTS-STARTPTS,aresample=48000[aout]`);
 }else{
  args.push("-f","lavfi","-t",String(plan.frames/30),"-i","anullsrc=cl=stereo:r=48000");
  streams.push(`[${index}:a]atrim=start=0:duration=${plan.frames/30},asetpts=PTS-STARTPTS[aout]`);
 }
 if(index===1)streams.push("[v0]null[vout]");
 else streams.push(plan.video.map((_,i)=>`[v${i}]`).join("")+`concat=n=${index}:v=1:a=0[vout]`);
 args.push("-filter_complex",streams.join(";"),"-map","[vout]","-map","[aout]","-frames:v",String(plan.frames),"-r","30","-t",String(plan.frames/30),"-c:v","libx264","-preset",preset,"-crf",String(crf),"-threads","1","-pix_fmt","yuv420p","-c:a","aac","-b:a","192k","-ar","48000","-ac","2","-movflags","+faststart",output);
 return args;
}
module.exports={evaluate,command};
