import {secretRevealTime} from './graphic-timing.js';
import {fitCaptionSize,textAdvance,typefaceTags} from './font-kits.js';
import {circlePath,ellipsePath,LINE_ART,strokeDrawing} from './motion-drawings.js';

// User-selected recreation recipe. No claim to have recovered the source project,
// exact font identification, stock sticker, plugin or original keyframe values.
export function drawEditorialScenes(plan,event,safeText,assColor){
 for(const g of plan.graphics??[]){
  const start=g.start,end=g.end,d=end-start,ms=Math.round(d*1000),p=plan.policy.captions,dark='#1A1A1A',red='#FF0000',pink='#FF9999';
  const shape=(path,x,y,color,{layer=-3,at=start,extra='',stroke=0,alpha='00',blur=0,until=end,fade=120,fadeOut=160}={})=>at<Math.min(until,end)&&event(layer,at,Math.min(until,end),'Outro',`{${extra.includes('\\move(')?'':`\\pos(${x},${y})`}\\an7\\p1\\bord0\\shad0\\1c${assColor(color)}&\\3c${assColor(color)}&\\1a&H${alpha}&\\3a&H${alpha}&\\blur${blur}\\fad(${fade},${fadeOut})${extra}}${stroke?strokeDrawing(path,stroke*2):path}`);
  const label=(text,x,y,size,{at=start,role='normal',italic=false,color=dark,extra='',layer=-1,escape=true}={})=>at<end&&event(layer,at,end,'Caption',`{${extra.includes('\\move(')?'':`\\pos(${x},${y})`}${typefaceTags(p,role,italic)}\\fs${size}\\fscx100\\fsp-2\\i${italic?1:0}\\b${role.startsWith('stamp')?0:role.startsWith('keyword')?800:700}\\bord0\\shad0\\1c${assColor(color)}&\\fad(120,160)${extra}}${escape?safeText(text):text}`);
  const icon=(name,x,y,at)=>{
   const path=LINE_ART[name];if(!path)return;
   shape(path,x+8,y+18,dark,{at,stroke:5,alpha:'D0',blur:12,extra:`\\fscx115\\fscy115\\move(${x+8},${y+48},${x+8},${y+18},0,240)`});
   shape(path,x,y,dark,{at,stroke:4.5,extra:`\\fscx115\\fscy115\\move(${x},${y+30},${x},${y},0,200)\\blur12\\t(0,200,\\blur0)`});
  };
  const reveal=(text,x,y,size,at,{role='normal',italic=false,color=dark,budget=null}={})=>{
   const policy={...p,fontRole:role==='keyword'?italic?'keywordItalic':'keyword':italic?'italic':undefined,scaleX:100,tracking:-2},width=textAdvance(text,policy,size);
   let cursor=x-width/2;const settle=Math.min(220,Math.max(80,((budget??.55)-.1)*500)),available=Math.max(.08,Math.min(budget??.55,end-at-.16)),delay=Math.min(.024,Math.max(.003,(available-settle/1000)/Math.max(1,[...text].length-1)));
   for(const [i,char]of [...text].entries()){
    const w=textAdvance(char,policy,size),cx=cursor+w/2,t=at+i*delay;
    if(t>=end-.12)break;
    label(char,cx,y,size,{at:t,role,italic,color,extra:`${role==='keyword'?'\\fscx96\\fscy96\\t(0,200,1.8,\\fscx100\\fscy100)':''}\\fsp0\\move(${cx+30},${y},${cx},${y},0,${settle})\\blur8\\t(0,${settle},\\blur0)`});cursor+=w-2;
   }
  };
  if(g.type==='secret'){
   shape('m 0 0 l 1080 0 1080 1920 0 1920',0,0,'#000000',{layer:-8});
   // Original stamp geometry, drawn with real Anton. Not an imported sticker.
   const stampX=510,stampY=610,r=180,at=start+.06;
   shape(circlePath(stampX,stampY,255),0,0,red,{at,layer:-7,alpha:'F0',blur:65});
   shape(ellipsePath(510,1060,360,90),0,0,red,{at:secretRevealTime(g),layer:-7,alpha:'EF',blur:60});
   for(const glow of [true,false]){
    for(const radius of [r,r-20])shape(circlePath(stampX,stampY,radius),0,0,red,{at,stroke:glow?9:4,alpha:glow?'90':'20',blur:glow?22:3,extra:'\\blur18\\t(0,240,\\blur2)'});
    label('TOP SECRET',stampX,stampY,120,{at,role:'stamp',color:glow?red:pink,layer:glow?-3:-1,extra:`\\fnAnton\\i0\\fsp0\\frz-8\\blur${glow?18:10}\\t(0,240,\\blur${glow?14:0})`});
   }
   for(const [i,char]of [...'CLASSIFIED'].entries()){
    const angle=(-153+i*14)*Math.PI/180,x=stampX+Math.cos(angle)*(r-35),y=stampY+Math.sin(angle)*(r-35);
    label(char,x,y,34,{at:start+.12,role:'stampRing',color:pink,extra:`\\fnAllerta Stencil\\frz${-(angle*180/Math.PI+90)}\\fsp0\\blur5\\t(0,220,\\blur0)`});
   }
   const lead=g.lead??'',title=g.text.toLocaleUpperCase('es').replace(/[,.;!?]+$/,'');
   if(lead)label(lead,510,900,100,{at:start+.16,role:'keyword',color:'#FFFFFF',extra:'\\blur8\\t(0,200,\\blur0)'});
   const size=fitCaptionSize(g.lines.map(s=>s.toLocaleUpperCase('es')),{...p,fontRole:'keywordItalic',fontSize:112},780),when=secretRevealTime(g);
   const lines=g.lines.map(s=>s.toLocaleUpperCase('es').replace(/[,.;!?]+$/,''));
   lines.forEach((line,i)=>{
    const y=1060+(i-(lines.length-1)/2)*size*1.1;
    label(line,510,y,size,{at:when,role:'keyword',italic:true,color:red,layer:-3,extra:'\\blur28\\bord9\\3c&H000000FF&\\3a&H60&\\1a&H70&'});
    label(line,510,y,size,{at:when,role:'keyword',italic:true,color:red,layer:-2,extra:'\\blur10\\bord3\\3c&H000000FF&\\3a&H50&'});
    reveal(line,510,y,size,when,{role:'keyword',italic:true,color:pink,budget:g.voiceCues?.title!==null&&g.voiceCues?.title!==undefined ? .24 : .5});
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
    label(content,510,680,headerSize,{at:g.voiceCues?.heading??start+.1,italic:true,escape:false,extra:'\\blur10\\t(0,200,\\blur0)'});
   }
   body.forEach((line,i)=>{const at=g.voiceCues?.body?.[i]??start+.65+i*.35,next=g.voiceCues?.body?.[i+1]??end-.16;reveal(line,510,820+i*145,fitCaptionSize([line],{...p,fontSize:160},780),at,{budget:Math.max(.22,Math.min(.55,next-at-.08))});});
   if(g.icons?.length){icon(g.icons[0],210,1120,g.voiceCues?.body?.[0]??start+.7);icon(g.icons[1],630,1120,g.voiceCues?.body?.at(-1)??start+1.02);}
  }else{
   const split=text=>{const words=text.split(/\s+/),lines=[''];for(const w of words){if((lines.at(-1)+' '+w).trim().length>14&&lines.at(-1))lines.push(w);else lines[lines.length-1]=(lines.at(-1)+' '+w).trim();}return lines;};
   const leftAt=g.voiceCues?.left??start+.1,rightAt=g.voiceCues?.right??start+1.1;
   const leftLines=split(g.left),rightLines=split(g.right),font=fitCaptionSize([...leftLines,...rightLines],{...p,fontRole:'italic',fontSize:180},470),x=126;
   leftLines.forEach((line,i)=>label(line,x,780+(i-(leftLines.length-1)/2)*font*.9,i===leftLines.length-1?font:font*.78,{at:leftAt,italic:true,color:i===leftLines.length-1?dark:'#505050',extra:'\\an4\\blur10\\t(0,250,\\blur0)'}));
   rightLines.forEach((line,i)=>label(line,x,1160+(i-(rightLines.length-1)/2)*font*.9,i===rightLines.length-1?font:font*.78,{at:rightAt,italic:true,color:i===rightLines.length-1?dark:'#505050',extra:'\\an4\\blur10\\t(0,250,\\blur0)'}));
   if(g.icons?.length){icon(g.icons[0],625,665,leftAt);icon(g.icons[1],625,1060,rightAt);}
   else{shape(circlePath(785,780,75),0,0,dark,{stroke:4,at:start+.1});shape(circlePath(785,1160,75),0,0,dark,{stroke:4,at:start+1.1});}
   // Actual path-length reveal instead of a rectangular wipe across the curve.
   const trace=(points,at)=>{let previous=points[0];for(let i=1;i<=24;i++){const t=i/24,u=1-t,next={x:u*u*u*points[0].x+3*u*u*t*points[1].x+3*u*t*t*points[2].x+t*t*t*points[3].x,y:u*u*u*points[0].y+3*u*u*t*points[1].y+3*u*t*t*points[2].y+t*t*t*points[3].y};shape(`m ${previous.x} ${previous.y} l ${next.x} ${next.y}`,0,0,dark,{stroke:5,at:at+(i-1)/24*.43,fade:0,fadeOut:0});previous=next;}};
   trace([{x:310,y:650},{x:410,y:350},{x:710,y:355},{x:820,y:590}],leftAt+.4);
   shape('m 787 566 l 822 604 849 552 818 569',0,0,dark,{at:leftAt+.88,fadeOut:0});
   trace([{x:310,y:1360},{x:410,y:1600},{x:710,y:1600},{x:820,y:1340}],rightAt+.4);
   shape('m 786 1368 l 823 1326 848 1378 817 1361',0,0,dark,{at:rightAt+.88,fadeOut:0});
  }
 }
}
