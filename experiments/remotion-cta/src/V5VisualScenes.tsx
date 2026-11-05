import React from 'react';
import {AbsoluteFill,Img,OffthreadVideo,Sequence,staticFile,useCurrentFrame} from 'remotion';
const clamp=(x:number)=>Math.min(1,Math.max(0,x)),ease=(x:number)=>1-(1-clamp(x))**3;
const enter=(t:number,start:number,d=.32)=>ease((t-start)/d);
const exit=(t:number,end:number,d=.24)=>ease((end-t)/d);
const FONT='V4Montserrat,Montserrat,Arial,sans-serif',INK='#1E1E1E',DARK='#0E151C',GOLD='#FFD000',CYAN='#26F7FD';
const paperGrid='linear-gradient(#17202713 1px,transparent 1px),linear-gradient(90deg,#17202713 1px,transparent 1px)';
const GraphicFrame:React.FC<{dark?:boolean;children:React.ReactNode}>=({dark=false,children})=><AbsoluteFill style={{overflow:'hidden',backgroundColor:dark?'#0A1119':'#F0EEE8',
 backgroundImage:dark?'linear-gradient(#F6A84316 1px,transparent 1px),linear-gradient(90deg,#F6A84316 1px,transparent 1px),radial-gradient(ellipse at 62% 40%,#26313A 0%,#0A1119 74%)':paperGrid,
 backgroundSize:dark?'105px 105px,105px 105px,100% 100%':'98px 98px'}}>
 {children}
 </AbsoluteFill>;
const FineLabel:React.FC<{text:string,dark?:boolean}>=({text,dark=false})=><div style={{position:'absolute',left:70,right:70,top:160,textAlign:'center',
 fontFamily:FONT,fontSize:42,fontWeight:700,letterSpacing:4.2,color:dark?'#F2C28C':INK,opacity:.82}}>{text}</div>;
const ThinBar:React.FC<{top:number;color?:string}>=({top,color='#BF843B'})=><div style={{position:'absolute',top,left:390,width:300,height:4,background:color,borderRadius:5,opacity:.85}}/>;
const IconCircle:React.FC<{kind:'check'|'mute'|'arrows';top:number;left:number;visible:number}>=({kind,top,left,visible})=><svg width="150" height="150" viewBox="0 0 150 150" style={{position:'absolute',top,left,opacity:visible,transform:`scale(${.88+.12*visible})`}}>
 <circle cx="75" cy="75" r="65" fill="#15232F" stroke="#D5A46D" strokeWidth="7"/>
 {kind==='check'?<path d="M38 76 L61 99 L111 45" fill="none" stroke="#158C7A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="14"/>:
  kind==='mute'?<><path d="M42 43 L107 107" stroke="#C96B41" strokeWidth="13" strokeLinecap="round"/><path d="M49 81 H67 L90 58 V96 L72 83" fill="none" stroke="#F0E5D6" strokeWidth="7"/></>:
  <path d="M38 55 H103 M38 81 H103 M79 41 L108 55 L79 69 M79 67 L108 81 L79 95" fill="none" stroke="#A87941" strokeWidth="10" strokeLinecap="round"/>}
 </svg>;
const RulesBoard:React.FC<{t:number}>=({t})=>{
 const cards=[{time:8.6,icon:'check' as const,text:'PORTARTE BIEN',color:'#A86D35'},{time:9.42,icon:'mute' as const,text:'NO MOLESTAR',color:'#D17D4B'},{time:11.3,icon:'arrows' as const,text:'CUMPLIR LO ESPERADO',color:'#688583'}];
 return <GraphicFrame dark><FineLabel text="LO QUE APRENDISTE" dark/><ThinBar top={240}/>
 {cards.map((c,i)=>{
  const opacity=enter(t,c.time)*exit(t,12.5);
  return <React.Fragment key={i}>
   <div style={{position:'absolute',top:995+i*180,left:82,width:920,height:155,border:'2px solid #D5A46D66',borderRadius:23,
     background:'linear-gradient(105deg,rgba(28,42,53,.98),rgba(16,28,38,.96))',boxShadow:'0 16px 32px #00000055',transform:`translateY(${(1-opacity)*24}px)`,opacity}}/>
   <IconCircle kind={c.icon} left={126} top={997+i*180} visible={opacity}/>
   <div style={{position:'absolute',top:1040+i*180,left:330,width:625,fontSize:i===2?48:59,letterSpacing:i===2?-1.8:-1.6,fontWeight:900,fontFamily:FONT,color:'#F2ECE4',opacity,
   transform:`translateX(${(1-opacity)*30}px)`}}>{c.text}</div>
  </React.Fragment>;
 })}
 </GraphicFrame>;
};
const ChoiceBoard:React.FC<{t:number}>=({t})=>{
 const q=enter(t,33.5),a=enter(t,38.4),fear=enter(t,40.0);
 return <GraphicFrame dark><FineLabel text="EL ORIGEN DE TUS DECISIONES" dark/><ThinBar top={240}/>
 <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position:'absolute',left:0,top:0}}>
  <path d="M540 1020 V1170 M540 1170 C540 1290 300 1290 300 1390 M540 1170 C540 1290 780 1290 780 1390" fill="none" stroke="#D5B48E" strokeLinecap="round" strokeWidth="10" opacity={q}/>
  <circle cx="540" cy="1005" r="65" fill="#162530" stroke="#A97947" strokeWidth="9" opacity={q}/>
  <circle cx="300" cy="1495" r="150" fill="#142B36" stroke={CYAN} strokeWidth="13" opacity={a}/>
  <circle cx="780" cy="1495" r="150" fill="#2B251C" stroke={GOLD} strokeWidth="13" opacity={fear}/>
  <path d="M300 1535 C220 1478 227 1416 273 1423 C290 1425 300 1443 300 1443 C300 1443 319 1416 339 1423 C378 1453 354 1505 300 1535Z" fill="#26F7FD" opacity={a}/>
  <path d="M780 1400 L850 1495 L780 1590 L710 1495 Z" stroke="#D6A035" strokeWidth="10" fill="none" opacity={fear}/>
  <path d="M788 1436 L756 1490 L806 1515 L772 1560" stroke="#BD762C" strokeWidth="10" fill="none" opacity={fear}/>
 </svg>
 <div style={{position:'absolute',top:1770,left:110,right:110,textAlign:'center',fontFamily:FONT,fontWeight:700,fontSize:37,color:'#E1C4A4',opacity:enter(t,38.0)}}>UNA ELECCIÓN PUEDE NACER DE DOS LUGARES</div>
 </GraphicFrame>;
};
const IdentityBoard:React.FC<{t:number}>=({t})=>{
 const mirror=enter(t,46.35),fracture=enter(t,50.7),piece=enter(t,53.5);
 return <GraphicFrame dark><FineLabel text="VOLVER A RECONOCERTE" dark/><ThinBar top={240} color="#E0AE7F"/>
 <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position:'absolute',left:0,top:0}}>
  <rect x="285" y="970" width="510" height="670" rx="185" fill="#243B44D0" stroke="#759493" strokeWidth="13" opacity={mirror}/>
  <path d="M540 1130 C474 1130 444 1205 459 1260 L489 1300 L487 1390 L389 1470 L691 1470 L593 1390 L591 1300 L621 1260 C635 1202 605 1130 540 1130Z" fill="#72969E" opacity={mirror}/>
  <path d="M512 975 L565 1185 L503 1350 L578 1510 L520 1630" fill="none" stroke="#FFFFFF" strokeWidth="19" opacity={fracture}/>
  <path d="M515 975 L569 1185 L502 1350 L583 1510 L521 1630" fill="none" stroke={GOLD} strokeWidth="5" strokeDasharray="21 13" opacity={fracture}/>
  <path d="M807 1110 H944 V1230 H883 C854 1193 818 1240 857 1265 H944 V1380 H807 V1310 C755 1275 754 1195 807 1160 Z" fill="#F1D1A5" stroke="#D7A052" strokeWidth="10" opacity={piece} transform={`translate(${(1-piece)*155} 0)`}/>
 </svg>
 <div style={{position:'absolute',left:188,top:1695,width:704,textAlign:'center',fontSize:35,color:'#E6B47E',fontFamily:FONT,opacity:piece}}>NO TODO LO QUE PERDISTE ESTÁ FUERA DE TI</div>
 </GraphicFrame>;
};
const CtaBoard:React.FC<{t:number}>=({t})=>{
 const start=63.333333,delta=t-start,reveal=enter(t,start+.2),logoEnd=enter(t,70.18);
 return <GraphicFrame dark><AbsoluteFill style={{background:'radial-gradient(ellipse at 50% 28%,#D7833523,transparent 48%)'}}/>
 <div style={{position:'absolute',left:50,right:50,top:172,textAlign:'center',fontSize:35,fontFamily:FONT,letterSpacing:6,color:'#E6B687',opacity:reveal}}>SUES HOLISTICS</div>
 <Img src={staticFile('v4/sues-logo-transparent.png')} style={{position:'absolute',left:375,top:235,width:330,height:330,
  objectFit:'contain',opacity:reveal,transform:`scale(${.92+.08*reveal})`,filter:'drop-shadow(0 0 16px #F99B3B22)',mixBlendMode:'screen'}}/>
 <div style={{position:'absolute',top:1400,left:155,right:155,height:2,background:'#E7AE71A0',opacity:reveal}}/>
 <div style={{position:'absolute',top:1445,left:130,right:130,textAlign:'center',fontFamily:FONT,color:'#D6AC81',letterSpacing:2.2,fontSize:36,opacity:reveal}}>PRESENCIA · TRANSFORMACIÓN · LIBERTAD</div>
 {t>70.18?<div style={{position:'absolute',top:1160,left:100,right:100,fontFamily:FONT,fontWeight:900,color:'#FFFFFF',fontSize:110,letterSpacing:1.6,textAlign:'center',
  opacity:logoEnd,transform:`translateY(${18*(1-logoEnd)}px)`,textShadow:'0 0 25px #D9793F66'}}>SÍGUEME</div>:null}
 {Array.from({length:11},(_,i)=><div key={i} style={{position:'absolute',left:(50+i*73)%1050,top:350+((i*113)%1150),
  width:5,height:5,borderRadius:'50%',background:'#FFB66D',
  opacity:.05+.34*(.5+.5*Math.cos(t*2.5+i*.9))}}/>)}
 </GraphicFrame>;
};

const Signal:React.FC<{t:number;at:number;end:number;x:number;y:number;kind:'split'|'shield'|'heart'|'path'|'spark'|'rings'}>=({t,at,end,x,y,kind})=>{
 const visibility=enter(t,at)*exit(t,end),s=.9+.1*visibility;
 if(visibility<=0)return null;
 return <svg width="260" height="260" viewBox="0 0 260 260" style={{position:'absolute',left:x-130,top:y-130,opacity:visibility,transform:`scale(${s})`,filter:'drop-shadow(0 12px 25px #0007)'}}>
  <circle cx="130" cy="130" r="103" fill="#101820BB" stroke="#E6A750" strokeWidth="7" opacity=".88"/>
  {kind==='split'?<><path d="M92 65 L151 118 L116 158 L167 195" stroke={GOLD} strokeWidth="13" fill="none"/><path d="M62 79 L97 116 M164 58 L151 90 M185 155 L166 173" stroke="#FFFFFF" strokeWidth="6"/></>:
   kind==='shield'?<><path d="M130 45 L191 72 V129 Q190 174 130 214 Q70 174 69 129 V72Z" stroke={CYAN} strokeWidth="12" fill="none"/><path d="M99 129 L120 149 L162 102" fill="none" stroke="#FFF" strokeWidth="12" strokeLinecap="round"/></>:
   kind==='heart'?<><path d="M130 197 C82 169 54 126 72 89 C91 56 121 85 130 103 C148 67 180 57 193 90 C218 131 165 181 130 197Z" stroke={GOLD} strokeWidth="11" fill="none"/><path d="M132 95 L117 135 L146 156 L130 194" stroke="#FFF" strokeWidth="7"/></>:
   kind==='path'?<><path d="M63 191 Q103 163 91 129 Q75 85 150 87 Q190 90 191 65" fill="none" stroke={CYAN} strokeWidth="13" strokeDasharray="19 12" strokeLinecap="round"/><path d="M161 63 L192 48 L205 84" stroke={CYAN} fill="none" strokeWidth="11" strokeLinejoin="round"/></>:
   kind==='rings'?<><circle cx="130" cy="130" r="71" fill="none" stroke={CYAN} strokeWidth="10"/><circle cx="130" cy="130" r="40" fill="none" stroke={GOLD} strokeWidth="9"/><circle cx="130" cy="130" r="12" fill="#FFF"/></>:
   <><path d="M130 48 V75 M130 186 V215 M48 130 H75 M186 130 H215 M72 72 L94 94 M166 166 L188 188" stroke={GOLD} strokeWidth="11" strokeLinecap="round"/><circle cx="130" cy="130" r="38" stroke="#FFF" strokeWidth="10" fill="none"/></>}
 </svg>;
};
const BrollWindow:React.FC<{src:string;start:number;end:number;x:number;y:number}>=({src,start,end,x,y})=>{
 const local=useCurrentFrame(),time=local/30,opacity=enter(time,start)*exit(time,end);
 if(time<start||time>=end)return null;
 return <div style={{position:'absolute',left:x,top:y,width:360,height:300,opacity,overflow:'hidden',
  WebkitMaskImage:'radial-gradient(ellipse 58% 50% at 50% 50%,#000 26%,#000C 54%,transparent 100%)',
  maskImage:'radial-gradient(ellipse 58% 50% at 50% 50%,#000 26%,#000C 54%,transparent 100%)'}}>
  <Sequence from={Math.floor(start*30)} durationInFrames={Math.ceil((end-start)*30)}>
   <OffthreadVideo src={staticFile('full/'+src)} muted startFrom={0} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
  </Sequence>
 </div>;
};
const SpeakerVisuals:React.FC<{t:number}>=({t})=><AbsoluteFill style={{pointerEvents:'none'}}>
 <Signal t={t} at={1.3} end={3.25} x={850} y={975} kind="split"/>
 <Signal t={t} at={4.9} end={7.45} x={210} y={960} kind="spark"/>
 <Signal t={t} at={12.6} end={16.2} x={815} y={975} kind="rings"/>
 <Signal t={t} at={17.8} end={20.5} x={840} y={975} kind="shield"/>
 <Signal t={t} at={23.5} end={26} x={235} y={975} kind="shield"/>
 <Signal t={t} at={26.25} end={28.5} x={835} y={995} kind="heart"/>
 <Signal t={t} at={29.95} end={33.32} x={235} y={985} kind="split"/>
 <Signal t={t} at={41.55} end={45.95} x={815} y={995} kind="rings"/>
 <Signal t={t} at={54.9} end={58.5} x={210} y={975} kind="path"/>
 <Signal t={t} at={58.7} end={63.25} x={840} y={980} kind="shield"/>
 <BrollWindow src="r1-chain.mp4" start={21.1} end={22.9} x={710} y={900}/>
 <BrollWindow src="r3-sun.mp4" start={41.7} end={43.45} x={70} y={920}/>
 <BrollWindow src="r4-path.mp4" start={55.4} end={57.3} x={700} y={900}/>
 </AbsoluteFill>;
export const V5SceneLayer:React.FC=()=>{
 const f=useCurrentFrame(),t=f/30;
 if(t>=63.333333)return <CtaBoard t={t}/>;
 if(t>=7.7&&t<12.55)return <RulesBoard t={t}/>;
 if(t>=33.4&&t<41.25)return <ChoiceBoard t={t}/>;
 if(t>=46.0&&t<54.15)return <IdentityBoard t={t}/>;
 return <SpeakerVisuals t={t}/>;
};
