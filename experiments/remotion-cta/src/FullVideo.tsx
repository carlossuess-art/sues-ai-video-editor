import React, {useMemo} from 'react';
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import captions from './full-captions.json';

/**
 * SUES · 158404 private editorial review.
 * Original audio 00:00-01:05 intact; B-roll sources are MUTED.
 * Uses only credited Pexels B-roll R1, R3 and R4 plus proprietary motion compositions.
 * Pexels attribution and use restrictions must still be checked before publication.
 */
export const FPS = 30;
export const END_ORIGINAL = 1950; // 65 s
export const CTA_FRAMES = 339;
export const TOTAL = END_ORIGINAL + CTA_FRAMES;
const GOLD = '#F0BC76', IVORY = '#FFF8EE', DEEP='#0D1115';
const SANS='SuesMontserrat, Montserrat, Arial, sans-serif';
const SERIF='SuesPlayfair, Georgia, serif';
const video=(name:string)=>staticFile('full/'+name+'.mp4');
const bg=(i:number)=>staticFile('backgrounds/tapiz-0'+i+(i===1?'-cuadricula-antracita-ambar':i===2?'-perspectiva-ambar':'-ondas-cobre')+'.webp');
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const opacityAt=(time:number,a:number,b:number,edge=.18)=>clamp((time-a)/edge)*clamp((b-time)/edge);
const S=[{s:21.45,e:23.7,n:'r1-chain',inPoint:.4},{s:42.55,e:44.77,n:'r3-sun',inPoint:1.2},{s:56.2,e:58.52,n:'r4-path',inPoint:1.0}];
const enter=(f:number,start:number,duration=12)=>interpolate(f,[start,start+duration],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const pop=(f:number,start:number)=> {
 const v=interpolate(f,[start,start+5,start+10,start+15],[0,.67,1.095,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
 return v;
};
const Tapiz:React.FC<{kind:number}>=({kind})=>{
 const f=useCurrentFrame();return <Img src={bg(kind)} style={{position:'absolute',inset:0,width:'102%',height:'102%',objectFit:'cover',left:'-1%',top:'-1%',transform:`scale(${1+f*0.000035})`}}/>;
};
const SourceCutout:React.FC<{sourceStart:number;scale?:number;right?:number;top?:number}>=({sourceStart,scale=1,right=0,top=0})=>{
 const f=useCurrentFrame(),absolute=Math.round(sourceStart*FPS)+f;
 const path=staticFile('full/matte/mask_'+String(absolute).padStart(4,'0')+'.png');
 // Nested masks intersect: the existing per-frame subject matte is preserved;
 // its formerly straight bottom edge is feathered before compositing over tapiz.
 const feather='radial-gradient(ellipse 57% 39% at 55% 42%, #000 36%, rgba(0,0,0,.88) 57%, rgba(0,0,0,.38) 78%, transparent 100%)';
 return <div style={{position:'absolute',width:`${scale*100}%`,height:`${scale*100}%`,right,top,
   WebkitMaskImage:feather,maskImage:feather,filter:'drop-shadow(0 10px 26px rgba(0,0,0,.45))'}}>
  <OffthreadVideo src={video('source-cfr30')} muted startFrom={Math.round(sourceStart*FPS)} style={{
    width:'100%',height:'100%',objectFit:'cover',WebkitMaskImage:`url("${path}")`,maskImage:`url("${path}")`,
    WebkitMaskSize:'100% 100%',maskSize:'100% 100%'
  }}/>
 </div>;
};
const SourceSoft:React.FC<{sourceStart:number;scale?:number;right?:number;top?:number}>=({sourceStart,scale=1,right=0,top=0})=>{
 return <OffthreadVideo src={video('source-cfr30')} muted startFrom={Math.round(sourceStart*FPS)} style={{
  position:'absolute',width:`${scale*100}%`,height:`${scale*100}%`,right,top,objectFit:'cover',
  WebkitMaskImage:'radial-gradient(ellipse 56% 47% at 58% 52%, #000 35%, rgba(0,0,0,.93) 62%, transparent 100%)',
  maskImage:'radial-gradient(ellipse 56% 47% at 58% 52%, #000 35%, rgba(0,0,0,.93) 62%, transparent 100%)'
 }}/>;
};
const ClipInner:React.FC<{e:number;s:number;n:string;inPoint:number}>=({e,s,n,inPoint})=>{
 const f=useCurrentFrame(),t=f/FPS,d=e-s;
 return <AbsoluteFill style={{opacity:opacityAt(t,0,d,.18),background:DEEP}}>
 <OffthreadVideo src={video(n)} muted startFrom={Math.round(inPoint*FPS)} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
 <div style={{position:'absolute',inset:0,background:'linear-gradient(0deg,rgba(0,0,0,.28),transparent 37%,rgba(0,0,0,.12))'}}/>
 </AbsoluteFill>;
};
const Clip:React.FC<{s:number;e:number;n:string;inPoint:number}>=({s,e,n,inPoint})=>
 <Sequence from={Math.round(s*FPS)} durationInFrames={Math.round((e-s)*FPS)}>
   <ClipInner s={s} e={e} n={n} inPoint={inPoint}/>
 </Sequence>;

const AnimatedText:React.FC<{text:string;size:number;top:number;left?:number;color?:string;italic?:boolean;delay?:number;align?:'left'|'center';width?:number}>=({text,size,top,left=65,color=IVORY,italic=false,delay=0,align='left',width=960})=>{
 const f=useCurrentFrame(),a=pop(f,delay),opacity=enter(f,delay,6);
 return <div style={{position:'absolute',top,left,width,textAlign:align||'left',fontSize:size,color,fontFamily:italic?SERIF:SANS,fontStyle:italic?'italic':'normal',fontWeight:italic?650:800,lineHeight:1.03,letterSpacing:-2.4,textShadow:'0 5px 22px #000A',opacity,transform:`translateY(${(1-opacity)*26}px) scale(${a})`,transformOrigin:'left center'}}>{text}</div>;
};
const TopLeftBadges:React.FC=()=>{
 const f=useCurrentFrame();
 return <>{[{t:'✓ TE APLAUDEN',s:104},{t:'✓ TE ACEPTAN',s:155}].map((p,i)=>{
 const k=pop(f,p.s);return <div key={i} style={{position:'absolute',top:190+i*150,left:65,padding:'23px 28px',borderRadius:23,background:'rgba(15,22,25,.81)',border:'2px solid #E3B47B',color:IVORY,fontFamily:SANS,fontSize:48,fontWeight:800,boxShadow:'0 9px 22px #0006',transform:`scale(${k})`,transformOrigin:'left center'}}>{p.t}</div>;
 })}</>;
};
const ListScene:React.FC=()=>{
 const f=useCurrentFrame();
 const rows=[{t:'PÓRTATE BIEN',s:34,icon:'01'},{t:'NO MOLESTES',s:68,icon:'02'},{t:'HAZ LO QUE ESPERAN',s:99,icon:'03'}];
 return <AbsoluteFill style={{background:DEEP}}>
 <Tapiz kind={1}/>
 <div style={{position:'absolute',top:235,left:70,color:GOLD,fontSize:50,fontFamily:SERIF,fontStyle:'italic'}}>Las reglas que aprendes</div>
 {rows.map((x,i)=>{
 const k=pop(f,x.s);return <div key={x.icon} style={{position:'absolute',top:425+i*248,left:70,right:70,display:'flex',alignItems:'center',gap:24,opacity:k>0?1:0,transform:`translateX(${(1-k)*-36}px) scale(${k})`}}>
 <div style={{width:106,height:106,borderRadius:55,border:'3px solid '+GOLD,display:'flex',justifyContent:'center',alignItems:'center',background:'#11191BCC',fontFamily:SANS,fontWeight:800,fontSize:41,color:GOLD}}>{x.icon}</div>
 <div style={{fontFamily:SANS,fontSize:i===2?61:76,fontWeight:800,color:IVORY,letterSpacing:-1.4}}>{x.t}</div>
 </div>;
 })}
 <div style={{position:'absolute',top:1300,left:80,right:80,height:2,background:'#F0BC764F'}}/>
 </AbsoluteFill>;
};
const ChoiceScene:React.FC=()=>{
 const f=useCurrentFrame();
 return <AbsoluteFill style={{background:DEEP}}>
 <Tapiz kind={2}/>
 <div style={{position:'absolute',top:258,left:55,right:55,textAlign:'center',fontSize:51,fontFamily:SERIF,fontStyle:'italic',color:IVORY}}>¿Desde dónde decides?</div>
 <div style={{position:'absolute',top:490,left:540,width:3,height:620,background:'#F0BC7780'}}/>
 {[
 {x:40,t:'AMOR',subtitle:'Elegir desde ti',s:28,lit:true},
 {x:575,t:'MIEDO',subtitle:'Temer perderlo',s:114,lit:false}
 ].map((v,i)=>{
 const k=pop(f,v.s);
 return <div key={v.t} style={{position:'absolute',left:v.x,top:555,width:465,textAlign:'center',opacity:k>0?1:0,transform:`scale(${k})`,color:v.lit?'#F8D7A5':'#D6C4BA'}}>
 <div style={{fontFamily:SANS,fontSize:84,fontWeight:800}}>{v.t}</div>
 <div style={{height:180,marginTop:70,fontSize:108,color:v.lit?GOLD:'#A8B0B5'}}>{v.lit?'♡':'⛓'}</div>
 <div style={{fontFamily:SERIF,fontStyle:'italic',fontSize:40,marginTop:40}}>{v.subtitle}</div>
 </div>;
 })}
 <div style={{position:'absolute',top:1160,left:130,right:130,textAlign:'center',fontFamily:SANS,fontSize:51,color:IVORY,opacity:enter(f,170,10)}}>Una pregunta. Dos caminos.</div>
 </AbsoluteFill>;
};
const QuestionScene:React.FC=()=>{
 const f=useCurrentFrame(),k=enter(f,10,14);
 return <AbsoluteFill style={{background:DEEP}}>
 <Tapiz kind={3}/>
 <SourceSoft sourceStart={29.16} scale={.82} right={-10} top={210}/>
 <div style={{position:'absolute',top:470,left:44,width:440,fontFamily:SANS,fontSize:62,fontWeight:800,lineHeight:1.17,color:IVORY,textShadow:'0 4px 20px #0009',opacity:k}}>
 ¿Y SI DEJAN<br/>DE <span style={{color:GOLD}}>QUERERME?</span>
 </div>
 <div style={{position:'absolute',top:825,left:56,width:350,height:3,background:GOLD,opacity:k}}/>
 </AbsoluteFill>;
};
const MaskScene:React.FC=()=>{
 const f=useCurrentFrame();
 return <AbsoluteFill style={{background:DEEP}}>
 <Tapiz kind={3}/>
 <div style={{position:'absolute',top:465,left:54,width:440,fontFamily:SANS,fontWeight:800,fontSize:81,color:'#E5B177',lineHeight:1.06,textShadow:'0 4px 30px #000B',opacity:enter(f,12,12)}}>PARTES<br/>DE TI</div>
 <SourceCutout sourceStart={50.166667} scale={.86} right={-105} top={200}/>
 <div style={{position:'absolute',top:320,left:55,width:370,fontFamily:SERIF,fontStyle:'italic',fontSize:42,color:IVORY,opacity:enter(f,23,9)}}>¿Qué has dejado atrás?</div>
 </AbsoluteFill>;
};
const FinalScene:React.FC=()=>{
 const f=useCurrentFrame();
 const cues=[
  {text:'DEJA DE',start:43,top:710,color:IVORY,size:69},
  {text:'TRAICIONARTE',start:58,top:815,color:GOLD,size:57},
  {text:'CADA DÍA',start:145,top:1140,color:IVORY,size:64}
 ];
 return <AbsoluteFill style={{background:DEEP}}>
  <Tapiz kind={3}/>
  <div style={{position:'absolute',inset:0,background:'linear-gradient(90deg,#05070A77,transparent 80%)'}}/>
  <SourceSoft sourceStart={58.53333} scale={.85} right={-90} top={230}/>
  <div style={{position:'absolute',top:530,left:52,width:420,fontFamily:SERIF,fontStyle:'italic',fontSize:48,color:IVORY,opacity:enter(f,0,13)}}>El primer paso</div>
  {cues.map((v,i)=>{
   const k=pop(f,v.start);
   if(f<v.start)return null;
   return <div key={i} style={{position:'absolute',left:54,top:v.top,fontFamily:SANS,fontSize:v.size,fontWeight:800,color:v.color,lineHeight:1.03,textShadow:'0 5px 18px #000A',opacity:Math.min(1,k),transform:`scale(${k})`,transformOrigin:'left center'}}>{v.text}</div>;
  })}
 </AbsoluteFill>;
};


// Only the three editorially traceable Pexels clips remain. Rejected social media
// footage is replaced by original explanatory compositions based on Carlos' camera image.
// All elements are within x 54..1026 of the 1080px safe composition.
const RejectionScene:React.FC=()=>{
 const f=useCurrentFrame();
 const k=pop(f,12), pulse=1+Math.sin(f*.22)*.026;
 return <AbsoluteFill style={{background:DEEP}}>
   <Tapiz kind={3}/>
   <div style={{position:'absolute',inset:0,background:'linear-gradient(90deg,#06090ACF,#06090A55 52%,transparent)'}}/>
   <SourceSoft sourceStart={26.7} scale={.81} right={-100} top={190}/>
   <div style={{position:'absolute',top:260,left:55,width:460,color:IVORY,fontFamily:SERIF,fontStyle:'italic',fontSize:52}}>Cuando aparece...</div>
   <div style={{position:'absolute',top:385,left:55,width:505,color:GOLD,fontFamily:SANS,fontSize:88,fontWeight:800,letterSpacing:-2.5,lineHeight:1.04,opacity:enter(f,5,9)}}>EL MIEDO</div>
   <svg style={{position:'absolute',left:66,top:600,opacity:enter(f,14,7),transform:'scale('+pulse+')'}} width="420" height="340" viewBox="0 0 420 340">
     <path d="M 119 120 C 90 52 12 79 24 155 C 36 220 122 272 208 300" fill="none" stroke="#EDC18B" strokeWidth="9" strokeLinecap="round"/>
     <path d="M 300 120 C 331 52 408 79 397 155 C 390 204 340 238 298 265" fill="none" stroke="#EDC18B" strokeWidth="9" strokeLinecap="round"/>
     <path d="M 210 64 L 165 155 L 226 168 L 192 270" fill="none" stroke="#F6E2C4" strokeWidth="12" strokeLinejoin="round" strokeLinecap="round"/>
     <path d="M 250 285 L 310 270" stroke="#E8B57C" strokeWidth="6" strokeLinecap="round"/>
   </svg>
   <div style={{position:'absolute',left:60,top:1020,width:430,color:IVORY,fontFamily:SANS,fontWeight:700,fontSize:44,opacity:enter(f,36,8)}}>¿Y si dejo de gustarles?</div>
 </AbsoluteFill>;
};
const RecognitionScene:React.FC=()=>{
 const f=useCurrentFrame();
 return <AbsoluteFill style={{background:DEEP}}>
  <Tapiz kind={2}/>
  <div style={{position:'absolute',inset:0,background:'linear-gradient(90deg,#040608D8 0%,#06070855 60%,transparent)'}}/>
  <SourceSoft sourceStart={47.8} scale={.82} right={-90} top={210}/>
  <div style={{position:'absolute',left:55,top:320,color:IVORY,fontFamily:SERIF,fontSize:52,fontStyle:'italic',opacity:enter(f,0,8)}}>Mirar hacia dentro</div>
  <div style={{position:'absolute',left:52,top:425,width:570,fontFamily:SANS,fontSize:74,fontWeight:800,letterSpacing:-2.5,color:GOLD,lineHeight:1.05,transform:'scale('+pop(f,12)+')',transformOrigin:'left center'}}>RECONOCER</div>
  <svg style={{position:'absolute',left:60,top:660,opacity:enter(f,24,9)}} width="450" height="340" viewBox="0 0 450 340">
   <rect x="48" y="22" width="304" height="280" rx="145" fill="none" stroke="#EED1A8" strokeWidth="9"/>
   <path d="M 210 76 C 168 90 151 131 166 173 C 180 208 232 227 228 272" stroke="#E9B576" strokeWidth="12" fill="none" strokeLinecap="round"/>
   <path d="M 234 76 C 290 86 306 130 290 177 C 273 218 232 229 235 272" stroke="#A88764" strokeWidth="10" fill="none" strokeDasharray="13 13" strokeLinecap="round"/>
  </svg>
 </AbsoluteFill>;
};
const FitScene:React.FC=()=>{
 const f=useCurrentFrame(), k=pop(f,12);
 return <AbsoluteFill style={{background:DEEP}}>
   <Tapiz kind={1}/>
   <div style={{position:'absolute',inset:0,background:'linear-gradient(90deg,#060809E8 0%,#07090B44 62%,transparent)'}}/>
   <SourceSoft sourceStart={53.1} scale={.79} right={-100} top={235}/>
   <div style={{position:'absolute',left:54,top:380,width:490,color:IVORY,fontFamily:SERIF,fontStyle:'italic',fontSize:48,opacity:enter(f,2,7)}}>¿Para qué?</div>
   <div style={{position:'absolute',left:53,top:477,width:530,color:GOLD,fontFamily:SANS,fontSize:89,fontWeight:800,opacity:enter(f,12,7),lineHeight:1}}>ENCAJAR</div>
   <svg style={{position:'absolute',top:655,left:60,opacity:enter(f,17,8)}} viewBox="0 0 460 330" width="430" height="300">
    <path d="M40 70 H140 C126 118 185 150 205 102 C209 90 204 78 198 70 H316 V280 H207 C218 230 160 211 141 254 C138 262 138 271 142 280 H40 Z" fill="none" stroke="#F3D5A7" strokeWidth="10" strokeLinejoin="round"/>
    <path d="M 356 100 C 386 86 422 114 407 149 C 399 168 383 176 365 176 V247 H296 V200" stroke="#D4A46B" strokeWidth="10" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="12 12"/>
    <path d="M 347 113 L 356 102 L 367 118" fill="none" stroke="#F8E8CF" strokeWidth="8" strokeLinecap="round"/>
   </svg>
   <div style={{position:'absolute',left:58,top:1100,width:460,color:IVORY,fontFamily:SANS,fontSize:40,fontWeight:700,opacity:enter(f,35,8)}}>No necesitas dejar de ser tú.</div>
 </AbsoluteFill>;
};

const Captions:React.FC=()=>{
 const f=useCurrentFrame(), t=f/FPS;const cue=(captions as {start:number;end:number;text:string}[]).find(x=>x.start<=t&&x.end>t);
 if(!cue||[ [7.74,12.32],[33.4,41.65] ].some(([a,b])=>t>=a&&t<=b))return null;
 const emph=/(miedo|amor|culpable|límites|despertar|rechazo|traicionarte)/i.test(cue.text);
 return <div style={{position:'absolute',top:1418,left:64,right:64,minHeight:160,textAlign:'center',fontFamily:SANS,fontWeight:800,fontSize:cue.text.length>32?54:cue.text.length>22?61:70,lineHeight:1.06,letterSpacing:-.8,color:emph?GOLD:IVORY,textShadow:'0 4px 11px #000,0 7px 30px #000',WebkitTextStroke:'0.5px rgba(2,4,5,.25)'}}>
 {cue.text}
 </div>;
};
const Extra:React.FC=()=>{
 const f=useCurrentFrame(),t=f/FPS;
 return <>
 {t>=3.42&&t<7.34?<TopLeftBadges/>:null}
 {t>=12.7&&t<16.5?<AnimatedText text="TE ACEPTAN" size={70} top={175} delay={385}/>:null}
 {t>=16.5&&t<20.8?<><AnimatedText text="NO" size={205} top={190} left={95} color={GOLD} delay={498}/><AnimatedText text="CULPA" size={90} top={405} left={95} delay={533}/></>:null}
 {t>=23.7&&t<26.5?<AnimatedText text="PONER LÍMITES" size={65} top={185} left={63} delay={720}/>:null}
 {t>=44.8&&t<47.78?<AnimatedText text="DESPERTAR" size={78} top={175} left={76} color={GOLD} delay={1350}/>:null}
 </>;
};
const AudioAccent:React.FC<{start:number;file:string;volume:number}>=({start,file,volume})=><Sequence from={Math.round(start*FPS)} durationInFrames={30}><Audio src={staticFile('full/'+file)} volume={volume}/></Sequence>;
export const FullVideo:React.FC=()=>{
 const frame=useCurrentFrame(),t=frame/FPS;
 const base=staticFile('full/source-cfr30.mp4'),cta=staticFile('full/cta.mp4'), bed=staticFile('full/ambient.wav');
 const fonts=[staticFile('fonts/Montserrat-Bold.ttf'),staticFile('fonts/Montserrat-ExtraBold.ttf'),staticFile('fonts/PlayfairDisplay-Italic.ttf')];
 const fontStyles=`@font-face{font-family:SuesMontserrat;src:url("${fonts[0]}");font-weight:700}@font-face{font-family:SuesMontserrat;src:url("${fonts[1]}");font-weight:800}@font-face{font-family:SuesPlayfair;src:url("${fonts[2]}");font-style:italic;font-weight:100 900}`;
 return <AbsoluteFill style={{background:DEEP,overflow:'hidden'}}>
 <style>{fontStyles}</style>
 <Sequence from={0} durationInFrames={END_ORIGINAL}>
 <OffthreadVideo src={base} volume={1} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
 </Sequence>
 <Sequence from={Math.round(7.74*FPS)} durationInFrames={Math.round((12.31-7.74)*FPS)}><ListScene/></Sequence>
 <Sequence from={Math.round(29.16*FPS)} durationInFrames={Math.round((33.4-29.16)*FPS)}><QuestionScene/></Sequence>
 <Sequence from={Math.round(33.4*FPS)} durationInFrames={Math.round((41.65-33.4)*FPS)}><ChoiceScene/></Sequence>
 {S.map(x=><Clip key={x.n} {...x}/>)}
 <Sequence from={Math.round(26.70*FPS)} durationInFrames={Math.round((29.13-26.70)*FPS)}><RejectionScene/></Sequence>
 <Sequence from={Math.round(47.80*FPS)} durationInFrames={Math.round((49.82-47.80)*FPS)}><RecognitionScene/></Sequence>
 <Sequence from={Math.round(53.10*FPS)} durationInFrames={Math.round((55.22-53.10)*FPS)}><FitScene/></Sequence>
 <Sequence from={1505} durationInFrames={92}><MaskScene/></Sequence>
 <Sequence from={1756} durationInFrames={END_ORIGINAL-1756}><FinalScene/></Sequence>
 <Sequence from={0} durationInFrames={END_ORIGINAL}><Extra/><Captions/><Audio src={bed} volume={.085}/></Sequence>
 <AudioAccent start={7.7} file="whoosh.wav" volume={.20}/>
 <AudioAccent start={21.4} file="whoosh.wav" volume={.13}/>
 <AudioAccent start={33.4} file="whoosh.wav" volume={.16}/>
 <AudioAccent start={49.75} file="whoosh.wav" volume={.12}/>
 <AudioAccent start={56.2} file="whoosh.wav" volume={.13}/>
 <Sequence from={END_ORIGINAL} durationInFrames={CTA_FRAMES}>
 <OffthreadVideo src={cta} volume={1} style={{height:'100%',width:'100%',objectFit:'cover'}}/>
 </Sequence>
 </AbsoluteFill>;
};
