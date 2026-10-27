import {createHash} from 'node:crypto';
import {parseExternalPlan} from './external-edit-plan.js';

const seconds=s=>{
 const parts=String(s).trim().replace(',','.').split(':');
 if(parts.length>2||parts.some(x=>!/^\d+(?:\.\d+)?$/.test(x)))return null;
 const n=parts.map(Number);
 if(parts.length===2&&(n[1]>=60||!Number.isInteger(n[0])))return null;
 return parts.length===2?n[0]*60+n[1]:n[0];
};
const clean=s=>String(s??'').replace(/\*\*/g,'').replace(/\x60/g,'').trim();
const unsafe=/detr[aá]s|m[aá]scar|oclu|rotoscop|tens|caden|anim|zoom|acerc|sonido|sfx|pop|fund|difumin|transici[oó]n|flot|overlay|texto|rotul|gr[aá]fic|recort/i;

// Parse only explicit operations. The creative text is untrusted data; unrecognised
// material is retained, flagged and blocks execution. No commands are executed.
export function adaptCreativePlan(text,sourceSha256,{search,resolveId}={}){
 if(typeof text!=='string'||!text.trim()||text.length>30000)throw Error('El plan admite entre 1 y 30000 caracteres.');
 const original=text.trim(),id=createHash('sha256').update(text).digest('hex');
 // The Director may return a readable proposal plus one fenced technical plan.
 // The surrounding prose is retained as reference, never interpreted as operations.
 const blocks=[...original.matchAll(/```json\s*([\s\S]*?)\s*```/gi)];
 if(blocks.length>1)throw Error('Hay más de un bloque JSON. Pega un único plan técnico para evitar confusiones.');
 if(blocks.length===1||/^(?:\x60\x60\x60json\s*)?\s*\{/i.test(original)){
  const plan=parseExternalPlan(blocks.length?blocks[0][1]:original);
  if(plan.sourceSha256!==sourceSha256)throw Error('El plan pertenece a otro vídeo.');
  const hasProse=blocks.length&&original.replace(blocks[0][0],'').trim();
  const items=hasProse?[{line:0,original:'Propuesta creativa adjunta',status:'reference',note:'Se conserva íntegra como referencia. Solo se ejecutarán las operaciones del JSON revisado; comprueba que incluye todas las decisiones que deseas.'}]:[];
  return {id,format:hasProse?'director-document':'json',original:text,converted:plan,items,unresolved:[]};
 }
 const operations=[],items=[],unresolved=[];
 for(const [i,line0] of text.split(/\r?\n/).entries()){
  const line=line0.trim();if(!line||/^#{1,6}\s/.test(line)||/^\|?[\s:|\-]+\|?$/.test(line))continue;
  if(/^\|?\s*(?:tiempo|segundos|inicio)\s*\|/i.test(line))continue;
  const cells=line.startsWith('|')?line.replace(/^\||\|$/g,'').split('|').map(clean):[];
  const rawTime=cells[0]??'',parts=rawTime.replace(/\s*(?:segundos?|secs?|s)\s*$/i,'').split(/\s*[-–—]\s*/);
  const start=parts.length<=2?seconds(parts[0]):null,end=parts.length===2?seconds(parts[1]):null;
  const kind=(cells[1]??'').toLowerCase(),rawId=cells[2]??'',reason=cells[3]??'';
  const asset=/^[a-f0-9]{64}$/i.test(rawId)?rawId.toLowerCase():typeof resolveId==='function'?resolveId(rawId):null;
  let op=null,note='';
  if(cells.length===4&&start!==null&&end!==null&&end>start&&kind==='b-roll'&&asset&&reason.length>=5&&reason.length<=160&&!unsafe.test(reason)){
   op={type:'broll',resourceId:asset,start,end,sourceIn:0,reason};note='B-roll a pantalla completa; inicio del recurso propuesto en 0 s. Revisa el fragmento.';
  }else if(cells.length===4&&start!==null&&kind==='sfx'&&asset&&/^\d{1,2}%$/.test(reason)){
   op={type:'sfx',resourceId:asset,start,gain:Number(reason.slice(0,-1))/100};note='Sonido completo en el segundo indicado; revisa sincronía y volumen.';
  }else if(cells.length===4&&start!==null&&end!==null&&end>start&&kind==='zoom'&&/^1\.\d{1,2}$/.test(rawId)&&reason.length>=5&&reason.length<=160&&!unsafe.test(reason)){
   op={type:'zoom',start,end,scale:Number(rawId),reason};note='Acercamiento sujeto a validación de encuadre.';
  }else if(cells.length===4&&start!==null&&kind==='transición'&&['warm','blur','radial'].includes(rawId)&&reason==='0.4'){
   op={type:'transition',resourceId:rawId,start,duration:.4};note='Transición de 0,4 s; no equivale a un apoyo semántico.';
  }
  if(op){operations.push(op);items.push({line:i+1,original:line,status:'adaptation',note,operation:op});continue;}
  let candidates=[];
  if(cells.length>=3&&typeof search==='function'){
   const query=rawId.slice(0,180).trim();
   if(query&&!/^[a-f0-9]{64}$/i.test(query)){try{candidates=search(query).slice(0,5).map(({id,title,kind,availability})=>({id,title,kind,availability}));}catch{}}
  }
  unresolved.push({line:i+1,original:line,status:'unsupported-or-ambiguous',description:'Esta instrucción necesita adaptación o datos precisos; no se ejecutará automáticamente.',candidates});
 }
 if(operations.length>60||unresolved.length>200)throw Error('El plan supera los límites de revisión.');
 return {id,format:'creative-text',original:text,converted:{schema:'sues-edit-plan/v1',sourceSha256,operations},items,unresolved};
}