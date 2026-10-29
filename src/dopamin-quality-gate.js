import {montageMap,projectInterval,montageToOutput} from './montage-cuts.js';
// Technical editorial guard; narrative relevance and audibility require review.
const interval=(e,d)=>e&&Number.isFinite(e.start)&&Number.isFinite(e.end)&&e.start>=0&&e.end>e.start&&e.end<=d+1e-6;
export function dopaminQualityGate(plan){
 const style=plan?.policy?.templateId,limit=style==='SUES_DOPAMIN'?6:style==='SUES_CALMA'?8:null;
 if(!limit)return {applicable:false,pass:true,issues:[]};
 const compositionDuration=plan.duration,issues=[];
 if(!Number.isFinite(compositionDuration)||compositionDuration<=0)return {applicable:true,pass:false,issues:['duración válida'],maxGap:null};
 const map=plan.postEdit?.cuts?.length?montageMap(compositionDuration,plan.postEdit.cuts):null;
 const d=map?.duration??compositionDuration;
 if(!Number.isFinite(d)||d<=0)return {applicable:true,pass:false,issues:['duración válida'],maxGap:null};
 const valid=xs=>(xs??[]).filter(e=>interval(e,compositionDuration)&&e.hidden!==true&&e.enabled!==false&&e.opacity!==0)
  .flatMap(e=>map?projectInterval(map,e.start,e.end).map(span=>({...e,...span,qualitySource:e.qualitySource??e})):e);
 const count=xs=>new Set(xs.map(e=>e.qualitySource??e)).size;
 const broll=valid(plan.selectedMedia);
 const motions=valid([...(plan.semantic?.motions??[]),...(plan.graphics??[]),...(plan.elements??[]),...(plan.masterGraphics??[])]);
 // Blur, ambience, transitions, ordinary captions and camera motion never count.
 const cutouts=valid([...(plan.subjectLayers??[]),...(plan.foregroundEffects?.events??[]).filter(e=>['behind-video','behind-text'].includes(e.type))]);
 const visuals=[...broll,...motions,...cutouts,...valid(plan.illustrations)];
 const starts=visuals.map(e=>e.start).sort((a,b)=>a-b),distinct=[];
 for(const start of starts)if(!distinct.length||start-distinct.at(-1)>=.3)distinct.push(start);
 const hooks=visuals.filter(e=>e.start<=3);
 if(!hooks.length)issues.push('un apoyo visual semántico durante los tres primeros segundos');
 const effects=[
  ...(plan.soundEffects?.enabled&&plan.soundEffects.gain>0?(plan.soundEffects.events??[]).filter(e=>(e.weight??1)>0):[]),
  ...(plan.customSfx?.events??[]).filter(e=>e.gain>0)
 ].filter(e=>e.hidden!==true&&e.enabled!==false&&Number.isFinite(e.start)&&e.start>=0&&e.start<compositionDuration)
  .filter(e=>!map||map.spans.some(s=>e.start>=s.start&&e.start<s.end))
  .map(e=>map?{...e,start:montageToOutput(map,e.start)}:e).filter(e=>e.start<=3);
 // Maximum onset separation is explicit, independent of event length.
 const hookSfx=hooks.some(v=>effects.some(s=>Math.abs(s.start-v.start)<=.45));
 if(!hookSfx)issues.push('un SFX activo sincronizado con el apoyo visual inicial (±0,45 s)');
 const intervals=visuals.map(e=>[e.start,e.end]).sort((a,b)=>a[0]-b[0]);
 let covered=0,maxGap=0;const gaps=[];
 for(const [start,end] of intervals){if(start>covered){gaps.push({start:covered,end:start});maxGap=Math.max(maxGap,start-covered);}covered=Math.max(covered,end);}
 if(covered<d){gaps.push({start:covered,end:d});maxGap=Math.max(maxGap,d-covered);}
 if(maxGap>limit+1e-6)issues.push('ningún tramo de más de '+limit+' segundos sin apoyo visual semántico');
 if(style==='SUES_DOPAMIN'&&d>=60&&d<=75){
  if(count(broll)<5)issues.push('al menos cinco B-rolls');
  if(count(motions)<2)issues.push('al menos dos motion graphics');
  if(!cutouts.length)issues.push('al menos una composición con sujeto recortado');
  // An interval can remain meaningful for several seconds. Do not invent
  // arbitrary effects to meet an onset quota; enforce the uncovered-gap limit.
 }
 return {applicable:true,pass:issues.length===0,issues,timeSpace:'output-timeline',duration:d,compositionDuration,counts:{broll:count(broll),motions:count(motions),cutouts:count(cutouts),visualChanges:distinct.length},maxGap,limit,gaps:gaps.filter(g=>g.end-g.start>limit+1e-6),hookSfx,semanticRelevance:'requires-human-review',audioAudibility:'requires-render-review'};
}
