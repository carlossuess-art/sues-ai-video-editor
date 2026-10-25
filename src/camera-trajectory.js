import {createHash} from 'node:crypto';
import {buildFaceTrack} from './vision.js';
const fail=message=>{throw Error('Camera trajectory: '+message);};
const exact=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).every(k=>keys.includes(k));
export const visionTrackHash=frames=>createHash('sha256').update(JSON.stringify(frames)).digest('hex');
export function validateCameraTrajectory(value){
 if(value===undefined||value===null)return null;
 if(!exact(value,['schema','sourceSha256','visionSha256','timeSpace','reason','keyframes'])||
  value.schema!=='sues-camera-trajectory/v1'||value.timeSpace!=='original-seconds'||
  ![value.sourceSha256,value.visionSha256].every(s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s))||
  typeof value.reason!=='string'||value.reason.trim().length<5||value.reason.length>160||
  !Array.isArray(value.keyframes)||value.keyframes.length<2||value.keyframes.length>16)fail('invalid source-bound contract');
 let previous=-Infinity;
 for(const k of value.keyframes){
  if(!exact(k,['time','scale','easing'])||![k.time,k.scale].every(Number.isFinite)||
   k.time<0||k.time-previous<1/30-1e-8||k.scale<1||k.scale>1.6||
   !['linear','ease-in-out'].includes(k.easing))fail('invalid ordered keyframe or curve');
  previous=k.time;
 }
 if(value.keyframes.at(-1).scale!==1)fail('last keyframe must return to normal');
 return structuredClone(value);
}
export function trajectoryScaleAt(trajectory,time){
 if(!Number.isFinite(time))fail('invalid sample time');
 const k=trajectory?.keyframes;if(!k?.length)return 1;
 if(time<=k[0].time)return k[0].scale;
 if(time>=k.at(-1).time)return k.at(-1).scale;
 const i=k.findIndex(p=>p.time>=time),a=k[i-1],b=k[i];
 const f=(time-a.time)/(b.time-a.time),q=a.easing==='linear'?f:(1-Math.cos(Math.PI*f))/2;
 return a.scale+(b.scale-a.scale)*q;
}
export function trajectoryExpression(trajectory,time='(on/30)'){
 const keys=trajectory.keyframes;let expression=String(keys[0].scale);
 for(let i=1;i<keys.length;i++){
  const a=keys[i-1],b=keys[i],q=`clip((${time}-${a.time})/${b.time-a.time},0,1)`;
  const eased=a.easing==='linear'?q:`(1-cos(PI*${q}))/2`;
  expression+=`+(${b.scale-a.scale})*(${eased})`;
 }
 return '('+expression+')';
}
export function prepareCameraTrajectory(value,{source,camera,timeMap,visionFrames}){
 const data=validateCameraTrajectory(value);if(!data)return null;
 if(data.sourceSha256!==source?.sha256||data.visionSha256!==visionTrackHash(visionFrames))fail('source or landmark binding changed');
 if(camera.mode==='full-frame-fit'||camera.mode==='reviewed-region')fail('real existing eye landmarks required; fixed framing is not tracking');
 if(timeMap.spans.length!==1)fail('cuts and repeated source spans unsupported');
 const span=timeMap.spans[0],last=data.keyframes.at(-1);
 if(Math.abs(data.keyframes[0].time-span.sourceIn)>1e-6||last.time>span.sourceOut+1e-6)fail('trajectory outside continuous source interval');
 const track=buildFaceTrack(visionFrames);
 const activeRanges=[];
 for(let i=1;i<data.keyframes.length;i++){
  const a=data.keyframes[i-1],b=data.keyframes[i];
  if(a.scale!==1||b.scale!==1)activeRanges.push({start:a.time-span.sourceIn,end:b.time-span.sourceIn});
 }
 // A detection failure cannot become a confident eye anchor. Allow one missing
 // sample in a 2 fps historical track (<=1.1 s), never an arbitrarily long gap.
 for(const range of activeRanges){
  for(let t=range.start;t<=range.end+1e-8;t+=1/30){
   const st=t+span.sourceIn;
   const before=[...track].reverse().find(p=>p.time<=st+1e-6),after=track.find(p=>p.time>=st-1e-6);
   if(!before||!after||after.time-before.time>1.1||
      before.eye.source!=='eyes'||after.eye.source!=='eyes')fail('eye coverage missing or gap exceeds 1.1 seconds');
  }
 }
 return {...data,keyframes:data.keyframes.map(k=>({...k,time:k.time-span.sourceIn})),timeSpace:'edit-timeline',activeRanges,
  evidence:{method:'interpolated-existing-eye-landmarks',newInference:false,automaticPersonSegmentation:false,maxDetectionGapSeconds:1.1}};
}