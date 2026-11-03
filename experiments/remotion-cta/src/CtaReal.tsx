import React from 'react';
import {AbsoluteFill,Audio,Img,OffthreadVideo,Sequence,interpolate,staticFile,useCurrentFrame} from 'remotion';
export const REAL_FPS=30;
export const REAL_FRAMES=390;
const T1=125,T2=269,T3=329;
const WHITE='#F7F2EA',GOLD='#E8BD81',INK='#111319';
const SANS='SuesMontserrat,Montserrat,Arial,sans-serif',SERIF='SuesPlayfair,Georgia,serif';
const scale=(f:number,a:number,b:number)=>interpolate(f,[a,b],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const fade=(f:number,n:number)=>Math.min(scale(f,0,8),1-scale(f,n-8,n));
const bg=(n:string)=>staticFile('backgrounds/'+n),asset=(n:string)=>staticFile('assets/'+n);
type RealProps={hasNewVoice:boolean};
const Intro:React.FC=()=>{
 const f=useCurrentFrame(),caption=f<45?['Soy Carlos,']:f<72?['facilitador de']:f<86?['procesos de']:['transformación','profunda'],hero=f>=86;
 return <AbsoluteFill style={{background:INK,opacity:fade(f,T1)}}>
 <OffthreadVideo src={asset('carlos-cta-real.mp4')} volume={1} style={{height:'100%',width:'100%',objectFit:'cover'}}/>
 <div style={{position:'absolute',top:1120,left:0,right:0,height:330,background:'linear-gradient(transparent,rgba(5,7,9,.32),transparent)'}}/>
 <div style={{position:'absolute',top:1170,left:65,right:65,height:280,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:SANS,fontSize:hero?91:79,fontWeight:hero?800:700,lineHeight:1.1,letterSpacing:-2,textAlign:'center',textShadow:'0 5px 22px #000C'}}>
  {caption.map((x,i)=><div key={i} style={{color:hero&&i===1?GOLD:WHITE}}>{x}</div>)}
 </div></AbsoluteFill>;
};
const Om:React.FC<{f:number}>=({f})=><div style={{position:'absolute',left:118,top:272,opacity:scale(f,13,25),filter:'drop-shadow(0 4px 10px #0005)'}}>
 <svg width="160" height="160" viewBox="0 0 24 24"><path fill={GOLD} d="m15 2-1.5 1.5L15 5l1.5-1.5zm-4 1c-1 6 6 7 9 3l-2-1.5C17 6 13 8 11 3M9 7C7 7 4.5 8.5 4.5 8.5L6 11c1-1 3-1.5 4-1c2 1-1 3-3 2v3.5c3-1.5 5 .5 4 2C8 22 3 16 3 13c-2 6 3 9 6 9s5-2 3.5-7H14c-1.5 4.5 4 9 7 3c1-2 1-8.5-4-8.5c-4 0-3 5.5-6.5 4C14 10 12 7 9 7m10 5c3 3-4 9-4 3c0-2 2-4.5 4-3"/></svg></div>;
const Galaxy:React.FC<{f:number}>=({f})=><div style={{position:'absolute',top:298,right:126,opacity:scale(f,99,118),transform:'rotate('+(f*.17)+'deg)'}}>
<svg width="175" height="175" viewBox="0 0 175 175"><defs><radialGradient id="cosmos"><stop stopColor="#FFF5DC"/><stop offset=".24" stopColor="#DBB696"/><stop offset=".65" stopColor="#95819E" stopOpacity=".72"/><stop offset="1" stopColor="#87728D" stopOpacity="0"/></radialGradient></defs>
<circle cx="88" cy="88" r="59" fill="url(#cosmos)" opacity=".75"/>
{[0,1,2,3].map(k=><ellipse key={k} cx="88" cy="88" rx={36+k*16} ry={13+k*7} transform={'rotate('+(k*7-24)+' 88 88)'} stroke={k%2?'#BFA0CD':'#EDD0AC'} strokeWidth="1.8" strokeOpacity=".7" fill="none"/>)}
{Array.from({length:62},(_,i)=>{const r=8+Math.sqrt(i/62)*75,a=i*2.4;return <circle key={i} cx={88+Math.cos(a)*r} cy={88+Math.sin(a)*r*.62} r={i%9===0?2.1:.8} fill={i%3?'#DED0D4':'#FFF1CB'}/>;})}</svg></div>;
const LINES=[
 {text:'SI QUIERES',start:9,frames:25,size:72,font:SANS,weight:700,color:WHITE},
 {text:'DESARROLLAR',start:38,frames:36,size:92,font:SANS,weight:800,color:GOLD},
 {text:'TU NIVEL DE',start:77,frames:26,size:83,font:SERIF,weight:700,color:WHITE},
 {text:'CONCIENCIA',start:107,frames:33,size:105,font:SANS,weight:800,color:GOLD},
];
const TextScene:React.FC=()=>{
 const f=useCurrentFrame();
 return <AbsoluteFill style={{background:INK,opacity:fade(f,T2-T1)}}>
 <Img src={bg('tapiz-01-cuadricula-antracita-ambar.webp')} style={{position:'absolute',height:'102%',width:'102%',left:'-1%',top:'-1%',objectFit:'cover',transform:'scale('+interpolate(f,[0,144],[1,1.025])+')'}}/>
 <div style={{position:'absolute',inset:0,background:'linear-gradient(90deg,#05060919,#0000,#05060919)'}}/>
 <Om f={f}/><Galaxy f={f}/>
 <div style={{position:'absolute',left:40,right:40,top:680,display:'flex',flexDirection:'column',alignItems:'center',gap:14}}>
 {LINES.map((line,i)=>{
  const n=Math.max(0,Math.min(line.text.length,Math.floor((f-line.start)*line.text.length/line.frames))),active=f>=line.start&&f<=line.start+line.frames;
  return <div key={i} style={{height:line.size*1.23,display:'flex',alignItems:'center',opacity:f>=line.start?1:0,
   color:line.color,fontFamily:line.font,fontStyle:line.font===SERIF?'italic':'normal',fontSize:line.size,fontWeight:line.weight,
   letterSpacing:-1.7,whiteSpace:'nowrap',textShadow:'0 4px 18px #0009'}}>
   {line.text.slice(0,n)}{active&&f%12<7?<span style={{color:'#F9E8D0'}}>|</span>:null}</div>;
 })}
 </div>
 </AbsoluteFill>;
};
const Insta:React.FC=()=><div style={{width:190,height:190,borderRadius:49,background:'linear-gradient(30deg,#FAC444,#F23C6C 46%,#9638BF 78%,#405AC9)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 20px 60px #0008'}}>
 <svg viewBox="0 0 100 100" width="148" height="148"><rect x="12" y="12" width="76" height="76" rx="22" stroke="white" strokeWidth="8" fill="none"/><circle cx="50" cy="50" r="19" stroke="white" strokeWidth="8" fill="none"/><circle cx="74" cy="28" r="6" fill="white"/></svg>
 </div>;
const Hand:React.FC<{tap:boolean}>=({tap})=><svg width="149" height="184" viewBox="0 0 122 150" style={{filter:'drop-shadow(0 6px 12px #0009)',transform:tap?'scale(.96)':'scale(1)'}}><path d="M45 143 C25 136 12 116 15 99 C17 87 26 81 35 86 L46 99 L46 38 C46 25 64 23 68 38 L68 80 C76 72 89 78 91 87 C101 85 108 92 107 102 C116 100 120 110 116 123 C112 140 97 149 79 149 Z" fill="#EBD1B2" stroke="#4E3832" strokeWidth="3"/><path d="M69 85 L68 106 M92 91 L88 111 M107 102 L101 117" stroke="#AE8D76" strokeWidth="3" fill="none"/></svg>;
const Follow:React.FC=()=>{
 const f=useCurrentFrame(),tap=f>=39,m=scale(f,10,36);
 return <AbsoluteFill style={{background:INK,opacity:fade(f,T3-T2)}}>
 <Img src={bg('tapiz-02-perspectiva-ambar.webp')} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
 <div style={{position:'absolute',inset:0,background:'linear-gradient(#07080924,#0005)'}}/>
 <div style={{position:'absolute',top:460,left:0,right:0,display:'flex',flexDirection:'column',alignItems:'center',gap:56}}>
 <Insta/><div style={{fontFamily:SANS,fontSize:67,color:WHITE,fontWeight:800}}>SUES HOLISTICS</div>
 <div style={{fontFamily:SERIF,fontStyle:'italic',fontSize:53,color:GOLD}}>@suesholistics</div>
 <div style={{marginTop:25,borderRadius:27,width:478,height:132,background:'#F8F4ED',color:'#242528',textAlign:'center',fontFamily:SANS,fontSize:66,fontWeight:800,lineHeight:'132px',boxShadow:'0 9px 32px #0008'}}>{tap?'✓ SIGUIENDO':'+ SEGUIR'}</div>
 </div>
 <div style={{position:'absolute',left:696-150*m,top:1355-285*m}}><Hand tap={tap}/></div>
 </AbsoluteFill>;
};
const Brand:React.FC=()=>{
 const f=useCurrentFrame();
 return <AbsoluteFill style={{background:'#000',opacity:scale(f,0,10)}}>
 <Img src={asset('sues-logo-original.png')} style={{height:'100%',width:'100%',objectFit:'cover',transform:'scale('+interpolate(f,[0,61],[.965,1.01])+')'}}/>
 <div style={{position:'absolute',top:1545,width:'100%',textAlign:'center',fontFamily:SERIF,fontStyle:'italic',fontSize:63,color:'#EAD1B0',opacity:scale(f,12,28),textShadow:'0 6px 18px #0009'}}>Vuelve a ti</div>
 </AbsoluteFill>;
};
export const CtaReal:React.FC<RealProps>=({hasNewVoice})=>{
 const f1=staticFile('fonts/Montserrat-Bold.ttf'),f2=staticFile('fonts/Montserrat-ExtraBold.ttf'),f3=staticFile('fonts/PlayfairDisplay-Italic.ttf');
 const css='@font-face{font-family:SuesMontserrat;src:url("'+f1+'");font-weight:700}@font-face{font-family:SuesMontserrat;src:url("'+f2+'");font-weight:800}@font-face{font-family:SuesPlayfair;src:url("'+f3+'");font-weight:100 900;font-style:italic}';
 return <AbsoluteFill style={{background:INK}}>
 <style>{css}</style>
 <Sequence from={0} durationInFrames={T1}><Intro/></Sequence>
 <Sequence from={T1} durationInFrames={T2-T1}><TextScene/></Sequence>
 <Sequence from={T2} durationInFrames={T3-T2}><Follow/></Sequence>
 <Sequence from={T3} durationInFrames={REAL_FRAMES-T3}><Brand/></Sequence>
 <Audio src={asset('cta-real-sfx.wav')} volume={0.48}/>
 {hasNewVoice?<Sequence from={T1}><Audio src={asset('cta-new-voice.wav')} volume={1}/></Sequence>:null}
 </AbsoluteFill>;
};
