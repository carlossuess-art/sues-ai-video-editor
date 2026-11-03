import React from 'react';
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import plan from './plan.json';

export type CtaAssets = {
  useCarlosCutout: boolean;
  useNeuralVideo: boolean;
  useOmImage: boolean;
  useGalaxyImage: boolean;
  useInstagramScreenshot: boolean;
  useLogo: boolean;
  useVoice: boolean;
};

const GOLD = '#DEB477';
const INK = '#081017';
const FONT = 'SuesMontserrat, Montserrat, Arial, sans-serif';
const asset = (key: keyof typeof plan.assets) => staticFile(plan.assets[key]);
const fade = (frame: number, duration: number) => interpolate(frame, [0, 8, duration - 8, duration], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

const NeuralBackdrop: React.FC<{frame: number}> = ({frame}) => {
  const nodes = Array.from({length: 25}, (_, n) => ({
    x: 95 + (n % 5) * 218 + Math.sin(n * 2.8) * 64,
    y: 130 + Math.floor(n / 5) * 173 + Math.cos(n * 4.1) * 67,
  }));
  return (
    <div style={{position: 'absolute', inset: 0, height: '53%', overflow: 'hidden',
      WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 60%, transparent 100%)',
      maskImage: 'linear-gradient(to bottom, black 0%, black 60%, transparent 100%)'}}>
      <svg width="1080" height="1050" viewBox="0 0 1080 1050">
        <defs><filter id="neuralGlow"><feGaussianBlur stdDeviation="7"/></filter></defs>
        {nodes.map((n, i) => nodes.slice(i + 1).map((m, k) => {
          const distance = Math.hypot(n.x - m.x, n.y - m.y);
          return distance < 280 ? <line key={i + ':' + k} x1={n.x} y1={n.y} x2={m.x} y2={m.y} stroke="#AE8C69" strokeOpacity={0.19} strokeWidth="1.5"/> : null;
        }))}
        {nodes.map((n, i) => <circle key={i} cx={n.x} cy={n.y} r={4.2} fill={i % 3 === 0 ? GOLD : '#8A9FA8'} opacity=".82"/>)}
        {[0, 1, 2, 3, 4].map((i) => {
          const k = (frame * (0.013 + i * 0.004) + i / 5) % 1;
          const a = nodes[(i * 4) % nodes.length];
          const b = nodes[(i * 4 + 1) % nodes.length];
          const x = a.x + (b.x - a.x) * k, y = a.y + (b.y - a.y) * k;
          return <g key={i}><circle cx={x} cy={y} r="15" fill="#EFCA93" opacity=".7" filter="url(#neuralGlow)"/><circle cx={x} cy={y} r="3.5" fill="#FFF3D4"/></g>;
        })}
      </svg>
    </div>
  );
};

const Intro: React.FC<{options: CtaAssets}> = ({options}) => {
  const frame = useCurrentFrame();
  const captions = frame < 54 ? ['Soy Carlos,', 'facilitador de'] : frame < 92 ? ['procesos de'] : ['transformación', 'profunda'];
  const large = frame >= 92;
  return <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 16%, #1B2530, #080F16 65%)', color: '#F5EEE3', fontFamily: FONT, opacity: fade(frame, plan.scenes.intro.duration)}}>
    {options.useNeuralVideo
      ? <div style={{position:'absolute',top:0,left:0,right:0,height:'54%',overflow:'hidden',WebkitMaskImage:'linear-gradient(black 50%,transparent)'}}>
          <OffthreadVideo src={asset('neuralVideo')} muted style={{width:'100%',height:'100%',objectFit:'cover'}}/>
        </div>
      : <NeuralBackdrop frame={frame}/>}
    {options.useCarlosCutout
      ? <OffthreadVideo src={asset('carlosCutout')} muted style={{position:'absolute',width:'100%',height:'82%',bottom:0,objectFit:'contain',objectPosition:'center bottom'}}/>
      : <div style={{position:'absolute',top:710,left:100,right:100,height:590,display:'flex',justifyContent:'center',alignItems:'center',border:'1px dashed #745F4E',borderRadius:32,color:'#D2C3B2',fontSize:32,letterSpacing:1,textAlign:'center',lineHeight:1.5}}>
          ESPACIO PARA EL VÍDEO REAL DE CARLOS
        </div>}
    <div style={{position:'absolute',top:1440,left:65,right:65,textAlign:'center',fontSize:large ? 91 : 61,fontWeight:large ? 800 : 700,lineHeight:1.17,letterSpacing:large ? -2.3 : -0.4,
      textShadow:'0 5px 20px rgba(0,0,0,.85)',textTransform:'none'}}>
      {captions.map((t,i)=><div key={i}>{t}</div>)}
    </div>
  </AbsoluteFill>;
};

const OmGraphic: React.FC<{frame: number;useImage: boolean}> = ({frame, useImage}) => {
  const scale = 1 + Math.sin(frame * .105) * .045;
  return <div style={{position:'absolute',top:237,left:112,width:168,height:168,opacity:Math.min(1,frame/14),transform:`scale(${scale})`,filter:'drop-shadow(0 5px 20px rgba(194,148,91,.17))'}}>
    {useImage ? <Img src={asset('omImage')} style={{width:'100%',height:'100%',objectFit:'contain'}}/> :
      <div style={{fontFamily:'serif',fontSize:138,color:GOLD,lineHeight:1,textAlign:'center'}}>ॐ</div>}
  </div>;
};

const Galaxy: React.FC<{frame: number;useImage: boolean}> = ({frame,useImage}) => {
  const opacity = interpolate(frame,[64,83],[0,.9],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  return <div style={{position:'absolute',top:233,right:92,width:244,height:244,opacity,transform:`rotate(${frame*.095}deg)`}}>
    {useImage ? <Img src={asset('galaxyImage')} style={{width:'100%',height:'100%',objectFit:'contain'}}/> :
      <svg viewBox="0 0 244 244" width="244" height="244">
        <defs><radialGradient id="galaxyCore"><stop stopColor="#FFF2D2"/><stop offset=".35" stopColor="#D6AA8B"/><stop offset="1" stopColor="#7B7894" stopOpacity="0"/></radialGradient></defs>
        {Array.from({length:4},(_,k)=><ellipse key={k} cx="122" cy="122" rx={35+k*23} ry={12+k*12} transform={`rotate(${-27+k*13} 122 122)`} fill="none" stroke={k%2?'#B3A3BD':'#D0B3A1'} strokeWidth="2.4" opacity={.52-k*.09}/>)}
        {Array.from({length:70},(_,i)=>{
          const theta=i*2.399, r=13+Math.sqrt(i/70)*100;
          const x=122+Math.cos(theta)*r, y=122+Math.sin(theta)*r*.6;
          return <circle key={i} cx={x} cy={y} r={i%8===0?2.2:0.95} fill={i%3===0?'#E9CFAC':'#ABB1CF'} opacity={.4+(i%5)*.09}/>;
        })}
        <circle cx="122" cy="122" r="37" fill="url(#galaxyCore)"/>
      </svg>}
  </div>;
};

const TypedLine: React.FC<{line: typeof plan.typingLines[number];frame: number}> = ({line,frame}) => {
  const count = Math.max(0,Math.min(line.text.length,Math.floor((frame-line.start)*line.text.length/line.duration)));
  const active = frame >= line.start && frame <= line.start+line.duration;
  const appear = frame >= line.start;
  return <div style={{height:line.fontSize*1.25,display:'flex',alignItems:'center',justifyContent:'center',fontSize:line.fontSize,fontWeight:line.weight,color:line.color,whiteSpace:'nowrap',letterSpacing:-1.8,lineHeight:1.05,opacity:appear?1:0}}>
    <span>{line.text.slice(0,count)}<span style={{opacity:active && frame%12<8?1:0,color:'#F2D2A0',marginLeft:4,fontWeight:400}}>|</span></span>
  </div>;
};

const Typewriter: React.FC<{options:CtaAssets}> = ({options}) => {
  const frame=useCurrentFrame();
  return <AbsoluteFill style={{background:INK,color:'#F3E9DE',fontFamily:FONT,opacity:fade(frame,plan.scenes.typewriter.duration)}}>
    <AbsoluteFill style={{backgroundImage:'linear-gradient(rgba(208,181,149,.095) 1px,transparent 1px),linear-gradient(90deg,rgba(208,181,149,.095) 1px,transparent 1px)',backgroundSize:'70px 70px',maskImage:'radial-gradient(ellipse at 50% 42%,black 20%,transparent 85%)'}}/>
    <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 50% 50%,rgba(97,78,64,.15),transparent 65%)'}}/>
    <OmGraphic frame={frame} useImage={options.useOmImage}/>
    <Galaxy frame={frame} useImage={options.useGalaxyImage}/>
    <div style={{position:'absolute',top:690,left:52,right:52,display:'flex',flexDirection:'column',alignItems:'center',gap:12,textShadow:'0 3px 13px rgba(0,0,0,.4)'}}>
      {plan.typingLines.map((line,i)=><TypedLine key={i} frame={frame} line={line}/>)}
    </div>
  </AbsoluteFill>;
};

const Hand: React.FC<{t:number}> = ({t}) => <svg width="122" height="150" viewBox="0 0 122 150" style={{transform:`scale(${1-t*.07})`}}>
  <path d="M45 143 C25 136 12 116 15 99 C17 87 26 81 35 86 L46 99 L46 38 C46 25 64 23 68 38 L68 80 C76 72 89 78 91 87 C101 85 108 92 107 102 C116 100 120 110 116 123 C112 140 97 149 79 149 Z" fill="#E7C6A6" stroke="#342B2B" strokeWidth="5"/>
  <path d="M69 85 L68 106 M92 91 L88 111 M107 102 L101 117" stroke="#AF8977" strokeWidth="3" fill="none"/>
</svg>;

const Instagram: React.FC<{options:CtaAssets}> = ({options}) => {
 const frame=useCurrentFrame();
 const progress=interpolate(frame,[9,plan.instagramClickLocalFrame],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
 const tap=frame>=plan.instagramClickLocalFrame;
 return <AbsoluteFill style={{background:'radial-gradient(circle at 50% 42%,#28323B,#0A1119 68%)',fontFamily:FONT,color:'#F8F3EA',opacity:fade(frame,plan.scenes.instagram.duration)}}>
   <div style={{position:'absolute',top:185,left:82,right:82,fontSize:65,fontWeight:800,textAlign:'center'}}>SÍGUEME</div>
   <div style={{position:'absolute',top:390,left:143,width:794,height:1014,borderRadius:53,background:'#F8F8F8',color:'#212121',overflow:'hidden',boxShadow:'0 25px 100px rgba(0,0,0,.46)',border:'11px solid #D8CDC2'}}>
      {options.useInstagramScreenshot ? <Img src={asset('instagramScreenshot')} style={{position:'absolute',width:'100%',height:'100%',objectFit:'contain',background:'white'}}/> :
       <>
        <div style={{padding:'49px 50px 25px',fontSize:38,fontWeight:800}}>Instagram</div>
        <div style={{height:2,background:'#E8E8E8'}}/>
        <div style={{display:'flex',gap:30,padding:'60px 45px'}}>
          <div style={{width:146,height:146,borderRadius:'50%',background:'linear-gradient(135deg,#E7C9A6,#8B6D56)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:28}}>SUES</div>
          <div style={{flex:1}}><div style={{fontSize:39,fontWeight:800}}>@suesholistics</div><div style={{fontSize:23,marginTop:15}}>Sues Holistics</div></div>
        </div>
        <div style={{padding:'0 49px',fontSize:28,color:'#555'}}>Consciencia · transformación · presencia</div>
        <div style={{margin:'45px 49px',height:2,background:'#E5E5E5'}}/>
        <div style={{padding:'0 49px',fontSize:23,color:'#666'}}>MAQUETA DE PRUEBA · SUSTITUIR POR CAPTURA REAL</div>
       </>}
      <div style={{position:'absolute',top:430,left:370,width:300,height:82,borderRadius:18,background:tap?'#E4E6E8':'#1475DE',display:'flex',alignItems:'center',justifyContent:'center',fontSize:33,fontWeight:800,color:tap?'#25282A':'white',boxShadow:tap?'none':'0 4px 12px rgba(20,117,222,.25)'}}>
        {tap?'Siguiendo':'Seguir'}
      </div>
   </div>
   <div style={{position:'absolute',left:405+progress*355,top:1050-progress*270,filter:'drop-shadow(1px 7px 8px rgba(0,0,0,.5))'}}><Hand t={tap?1:0}/></div>
   <div style={{position:'absolute',bottom:210,width:'100%',textAlign:'center',fontSize:44,fontWeight:700,color:'#E3BC86'}}>Instagram · @suesholistics</div>
 </AbsoluteFill>;
};

const Brand: React.FC<{options:CtaAssets}> = ({options})=>{
 const frame=useCurrentFrame();
 const zoom=interpolate(frame,[0,20],[.91,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
 return <AbsoluteFill style={{background:'radial-gradient(circle at 50% 47%,#20242A,#090D11 67%)',fontFamily:FONT,color:'#F6EEE5',justifyContent:'center',alignItems:'center',opacity:interpolate(frame,[0,10],[0,1],{extrapolateRight:'clamp'})}}>
    <div style={{textAlign:'center',transform:`scale(${zoom})`}}>
      {options.useLogo ? <Img src={asset('logo')} style={{width:630,height:380,objectFit:'contain'}}/> :
      <div style={{fontSize:99,fontWeight:800,letterSpacing:-3}}>SUES <span style={{color:GOLD}}>HOLISTICS</span></div>}
      <div style={{marginTop:60,fontSize:64,letterSpacing:1.2,fontWeight:700}}>Vuelve a ti</div>
      <div style={{height:2,width:164,background:GOLD,margin:'33px auto 0',opacity:.75}}/>
    </div>
 </AbsoluteFill>;
};

export const CtaVideo: React.FC<CtaAssets> = (options) => (
 <AbsoluteFill style={{background:INK}}>
   <style>{`@font-face{font-family:SuesMontserrat;src:url("${staticFile('fonts/Montserrat-Bold.ttf')}") format('truetype');font-weight:700;font-style:normal}@font-face{font-family:SuesMontserrat;src:url("${staticFile('fonts/Montserrat-ExtraBold.ttf')}") format('truetype');font-weight:800;font-style:normal}`}</style>
   <Sequence from={plan.scenes.intro.start} durationInFrames={plan.scenes.intro.duration}><Intro options={options}/></Sequence>
   <Sequence from={plan.scenes.typewriter.start} durationInFrames={plan.scenes.typewriter.duration}><Typewriter options={options}/></Sequence>
   <Sequence from={plan.scenes.instagram.start} durationInFrames={plan.scenes.instagram.duration}><Instagram options={options}/></Sequence>
   <Sequence from={plan.scenes.brand.start} durationInFrames={plan.scenes.brand.duration}><Brand options={options}/></Sequence>
   <Audio src={asset('sfx')} volume={.65}/>
   {options.useVoice ? <Audio src={asset('voice')}/> : null}
 </AbsoluteFill>
);
