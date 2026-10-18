import {fitCaptionSize} from './font-kits.js';
export const GRAPHIC_BLOCKS=Object.freeze({grid:'Tarjeta de cuadrícula',compare:'Comparación',secret:'Idea clave sobre negro'});
export const GLOBAL_TRANSITIONS=Object.freeze({blur:'Pulso de desenfoque',warm:'Destello cálido',radial:'Expansión radial'});
const assert=(ok,msg)=>{if(!ok)throw new Error('Graphic blocks: '+msg);};
const captionId=id=>typeof id==='string'&&/^seg-\d{3,}$/.test(id);
const text=value=>typeof value==='string'&&value.trim().length>0&&value.length<=26&&!/[\x00-\x1f\x7f]/.test(value);
export function validateGraphicSettings(cards=[],transitions=[]){
 assert(Array.isArray(cards)&&cards.length<=3&&Array.isArray(transitions)&&transitions.length<=3,'up to three cards and transitions');
 for(const c of cards){assert(c&&Object.keys(c).every(k=>['captionId','type','left','right'].includes(k))&&captionId(c.captionId)&&Object.hasOwn(GRAPHIC_BLOCKS,c.type),'card choice');if(c.type==='compare')assert(text(c.left)&&text(c.right),'comparison needs two short labels');}
 for(const t of transitions)assert(t&&Object.keys(t).every(k=>['captionId','type'].includes(k))&&captionId(t.captionId)&&Object.hasOwn(GLOBAL_TRANSITIONS,t.type),'transition choice');
 assert(new Set(cards.map(c=>c.captionId)).size===cards.length&&new Set(transitions.map(t=>t.captionId)).size===transitions.length,'duplicate event choice');
}
export function prepareGraphicBlocks(cards,transitions,plan,enabled=true){
 validateGraphicSettings(cards,transitions);
 const get=id=>{const c=plan.captions.find(c=>c.id===id);assert(c,'unknown caption '+id);return c;},cutoff=plan.duration-plan.policy.outro.duration;
 const graphics=cards.map(choice=>{
  const c=get(choice.captionId),target=Math.min(cutoff,Math.max(c.end,c.start+2.4)),boundary=plan.captions.find(next=>next.end>=target&&next.end<=cutoff&&next.end-c.start<=5),end=boundary?.end??target;assert(c.start>=2&&end-c.start>=1.5,'card too close to opening or closing');
  const fontSize=fitCaptionSize(choice.type==='compare'?[choice.left,choice.right]:c.lines,{...plan.policy.captions,fontSize:choice.type==='compare'?72:84},740);
  return {...choice,fontSize,lines:c.lines,start:c.start,end,text:c.text,wordIndexes:c.wordIndexes,textOrigin:c.source==='manual'?'user-edited-caption':'transcript-caption',reason:'Explicit editorial card choice',scope:'full-frame-presenter-intentionally-covered'};
 });
 for(const c of graphics){assert(!graphics.some(o=>o!==c&&o.start<c.end&&o.end>c.start),'cards overlap');assert(!(plan.semantic?.motions??[]).some(m=>m.start<c.end&&m.end>c.start),'card overlaps motion');assert(!plan.selectedMedia.some(m=>m.start<c.end&&m.end>c.start),'card overlaps B-roll');}
 const effects=transitions.map(choice=>{const c=get(choice.captionId),start=c.start,end=start+.4;assert(end<=cutoff,'transition too close to closing');return {...choice,start,end,duration:.4,reason:'Explicit editorial transition choice',scope:'entire-composition-including-captions',audio:'unchanged'};});
 for(const e of effects)assert(!effects.some(o=>o!==e&&o.start<e.end&&o.end>e.start),'transitions overlap');
 return {graphics:enabled?graphics:[],globalTransitions:enabled?effects:[]};
}

export function drawGraphicBlocks(plan,event,safeText,assColor){
 for(const g of plan.graphics??[]){
  const paint=(color)=>assColor(color),start=g.start,end=g.end;
  const shape=(layer,path,color,extra='')=>event(layer,start,end,'Outro',`{\\an7\\pos(0,0)\\p1\\bord0\\shad0\\1c${paint(color)}&\\fad(120,160)${extra}}${path}`);
  const label=(text,x,y,size,color='#101820',extra='',at=start)=>event(-1,at,end,'Caption',`{\\pos(${x},${y})\\fs${size}\\b1\\bord0\\shad0\\1c${paint(color)}&\\fad(120,160)${extra}}${safeText(text)}`);
  shape(-4,'m 0 0 l 1080 0 1080 1920 0 1920',g.type==='secret'?'#101820':'#E9ECE5');
  if(g.type!=='secret'){
   let grid='';for(let x=0;x<=1080;x+=80)grid+=`m ${x} 0 l ${x+1} 0 ${x+1} 1920 ${x} 1920 `;for(let y=0;y<=1920;y+=80)grid+=`m 0 ${y} l 1080 ${y} 1080 ${y+1} 0 ${y+1} `;shape(-3,grid,'#B8C2BC','\\1a&H80&');
   // Dark outer edges leave the central explanation bright.
   shape(-2,'m 0 0 l 1080 0 1080 110 0 110 m 0 1810 l 1080 1810 1080 1920 0 1920 m 0 0 l 70 0 70 1920 0 1920 m 1010 0 l 1080 0 1080 1920 1010 1920','#101820','\\1a&HCC&\\blur60');
  }
  if(g.type==='compare'){
   label('DOS PERSPECTIVAS',510,450,45,'#46665D');
   shape(-2,'m 155 650 l 865 650 865 655 155 655','#D7B56D');
   label(g.left,510,760,g.fontSize,'#101820','',start+.12);
   shape(-2,'m 260 920 l 730 920 730 926 260 926 m 690 895 l 730 923 690 952 702 923','#46665D');
   label(g.right,510,1050,g.fontSize,'#46665D','',start+.55);
  }else if(g.type==='secret'){
   shape(-2,'m 200 420 l 820 420 820 610 200 610','#FF786B','\\1a&HCC&');
   label('IDEA CLAVE',510,515,68,'#FF786B','\\fsp4\\blur1');
   const words=g.text.split(' ');for(let i=0;i<words.length;i++){const at=start+.18+i*.1;if(at>=end-.3)break;let used=0;const lines=g.lines.map(line=>line.split(' ').filter(()=>used++<=i).join(' ')).filter(Boolean);event(-1,at,i+1<words.length?Math.min(end,start+.18+(i+1)*.1):end,'Caption',`{\\pos(510,850)\\fs${g.fontSize}\\b1\\1c${paint('#FFFFFF')}&\\fad(80,100)}${lines.map(safeText).join('\\N')}`);}
  }else{
   label('UNA IDEA PARA RECORDAR',510,450,42,'#46665D');
   const lines=g.lines;
   for(const [i,line]of lines.entries())label(line,510,770+i*110,g.fontSize,'#101820','\\i1',start+.15+i*.18);
   shape(-2,'m 185 1080 l 835 1080 835 1085 185 1085','#D7B56D');
  }
 }
}

export function globalTransitionFilters(events,base){
 const filters=[];
 for(const [i,e]of events.entries()){
  const d=e.duration,fade=d/2;
  if(e.type==='warm'){
   filters.push(`color=c=0xffe1bc:s=1080x1920:r=30:d=${d},format=rgba,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='255*exp(-2*((X-240)/1000)^2-2*((Y-400)/1800)^2)',fade=t=in:st=0:d=${fade}:alpha=1,fade=t=out:st=${fade}:d=${fade}:alpha=1,setpts=PTS+${e.start}/TB[global-effect${i}]`);
   filters.push(`[${base}][global-effect${i}]overlay=eof_action=pass:repeatlast=0:enable='gte(t,${e.start})*lt(t,${e.end})'[global-composed${i}]`);
  }else{
   filters.push(`[${base}]split=2[global-clear${i}][global-input${i}]`);
   let effect='gblur=sigma=9';
   if(e.type==='radial'){
    const sample=c=>Array.from({length:5},(_,k)=>`${c}(270+(X-270)*(1-${k*.035}*sin(PI*T/${d})),480+(Y-480)*(1-${k*.035}*sin(PI*T/${d})))`).join('+');
    effect=`geq=r='(${sample('r')})/5':g='(${sample('g')})/5':b='(${sample('b')})/5'`;
   }
   filters.push(`[global-input${i}]trim=start=${e.start}:end=${e.end},setpts=PTS-STARTPTS,scale=540:960,${effect},scale=1080:1920,format=rgba,fade=t=in:st=0:d=${fade}:alpha=1,fade=t=out:st=${fade}:d=${fade}:alpha=1,setpts=PTS+${e.start}/TB[global-effect${i}]`);
   filters.push(`[global-clear${i}][global-effect${i}]overlay=eof_action=pass:repeatlast=0:enable='gte(t,${e.start})*lt(t,${e.end})'[global-composed${i}]`);
  }
  base=`global-composed${i}`;
 }
 return {filters,base};
}
