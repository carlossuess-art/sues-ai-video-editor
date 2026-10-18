import {fitCaptionSize} from './font-kits.js';
// Authored vector scenes inspired by the reference's grid, orbital nodes and stamp.
// Geometry and timings are reconstruction choices, not measurements of its project.
export function drawEditorialScenes(plan,event,safeText,assColor){
 const disk=(x,y,r)=>`m ${x-r} ${y} b ${x-r} ${y-r*.5523} ${x-r*.5523} ${y-r} ${x} ${y-r} b ${x+r*.5523} ${y-r} ${x+r} ${y-r*.5523} ${x+r} ${y} b ${x+r} ${y+r*.5523} ${x+r*.5523} ${y+r} ${x} ${y+r} b ${x-r*.5523} ${y+r} ${x-r} ${y+r*.5523} ${x-r} ${y}`;
 for(const g of plan.graphics??[]){
  const start=g.start,end=g.end,ms=Math.round((end-start)*1000),dark='#141918',paper='#E5E6E3',gold='#B59762',red='#F36050';
  const shape=(layer,path,color,extra='',at=start)=>event(layer,at,end,'Outro',`{\\an7${extra.includes('\\move(')?'':'\\pos(0,0)'}\\p1\\bord0\\shad0\\1c${assColor(color)}&\\fad(160,180)${extra}}${path}`);
  const label=(text,x,y,size,color,extra='',at=start)=>event(-1,at,end,'Caption',`{${extra.includes('\\move(')?'':`\\pos(${x},${y})`}\\fs${size}\\b1\\bord0\\shad0\\1c${assColor(color)}&\\fad(160,180)${extra}}${safeText(text)}`);
  shape(-8,'m 0 0 l 1080 0 1080 1920 0 1920',g.type==='secret'?'#080C0D':paper);
  if(g.type==='secret'){
   // Light is concentrated around the stamp, rather than a flat pink rectangle.
   shape(-7,disk(510,740,210),red,'\\1a&HEB&\\blur100');
   const frame='m 155 530 l 865 530 865 536 155 536 m 155 925 l 865 925 865 931 155 931 m 155 530 l 161 530 161 590 155 590 m 859 530 l 865 530 865 590 859 590 m 155 870 l 161 870 161 931 155 931 m 859 870 l 865 870 865 931 859 931';
   shape(-4,frame,red,'\\blur10\\1a&H80&\\fscx90\\fscy90\\t(0,280,\\fscx100\\fscy100)');
   shape(-3,frame,red,'\\fscx90\\fscy90\\t(0,280,\\fscx100\\fscy100)');
   
   const titleLines=g.lines.map(line=>line.toLocaleUpperCase('es').replace(/[,.;!?]+$/,'')),size=fitCaptionSize(titleLines,{...plan.policy.captions,fontSize:Math.min(140,g.fontSize*1.5)},700);
   titleLines.forEach((line,i)=>{
    const y=730+(i-(titleLines.length-1)/2)*size*1.15;
    label(line,510,y,size,red,'\\frz-4\\fscx88\\fscy88\\blur8\\1a&H70&\\t(0,300,\\fscx100\\fscy100)',start+.08);
    label(line,510,y,size,red,'\\frz-4\\fscx88\\fscy88\\t(0,300,\\fscx100\\fscy100)',start+.08);
   });
   label('S U E S   H O L I S T I C S',510,1005,25,'#82908A','\\fsp1',start+.28);
   continue;
  }
  let grid='';for(let x=0;x<=1080;x+=64)grid+=`m ${x} 0 l ${x+1} 0 ${x+1} 1920 ${x} 1920 `;for(let y=0;y<=1920;y+=64)grid+=`m 0 ${y} l 1080 ${y} 1080 ${y+1} 0 ${y+1} `;
  shape(-7,grid,'#87938C','\\1a&HD5&');
  shape(-6,'m 0 0 l 1080 0 1080 90 0 90 m 0 1800 l 1080 1800 1080 1920 0 1920 m 0 0 l 90 0 90 1920 0 1920 m 980 0 l 1080 0 1080 1920 980 1920',dark,'\\1a&H70&\\blur95');
  // Oversize rings leave the center clear. Parallax and offset nodes add depth.
  for(const [i,c]of [[0,{x:830,y:-120,r:530}],[1,{x:180,y:1850,r:480}]]){
   const move=`\\move(0,0,${i?24:-20},${i?-28:24},0,${ms})`;
   shape(-5,disk(c.x,c.y,c.r),dark,`\\1a&HFF&\\bord7\\3c${assColor(dark)}&\\3a&HA0&${move}`);
   const angle=i?-1.05:2.15,x=c.x+Math.cos(angle)*c.r,y=c.y+Math.sin(angle)*c.r;
   shape(-4,disk(x+10,y+12,33),dark,`\\blur14\\1a&HB0&${move}`);
   shape(-3,disk(x,y,30),dark,move);
   shape(-2,disk(x-8,y-9,9),'#829088','\\1a&H90&'+move);
  }
  if(g.type==='compare'){
   // A route is drawn in stages, not a static arrow placed between two labels.
   label(g.left,510,590,g.fontSize,dark,'\\i1\\fscx97\\t(0,280,\\fscx100)',start+.1);
   const route='m 510 710 b 710 710 710 1020 510 1020';
   shape(-2,route,gold,`\\1a&HFF&\\bord4\\3c${assColor(gold)}&\\clip(0,0,1080,720)\\t(180,700,\\clip(0,0,1080,1030))`);
   shape(-2,'m 491 995 l 510 1020 534 997 530 1017 510 1042 487 1018',gold,'',start+.55);
   const lines=g.right.length>19?g.right.split(/\s+/):[g.right];
   const output=lines.length>2?[lines.slice(0,Math.ceil(lines.length/2)).join(' '),lines.slice(Math.ceil(lines.length/2)).join(' ')]:lines;
   output.forEach((line,i)=>label(line,510,1130+i*90,g.fontSize,'#365B4E','\\i1',start+.65+i*.1));
  }else{
   // Preserve only the selected literal words. No generic placeholder headings.
   const words=g.text.trim().split(/\s+/),last=words.pop(),prefix=words.join(' ');
   if(prefix)label(prefix,510,670,Math.min(72,g.fontSize),dark,'\\i1\\move(510,690,510,670,0,300)',start+.12);
   label(last,510,840,fitCaptionSize([last],{...plan.policy.captions,fontSize:Math.min(180,g.fontSize*1.8)},740),dark,'\\i1\\fscx92\\fscy92\\t(0,350,\\fscx100\\fscy100)',start+.3);
   shape(-2,'m 270 1010 l 750 1010 750 1013 270 1013',gold,'\\clip(270,1000,270,1030)\\t(350,800,\\clip(270,1000,750,1030))');
  }
 }
}
