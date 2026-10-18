import {drawEditorialScenes} from './graphic-scenes.js';
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
 return drawEditorialScenes(plan,event,safeText,assColor);
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
