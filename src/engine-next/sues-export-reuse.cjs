"use strict";
const fs=require("fs"),path=require("path"),crypto=require("crypto");
const {execFileSync}=require("child_process");
const shaFile=(file)=>{const fd=fs.openSync(file,"r"),h=crypto.createHash("sha256"),b=Buffer.allocUnsafe(1024*1024);try{let n;while((n=fs.readSync(fd,b,0,b.length,null))>0)h.update(b.subarray(0,n));return h.digest("hex");}finally{fs.closeSync(fd)}};
const sha=(value)=>crypto.createHash("sha256").update(value).digest("hex");
const manifestName=".sues-export-reuse-v1.json";
const deps=["app.js","index.html","server.js","comp.js","motion.js","sues-export-audio.js","sues-segmented-export.js","sues-export-background.js"];
function fingerprint({projectFile,appDir,profile,chunkFrames,snapshotRaw=null}){
 if(process.env.SUES_EXPORT_REUSE!=="1")return null;
 const root=fs.realpathSync(path.dirname(projectFile));
 // A running export owns its initial byte-exact snapshot. Live edits must not
 // invalidate that in-flight output; media and renderer bytes are still rechecked.
 const raw=snapshotRaw==null?fs.readFileSync(projectFile):Buffer.from(snapshotRaw);
 const project=JSON.parse(raw.toString("utf8").replace(/^\uFEFF/,""));
 if(!Array.isArray(project.media)||!Array.isArray(project.clips))return null;
 // A project may mount its entire media directory from an isolated,
 // read-only asset store. Anchor containment to the resolved media directory,
 // not to project.json's directory; never follow an individual asset symlink
 // outside that resolved directory.
 const mediaRoot=fs.realpathSync(path.join(root,"media"));
 if(!fs.statSync(mediaRoot).isDirectory())return null;
 const media=[];
 for(const m of project.media){
  const u=m?.src;if(typeof u!=="string"||!u.startsWith("/media/")||u.includes("?")||u.includes("#"))return null;
  const name=decodeURIComponent(u.slice(7));
  if(!name||name.includes("..")||name.includes("\\")||name.startsWith("/")||name.includes("\0"))return null;
  const file=fs.realpathSync(path.resolve(root,"media",name));
  if(!file.startsWith(mediaRoot+path.sep))return null;
  const stat=fs.statSync(file);if(!stat.isFile())return null;
  media.push([m.id,u,stat.size,shaFile(file)]);
 }
 media.sort((a,b)=>String(a[0]).localeCompare(String(b[0])));
 const program=[];
 for(const name of deps){const file=path.join(appDir,name);if(!fs.statSync(file).isFile())return null;program.push([name,shaFile(file)])}
 return sha(JSON.stringify({schema:"sues-export-reuse/v1",project:sha(raw),media,program,profile,chunkFrames}));
}
function readManifest(exportsDir){try{const d=JSON.parse(fs.readFileSync(path.join(exportsDir,manifestName),"utf8"));return d?.version===1&&Array.isArray(d.entries)?d.entries:[]}catch{return []}}
function lookup({exportsDir,key,frames,fps}){
 if(!key)return null;
 const item=readManifest(exportsDir).find(x=>x.key===key);
 if(!item||!Number.isSafeInteger(item.size)||!item.sha256||item.frames!==frames||item.fps!==fps)return null;
 if(typeof item.file!=="string"||item.file!==path.basename(item.file)||!item.file.endsWith(".mp4"))return null;
 const file=path.join(exportsDir,item.file);
 try{
  const stat=fs.statSync(file);if(!stat.isFile()||stat.size!==item.size||shaFile(file)!==item.sha256)return null;
  const meta=JSON.parse(execFileSync("ffprobe",["-v","error","-show_entries","format=duration:stream=codec_name,codec_type,nb_frames","-of","json",file],{timeout:15000,maxBuffer:1024*1024}).toString());
  const video=meta.streams?.find(s=>s.codec_type==="video"),audio=meta.streams?.find(s=>s.codec_type==="audio");
  if(video?.codec_name!=="h264"||Number(video.nb_frames)!==frames||audio?.codec_name!=="aac"||Math.abs(Number(meta.format.duration)-frames/fps)>.08)return null;
  return {src:"/exports/"+encodeURIComponent(item.file),file,created:item.created};
 }catch{return null}
}
function remember({exportsDir,key,frames,fps,src}){
 if(!key||typeof src!=="string"||!src.startsWith("/exports/"))return false;
 const name=decodeURIComponent(src.slice(9));
 if(!name||name!==path.basename(name)||!name.endsWith(".mp4"))return false;
 const file=path.join(exportsDir,name),stat=fs.statSync(file);
 if(!stat.isFile())return false;
 const entry={key,file:name,size:stat.size,sha256:shaFile(file),frames,fps,created:Date.now()};
 // Never replace a valid cache after a failed render; write only after validated MP4 is published.
 const entries=[entry,...readManifest(exportsDir).filter(x=>x.key!==key)].slice(0,12);
 const tmp=path.join(exportsDir,manifestName+"."+process.pid+"."+crypto.randomBytes(4).toString("hex")+".tmp");
 try{fs.writeFileSync(tmp,JSON.stringify({version:1,entries})+"\n",{flag:"wx",mode:0o600});fs.renameSync(tmp,path.join(exportsDir,manifestName));return true}
 finally{try{fs.unlinkSync(tmp)}catch{}}
}
module.exports={fingerprint,lookup,remember};
