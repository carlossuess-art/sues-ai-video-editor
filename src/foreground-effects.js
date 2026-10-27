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
export function prepareForegroundEffects(data,plan,resolveAsset){
 if(data==null)return null;
 if(!exact(data,['schema','sourceSha256','cameraSpaceSha256','matte','events','experimental','automaticPersonSegmentation','acceptance'])||data.schema!=='sues-foreground-effects/v1'||data.sourceSha256!==plan.source.sha256||data.cameraSpaceSha256!==foregroundSpaceHash(plan))fail('source/camera/timeline binding changed');
 const m=data.matte;
 if(!exact(m,['localFile','sha256','modelSha256','method','width','height','fps','frames','duration','activeRanges','reviewStatus'])||
  typeof m.localFile!=='string'||!m.localFile.startsWith('/')||!sha(m.sha256)||!sha(m.modelSha256)||m.method!=='modnet-onnx-cpu'||
  !['sample-reviewed','reviewed'].includes(m.reviewStatus)||m.width!==512||m.height!==896||m.fps!==30||
  !Number.isFinite(m.duration)||m.frames!==Math.ceil(plan.duration*30-1e-7)||Math.abs(m.duration-plan.duration)>1/30+1e-6)fail('matte geometry/provenance');
 if(lstatSync(m.localFile).isSymbolicLink()||createHash('sha256').update(readFileSync(m.localFile)).digest('hex')!==m.sha256)fail('matte file changed');
 const bounded=e=>e&&Number.isFinite(e.start)&&Number.isFinite(e.end)&&e.start>=0&&e.end>e.start&&e.end<=plan.duration;
 if(!Array.isArray(m.activeRanges)||!m.activeRanges.length||m.activeRanges.length>6||!m.activeRanges.every(bounded))fail('matte coverage');
 if(!Array.isArray(data.events)||!data.events.length||data.events.length>9)fail('events required');
 let blur=0,text=0,video=0;
 for(const e of data.events){
  if(!bounded(e)||!m.activeRanges.some(r=>r.start<=e.start&&r.end>=e.end))fail('event outside matte coverage');
  if(e.type==='background-blur'){
   if(++blur>3||!exact(e,['type','start','end','sigma'])||!Number.isFinite(e.sigma)||e.sigma<2||e.sigma>20)fail('bounded blur required');
  }else if(e.type==='behind-text'){
   if(++text>3||!exact(e,['type','start','end','lines'])||!Array.isArray(e.lines)||!e.lines.length||e.lines.length>2||
    e.lines.some(s=>typeof s!=='string'||!/^[A-ZÁÉÍÓÚÜÑ0-9 ]{1,12}$/u.test(s)))fail('bounded literal text required');
   if(plan.policy.captions.font!=='Montserrat')fail('real Montserrat required');
  }else if(e.type==='behind-video'){
   if(++video>3||!exact(e,['type','start','end','assetId','sourceIn','opacity','reason','localFile','sha256','rights','mediaDuration','region'])||!sha(e.assetId)||!Number.isFinite(e.sourceIn)||e.sourceIn<0||!Number.isFinite(e.opacity)||e.opacity<=0||e.opacity>1||typeof e.reason!=='string'||e.reason.length<5||e.reason.length>160)fail('bounded video resource required');
   if(e.region!==undefined){
    const r=e.region;if(!exact(r,['x','y','width','height','featherBottom'])||![r.x,r.y,r.width,r.height,r.featherBottom].every(Number.isInteger)||r.x<0||r.y<0||r.width<32||r.height<32||r.x+r.width>1080||r.y+r.height>1920||r.width%2||r.height%2||r.featherBottom<0||r.featherBottom>r.height)fail('invalid local video region');
   }
   const a=e.localFile?e:resolveAsset?resolveAsset(e.assetId,'video'):e;
   if(!a||!['owned','licensed'].includes(a.rights)||typeof a.localFile!=='string'||!a.localFile.startsWith('/')||a.sha256!==e.assetId||!Number.isFinite(a.duration??a.mediaDuration)||e.sourceIn+e.end-e.start>(a.duration??a.mediaDuration)+1e-6||lstatSync(a.localFile).isSymbolicLink()||createHash('sha256').update(readFileSync(a.localFile)).digest('hex')!==a.sha256)fail('video file/provenance changed');
   Object.assign(e,{localFile:a.localFile,sha256:a.sha256,rights:a.rights,mediaDuration:a.duration??a.mediaDuration});
  }else fail('unsupported event');
  const covered=[...(plan.selectedMedia??[]),...(plan.subjectLayers??[]),...(plan.illustrations??[]),...(plan.semantic?.motions??[]).filter(m=>!['CHECK_GREEN_01','CROSS_RED_01','NUMBER_BADGE_GOLD_01'].includes(m.params?.motionId)),...(plan.graphics??[]),...(plan.elements??[]),...(plan.depthText??[])];
  if(covered.some(o=>overlap(e,o)))fail('event overlaps another composition');
 }
 return {...structuredClone(data),experimental:true,automaticPersonSegmentation:true,acceptance:'pending-human-review'};
}
export function foregroundEffectFilters(data,base,input){
 if(!data)return {filters:[],base};
 const filters=[`[${base}]split=2[fg-original][fg-background]`];let background='fg-background',videoIndex=0;
 for(const [i,e]of data.events.entries()){
  const enabled=`gte(t,${e.start})*lt(t,${e.end})`;
  if(e.type==='background-blur')filters.push(`[${background}]gblur=sigma=${e.sigma}:enable='${enabled}'[fg-effect${i}]`);
  else if(e.type==='behind-video'){
   const slot=input+1+videoIndex++,d=e.end-e.start,fade=Math.min(.2,d/3);
   const r=e.region??{x:0,y:0,width:1080,height:1920,featherBottom:0};
   const feather=r.featherBottom?`,geq=lum='lum(X,Y)':cb='cb(X,Y)':cr='cr(X,Y)':a='alpha(X,Y)*clip((H-Y)/${r.featherBottom},0,1)'`:'';
   filters.push(`[${slot}:v]trim=start=${e.sourceIn}:duration=${d},setpts=PTS-STARTPTS,scale=${r.width}:${r.height}:force_original_aspect_ratio=increase,crop=${r.width}:${r.height},setsar=1,fps=30,format=yuva420p,colorchannelmixer=aa=${e.opacity}${feather},fade=t=in:d=${fade}:alpha=1,fade=t=out:st=${d-fade}:d=${fade}:alpha=1,setpts=PTS+${e.start}/TB[fg-video${i}]`);
   filters.push(`[${background}][fg-video${i}]overlay=x=${r.x}:y=${r.y}:eof_action=pass:repeatlast=0:enable='${enabled}'[fg-effect${i}]`);
  }else{
   const fade=`min(clip((t-${e.start})/0.2,0,1),clip((${e.end}-t)/0.2,0,1))`;
   const draw=e.lines.map((text,n)=>`drawtext=fontfile=fonts/Montserrat-ExtraBold.ttf:text='${text}':fontsize=${fitCaptionSize([text],{font:'Montserrat',fontRole:'keyword',fontSize:140},780)}:fontcolor=0xff7a18:alpha='${fade}':borderw=2:bordercolor=0xffd3a4:shadowcolor=0x331100:shadowx=3:shadowy=5:x=(w-tw)/2:y=${560+n*300}-12*(t-${e.start}):enable='${enabled}'`).join(',');
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
