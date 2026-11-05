import React, {useEffect,useState} from 'react';
import {masterEasing} from './masterEasing.js';
import {AbsoluteFill,Img,Audio,OffthreadVideo,Sequence,staticFile,useCurrentFrame,delayRender,continueRender,cancelRender} from 'remotion';
type Keyframe={atFrame:number;easing?:'linear'|'ease-in'|'ease-out'|'ease-in-out';x?:number;y?:number;opacity?:number;scale?:number;rotation?:number};
type Layer={id:string;kind?:'text'|'image'|'audio'|'video';fit?:'fill'|'contain'|'cover';sourceInFrame?:number;gain?:number;assetId?:string;maskAssetId?:string;maskFrameAssetIds?:string[];fontAssetId?:string;startFrame:number;endFrame:number;text?:string;visual:{rect:{x:number;y:number;width:number;height:number};zIndex:number;opacity:number;dropShadow?:{color:string;offsetX:number;offsetY:number;blurPx:number};glow?:{color:string;radiusPx:number};typography?:{family:string;sizePx:number;weight:number;color:string};keyframes:Keyframe[]}};
export type MasterTextProps={layers:Layer[];durationFrames?:number;canvasWidth?:number;canvasHeight?:number;fps?:number;source?:{assetId:string;fit:'fill';audio:true;spans:Array<{sourceInFrame:number;startFrame:number;endFrame:number}>}};
function valueAt(keys:Keyframe[],frame:number,key:'x'|'y'|'opacity'|'scale'|'rotation',fallback:number){
 const values=keys.filter(k=>k[key]!==undefined);if(!values.length)return fallback;
 if(frame<=values[0].atFrame)return values[0][key]!;
 for(let i=1;i<values.length;i++)if(frame<=values[i].atFrame){const a=values[i-1],b=values[i],t=(frame-a.atFrame)/(b.atFrame-a.atFrame);return a[key]!+(b[key]!-a[key]!)*masterEasing(b.easing??'linear',t);}
 return values[values.length-1][key]!;
}
export const MasterDirectorText:React.FC<MasterTextProps>=({layers,source})=>{
 const frame=useCurrentFrame();
 const [handle]=useState(()=>delayRender('Load verified Master Director fonts'));
 useEffect(()=>{
  const fonts=new Map(layers.filter(l=>l.fontAssetId&&l.visual?.typography).map(l=>[l.fontAssetId!,l.visual.typography!.weight]));
  const fontLoads=[...fonts].map(async ([id,weight])=>{const face=new FontFace('sues-'+id,`url("${staticFile(`master-fonts/${id}`)}")`,{weight:String(weight)});await face.load();document.fonts.add(face);});
  const masks=new Set(layers.flatMap(l=>[...(l.maskAssetId?[l.maskAssetId]:[]),...(l.maskFrameAssetIds??[])]));
  const maskLoads=[...masks].map(id=>new Promise<void>((resolve,reject)=>{const image=new Image();image.onload=()=>resolve();image.onerror=()=>reject(new Error('Verified mask image failed to load'));image.src=staticFile(`master-assets/${id}`);}));
  Promise.all([...fontLoads,...maskLoads]).then(()=>continueRender(handle)).catch(cancelRender);
 },[handle,layers]);
 return <AbsoluteFill style={{background:'transparent',overflow:'hidden'}}>
 {source?.spans.map((span,i)=><Sequence key={'source-'+i} from={span.startFrame} durationInFrames={span.endFrame-span.startFrame}>
  <OffthreadVideo src={staticFile(`master-source/${source.assetId}`)} startFrom={span.sourceInFrame} muted style={{width:'100%',height:'100%',objectFit:'fill'}}/>
  <Audio src={staticFile(`master-source/${source.assetId}`)} startFrom={span.sourceInFrame}/>
 </Sequence>)}
 {layers.map(l=>{
  if(frame<l.startFrame||frame>=l.endFrame)return null;
  if(l.kind==='audio'&&l.assetId)return <Sequence key={l.id} from={l.startFrame} durationInFrames={l.endFrame-l.startFrame}><Audio src={staticFile(`master-assets/${l.assetId}`)} startFrom={l.sourceInFrame??0} volume={l.gain??1}/></Sequence>;
  const f=frame-l.startFrame,{rect,typography,keyframes}=l.visual;
  const x=valueAt(keyframes,f,'x',0),y=valueAt(keyframes,f,'y',0),scale=valueAt(keyframes,f,'scale',1),rotation=valueAt(keyframes,f,'rotation',0);
  const style:React.CSSProperties={position:'absolute',left:rect.x,top:rect.y,width:rect.width,height:rect.height,zIndex:l.visual.zIndex,
   opacity:l.visual.opacity*valueAt(keyframes,f,'opacity',1),transform:`translate(${x}px,${y}px) rotate(${rotation}deg) scale(${scale})`,transformOrigin:'center'};
  if(l.visual.dropShadow){const shadow=l.visual.dropShadow;style.filter=`drop-shadow(${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blurPx}px ${shadow.color})`;}
  if(l.visual.glow){const glow=l.visual.glow;style.filter=`drop-shadow(0px 0px ${glow.radiusPx}px ${glow.color})`;}
  const maskId=l.maskFrameAssetIds?l.maskFrameAssetIds[f]:l.maskAssetId;
  if(l.maskFrameAssetIds&&!maskId)throw new Error('Dynamic mask frame missing');
  const combined=!!maskId&&!!(l.visual.dropShadow||l.visual.glow);
  const maskStyle:React.CSSProperties={};
  if(maskId){const mask=`url("${staticFile(`master-assets/${maskId}`)}")`,target=combined?maskStyle:style;target.maskImage=mask;target.maskMode='alpha';target.maskSize='100% 100%';target.maskRepeat='no-repeat';}
  if(combined){
   const inner:React.CSSProperties={...maskStyle,width:'100%',height:'100%'};
   if(l.kind==='video'&&l.assetId)return <div key={l.id} style={style}><Sequence from={l.startFrame} durationInFrames={l.endFrame-l.startFrame}><OffthreadVideo src={staticFile(`master-assets/${l.assetId}`)} startFrom={l.sourceInFrame??0} muted style={{...inner,objectFit:l.fit??'fill',objectPosition:'50% 50%'}}/></Sequence></div>;
   if(l.kind==='image'&&l.assetId)return <div key={l.id} style={style}><Img src={staticFile(`master-assets/${l.assetId}`)} style={{...inner,objectFit:l.fit??'fill',objectPosition:'50% 50%'}}/></div>;
   if(!typography)return null;
   return <div key={l.id} style={style}><div style={{...inner,fontFamily:l.fontAssetId?'sues-'+l.fontAssetId:typography.family,fontSize:typography.sizePx,fontWeight:typography.weight,fontSynthesis:'none',color:typography.color,whiteSpace:'pre-wrap'}}>{l.text}</div></div>;
  }
  if(l.kind==='video'&&l.assetId)return <Sequence key={l.id} from={l.startFrame} durationInFrames={l.endFrame-l.startFrame}><OffthreadVideo src={staticFile(`master-assets/${l.assetId}`)} startFrom={l.sourceInFrame??0} muted style={{...style,objectFit:l.fit??'fill',objectPosition:'50% 50%'}}/></Sequence>;
  if(l.kind==='image'&&l.assetId)return <Img key={l.id} src={staticFile(`master-assets/${l.assetId}`)} style={{...style,objectFit:l.fit??'fill',objectPosition:'50% 50%'}}/>;
  if(!typography)return null;
  return <div key={l.id} style={{...style,fontFamily:l.fontAssetId?'sues-'+l.fontAssetId:typography.family,fontSize:typography.sizePx,fontWeight:typography.weight,fontSynthesis:'none',color:typography.color,whiteSpace:'pre-wrap'}}>{l.text}</div>;
 })}</AbsoluteFill>;
};