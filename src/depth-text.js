// Imported, reviewed vector rotoscoping. Does not detect or segment a person.
import {fitCaptionSize,textAdvance} from './font-kits.js';
const fail=m=>{throw Error('Depth text: '+m);};
const number=x=>typeof x==='number'&&Number.isFinite(x);
const area=p=>Math.abs(p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-a[1]*b[0];},0))/2;
export function prepareDepthText(data,plan){
 if(!data)return [];
 if(data.version!=='1.0'||data.sourceSha256!==plan.source.sha256||!Array.isArray(data.events)||data.events.length>6)fail('source binding or version invalid');
 const outputContour=data.coordinateSpace==='output-1080x1920'&&JSON.stringify(data.cameraKeyframes)===JSON.stringify(plan.camera.keyframes)&&plan.camera.keyframes.every(k=>k.x===plan.camera.keyframes[0].x&&k.y===plan.camera.keyframes[0].y&&k.width===plan.camera.keyframes[0].width&&k.height===plan.camera.keyframes[0].height&&k.zoom===plan.camera.keyframes[0].zoom);
 if(plan.timeMap.spans.length!==1||plan.timeMap.spans[0].sourceIn!==0||(!outputContour&&(plan.source.width!==1080||plan.source.height!==1920||plan.camera.keyframes.some(k=>k.x!==0||k.y!==0||k.width!==1080||k.height!==1920))))fail('requires reviewed full-frame source or unchanged bound static camera');
 const result=[];
 for(const e of data.events){
  if(typeof e.text!=='string'||!e.text.trim()||e.text.length>26||/[{}\\\r\n\x00-\x1f]/.test(e.text)||![e.start,e.end,e.x,e.y,e.size].every(number)||e.start<0||e.end>plan.duration||e.end<=e.start||e.end-e.start>3||e.size<64||e.size>220||!/^#[0-9A-Fa-f]{6}$/.test(e.color))fail('event text, style or interval invalid');
  if(result.some(o=>e.start<o.end&&e.end>o.start)||(plan.graphics??[]).some(o=>e.start<o.end&&e.end>o.start)||[...(plan.semantic?.zooms??[]),...(plan.semantic?.trajectory?.activeRanges??[])].some(o=>e.start<o.end&&e.end>o.start))fail('event overlaps another depth event, card or camera zoom');
  const m=e.mask,r=m?.reviewedRegion;
  if(m?.method!=='manual-rotoscope'||!['head-and-neck','upper-body','full-visible-subject'].includes(m.scope)||!r||![r.top,r.bottom].every(number)||r.top<0||r.bottom>1920||r.bottom<=r.top||!Array.isArray(m.keyframes)||m.keyframes.length<2||m.keyframes.length>100)fail('reviewed rotoscope required');
  const count=m.keyframes[0]?.points?.length;
  if(!Number.isInteger(count)||count<16||count>256)fail('detailed contour required, not a box');
  let last=-1;
  for(const k of m.keyframes){
   if(!number(k.time)||k.time<0||k.time<=last||k.time>plan.duration||!Array.isArray(k.points)||k.points.length!==count||k.points.some(p=>!Array.isArray(p)||p.length!==2||!p.every(number)||p[0]<0||p[0]>1080||p[1]<0||p[1]>1920)||new Set(k.points.map(p=>p.join(','))).size!==count||area(k.points)<5000)fail('mask keyframes invalid');
   last=k.time;
  }
  if(m.keyframes[0].time>e.start||m.keyframes.at(-1).time<e.end)fail('mask must cover the whole event');
  const p={...plan.policy.captions,fontRole:'keyword',fontSize:e.size},size=fitCaptionSize([e.text],p,840),width=textAdvance(e.text,p,size);
  if(e.x-width/2<72||e.x+width/2>930||e.y-size/2<Math.max(180,r.top)||e.y+size/2>Math.min(1540,r.bottom))fail('label outside safe or reviewed mask region');
  result.push({...structuredClone(e),size,provenance:'reviewed-vector-contour',automaticSegmentation:false,occlusionScope:m.scope});
 }
 return result;
}
export function contourAt(mask,time){
 const keys=mask.keyframes;
 if(time<=keys[0].time)return keys[0].points;
 if(time>=keys.at(-1).time)return keys.at(-1).points;
 const i=keys.findIndex(k=>k.time>=time),a=keys[i-1],b=keys[i],f=(time-a.time)/(b.time-a.time);
 return a.points.map((p,j)=>p.map((v,d)=>v+(b.points[j][d]-v)*f));
}
export function drawDepthText(plan,event,safeText,assColor){
 for(const e of plan.depthText??[]){
  // All text pixels inside the actual contour are removed, leaving the source
  // subject visible. Foreground captions are rendered independently afterwards.
  const count=Math.ceil((e.end-e.start)*30);
  for(let i=0;i<count;i++){
   const start=e.start+i/30,end=Math.min(e.end,start+1/30),mid=(start+end)/2,points=contourAt(e.mask,mid);
   const path='m '+points.map(p=>p.map(Math.round).join(' ')).join(' l ')+' l '+points[0].map(Math.round).join(' ');
   const phase=plan.dopaminMaster?Math.min(1,(mid-e.start)/.22):1,size=e.size*(.82+.18*(1-Math.pow(1-phase,3))),y=e.y+32*(1-phase);
   const opacity=Math.min(1,(mid-e.start)/.12,(e.end-mid)/.12),alpha=Math.round((1-opacity)*255).toString(16).padStart(2,'0');
   event(-1,start,end,'Caption',`{\\an5\\pos(${e.x},${y})\\fnMontserrat ExtraBold\\b800\\i0\\fs${size}\\fscx100\\fsp-2\\bord0\\shad0\\1c${assColor(e.color)}&\\1a&H${alpha}&\\iclip(1,${path})}${safeText(e.text)}`);
  }
 }
}