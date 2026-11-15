/* SUES · Motion narrative review panel.
 * Reuses existing caption keyword dropdowns; never persists or edits a Reel.
 */
(()=>{
 const panel=document.getElementById('narrative-motion-panel');
 if(!panel)return;
 const button=document.getElementById('narrative-motion-propose'),
  status=document.getElementById('narrative-motion-status'),
  output=document.getElementById('narrative-motion-results'),
  exportBtn=document.getElementById('narrative-motion-export');
 let context=null,lastReview=null;
 const reset=message=>{
  lastReview=null;output.replaceChildren();status.textContent=message;
  exportBtn.disabled=true;button.disabled=!context;
 };
 window.addEventListener('sues:motion-context',e=>{
  const d=e.detail;
  context=d&&typeof d.jobId==='string'&&typeof d.fingerprint==='string'?d:null;
  reset(context?'Marca palabras concretas en los subtítulos de este proyecto y solicita propuestas.':'Selecciona un proyecto para revisar su narración.');
 });
 window.addEventListener('sues:plan-updated',()=>{context=null;reset('Actualizando el proyecto. Espera a que carguen los subtítulos.')});
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
  status.textContent=reply.review.candidates.length+' propuesta(s), sin ejecutar ni modificar el vídeo.';
 }
 button.addEventListener('click',async()=>{
  if(!context)return;
  const requestContext=context;
  try{
   const selections=choices();
   button.disabled=true;status.textContent='Revisando palabras reales y motivos narrativos…';
   const response=await fetch('/api/jobs/'+encodeURIComponent(requestContext.jobId)+'/motion-narrative',{
    method:'POST',credentials:'same-origin',
    headers:{'content-type':'application/json','x-sues-request':'editor'},
    body:JSON.stringify({fingerprint:requestContext.fingerprint,selections})
   });
   const result=await response.json();
   if(!response.ok)throw Error(result?.error??('HTTP '+response.status));
   if(context!==requestContext)throw Error('Se ha seleccionado otro proyecto. Repite la revisión.');
   show(result);
  }catch(error){lastReview=null;exportBtn.disabled=true;output.replaceChildren();status.textContent='Revisión bloqueada: '+error.message}
  finally{button.disabled=!context}
 });
 exportBtn.addEventListener('click',()=>{
  if(!lastReview)return;
  const blob=new Blob([lastReview.avMarkdown],{type:'text/markdown;charset=utf-8'});
  const url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download='SUES_MOTION_GUION_AV_NO_IMPORTABLE.md';link.click();
  setTimeout(()=>URL.revokeObjectURL(url),5000);
 });
 reset('Selecciona un proyecto para revisar su narración.');
})();
