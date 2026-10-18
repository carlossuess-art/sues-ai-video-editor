import {buildFaceTrack} from './vision.js';
import {stabilizeFaceTrack,sampleReframeAt} from './reframe.js';
import {editToSource} from './time-map.js';
import {zoomScaleAt} from './semantic-render.js';
const assert=(ok,msg)=>{if(!ok)throw new Error('Illustration: '+msg);};
const overlaps=(a,b)=>Math.min(a.right,b.right)>Math.max(a.left,b.left)&&Math.min(a.bottom,b.bottom)>Math.max(a.top,b.top);
export function prepareIllustrations(items=[],plan,visionFrames=[]){
 assert(Array.isArray(items)&&items.length<=6,'at most six resources');
 if(!items.length)return [];
 const track=stabilizeFaceTrack(buildFaceTrack(visionFrames)),ids=new Set();
 return items.map(item=>{
  assert(typeof item.assetId==='string'&&/^[a-z0-9-]{1,80}$/.test(item.assetId)&&!ids.has(item.assetId),'unique asset id');ids.add(item.assetId);
  assert(['owned','licensed'].includes(item.rights)&&item.role==='illustration','rights and illustration role required');
  assert(item.sourceSha256===plan.source.sha256&&/^[a-f0-9]{64}$/.test(item.sourceSha256),'resource must be bound to this source');
  assert(item.timeSpace==='edit-timeline'&&Number.isFinite(item.start)&&Number.isFinite(item.end)&&item.start>=0&&item.end>item.start&&item.end<=plan.duration,'time bounds');
  assert(typeof item.localFile==='string'&&item.localFile.startsWith('/')&&/^[a-f0-9]{64}$/.test(item.sha256),'verified local asset');
  const b=item.box;assert(b&&['left','right','top','bottom'].every(k=>Number.isInteger(b[k]))&&b.left>=120&&b.right<=900&&b.top>=120&&b.bottom<=1100&&b.right>b.left&&b.bottom>b.top,'safe resource box');
  assert(Number.isFinite(item.featherPx)&&item.featherPx>=20&&item.featherPx<=(b.bottom-b.top)/2&&Number.isFinite(item.fadeSeconds)&&item.fadeSeconds>=.1&&item.fadeSeconds<=Math.min(.5,(item.end-item.start)/3),'mask/fade bounds');
  assert(!(plan.semantic?.motions??[]).some(m=>m.start<item.end&&m.end>item.start),'resource overlaps motion card');
  assert(!plan.selectedMedia.some(m=>m.start<item.end&&m.end>item.start),'resource overlaps full-frame B-roll');
  // Same crop, source time and eye-centered zoom as the presenter. The image's
  // entire rectangle is checked, including areas that will become transparent.
  for(let t=item.start;t<item.end;t+=1/30){
   const {sourceTime}=editToSource(plan.timeMap,t),camera=sampleReframeAt(plan.camera,sourceTime),nearest=track.reduce((a,b)=>Math.abs(b.time-sourceTime)<Math.abs(a.time-sourceTime)?b:a),face=nearest.face;
   const span=plan.semantic.anchors.find(s=>t>=s.start&&t<=s.end),points=span?.points??[];
   let anchor={x:(nearest.smoothed.eyeX-camera.x)/camera.width,y:(nearest.smoothed.eyeY-camera.y)/camera.height};
   if(points.length){const after=points.find(p=>p.time>=t)??points.at(-1),before=[...points].reverse().find(p=>p.time<=t)??points[0],f=after.time===before.time?0:(t-before.time)/(after.time-before.time);anchor={x:before.x+(after.x-before.x)*f,y:before.y+(after.y-before.y)*f};}
   const z=zoomScaleAt(plan.semantic.zooms,t),x=value=>((value-camera.x)/camera.width-anchor.x)*1080*z+anchor.x*1080,y=value=>((value-camera.y)/camera.height-anchor.y)*1920*z+anchor.y*1920;
   assert(!overlaps(b,{left:x(face.x),right:x(face.x+face.width),top:y(face.y),bottom:y(face.y+face.height)}),'resource overlaps sampled face');
  }
  assert(!items.some(other=>other!==item&&other.start<item.end&&other.end>item.start&&overlaps(b,other.box)),'resources overlap');
  return {...item,kind:'still-image',fit:'cover',mask:'soft-bottom',sourceAudio:false};
 });
}

export function illustrationFilters(items,base,inputStart){
 const filters=[];for(const [i,item]of items.entries()){
  const b=item.box,w=b.right-b.left,h=b.bottom-b.top,d=item.end-item.start;
  // Spatial feather and temporal fade are independent operations. rgba makes
  // opaque photographs and existing alpha images follow the same mask contract.
  filters.push(`[${inputStart+i}:v]scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},setsar=1,format=rgba,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='alpha(X,Y)*clip((${h}-Y)/${item.featherPx},0,1)',fps=30,trim=duration=${d},setpts=PTS-STARTPTS,fade=t=in:st=0:d=${item.fadeSeconds}:alpha=1,fade=t=out:st=${d-item.fadeSeconds}:d=${item.fadeSeconds}:alpha=1,setpts=PTS+${item.start}/TB[illustration${i}]`);
  filters.push(`[${base}][illustration${i}]overlay=x=${b.left}:y=${b.top}:eof_action=pass:repeatlast=0:enable='gte(t,${item.start})*lt(t,${item.end})'[illustrated${i}]`);base=`illustrated${i}`;
 }
 return {filters,base};
}
