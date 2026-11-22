"use strict";
// Experimental QA-only candidate. Never reuse without source integrity and
// a keyframe-exact video-copy/readback check.
const crypto=require("crypto");
const sha=o=>crypto.createHash("sha256").update(JSON.stringify(o)).digest("hex");
function windows(project,{frames,fps,chunkFrames,globalMediaProof,rendererProof,halo=6}={}){
 if(!project||!Array.isArray(project.clips)||!Array.isArray(project.media)||
    !Number.isSafeInteger(frames)||frames<1||!Number.isSafeInteger(fps)||fps<1||
    !Number.isSafeInteger(chunkFrames)||chunkFrames<1||
    typeof globalMediaProof!=="string"||!globalMediaProof||
    typeof rendererProof!=="string"||!rendererProof) return null;
 const c=project.clips,byId=new Map();
 for(const x of c){
  if(!x||typeof x.id!=="string"||byId.has(x.id)||
     !Number.isFinite(+x.start)||!Number.isFinite(+x.duration)||
     +x.duration<0||!Number.isFinite(+x.in||0)) return null;
  byId.set(x.id,x);
 }
 const stable={...project};delete stable.clips;delete stable.revision;delete stable.name;
 // Audio is intentionally global. A sound-reactive plugin must invalidate all
 // windows until its render dependencies are explicitly modeled.
 const audio=c.filter(x=>x.kind==="audio");
 const global=sha({schema:"sues-window-reuse/qa-v1",stable,audio,
                   globalMediaProof,rendererProof,frames,fps,chunkFrames,halo});
 const out=[];
 for(let startFrame=0;startFrame<frames;startFrame+=chunkFrames){
  const endFrame=Math.min(frames,startFrame+chunkFrames),keep=new Set();
  const lo=Math.max(0,startFrame-halo),hi=Math.min(frames,endFrame+halo);
  for(const x of c){
   if(x.kind==="audio")continue;
   // Do not round source timing: edges may fall between frame centres.
   if((+x.start)*fps<hi && (+x.start + +x.duration)*fps>lo)keep.add(x.id);
  }
  for(const id of [...keep]){
   let x=byId.get(id),depth=0;
   while(x&&x.parent && depth++<c.length){
    if(typeof x.parent!=="string"||!byId.has(x.parent))return null;
    if(keep.has(x.parent))break;
    keep.add(x.parent);x=byId.get(x.parent);
   }
   if(depth>=c.length)return null;
  }
  const clips=c.filter(x=>keep.has(x.id));
  out.push({startFrame,endFrame,
    key:sha({global,startFrame,endFrame,clips})});
 }
 return out;
}
function diff(previous,current){
 if(!Array.isArray(previous)||!Array.isArray(current)||previous.length!==current.length)return null;
 return current.map((x,i)=>({
  startFrame:x.startFrame,endFrame:x.endFrame,
  reusable:x.startFrame===previous[i].startFrame &&
           x.endFrame===previous[i].endFrame && x.key===previous[i].key
 }));
}
module.exports={windows,diff};
