import {drawEditorialScenes} from './graphic-scenes.js';
import {fitCaptionSize} from './font-kits.js';
export const GRAPHIC_BLOCKS=Object.freeze({grid:'Tarjeta de cuadrícula',compare:'Comparación',secret:'Idea clave sobre negro'});
export const GLOBAL_TRANSITIONS=Object.freeze({blur:'Pulso de desenfoque',warm:'Destello cálido',radial:'Expansión radial',radialBurst:'Salida documental'});
const assert=(ok,msg)=>{if(!ok)throw new Error('Graphic blocks: '+msg);};
const captionId=id=>typeof id==='string'&&/^seg-\d{3,}$/.test(id);
const text=value=>typeof value==='string'&&value.trim().length>0&&value.length<=26&&!/[\x00-\x1f\x7f]/.test(value);
export function validateGraphicSettings(cards=[],transitions=[]){
 assert(Array.isArray(cards)&&cards.length<=3&&Array.isArray(transitions)&&transitions.length<=3,'up to three cards and transitions');
 for(const c of cards){assert(c&&Object.keys(c).every(k=>['captionId','endCaptionId','type','left','right','heading','bodyLines','lead','icons'].includes(k))&&captionId(c.captionId)&&Object.hasOwn(GRAPHIC_BLOCKS,c.type),'card choice');if(c.type==='compare')assert(text(c.left)&&text(c.right),'comparison needs two short labels');}
 for(const t of transitions)assert(t&&Object.keys(t).every(k=>['captionId','type','phase'].includes(k))&&captionId(t.captionId)&&Object.hasOwn(GLOBAL_TRANSITIONS,t.type),'transition choice');
 for(const c of cards){if(c.endCaptionId!==undefined)assert(captionId(c.endCaptionId),'end caption');if(c.heading!==undefined)assert(text(c.heading),'heading');if(c.lead!==undefined)assert(text(c.lead),'lead');if(c.bodyLines!==undefined)assert(Array.isArray(c.bodyLines)&&c.bodyLines.length>0&&c.bodyLines.length<=3&&c.bodyLines.every(text),'body lines');if(c.icons!==undefined)assert(Array.isArray(c.icons)&&c.icons.length===2&&c.icons.every(i=>['clapper','makeup','luggage','clock','eye','heart'].includes(i)),'icons');}for(const t of transitions)assert(t.phase===undefined||t.phase==='exit','transition phase');
 assert(new Set(cards.map(c=>c.captionId)).size===cards.length&&new Set(transitions.map(t=>t.captionId)).size===transitions.length,'duplicate event choice');
}
export function prepareGraphicBlocks(cards,transitions,plan,enabled=true){
 validateGraphicSettings(cards,transitions);
 const get=id=>{const c=plan.captions.find(c=>c.id===id);assert(c,'unknown caption '+id);return c;},cutoff=plan.duration-plan.policy.outro.duration;
 const graphics=cards.map(choice=>{
  const c=get(choice.captionId),target=Math.min(cutoff,Math.max(c.end,c.start+2.4)),boundary=plan.captions.find(next=>next.end>=target&&next.end<=cutoff&&next.end-c.start<=5),automaticEnd=boundary?.end??target,last=choice.endCaptionId?get(choice.endCaptionId):null,next=last&&plan.captions.find(n=>n.start>=last.end&&n.id!==last.id),end=last?Math.min(cutoff,last.end+.3,next?.start??cutoff):automaticEnd;assert(!last||last.start>=c.start&&last.end<=cutoff&&end-c.start<=6,'invalid card range');assert(c.start>=2&&end-c.start>=1.5,'card too close to opening or closing');
  const fontSize=fitCaptionSize(choice.type==='compare'?[choice.left,choice.right]:c.lines,{...plan.policy.captions,fontSize:choice.type==='compare'?72:84},740);
  const covered=plan.captions.filter(n=>n.start>=c.start&&n.end<=end),tokens=t=>t.toLocaleLowerCase('es').match(/[\p{L}\p{N}]+/gu)??[];
  const spoken=covered.flatMap(n=>n.text.split(/\s+/).map((text,i)=>({text,index:n.wordIndexes[i],start:n.source==='manual'?null:n.wordCues?.find(q=>q.wordIndexes.includes(n.wordIndexes[i]))?.start??null}))),findStart=phrase=>{const wanted=tokens(phrase),all=spoken.map(w=>tokens(w.text)[0]);const offset=all.findIndex((_,i)=>wanted.length&&wanted.every((v,j)=>all[i+j]===v));return offset<0?null:spoken[offset].start;};
  const copy=choice.type==='grid'&&choice.heading?[choice.heading,...(choice.bodyLines??[])]:choice.type==='compare'?[choice.left,choice.right]:choice.type==='secret'?[choice.lead??'',c.text]:[];
  const replacedCaptionIds=copy.length&&tokens(copy.join(' ')).join('|')===tokens(covered.map(n=>n.text).join(' ')).join('|')?covered.map(n=>n.id):[];
  const voiceCues={title:findStart(c.text),heading:choice.heading?findStart(choice.heading):null,body:(choice.bodyLines??[]).map(findStart),left:choice.left?findStart(choice.left):null,right:choice.right?findStart(choice.right):null};
  return {...choice,voiceCues,replacedCaptionIds,fontSize,lines:c.lines,start:c.start,end,text:c.text,wordIndexes:c.wordIndexes,textOrigin:c.source==='manual'?'user-edited-caption':'transcript-caption',reason:'Explicit editorial card choice',scope:'full-frame-presenter-intentionally-covered'};
 });
 for(const c of graphics){assert(!graphics.some(o=>o!==c&&o.start<c.end&&o.end>c.start),'cards overlap');assert(!(plan.semantic?.motions??[]).some(m=>m.start<c.end&&m.end>c.start),'card overlaps motion');assert(!plan.selectedMedia.some(m=>m.start<c.end&&m.end>c.start),'card overlaps B-roll');}
 const effects=transitions.map(choice=>{const c=get(choice.captionId),card=graphics.find(g=>g.captionId===choice.captionId);assert(choice.phase!=='exit'||card,'exit needs a card');const start=choice.phase==='exit'?card.end-.2:c.start,end=start+.4;assert(end<=cutoff,'transition too close to closing');return {...choice,start,end,duration:.4,reason:'Explicit editorial transition choice',scope:'entire-composition-including-captions',audio:'unchanged'};});
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
  if(e.type==='radialBurst'){
   filters.push(`[${base}]split=2[global-clear${i}][global-input${i}]`);
   filters.push(`[global-input${i}]trim=start=${e.start}:end=${e.start+1/30},setpts=PTS-STARTPTS,tpad=stop_mode=clone:stop_duration=${d},scale=540:960,zoompan=z='1+2*(1-pow(1-min(on/6,1),2))':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=1:s=540x960:fps=30,gblur=sigma=5,scale=1080:1920,format=rgba,fade=t=out:st=0.2:d=0.2:alpha=1,setpts=PTS+${e.start}/TB[global-effect${i}]`);
   filters.push(`[global-clear${i}][global-effect${i}]overlay=eof_action=pass:repeatlast=0:enable='gte(t,${e.start})*lt(t,${e.end})'[burst-composed${i}]`);
   filters.push(`color=c=0xfffcf0:s=1080x1920:r=30:d=0.23,format=rgba,colorchannelmixer=aa=0.88,fade=t=in:st=0:d=0.033:alpha=1,fade=t=out:st=0.033:d=0.197:alpha=1,setpts=PTS+${e.start+.17}/TB[burst-flash${i}]`);
   filters.push(`[burst-composed${i}][burst-flash${i}]overlay=eof_action=pass:repeatlast=0:enable='gte(t,${e.start+.17})*lt(t,${e.end})'[global-composed${i}]`);
  }else if(e.type==='warm'){
   filters.push(`color=c=0xffe1bc:s=270x480:r=30:d=${d},format=rgba,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='min(235,205*exp(-2*pow((X-(35+200*T/${d}))/90,2)-2*pow((Y-145)/220,2))+45*exp(-pow((Y-145)/3,2)))',scale=1080:1920,fade=t=in:st=0:d=${fade}:alpha=1,fade=t=out:st=${fade}:d=${fade}:alpha=1,setpts=PTS+${e.start}/TB[global-effect${i}]`);
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
