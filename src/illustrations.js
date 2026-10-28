import {buildFaceTrack} from './vision.js';
import {stabilizeFaceTrack,sampleReframeAt} from './reframe.js';
import {editToSource} from './time-map.js';
import {zoomScaleAt} from './semantic-render.js';
const assert=(ok,msg)=>{if(!ok)throw new Error('Illustration: '+msg);};
const overlaps=(a,b)=>Math.min(a.right,b.right)>Math.max(a.left,b.left)&&Math.min(a.bottom,b.bottom)>Math.max(a.top,b.top);

function projectedFaces(item,plan,track){
 const faces=[];
  // Same crop, source time and eye-centered zoom as the presenter. The image's
  // entire rectangle is checked, including areas that will become transparent.
  for(let t=item.start;t<item.end;t+=1/30){
   const {sourceTime}=editToSource(plan.timeMap,t),camera=sampleReframeAt(plan.camera,sourceTime),nearest=track.reduce((a,b)=>Math.abs(b.time-sourceTime)<Math.abs(a.time-sourceTime)?b:a),face=nearest.face;
   const span=plan.semantic.anchors.find(s=>t>=s.start&&t<=s.end),points=span?.points??[];
   let anchor={x:(nearest.smoothed.eyeX-camera.x)/camera.width,y:(nearest.smoothed.eyeY-camera.y)/camera.height};
   if(points.length){const after=points.find(p=>p.time>=t)??points.at(-1),before=[...points].reverse().find(p=>p.time<=t)??points[0],f=after.time===before.time?0:(t-before.time)/(after.time-before.time);anchor={x:before.x+(after.x-before.x)*f,y:before.y+(after.y-before.y)*f};}
   const z=zoomScaleAt(plan.semantic.zooms,t),x=value=>((value-camera.x)/camera.width-anchor.x)*1080*z+anchor.x*1080,y=value=>((value-camera.y)/camera.height-anchor.y)*1920*z+anchor.y*1920;
   faces.push({left:x(face.x),right:x(face.x+face.width),top:y(face.y),bottom:y(face.y+face.height)});
  }
 return faces;
}
function automaticBox(faces,plan,placed,item){
 const center=faces.reduce((sum,f)=>sum+(f.top+f.bottom)/2,0)/faces.length;
 const tops=center<650?[880,560,180]:[180,560,880];
 const occupied=[plan.layout.caption,plan.layout.outro,...placed.filter(p=>p.start<item.end&&p.end>item.start).map(p=>p.box)];
 const padded=faces.map(f=>({left:f.left-48,right:f.right+48,top:f.top-48,bottom:f.bottom+48}));
 for(const top of tops)for(const [left,right]of [[120,900],[120,520],[500,900]]){
  const box={left,right,top,bottom:top+280};
  if(![...occupied,...padded].some(other=>overlaps(box,other)))return {box,mask:top>center?'soft-top':'soft-bottom',placement:{strategy:'subject-aware-stable-interval',zone:top>center?'below-face':'above-or-beside-face',facePaddingPx:48,verification:'projected-existing-face-track-not-person-segmentation'}};
 }
 throw new Error('Illustration: no hay espacio seguro para este apoyo durante todo el intervalo; acorta su duración o cambia de momento');
}

export function prepareIllustrations(items=[],plan,visionFrames=[]){
 assert(Array.isArray(items)&&items.length<=50,'at most 50 resources');
 if(!items.length)return [];
 const track=stabilizeFaceTrack(buildFaceTrack(visionFrames));
 const placed=[];
 return items.map((input,index)=>{
  let item={...input};
  assert(typeof item.assetId==='string'&&/^[a-z0-9-]{1,80}$/.test(item.assetId),'asset id');
  assert(['owned','licensed'].includes(item.rights)&&item.role==='illustration','rights and illustration role required');
  assert(item.sourceSha256===plan.source.sha256&&/^[a-f0-9]{64}$/.test(item.sourceSha256),'resource must be bound to this source');
  assert(item.timeSpace==='edit-timeline'&&Number.isFinite(item.start)&&Number.isFinite(item.end)&&item.start>=0&&item.end>item.start&&item.end<=plan.duration,'time bounds');
  assert(typeof item.localFile==='string'&&item.localFile.startsWith('/')&&/^[a-f0-9]{64}$/.test(item.sha256),'verified local asset');
  assert(item.placement===undefined||item.placement==='auto-subject','placement mode');
  assert(item.mask===undefined||['soft-top','soft-bottom'].includes(item.mask),'mask direction');
  assert(item.motion===undefined||item.motion==='slow-push','image motion');
  assert(item.edgeToEdge===undefined||typeof item.edgeToEdge==='boolean','edge-to-edge mode');
  const faces=projectedFaces(item,plan,track);
  if(item.placement==='auto-subject')item={...item,...automaticBox(faces,plan,placed,item)};
  const b=item.box;assert(b&&['left','right','top','bottom'].every(k=>Number.isInteger(b[k]))&&b.left>=(item.edgeToEdge?0:120)&&b.right<=(item.edgeToEdge?1080:900)&&b.top>=(item.edgeToEdge?0:120)&&b.bottom<=1170&&b.right>b.left&&b.bottom>b.top,'safe resource box');
  assert(Number.isFinite(item.featherPx)&&item.featherPx>=20&&item.featherPx<=(b.bottom-b.top)/2&&Number.isFinite(item.fadeSeconds)&&item.fadeSeconds>=.1&&item.fadeSeconds<=Math.min(.5,(item.end-item.start)/3),'mask/fade bounds');
  assert(![...(plan.semantic?.motions??[]),...(plan.graphics??[])].some(m=>m.start<item.end&&m.end>item.start),'resource overlaps motion card');
  assert(!plan.selectedMedia.some(m=>m.start<item.end&&m.end>item.start),'resource overlaps full-frame B-roll');
  assert(!faces.some(face=>overlaps(b,face)),'resource overlaps sampled face');
  assert(!placed.some(other=>other.start<item.end&&other.end>item.start&&overlaps(b,other.box)),'resources overlap');
  assert(!overlaps(b,plan.layout.caption)&&!overlaps(b,plan.layout.outro),'resource overlaps captions or closing');
  const value={...item,instanceId:'illustration-'+(index+1),kind:'still-image',fit:'cover',mask:item.mask??'soft-bottom',sourceAudio:false};placed.push(value);return value;
 });
}

export function illustrationFilters(items,base,inputStart){
 const filters=[];for(const [i,item]of items.entries()){
  const b=item.box,w=b.right-b.left,h=b.bottom-b.top,d=item.end-item.start;
  let input=`${inputStart+i}:v`,sizing=`scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},setsar=1,`;
  if(item.motion==='slow-push'){
   // zoompan cannot carry source alpha directly. Transform RGB and alpha with
   // the exact same sampling and merge before spatial/temporal masks.
   const pan=`zoompan=z='1.02+0.06*min(on/${Math.ceil(d*30)},1)':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=1:s=${w}x${h}:fps=30`;
   filters.push(`[${input}]${sizing}format=rgba,split=2[still-rgb${i}][still-alpha${i}]`,
    `[still-rgb${i}]format=yuv444p,${pan},format=rgb24[pan-rgb${i}]`,
    `[still-alpha${i}]alphaextract,${pan},format=gray[pan-alpha${i}]`,
    `[pan-rgb${i}][pan-alpha${i}]alphamerge[moving-still${i}]`);
   input=`moving-still${i}`;sizing='';
  }
  // Spatial feather and temporal fade are independent operations. rgba makes
  // opaque photographs and existing alpha images follow the same mask contract.
  filters.push(`[${input}]${sizing}format=rgba,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='alpha(X,Y)*clip(${item.mask==='soft-top'?'Y':`(${h}-Y)`}/${item.featherPx},0,1)',fps=30,trim=duration=${d},setpts=PTS-STARTPTS,fade=t=in:st=0:d=${item.fadeSeconds}:alpha=1,fade=t=out:st=${d-item.fadeSeconds}:d=${item.fadeSeconds}:alpha=1,setpts=PTS+${item.start}/TB[illustration${i}]`);
  filters.push(`[${base}][illustration${i}]overlay=x=${b.left}:y=${b.top}:eof_action=pass:repeatlast=0:enable='gte(t,${item.start})*lt(t,${item.end})'[illustrated${i}]`);base=`illustrated${i}`;
 }
 return {filters,base};
}
