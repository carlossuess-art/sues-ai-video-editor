import React from 'react';
import {AbsoluteFill,useCurrentFrame} from 'remotion';
type Keyframe={atFrame:number;easing?:'linear';x?:number;y?:number;opacity?:number;scale?:number;rotation?:number};
type Layer={id:string;startFrame:number;endFrame:number;text:string;visual:{rect:{x:number;y:number;width:number;height:number};zIndex:number;opacity:number;typography:{family:string;sizePx:number;weight:number;color:string};keyframes:Keyframe[]}};
export type MasterTextProps={layers:Layer[]};
function valueAt(keys:Keyframe[],frame:number,key:'x'|'y'|'opacity'|'scale'|'rotation',fallback:number){
 const values=keys.filter(k=>k[key]!==undefined);if(!values.length)return fallback;
 if(frame<=values[0].atFrame)return values[0][key]!;
 for(let i=1;i<values.length;i++)if(frame<=values[i].atFrame){const a=values[i-1],b=values[i],t=(frame-a.atFrame)/(b.atFrame-a.atFrame);return a[key]!+(b[key]!-a[key]!)*t;}
 return values[values.length-1][key]!;
}
export const MasterDirectorText:React.FC<MasterTextProps>=({layers})=>{
 const frame=useCurrentFrame();
 return <AbsoluteFill style={{background:'transparent',overflow:'hidden'}}>{layers.map(l=>{
  if(frame<l.startFrame||frame>=l.endFrame)return null;
  const f=frame-l.startFrame,{rect,typography,keyframes}=l.visual;
  const x=valueAt(keyframes,f,'x',0),y=valueAt(keyframes,f,'y',0),scale=valueAt(keyframes,f,'scale',1),rotation=valueAt(keyframes,f,'rotation',0);
  return <div key={l.id} style={{position:'absolute',left:rect.x,top:rect.y,width:rect.width,height:rect.height,zIndex:l.visual.zIndex,
   opacity:l.visual.opacity*valueAt(keyframes,f,'opacity',1),transform:`translate(${x}px,${y}px) rotate(${rotation}deg) scale(${scale})`,transformOrigin:'center',
   fontFamily:typography.family,fontSize:typography.sizePx,fontWeight:typography.weight,color:typography.color,whiteSpace:'pre-wrap'}}>{l.text}</div>;
 })}</AbsoluteFill>;
};
