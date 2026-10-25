import {trajectoryScaleAt,trajectoryExpression,prepareCameraTrajectory} from './camera-trajectory.js';
import {compileDirectorEvents} from './director-contract.js';
import {indexMotionLibrary,instantiateMotion} from './motion-library.js';
import {MOTION_ALIASES} from './foundation-integration.js';
import {buildFaceTrack} from './vision.js';
import {stabilizeFaceTrack,sampleReframeAt} from './reframe.js';
import {editToSource} from './time-map.js';
import {fitCaptionSize} from './font-kits.js';
const assert=(ok,msg)=>{if(!ok)throw new Error(`Semantic render: ${msg}`);};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const RENDERED_MOTIONS=Object.freeze(['QUOTE_CARD_01','NUMBER_BADGE_GOLD_01','DIVIDER_LINE_01','CHECK_GREEN_01','CROSS_RED_01','STRIKE_TEXT_01']);
const sample=(points,time)=>{
 if(time<=points[0].time)return points[0];if(time>=points.at(-1).time)return points.at(-1);
 const i=points.findIndex(p=>p.time>=time),a=points[i-1],b=points[i],f=(time-a.time)/(b.time-a.time);
 return {x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f};
};
export function zoomScaleAt(events,time){
 let scale=1;
 for(const e of events){if(time<=e.start||time>=e.end)continue;
  const q=Math.min(clamp((time-e.start)/e.ramp,0,1),clamp((e.end-time)/e.ramp,0,1));
  scale+=(e.params.scale-1)*(1-Math.cos(Math.PI*q))/2;
 }
 return scale;
}
export const cameraScaleAt=(semantic,time)=>zoomScaleAt(semantic.zooms??[],time)*trajectoryScaleAt(semantic.trajectory,time);
export function prepareSemanticRender({director,policy,camera,timeMap,visionFrames=[],catalog=[],broll,captions=[],layout,cameraTrajectory,source}){
 const trajectory=prepareCameraTrajectory(cameraTrajectory,{source,camera,timeMap,visionFrames});
 if(!director&&!trajectory)return {events:[],zooms:[],motions:[],anchors:[],audit:{frames:0},timeSpace:'edit-timeline'};
 if(!director)director={version:'1.0',templateId:policy.templateId,timeSpace:'edit-timeline',decisions:[]};
 assert(director.timeSpace==='edit-timeline','explicit edit-timeline timeSpace required');
 const library=indexMotionLibrary(catalog),resolved={...policy,motions:policy.motions.map(a=>MOTION_ALIASES[a]??a)};
 const events=compileDirectorEvents(director,resolved),zooms=[],motions=[];
 assert(events.every(e=>e.start>=0&&e.end<=timeMap.duration),'event bounds');
 assert(events.every(e=>['zoom','motion'].includes(e.type)),'unimplemented event type');
 if(!events.length&&!trajectory)return {events:[],zooms:[],motions:[],anchors:[],audit:{frames:0},timeSpace:'edit-timeline'};
 assert(!trajectory||!events.some(e=>e.type==='zoom'),'trajectory cannot silently replace legacy zooms');
 const sourceTrack=stabilizeFaceTrack(buildFaceTrack(visionFrames));
 const eyes=sourceTrack.map(p=>({time:p.time,x:p.smoothed.eyeX,y:p.smoothed.eyeY}));
 const faces=sourceTrack.map(p=>({time:p.time,face:p.face}));
 const at=(time,sourceOverride)=>{
  const sourceTime=sourceOverride??editToSource(timeMap,time).sourceTime,c=sampleReframeAt(camera,sourceTime),eye=sample(eyes,sourceTime);
  return {sourceTime,c,anchor:{x:(eye.x-c.x)/c.width,y:(eye.y-c.y)/c.height}};
 };
 for(const e of events){
  if(e.type==='zoom'){
   assert(e.start>=2&&e.end<=timeMap.duration-Math.max(3,policy.outro.duration),'zoom bookends');
   assert(!zooms.length||e.start>=zooms.at(-1).end+1,'zoom gap/overlap');
   assert(camera.keyframes.every(k=>k.zoom*e.params.scale<=1.6+1e-9),'combined zoom exceeds 1.60');
   assert(!broll.decisions.some(d=>d.type==='broll'&&d.start<e.end&&d.end>e.start),'zoom hidden by B-roll');
   const ramp=e.params.ramp??1;
   assert(Number.isFinite(ramp)&&ramp>=.6&&ramp<=(e.end-e.start)/2,'zoom ramp');
   zooms.push({...e,ramp});
  }else{
   const id=e.params.motionId;assert(RENDERED_MOTIONS.includes(id),'unsupported motion renderer');
   const asset=library.get(id);assert(asset,'motion asset missing');
   assert(e.end-e.start>=asset.trigger.minDuration&&e.end-e.start<=6,'motion duration');
   assert(asset.trigger.semanticReasons.includes(e.params.semanticReason),'motion semantic reason');
   const instance=instantiateMotion(asset,e.params.bindings??{}),text=id==='QUOTE_CARD_01'?instance.layers.find(l=>l.id==='quote')?.content:id==='NUMBER_BADGE_GOLD_01'?instance.layers.find(l=>l.id==='label')?.content:id==='STRIKE_TEXT_01'?instance.layers.find(l=>l.id==='text')?.content:'';
   const textless=['DIVIDER_LINE_01','CHECK_GREEN_01','CROSS_RED_01'].includes(id);
   assert(typeof text==='string'&&text.length<=52&&!/[\x00-\x1f\x7f]/.test(text)&&(textless||text.trim().length>0),'motion text');
   assert(e.start>=2&&e.end<=timeMap.duration-policy.outro.duration,'motion bookends');
   if(id==='NUMBER_BADGE_GOLD_01')assert(/^[1-9]\d?$/.test(String(instance.layers.find(l=>l.id==='number').content)),'badge number');
   const words=text.trim().split(/\s+/);assert(words.every(w=>w.length<=26),'motion line limit');
   let lines=text.length<=26?[text]:[];
   if(!lines.length)for(let i=1;i<words.length;i++){const split=[words.slice(0,i).join(' '),words.slice(i).join(' ')];if(split.every(s=>s.length<=26)){lines=split;break;}}
   assert(lines.length<=2&&lines.length>0,'motion wrapping');
   const nominal=Math.max(...instance.layers.map(l=>l.start+l.duration));
   const layerTimes=Object.fromEntries(instance.layers.map(l=>[l.id,{start:e.start+l.start/nominal*(e.end-e.start),end:e.start+(l.start+l.duration)/nominal*(e.end-e.start)}]));
   assert(!broll.decisions.some(d=>d.type==='broll'&&d.start<e.end&&d.end>e.start),'motion hidden by B-roll');
   const fontSize=['NUMBER_BADGE_GOLD_01','STRIKE_TEXT_01'].includes(id)?fitCaptionSize(lines,{...policy.captions,fontSize:64},id==='NUMBER_BADGE_GOLD_01'?600:720):undefined;
   motions.push({...e,instance,lines,layerTimes,...(fontSize?{fontSize}:{}),audio:{rendered:false,reason:'visual-only; catalogue audio layers have no verified SFX binding'}});
  }
 }
 // Exact per-output-frame eyes, compact expression anchors and conservative sampled faces.
 const anchors=timeMap.spans.map(s=>({start:s.editIn,end:s.editOut,points:[s.editIn,...sourceTrack.filter(p=>p.time>s.sourceIn&&p.time<s.sourceOut).map(p=>s.editIn+p.time-s.sourceIn),s.editOut].map(time=>({time,sourceTime:s.sourceIn+time-s.editIn,...at(time,s.sourceIn+time-s.editIn).anchor}))}));
 const projected=(time,face)=>{const {c,anchor}=at(time),z=zoomScaleAt(zooms,time)*trajectoryScaleAt(trajectory,time);
  return {left:((face.x-c.x)/c.width-anchor.x)*1080*z+anchor.x*1080,right:((face.x+face.width-c.x)/c.width-anchor.x)*1080*z+anchor.x*1080,
   top:((face.y-c.y)/c.height-anchor.y)*1920*z+anchor.y*1920,bottom:((face.y+face.height-c.y)/c.height-anchor.y)*1920*z+anchor.y*1920};
 };
 let maxCombinedZoom=0,frames=0,captionFaceChecks=0,outroFaceChecks=0;
 for(let frame=0;frame<Math.ceil(timeMap.duration*30-1e-7);frame++){const t=frame/30;const {sourceTime,c,anchor}=at(t),z=zoomScaleAt(zooms,t)*trajectoryScaleAt(trajectory,t);assert(c.zoom*z<=1.6+1e-6,'combined trajectory zoom exceeds 1.60');assert(anchor.x>=0&&anchor.x<=1&&anchor.y>=0&&anchor.y<=1,'eyes outside base crop');
  const face=faces.reduce((a,b)=>Math.abs(b.time-sourceTime)<Math.abs(a.time-sourceTime)?b:a).face,box=projected(t,face);
  assert(box.left>=0&&box.right<=1080&&box.top>=0&&box.bottom<=1920,'zoom clips sampled face');
  const hit=b=>Math.min(box.right,b.right)>Math.max(box.left,b.left)&&Math.min(box.bottom,b.bottom)>Math.max(box.top,b.top);
  if(layout&&captions.some(c=>c.start<=t&&c.end>t)){captionFaceChecks++;assert(!hit(layout.caption),'face overlaps caption');}
  if(layout&&t>=timeMap.duration-policy.outro.duration){outroFaceChecks++;assert(!hit(layout.outro),'face overlaps outro');}
  maxCombinedZoom=Math.max(maxCombinedZoom,c.zoom*z);frames++;
 }
 const overlaps=(a,b)=>Math.min(a.right,b.right)>Math.max(a.left,b.left)&&Math.min(a.bottom,b.bottom)>Math.max(a.top,b.top);
 const defaultSlots=[200,480,760,1010].map(top=>({left:120,right:900,top,bottom:top+150}));
 for(const motion of motions){
  if(camera.mode!=='reviewed-region'&&motion.params.motionId==='QUOTE_CARD_01'&&policy.visualStyle?.resourceTreatment?.type==='blurred-focus'){
   assert(!motions.some(other=>other!==motion&&other.start<motion.end&&other.end>motion.start),'focus cards cannot overlap');
   motion.box={left:120,right:900,top:650,bottom:950};motion.backgroundTreatment={...policy.visualStyle.resourceTreatment,presenterOccludedIntentionally:true};continue;
  }
  const slots=camera.mode==='reviewed-region'?[{left:120,right:900,top:motion.params.motionId==='DIVIDER_LINE_01'?1450:1380,bottom:1530}]:defaultSlots;
  motion.box=slots.find(box=>!(layout&&((captions.some(c=>c.start<motion.end&&c.end>motion.start)&&overlaps(box,layout.caption))||overlaps(box,layout.outro)))&&!motions.some(other=>other.box&&other.start<motion.end&&other.end>motion.start&&overlaps(box,other.box))&&
   Array.from({length:Math.ceil((motion.end-motion.start)*30)},(_,i)=>motion.start+i/30).every(t=>{
    const {sourceTime}=at(t),face=faces.reduce((a,b)=>Math.abs(b.time-sourceTime)<Math.abs(a.time-sourceTime)?b:a).face;
    const projectedFace=projected(t,face),margin=48;
    return !overlaps(box,{left:projectedFace.left-margin,right:projectedFace.right+margin,top:projectedFace.top-margin,bottom:projectedFace.bottom+margin});
   }));
  assert(motion.box,'no safe motion placement');
  motion.placement={strategy:'stable-region-existing-face-track',marginPx:48,sampledAtFps:30,bodySegmentation:false};
 }
 return {timeSpace:'edit-timeline',events,zooms,motions,anchors,...(trajectory?{trajectory}:{}),audit:{frames,maxCombinedZoom,captionFaceChecks,outroFaceChecks,faceMethod:camera.mode==='reviewed-region'?'manually reviewed conservative region; fixed anchor; no automatic tracking':'nearest existing detection projected per output frame; not new inference'}};
}

export function semanticZoomFilter(semantic){
 if(!semantic.zooms.length&&!semantic.trajectory)return null;
 const time='(on/30)';let z='1';
 for(const e of semantic.zooms){const q=`min(clip((${time}-${e.start})/${e.ramp},0,1),clip((${e.end}-${time})/${e.ramp},0,1))`;z+=`+(${e.params.scale-1})*(1-cos(PI*${q}))/2`;}
 if(semantic.trajectory)z='('+z+')*'+trajectoryExpression(semantic.trajectory,time);
 const expr=field=>{
  const spans=semantic.anchors.map(s=>{
   let x=String(s.points[0][field]);for(let i=1;i<s.points.length;i++){const a=s.points[i-1],b=s.points[i],d=b[field]-a[field];if(Math.abs(d)>1e-10)x+=`+(${d})*clip((${time}-${a.time})/${b.time-a.time},0,1)`;}return `(${x})`;
  });
  let out=spans.at(-1);for(let i=spans.length-2;i>=0;i--)out=`if(lt(${time},${semantic.anchors[i].end}),${spans[i]},${out})`;return out;
 };
 const ax=expr('x'),ay=expr('y'),x=`W*${ax}*(1-1/(${z}))`,y=`H*${ay}*(1-1/(${z}))`;
 return `perspective=x0='${x}':y0='${y}':x1='${x}+W/(${z})':y1='${y}':x2='${x}':y2='${y}+H/(${z})':x3='${x}+W/(${z})':y3='${y}+H/(${z})':sense=source:eval=frame:interpolation=cubic`;
}