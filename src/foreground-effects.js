import {MODNET_SHA,validateAutomaticForegroundPolicy} from './foreground-policy.js';
import {fitCaptionSize} from './font-kits.js';
import {createHash} from 'node:crypto';
import {readFileSync,lstatSync} from 'node:fs';
const fail=m=>{throw Error('Foreground effects: '+m);};
const sha=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
const overlap=(a,b)=>a.start<b.end&&a.end>b.start;
const exact=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).every(k=>keys.includes(k));
export function foregroundSpaceHash(plan){
 return createHash('sha256').update(JSON.stringify({sourceSha256:plan.source.sha256,width:1080,height:1920,fps:30,timeMap:plan.timeMap,camera:plan.camera,
  zooms:plan.semantic?.zooms??[],trajectory:plan.semantic?.trajectory??null,anchors:plan.semantic?.anchors??[]})).digest('hex');
}
export function prepareForegroundEffects(data,plan){
 if(data==null)return null;
 if(!exact(data,['schema','sourceSha256','cameraSpaceSha256','matte','events','experimental','automaticPersonSegmentation','acceptance','automaticEvidence'])||data.schema!=='sues-foreground-effects/v1'||data.sourceSha256!==plan.source.sha256||data.cameraSpaceSha256!==foregroundSpaceHash(plan))fail('source/camera/timeline binding changed');
 const m=data.matte;
 if(!exact(m,['localFile','sha256','modelSha256','method','width','height','fps','frames','duration','activeRanges','reviewStatus'])||
  typeof m.localFile!=='string'||!m.localFile.startsWith('/')||!sha(m.sha256)||!sha(m.modelSha256)||m.method!=='modnet-onnx-cpu'||
  !['sample-reviewed','reviewed','predicted-unreviewed'].includes(m.reviewStatus)||m.width!==512||m.height!==896||m.fps!==30||
  !Number.isFinite(m.duration)||m.frames!==Math.ceil(plan.duration*30-1e-7)||Math.abs(m.duration-plan.duration)>1e-6)fail('matte geometry/provenance');
 if(lstatSync(m.localFile).isSymbolicLink()||createHash('sha256').update(readFileSync(m.localFile)).digest('hex')!==m.sha256)fail('matte file changed');
 if(m.reviewStatus==='predicted-unreviewed'){
  if(m.modelSha256!==MODNET_SHA||data.acceptance!=='pending-human-review'||!data.automaticEvidence||m.activeRanges?.length!==1)fail('automatic derivation provenance');
  const range=m.activeRanges[0],first=Math.round(range.start*30),count=Math.round((range.end-range.start)*30);
  validateAutomaticForegroundPolicy({schema:'sues-automatic-foreground/v1',sourceSha256:data.sourceSha256,cameraSpaceSha256:data.cameraSpaceSha256,runtime:{modelSha256:m.modelSha256},startFrame:first,activeFrames:count,frames:m.frames,events:data.events,evidence:data.automaticEvidence},plan,foregroundSpaceHash(plan));
 }else if(data.automaticEvidence)fail('automatic evidence requires predicted status');
 const bounded=e=>e&&Number.isFinite(e.start)&&Number.isFinite(e.end)&&e.start>=0&&e.end>e.start&&e.end<=plan.duration;
 if(!Array.isArray(m.activeRanges)||!m.activeRanges.length||m.activeRanges.length>6||!m.activeRanges.every(bounded))fail('matte coverage');
 if(!Array.isArray(data.events)||!data.events.length||data.events.length>4)fail('events required');
 let blur=0,text=0;
 for(const e of data.events){
  if(!bounded(e)||!m.activeRanges.some(r=>r.start<=e.start&&r.end>=e.end))fail('event outside matte coverage');
  if(e.type==='background-blur'){
   if(++blur>1||!exact(e,['type','start','end','sigma'])||!Number.isFinite(e.sigma)||e.sigma<2||e.sigma>20)fail('bounded blur required');
  }else if(e.type==='behind-text'){
   if(++text>1||!exact(e,data.automaticEvidence?['type','start','end','lines','top']:['type','start','end','lines'])||!Array.isArray(e.lines)||!e.lines.length||e.lines.length>2||
    e.lines.some(s=>typeof s!=='string'||!/^[A-ZÁÉÍÓÚÜÑ0-9 ]{1,12}$/u.test(s)))fail('bounded literal text required');
   if(plan.policy.captions.font!=='Montserrat')fail('real Montserrat required');
  }else fail('unsupported event');
  const covered=[...(plan.selectedMedia??[]),...(plan.subjectLayers??[]),...(plan.illustrations??[]),...(plan.semantic?.motions??[]),...(plan.graphics??[]),...(plan.elements??[]),...(plan.depthText??[])];
  if(covered.some(o=>overlap(e,o)))fail('event overlaps another composition');
 }
 return {...structuredClone(data),experimental:true,automaticPersonSegmentation:true,acceptance:'pending-human-review'};
}
export function foregroundEffectFilters(data,base,input){
 if(!data)return {filters:[],base};
 const filters=[`[${base}]split=2[fg-original][fg-background]`];let background='fg-background';
 for(const [i,e]of data.events.entries()){
  const enabled=`gte(t,${e.start})*lt(t,${e.end})`;
  if(e.type==='background-blur')filters.push(`[${background}]gblur=sigma=${e.sigma}:enable='${enabled}'[fg-effect${i}]`);
  else{
   const fade=`min(clip((t-${e.start})/0.2,0,1),clip((${e.end}-t)/0.2,0,1))`;
   const draw=e.lines.map((text,n)=>`drawtext=fontfile=fonts/Montserrat-ExtraBold.ttf:text='${text}':fontsize=${fitCaptionSize([text],{font:'Montserrat',fontRole:'keyword',fontSize:(data.schema==='sues-automatic-foreground/v1'||data.automaticEvidence)?180:140},780)}:fontcolor=0xff7a18:alpha='${fade}':borderw=2:bordercolor=0xffd3a4:shadowcolor=0x331100:shadowx=3:shadowy=5:x=(w-tw)/2:y=${e.lines.length===1?(e.top??860):560+n*300}-12*(t-${e.start}):enable='${enabled}'`).join(',');
   filters.push(`[${background}]${draw}[fg-effect${i}]`);
  }
  background=`fg-effect${i}`;
 }
 filters.push(`[${input}:v]fps=30,scale=1080:1920:flags=bilinear,format=gray,setpts=PTS-STARTPTS[fg-mask]`,
  '[fg-original]format=rgb24[fg-rgb]',
  '[fg-rgb][fg-mask]alphamerge[fg-person]',
  `[${background}][fg-person]overlay=eof_action=pass:repeatlast=0:shortest=1:format=auto,format=yuv420p[foreground-composed]`);
 return {filters,base:'foreground-composed'};
}
