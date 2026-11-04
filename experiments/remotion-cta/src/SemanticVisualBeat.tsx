import React from 'react';
import {AbsoluteFill,Img,Sequence,useCurrentFrame} from 'remotion';
import {compileVisualBeat,appearanceAtFrame} from '../../../src/visual-grammar.js';

export type SemanticBeatInput={
 layoutMode:'speaker'|'fullGraphic';start:number;end:number;speechCue:string;
 lines:Array<{text:string;role:'connector'|'hero'|'fortune'|'money'|'contrast'|'board';at:number;sizePx?:number;x?:number;y?:number;italic?:boolean}>;x?:number;
};
/** Frame-driven text; explicit speech timings, no periodic animations. */
export const SemanticVisualBeat:React.FC<{beat:SemanticBeatInput;subjectSrc?:string;backgroundSrc?:string;objects?:Array<{src:string;x:number;y:number;w:number;h:number;at:number}>}>=({beat,subjectSrc,backgroundSrc,objects=[]})=>{
 const frame=useCurrentFrame(),c=compileVisualBeat(beat),time=frame/30,board=c.layoutMode==='fullGraphic';
 return <AbsoluteFill style={{background:board?'#F3F1EE':'#151A20',overflow:'hidden',fontFamily:'Montserrat,Inter,Arial,sans-serif'}}>
  {backgroundSrc?<Img src={backgroundSrc} style={{position:'absolute',width:'100%',height:'100%',objectFit:'cover'}}/>:null}
  {board?<AbsoluteFill style={{backgroundImage:'linear-gradient(#16161619 1px,transparent 1px),linear-gradient(90deg,#16161619 1px,transparent 1px)',backgroundSize:'85px 85px'}}/>:null}
  {c.ambient?<AbsoluteFill style={{pointerEvents:'none',mixBlendMode:'screen',opacity:c.ambient.opacity,background:`radial-gradient(ellipse at 50% 78%,${c.ambient.color}88 0%,transparent 65%)`}}/>:null}
  {subjectSrc?<Img src={subjectSrc} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}}/>:null}
  {c.lines.map((line:any,i:number)=>{
   const state=appearanceAtFrame(line,frame);if(!state.visible)return null;
   return <div key={i} style={{position:'absolute',left:line.x,top:line.y,width:900,maxWidth:'83%',textAlign:'center',transform:`translate(-50%,-50%) translateY(${state.translateY}px) scale(${state.scale})`,opacity:state.opacity,
    fontFamily:line.fontFamily,fontSize:line.sizePx,fontWeight:line.fontWeight,fontStyle:line.italic?'italic':'normal',lineHeight:1.06,whiteSpace:'normal',letterSpacing:-1.4,color:line.color,
    WebkitTextStroke:line.outline?`${line.outline.widthPx}px ${line.outline.color}`:undefined,
    textShadow:line.glow?`0 0 ${line.glow.radiusPx}px ${line.glow.color},0 0 ${line.glow.radiusPx*1.7}px ${line.glow.color}88`:line.shadow?'0 4px 8px #0009':undefined}}>{line.text}</div>;
  })}
  {objects.map((obj,i)=>time>=obj.at?<Img key={i} src={obj.src} style={{position:'absolute',left:obj.x,top:obj.y,width:obj.w,height:obj.h,objectFit:'contain',opacity:Math.min(1,(time-obj.at)*8)}}/>:null)}
 </AbsoluteFill>;
};
export const Reference158623Demo:React.FC=()=>{
 const a:SemanticBeatInput={layoutMode:'speaker',start:0,end:2.2,speechCue:'una auténtica FORTUNA',lines:[
  {text:'una auténtica',role:'connector',at:.04,sizePx:62,y:940,x:510},
  {text:'FORTUNA',role:'fortune',at:.7,sizePx:115,y:1035,x:510}]};
 const b:SemanticBeatInput={layoutMode:'fullGraphic',start:0,end:2.2,speechCue:'al equipo de efectos especiales y maquillaje',lines:[
  {text:'al equipo de',role:'board',at:.05,sizePx:80,y:680},
  {text:'efectos especiales',role:'board',at:.5,sizePx:80,y:785},
  {text:'y maquillaje',role:'board',at:1.2,sizePx:80,y:890}]};
 return <AbsoluteFill><Sequence from={0} durationInFrames={66}><SemanticVisualBeat beat={a}/></Sequence><Sequence from={66} durationInFrames={66}><SemanticVisualBeat beat={b}/></Sequence></AbsoluteFill>;
};
