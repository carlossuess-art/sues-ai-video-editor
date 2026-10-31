import {fitCaptionSize,typefaceTags} from './font-kits.js';
import {validateSafePlacement,PORTRAIT_SAFE_ZONES} from './vision.js';

export const ELEMENT_FORMATS=Object.freeze(['LIST','RANKING','COMPARE','REVEAL','Q&A','FLOW','TRUE_FALSE']);
const assert=(ok,msg)=>{if(!ok)throw new Error('ELEMENTS: '+msg);};
const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
const id=v=>typeof v==='string'&&/^seg-\d{3,}$/.test(v);
const copy=v=>typeof v==='string'&&v.trim().length>0&&v.length<=48&&!/[\x00-\x1f\x7f]/.test(v);
const overlap=(a,b)=>a.start<b.end-1e-6&&a.end>b.start+1e-6;

// Explicit editorial copy, anchored to existing caption ranges. No inference,
// transcript rewriting, word-level alignment, or invented ranking/comparison.
export function validateElements(value){
 if(value===undefined||value===null)return true;
 assert(object(value)&&Object.keys(value).every(k=>['format','items','offset'].includes(k))&&ELEMENT_FORMATS.includes(value.format),'formato desconocido');
 assert(Array.isArray(value.items)&&value.items.length>=1&&value.items.length<=50,'elige entre uno y 50 elementos');
 assert(value.offset===undefined||(Number.isFinite(value.offset)&&Math.abs(value.offset)<=4),'desplazamiento de composición fuera de ±4 segundos');
 const ids=new Set(),ranks=new Set();
 for(const item of value.items){
  assert(object(item)&&Object.keys(item).every(k=>['captionId','endCaptionId','label','secondary','number','answer','revealOffset'].includes(k))&&id(item.captionId)&&!ids.has(item.captionId),'ancla duplicada o inválida');ids.add(item.captionId);
  assert(item.endCaptionId===undefined||id(item.endCaptionId),'ancla final inválida');
  assert(copy(item.label),'texto principal: entre 1 y 48 caracteres');
  if(['COMPARE','Q&A'].includes(value.format))assert(copy(item.secondary),'comparación y pregunta necesitan dos textos');
  else assert(item.secondary===undefined,'texto secundario sólo para COMPARE o Q&A');
  if(value.format==='TRUE_FALSE')assert(['true','false'].includes(item.answer),'verdadero/falso necesita respuesta válida');
  else assert(item.answer===undefined,'respuesta sólo para verdadero/falso');
  if(item.revealOffset!==undefined)assert(['LIST','RANKING','TRUE_FALSE'].includes(value.format)&&Number.isFinite(item.revealOffset)&&Math.abs(item.revealOffset)<=1.5,'desplazamiento de aparición fuera de ±1.5 s');
  if(value.format==='RANKING'){
   assert(Number.isInteger(item.number)&&item.number>=1&&item.number<=10&&!ranks.has(item.number),'posición del ranking: única, de 1 a 10');ranks.add(item.number);
  }else assert(item.number===undefined,'posición explícita sólo para RANKING');
 }
 return true;
}

function rows(text,max=22){
 const words=text.trim().split(/\s+/);assert(words.every(w=>w.length<=max),'palabra demasiado larga para la tarjeta');
 const out=[''];for(const word of words){const i=out.length-1;if((out[i]+' '+word).trim().length<=max)out[i]=(out[i]+' '+word).trim();else out.push(word);}
 assert(out.length<=3,'acorta el texto de la tarjeta');return out;
}

export function prepareElements(value,plan,{enabled=true,profile}={}){
 validateElements(value);if(!value)return [];
 const cutoff=plan.duration-plan.policy.outro.duration;
 const get=id=>{const c=plan.captions.find(c=>c.id===id);assert(c,'subtítulo desconocido '+id);return c;};
 const box={left:120,right:900,top:380,bottom:1080};
 assert(validateSafePlacement(box,PORTRAIT_SAFE_ZONES.content)&&box.bottom<plan.layout.caption.top,'zona de contenido inválida');
 const events=value.items.map((item,index)=>{
  const first=get(item.captionId),last=get(item.endCaptionId??item.captionId),start=first.start+(value.offset??0),end=last.end+(value.offset??0);
  assert(last.start>=first.start&&start>=0&&end<=cutoff&&end-start>=1&&end-start<=12,'rango: entre 1 y 12 s, antes del cierre');
  const width=value.format==='COMPARE'?320:680;
  const labels=[rows(item.label,value.format==='COMPARE'?14:22),...(item.secondary?[rows(item.secondary,value.format==='COMPARE'?14:22)]:[])];
  const sizes=labels.map(lines=>fitCaptionSize(lines,{...plan.policy.captions,fontRole:'keyword',tracking:0,scaleX:100,fontSize:96},width));
  return {...structuredClone(item),format:value.format,start,end,box,labels,sizes,number:value.format==='RANKING'?item.number:index+1,total:value.items.length,
   entranceMs:profile?.id==='DOPAMIN'?140:240,travelPx:profile?.id==='DOPAMIN'?36:18,
   revealAt:Math.max(start,Math.min(end-.05,start+(value.format==='TRUE_FALSE'?Math.min(.7,(end-start)*.5):0)+(item.revealOffset??0))),
   sourceWordIndexes:plan.captions.filter(c=>c.start>=start&&c.end<=end).flatMap(c=>c.wordIndexes),
   timing:'existing-caption-range',copyOrigin:'explicit-editor-choice',scope:'full-frame-presenter-intentionally-covered'};
 }).sort((a,b)=>a.start-b.start);
 if(['LIST','RANKING'].includes(value.format)&&events.length>1){
  for(let i=0;i<events.length;i++){
   const page=Math.floor(i/10),group=events.slice(page*10,page*10+10),first=group[0],last=group.at(-1);
   events[i].compositionId=value.format+'-page-'+page;
   events[i].compositionStart=first.start;events[i].compositionEnd=last.end;
   events[i].compositionIndex=i-page*10;
   events[i].compositionCount=group.length;
  }
 }
 for(const event of events){
  assert(!events.some(other=>other!==event&&overlap(event,other)),'los elementos se solapan');
  for(const other of [...(plan.graphics??[]),...(plan.semantic?.motions??[]),...(plan.selectedMedia??[]),...(plan.depthText??[]),...(plan.illustrations??[])])assert(!overlap(event,other),'el rango ya contiene otro recurso; elige otro intervalo');
 }
 return enabled?events:[];
}

export function drawElements(plan,event,safeText,assColor){
 const pages=new Map();
 for(const e of plan.elements??[])if(e.compositionId){const page=pages.get(e.compositionId)??[];page.push(e);pages.set(e.compositionId,page);}
 for(const page of pages.values()){
  page.sort((a,b)=>a.start-b.start);
  const first=page[0],last=page.at(-1),start=first.compositionStart,end=last.compositionEnd;
  const p=plan.policy.captions,accent=p.accent;
  const bg=`{\\an7\\pos(0,0)\\p1\\bord0\\shad0\\1c${assColor(plan.renderColors.dark)}&}m 0 0 l 1080 0 1080 1920 0 1920`;
  event(-9,start,end,'Outro',bg);
  const header=first.format==='RANKING'?'CLASIFICACIÓN':'LAS RAZONES';
  event(-1,start,end,'Caption',`{${typefaceTags(p,'keyword')}\\an5\\pos(540,185)\\fs74\\bord0\\shad0\\1c${assColor(accent)}&}${header}`);
  const space=132,firstY=360;
  for(const item of page){
   const ordinal=item.format==='RANKING'?item.number:item.compositionIndex+1;
   const y=firstY+space*item.compositionIndex;
   const at=Math.max(start,Math.min(end-.02,item.revealAt));
   const fade=Math.min(150,Math.floor((end-at)*400));
   event(-1,at,end,'Caption',`{${typefaceTags(p,'keyword')}\\an5\\move(174,${y+10},174,${y},0,${item.entranceMs})\\fs70\\bord0\\shad0\\1c${assColor(accent)}&\\fad(${fade},70)}${ordinal.toString().padStart(2,'0')}`);
   const lines=item.labels[0],size=Math.min(56,item.sizes[0]??56);
   lines.forEach((line,i)=>event(-1,at,end,'Caption',`{${typefaceTags(p,'normal')}\\an7\\move(245,${y+item.travelPx+i*52},245,${y+i*52},0,${item.entranceMs})\\fs${size}\\bord0\\shad0\\1c${assColor('#FFFFFF')}&\\fad(${fade},70)}${safeText(line)}`));
  }
 }
 for(const e of plan.elements??[]){
  if(e.compositionId)continue;
  const p=plan.policy.captions,cx=510,accent=plan.policy.captions.accent,ms=e.entranceMs;
  const shape=(path,x,y,color,layer=-5)=>event(layer,e.start,e.end,'Outro',`{\\an7\\pos(${x},${y})\\p1\\bord0\\shad0\\1c${assColor(color)}&}${path}`);
  // Intentional scene replacement. This is not a simulated subject cutout.
  shape('m 0 0 l 1080 0 1080 1920 0 1920',0,0,plan.renderColors.dark,-9);
  for(let y=320;y<=1100;y+=80)shape('m 0 0 l 780 0 780 1 0 1',120,y,'#303038',-8);
  const label=(text,x,y,size,{color='#FFFFFF',role='keyword',at=e.start}={})=>event(-1,at,e.end,'Caption',`{${typefaceTags(p,role)}\\an5\\move(${x},${y+e.travelPx},${x},${y},0,${ms})\\fs${size}\\fscx100\\fscy100\\fsp0\\bord0\\shad0\\1c${assColor(color)}&\\fad(${Math.min(ms,100)},80)}${safeText(text)}`);
  const heading={LIST:'LAS CLAVES',RANKING:'CLASIFICACIÓN',COMPARE:'DOS PERSPECTIVAS',REVEAL:'DESCUBRE','Q&A':'PREGUNTA Y RESPUESTA',FLOW:'PASO A PASO',TRUE_FALSE:'VERDADERO O FALSO'}[e.format];
  label(heading,cx,300,64,{color:accent});
  if(e.format==='TRUE_FALSE'){
   e.labels[0].forEach((line,i)=>label(line,cx,530+(i-(e.labels[0].length-1)/2)*110,e.sizes[0]));
   const answer=e.answer==='true'?'✓ VERDADERO':'× FALSO';
   label(answer,cx,950,110,{color:e.answer==='true'?'#55DB9B':'#FF6772',at:e.revealAt});
  }else if(e.format==='COMPARE'){
   shape('m 0 0 l 2 0 2 530 0 530',509,450,accent);
   for(let col=0;col<2;col++)e.labels[col].forEach((line,i)=>label(line,col?715:305,650+(i-(e.labels[col].length-1)/2)*110,e.sizes[col]));
  }else if(e.format==='Q&A'){
   for(let col=0;col<2;col++)e.labels[col].forEach((line,i)=>label(line,cx,(col?900:540)+(i-(e.labels[col].length-1)/2)*100,e.sizes[col],{color:col?accent:'#FFFFFF'}));
   shape('m 0 0 l 680 0 680 3 0 3',170,720,accent);
  }else{
   const marker=e.format==='RANKING'?'#'+e.number:e.format==='FLOW'?'PASO '+e.number:String(e.number);
   label(marker,cx,490,e.format==='FLOW'?96:160,{color:accent});
   e.labels[0].forEach((line,i)=>label(line,cx,760+(i-(e.labels[0].length-1)/2)*110,e.sizes[0]));
   // A progress rail reveals the position without drawing ten lines of copy.
   shape('m 0 0 l 680 0 680 6 0 6',170,1040,'#474750');
   shape(`m 0 0 l ${Math.round(680*e.number/(e.format==='RANKING'?10:e.total))} 0 ${Math.round(680*e.number/(e.format==='RANKING'?10:e.total))} 6 0 6`,170,1040,accent);
  }
 }
}
