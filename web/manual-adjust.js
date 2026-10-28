/* Non-destructive manual-adjust studio. The export is never modified in place. */
(()=>{
 'use strict';
 let kind='captions',selected=null,draft=null,history=[],parentId=null,touched=new Set();
 const n=(tag,label,cls)=>{const el=document.createElement(tag);if(label!==undefined)el.textContent=label;if(cls)el.className=cls;return el;};
 const clone=value=>structuredClone(value);
 const millis=t=>Math.round(t*1000)/1000;
 const time=t=>{const s=Math.max(0,Math.floor(t||0));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');};
 const duration=()=>Number(plan?.manifest?.duration)||0;
 const canEdit=()=>!!draft&&current?.id===parentId&&current?.state==='DONE';
 const player=()=>document.getElementById('video');
 const status=text=>{$('adjust-status').textContent=text;};
 const captionFields=()=>Object.fromEntries([...$('captions').querySelectorAll('textarea[data-id]')].map(f=>[f.dataset.id,f.value]));
 const draftKey=()=>parentId?'sues-adjust-v1:'+parentId:null;
 const persist=()=>{try{if(draftKey())localStorage.setItem(draftKey(),JSON.stringify({fingerprint:current.fingerprint,snapshot:snapshot()}));}catch{}};
 const snapshot=()=>({draft:clone(draft),touched:[...touched],captions:captionFields(),musicGain:$('music-gain').value});
 const restore=s=>{draft=clone(s.draft);touched=new Set(s.touched);for(const f of $('captions').querySelectorAll('textarea[data-id]'))if(Object.hasOwn(s.captions,f.dataset.id))f.value=s.captions[f.dataset.id];$('music-gain').value=s.musicGain;$('music-value').textContent=s.musicGain+' %';};
 function change(fn,field){if(!canEdit())return;const previous=snapshot();try{fn();if(field)touched.add(field);history.push(previous);if(history.length>40)history.shift();markPreviewDirty();persist();status('Ajustes pendientes. El reproductor muestra la versión anterior; guarda y genera para ver el nuevo resultado.');}catch(err){restore(previous);status('No se pudo aplicar el ajuste: '+err.message);}render();}
 const manifestItems=()=>{
  if(!plan?.manifest)return [];
  const p=plan.manifest;
  if(kind==='captions')return p.captions.map(c=>({key:c.id,id:c.id,start:draft.captionTimingOverrides[c.id]?.start??c.start,end:draft.captionTimingOverrides[c.id]?.end??c.end,title:c.text,hidden:draft.hiddenCaptionIds.includes(c.id)}));
  if(kind==='broll')return draft.videoEvents.map((e,i)=>({key:'broll-'+i,id:i,start:e.start,end:e.end,title:e.reason||'B-roll '+(i+1)}));
  if(kind==='sfx')return draft.sfxEvents.map((e,i)=>({key:'sfx-'+i,id:i,start:e.start,end:e.end??(e.start+(assetLibrary.find(a=>a.id===e.assetId)?.duration??.3)),title:assetLibrary.find(a=>a.id===e.assetId)?.title??'Sonido '+(i+1)}));
  if(kind==='images')return draft.imageEvents.map((e,i)=>({key:'image-'+i,id:i,start:e.start,end:e.end,title:assetLibrary.find(a=>a.id===e.assetId)?.title??'Imagen '+(i+1)}));
  if(kind==='graphics')return (p.graphics??[]).filter(g=>draft.graphicCards.some(c=>c.captionId===g.captionId)).map(g=>({key:'card-'+g.captionId,id:g.captionId,start:g.start,end:g.end,title:g.heading||g.text||'Tarjeta gráfica'}));
  if(kind==='music')return p.audioSourceAvailable?[{key:'music',id:'music',start:0,end:duration(),title:'Música del montaje'}]:[];
  return [];
 };
 function selectEvent(item){selected=item?.key??null;const video=player();if(item&&video&&Number.isFinite(video.duration)&&video.duration>0){video.currentTime=Math.max(0,Math.min(video.duration,item.start));}render();}
 const button=(label,handler,css)=>{const b=n('button',label,css);b.type='button';b.onclick=handler;return b;};
 function seeked(){const video=player();const pct=video&&Number.isFinite(video.duration)&&video.duration>0?video.currentTime/video.duration*100:0;$('adjust-playhead').style.left=pct+'%';$('adjust-time-now').textContent=time(video?.currentTime??0);}
 function changeTimes(index,patch){
  const field={broll:'videoEvents',sfx:'sfxEvents',images:'imageEvents'}[kind];if(!field)return;
  change(()=>{const e=draft[field][index],old={...e},d=duration();
   if(!e)throw Error('Elemento ya no disponible');
   if(Number.isFinite(patch.move)){
    const len=(e.end??(e.start+(assetLibrary.find(a=>a.id===e.assetId)?.duration??.3)))-e.start;
    const start=Math.max(0,Math.min(d-len,millis(e.start+patch.move)));
    if(kind==='sfx'){e.start=start;}else{e.start=start;e.end=millis(start+len);}
   }else if(Number.isFinite(patch.start)&&Number.isFinite(patch.end)){
    if(kind==='sfx')throw Error('Este sonido solo admite cambio de inicio');
    if(patch.start<0||patch.end>duration()||patch.end<=patch.start)throw Error('Intervalo inválido');
    e.start=millis(patch.start);e.end=millis(patch.end);
   }
   const sorted=draft[field].map((v,i)=>({...v,originalIndex:i})).sort((a,b)=>a.start-b.start);
   if(kind==='broll'&&sorted.some((v,i)=>i>0&&v.start<sorted[i-1].end))throw Error('El B-roll se solapa con otro. Reduce la duración o muévelo menos.');
   if(kind==='images'&&(e.end-e.start<.6||e.end-e.start>8))throw Error('Las imágenes duran entre 0,6 y 8 segundos.');
   if(kind==='broll'&&old.end-old.start!==e.end-e.start&&e.end-e.start<2.5)throw Error('B-roll demasiado corto.');
  },field);
 }
 function inspector(items){const box=$('adjust-inspector');box.replaceChildren();const item=items.find(e=>e.key===selected);if(!item){box.append(n('p','Selecciona un bloque naranja o un elemento de la lista.'));return;}
  box.append(n('h3',item.title),n('p',time(item.start)+'–'+time(item.end)+' · '+kind));
  if(kind==='captions'){
   const old=draft.hiddenCaptionIds.includes(item.id);
   box.append(button(old?'Mostrar subtítulo':'Ocultar subtítulo',()=>change(()=>{draft.hiddenCaptionIds=old?draft.hiddenCaptionIds.filter(id=>id!==item.id):[...draft.hiddenCaptionIds,item.id];},'hiddenCaptionIds')),n('p','Se ocultará solamente este segmento; la voz seguirá intacta.'));
   const times=n('div',undefined,'adjust-inline');
   const move=delta=>change(()=>{const len=item.end-item.start,start=Math.max(0,Math.min(duration()-len,millis(item.start+delta)));draft.captionTimingOverrides[item.id]={start,end:millis(start+len)};},'captionTimingOverrides');
   times.append(button('−0,1 s',()=>move(-.1)),button('+0,1 s',()=>move(.1)));box.append(times);
   const fields=n('div',undefined,'adjust-field-grid'),values=[];
   for(const [label,value]of [['Inicio',item.start],['Final',item.end]]){const lab=n('label',label),input=n('input');input.type='number';input.step='.1';input.min='0';input.max=String(duration());input.value=String(value);lab.append(input);fields.append(lab);values.push(input);}
   box.append(fields,button('Aplicar tiempo',()=>change(()=>{const start=Number(values[0].value),end=Number(values[1].value);if(start<0||end>duration()||end-start<1/30)throw Error('Intervalo inválido');draft.captionTimingOverrides[item.id]={start,end};},'captionTimingOverrides')));
   const field=$('captions').querySelector('textarea[data-id="'+item.id+'"]');if(field){const label=n('label','Texto del subtítulo'),input=n('input');input.type='text';input.maxLength=52;input.value=field.value;input.addEventListener('change',()=>{if(input.value.trim()&&input.value!==field.value)change(()=>{field.value=input.value.trim();});});label.append(input);box.append(label);}
  }else if(['broll','images','sfx'].includes(kind)){
   const controls=n('div',undefined,'adjust-inline');controls.append(button('−0,1 s',()=>changeTimes(item.id,{move:-.1})),button('+0,1 s',()=>changeTimes(item.id,{move:.1})));box.append(controls);
   if(kind!=='sfx'){
    const fields=n('div',undefined,'adjust-field-grid'),inputs=[];
    for(const [name,value] of [['Inicio',item.start],['Final',item.end]]){const lab=n('label',name),field=n('input');field.type='number';field.min='0';field.max=String(duration());field.step='.1';field.value=String(value);lab.append(field);fields.append(lab);inputs.push(field);}
    box.append(fields,button('Aplicar tiempo',()=>changeTimes(item.id,{start:Number(inputs[0].value),end:Number(inputs[1].value)})));
   }
   const prop={broll:'videoEvents',images:'imageEvents',sfx:'sfxEvents'}[kind],assetKind={broll:'video',images:'image',sfx:'sfx'}[kind],event=draft[prop][item.id];
   const candidates=assetLibrary.filter(a=>a.kind===assetKind&&a.id!==event.assetId&&a.rights&& (kind==='images'||!Number.isFinite(a.duration)||a.duration>=item.end-item.start));
   if(candidates.length){
    const label=n('label','Sustituir por un recurso instalado'),picker=n('select');
    const placeholder=n('option','Selecciona otro recurso');placeholder.value='';picker.append(placeholder);
    for(const a of candidates){const choice=n('option',a.title||a.id.slice(0,12));choice.value=a.id;picker.append(choice);}
    label.append(picker);box.append(label);
    const media=n(kind==='sfx'?'audio':kind==='broll'?'video':'img');
    if(kind!=='images')media.controls=true;media.preload='none';media.style.maxWidth='100%';media.style.maxHeight='160px';media.hidden=true;
    picker.onchange=()=>{media.hidden=!picker.value;if(picker.value)media.src='/api/assets/'+picker.value+'/media';else media.removeAttribute('src');};box.append(media);
    box.append(button('Sustituir seleccionado',()=>{if(!picker.value)return;const chosen=assetLibrary.find(a=>a.id===picker.value&&a.kind===assetKind);if(!chosen)return;change(()=>{if(kind==='broll'&&draft.videoEvents.some((e,i)=>i!==item.id&&e.assetId===chosen.id))throw Error('El B-roll ya está utilizado en otro intervalo');draft[prop][item.id].assetId=chosen.id;if(kind==='broll')draft[prop][item.id].sourceIn=0;},prop);status('Recurso sustituido. Revisa su adecuación narrativa y su fragmento antes de validar.');}));
   }
   if(kind==='sfx'){const label=n('label','Volumen (%)'),volume=n('input');volume.type='number';volume.min='0';volume.max='70';volume.step='1';volume.value=String(Math.round(event.gain*100));label.append(volume);box.append(label,button('Aplicar volumen',()=>change(()=>{const gain=Number(volume.value)/100;if(!Number.isFinite(gain)||gain<0||gain>.7)throw Error('Volumen entre 0 y 70 %');draft.sfxEvents[item.id].gain=gain;},'sfxEvents')));}
   box.append(button('Eliminar este elemento',()=>change(()=>{draft[prop].splice(item.id,1);selected=null;},prop),'adjust-remove'));
  }else if(kind==='graphics'){
   box.append(button('Eliminar tarjeta gráfica',()=>change(()=>{draft.graphicCards=draft.graphicCards.filter(c=>c.captionId!==item.id);selected=null;},'graphicCards'),'adjust-remove'));
   const card=draft.graphicCards.find(c=>c.captionId===item.id);
   if(card){for(const key of ['heading','lead','left','right']){if(card[key]===undefined)continue;const label=n('label',({heading:'Título',lead:'Entrada',left:'Texto izquierdo',right:'Texto derecho'})[key]),input=n('input');input.maxLength=26;input.value=card[key];input.onchange=()=>change(()=>{if(!input.value.trim())throw Error('El texto no puede quedar vacío');card[key]=input.value.trim();},'graphicCards');label.append(input);box.append(label);}
   for(const [index,text]of (card.bodyLines??[]).entries()){const label=n('label','Línea '+(index+1)),input=n('input');input.maxLength=26;input.value=text;input.onchange=()=>change(()=>{if(!input.value.trim())throw Error('El texto no puede quedar vacío');card.bodyLines[index]=input.value.trim();},'graphicCards');label.append(input);box.append(label);}}
   box.append(n('p','La tarjeta conserva sus anclajes de voz. Guarda y genera una versión para revisar el resultado.'));
  }else if(kind==='music'){
   const l=n('label','Volumen de música ('+$('music-gain').value+' %)'),range=n('input');range.type='range';range.min='0';range.max='18';range.step='1';range.value=$('music-gain').value;range.onchange=()=>change(()=>{$('music-gain').value=range.value;$('music-value').textContent=range.value+' %';});l.append(range);box.append(l);
  }
 }
 function render(){if(!draft||!canEdit())return;
  const d=duration(),items=manifestItems();$('adjust-time-end').textContent=time(d);
  for(const b of $('adjust-kinds').querySelectorAll('[data-adjust-kind]'))b.setAttribute('aria-pressed',String(b.dataset.adjustKind===kind));
  if(!items.some(x=>x.key===selected))selected=null;
  const blocks=$('adjust-blocks'),list=$('adjust-event-list');blocks.replaceChildren();list.replaceChildren();
  for(const item of items){
   const segment=button(item.title,()=>selectEvent(item),'adjust-block'+(item.hidden?' is-hidden':''));segment.title=item.title+' · '+time(item.start)+'–'+time(item.end);segment.setAttribute('aria-pressed',String(item.key===selected));segment.style.left=(d?item.start/d*100:0)+'%';segment.style.width=(d?Math.max(.8,(item.end-item.start)/d*100):0)+'%';
   // Touch/mouse drag of timed B-roll, SFX and images. Small accidental movement is ignored.
   if(['broll','sfx','images'].includes(kind)){
    let origin=null;segment.style.touchAction='none';segment.onpointerdown=event=>{origin={x:event.clientX,width:blocks.clientWidth,key:item.key};segment.setPointerCapture(event.pointerId);};
    segment.onpointerup=event=>{if(!origin)return;const diff=(event.clientX-origin.x)/Math.max(1,origin.width)*d;origin=null;if(Math.abs(diff)>=.075){selected=item.key;changeTimes(item.id,{move:Math.round(diff*10)/10});}};
    segment.onpointercancel=()=>{origin=null;};
   }
   blocks.append(segment);
   const entry=button(time(item.start)+' · '+item.title,()=>selectEvent(item));entry.title=item.title;entry.setAttribute('aria-pressed',String(item.key===selected));list.append(entry);
  }
  if(!items.length)list.append(n('p',kind==='music'?'No hay pista musical disponible.':'No hay elementos editables de esta categoría en el montaje.'));
  inspector(items);seeked();$('adjust-undo').disabled=!history.length;$('adjust-apply').disabled=!previewDirty;
 }
 function changeMode(mode){document.body.dataset.postMode=mode;$('adjust-studio').hidden=mode!=='adjust';$('validation-studio').hidden=mode!=='validation';if(mode==='adjust')render();}
 function load(job){
  if(!job||job.state!=='DONE'){if(document.body.dataset.postMode)changeMode('off');$('post-render-actions').hidden=true;parentId=null;draft=null;return;}
  parentId=job.id;history=[];selected=null;touched.clear();
  draft={captionTimingOverrides:clone(job.settings.captionTimingOverrides??{}),hiddenCaptionIds:[...(job.settings.hiddenCaptionIds??[])],videoEvents:clone(job.settings.videoEvents??[]),sfxEvents:clone(job.settings.sfxEvents??[]),graphicCards:clone(job.settings.graphicCards??[]),imageEvents:clone(job.settings.imageEvents??[])};
  $('post-render-actions').hidden=false;$('post-validate').disabled=false;
  for(const [key,name] of [['captions','captionsReviewed'],['framing','framingReviewed'],['audio','audioReviewed']])$('quick-review-'+key).checked=job.editorialReview?.[name]??false;
  $('quick-review-major').value=String(job.editorialReview?.majorChanges??0);$('quick-review-minor').value=String(job.editorialReview?.minorChanges??0);
  $('quick-validation-status').textContent=job.editorialReview?.pass?'Esta versión ya tiene validación registrada.':'Revisión todavía pendiente.';
  try{const saved=JSON.parse(localStorage.getItem(draftKey()));if(saved?.fingerprint===job.fingerprint&&saved.snapshot?.draft){restore(saved.snapshot);markPreviewDirty();status('Ajustes pendientes recuperados. El reproductor conserva el último vídeo generado.');}}catch{}
  changeMode('off');render();
 }
 function settingsPatch(){if(!draft||!canEdit())return {};const data={captionTimingOverrides:clone(draft.captionTimingOverrides),hiddenCaptionIds:[...draft.hiddenCaptionIds].sort(),videoEvents:clone(draft.videoEvents),sfxEvents:clone(draft.sfxEvents),graphicCards:clone(draft.graphicCards),imageEvents:clone(draft.imageEvents)};return Object.fromEntries([...touched].map(k=>[k,data[k]]));}
 $('post-adjust').onclick=()=>{if(!canEdit())return;changeMode('adjust');if(!previewDirty)showPlayer('preview');};
 $('post-validate').onclick=()=>{if(!canEdit()||previewDirty)return;changeMode('validation');};
 $('adjust-close').onclick=()=>changeMode('off');
 for(const b of $('adjust-kinds').querySelectorAll('[data-adjust-kind]'))b.onclick=()=>{kind=b.dataset.adjustKind;selected=null;render();};
 $('adjust-undo').onclick=()=>{const prev=history.pop();if(!prev)return;restore(prev);markPreviewDirty();persist();status('Último cambio deshecho. La nueva versión aún no se ha generado.');render();};
 $('adjust-reset').onclick=()=>{if(!canEdit())return;if(previewDirty&&!confirm('Descartar los ajustes pendientes y volver a la versión guardada?'))return;try{localStorage.removeItem(draftKey());}catch{}work(async()=>{await select(parentId);changeMode('adjust');showPlayer('preview');});};
 $('adjust-apply').onclick=()=>work(async()=>{
  if(!canEdit()||!previewDirty)return;
  $('adjust-apply').disabled=true;status('Preparando nueva versión sin utilizar servicios de IA…');
  try {
   const sourceId=parentId,settingsData=settings(),next=await api('jobs','POST',{profileId:current.profileId,settings:settingsData,parentId:sourceId});
   await api('jobs/'+next.id+'/render','POST',{});
   try{localStorage.removeItem(draftKey());}catch{}
   await select(next.id);changeMode('off');$('workflow-status').textContent='Montaje manual en proceso. La versión original sigue guardada.';
  }finally{if(canEdit())$('adjust-apply').disabled=!previewDirty;}
 });
 $('quick-validate-save').onclick=()=>work(async()=>{
  if(!canEdit()||previewDirty)throw Error('Genera primero la versión con los últimos ajustes.');
  const body={captionsReviewed:$('quick-review-captions').checked,framingReviewed:$('quick-review-framing').checked,audioReviewed:$('quick-review-audio').checked,majorChanges:Number($('quick-review-major').value),minorChanges:Number($('quick-review-minor').value)};
  const result=await api('jobs/'+current.id+'/acceptance','POST',body);
  current.editorialReview=result;$('export-video').disabled=!versionApproved()||previewDirty;
  $('quick-validation-status').textContent=result.pass?'Versión aceptada. Ya puedes exportar el MP4.':'Revisión registrada; '+(result.technicalQuality?.issues?.join('; ')||'quedan elementos sin revisar o cambios pendientes.');
  for(const [k,name] of [['captions','captionsReviewed'],['framing','framingReviewed'],['audio','audioReviewed']])$('review-'+k).checked=body[name];$('review-major').value=String(body.majorChanges);$('review-minor').value=String(body.minorChanges);
 });
 const vid=player();vid.addEventListener('timeupdate',seeked);vid.addEventListener('loadedmetadata',seeked);
 window.suesManualAdjust={load,settingsPatch,render,changeMode};
})();
