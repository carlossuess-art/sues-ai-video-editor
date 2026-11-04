import React from 'react';
import {AbsoluteFill,useCurrentFrame} from 'remotion';
import plan from '../public/v4/caption-plan.json';

type Word={index:number;text:string;start:number;end:number;role:'connector'|'hero';tone:'connector'|'contrast'|'fortune'};
type Beat={id:number;start:number;end:number;words:Word[];mode:'speaker'|'board'|'darkBoard'|'cta';topic:string};
const beats=plan.beats as Beat[];
const FONT='V4Montserrat,Montserrat,Inter,Arial,sans-serif';
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const easing=(v:number)=>1-Math.pow(1-v,3);
const toneColor=(tone:string,mode:string)=>mode==='board'?'#1E1E1E':tone==='fortune'?'#26F7FD':tone==='contrast'?'#FFD000':'#FFFFFF';
const fade=(t:number,at:number)=>easing(clamp((t-at)/.22));
export const V4CaptionLayer:React.FC=()=>{
 const frame=useCurrentFrame(),t=frame/30;
 const beat=beats.find(b=>b.start<=t&&t<b.end);
 if(!beat)return null;
 // Follow the actual frame's scene, not only the beat-start mode.
 // A spoken phrase can cross a graphic-to-speaker boundary; never leave captions on the face.
 const mode=t>=63.333333?'cta':t>=54.15?'speaker':t>=46?'darkBoard':t>=41.25?'speaker':t>=33.4?'board':t>=12.55?'speaker':t>=7.7?'board':'speaker';
 const visible=beat.words.filter(w=>t>=w.start-.001);
 if(!visible.length)return null;
 const connectors=visible.filter(w=>w.role==='connector');
 const hero=visible.find(w=>w.role==='hero');
 const [cy,hy]=mode==='speaker'?[1240,1390]:mode==='cta'?[830,990]:[650,810];
 const groupOpacity=fade(t,beat.start)*clamp((beat.end-t)/.12);
 const baseText=connectors.map(w=>w.text).join(' ');
 const baseLine=baseText.length>22?baseText.split(' ').slice(0,3).join(' '):baseText;
 const heroText=hero?.text.toLocaleUpperCase('es-ES');
 const long=(heroText?.length??0)>12;
 const fontSize=hero?long?98:heroText!.length>9?102:110:64;
 const fitScale=heroText?Math.min(1,9.7/Math.max(7,heroText.length)):.99;
 const glow=hero?.tone==='fortune'?'0 0 25px #00E5FFCC,0 0 42px #00E5FF77':hero?.tone==='contrast'?'0 0 16px #FFD00055':'0 3px 12px #000B';
 return <AbsoluteFill style={{pointerEvents:'none',fontFamily:FONT}}>
  {mode==='speaker'?<div style={{position:'absolute',inset:'53% 0 0',background:'linear-gradient(180deg,transparent,rgba(6,12,18,.52) 32%,rgba(6,12,18,.68) 75%,transparent 100%)'}}/>:null}
  {connectors.length>0?<div style={{position:'absolute',left:540,top:hero?cy-20:cy+62,transform:'translate(-50%,-50%)',
   maxWidth:920,minWidth:100,padding:mode==='speaker'?'11px 23px':'0 15px',borderRadius:18,
   background:mode==='speaker'?'rgba(5,11,17,.63)':'transparent',backdropFilter:mode==='speaker'?'blur(5px)':undefined,
   color:mode==='board'?'#1E1E1E':'#FFFFFF',fontSize:64,fontWeight:700,
   textAlign:'center',lineHeight:1.08,letterSpacing:-1.0,whiteSpace:'nowrap',
   WebkitTextStroke:mode==='board'?'3px #FFFFFF':undefined,paintOrder:'stroke fill',
   textShadow:mode==='board'?'0 4px 7px #0003':'0 4px 12px #000D',
   opacity:groupOpacity*fade(t,connectors[0].start)}}>{baseLine}</div>:null}
  {hero?<div style={{position:'absolute',left:540,top:hy,width:950,maxWidth:950,textAlign:'center',
   transform:`translate(-50%,-50%) translateY(${(1-fade(t,hero.start))*18}px) scale(${.90+.10*fade(t,hero.start)}) scaleX(${fitScale})`,
   opacity:groupOpacity*fade(t,hero.start),whiteSpace:'nowrap',fontSize:fontSize,
   fontWeight:900,letterSpacing:-2.1,lineHeight:1.02,
   color:toneColor(hero.tone,mode),
   WebkitTextStroke:mode==='board'?'6px #FFFFFF':undefined,paintOrder:'stroke fill',
   textShadow:mode==='board'?'0 5px 10px #0003':glow}}>
   {heroText}
  </div>:null}
 </AbsoluteFill>;
};
export const CaptionPlanStats=()=>({beatCount:beats.length,wordsCount:beats.reduce((n,b)=>n+b.words.length,0),heroCount:beats.flatMap(b=>b.words).filter(w=>w.role==='hero').length});
