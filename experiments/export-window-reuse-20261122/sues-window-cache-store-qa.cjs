"use strict";
const fs=require("fs"),path=require("path"),crypto=require("crypto"),{execFileSync}=require("child_process");
const name=".sues-window-cache-qa-v1.json";
function shaFile(p){
 const h=crypto.createHash("sha256"),fd=fs.openSync(p,"r"),buf=Buffer.allocUnsafe(1048576);
 try{let n;while((n=fs.readSync(fd,buf,0,buf.length,null))>0)h.update(buf.subarray(0,n));}
 finally{fs.closeSync(fd);}
 return h.digest("hex");
}
function lookup({exportsDir,windows,frames,fps}){
 try{
  const m=JSON.parse(fs.readFileSync(path.join(exportsDir,name),"utf8"));
  if(m.schema!=="sues-window-cache/qa-v1"||m.frames!==frames||m.fps!==fps||
     !Array.isArray(m.windows)||!Array.isArray(windows)||
     m.windows.length!==windows.length||typeof m.file!=="string"||
     m.file!==path.basename(m.file)||!m.file.endsWith(".mp4"))return null;
  const f=path.join(exportsDir,m.file),st=fs.statSync(f);
  if(!st.isFile()||st.size!==m.size||shaFile(f)!==m.sha256)return null;
  const data=JSON.parse(execFileSync("ffprobe",["-v","error","-show_entries","stream=codec_type,codec_name,nb_frames:format=duration","-of","json",f],{timeout:20000}).toString());
  if(!data.streams.some(s=>s.codec_type==="video"&&s.codec_name==="h264"&&+s.nb_frames===frames)||
     !data.streams.some(s=>s.codec_type==="audio"&&s.codec_name==="aac")||
     Math.abs(+data.format.duration-frames/fps)>.08)return null;
  const reuse=windows.map((w,i)=>{
   const old=m.windows[i];return old?.startFrame===w.startFrame&&old?.endFrame===w.endFrame&&old?.key===w.key;
  });
  return {file:f,reuse,reused:reuse.filter(Boolean).length};
 }catch{return null;}
}
function remember({exportsDir,src,windows,frames,fps}){
 if(!src?.startsWith("/exports/")||!Array.isArray(windows))return false;
 const fName=decodeURIComponent(src.slice(9));
 if(fName!==path.basename(fName)||!fName.endsWith(".mp4"))return false;
 const file=path.join(exportsDir,fName),st=fs.statSync(file);
 if(!st.isFile())return false;
 const m={schema:"sues-window-cache/qa-v1",file:fName,size:st.size,sha256:shaFile(file),frames,fps,windows,createdAt:Date.now()};
 const temp=path.join(exportsDir,name+"."+process.pid+"."+crypto.randomBytes(4).toString("hex")+".tmp");
 try{fs.writeFileSync(temp,JSON.stringify(m)+"\n",{flag:"wx",mode:0o600});fs.renameSync(temp,path.join(exportsDir,name));return true}
 finally{try{fs.unlinkSync(temp)}catch{}}
}
module.exports={lookup,remember,shaFile};
