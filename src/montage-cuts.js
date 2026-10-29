// Cuts use the immutable composition clock. Every rendered layer and the mixed
// audio pass through the same final time projection; source settings stay editable.
import {keptSegments,validateCuts} from './source-cuts.js';
const round=x=>Math.round(x*1e9)/1e9;
export function montageMap(duration,cuts=[],splits=[]){
 if(!Array.isArray(cuts)||cuts.length>60||!Array.isArray(splits)||splits.length>120)throw Error('Máximo 60 borrados y 120 divisiones');
 for(const c of cuts)if(!c||Object.keys(c).length!==2||!Object.keys(c).every(k=>['start','end'].includes(k)))throw Error('Borrado de montaje inválido');
 validateCuts(duration,cuts);
 const aligned=cuts.map(c=>({start:Math.round(c.start*30)/30,end:Math.abs(c.end-duration)<1e-7?duration:Math.round(c.end*30)/30}));
 validateCuts(duration,aligned);
 if(aligned.some(c=>c.end-c.start<1/30-1e-7))throw Error('El borrado debe abarcar al menos un fotograma');
 if(splits.some((s,i)=>!Number.isFinite(s)||s<=0||s>=duration||i>0&&s<=splits[i-1]))throw Error('Divisiones inválidas o repetidas');
 const points=splits.map(s=>Math.round(s*30)/30);
 if(points.some((s,i)=>s<=0||s>=duration||i>0&&s<=points[i-1]))throw Error('Las divisiones deben separarse un fotograma');
 let at=0;const spans=keptSegments(duration,aligned).map(s=>{const v={start:s.in,end:s.out,outputStart:at,outputEnd:round(at+s.out-s.in)};at=v.outputEnd;return v;});
 if(at<.5)throw Error('Conserva al menos medio segundo de vídeo');
 return {version:1,clock:'composition',cuts:aligned,splits:points,spans,duration:round(at),compositionDuration:duration};
}
export function montageToOutput(map,t){
 const s=map.spans.find(s=>t<s.end)??map.spans.at(-1);
 return round(s.outputStart+Math.max(0,Math.min(s.end-s.start,t-s.start)));
}
export function outputToMontage(map,t){
 const s=map.spans.find(s=>t<s.outputEnd-1e-7)??map.spans.at(-1);
 return round(s.start+Math.max(0,Math.min(s.end-s.start,t-s.outputStart)));
}
export function projectInterval(map,start,end){
 return map.spans.filter(s=>end>s.start&&start<s.end).map(s=>({start:round(s.outputStart+Math.max(start,s.start)-s.start),end:round(s.outputStart+Math.min(end,s.end)-s.start),compositionStart:Math.max(start,s.start),compositionEnd:Math.min(end,s.end)}));
}
export function applyMontageFilters(graph,plan,{video=true,audio=true}={}){
 const map=plan.postEdit;if(!map?.cuts?.length)return graph;
 const filters=[graph.trim().replace(/;$/,'')];
 if(video){filters[0]=filters[0].replaceAll('[video]','[montage-full-video]');
  const condition=map.spans.map(s=>`gte(t,${s.start-1e-7})*lt(t,${s.end-1e-7})`).join('+');
  filters.push(`[montage-full-video]select='${condition}',setpts=N/(30*TB)[video]`);
 }
 if(audio){const label=graph.includes('[mixed-audio]')?'mixed-audio':'audio';
  filters[0]=filters[0].replaceAll(`[${label}]`,'[montage-full-audio]');
  const spans=map.spans,n=spans.length;
  if(n>1)filters.push(`[montage-full-audio]asplit=${n}${spans.map((_,i)=>`[montage-a${i}]`).join('')}`);
  for(const [i,s]of spans.entries())filters.push(`[${n>1?'montage-a'+i:'montage-full-audio'}]atrim=start=${s.start}:end=${s.end},asetpts=PTS-STARTPTS[montage-kept${i}]`);
  filters.push(`${spans.map((_,i)=>`[montage-kept${i}]`).join('')}concat=n=${n}:v=0:a=1[${label}]`);
 }
 return filters.join(';\n')+'\n';
}
