/* SUES · Motion narrative review panel.
 * Reuses existing caption keyword dropdowns; never persists or edits a Reel.
 */
(()=>{
 const panel=document.getElementById('narrative-motion-panel');
 if(!panel)return;
 const button=document.getElementById('narrative-motion-propose'),
  status=document.getElementById('narrative-motion-status'),
  output=document.getElementById('narrative-motion-results'),
  exportBtn=document.getElementById('narrative-motion-export'),
  hfButton=document.getElementById('narrative-motion-hf-preflight'),
  hfStatus=document.getElementById('narrative-motion-hf-status'),
  hfOutput=document.getElementById('narrative-motion-hf-results'),
  hfExport=document.getElementById('narrative-motion-hf-export'),
  hfStage=document.getElementById('narrative-motion-hf-stage'),
  hfStageStatus=document.getElementById('narrative-motion-hf-stage-status');
 let context=null,lastReview=null,lastHF=null,reviewSerial=0;
 const reset=message=>{
  reviewSerial++;lastReview=null;output.replaceChildren();status.textContent=message;
  exportBtn.disabled=true;button.disabled=!context;
  lastHF=null;hfOutput.replaceChildren();hfExport.disabled=true;hfButton.disabled=true;hfStage.disabled=true;
  hfStageStatus.textContent='La incorporación no aprueba ni ejecuta la edición.';
  hfStatus.textContent='Primero revisa las propuestas narrativas.';
 };
 window.addEventListener('sues:motion-context',e=>{
  const d=e.detail;
  context=d&&typeof d.jobId==='string'&&typeof d.fingerprint==='string'?d:null;
  reset(context?'Marca palabras concretas en los subtítulos de este proyecto y solicita propuestas.':'Selecciona un proyecto para revisar su narración.');
 });
 window.addEventListener('sues:plan-updated',()=>{context=null;reset('Actualizando el proyecto. Espera a que carguen los subtítulos.')});
 // Any edit to the existing caption controls invalidates previous evidence and exports.
 const captions=document.getElementById('captions');
 for(const name of ['input','change'])captions?.addEventListener(name,()=>{
  if(context)reset('Ha cambiado la selección o el texto. Vuelve a analizar antes de exportar.');
 });
 function choices(){
  if(!context)return [];
  const byId=new Map(context.captions.map(c=>[c.id,c]));
  const result=[];
  for(const select of document.querySelectorAll('#captions select[data-keyword]')){
   if(select.value==='auto'||select.value==='none'||select.disabled)continue;
   const c=byId.get(select.dataset.keyword),index=Number(select.value);
   if(!c||!Number.isInteger(index)||index<0||!Array.isArray(c.wordIndexes))throw Error('La elección ya no coincide con los subtítulos actuales. Vuelve a seleccionar el proyecto.');
   const sourceWordIndex=c.wordIndexes[index],field=document.querySelector('#captions textarea[data-id="'+c.id+'"]');
   if(!Number.isInteger(sourceWordIndex)||sourceWordIndex<0||!field)throw Error('Esta palabra no tiene tiempo original verificable.');
   result.push({captionId:c.id,displayWordIndex:index,sourceWordIndex,captionText:field.value});
  }
  return result;
 }
 const textNode=(parent,tag,text)=>{const n=document.createElement(tag);n.textContent=text;parent.append(n);return n;};
 function show(reply){
  lastReview=reply;
  output.replaceChildren();
  if(!reply.review?.candidates?.length){
   textNode(output,'p','No hay propuestas justificadas por las palabras seleccionadas. No se añadirá ningún efecto.');
  }else{
   for(const c of reply.review.candidates){
    const article=document.createElement('article');article.className='narrative-motion-result';
    textNode(article,'h4',c.sourceSpeech.quote);
    textNode(article,'p',c.reason+' · '+c.visualMechanism);
    textNode(article,'p','Plantilla: '+c.templateId+' · '+c.implementation);
    textNode(article,'p','Ancla: '+c.sourceSpeech.anchorWordId+' · '+c.sourceSpeech.start.toFixed(3)+'–'+c.sourceSpeech.end.toFixed(3)+' s (tiempo del bruto)');
    textNode(article,'small','Para revisión. Pendiente: '+c.blockReasons.join('; '));
    output.append(article);
   }
  }
  exportBtn.disabled=false;
  hfButton.disabled=reply.review.candidates.length===0;
  status.textContent=reply.review.candidates.length+' propuesta(s), sin ejecutar ni modificar el vídeo.';
 }
 button.addEventListener('click',async()=>{
  if(!context)return;
  const requestContext=context,ticket=++reviewSerial;
  try{
   const selections=choices(),signature=JSON.stringify(selections);
   lastHF=null;hfOutput.replaceChildren();hfExport.disabled=true;hfButton.disabled=true;
   button.disabled=true;status.textContent='Revisando palabras reales y motivos narrativos…';
   const response=await fetch('/api/jobs/'+encodeURIComponent(requestContext.jobId)+'/motion-narrative',{
    method:'POST',credentials:'same-origin',
    headers:{'content-type':'application/json','x-sues-request':'editor'},
    body:JSON.stringify({fingerprint:requestContext.fingerprint,selections})
   });
   const result=await response.json();
   if(!response.ok)throw Error(result?.error??('HTTP '+response.status));
   if(context!==requestContext||ticket!==reviewSerial)return;
   if(JSON.stringify(choices())!==signature){reset('Las palabras han cambiado durante el análisis. Repite la revisión.');return;}
   show(result);
  }catch(error){if(requestContext===context&&ticket===reviewSerial){lastReview=null;exportBtn.disabled=true;output.replaceChildren();status.textContent='Revisión bloqueada: '+error.message}}
  finally{if(ticket===reviewSerial)button.disabled=!context}
 });
 hfButton.addEventListener('click',async()=>{
  if(!context||!lastReview)return;
  const current=context,ticket=++reviewSerial;
  try{
   const selections=choices(),signature=JSON.stringify(selections);
   hfButton.disabled=true;hfExport.disabled=true;hfStage.disabled=true;lastHF=null;hfOutput.replaceChildren();
   hfStatus.textContent='Comprobando mapa temporal y tiempos reales con HyperFrames…';
   const response=await fetch('/api/jobs/'+encodeURIComponent(current.jobId)+'/motion-hyperframes-preflight',{
    method:'POST',credentials:'same-origin',
    headers:{'content-type':'application/json','x-sues-request':'editor'},
    body:JSON.stringify({fingerprint:current.fingerprint,selections})
   });
   const body=await response.json();
   if(context!==current||ticket!==reviewSerial)return;
   if(JSON.stringify(choices())!==signature){reset('Se modificaron palabras durante el análisis. Prepara una nueva revisión.');return;}
   if(response.status===422&&body?.status==='BLOCKED_FOR_EVIDENCE'){
    hfStatus.textContent='Preparación bloqueada: falta evidencia o revisión.';
    for(const issue of body.issues??[])textNode(hfOutput,'p',issue.description+' ['+issue.code+']');
    return;
   }
   if(!response.ok)throw Error(body?.error??('HTTP '+response.status));
   if(body.schema!=='sues-editor-hyperframes-preflight/v1'||
      body.status!=='READY_FOR_CREATIVE_REVIEW'||body.canExecute!==false||
      body.creativeApproved!==false||body.rendered!==false)
    throw Error('Respuesta HyperFrames sin protección de revisión');
   lastHF=body;
   hfStatus.textContent='Composición preparada para revisión. No se ha renderizado ni editado el vídeo.';
   textNode(hfOutput,'h4','Propuesta: '+body.hyperframes.variables.line1+' '+body.hyperframes.variables.line2);
   textNode(hfOutput,'p','Continuación: '+body.hyperframes.variables.followLine1+' '+body.hyperframes.variables.followLine2);
   textNode(hfOutput,'p','Comienzo propuesto: '+body.scene.startSec.toFixed(3)+
    ' s · 151 fotogramas · 30 fps · pantalla completa (sin superponer al rostro)');
   textNode(hfOutput,'p','Palabras ancladas: '+[...body.words.card,...body.words.follow].
    map(w=>w.text+' (F'+w.editedFrame+')').join(' · '));
   textNode(hfOutput,'small','No importable: falta aprobación creativa del guion A/V, comprobación de rostro, render nativo y conexión CAS a FableCut.');
   hfExport.disabled=false;hfStage.disabled=false;
  }catch(error){
   if(context===current&&ticket===reviewSerial){lastHF=null;hfExport.disabled=true;
    hfOutput.replaceChildren();hfStatus.textContent='Preparación HyperFrames bloqueada: '+error.message;}
  }finally{
   if(context===current&&ticket===reviewSerial)hfButton.disabled=!lastReview?.review?.candidates?.length;
  }
 });
 // User explicitly stages the reviewed motion as a NEW, not-yet-approved
 // Master Director revision. The existing story is never edited in place.
 hfStage.addEventListener('click',async()=>{
  if(!context||!lastHF||lastHF.status!=='READY_FOR_CREATIVE_REVIEW')return;
  const current=context,ticket=++reviewSerial;
  hfStage.disabled=true;
  const signature=JSON.stringify(choices());
  hfStageStatus.textContent='Comprobando la revisión del guion maestro…';
  try{
   const root='/api/jobs/'+encodeURIComponent(current.jobId);
   const headResp=await fetch(root+'/master-current',{credentials:'same-origin'});
   const head=await headResp.json();
   if(!headResp.ok||!/^[a-f0-9]{64}$/.test(head.revision??''))
    throw Error('Primero debes preparar el guion maestro de este proyecto.');
   if(context!==current||ticket!==reviewSerial||JSON.stringify(choices())!==signature)return;
   const r=await fetch(root+'/motion-hyperframes-stage',{
    method:'POST',credentials:'same-origin',
    headers:{'content-type':'application/json','x-sues-request':'editor'},
    body:JSON.stringify({fingerprint:current.fingerprint,
     selections:JSON.parse(signature),expectedStoryRevision:head.revision})
   });
   const reply=await r.json();
   if(context!==current||ticket!==reviewSerial)return;
   if(JSON.stringify(choices())!==signature){reset('Las palabras cambiaron. No reutilices la revisión anterior.');return;}
   if(!r.ok)throw Error(reply.error??reply.issues?.map(i=>i.description??i.code).join('; ')??('HTTP '+r.status));
   if(reply.status!=='NEW_MASTER_DRAFT_REQUIRES_CREATIVE_APPROVAL'||
      reply.creativeApproved!==false||reply.canExecute!==false||reply.fablecutEdited!==false)
    throw Error('El editor no confirmó una revisión segura y no aprobada.');
   hfStageStatus.textContent='Motion añadido al guion maestro en una NUEVA REVISIÓN ('+
    reply.storyRevision.slice(0,12)+'…). Revisa el guion completo y aprueba creatividad antes del render.';
   lastHF=null;hfStage.disabled=true;hfExport.disabled=true;
  }catch(error){
   if(context===current&&ticket===reviewSerial){
    hfStageStatus.textContent='No se ha incorporado el motion: '+error.message;
    hfStage.disabled=!lastHF;
   }
  }
 });
 hfExport.addEventListener('click',()=>{
  if(!lastHF||lastHF.status!=='READY_FOR_CREATIVE_REVIEW'||!context)return;
  const json=JSON.stringify(lastHF.hyperframes.variables,null,2)+'\n';
  const blob=new Blob([json],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download='SUES_HYPERFRAMES_VARIABLES_REVISION_NO_APROBADA.json';link.click();
  setTimeout(()=>URL.revokeObjectURL(url),5000);
 });
 exportBtn.addEventListener('click',()=>{
  if(!lastReview)return;
  const markdown=lastHF?.avMarkdown??lastReview.avMarkdown;
  const blob=new Blob([markdown],{type:'text/markdown;charset=utf-8'});
  const url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download=lastHF?'SUES_HYPERFRAMES_GUION_AV_NO_APROBADO.md':'SUES_MOTION_GUION_AV_NO_IMPORTABLE.md';link.click();
  setTimeout(()=>URL.revokeObjectURL(url),5000);
 });
 reset('Selecciona un proyecto para revisar su narración.');
})();
