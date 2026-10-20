import {createHash} from 'node:crypto';
import {prepareProject} from './local-pipeline.js';
const fail=message=>{throw Error(message);};
const keys=(value,allowed)=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).every(k=>allowed.includes(k));
export function externalCatalog(project,settings,assets=[]){
 const prepared=prepareProject(project,settings),p=prepared.plan;
 return {schema:'sues-edit-plan/v1',sourceSha256:p.source.sha256,duration:p.duration,timeSpace:'original-seconds',
  instructions:'Devuelve sólo JSON con schema, sourceSha256 y operations. Usa exclusivamente acciones y recursos descritos. No inventes IDs. Marca tus ideas no ejecutables como type: unsupported con description. Los tiempos son segundos del original; no hay cortes ni cambio de velocidad. El plan modifica la versión actual y conserva sus ajustes no mencionados. No cambies estilo ni agrupación al corregir captions.',
  actions:{transition:{type:'transition',resourceId:'warm',start:2,duration:.4,limit:'Hasta tres destellos; duración fija 0.4 s; sin solaparse ni invadir cierre. Requiere motions activados.'},image:{type:'image',resourceId:'ID de imagen de assets',start:3,end:5,limit:'Hasta seis imágenes; 0.6–8 s cada una. Requiere análisis facial existente para colocar sin tapar caras. No disponible con Whisper solo/plano completo. No seguimiento ni posición libre.'},music:{type:'music',resourceId:'ID de audio de assets',gain:.1,duck:true,limit:'Pista completa, tan larga como el vídeo; gain 0–0.18. No SFX puntuales.'},caption:{type:'caption',captionId:'seg-001',text:'Texto corregido',limit:'Conserva tiempos; hasta 52 caracteres.'},command:{type:'command',text:'menos zoom',limit:'Sólo controles globales: sin música, música al 10 %, menos zoom, sin zoom, con/sin recursos animados, con/sin efectos de sonido. No son eventos puntuales.'}},
  existingEvents:[...(p.semantic?.motions??[]).map(e=>({type:'motion',start:e.start,end:e.end})),...(p.globalTransitions??[]).map(e=>({type:e.type,start:e.start,end:e.end})),...(p.illustrations??[]).map(e=>({type:'image',start:e.start,end:e.end}))],
  unsupported:['cortes y velocidad','seguimiento de ojos/cuerpo','SFX independientes por segundo','desenfoque selectivo','posición libre de imágenes','recursos externos, URLs o código'],assets:assets.map(({id,kind,title,duration})=>({id,kind,title,...(duration?{duration}:{})})),captions:p.captions.map(({id,start,end,text})=>({id,start,end,text})),
  example:{schema:'sues-edit-plan/v1',sourceSha256:p.source.sha256,operations:[{type:'transition',resourceId:'warm',start:2,duration:.4}]}};
}
export function parseExternalPlan(text){
 if(typeof text!=='string'||text.length>30000)fail('El plan admite hasta 30000 caracteres.');
 let clean=text.trim();const fence=/^```(?:json)?\s*([\s\S]*?)\s*```$/.exec(clean);if(fence)clean=fence[1];
 let plan;try{plan=JSON.parse(clean);}catch{fail('Pega un plan JSON SUES. Usa «Copiar instrucciones para Gemini» para pedir el formato compatible.');}
 if(!keys(plan,['schema','sourceSha256','operations'])||plan.schema!=='sues-edit-plan/v1'||!Array.isArray(plan.operations)||!plan.operations.length||plan.operations.length>60)fail('Formato SUES inválido: entre 1 y 60 operaciones.');
 return plan;
}
export function reviewExternalPlan(text,{project,settings,assets=[],commandPlanner}){
 const imported=parseExternalPlan(text),baseline=prepareProject(project,settings),manifest=baseline.plan;
 if(imported.sourceSha256!==manifest.source.sha256)fail('Este plan pertenece a otro vídeo. Copia las instrucciones del proyecto correcto.');
 const next=structuredClone(settings),rows=[],seen=new Set();
 for(const [index,op]of imported.operations.entries()){
  const row={index:index+1,status:'ready',description:''};rows.push(row);
  try{
   if(!op||typeof op!=='object'||Array.isArray(op))fail('Operación inválida.');
   const signature=JSON.stringify(op);if(seen.has(signature))fail('Operación duplicada.');seen.add(signature);
   if(op.type==='transition'){
    if(!keys(op,['type','resourceId','start','duration'])||op.resourceId!=='warm') {row.status='unsupported';fail('Transición no preparada; disponible: warm (destello cálido).');}
    if(!Number.isFinite(op.start)||op.start<0||op.duration!==.4||op.start+.4>manifest.duration-manifest.policy.outro.duration)fail('Tiempo inválido o dentro del cierre. Duración del destello: 0.4 s.');
    next.transitions=[...(next.transitions??[]),{type:'warm',start:op.start}];row.description=`Destello cálido: ${op.start}–${op.start+.4} s`;
   }else if(op.type==='image'||op.type==='music'){
    const image=op.type==='image';if(!keys(op,image?['type','resourceId','start','end']:['type','resourceId','gain','duck']))fail('Parámetros de recurso no válidos.');
    const asset=assets.find(a=>a.id===op.resourceId&&a.kind===(image?'image':'audio'));
    if(!asset){row.status='missing-resource';fail('Recurso ausente en tu biblioteca: '+String(op.resourceId??'sin ID').slice(0,100));}
    if(image&&manifest.camera.mode==='full-frame-fit'){row.status='unsupported';fail('Este vídeo sólo tiene transcripción. La colocación segura de imágenes requiere análisis facial preparado.');}
    if(image){next.imageEvents=[...(next.imageEvents??[]),{assetId:asset.id,start:op.start,end:op.end}];row.description=`Imagen «${asset.title}»: ${op.start}–${op.end} s`;}
    else{if(!Number.isFinite(op.gain)||op.gain<0||op.gain>.18||typeof op.duck!=='boolean')fail('Música: gain 0–0.18 y duck true/false.');Object.assign(next,{musicAssetId:asset.id,musicEnabled:true,musicGain:op.gain,duckMusic:op.duck});row.description='Música: '+asset.title;}
   }else if(op.type==='caption'){
    if(!keys(op,['type','captionId','text'])||!manifest.captions.some(c=>c.id===op.captionId)||typeof op.text!=='string'||!op.text.trim()||op.text.length>52)fail('Subtítulo o texto inválido (máximo 52 caracteres).');
    next.captionOverrides={...next.captionOverrides,[op.captionId]:op.text};row.description='Corregir '+op.captionId+': '+op.text;
   }else if(op.type==='command'){
    if(!keys(op,['type','text'])||typeof op.text!=='string')fail('Comando inválido.');
    const proposal=commandPlanner(op.text,next);if(!proposal.canApply||!proposal.actions.length||proposal.changes.styleId!==undefined||proposal.changes.captionWords!==undefined)fail('Comando no compatible. Mantén estilo y agrupación actuales.');
    Object.assign(next,proposal.changes);row.description=proposal.actions.join('; ');
   }else{row.status='unsupported';fail('Operación no soportada: '+String(op.description??op.type??'sin tipo').slice(0,150));}
  }catch(error){if(row.status==='ready')row.status='invalid';row.description=error.message;}
 }
 const notes=[];let prepared;
 if(rows.every(r=>r.status==='ready')){
  try{
   prepared=prepareProject(project,next);
   if((next.transitions?.length||next.imageEvents?.length)&&next.motions===false)fail('Activa los recursos animados para mostrar transiciones e imágenes.');
   if(imported.operations.some(o=>o.type==='command'&&/m[uú]sica/i.test(o.text))&&next.musicEnabled&&!prepared.plan.audioSourceAvailable)fail('No hay pista musical: elige un recurso de audio de la biblioteca.');
  }catch(error){const detail=/resource overlaps motion card/.test(error.message)?'La imagen coincide con un recurso animado existente. Elige otro intervalo.':/transitions overlap/.test(error.message)?'Hay transiciones solapadas. Separa sus tiempos.':error.message;notes.push('El montaje completo no es compatible: '+detail);}
 }
 const canApply=rows.every(r=>r.status==='ready')&&!notes.length;
 const reviewId=createHash('sha256').update(JSON.stringify({imported,base:baseline.fingerprint,result:prepared?.fingerprint,rows,notes})).digest('hex');
 return {canApply,reviewId,rows,notes,changes:canApply?next:null,timeSpace:'original-seconds',duration:manifest.duration,actions:rows.filter(r=>r.status==='ready').map(r=>r.description)};
}
