import React from 'react';
import {AbsoluteFill,Composition,Sequence,staticFile,useCurrentFrame} from 'remotion';
import {compileVisualBeat,appearanceAtFrame,VISUAL_GRAMMAR_158623} from '../../../src/visual-grammar.js';

const S=VISUAL_GRAMMAR_158623, INK='#1E1E1E', WHITE='#FFFFFF', GOLD='#FFD000', CYAN='#26F7FD', DARK='#0D1419';
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const ease=(f:number,on:number)=>{const x=clamp((f-on)/8);return 1-(1-x)**3;};
const pulse=(f:number,at:number)=>f<at?0:Math.min(1,(f-at)/9);
const FontStyle:React.FC=()=> <style>{`@font-face{font-family:V3Montserrat;src:url("${staticFile('fonts/Montserrat-Bold.ttf')}");font-weight:700;}@font-face{font-family:V3Montserrat;src:url("${staticFile('fonts/Montserrat-ExtraBold.ttf')}");font-weight:800 900;}`}</style>;

type Line={text:string;role:'board'|'connector'|'hero'|'fortune'|'money'|'contrast';at:number;sizePx:number;x:number;y:number;italic?:boolean};
const Typography:React.FC<{lines:Line[];duration:number;speechCue:string;mode:'speaker'|'fullGraphic';frameOffset?:number}>=({lines,duration,speechCue,mode,frameOffset=0})=>{
 const f=useCurrentFrame()-frameOffset,c=compileVisualBeat({layoutMode:mode,start:0,end:duration,speechCue,lines});
 return <>{c.lines.map((l:any,i:number)=>{
  const state=appearanceAtFrame(l,f);
  if(!state.visible)return null;
  const glow=l.glow?`0 0 ${l.glow.radiusPx}px ${l.glow.color}, 0 0 ${l.glow.radiusPx*1.5}px ${l.glow.color}66`:'';
  return <div key={i} style={{position:'absolute',left:l.x,top:l.y,width:750,maxWidth:750,
   transform:`translate(-50%,-50%) translateY(${state.translateY}px) scale(${state.scale}) scaleX(${l.text==='ABANDONANDO'?.82:1})`,transformOrigin:'center',
   opacity:state.opacity,fontFamily:'V3Montserrat,Montserrat,Arial,sans-serif',fontSize:l.sizePx,
   fontWeight:l.fontWeight,fontStyle:l.italic?'italic':'normal',color:l.color,textAlign:'center',
   lineHeight:1.05,letterSpacing:-1.5,overflowWrap:'normal',whiteSpace:'normal',
   WebkitTextStroke:l.outline?`${l.outline.widthPx}px ${l.outline.color}`:undefined,
   paintOrder:'stroke fill',textShadow:glow||'0 5px 14px #0007'}}>{l.text}</div>;
 })}</>;
};
const Grid:React.FC=()=> <AbsoluteFill style={{background:'#F1F0EB',backgroundImage:'linear-gradient(#1E1E1E15 1px,transparent 1px),linear-gradient(90deg,#1E1E1E15 1px,transparent 1px)',backgroundSize:'100px 100px'}}/>;
const Glow:React.FC<{x:number;y:number;color:string;alpha:number}>=({x,y,color,alpha})=><div style={{position:'absolute',left:x-300,top:y-280,width:600,height:560,opacity:alpha,background:`radial-gradient(circle,${color}48,transparent 72%)`,filter:'blur(36px)',pointerEvents:'none'}}/>;
const Mark:React.FC<{type:'check'|'mute'|'arrow';x:number;y:number;opacity:number}>=({type,x,y,opacity})=><svg viewBox="0 0 150 150" width="150" height="150" style={{position:'absolute',left:x-75,top:y-75,opacity,filter:'drop-shadow(0px 4px 10px #1e1e1e28)'}}>
 <circle cx="75" cy="75" r="61" fill="#FFF" stroke={INK} strokeWidth="5"/>
 {type==='check'?<path d="M37 76 L63 101 L112 48" stroke="#E6AB45" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" fill="none"/>:null}
 {type==='mute'?<><path d="M45 42 L111 108 M108 42 L41 108" stroke="#D28D44" strokeWidth="11" strokeLinecap="round"/><path d="M33 78 H64 L91 52 V100 L74 86" stroke={INK} strokeWidth="5" fill="none"/></>:null}
 {type==='arrow'?<><path d="M35 47 H95 M35 75 H95 M35 104 H95" stroke={INK} strokeWidth="9" strokeLinecap="round"/><path d="M95 45 L118 75 L95 105" stroke="#E6AB45" strokeWidth="9" strokeLinejoin="round" strokeLinecap="round" fill="none"/></>:null}
 </svg>;
export const V3List:React.FC=()=>{
 const f=useCurrentFrame(),duration=137/30;
 const rows=[{type:'check' as const,at:.88,y:900},{type:'mute' as const,at:1.66,y:1160},{type:'arrow' as const,at:3.2,y:1370}];
 return <AbsoluteFill style={{overflow:'hidden',background:'#F1F0EB'}}><FontStyle/><Grid/>
 <div style={{position:'absolute',top:290,left:80,right:80,fontFamily:'V3Montserrat',fontWeight:700,fontSize:64,color:INK,textAlign:'center',opacity:ease(f,0)}}>LAS REGLAS QUE APRENDES</div>
 {rows.map((r,i)=><React.Fragment key={i}><div style={{position:'absolute',top:r.y,left:50,right:55,height:180,transform:'translateY(-50%)',background:i===1?'#FFFFFFB8':'#FFFFFF91',border:'2px solid #1E1E1E35',borderRadius:24,opacity:ease(f,Math.round(r.at*30))}}/><Mark type={r.type} x={180} y={r.y} opacity={ease(f,Math.round(r.at*30))}/></React.Fragment>)}
 <Typography duration={duration} mode="fullGraphic" speechCue="De pequeño aprendes a portarte bien a no molestar hacer lo que se espera de ti" lines={[
  {text:'PÓRTATE BIEN',role:'board',at:.88,sizePx:80,x:640,y:900},
  {text:'NO MOLESTES',role:'board',at:1.66,sizePx:85,x:640,y:1160},
  {text:'LO QUE ESPERAN',role:'board',at:3.2,sizePx:80,x:640,y:1370}
 ]}/>
 </AbsoluteFill>;
};
const Branch:React.FC<{f:number}>=({f})=><svg viewBox="0 0 1080 1920" width="1080" height="1920" style={{position:'absolute',inset:0,opacity:ease(f,26)}}>
 <path d="M540 1030 V1150" fill="none" stroke="#1E1E1E" strokeWidth="11"/>
 <path d="M540 1150 C540 1230 300 1240 300 1370 M540 1150 C540 1230 780 1240 780 1370" fill="none" stroke="#1E1E1E" strokeWidth="11" strokeLinecap="round"/>
 <circle cx="300" cy="1410" r="83" fill="#FFF" stroke="#26F7FD" strokeWidth="11"/>
 <circle cx="780" cy="1410" r="83" fill="#FFF" stroke="#FFD000" strokeWidth="11"/>
 <path d="M257 1411 L285 1439 L347 1377" fill="none" stroke="#26B7C5" strokeWidth="14" strokeLinecap="round"/>
 <path d="M742 1370 L817 1450 M817 1370 L742 1450" fill="none" stroke="#BE8730" strokeWidth="14" strokeLinecap="round"/>
 </svg>;
export const V3Decision:React.FC=()=>{
 const f=useCurrentFrame();
 const phase=196,after=f-phase;
 if(f<phase)return <AbsoluteFill style={{overflow:'hidden'}}><FontStyle/><Grid/>
   <div style={{position:'absolute',top:340,left:70,right:70,color:INK,textAlign:'center',fontFamily:'V3Montserrat',fontSize:65,opacity:ease(f,34)}}>LA VERDADERA PREGUNTA</div>
   <Typography duration={phase/30} mode="fullGraphic" speechCue="La verdadera pregunta cuántas decisiones de tu vida has tomado" lines={[
    {text:'¿CUÁNTAS',role:'board',at:1.76,sizePx:95,x:540,y:690},
    {text:'DECISIONES',role:'board',at:2.3,sizePx:103,x:540,y:805},
    {text:'DE TU VIDA?',role:'board',at:4.08,sizePx:80,x:540,y:920}
   ]}/><Branch f={f}/>
 </AbsoluteFill>;
 return <AbsoluteFill style={{overflow:'hidden',background:DARK}}><FontStyle/>
  <div style={{position:'absolute',inset:0,background:'linear-gradient(90deg,#132934 0%,#090F16 51%,#2A2114 100%)'}}/>
  <Glow x={280} y={985} color={CYAN} alpha={pulse(after,5)*.65}/>
  <Glow x={800} y={985} color={GOLD} alpha={pulse(after,60)*.6}/>
  <div style={{position:'absolute',top:430,left:100,right:100,fontFamily:'V3Montserrat',fontSize:64,fontWeight:700,textAlign:'center',color:WHITE,opacity:ease(after,0)}}>¿QUÉ TE MUEVE?</div>
  <Typography mode="speaker" frameOffset={phase} duration={(275-phase)/30} speechCue="por amor y cuántas por miedo a perderlo" lines={[
    {text:'AMOR',role:'fortune',at:(40.2-(33.4+phase/30)),sizePx:112,x:285,y:945},
    {text:'MIEDO',role:'contrast',at:(41.78-(33.4+phase/30)),sizePx:110,x:790,y:945}
  ]}/>
  <svg style={{position:'absolute',top:1010,left:0}} width="1080" height="380">
    <path d="M290 150 C220 69 155 122 174 192 C201 264 270 290 290 322 C308 290 394 242 404 181 C420 104 336 69 290 150Z" fill="none" stroke={CYAN} strokeWidth="10" opacity={pulse(after,10)}/>
    <path d="M780 130 L850 205 L780 281 L710 205 Z" fill="none" stroke={GOLD} strokeWidth="11" opacity={pulse(after,58)}/>
    <path d="M760 160 L810 252" stroke={GOLD} strokeWidth="9" opacity={pulse(after,65)}/>
  </svg>
 </AbsoluteFill>;
};
export const V3Identity:React.FC=()=>{
 const f=useCurrentFrame(),t=f/30;
 const appear=ease(f,10),fracture=ease(f,70),fit=ease(f,158);
 return <AbsoluteFill style={{overflow:'hidden',background:'#111821'}}><FontStyle/>
  <AbsoluteFill style={{background:'radial-gradient(ellipse at 50% 52%,#28343B 0%,#12181D 65%,#0B1014)'}}/>
  <Glow x={525} y={975} color={GOLD} alpha={.25*fracture}/>
  <div style={{position:'absolute',top:290,left:88,right:88,fontFamily:'V3Montserrat',fontSize:65,fontWeight:700,color:WHITE,opacity:appear,textAlign:'center'}}>¿QUÉ HAS DEJADO ATRÁS?</div>
  <Typography duration={181/30} mode="speaker" speechCue="qué partes de ti has ido abandonando para poder encajar" lines={[
   {text:'PARTES DE TI',role:'contrast',at:.36,sizePx:100,x:540,y:775},
   {text:'ABANDONANDO',role:'hero',at:2.34,sizePx:100,x:540,y:970},
   {text:'ENCAJAR',role:'fortune',at:5.24,sizePx:113,x:540,y:1650}
  ]}/>
  <svg width="1080" height="800" viewBox="0 0 1080 800" style={{position:'absolute',top:940,left:0,opacity:appear}}>
   <path d="M220 420 H440 Q475 375 440 340 V230 H220 Z" fill="#152028" stroke="#E7AB67" strokeWidth="8" transform={`translate(${-45*fracture},${-24*fracture})`}/>
   <path d="M465 230 H690 V430 H465 Q425 385 465 340Z" fill="#152028" stroke="#E7AB67" strokeWidth="8" transform={`translate(${45*fracture},${26*fracture})`}/>
   <path d="M350 455 H560 V600 H350Z" fill="none" stroke="#E7AB67" strokeWidth="8" strokeDasharray="15 11" opacity={fracture}/>
   <path d="M580 455 H780 V600 H580Z" fill="none" stroke="#26F7FD" strokeWidth="9" opacity={fit} transform={`translate(${(1-fit)*140},0)`}/>
  </svg>
 </AbsoluteFill>;
};
export const V3GraphicRoot:React.FC=()=> <><Composition id="SUES-158404-V3-LIST" component={V3List} fps={30} durationInFrames={137} width={1080} height={1920}/><Composition id="SUES-158404-V3-DECISION" component={V3Decision} fps={30} durationInFrames={275} width={1080} height={1920}/><Composition id="SUES-158404-V3-IDENTITY" component={V3Identity} fps={30} durationInFrames={181} width={1080} height={1920}/></>;