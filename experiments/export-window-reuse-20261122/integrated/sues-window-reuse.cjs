"use strict";
// Experimental QA-only candidate. Never reuse without source integrity and
// a keyframe-exact video-copy/readback check.
const crypto=require("crypto");
const sha=o=>crypto.createHash("sha256").update(JSON.stringify(o)).digest("hex");
function windows(project,{frames,fps,chunkFrames,globalMediaProof,rendererProof,halo=6,compScoped=false}={}){
 if(!project||!Array.isArray(project.clips)||!Array.isArray(project.media)||
    !Number.isSafeInteger(frames)||frames<1||!Number.isSafeInteger(fps)||fps<1||
    !Number.isSafeInteger(chunkFrames)||chunkFrames<1||
    typeof globalMediaProof!=="string"||!globalMediaProof||
    typeof rendererProof!=="string"||!rendererProof) return null;
 const supported=new Set(['audio','video','image','text','shape','comp']);
 if(!project.clips.every(x=>x&&supported.has(x.kind)))return null;
 const c=project.clips,byId=new Map();
 for(const x of c){
  if(!x||typeof x.id!=="string"||byId.has(x.id)||
     !Number.isFinite(+x.start)||!Number.isFinite(+x.duration)||
     +x.duration<0||!Number.isFinite(+x.in||0)) return null;
  byId.set(x.id,x);
 }
 // Fail closed on any cyclic or dangling hierarchy, including offscreen clips.
 // Otherwise a parent cycle can escape window-local dependency checks.
 for(const x of c){
  const seen=new Set([x.id]);let node=x;
  while(node.parent!==undefined&&node.parent!==null&&node.parent!==""){
   if(typeof node.parent!=="string"||!byId.has(node.parent)||seen.has(node.parent))return null;
   seen.add(node.parent);node=byId.get(node.parent);
  }
 }
 // QA opt-in: keep each composition's complete definition in the window
 // where its parent clip is visible. Audio-bearing comps fail closed.
 const compById=new Map();
 if(compScoped){
  if(!Array.isArray(project.comps))return null;
  for(const cm of project.comps){
   if(!cm||typeof cm.id!=="string"||compById.has(cm.id)||!Array.isArray(cm.clips))return null;
   compById.set(cm.id,cm);
   if(cm.clips.some(x=>!x||x.kind==="audio"))return null;
  }
 }
 const depend=(clip,acc,seen)=>{
  if(clip.kind!=="comp")return true;
  const cm=compById.get(clip.compId);
  if(!cm||seen.has(cm.id))return false;
  acc.set(cm.id,cm);
  const next=new Set(seen);next.add(cm.id);
  return cm.clips.every(child=>child.kind!=="audio"&&
    (child.kind!=="comp"||depend(child,acc,next)));
 };
 const stable={...project};delete stable.clips;delete stable.revision;delete stable.name;
 if(compScoped)delete stable.comps;
 // Audio is intentionally global. A sound-reactive plugin must invalidate all
 // windows until its render dependencies are explicitly modeled.
 const audio=c.filter(x=>x.kind==="audio");
 const global=sha({schema:compScoped?"sues-window-reuse/qa-v2-comp":"sues-window-reuse/qa-v1",stable,audio,
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
  let comps=null;
  if(compScoped){
   const deps=new Map();
   for(const clip of clips)if(!depend(clip,deps,new Set()))return null;
   comps=[...deps].sort(([a],[b])=>a.localeCompare(b));
  }
  out.push({startFrame,endFrame,
    key:sha({global,startFrame,endFrame,clips,...(compScoped?{comps}:{})})});
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
