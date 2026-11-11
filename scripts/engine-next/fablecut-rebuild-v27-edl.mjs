// Private reconstruction candidate: apply the actual V27 EDL in reverse order
// using the upstream native extract operation on a clone, never production.
import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';import {projectFingerprint} from '../../src/engine-next/fablecut-command-batch.js';
const [engine,source,edlPath,destination]=process.argv.slice(2),src=fs.realpathSync(source),out=path.resolve(destination);
const base=fs.realpathSync(path.dirname(out));if(!base.endsWith('/automation-v1')||fs.existsSync(out)||!src.includes('/data/qa/'))throw Error('Private QA only');
const original=JSON.parse(fs.readFileSync(src+'/project.json')),p=structuredClone(original),edl=JSON.parse(fs.readFileSync(edlPath));
const native=createRequire(import.meta.url)(path.join(engine,'project-ops.js'));
if(!Array.isArray(edl.cuts)||edl.cuts.length!==8)throw Error('EDL unexpected');
const tracks=p.tracks.map(t=>t.id),notes=[],origins=new Map();
for(const c of p.clips){c.suesAuditOrigin=c.id;origins.set(c.id,structuredClone(c))}
for(const cut of [...edl.cuts].reverse()){
 const r=native.applyPatch(p,[{op:'extract',from:cut.start,to:cut.end,tracks,force:true}],{});
 notes.push({cut,notes:r.notes,clips:p.clips.length});
}
const mismatches=[],corrections=[],lineage=[],animationRebases=[],captionRebases=[],transitionWarnings=[],transitionRebases=[];
const map=t=>t-edl.cuts.reduce((n,c)=>n+Math.max(0,Math.min(t,c.end)-c.start),0);
const near=(a,b)=>Math.abs(a-b)<.002;
for(const o of original.clips){
 const end=o.start+o.duration,parts=edl.timeMap.map(([a,b])=>[Math.max(a,o.start),Math.min(b,end)]).filter(([a,b])=>b-a>.002);
 const actual=p.clips.filter(c=>c.suesAuditOrigin===o.id).sort((a,b)=>a.start-b.start);
 if(parts.length!==actual.length)mismatches.push({id:o.id,reason:'SEGMENT_COUNT',expected:parts.length,actual:actual.length});
 for(let i=0;i<Math.min(parts.length,actual.length);i++){
  const [a,b]=parts[i],c=actual[i];
  // Upstream rounds edits to 4 decimals; a split piece on a boundary can
  // miss its ripple move. Recover exact EDL coordinates from the source,
  // but do not silently repair a substantially different source span.
  const expectedStart=map(a),expectedDuration=b-a;
  if(!near(c.start,expectedStart)||!near(c.duration,expectedDuration)){
   if(Math.abs(c.duration-expectedDuration)>.025) {mismatches.push({id:o.id,reason:'SOURCE_SPAN_MISMATCH'});continue}
   corrections.push({id:o.id,clipId:c.id,before:[c.start,c.duration],after:[expectedStart,expectedDuration]});
   c.start=expectedStart;c.duration=expectedDuration;
  }
  const head=a-o.start,tail=o.start+o.duration-b;
  // Like the native comp virtualizer, retain every original key. Negative
  // clip-local times preserve the original interpolation at a cut boundary.
  if((head>.000001||tail>.000001)&&o.keyframes&&Object.keys(o.keyframes).length){
   c.keyframes=Object.fromEntries(Object.entries(o.keyframes).map(([k,ks])=>[k,Array.isArray(ks)?ks.map(key=>({...key,t:key.t-head})):ks]));
   animationRebases.push({originalClipId:o.id,clipId:c.id,head,tail,channels:Object.keys(o.keyframes)});
  }
  // Native caption playback uses a fallback evenly spaced clock when the
  // number of stored words differs from the displayed rolling caption.
  // Reconstruct that original clock first, then translate it into this piece.
  if((head>.000001||tail>.000001)&&o.kind==='text'&&o.props?.textAnim==='word-pop'){
   const n=String(o.props.text??'').trim().split(/\s+/).filter(Boolean).length;
   if(n){
    const wt=o.props.wordTimes,rate=Number(o.props.wordRate)||.15;
    const step=Array.isArray(wt)?Math.max(.05,o.duration/n):rate;
    const clock=Array.isArray(wt)&&wt.length===n?wt:Array.from({length:n},(_,j)=>[j*step,(j+1)*step]);
    c.props={...c.props,wordTimes:clock.map(([x,y])=>[x-head,y-head])};
    captionRebases.push({originalClipId:o.id,clipId:c.id,head,tail,words:n,usedOriginalFallback:!(Array.isArray(wt)&&wt.length===n)});
   }
  }
  const clippedIn=head>.000001&&o.transitionIn&&head<o.transitionIn.duration;
  const clippedOut=tail>.000001&&o.transitionOut&&tail<o.transitionOut.duration;
  if(clippedIn||clippedOut){
   if(!['image','svg'].includes(o.kind)||clippedIn&&o.transitionIn.type!=='fade'||clippedOut&&o.transitionOut.type!=='fade')
    transitionWarnings.push({originalClipId:o.id,clipId:c.id,head,tail,reason:'CUT_INSIDE_TRANSITION_REQUIRES_RENDER_PARITY'});
   else {
    // Preserve the actual canvas fade formula at every output frame.
    const ease={linear:u=>u,'ease-in':u=>u*u,'ease-out':u=>1-(1-u)**2,'ease-in-out':u=>u<.5?2*u*u:1-(-2*u+2)**2/2};
    const channel=(ks,t,fallback)=>{if(!ks?.length)return fallback;if(t<=ks[0].t)return ks[0].v;if(t>=ks.at(-1).t)return ks.at(-1).v;for(let j=0;j<ks.length-1;j++){const k=ks[j],n=ks[j+1];if(t>=k.t&&t<=n.t)return k.v+(n.v-k.v)*(ease[n.ease||'ease-in-out']||ease.linear)((t-k.t)/(n.t-k.t))}return fallback};
    const times=[0,c.duration];
    for(let f=Math.ceil(c.start*p.fps-1e-6);f/p.fps<c.start+c.duration-1e-6;f++)times.push(Math.max(0,f/p.fps-c.start));
    const distinct=[...new Set(times)].sort((x,y)=>x-y);
    const clamp=x=>Math.max(0,Math.min(1,x));
    c.keyframes={...(c.keyframes??{}),opacity:distinct.map(t=>{
     const originalLocal=head+t;let v=channel(o.keyframes?.opacity,originalLocal,o.props?.opacity??1);
     if(clippedIn)v*=ease['ease-out'](clamp(originalLocal/o.transitionIn.duration));
     if(clippedOut)v*=1-ease['ease-in'](clamp((originalLocal-(o.duration-o.transitionOut.duration))/o.transitionOut.duration));
     return {t,v,ease:'linear'};
    })};
    if(clippedIn)delete c.transitionIn;if(clippedOut)delete c.transitionOut;
    transitionRebases.push({originalClipId:o.id,clipId:c.id,head,tail,samples:distinct.length});
   }
  }
  lineage.push({originalClipId:o.id,clipId:c.id,sourceTimeline:[a,b],editedTimeline:[c.start,c.start+c.duration]});
  if(!near(c.start,map(a))||!near(c.duration,b-a))mismatches.push({id:o.id,clipId:c.id,reason:'TIMING',expected:[map(a),b-a],actual:[c.start,c.duration]});
  if(c.locked!==o.locked||c.disabled!==o.disabled)mismatches.push({id:o.id,reason:'LOCK_OR_VISIBILITY_CHANGED'});
 }
}
for(const c of p.clips)delete c.suesAuditOrigin;
p.revision=original.revision+1;p.name='SUES V27 editable EDL candidate';p.inPoint=0;p.outPoint=72.6;
native.checkProject(p);
fs.mkdirSync(out,{mode:0o700});fs.mkdirSync(out+'/media');
for(const m of original.media){const n=decodeURIComponent(m.src.slice(7));if(n.includes('/')||!m.src.startsWith('/media/'))throw Error('Unsafe media');const f=fs.realpathSync(src+'/media/'+n);if(!f.includes('/srv/sues-fablecut-next/data/'))throw Error('Outside data');const target=out+'/media/'+n;if(fs.existsSync(target)){if(fs.realpathSync(target)!==f)throw Error('Media name collision')}else fs.symlinkSync(f,target);}
fs.writeFileSync(out+'/project.json',JSON.stringify(p,null,2));
fs.writeFileSync(out+'/rebuild-proof.json',JSON.stringify({status:mismatches.length?'CANDIDATE_TIMING_MISMATCH':'NATIVE_EDL_TIMING_VERIFIED_NOT_RENDERED',sourceFingerprint:projectFingerprint(original),resultFingerprint:projectFingerprint(p),sourceClips:original.clips.length,resultClips:p.clips.length,notes,lineage,corrections,mismatches,animationRebases,captionRebases,transitionWarnings,transitionRebases,originalUnchanged:projectFingerprint(JSON.parse(fs.readFileSync(src+'/project.json')))===projectFingerprint(original)},null,2));
console.log(JSON.stringify({sourceClips:original.clips.length,resultClips:p.clips.length,notes,mismatches:mismatches.slice(0,12),mismatchCount:mismatches.length,corrections:corrections.length,animationRebases:animationRebases.length,captionRebases:captionRebases.length,transitionWarnings:transitionWarnings.length,transitionRebases:transitionRebases.length,duration:Math.max(...p.clips.filter(c=>!c.disabled).map(c=>c.start+c.duration))}));
