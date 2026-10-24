const googleLoginFailed=new URLSearchParams(location.search).get('google')==='failed';
let design=null,designProfile=null,assetLibrary=[],editingRoute=null,comparisonRequest=null,automaticReviewKey=null,intakePhase='edit',pendingUploadId=null,allUploads=[];
const $=id=>document.getElementById(id);let current=null,plan=null,working=false,editorStep='material-panel',previewDirty=false,playerView='original',localVideoURL=null;
const stateNames={DRAFT:'Borrador',UPLOADED:'Vídeo guardado',ANALYZING:'Preparando',PLANNED:'Plan preparado',PREVIEW_READY:'Listo para editar',ADJUSTING:'Guardando ajustes',QUEUED:'En cola',RENDERING:'Editando vídeo',PUBLISHING:'Guardando vídeo',DONE:'Edición lista',FAILED:'Requiere atención',PUBLISH_FAILED:'Guardado pendiente',CANCELLED:'Cancelado'};
function editability(editable){for(const id of ['voice-gain','level-resources','elements-format','zoom','motions','caption-words','sfx-asset','sfx-start','sfx-event-gain','add-sfx','sfx-enabled','sfx-gain','music-enabled','music-gain','music-duck','music-asset','profile-images','image-asset','image-start','image-end','add-image'])$(id).disabled=!editable;$('adjustment-help').textContent=editable?'Aplica los cambios para revisar la nueva edición.':current?'Crea otra versión para ajustar un montaje ya exportado o en proceso.':'Prepara o recupera un montaje para ajustar su imagen, sonido y subtítulos.';}
let pollTimer=null,setupToken=null;
function authenticated(value){$('setup-screen').hidden=true;$('login-screen').hidden=value;for(const id of ['editor-view','dashboard-view','project-bar','templates-view','brand-view','library-view'])$(id).hidden=true;$('logout').hidden=!value;document.querySelector('.studio-tools').hidden=!value;$('intro').hidden=true;if(value)showView('dashboard');if(!value){clearInterval(pollTimer);$('source-video').pause();$('video').pause();$('login-password').value='';}}
const error=e=>{$('error').textContent=e.message??String(e);$('error').dataset.transient=String(e.transient===true);$('error').hidden=false;};
async function api(path,method='GET',body){
 if(path==='jobs'&&method==='POST'&&current&&body?.profileId===current.profileId&&!body.newProject)body={...body,parentId:current.id};
 for(let attempt=0;attempt<2;attempt++){
  let response;
  try{response=await fetch('/api/'+path,{method,credentials:'same-origin',headers:{'Content-Type':'application/json','X-Sues-Request':'editor'},...(body?{body:JSON.stringify(body)}:{})});}
  catch{if(method==='GET'&&attempt===0){await new Promise(r=>setTimeout(r,300));continue;}const e=new Error('La conexión se ha interrumpido. El trabajo guardado continúa en el servidor; vuelve a comprobar su estado.');e.transient=true;throw e;}
  let value;try{value=JSON.parse(await response.text());}catch{value=null;}
  const transient=[502,503,504].includes(response.status);
  if(method==='GET'&&attempt===0&&transient){await new Promise(r=>setTimeout(r,300));continue;}
  if(!response.ok||value===null){
   if(response.status===401)authenticated(false);
   const e=new Error(value?.error??(transient?'El servidor tarda en responder. La edición continúa; vuelve a comprobarla.':'No se pudo leer la respuesta del editor. Tus vídeos se conservan.'));
   e.status=response.status;e.transient=transient;throw e;
  }
  if(method==='GET'&&$('error').dataset.transient==='true')$('error').hidden=true;
  return value;
 }
}

async function work(fn){if(working)return;working=true;$('render').disabled=true;$('tool-panel').setAttribute('aria-busy','true');$('error').hidden=true;try{await fn();}catch(e){error(e);}finally{working=false;$('tool-panel').removeAttribute('aria-busy');$('render').disabled=!current||!['PREVIEW_READY','DONE','FAILED','PUBLISH_FAILED'].includes(current.state)||(current.state==='DONE'&&!previewDirty);syncDirector();}}
function settings({preserveAnchors=false}={}){const captionOverrides={};for(const field of $('captions').querySelectorAll('textarea')){const original=plan.manifest.captions.find(c=>c.id===field.dataset.id);if(!original)continue;if(field.value.trim()!==(original.originalText??original.text))captionOverrides[field.dataset.id]=field.value.trim();}const keywordOverrides={};for(const choice of $('captions').querySelectorAll('select[data-keyword]')){const id=choice.dataset.keyword;if(choice.value==='none')keywordOverrides[id]={level:'none'};else if(choice.value!=='auto')keywordOverrides[id]={word:Number(choice.value),level:$('captions').querySelector('[data-level="'+id+'"]').value,style:$('captions').querySelector('[data-style="'+id+'"]').value,scale:Number($('captions').querySelector('[data-scale="'+id+'"]').value)};}const motionChoices=[];for(const select of $('captions').querySelectorAll('[data-motion-choice]'))if(select.value!=='none')motionChoices.push({captionId:select.dataset.motionChoice,type:select.value,...(select.value==='number'?{number:Number($('captions').querySelector('[data-motion-number="'+select.dataset.motionChoice+'"]').value)}:{})});const graphicCards=[],transitions=(current?.settings.transitions??[]).filter(t=>t.start!==undefined);for(const select of $('captions').querySelectorAll('[data-card]'))if(select.value!=='none'){const id=select.dataset.card;const get=key=>$('captions').querySelector('[data-'+key+'="'+id+'"]').value.trim(),heading=get('card-heading'),bodyLines=[get('card-body-one'),get('card-body-two'),...(current?.settings.graphicCards?.find(c=>c.captionId===id)?.bodyLines?.slice(2)??[])].filter(Boolean),lead=get('card-lead'),iconSet=get('card-icons');graphicCards.push({captionId:id,type:select.value,...(get('card-end')?{endCaptionId:get('card-end')}:{}),...(select.value==='compare'?{left:get('card-left'),right:get('card-right')}:{}),...(select.value==='grid'&&heading?{heading}:{}),...(select.value==='grid'&&bodyLines.length?{bodyLines}:{}),...(select.value==='secret'&&lead?{lead}:{}),...(select.value!=='secret'&&iconSet!=='none'?{icons:iconSet==='creative'?['clapper','makeup']:iconSet==='reflection'?['eye','heart']:['luggage','clock']}:{})});}for(const select of $('captions').querySelectorAll('[data-transition]'))if(select.value!=='none')transitions.push({captionId:select.dataset.transition,type:select.value,...($('captions').querySelector('[data-card-exit="'+select.dataset.transition+'"]').checked?{phase:'exit'}:{})});const regroup=!preserveAnchors&&(Number($('caption-words').value)!==(current.settings.captionWords??3)||$('style-id').value!==(current.settings.styleId??'SUES_CALMA'));return {...structuredClone(current?.settings??{}),voiceGain:Number($('voice-gain').value)/100,levelResources:$('level-resources').checked,autoRecipe:current?.settings.autoRecipe??false,elements:regroup?null:elementSettings(),sfxEvents:[...$('sfx-events').querySelectorAll('[data-sfx-event]')].map(row=>JSON.parse(row.dataset.sfxEvent)),sfxEnabled:$('sfx-enabled').checked,sfxGain:Number($('sfx-gain').value)/100,styleId:$('style-id').value,musicAssetId:$('music-asset').value||null,profileImages:$('profile-images').checked,imageEvents:[...$('image-events').querySelectorAll('[data-image-event]')].map(row=>JSON.parse(row.dataset.imageEvent)),motionChoices:regroup?[]:motionChoices,graphicCards:regroup?[]:graphicCards,transitions:regroup?[]:transitions,keywordOverrides:regroup?{}:keywordOverrides,musicEnabled:$('music-enabled').checked,musicGain:Number($('music-gain').value)/100,duckMusic:$('music-duck').checked,captionWords:Number($('caption-words').value),zoomIntensity:Number($('zoom').value)/100,motions:$('motions').checked,captionOverrides:regroup?{}:captionOverrides,highlightCaptions:regroup?[]:[...$('captions').querySelectorAll('button[data-highlight][aria-pressed="true"]')].map(b=>b.dataset.highlight)};}
let allJobs=[],activeView='dashboard';
const projectKey=job=>job.projectId??job.profileId;
async function list(){
 const health=await api('health');$('queue-summary').textContent=`${health.queue.rendering} en proceso · ${health.queue.waiting} en cola`;
 allJobs=await api('jobs');$('jobs').replaceChildren();
 const versions=allJobs.filter(j=>current&&projectKey(j)===projectKey(current));
 for(const [index,job] of versions.entries()){const b=document.createElement('button');b.textContent='Versión '+(versions.length-index)+' · '+(job.settings.styleId==='SUES_DOPAMIN'?'DINÁMICA':job.settings.styleId.replace('SUES_',''))+' · '+(stateNames[job.state]??job.state)+' · '+new Date(job.createdAt).toLocaleString('es-ES',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});b.classList.toggle('active',current?.id===job.id);b.onclick=()=>{if(leaveProject())work(()=>select(job.id));};$('jobs').append(b);}
 renderDashboard();
}
function renderDashboard(){
 const groups=new Map();for(const job of allJobs){const key=projectKey(job);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(job);}
 const query=$('project-search').value.trim().toLocaleLowerCase('es');$('project-grid').replaceChildren();let count=0;
 for(const versions of groups.values()){
  const latest=versions[0],title=latest.projectTitle??latest.title;if(query&&!title.toLocaleLowerCase('es').includes(query))continue;count++;
  const card=node('button',undefined,'project-card');card.type='button';card.setAttribute('aria-label','Abrir proyecto '+title);
  const art=node('div',undefined,'project-art'),icon=node('span','▷','project-art-icon'),style=(latest.settings.styleId??'SUES_CALMA').replace('SUES_','');
  art.dataset.style=style;art.append(icon,node('span',style,'project-style'));const rendered=versions.find(j=>j.state==='DONE');if(rendered){const poster=node('img');poster.alt='';poster.loading='lazy';poster.src='/api/jobs/'+rendered.id+'/poster';poster.onerror=()=>poster.remove();art.prepend(poster);}
  const content=node('div',undefined,'project-card-content');content.append(node('h3',title),node('p',(latest.summary?.duration?.toFixed(0)??'—')+' s · '+versions.length+' '+(versions.length===1?'versión':'versiones'),'small'),node('span',stateNames[latest.state]??latest.state,'project-state'),node('p',new Date(latest.updatedAt??latest.createdAt).toLocaleDateString('es-ES',{day:'numeric',month:'long'}),'project-date'));
  card.append(art,content);card.onclick=()=>{if(leaveProject())work(()=>select(latest.id));};$('project-grid').append(card);
 }
 const pending=allUploads.filter(u=>!allJobs.some(j=>j.profileId===u.profileId||j.profileId==='upload-'+u.id));
 for(const u of pending){if(query&&!u.name.toLocaleLowerCase('es').includes(query))continue;count++;const card=node('button',undefined,'project-card');card.type='button';card.setAttribute('aria-label','Abrir proyecto '+u.name);const art=node('div',undefined,'project-art');art.append(node('span','▷','project-art-icon'));const content=node('div',undefined,'project-card-content');content.append(node('h3',u.name),node('p',u.duration.toFixed(0)+' s · vídeo guardado','small'),node('span',u.state==='READY'?'Listo para editar':'Análisis pendiente','project-state'),node('p',u.brief?'Prompt guardado':'Añade tus instrucciones','project-date'));card.append(art,content);card.onclick=()=>{if(leaveProject())work(()=>resumeUpload(u.id));};$('project-grid').append(card);}
 $('project-count').textContent=String(groups.size+pending.length);$('dashboard-empty').hidden=groups.size+pending.length>0;$('dashboard-status').textContent=query&&!count?'No hay proyectos con ese nombre.':'';
}
function hasUnsavedChanges(){const prompt=$('director-prompt').value.trim(),saved=allUploads.find(u=>u.id===pendingUploadId)?.brief?.prompt;return previewDirty||!!prompt&&prompt!==saved;}
function leaveProject(){return !hasUnsavedChanges()||confirm('Hay cambios sin generar. ¿Quieres salir de esta edición? La versión guardada se conserva.');}
function newProject(){
 if(!leaveProject())return;setIntake('upload');resetForNewSource('Nuevo proyecto');$('upload-step').dataset.state='idle';$('upload-status').textContent='Hasta 250 MiB y 10 minutos. Tu vídeo se guarda de forma privada.';$('upload-meter').hidden=true;$('selected-video-status').textContent='Selecciona el vídeo que quieres editar.';$('material-options').open=false;$('source-video').pause();$('source-video').removeAttribute('src');$('source-video').load();$('upload-video').value='';$('project-name').value='';$('new-project-style').value='SUES_CALMA';$('style-id').value='SUES_CALMA';$('director-prompt').value='';$('director-response').replaceChildren();$('instruction-list').replaceChildren();$('director-reset-label').hidden=true;showPlayer('original');showTool('material');syncDirector();history.replaceState(null,'','?new=1');
}
function hasVisualEdits(job){
 const c=job?.summary?.editionCounts,s=job?.settings??{};
 if(c)return !!(c.zoomCycles+c.motions+c.cards+c.transitions+c.images+(s.videoEvents?.length??0)+(s.overlayEvents?.length??0));
 return !!(job?.summary?.zooms||job?.summary?.motions||job?.summary?.transitions||s.imageEvents?.length||s.videoEvents?.length||s.overlayEvents?.length);
}
function showPlayer(view){
 playerView=view==='preview'&&current?.state==='DONE'&&!previewDirty?'preview':'original';
 const original=!!$('source-video').getAttribute('src'),preview=playerView==='preview';document.body.dataset.hasSource=String(original||preview);
 $('source-video').hidden=preview||!original;$('video').hidden=!preview;$('placeholder').hidden=preview||original;
 $('view-original').setAttribute('aria-pressed',String(!preview));$('view-preview').setAttribute('aria-pressed',String(preview));
 $('player-label').textContent=preview?(hasVisualEdits(current)?'VÍDEO EDITADO · puedes previsualizar y exportar':'SUBTÍTULOS GENERADOS · sin zooms ni gráficos'):original?'VÍDEO ORIGINAL · todavía sin editar':'Selecciona un vídeo para verlo aquí';
 if(preview)$('source-video').pause();else{$('video').pause();originalPlaybackSupport();}
}
function originalVideo(url,name){
 if(localVideoURL&&!url.startsWith('blob:')){URL.revokeObjectURL(localVideoURL);localVideoURL=null;}
 if($('source-video').getAttribute('src')!==url){$('source-video').src=url;$('source-video').load();}
 if(name)$('job-title').textContent=name;showPlayer('original');
}
function markPreviewDirty(){
 automaticReviewKey=null;
 previewDirty=true;$('state').textContent='Cambios pendientes';$('save-status').textContent='Cambios pendientes de generar';$('export-video').disabled=true;$('view-preview').disabled=true;$('download').hidden=true;
 $('render').textContent='Aplicar cambios con IA';if(current&&['PREVIEW_READY','DONE','FAILED'].includes(current.state))$('render').disabled=false;if(playerView==='preview')$('player-label').textContent='Vista previa anterior · hay cambios sin aplicar';$('workflow-status').textContent='Tienes cambios pendientes. Aplica los cambios para revisar y exportar la nueva versión.';
 if(current?.state==='DONE')$('undo').disabled=false;
}
function resetForNewSource(name){
 editingRoute=null;comparisonRequest=null;$('comparison-results').replaceChildren();$('render-state-overlay').hidden=true;
 clearTimeout(analysisTimer);analysisBusy=false;$('analysis-status').textContent='';$('basic-edit').hidden=true;setIntake('upload');pendingUploadId=null;$('upload-step').dataset.state='idle';$('upload-meter').hidden=true;$('upload-status').textContent='Selecciona un vídeo para empezar.';
 if(current){$('director-prompt').value='';$('director-response').replaceChildren();$('project-name').value=name.slice(0,120);}current=null;plan=null;previewDirty=false;$('captions').replaceChildren();$('caption-count').textContent='';$('video').pause();$('video').removeAttribute('src');
 editability(false);for(const id of ['render','export-video','view-preview','save','undo','backup','duplicate'])$(id).disabled=true;
 $('download').hidden=true;$('state').textContent='Vídeo seleccionado';$('progress').textContent='';$('job-title').textContent=name;
 $('workflow-status').textContent='Puedes reproducir el original. Pulsa Subir vídeo para guardarlo y comprobar su análisis.';syncDirector();
}
function display(job){
 const previous=current?.state;current=job;const editable=['PREVIEW_READY','DONE'].includes(job.state),ready=job.state==='DONE';
 $('job-title').textContent=job.projectTitle??job.title;$('project-heading').textContent=job.projectTitle??job.title;$('state').textContent=job.state==='DONE'?(hasVisualEdits(job)?'VÍDEO EDITADO':'SIN ZOOMS NI GRÁFICOS'):stateNames[job.state]??job.state;const summary=job.summary;
 $('studio-style').textContent='Plantilla · '+(summary?.styleId??'SUES_CALMA').replace('SUES_','');
 $('summary').textContent=summary?`${summary.duration.toFixed(2)} s · ${summary.mappedWords}/${summary.sourceWords} palabras`:'';
 editability(editable);$('save').disabled=!editable;$('undo').disabled=!job.canUndo;
 $('style-id').disabled=!editable;for(const field of [...$('captions').querySelectorAll('textarea,button,select,input'),...$('image-events').querySelectorAll('button')])field.disabled=!editable;
 $('render').disabled=!['PREVIEW_READY','DONE','FAILED','PUBLISH_FAILED'].includes(job.state);$('render').hidden=false;$('render').textContent=ready?(previewDirty?'Aplicar instrucciones a nueva versión':'Vídeo editado'):job.state==='PUBLISH_FAILED'?'Reintentar guardado':'Ejecutar instrucciones y editar vídeo';if(ready&&!previewDirty)$('render').disabled=true;syncDirector();
 $('cancel').hidden=!['QUEUED','RENDERING','PUBLISHING'].includes(job.state);$('cancel').disabled=job.cancelRequested??false;
 $('duplicate').disabled=false;$('backup').disabled=!['PREVIEW_READY','DONE'].includes(job.state)||job.backupBusy;$('backup-download').hidden=!job.backupReady;
 if(job.backupReady){$('backup-download').href='/api/jobs/'+job.id+'/backup';$('backup-download').download='SUES_PROYECTO.tar';}
 $('render-meter').hidden=!['QUEUED','RENDERING','PUBLISHING'].includes(job.state)||job.progress?.percent===null||job.progress?.percent===undefined;$('render-meter').value=job.progress?.percent??0;
 $('progress').textContent=job.state==='PUBLISHING'?'Guardando vídeo editado…':job.state==='QUEUED'?'Editando vídeo · en cola…':job.state==='RENDERING'?`Editando vídeo · ${job.progress?.percent??0} %`:job.error??'';
 const rendering=['QUEUED','RENDERING','PUBLISHING'].includes(job.state);$('render-state-overlay').hidden=!rendering;
 if(rendering){$('render-state-title').textContent='EDITANDO VÍDEO';$('render-state-detail').textContent=job.state==='RENDERING'?`Plantilla ${job.settings.styleId==='SUES_DOPAMIN'?'DOPAMIN':'CALMA'} · ${job.progress?.percent??0} %`:job.state==='QUEUED'?'Edición en cola · conservamos el vídeo original':'Comprobando la edición final';$('source-video').pause();$('video').pause();}
 $('view-preview').disabled=!ready||previewDirty;$('export-video').disabled=!ready||previewDirty;$('export-from-settings').disabled=$('render').disabled;
 $('export-from-settings').textContent='Editar con IA';$('editorial-review').hidden=!ready;
 $('workflow-status').textContent=ready?'Revisa tu edición. Puedes exportarla o pedir cambios.':editable?'Elige el estilo, añade instrucciones si quieres y pulsa Editar con IA.':'El original sigue disponible mientras se prepara el montaje.';
 if(ready){const url='/api/jobs/'+job.id+'/media';if($('video').getAttribute('src')!==url){$('video').src=url;$('video').load();}$('download').href=url;$('download').download=(summary?.styleId??'SUES_CALMA')+'.mp4';if(previous!=='DONE')showPlayer('preview');}
 else{$('download').hidden=true;showPlayer('original');}
}
async function select(id,{keepPrompt=false}={}){if(!keepPrompt)setIntake('edit');const changed=current?.id!==id;if(changed&&!keepPrompt){$('director-prompt').value='';$('director-response').replaceChildren();$('director-reset-label').hidden=true;}previewDirty=false;$('download').hidden=true;const job=await api('jobs/'+id);const upload=allUploads.find(u=>u.profileId===job.profileId);pendingUploadId=upload?.id??null;if(!keepPrompt||!$('director-prompt').value.trim())$('director-prompt').value=(job.instructions?.at(-1)?.kind==='external-plan'?'':job.instructions?.at(-1)?.text)??upload?.brief?.prompt??'';if(designProfile!==job.profileId)await loadDesign(job.profileId);for(const [field,key]of [['review-captions','captionsReviewed'],['review-framing','framingReviewed'],['review-audio','audioReviewed']])$(field).checked=job.editorialReview?.[key]??false;for(const [field,key]of [['review-major','majorChanges'],['review-minor','minorChanges']])$(field).value=job.editorialReview?.[key]??0;$('review-status').textContent=job.editorialReview?(job.editorialReview.pass?'Aprobación estética registrada para esta versión.':'Revisión guardada · quedan ajustes o comprobaciones.'):'Revisión pendiente para esta versión.';plan=await api('jobs/'+id+'/plan');$('style-id').value=job.settings.styleId??'SUES_CALMA';$('new-project-style').value=$('style-id').value;$('elements-format').value=job.settings.elements?.format??'';$('elements-help').hidden=!$('elements-format').value;$('zoom').value=Math.round(job.settings.zoomIntensity*100);$('zoom-value').textContent=$('zoom').value+' %';$('motions').checked=job.settings.motions;$('caption-words').value=String(job.settings.captionWords??3);$('sfx-enabled').checked=job.settings.sfxEnabled??false;$('voice-gain').value=Math.round((job.settings.voiceGain??1)*100);$('voice-value').textContent=$('voice-gain').value+' %';$('level-resources').checked=job.settings.levelResources??false;$('sfx-gain').value=Math.round((job.settings.sfxGain??.35)*100);$('sfx-value').textContent=$('sfx-gain').value+' %';$('music-enabled').checked=job.settings.musicEnabled??true;$('music-duck').checked=job.settings.duckMusic??true;$('music-gain').value=Math.round((job.settings.musicGain??plan.manifest.audioMix?.gain??.16)*100);$('music-value').textContent=$('music-gain').value+' %';$('music-status').textContent=plan.manifest.audioSourceAvailable?'Pista ambiental disponible en este material.':'Este material no tiene una pista musical preparada.';$('profile-images').checked=job.settings.profileImages??true;await refreshAssets();$('music-asset').value=job.settings.musicAssetId??'';$('image-events').replaceChildren();for(const e of job.settings.imageEvents??[])appendImageEvent(e);$('sfx-events').replaceChildren();for(const e of job.settings.sfxEvents??[])appendSfxEvent(e);$('captions').replaceChildren();$('caption-search').value='';$('caption-search-status').textContent='';
 window.dispatchEvent(new Event('sues:plan-updated'));
 $('external-plan-text').value=(await api('jobs/'+job.id+'/external-draft')).text;
 for(const c of plan.manifest.captions){const div=document.createElement('details');div.className='caption';const heading=document.createElement('summary');heading.textContent=c.start.toFixed(1)+'–'+c.end.toFixed(1)+' s · '+c.text;div.append(heading);const label=document.createElement('label');label.htmlFor='caption-'+c.id;label.textContent=c.start.toFixed(1)+'–'+c.end.toFixed(1)+' s';const field=document.createElement('textarea');field.id=label.htmlFor;field.dataset.id=c.id;field.value=c.text;field.maxLength=52;const highlight=document.createElement('button');highlight.type='button';highlight.dataset.highlight=c.id;const selected=job.settings.highlightCaptions?.includes(c.id)??false;highlight.setAttribute('aria-pressed',String(selected));highlight.textContent=selected?'Frase destacada ✓':'Destacar esta frase';highlight.onclick=()=>{const active=highlight.getAttribute('aria-pressed')==='true';if(!active&&$('captions').querySelectorAll('button[data-highlight][aria-pressed="true"]').length>=3){error(new Error('Puedes destacar hasta tres frases. Quita una antes de elegir otra.'));return;}highlight.setAttribute('aria-pressed',String(!active));highlight.textContent=active?'Destacar esta frase':'Frase destacada ✓';markPreviewDirty();};div.append(label,field,keywordControls(c,job,field),highlight,graphicControls(c,job),motionControls(c,job),elementControls(c,job));$('captions').append(div);}$('caption-count').textContent='('+plan.manifest.captions.length+')';originalVideo('/api/jobs/'+job.id+'/source',job.title);display(job);if(job.state==='DONE')showPlayer('preview');$('save-status').textContent='Ajustes guardados';await reviewPlan(id);await list();if(changed)showTool('director');syncDirector();history.replaceState(null,'','?project='+encodeURIComponent(id)+(intakePhase==='prompt'?'&step=prompt':''));}
$('voice-gain').oninput=()=>{$('voice-value').textContent=$('voice-gain').value+' %';};
$('sfx-gain').oninput=()=>{$('sfx-value').textContent=$('sfx-gain').value+' %';};
$('music-gain').oninput=()=>{$('music-value').textContent=$('music-gain').value+' %';};
$('zoom').oninput=()=>{$('zoom-value').textContent=$('zoom').value+' %';};
async function refreshProfiles(selected){const profiles=await api('profiles');$('profile').replaceChildren();for(const p of profiles){const option=document.createElement('option');option.value=p.id;option.textContent=p.title+(p.ready?'':' · pendiente de material');option.dataset.ready=String(p.ready);$('profile').append(option);}if(selected)$('profile').value=selected;$('create').disabled=!profiles.find(p=>p.id===$('profile').value)?.ready;$('upload').classList.add('primary');return profiles;}
async function refreshUploads(){const uploads=await api('uploads');allUploads=uploads;$('uploads').replaceChildren();for(const u of uploads){const card=document.createElement('div');card.className='upload-card';const play=document.createElement('button');play.textContent='Ver original';play.onclick=()=>{if(!leaveProject())return;resetForNewSource(u.name);originalVideo('/api/uploads/'+u.id+'/media',u.name);$('workflow-status').textContent=u.state==='READY'?'Vídeo guardado. Pulsa Preparar montaje para editar.':'Vídeo guardado. Necesita análisis antes de previsualizar el montaje.';};card.append(play);const label=document.createElement('p');label.textContent=(u.name??'Vídeo subido')+' · '+u.duration.toFixed(1)+' s · '+new Date(u.createdAt).toLocaleString('es-ES')+' · '+(u.bytes/1024/1024).toFixed(1)+' MiB';const state=document.createElement('p');state.className='small';state.textContent=u.state==='READY'?'Listo para CALMA':u.state==='WAITING_ASSETS'?'Vídeo guardado · falta recuperar su análisis':'Vídeo guardado · análisis pendiente';card.append(label,state);if(u.state==='READY'){const use=document.createElement('button');use.textContent='Preparar montaje';use.onclick=()=>work(async()=>{const job=await api('jobs','POST',{profileId:u.profileId,newProject:true,projectTitle:$('project-name').value.trim()||undefined,settings:{styleId:$('new-project-style').value}});await select(job.id,{keepPrompt:true});if(intakePhase!=='edit'){setIntake('prompt');$('upload-step').dataset.state='complete';$('upload-meter').value=100;$('upload-meter').hidden=false;$('upload-status').textContent='Material guardado preparado';showTool('director');}});card.append(use);}else{const details=document.createElement('details'),summary=document.createElement('summary'),file=document.createElement('input'),help=document.createElement('p');summary.textContent='Recuperar análisis guardado';file.type='file';file.accept='.json,application/json';file.setAttribute('aria-label','Archivo de análisis del vídeo');help.className='small';help.textContent='Sólo si ya tienes el análisis de este mismo vídeo. Se comprobarán su identidad, tiempos y encuadre.';file.onchange=()=>work(async()=>{const selected=file.files[0];if(!selected)return;if(selected.size>2*1024*1024)throw new Error('El análisis supera 2 MiB');const data=JSON.parse(await selected.text());const result=await api('uploads/'+u.id+'/analysis','POST',data);await refreshProfiles(result.profileId);await refreshUploads();$('upload-status').textContent='Análisis recuperado. Ya puedes preparar CALMA.';});details.append(summary,help,file);card.append(details);}$('uploads').append(card);}return uploads;}
$('upload').onclick=()=>work(async()=>{if(['complete','error'].includes($('upload-step').dataset.state)){$('upload-video').value='';$('upload-video').click();return;}const file=$('upload-video').files[0];if(!file){$('upload-video').click();return;}if(file.size>250*1024*1024)throw new Error('El vídeo supera 250 MiB');$('upload').disabled=true;$('upload-step').dataset.state='uploading';$('upload-status').textContent='Subiendo vídeo…';let uploadAccepted=false;$('upload-meter').hidden=false;$('upload-meter').value=0;try{const uploaded=await new Promise((resolve,reject)=>{const xhr=new XMLHttpRequest();xhr.open('POST','/api/uploads?name='+encodeURIComponent(file.name));xhr.timeout=900000;xhr.ontimeout=()=>reject(new Error('La subida tardó demasiado. Vuelve a intentarlo con conexión estable.'));xhr.setRequestHeader('Content-Type',file.type||'application/octet-stream');xhr.setRequestHeader('X-Sues-Request','editor');xhr.upload.onprogress=e=>{if(e.lengthComputable){$('upload-meter').value=e.loaded/e.total*100;$('upload-status').textContent=e.loaded===e.total?'Subida recibida · comprobando vídeo…':'Subiendo · '+Math.round(e.loaded/e.total*100)+' %';}};xhr.onload=()=>{try{const v=JSON.parse(xhr.responseText);if(xhr.status!==201)throw new Error(v.error||'No se pudo subir');resolve(v);}catch(e){reject(e);}};xhr.onerror=()=>reject(new Error('La conexión se interrumpió. Vuelve a subir el vídeo.'));xhr.send(file);});uploadAccepted=true;pendingUploadId=uploaded.id;setIntake('prompt');history.replaceState(null,'','?upload='+uploaded.id+'&step=prompt');$('upload-step').dataset.state='complete';$('upload-meter').value=100;$('upload-meter').hidden=false;$('upload-status').textContent='Subida completada';if(!$('project-name').value.trim())$('project-name').value=file.name.replace(/\.[^.]+$/,'').slice(0,120);showTool('director');$('selected-video-status').textContent=file.name+' · subida completada';originalVideo('/api/uploads/'+uploaded.id+'/media',file.name);await refreshProfiles(uploaded.profileId);await refreshUploads();if(!uploaded.profileId){$('profile').selectedIndex=-1;$('create').disabled=true;}if(uploaded.state==='READY'){$('director-context').textContent='Preparando el vídeo para recibir tus instrucciones…';await loadDesign(uploaded.profileId);const job=await api('jobs','POST',{profileId:uploaded.profileId,newProject:true,projectTitle:$('project-name').value.trim()||undefined,settings:{styleId:$('new-project-style').value}});await select(job.id,{keepPrompt:true});$('director-context').textContent='Vídeo preparado. Escribe tus instrucciones y pulsa Enviar prompt.';}else $('director-context').textContent=uploaded.state==='WAITING_ASSETS'?'Vídeo guardado. Falta restaurar el análisis o las fuentes en el servidor.':'Vídeo guardado. Su transcripción y encuadre aún necesitan análisis; no se ha realizado ningún consumo de pago.';$('workflow-status').textContent=uploaded.state==='READY'?'Escribe tus instrucciones y pulsa Enviar prompt.':'Vídeo subido y reproducible. Falta su análisis antes de editar o previsualizar.';}catch(e){if(!uploadAccepted){$('upload-step').dataset.state='error';$('upload-status').textContent='No se ha completado la subida. Vuelve a intentarlo.';}throw e;}finally{$('upload').disabled=false;syncDirector();}});
$('recover-project').onclick=()=>work(async()=>{
 const file=$('recovery-file').files[0];
 if(!file)throw new Error('Selecciona primero tu copia del proyecto SUES (.tar)');
 if(file.size<1||file.size>512*1024*1024)throw new Error('La copia debe ocupar entre 1 byte y 512 MiB');
 $('recover-project').disabled=true;$('recovery-file').disabled=true;
 $('recovery-meter').hidden=false;$('recovery-meter').value=0;
 $('recovery-status').textContent='Subiendo la copia privada…';
 try{
  const result=await new Promise((resolve,reject)=>{
   const xhr=new XMLHttpRequest();xhr.open('POST','/api/recoveries');xhr.timeout=900000;
   xhr.setRequestHeader('Content-Type','application/x-tar');xhr.setRequestHeader('X-Sues-Request','editor');
   xhr.upload.onprogress=e=>{if(e.lengthComputable){$('recovery-meter').value=e.loaded/e.total*100;$('recovery-status').textContent=e.loaded===e.total?'Copia recibida. Comprobando archivos y preparando el montaje…':'Subiendo copia · '+Math.round(e.loaded/e.total*100)+' %';}};
   xhr.onload=()=>{try{const data=JSON.parse(xhr.responseText);if(xhr.status!==201)throw new Error(xhr.status===401?'Abre de nuevo tu enlace privado para recuperar la sesión.':data.error||'No se pudo recuperar el proyecto');resolve(data);}catch(error){reject(error);}};
   xhr.onerror=()=>reject(new Error('La conexión se interrumpió. Puedes volver a subir la misma copia.'));
   xhr.ontimeout=()=>reject(new Error('La recuperación tardó demasiado. Vuelve a intentarlo con una conexión estable.'));
   xhr.send(file);
  });
  await refreshProfiles(result.recovery.profileId);await loadDesign(result.recovery.profileId);await select(result.job.id);
  $('recovery-status').textContent='Proyecto recuperado con sus ajustes. Revisa los subtítulos y exporta.';
  $('recovery-file').value='';setIntake('edit');showView('editor');$('job-title').scrollIntoView({behavior:'smooth',block:'center'});
 }catch(error){$('recovery-status').textContent='La recuperación no ha terminado. Tu copia y tus trabajos anteriores se conservan.';throw error;}
 finally{$('recover-project').disabled=false;$('recovery-file').disabled=false;$('recovery-meter').hidden=true;}
});
$('create').onclick=()=>work(async()=>{const job=await api('jobs','POST',{profileId:$('profile').value,settings:{styleId:$('style-id').value},newProject:true,projectTitle:$('project-name').value.trim()||undefined});await select(job.id,{keepPrompt:true});if(intakePhase!=='edit'){setIntake('prompt');$('upload-step').dataset.state='complete';$('upload-meter').value=100;$('upload-meter').hidden=false;$('upload-status').textContent='Material guardado preparado';showTool('director');}});
$('save').onclick=()=>work(async()=>{if(current.state==='DONE'){if(!previewDirty)return;const job=await api('jobs','POST',{profileId:current.profileId,settings:settings()});await select(job.id,{keepPrompt:true});if($('director-prompt').value.trim())markPreviewDirty();}else{await api('jobs/'+current.id,'PATCH',{settings:settings()});await select(current.id);}});
$('undo').onclick=()=>work(async()=>{$('director-prompt').value='';if(current.state!=='DONE')await api('jobs/'+current.id+'/undo','POST',{});await select(current.id);});
$('render').onclick=()=>work(async()=>{
 $('render-state-overlay').hidden=false;$('render-state-title').textContent='EDITANDO VÍDEO';$('render-state-detail').textContent='Preparando el montaje con tus instrucciones…';
 try{
 if(current.state==='PUBLISH_FAILED'){display(await api('jobs/'+current.id+'/render','POST',{}));return;}
 if(editingRoute==='automatic'&&automaticReviewKey!==automaticKey())throw Error('Analiza y revisa la propuesta antes de ejecutar la edición.');
 const prompt=$('director-prompt').value.trim(),base=proposalBase();
 const proposal=await api('jobs/'+current.id+'/direct-plan','POST',{prompt,settings:base});showProposal(proposal);
 if(!proposal.canApply)throw Error('Revisa las instrucciones no compatibles. No se ha generado otra versión.');
 if(proposal.requiresResetConfirmation&&!$('director-reset').checked)throw Error('Revisa y acepta el cambio de agrupación antes de generar.');
 const key=JSON.stringify({id:current.id,prompt,base});if(pendingGeneration?.key!==key)pendingGeneration={key,id:crypto.randomUUID()};
 const job=await api('jobs/'+current.id+'/direct','POST',{prompt,settings:base,requestId:pendingGeneration.id,confirmReset:$('director-reset').checked});
 pendingGeneration=null;$('director-prompt').value='';await select(job.id);showTool('director');
 }catch(error){$('render-state-overlay').hidden=true;throw error;}
});
$('export-video').onclick=()=>{if(current?.state!=='DONE'||previewDirty)return;$('download').hidden=false;$('download').click();$('workflow-status').textContent='Exportación solicitada: se descarga la misma versión que acabas de previsualizar.';};
$('view-original').onclick=()=>showPlayer('original');$('view-preview').onclick=()=>showPlayer('preview');
$('cancel').onclick=()=>work(async()=>{display(await api('jobs/'+current.id+'/cancel','POST',{}));await list();});
$('duplicate').onclick=()=>work(async()=>{const job=await api('jobs','POST',{profileId:current.profileId,settings:previewDirty?settings():current.settings});await select(job.id);});
async function init(){clearInterval(pollTimer);try{const fragment=location.hash.slice(1);if(fragment.startsWith('setup=')){setupToken=new URLSearchParams(fragment).get('setup');history.replaceState(null,'',location.pathname);authenticated(false);$('login-screen').hidden=true;$('setup-screen').hidden=false;return;}const token=fragment;history.replaceState(null,'',location.pathname+location.search);if(token){const response=await fetch('/api/session',{method:'POST',headers:{Authorization:'Bearer '+token}});if(!response.ok){const e=new Error('Enlace de acceso no válido');e.status=401;throw e;}}const profiles=await refreshProfiles();const uploads=await refreshUploads();await refreshAssets();if(profiles.length)await loadDesign(profiles[0].id);await list();authenticated(true);const resume=new URLSearchParams(location.search).get('project');if(resume&&allJobs.some(j=>j.id===resume)){const prompting=new URLSearchParams(location.search).get('step')==='prompt';if(prompting)setIntake('prompt');await select(resume,{keepPrompt:prompting});if(prompting){$('upload-step').dataset.state='complete';$('upload-meter').value=100;$('upload-meter').hidden=false;$('upload-status').textContent='Subida completada';$('selected-video-status').textContent=current.projectTitle??current.title;}}else if(new URLSearchParams(location.search).has('upload'))await resumeUpload(new URLSearchParams(location.search).get('upload'));else if(new URLSearchParams(location.search).has('new'))newProject();pollTimer=setInterval(async()=>{if(working||!current||!['QUEUED','RENDERING','PUBLISHING'].includes(current.state))return;try{display(await api('jobs/'+current.id));await list();}catch(e){error(e);}},1500);}catch(e){if(e.status===401||/Session required|Inicio de sesión|401/.test(String(e?.message))){authenticated(false);$('session').hidden=true;$('error').hidden=true;}else{$('session').hidden=false;error(e);}$('create').disabled=true;}}
const node=(tag,text,className)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;};
async function loadDesign(profileId){design=await api('design?profileId='+encodeURIComponent(profileId));
 $('template-cards').replaceChildren();for(const t of design.styles){const card=node('article',undefined,'asset-card');card.append(node('h2',t.id.replace('SUES_','SUES · ')),node('span',t.status==='experimental'?'Experimental · sin validar':t.status==='functional'?'Base definida · funcional':'Provisional','badge'),node('p',t.available?'Referencia principal Keanu: grupos cortos progresivos, palabras clave animadas y énfasis metálico, con cámara suave y focos desenfocados.':'Contrato inicial. Aún sin plantilla visual validada.'));if(t.available){const b=node('button','Probar '+t.id.replace('SUES_',''),'primary');b.onclick=()=>work(async()=>{showView('editor');if(current&&current.state!=='PREVIEW_READY'){const job=await api('jobs','POST',{profileId:current.profileId,settings:{...current.settings,styleId:t.id,captionOverrides:{},keywordOverrides:{},highlightCaptions:[],motionChoices:[],graphicCards:[],transitions:[],elements:null}});await select(job.id);}else{$('style-id').value=t.id;showEditorStep(current?'adjustments-panel':'material-panel');}});card.append(b);}$('template-cards').append(card);}
 const brand=design.brand,content=$('brand-content');content.replaceChildren(node('h2',brand.name));const swatches=node('div',undefined,'swatches');for(const [name,hex]of Object.entries(brand.colors)){const swatch=node('div',undefined,'swatch'),color=node('i');color.style.backgroundColor=hex;swatch.append(color,node('span',name+' · '+hex));swatches.append(swatch);}content.append(swatches,node('p','Tipografía del vídeo: '+(design.template.captions.font??brand.fonts.primary),'kit-detail'),node('p','Subtítulos: '+brand.captions.maxLines+' líneas · '+brand.captions.maxCharsPerLine+' caracteres por línea','kit-detail'),node('p','Cierre: '+brand.outro.text+' · '+brand.outro.duration+' segundos','kit-detail'));
 const fonts=await api('fonts');const fontList=node('div',undefined,'asset-grid');for(const f of fonts){const card=node('article',undefined,'asset-card'),link=node('a','Descargar fuente','button'),license=node('a','Licencia');link.href=f.download;link.download=f.filename;license.href=f.license;card.append(node('h3',f.label),node('p',f.role,'small'),link,license);fontList.append(card);}content.append(fontList);
 $('motion-cards').replaceChildren();for(const m of design.motions){const card=node('article',undefined,'asset-card');card.append(node('h2',m.id.replaceAll('_',' ')),node('span',m.rendered?'Renderer disponible':'Contrato inicial','badge'),node('p','Duración mínima: '+m.minDuration+' s'),node('p','Usos: '+m.reasons.join(' · ')),node('p',m.allowedInTemplate?'Permitido por CALMA':'No incluido en CALMA'),node('p',m.rendered?'Recurso visual disponible · consulta los efectos en Sonido':'Pendiente de implementación'));$('motion-cards').append(card);}
 designProfile=profileId;
}
function showView(name){activeView=name;document.body.dataset.activeView=name;for(const view of ['dashboard','editor','templates','brand','library'])$(view+'-view').hidden=view!==name;$('project-bar').hidden=name!=='editor';$('intro').hidden=true;for(const b of document.querySelectorAll('nav button'))b.classList.toggle('selected',b.dataset.view===name);if(name!=='editor'){$('source-video').pause();$('video').pause();}}
for(const b of document.querySelectorAll('nav button'))b.onclick=()=>{showView(b.dataset.view);const menu=b.closest('.studio-tools');if(menu)menu.open=false;};
function showTool(tool){
 if(!['director','material','style','captions','sound','sfx','media'].includes(tool))return;if(intakePhase!=='edit')tool='material';
 showView('editor');document.body.dataset.editorTool=tool;$('video-panel').hidden=false;$('material-panel').hidden=tool!=='material';$('adjustments-panel').hidden=['material','director'].includes(tool);$('director-panel').hidden=intakePhase==='upload'||(intakePhase==='edit'&&tool!=='director'&&(tool!=='material'||!!current));$('editor-shortcuts').hidden=intakePhase!=='edit';
 $('style-tool-controls').hidden=tool!=='style';
 $('music-controls').hidden=tool==='sfx';$('sfx-controls').hidden=tool!=='sfx';$('music-status').hidden=tool==='sfx';
 const active={style:'motion-settings',captions:'caption-settings',sound:'sound-settings',sfx:'sound-settings',media:'image-settings'}[tool];
 for(const id of ['motion-settings','caption-settings','sound-settings','image-settings']){$(id).hidden=id!==active;if(id===active&&tool!=='style')$(id).open=true;}
 for(const button of document.querySelectorAll('[data-editor-tool]')){button.classList.toggle('active',button.dataset.editorTool===tool);button.setAttribute('aria-pressed',String(button.dataset.editorTool===tool));}
 $('adjustments-panel').querySelector('h2').textContent={style:'Estilo y estructura',captions:'Texto y elementos',sound:'Música',sfx:'Efectos de sonido',media:'Imágenes'}[tool]??'Ajustes';
}
function showEditorStep(id){showTool(id==='material-panel'?'material':'style');}
const toolIcons={director:'M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z',material:'M3 5h12v14H3z M15 9l6-3v12l-6-3',style:'M12 3v4 M12 17v4 M3 12h4 M17 12h4 M8 8l8 8 M16 8l-8 8',captions:'M4 5h16 M12 5v15 M8 20h8',sound:'M9 18V5l11-2v13 M9 9l11-2 M9 18c0 2-5 3-5 0s5-3 5 0 M20 16c0 2-5 3-5 0s5-3 5 0',sfx:'M3 10v4 M7 6v12 M12 3v18 M17 7v10 M21 10v4',media:'M3 3h18v18H3z M3 17l6-6 4 4 3-3 5 5 M15 7h.01'};
for(const button of document.querySelectorAll('[data-editor-tool]')){
 button.onclick=()=>showTool(button.dataset.editorTool);
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg'),path=document.createElementNS('http://www.w3.org/2000/svg','path');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');path.setAttribute('d',toolIcons[button.dataset.editorTool]);svg.append(path);button.prepend(svg);
}
$('export-from-settings').onclick=()=>$('render').click();
for(const eventName of ['input','change'])$('adjustments-panel').addEventListener(eventName,event=>{if(!['caption-search','sfx-asset','sfx-start','sfx-event-gain'].includes(event.target.id))markPreviewDirty();});
$('caption-search').oninput=()=>{const query=$('caption-search').value.trim().toLocaleLowerCase('es');let count=0;for(const row of $('captions').children){const match=!query||row.querySelector('textarea').value.toLocaleLowerCase('es').includes(query);row.hidden=!match;if(match)count++;}$('caption-search-status').textContent=query?count+' subtítulos encontrados':'';};
$('upload-video').onchange=()=>{const file=$('upload-video').files[0];if(!file)return;if(!leaveProject()){$('upload-video').value='';return;}if(localVideoURL)URL.revokeObjectURL(localVideoURL);localVideoURL=URL.createObjectURL(file);resetForNewSource(file.name);originalVideo(localVideoURL,file.name);$('selected-video-status').textContent=file.name+' · '+(file.size/1024/1024).toFixed(1)+' MiB · seleccionado, aún sin subir';$('upload').click();};
function originalPlaybackSupport(){const v=$('source-video');if(v.currentSrc&&v.readyState>=1&&v.videoWidth===0&&playerView!=='preview')$('player-label').textContent='Este navegador reproduce el audio, pero no la imagen del original. Previsualiza el montaje para verlo en formato compatible.';}
$('source-video').addEventListener('loadeddata',originalPlaybackSupport);
$('source-video').addEventListener('playing',originalPlaybackSupport);
$('source-video').onerror=()=>{$('player-label').textContent='El navegador no puede reproducir este formato original. Si el análisis está disponible, crea la previsualización compatible.';};
showTool('material');
async function applyGroupingChange(){
 if(!current||!['PREVIEW_READY','DONE'].includes(current.state))return;
 const targetStyle=$('style-id').value,targetWords=Number($('caption-words').value);if(targetStyle===current.settings.styleId&&targetWords===current.settings.captionWords)return;
 const previous={...settings({preserveAnchors:true}),styleId:current.settings.styleId,captionWords:current.settings.captionWords};
 const next={...previous,styleId:targetStyle,captionWords:targetWords,elements:null,motionChoices:[],graphicCards:[],transitions:[],keywordOverrides:{},captionOverrides:{},highlightCaptions:[]};
 $('render').disabled=true;$('export-video').disabled=true;$('workflow-status').textContent='Aplicando el estilo y actualizando los subtítulos…';
 // Retain unsaved inputs in a recoverable version before changing caption anchors.
 if(current.state==='DONE'){const version=await api('jobs','POST',{profileId:current.profileId,settings:previous});await select(version.id);}
 else await api('jobs/'+current.id,'PATCH',{settings:previous});
 await api('jobs/'+current.id,'PATCH',{settings:next});await select(current.id);
 $('workflow-status').textContent='Estilo aplicado. Puedes añadir elementos o pulsar Previsualizar. Deshacer recupera tus ajustes anteriores.';
}
$('style-id').onchange=()=>work(applyGroupingChange);$('caption-words').onchange=()=>work(applyGroupingChange);
$('elements-format').onchange=()=>{$('elements-help').hidden=!$('elements-format').value;if($('elements-format').value)showTool('captions');};
$('profile').onchange=()=>work(async()=>{if(!leaveProject()){if(current)$('profile').value=current.profileId;return;}resetForNewSource($('profile').selectedOptions[0]?.textContent??'Vídeo');originalVideo('/api/profiles/'+encodeURIComponent($('profile').value)+'/source',$('profile').selectedOptions[0]?.textContent);$('create').disabled=$('profile').selectedOptions[0]?.dataset.ready!=='true';$('upload').classList.add('primary');await loadDesign($('profile').value);$('workflow-status').textContent=$('create').disabled?'Este material necesita recuperar sus archivos o su análisis.':'Material seleccionado. Pulsa Continuar con este material para editar.';});
if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
editability(false);
init();

function keywordControls(c,job,field){
 const box=document.createElement('div');box.className='keyword-controls';const select=document.createElement('select'),level=document.createElement('select'),style=document.createElement('select'),scale=document.createElement('select');scale.dataset.scale=c.id;scale.setAttribute('aria-label','Tamaño de énfasis de '+c.id);select.dataset.keyword=c.id;level.dataset.level=c.id;style.dataset.style=c.id;select.setAttribute('aria-label','Palabra importante en '+c.id);level.setAttribute('aria-label','Importancia de '+c.id);style.setAttribute('aria-label','Acabado de '+c.id);
 const option=(value,text)=>{const o=document.createElement('option');o.value=value;o.textContent=text;return o;};
 const fill=()=>{const old=select.value;select.replaceChildren(option('auto','Elección automática'),option('none','Sin palabra destacada'),...field.value.trim().split(/\s+/).map((w,i)=>option(String(i),w)));select.value=[...select.options].some(o=>o.value===old)?old:'auto';};fill();
 level.append(option('important','Palabra importante'),option('exceptional','Énfasis máximo'));for(const [id,label]of Object.entries({white:'Blanco',fire:'Naranja fuego',fireMetal:'Metal naranja fuego',gold:'Oro',green:'Verde',cyan:'Cian',blue:'Azul',coral:'Coral inclinado',oblique:'Blanco inclinado',condensed:'Blanco estrecho'}))style.append(option(id,label));
 for(const [value,label]of [[14/12,'Tamaño 14/12'],[1.45,'Tamaño 145 %'],[1.6,'Tamaño 160 %']])scale.append(option(String(value),label));
 const saved=job.settings.keywordOverrides?.[c.id];scale.value=String(saved?.scale??14/12);select.value=saved?(saved.level==='none'?'none':String(saved.word)):'auto';level.value=saved?.level==='exceptional'?'exceptional':'important';style.value=saved?.style??'white';
 level.onchange=()=>{if(select.value==='auto'||select.value==='none')select.value=String(c.keyword?.displayWordIndex??Math.max(0,c.wordIndexes.indexOf(c.keyword?.sourceWordIndex)));if(level.value==='exceptional'&&style.value==='white')style.value='gold';};style.onchange=()=>{if(select.value==='auto'||select.value==='none')select.value=String(c.keyword?.displayWordIndex??Math.max(0,c.wordIndexes.indexOf(c.keyword?.sourceWordIndex)));};field.addEventListener('input',()=>{fill();select.value='auto';});scale.onchange=()=>{if(select.value==='auto'||select.value==='none')select.value=String(c.keyword?.displayWordIndex??0);};box.append(select,level,style,scale);return box;
}

function graphicControls(c,job){
 const box=node('details'),summary=node('summary','Bloque gráfico y transición');box.append(summary);const chosen=job.settings.graphicCards?.find(g=>g.captionId===c.id),effectChoice=job.settings.transitions?.find(g=>g.captionId===c.id);
 const make=(data,label,entries)=>{const select=node('select');select.dataset[data]=c.id;select.setAttribute('aria-label',label+' '+c.id);for(const[value,text]of Object.entries({none:'Ninguno',...entries})){const o=node('option',text);o.value=value;select.append(o);}box.append(select);return select;};
 const card=make('card','Bloque gráfico',{grid:'Lienzo documental',compare:'Esquema comparativo',secret:'Sello y frase neón'}),effect=make('transition','Transición',{blur:'Pulso de desenfoque',warm:'Destello cálido',radial:'Expansión radial',radialBurst:'Salida documental'});
 card.value=chosen?.type??'none';effect.value=effectChoice?.type??'none';
 const field=(key,label,value='')=>{const input=node('input');input.dataset[key]=c.id;input.maxLength=26;input.placeholder=label;input.setAttribute('aria-label',label+' '+c.id);input.value=value;box.append(input);return input;};
 const left=field('cardLeft','Concepto superior',chosen?.left),right=field('cardRight','Concepto inferior',chosen?.right),heading=field('cardHeading','Cabecera',chosen?.heading),one=field('cardBodyOne','Primera línea',chosen?.bodyLines?.[0]),two=field('cardBodyTwo','Segunda línea',chosen?.bodyLines?.[1]),lead=field('cardLead','Entrada breve',chosen?.lead),icons=make('cardIcons','Iconos',{creative:'Cine y maquillaje',comparison:'Equipaje y reloj',reflection:'Mirada y sentir'});
 icons.value=chosen?.icons?.[0]==='clapper'?'creative':chosen?.icons?.[0]==='luggage'?'comparison':chosen?.icons?.[0]==='eye'?'reflection':'none';
 const range=make('cardEnd','Último subtítulo del bloque',Object.fromEntries(plan.manifest.captions.filter(n=>n.start>=c.start&&n.end-c.start<=6).map(n=>[n.id,n.start.toFixed(1)+' s · '+n.text])));range.value=chosen?.endCaptionId??'none';const readRange=range.value;range.options[0].value='';range.options[0].textContent='Duración automática';if(readRange==='none')range.value='';
 const exitLabel=node('label'),exit=node('input');exit.type='checkbox';exit.dataset.cardExit=c.id;exit.checked=effectChoice?.phase==='exit';exitLabel.append(exit,document.createTextNode(' Transición al salir del bloque'));box.append(exitLabel);
 const show=()=>{left.hidden=right.hidden=card.value!=='compare';heading.hidden=one.hidden=two.hidden=card.value!=='grid';lead.hidden=card.value!=='secret';icons.hidden=!['grid','compare'].includes(card.value);};card.onchange=show;show();return box;
}

async function reviewPlan(id){
 const review=await api('jobs/'+id+'/review'),box=$('review-plan');box.replaceChildren(node('p','Se conservan '+review.mappedWords+' de '+review.sourceWords+' palabras. Propuesta por reglas; puedes revisar cada elección.','small'));
 for(const e of review.events){const row=node('p',e.start.toFixed(1)+'–'+e.end.toFixed(1)+' s · '+e.type+' · '+(e.text??e.assetId??e.reason),'review-event');box.append(row);}
 if(review.uncertainWordIndexes?.length)box.append(node('p',review.uncertainWordIndexes.length+' palabras tienen marcas de tiempo inciertas. Conviene revisar esos subtítulos.','small'));
 for(const r of review.rejections??[])box.append(node('p','Propuesta descartada en '+r.start.toFixed(1)+' s: '+r.reason,'small'));
 const link=node('a','Descargar plan de revisión','button');link.href='/api/jobs/'+id+'/review';link.download='SUES_PLAN_REVISION.json';box.append(link);
}

async function refreshAssets(){
 assetLibrary=await api('assets');const sfx=$('sfx-asset'),priorSfx=sfx.value,music=$('music-asset'),images=$('image-asset'),priorMusic=music.value,priorImage=images.value;music.replaceChildren();images.replaceChildren();sfx.replaceChildren();const option=(value,text)=>{const o=node('option',text);o.value=value;return o;};sfx.append(option('','Seleccionar sonido'));music.append(option('','Pista de la plantilla'));images.append(option('','Seleccionar imagen'));
 const list=$('asset-list');list.replaceChildren();for(const a of assetLibrary){const row=node('div',undefined,'media-asset');row.append(node('p',a.title+' · '+(a.bytes/1024/1024).toFixed(1)+' MiB','small'));if(a.kind==='image'){images.append(option(a.id,a.title));const img=document.createElement('img');img.src='/api/assets/'+a.id+'/media';img.alt=a.title;img.loading='lazy';row.append(img);}else if(a.kind==='video'||a.kind==='overlay'){const video=document.createElement('video');video.src='/api/assets/'+a.id+'/media';video.controls=true;video.preload='metadata';video.playsInline=true;video.setAttribute('aria-label','Vista previa del recurso '+a.title);row.append(video,node('p','Vídeo guardado para el banco privado · uso en la línea de tiempo pendiente de integración.','small'));}else{if(a.kind==='sfx')sfx.append(option(a.id,a.title+' · '+a.duration.toFixed(2)+' s'));else music.append(option(a.id,a.title));const audio=document.createElement('audio');audio.src='/api/assets/'+a.id+'/media';audio.controls=true;audio.preload='none';row.append(audio);}list.append(row);}music.value=priorMusic;images.value=priorImage;sfx.value=priorSfx;updateSfxAudition();
}
function updateSfxAudition(){const a=$('sfx-audition'),id=$('sfx-asset').value;a.pause();a.hidden=!id;if(id)a.src='/api/assets/'+id+'/media';else a.removeAttribute('src');}
$('sfx-asset').onchange=updateSfxAudition;
function appendSfxEvent(e){const row=node('div',undefined,'image-event');row.dataset.sfxEvent=JSON.stringify(e);row.append(node('p',(assetLibrary.find(a=>a.id===e.assetId)?.title??'Sonido')+' · '+e.start+' s · '+Math.round(e.gain*100)+' %','small'));const remove=node('button','Quitar sonido');remove.type='button';remove.onclick=()=>{row.remove();markPreviewDirty();};row.append(remove);$('sfx-events').append(row);}
$('add-sfx').onclick=()=>{if(!current||!['PREVIEW_READY','DONE'].includes(current.state))return;const assetId=$('sfx-asset').value,start=Number($('sfx-start').value),gain=Number($('sfx-event-gain').value)/100,a=assetLibrary.find(a=>a.id===assetId&&a.kind==='sfx');if(!a||!Number.isFinite(start)||start<0||start+a.duration>plan.manifest.duration+1e-6||!Number.isFinite(gain)||gain<0||gain>.7){error(new Error('Elige un sonido que quepa completo y un volumen entre 0 y 70 %.'));return;}appendSfxEvent({assetId,start,gain});markPreviewDirty();};
function appendImageEvent(e){const row=node('div',undefined,'image-event');row.dataset.imageEvent=JSON.stringify(e);row.append(node('p',(assetLibrary.find(a=>a.id===e.assetId)?.title??'Imagen')+' · '+e.start+'–'+e.end+' s','small'));const remove=node('button','Quitar');remove.type='button';remove.onclick=()=>{row.remove();markPreviewDirty();};row.append(remove);$('image-events').append(row);}
$('add-image').onclick=()=>{if(!current||!['PREVIEW_READY','DONE'].includes(current.state))return;const assetId=$('image-asset').value,start=Number($('image-start').value),end=Number($('image-end').value);if(!assetId||!Number.isFinite(start)||!Number.isFinite(end)||start<0||end<=start||end-start>8||end>plan.manifest.duration){error(new Error('Elige una imagen y un intervalo de hasta 8 segundos dentro del vídeo.'));return;}appendImageEvent({assetId,start,end});markPreviewDirty();};
$('upload-asset').onclick=()=>work(async()=>{const file=$('asset-file').files[0],rights=$('asset-rights').value,kind=$('asset-kind').value;if(!file||!rights)throw new Error('Elige un archivo y su procedencia');if(file.size>40*1024*1024)throw new Error('El recurso supera 40 MiB');$('asset-status').textContent='Guardando y comprobando recurso…';const response=await fetch('/api/assets?'+new URLSearchParams({kind,rights,name:file.name}),{method:'POST',credentials:'same-origin',headers:{'X-Sues-Request':'editor','Content-Type':file.type||'application/octet-stream'},body:file}),value=await response.json();if(!response.ok)throw new Error(value.error);await refreshAssets();$('asset-status').textContent=['video','overlay'].includes(kind)?'Recurso guardado en tu biblioteca privada. Pendiente de incorporarlo a los montajes.':'Recurso guardado. Ya puedes usarlo en el montaje.';});

$('backup').onclick=()=>work(async()=>{if(current.state==='DONE'&&previewDirty){const next=await api('jobs','POST',{profileId:current.profileId,settings:settings()});await select(next.id);}$('backup-status').textContent='Preparando copia privada con original, análisis y recursos…';if(current.state==='PREVIEW_READY')await api('jobs/'+current.id,'PATCH',{settings:settings()});const result=await api('jobs/'+current.id+'/backup','POST',{});display(await api('jobs/'+current.id));$('backup-status').textContent='Copia verificada · '+(result.bytes/1024/1024).toFixed(1)+' MiB. Ya puedes descargarla.';});

$('save-review').onclick=()=>work(async()=>{const result=await api('jobs/'+current.id+'/acceptance','POST',{captionsReviewed:$('review-captions').checked,framingReviewed:$('review-framing').checked,audioReviewed:$('review-audio').checked,majorChanges:Number($('review-major').value),minorChanges:Number($('review-minor').value)});$('review-status').textContent=result.pass?'Aprobación estética registrada para esta versión.':'Revisión guardada · quedan ajustes o comprobaciones.';});

function motionControls(c,job){
 const box=node('details'),summary=node('summary','Recurso animado'),select=node('select'),number=node('input');box.append(summary);select.dataset.motionChoice=c.id;select.setAttribute('aria-label','Recurso animado en '+c.id);
 for(const [value,label]of Object.entries({none:'Ninguno',check:'Marca de verificación',cross:'Cruz',strike:'Tachar esta frase',number:'Paso numerado',divider:'Separador'})){const option=node('option',label);option.value=value;select.append(option);}
 const saved=job.settings.motionChoices?.find(m=>m.captionId===c.id);select.value=saved?.type??'none';number.type='number';number.min='1';number.max='99';number.value=String(saved?.number??1);number.dataset.motionNumber=c.id;number.setAttribute('aria-label','Número del paso en '+c.id);const show=()=>{number.hidden=select.value!=='number';};select.onchange=show;show();box.append(select,number,node('p','Se conserva tu voz. El recurso se coloca en un hueco seguro y no añade sonido.','small'));return box;
}

function elementSettings(){
 const format=$('elements-format').value;if(!format)return null;
 const items=[];
 for(const row of $('captions').querySelectorAll('[data-element-row]')){
  if(!row.querySelector('[data-element-use]').checked)continue;
  items.push({captionId:row.dataset.elementRow,endCaptionId:row.querySelector('[data-element-end]').value,label:row.querySelector('[data-element-label]').value.trim(),...(['COMPARE','Q&A'].includes(format)?{secondary:row.querySelector('[data-element-secondary]').value.trim()}:{}),...(format==='RANKING'?{number:Number(row.querySelector('[data-element-number]').value)}:{})});
 }
 if(!items.length)throw new Error('Marca al menos un subtítulo como elemento o elige Sin estructura ELEMENTS.');
 return {format,items};
}
function elementControls(c,job){
 const box=node('details');box.dataset.elementRow=c.id;box.append(node('summary','Elemento de lista, comparación o proceso'));
 const chosen=job.settings.elements?.items.find(item=>item.captionId===c.id);
 const use=document.createElement('input');use.type='checkbox';use.dataset.elementUse='';use.checked=!!chosen;const toggle=node('label',' Incluir este elemento');toggle.prepend(use);box.append(toggle);
 const input=(title,key,value)=>{const label=node('label',title),field=document.createElement('input');field.dataset[key]='';field.value=value;field.maxLength=48;label.append(field);box.append(label);return field;};
 input('Texto principal / opción A / pregunta','elementLabel',chosen?.label??c.text);
 input('Opción B / respuesta (COMPARE o Q&A)','elementSecondary',chosen?.secondary??'');
 const number=input('Posición (sólo RANKING)','elementNumber',chosen?.number??1);number.type='number';number.min=1;number.max=10;
 const label=node('label','Hasta el final de este subtítulo'),end=document.createElement('select');end.dataset.elementEnd='';
 for(const other of plan.manifest.captions.filter(other=>other.start>=c.start&&other.end-c.start<=12)){const o=node('option',other.end.toFixed(2)+' s · '+other.text);o.value=other.id;end.append(o);}end.value=chosen?.endCaptionId??c.id;label.append(end);box.append(label);
 return box;
}

/* Real-player timeline: uses only loaded media metadata, never fabricated clips. */
(function setupPlayerTimeline(){
 const scrub=document.getElementById('timeline-scrub'),clock=document.getElementById('timeline-current'),duration=document.getElementById('timeline-duration'),captions=document.getElementById('timeline-captions');
 const format=seconds=>{if(!Number.isFinite(seconds))return '00:00';const n=Math.max(0,Math.floor(seconds));return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0')};
 const videos=[document.getElementById('source-video'),document.getElementById('video')];
 const active=()=>videos.find(v=>!v.hidden&&v.getAttribute('src'))||null;
 const update=()=>{const v=active(),d=v?.duration;const valid=Number.isFinite(d)&&d>0;scrub.disabled=!valid;scrub.value=valid?String(Math.round(v.currentTime/d*1000)):'0';clock.textContent=format(v?.currentTime||0);duration.textContent=format(d);captions.hidden=!(v===videos[1]&&document.getElementById('caption-count').textContent.trim());};
 for(const v of videos){for(const event of ['loadedmetadata','timeupdate','durationchange','emptied','play','pause'])v.addEventListener(event,update);}
 scrub.addEventListener('input',()=>{const v=active();if(v&&Number.isFinite(v.duration)&&v.duration>0){v.currentTime=Number(scrub.value)/1000*v.duration;update();}});
 for(const button of document.querySelectorAll('[data-timeline-tool]'))button.addEventListener('click',()=>document.querySelector('[data-editor-tool="'+button.dataset.timelineTool+'"]')?.click());
 const back=document.getElementById('timeline-back'),play=document.getElementById('timeline-play'),forward=document.getElementById('timeline-forward');
 const controls=()=>{const v=active(),ok=!!v&&Number.isFinite(v.duration)&&v.duration>0;for(const b of [back,play,forward])b.disabled=!ok;play.textContent=v&&!v.paused?'Ⅱ':'▶';play.setAttribute('aria-label',v&&!v.paused?'Pausar vídeo':'Reproducir vídeo');};
 const seek=amount=>{const v=active();if(!v||!Number.isFinite(v.duration))return;v.currentTime=Math.max(0,Math.min(v.duration,v.currentTime+amount));update();};
 back.addEventListener('click',()=>seek(-5));forward.addEventListener('click',()=>seek(5));
 play.addEventListener('click',()=>{const v=active();if(!v)return;if(v.paused)v.play().catch(()=>{});else v.pause();});
 for(const v of videos)for(const e of ['play','pause','loadedmetadata','emptied'])v.addEventListener(e,controls);
 // Non-destructive shortcuts. Never intercept typing, native controls or modifier keys.
 document.addEventListener('keydown',event=>{
  if(event.defaultPrevented||event.altKey||event.ctrlKey||event.metaKey||event.repeat)return;
  const target=event.target;
  if(target?.closest?.('input,textarea,select,button,[contenteditable="true"],video,[role="slider"]'))return;
  const v=active();if(!v||!Number.isFinite(v.duration)||v.duration<=0)return;
  if(event.code==='Space'){event.preventDefault();if(v.paused)v.play().catch(()=>{});else v.pause();}
  else if(event.code==='ArrowLeft'){event.preventDefault();seek(-5);}
  else if(event.code==='ArrowRight'){event.preventDefault();seek(5);}
 });

  const observer=new MutationObserver(update);for(const v of videos)observer.observe(v,{attributes:true,attributeFilter:['hidden','src']});
 const obsControls=new MutationObserver(controls);for(const v of videos)obsControls.observe(v,{attributes:true,attributeFilter:['hidden','src']});controls();
 update();
})();

/* Timeline captions from actual Video Edit Plan. No mock clips or invented timestamps. */
(function setupSemanticTimeline(){
 const segments=document.getElementById('timeline-segments');
 const hint=document.getElementById('timeline-hint');
 const track=document.getElementById('timeline-captions');
 const player=()=>[document.getElementById('video'),document.getElementById('source-video')].find(v=>!v.hidden&&v.getAttribute('src'))||null;
 let lastSignature='';
 const sync=()=>{
  const captions=Array.isArray(plan?.manifest?.captions)?plan.manifest.captions.filter(c=>Number.isFinite(c.start)&&Number.isFinite(c.end)&&c.end>c.start):[];
  const key=(current?.id||'')+'|'+captions.map(c=>c.id+':'+c.start+':'+c.end+':'+c.text).join('|');
  if(key!==lastSignature){
   lastSignature=key;segments.replaceChildren();
   const d=Number(plan?.manifest?.duration)||Math.max(0,...captions.map(c=>c.end));
   for(const item of captions){
    const button=document.createElement('button');button.type='button';button.className='timeline-segment';button.title=item.text+' · '+item.start.toFixed(1)+' s';
    button.textContent=item.text;button.dataset.start=String(item.start);button.dataset.end=String(item.end);
    if(d>0){button.style.left=Math.max(0,Math.min(100,item.start/d*100))+'%';button.style.width=Math.max(.6,Math.min(100-item.start/d*100,(item.end-item.start)/d*100))+'%';}
    button.addEventListener('click',()=>{
     const v=player();if(v&&Number.isFinite(v.duration)&&v.duration>0){v.currentTime=Math.min(v.duration,item.start);v.dispatchEvent(new Event('timeupdate'));}
     document.querySelector('[data-editor-tool="captions"]')?.click();
     $('caption-search').value='';$('caption-search').dispatchEvent(new Event('input'));
     const row=[...document.querySelectorAll('#captions .caption')].find(el=>el.querySelector('textarea')?.dataset.id===item.id);
     if(row){row.open=true;const field=row.querySelector('textarea');field.focus({preventScroll:true});$('captions').scrollTop=row.offsetTop-$('captions').offsetTop;}
    });
    segments.append(button);
   }
  }
  const isMontage=player()===document.getElementById('video');
  const has=captions.length>0&&isMontage&&!previewDirty;
  segments.hidden=!has;hint.hidden=!has;track.hidden=!has;
  const v=player(),time=v?.currentTime||0;
  for(const element of segments.children){const active=time>=Number(element.dataset.start)&&time<Number(element.dataset.end);element.classList.toggle('playing',active);element.setAttribute('aria-current',active?'true':'false');}
 };
 const watcher=new MutationObserver(sync);
 watcher.observe(document.getElementById('captions'),{childList:true,subtree:true,characterData:true});
 for(const v of [document.getElementById('video'),document.getElementById('source-video')]){v.addEventListener('timeupdate',sync);v.addEventListener('loadedmetadata',sync);}
 for(const v of [document.getElementById('video'),document.getElementById('source-video')])new MutationObserver(sync).observe(v,{attributes:true,attributeFilter:['hidden','src']});
 new MutationObserver(sync).observe(document.getElementById('state'),{childList:true,characterData:true,subtree:true});
 document.getElementById('timeline-scrub').addEventListener('input',sync);
 window.addEventListener('sues:plan-updated',sync);sync();
})();

/* Account login is opt-in and retains the existing token-link access for recovery. */
document.getElementById('login-form').addEventListener('submit',async event=>{
 event.preventDefault();
 const form=event.currentTarget,button=form.querySelector('[type="submit"]'),message=document.getElementById('login-message');
 button.disabled=true;message.textContent='Comprobando credenciales…';
 try{
  const response=await fetch('/api/login',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-Sues-Request':'editor'},body:JSON.stringify({email:document.getElementById('login-email').value,password:document.getElementById('login-password').value})});
  const data=await response.json();
  if(!response.ok)throw new Error(data.error||'No se pudo iniciar sesión');
  document.getElementById('login-password').value='';
  document.getElementById('login-screen').hidden=true;document.getElementById('editor-view').hidden=false;message.textContent='';
  await init();
 }catch(error){message.textContent=error.message||'No se pudo iniciar sesión';}finally{document.getElementById('login-password').value='';button.disabled=false;}
});
$('logout').onclick=async()=>{try{await api('logout','POST',{});location.replace('/');}catch(e){error(e);}};

for(const button of document.querySelectorAll('[data-password-toggle]'))button.onclick=()=>{const input=$(button.dataset.passwordToggle),show=input.type==='password';input.type=show?'text':'password';button.setAttribute('aria-pressed',String(show));button.setAttribute('aria-label',show?'Ocultar contraseña':'Mostrar contraseña');input.focus();};
$('setup-form').onsubmit=async event=>{
 event.preventDefault();const button=event.currentTarget.querySelector('[type="submit"]'),message=$('setup-message');button.disabled=true;message.textContent='Guardando acceso…';
 try{const response=await fetch('/api/password/setup',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-Sues-Request':'editor'},body:JSON.stringify({token:setupToken,password:$('setup-password').value,confirmation:$('setup-confirmation').value})});const data=await response.json();if(!response.ok)throw new Error(data.error||'No se pudo configurar el acceso');setupToken=null;$('setup-password').value='';$('setup-confirmation').value='';await init();}catch(e){message.textContent=e.message;}finally{button.disabled=false;}
};
window.addEventListener('hashchange',()=>{if(location.hash)init();});

// The provider is contacted only after an explicit click; no Google script or tracking pixel.
(async()=>{
 const button=$('google-login'),status=$('google-login-status');
 if(googleLoginFailed){
  $('login-message').textContent='No se pudo acceder con Google. Selecciona la cuenta administradora o utiliza tu contraseña.';
  history.replaceState(null,'',location.pathname+location.hash);
 }
 try{const response=await fetch('/api/auth/options',{credentials:'same-origin'}),options=await response.json();if(!response.ok)throw Error();button.disabled=!options.google;status.textContent=options.google?'Solo para carlossuess@gmail.com.':'Google pendiente de configuración. Puedes entrar con tu contraseña.';}
 catch{status.textContent='No se pudo comprobar Google. Puedes entrar con tu contraseña.';}
 button.onclick=async()=>{
  button.disabled=true;
  try{const response=await fetch('/api/auth/google/start',{method:'POST',credentials:'same-origin',headers:{'X-Sues-Request':'editor'}}),result=await response.json();if(!response.ok)throw Error(result.error);const target=new URL(result.url);if(target.origin!=='https://accounts.google.com')throw Error('Destino de acceso no válido');location.assign(target.href);}
  catch(e){$('login-message').textContent=e.message||'No se pudo acceder con Google';button.disabled=false;}
 };
})();

let pendingGeneration=null,analysisTimer=null,analysisBusy=false;
function briefBody(){return {prompt:$('director-prompt').value,projectTitle:$('project-name').value.trim()||undefined,styleId:current?$('style-id').value:$('new-project-style').value};}
async function followAnalysis(id){
 clearTimeout(analysisTimer);if(id!==pendingUploadId||current)return;
 if(working){analysisTimer=setTimeout(()=>followAnalysis(id),1500);return;}
 try{const result=await api('uploads/'+id+'/transcribe');analysisBusy=['QUEUED','RUNNING'].includes(result.state);
  $('analysis-status').textContent=result.state==='QUEUED'?'Análisis en cola. Puedes cerrar esta pantalla.':result.state==='RUNNING'?'Whisper está transcribiendo la voz en tu servidor…':result.state==='FAILED'?result.error:'';
  if(result.state==='COMPLETE'){await work(async()=>{const u=result.upload;await refreshProfiles(u.profileId);await loadDesign(u.profileId);const job=await api('jobs','POST',{profileId:u.profileId,newProject:true,projectTitle:$('project-name').value.trim()||u.brief?.projectTitle||undefined,settings:{styleId:u.brief?.styleId??$('new-project-style').value}});await select(job.id,{keepPrompt:true});setIntake('edit');if(editingRoute==='external'){showTool('director');syncEditRoute();history.replaceState(null,'','?project='+current.id);return;}const proposal=await api('jobs/'+current.id+'/direct-plan','POST',{prompt:$('director-prompt').value,settings:proposalBase()});showProposal(proposal);$('analysis-status').textContent='Voz transcrita automáticamente: revisa los subtítulos. Se conserva el plano completo; aún no hay seguimiento facial.';history.replaceState(null,'','?project='+current.id);(proposal.canApply?$('render'):$('basic-edit')).scrollIntoView({block:'center'});});return;}
  syncDirector();if(analysisBusy)analysisTimer=setTimeout(()=>followAnalysis(id),3000);
 }catch(e){analysisBusy=false;$('analysis-status').textContent=e.message;syncDirector();}
}
$('basic-edit').onclick=()=>work(async()=>{if(!current)return;const next=await api('jobs','POST',{profileId:current.profileId,parentId:current.id,settings:current.settings,useTemplateOnly:true});await select(next.id,{keepPrompt:true});await api('jobs/'+next.id+'/render','POST',{});await select(next.id,{keepPrompt:true});$('analysis-status').textContent='Generando con la plantilla. El prompt queda guardado, pero no se ha aplicado.';$('basic-edit').hidden=true;});
function syncDirector(){
 const busy=!!current&&['QUEUED','RENDERING','PUBLISHING'].includes(current.state);if(busy)$('basic-edit').hidden=true;
 $('upload').textContent=$('upload-step').dataset.state==='complete'?'Cambiar vídeo':$('upload-step').dataset.state==='uploading'?'Subiendo vídeo…':$('upload-step').dataset.state==='error'?'Volver a subir vídeo':'Subir vídeo';$('review-instructions').disabled=(!current&&!pendingUploadId)||busy||working||analysisBusy;$('review-instructions').textContent=intakePhase==='prompt'?'Enviar prompt':'Ver cambios propuestos';$('render').hidden=intakePhase!=='edit';$('director-prompt').disabled=busy;$('director-reset').disabled=busy;
 $('show-versions').hidden=!current;$('project-name-label').hidden=!!current;$('new-style-label').hidden=false;$('project-heading').textContent=current?.projectTitle??current?.title??'Nuevo proyecto';
 $('director-title').textContent=current?.state==='DONE'?'¿Qué quieres cambiar?':'¿Qué quieres crear?';
 $('director-label').textContent=current?.state==='DONE'?'Instrucciones para la próxima versión':'Instrucciones para el montaje';
 $('director-context').textContent=intakePhase==='prompt'?(current?'Subida completada. Escribe tus instrucciones y pulsa Enviar prompt.':'Envía el prompt para guardar el encargo y analizar la voz con Whisper local, sin coste de API.'):busy?'Estamos generando tu edición. Puedes volver a Mis proyectos sin interrumpirla.':current?'La plantilla es el punto de partida. Tus instrucciones ajustan sus valores; la versión anterior se conserva.':'Añade tu vídeo y elige una plantilla. Las instrucciones son opcionales.';
 $('instruction-list').replaceChildren();for(const entry of current?.instructions??[]){const row=node('div',undefined,'instruction-entry');row.append(node('p',entry.text||'Edición con los ajustes seleccionados'));for(const action of entry.actions??[])row.append(node('span',action,'instruction-action'));$('instruction-list').append(row);}
 $('instruction-history').hidden=!(current?.instructions?.length);syncEditRoute();
}
function showProposal(proposal){
 if(editingRoute==='automatic')automaticReviewKey=proposal.canApply?automaticKey():null;
 $('basic-edit').hidden=!current||proposal.canApply;
 const box=$('director-response');box.replaceChildren();if(proposal.editionCounts){const c=proposal.editionCounts;box.append(node('p',`${c.zoomIns} zoom in · ${c.zoomOuts} zoom out · ${c.cards} tarjetas · ${c.motions} motions · ${c.images} imágenes · ${c.transitions} transiciones · ${c.soundEffects} SFX · ${c.cuts} cortes · ${c.captions} subtítulos`));}
 if(proposal.actions.length){box.append(node('strong','Cambios que se aplicarán'));const list=node('ul');for(const action of proposal.actions)list.append(node('li',action));box.append(list);}
 else if(proposal.canApply)box.append(node('p','Se generará una edición con la plantilla y los ajustes seleccionados.'));
 if(proposal.unsupported.length){box.append(node('strong','Todavía no puedo ejecutar'));const list=node('ul');for(const item of proposal.unsupported)list.append(node('li',item));box.append(list,node('p','No aplicaré solo una parte del encargo. Ajusta las instrucciones o utiliza las herramientas disponibles.'));}
 $('director-reset-label').hidden=!proposal.requiresResetConfirmation;if(proposal.warning)box.append(node('p',proposal.warning));for(const note of proposal.notes??[])box.append(node('p',note));
}
$('review-instructions').onclick=()=>work(async()=>{if(!current){await api('uploads/'+pendingUploadId+'/brief','POST',briefBody());$('director-response').replaceChildren(node('strong','Prompt guardado'),node('p','El encargo queda asociado a este vídeo. Prepararemos su transcripción antes de editar. No se ha generado ningún vídeo todavía.'));previewDirty=false;await refreshUploads();renderDashboard();const health=await api('health');if(health.localTranscriptionAvailable){await api('uploads/'+pendingUploadId+'/transcribe','POST',{});analysisBusy=true;$('analysis-status').textContent='Análisis en cola. Puedes cerrar la pantalla; continuará en tu servidor.';$('analysis-status').scrollIntoView({block:'center'});analysisTimer=setTimeout(()=>followAnalysis(pendingUploadId),1000);}else $('analysis-status').textContent='El transcriptor local no está disponible. El vídeo y el prompt siguen guardados.';return;}if(pendingUploadId){await api('uploads/'+pendingUploadId+'/brief','POST',briefBody());await refreshUploads();}const proposal=await api('jobs/'+current.id+'/direct-plan','POST',{prompt:$('director-prompt').value,settings:proposalBase()});showProposal(proposal);if(proposal.canApply&&intakePhase==='prompt'){setIntake('edit');showTool('director');history.replaceState(null,'','?project='+encodeURIComponent(current.id));}});
$('director-prompt').oninput=()=>{$('director-response').replaceChildren();$('director-reset').checked=false;$('director-reset-label').hidden=true;pendingGeneration=null;if(current)markPreviewDirty();};
for(const button of document.querySelectorAll('[data-prompt]'))button.onclick=()=>{if($('director-prompt').disabled)return;const field=$('director-prompt');field.value=(field.value.trim()?field.value.trim()+'; ':'')+button.dataset.prompt;field.dispatchEvent(new Event('input'));field.focus();};
$('project-search').oninput=renderDashboard;$('new-project').onclick=newProject;
$('back-projects').onclick=()=>{showView('dashboard');history.replaceState(null,'',location.pathname);};
document.querySelector('.brand').onclick=event=>{event.preventDefault();if(!$('logout').hidden){showView('dashboard');history.replaceState(null,'',location.pathname);}};
window.addEventListener('beforeunload',event=>{if(hasUnsavedChanges()){event.preventDefault();event.returnValue='';}});

$('new-project-style').onchange=()=>{$('style-id').value=$('new-project-style').value;if(current&&current.settings.styleId!==$('new-project-style').value)markPreviewDirty();automaticReviewKey=null;syncEditRoute();};

$('show-versions').onclick=()=>{showTool('material');$('material-options').open=true;$('saved-jobs').open=true;$('saved-jobs').scrollIntoView({behavior:'smooth',block:'center'});};

function setIntake(phase){intakePhase=phase;document.body.dataset.intakePhase=phase;}

async function resumeUpload(id){
 const u=(await refreshUploads()).find(u=>u.id===id);if(!u)throw Error('No se ha encontrado el vídeo guardado.');
 resetForNewSource(u.name);pendingUploadId=u.id;setIntake('prompt');$('new-project-style').value=u.brief?.styleId??'SUES_CALMA';$('style-id').value=$('new-project-style').value;$('project-name').value=u.brief?.projectTitle||u.name.replace(/\.[^.]+$/,'').slice(0,120);$('director-prompt').value=u.brief?.prompt??'';$('upload-step').dataset.state='complete';$('upload-meter').value=100;$('upload-meter').hidden=false;$('upload-status').textContent='Subida completada';$('selected-video-status').textContent=u.name;originalVideo('/api/uploads/'+u.id+'/media',u.name);showTool('director');
 if(u.state==='READY'){await refreshProfiles(u.profileId);const job=await api('jobs','POST',{profileId:u.profileId,newProject:true,projectTitle:$('project-name').value,settings:{styleId:u.brief?.styleId??$('new-project-style').value}});await select(job.id,{keepPrompt:true});}else{history.replaceState(null,'','?upload='+u.id+'&step=prompt');analysisTimer=setTimeout(()=>followAnalysis(u.id),1000);}syncDirector();
}

// External plans are data, never code. Always render messages through textContent.
let externalReview=null,externalRequest=null;
function invalidateExternal(){externalReview=null;externalRequest=null;$('external-execute').disabled=true;$('external-result').replaceChildren();}
$('external-plan-text').oninput=invalidateExternal;
window.addEventListener('sues:plan-updated',()=>{invalidateExternal();$('external-catalog-text').hidden=true;$('external-copy').hidden=true;});
$('external-catalog').onclick=()=>work(async()=>{if(!current)throw Error('Prepara primero el vídeo y su análisis.');const catalog=await api('jobs/'+current.id+'/external-catalog');$('external-catalog-text').value='Analiza mi vídeo y crea un plan compatible con este catálogo SUES. Devuelve sólo el JSON del plan. Si una idea no es ejecutable, usa type: unsupported y description; no inventes recursos.\n\n'+JSON.stringify(catalog,null,2);$('external-catalog-text').hidden=false;$('external-copy').hidden=false;});
$('external-copy').onclick=()=>work(async()=>{try{await navigator.clipboard.writeText($('external-catalog-text').value);$('external-result').textContent='Instrucciones copiadas. Adjunta el mismo vídeo a la IA.';}catch{$('external-catalog-text').focus();$('external-catalog-text').select();$('external-result').textContent='Selecciona y copia el texto de instrucciones.';}});
$('external-review').onclick=()=>work(async()=>{invalidateExternal();if(!current)throw Error('Prepara primero el vídeo y su análisis.');if(previewDirty)throw Error('Guarda o descarta tus ajustes antes de importar el plan.');const text=$('external-plan-text').value;await api('jobs/'+current.id+'/external-draft','POST',{text});const result=await api('jobs/'+current.id+'/external-review','POST',{text});externalReview={...result,text,jobId:current.id};const box=$('external-result');box.append(node('strong',result.canApply?'Plan listo para ejecutar':'Plan guardado y pendiente: no se ejecutará parcialmente'));for(const r of result.rows)box.append(node('p',(r.status==='ready'?'✓ ':r.status==='missing-resource'?'Recurso ausente · ':'Pendiente · ')+r.description));for(const note of result.notes)box.append(node('p',note));$('external-execute').disabled=!result.canApply;$('external-execute').scrollIntoView({block:'center'});});
$('external-execute').onclick=()=>work(async()=>{if(!externalReview?.canApply||externalReview.jobId!==current?.id||externalReview.text!==$('external-plan-text').value||previewDirty)throw Error('Comprueba de nuevo el plan antes de ejecutarlo.');externalRequest??=crypto.randomUUID();const job=await api('jobs/'+current.id+'/external-execute','POST',{text:externalReview.text,reviewId:externalReview.reviewId,requestId:externalRequest});await select(job.id);$('external-result').textContent='Plan enviado a la cola. Puedes cerrar esta pantalla; la edición continúa en el servidor.';});

// Dar instrucciones exposes global controls and the existing scene-plan review.
function syncEditRoute(){
 const available=!!current||!!pendingUploadId,busy=working||analysisBusy||!!current&&['QUEUED','RENDERING','PUBLISHING'].includes(current.state);
 $('edit-video').hidden=true;$('edit-route-choices').hidden=!available;$('choose-external').disabled=!available||busy;$('choose-automatic').disabled=true;
 $('automatic-edit-panel').hidden=editingRoute!=='automatic';
 $('external-plan-panel').hidden=!['automatic','external'].includes(editingRoute);
 if(editingRoute==='external')$('external-plan-panel').open=true;
 $('new-style-label').hidden=false;$('template-lock').dataset.active=$('new-project-style').value;$('active-template-label').textContent='PLANTILLA ACTIVA · '+($('new-project-style').value==='SUES_DOPAMIN'?'DOPAMIN':'CALMA');$('choose-external').setAttribute('aria-pressed',String(editingRoute==='automatic'));$('edit-mode-help').textContent=editingRoute==='automatic'?'Modo seleccionado: Dar instrucciones. El montaje seguirá la plantilla activa.':'Selecciona Dar instrucciones para continuar. El Director IA automático está en desarrollo.';
 $('prepare-external').hidden=!!current;
 $('external-catalog').disabled=!current||busy;$('external-review').disabled=!current||busy;
 $('compare-styles').disabled=!current||busy;$('compare-styles').hidden=true;
 $('director-suggestion-panel').hidden=!current||editingRoute!=='automatic';
 $('suggest-resources').disabled=!current||busy;
 if($('resource-suggestions').dataset.jobId!==String(current?.id??'')){
  $('resource-suggestions').replaceChildren();$('resource-suggestions').dataset.jobId=String(current?.id??'');
 }
 if(editingRoute==='automatic'){$('render').disabled=$('render').disabled||!current||busy||automaticReviewKey!==automaticKey();$('review-instructions').textContent=current?'Comprobar instrucciones':'Preparar transcripción';$('director-title').textContent='Dar instrucciones';}
 else if(editingRoute==='external')$('director-title').textContent='Tu plan de edición';
 else $('director-title').textContent='Elige cómo editar tu vídeo';
}
function proposalBase(){
 const base=['PREVIEW_READY','DONE'].includes(current?.state)?settings():{...current?.settings};
 return editingRoute==='automatic'?{...base,autoRecipe:true,sfxEnabled:$('recipe-sounds').checked}:base;
}
$('edit-video').onclick=()=>{};
function chooseEditRoute(route){
 editingRoute=route;
 // Preserve the explicitly selected template, even if the current job has an older style.
 $('style-id').value=$('new-project-style').value;
 $('recipe-sounds').checked=current?.settings.autoRecipe?current.settings.sfxEnabled:true;
 if(route==='automatic'&&current&&!current.settings.autoRecipe)markPreviewDirty();
 syncEditRoute();
}
$('choose-automatic').onclick=()=>{};
$('choose-external').onclick=()=>chooseEditRoute('automatic');
$('prepare-external').onclick=()=>{$('review-instructions').click();};
$('compare-styles').onclick=()=>work(async()=>{
 if(!current)throw Error('Analiza primero el vídeo.');
 const parent=current.id,base=proposalBase();if(Object.keys(base.captionOverrides??{}).length||Object.keys(base.keywordOverrides??{}).length||(base.highlightCaptions??[]).length||(base.motionChoices??[]).length||(base.graphicCards??[]).length||base.elements)throw Error('La comparación automática necesita una versión sin textos o gráficos manuales. Usa el material original; esta versión se conserva.');const prompt=$('director-prompt').value.trim();
 if(prompt)throw Error('Para comparar sólo las plantillas, deja las instrucciones opcionales vacías.');
 const variants=['SUES_CALMA','SUES_DOPAMIN'],prepared=[];
 for(const styleId of variants){const settings={...base,styleId,autoRecipe:true,elements:null,motionChoices:[],graphicCards:[],transitions:[],keywordOverrides:{},captionOverrides:{},highlightCaptions:[]};const proposal=await api('jobs/'+parent+'/direct-plan','POST',{prompt:'',settings});if(!proposal.canApply)throw Error('No se pueden comparar estos ajustes.');prepared.push(settings);}
 const key=JSON.stringify({parent,prepared});if(comparisonRequest?.key!==key)comparisonRequest={key,ids:[crypto.randomUUID(),crypto.randomUUID()]};
 const jobs=[];for(const [i,settings]of prepared.entries())jobs.push(await api('jobs/'+parent+'/direct','POST',{prompt:'',settings,requestId:comparisonRequest.ids[i],confirmReset:true}));
 $('comparison-results').replaceChildren(node('p','Comparación en cola: dos versiones del mismo vídeo. Puedes cerrar la pantalla.'));
 for(const [i,job]of jobs.entries()){const b=node('button',i?'Ver DINÁMICA':'Ver CALMA');b.type='button';b.onclick=()=>work(async()=>{await select(job.id);showTool('director');});$('comparison-results').append(b);}
 await list();
});

function automaticKey(){return JSON.stringify({id:current?.id,settings:proposalBase(),prompt:$('director-prompt').value.trim()});}
$('recipe-sounds').onchange=()=>{if(current)markPreviewDirty();automaticReviewKey=null;syncEditRoute();};

$('suggest-resources').onclick=()=>work(async()=>{
 if(!current?.id)throw Error('Prepara primero el vídeo y su transcripción.');
 const selectedId=current.id,box=$('resource-suggestions');
 box.replaceChildren(node('p','Buscando coincidencias en recursos privados instalados…'));
 const result=await api('jobs/'+encodeURIComponent(selectedId)+'/library-cues?limit=6');
 if(current?.id!==selectedId)return;
 box.replaceChildren();
 if(result.approvedToAutoPublish!==false)throw Error('La propuesta no confirma el requisito de revisión.');
 if(!result.cues.length){box.append(node('p','No hay coincidencias fiables en la biblioteca instalada. No se añadirán efectos de relleno.','small'));return;}
 box.append(node('p','Sugerencias para revisar: no están insertadas en el vídeo.','small'));
 for(const cue of result.cues){
  const context=cue.narrative?' · '+cue.narrative.label+' (interpretación provisional)':' · Coincidencia de catálogo';
  const details=node('details'),summary=node('summary',cue.start.toFixed(1)+'–'+cue.end.toFixed(1)+' s'+context+' · '+cue.transcriptQuote),list=node('ul');
  for(const candidate of cue.candidates){
   if(!candidate.needsHumanReview||!['video','overlay','image'].includes(candidate.kind))continue;
   const sample=candidate.evidence?.visualSample;
   const sampleMessage=sample?.scope==='sampled-frames-only'
    ?' · Revisión parcial: '+sample.sampleCount+' fotogramas'+(sample.riskFlags?.includes('person-visible')?' · aparece una persona':'')
    :' · Sin muestreo visual registrado';
   const reasoning=cue.narrative?' · Razón propuesta: '+cue.narrative.reason:'';
   const temporal=candidate.evidence?.temporalReview;
   const sourceRange=candidate.evidence?.suggestedSourceRange;
   const timeline=sourceRange
    ?' · Tramo de origen sugerido '+sourceRange.startSec.toFixed(2)+'–'+sourceRange.endSec.toFixed(2)+' s (sin aplicar)'
    :temporal?.complete?' · Auditoría temporal: sin tramo continuo suficiente':' · Sin auditoría temporal completa';
   list.append(node('li',candidate.title+' · '+candidate.kind+' · '+(candidate.catalogueApproval==='approved'?'Catalogado, revisar composición':'Pendiente de aprobación visual')+reasoning+sampleMessage+timeline));
  }
  details.append(summary,list);box.append(details);
 }
});
