import {fitCaptionSize,textAdvance,typefaceTags} from './font-kits.js';
import {circlePath,LINE_ART,strokeDrawing} from './motion-drawings.js';

// User-selected recreation recipe. No claim to have recovered the source project,
// exact font identification, stock sticker, plugin or original keyframe values.
export function drawEditorialScenes(plan,event,safeText,assColor){
 for(const g of plan.graphics??[]){
  const start=g.start,end=g.end,d=end-start,ms=Math.round(d*1000),p=plan.policy.captions,dark='#1A1A1A',red='#FF0000',pink='#FF9999';
  const shape=(path,x,y,color,{layer=-3,at=start,extra='',stroke=0,alpha='00',blur=0,until=end}={})=>event(layer,at,until,'Outro',`{${extra.includes('\\move(')?'':`\\pos(${x},${y})`}\\an7\\p1\\bord0\\shad0\\1c${assColor(color)}&\\3c${assColor(color)}&\\1a&H${alpha}&\\3a&H${alpha}&\\blur${blur}\\fad(120,160)${extra}}${stroke?strokeDrawing(path,stroke*2):path}`);
  const label=(text,x,y,size,{at=start,role='normal',italic=false,color=dark,extra='',layer=-1,escape=true}={})=>event(layer,at,end,'Caption',`{${extra.includes('\\move(')?'':`\\pos(${x},${y})`}${typefaceTags(p,role,italic)}\\fs${size}\\fscx100\\fsp-2\\i${italic?1:0}\\b${role.startsWith('stamp')?0:role.startsWith('keyword')?800:700}\\bord0\\shad0\\1c${assColor(color)}&\\fad(120,160)${extra}}${escape?safeText(text):text}`);
  const icon=(name,x,y,at)=>{
   const path=LINE_ART[name];if(!path)return;
   shape(path,x,y,dark,{at,stroke:4.5,extra:`\\fscx115\\fscy115\\move(${x},${y+30},${x},${y},0,200)\\blur12\\t(0,200,\\blur0)`});
  };
  const reveal=(text,x,y,size,at,{role='normal',italic=false,color=dark}={})=>{
   const policy={...p,fontRole:role==='keyword'?italic?'keywordItalic':'keyword':italic?'italic':undefined,scaleX:100,tracking:-2},width=textAdvance(text,policy,size);
   let cursor=x-width/2;const delay=Math.min(.028,Math.max(.008,(end-at-.3)/Math.max(1,text.length)));
   for(const [i,char]of [...text].entries()){
    const w=textAdvance(char,policy,size),cx=cursor+w/2,t=at+i*delay;
    if(t>=end-.12)break;
    label(char,cx,y,size,{at:t,role,italic,color,extra:`\\fsp0\\move(${cx+30},${y},${cx},${y},0,220)\\blur10\\t(0,220,\\blur0)`});cursor+=w-2;
   }
  };
  if(g.type==='secret'){
   shape('m 0 0 l 1080 0 1080 1920 0 1920',0,0,'#000000',{layer:-8});
   // Original stamp geometry, drawn with real Anton. Not an imported sticker.
   const stampX=510,stampY=610,r=180,at=start+.06;
   for(const glow of [true,false]){
    for(const radius of [r,r-20])shape(circlePath(stampX,stampY,radius),0,0,red,{at,stroke:glow?9:4,alpha:glow?'90':'20',blur:glow?22:3,extra:'\\blur18\\t(0,240,\\blur2)'});
    label('TOP SECRET',stampX,stampY,120,{at,role:'stamp',color:glow?red:pink,layer:glow?-3:-1,extra:`\\fnAnton\\i0\\fsp0\\frz-8\\blur${glow?18:10}\\t(0,240,\\blur${glow?14:0})`});
   }
   for(const [i,char]of [...'CLASSIFIED'].entries()){
    const angle=(-153+i*14)*Math.PI/180,x=stampX+Math.cos(angle)*(r-47),y=stampY+Math.sin(angle)*(r-47);
    label(char,x,y,25,{at:start+.12,role:'stampRing',color:pink,extra:`\\fnAllerta Stencil\\frz${-(angle*180/Math.PI+90)}\\fsp0\\blur5\\t(0,220,\\blur0)`});
   }
   const lead=g.lead??'',title=g.text.toLocaleUpperCase('es').replace(/[,.;!?]+$/,'');
   if(lead)label(lead,510,900,100,{at:start+.16,role:'keyword',color:'#FFFFFF',extra:'\\blur8\\t(0,200,\\blur0)'});
   const size=fitCaptionSize(g.lines.map(s=>s.toLocaleUpperCase('es')),{...p,fontRole:'keywordItalic',fontSize:112},780),when=start+Math.min(.7,d*.22);
   const lines=g.lines.map(s=>s.toLocaleUpperCase('es').replace(/[,.;!?]+$/,''));
   lines.forEach((line,i)=>{
    const y=1060+(i-(lines.length-1)/2)*size*1.1;
    label(line,510,y,size,{at:when,role:'keyword',italic:true,color:red,layer:-3,extra:'\\blur28\\bord9\\3c&H000000FF&\\3a&H60&\\1a&H70&'});
    label(line,510,y,size,{at:when,role:'keyword',italic:true,color:red,layer:-2,extra:'\\blur10\\bord3\\3c&H000000FF&\\3a&H50&'});
    reveal(line,510,y,size,when,{role:'keyword',italic:true,color:pink});
   });
   const scanY=970,scanAt=when-.08;
   shape('m 0 0 l 145 0 145 4 0 4',0,0,red,{at:scanAt,until:scanAt+.5,blur:15,extra:'\\move(810,970,140,970,0,380)\\fad(60,180)'});
   shape('m 0 0 l 145 0 145 3 0 3',0,0,pink,{at:scanAt,until:scanAt+.5,extra:'\\move(810,970,140,970,0,380)\\fad(60,180)'});
   continue;
  }
  // Paper, central grid, vignette and grain are composited by technical-paper.js.
  if(g.type==='grid'){
   for(const [index,c]of [{x:900,y:-140,r:550},{x:80,y:1900,r:500}].entries()){
    const rotate=`\\org(${c.x},${c.y})\\frz0\\t(0,${ms},\\frz${index?-25:25})`;
    shape(circlePath(c.x,c.y,c.r),0,0,dark,{stroke:5,alpha:'70',blur:3,extra:rotate});
    for(const delta of [0,.22]){
     const a=(index?-1.02:2.02)+delta,x=c.x+Math.cos(a)*c.r,y=c.y+Math.sin(a)*c.r;
     shape(circlePath(x+7,y+10,32),0,0,dark,{alpha:'A0',blur:14,extra:rotate});
     shape(circlePath(x,y,30),0,0,dark,{blur:4,extra:rotate});
    }
   }
   const words=g.text.split(/\s+/),last=words.pop(),heading=g.heading??words.join(' '),body=g.bodyLines??[last];
   const headerSize=fitCaptionSize([heading||' '],{...p,fontRole:'italic',fontSize:160},780);
   if(heading){
    const prefix=heading.endsWith(' de')?heading.slice(0,-3):heading;
    const content=heading.endsWith(' de')?`${safeText(prefix)} {\\1c${assColor('#7A7A7A')}&\\t(600,1000,\\1c${assColor(dark)}&)}de`:safeText(heading);
    label(content,510,680,headerSize,{at:start+.1,italic:true,escape:false,extra:'\\blur10\\t(0,200,\\blur0)'});
   }
   body.forEach((line,i)=>reveal(line,510,820+i*145,fitCaptionSize([line],{...p,fontSize:160},780),start+.65+i*.35));
   if(g.icons?.length){icon(g.icons[0],210,1120,start+.7);icon(g.icons[1],650,1120,start+1.02);}
  }else{
   const split=text=>{const words=text.split(/\s+/),lines=[''];for(const w of words){if((lines.at(-1)+' '+w).trim().length>14&&lines.at(-1))lines.push(w);else lines[lines.length-1]=(lines.at(-1)+' '+w).trim();}return lines;};
   const leftLines=split(g.left),rightLines=split(g.right),font=fitCaptionSize([...leftLines,...rightLines],{...p,fontRole:'italic',fontSize:180},470),x=110;
   leftLines.forEach((line,i)=>label(line,x,780+i*font*.9,font,{at:start+.1,italic:true,extra:'\\an4\\blur10\\t(0,250,\\blur0)'}));
   rightLines.forEach((line,i)=>label(line,x,1160+i*font*.9,font,{at:start+1.1,italic:true,extra:'\\an4\\blur10\\t(0,250,\\blur0)'}));
   if(g.icons?.length){icon(g.icons[0],670,665,start+.1);icon(g.icons[1],690,1060,start+1.1);}
   else{shape(circlePath(785,780,75),0,0,dark,{stroke:4,at:start+.1});shape(circlePath(785,1160,75),0,0,dark,{stroke:4,at:start+1.1});}
   // Progressive masks reveal the actual curved strokes, followed by arrowheads.
   shape('m 310 650 b 410 350 710 355 820 590',0,0,dark,{stroke:9,at:start+.5,extra:'\\clip(200,250,220,680)\\t(0,430,\\clip(200,250,900,680))'});
   shape('m 787 566 l 822 604 849 552 818 569',0,0,dark,{at:start+.88});
   shape('m 310 1310 b 410 1600 710 1600 820 1340',0,0,dark,{stroke:9,at:start+1.6,extra:'\\clip(200,1280,220,1700)\\t(0,430,\\clip(200,1280,900,1700))'});
   shape('m 786 1368 l 823 1326 848 1378 817 1361',0,0,dark,{at:start+1.98});
  }
 }
}
