/* Non-destructive manual-adjust studio. The export is never modified in place. */
(()=>{
 'use strict';
 let fragmentBusy=false,fragmentEpoch=0,activeFragment=null,fragmentCancelRequested=false;
 let kind='captions',selected=null,draft=null,history=[],parentId=null,touched=new Set(),inspectorPage=0,inspectorContext='';
 const n=(tag,label,cls)=>{const el=document.createElement(tag);if(label!==undefined)el.textContent=label;if(cls)el.className=cls;return el;};
 const clone=value=>structuredClone(value);
 const millis=t=>Math.round(t*1000)/1000;
 const time=t=>{const s=Math.max(0,Math.floor(t||0));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');};
 const duration=()=>Number(plan?.manifest?.duration)||0;
 const canEdit=()=>!!draft&&current?.id===parentId&&current?.state==='DONE';
 let mainSelection=null;
 const spansFor=(cuts=draft?.montageCuts??[],d=duration())=>{let pos=0,out=0;const spans=[];for(const c of [...cuts,{start:d,end:d}]){if(c.start>pos){spans.push({start:pos,end:c.start,at:out});out+=c.start-pos;}pos=c.end;}return spans;};
 const toOutput=(t,cuts=draft?.montageCuts??[])=>{const s=spansFor(cuts).find(s=>t<s.end)??spansFor(cuts).at(-1);return s?s.at+Math.max(0,Math.min(s.end-s.start,t-s.start)):0;};
 const fromOutput=(t,cuts=draft?.montageCuts??[])=>{const spans=spansFor(cuts),s=spans.find(s=>t<s.at+s.end-s.start-1e-7)??spans.at(-1);return s?s.start+Math.max(0,Math.min(s.end-s.start,t-s.at)):0;};
 const displayDuration=()=>toOutput(duration());
 const player=()=>new Proxy(document.getElementById('video'),{
  get(v,k){if(k==='currentTime')return document.body.dataset.livePreview==='true'?v.currentTime:fromOutput(v.currentTime,current?.settings?.montageCuts??[]);if(k==='duration')return duration();const x=Reflect.get(v,k,v);return typeof x==='function'?x.bind(v):x;},
  set(v,k,x){if(k==='currentTime'){v.currentTime=document.body.dataset.livePreview==='true'?x:toOutput(x,current?.settings?.montageCuts??[]);return true;}return Reflect.set(v,k,x,v);}
 });
 const status=text=>{$('adjust-status').textContent=text;};
 const captionFields=()=>Object.fromEntries([...$('captions').querySelectorAll('textarea[data-id]')].map(f=>[f.dataset.id,f.value]));
 const draftKey=()=>parentId?'sues-adjust-v1:'+parentId:null;
 const persist=()=>{try{if(draftKey())localStorage.setItem(draftKey(),JSON.stringify({fingerprint:current.fingerprint,snapshot:snapshot()}));}catch{}};
 const keywordFields=()=>Object.fromEntries([...$('captions').querySelectorAll('select[data-keyword],select[data-level],select[data-style],select[data-scale]')].map(e=>[Object.keys(e.dataset)[0]+':'+Object.values(e.dataset)[0],e.value]));
 const snapshot=()=>({kind,selected,mainSelection,keywords:keywordFields(),draft:clone(draft),touched:[...touched],captions:captionFields(),musicGain:$('music-gain').value});
 const restore=s=>{if(['captions','broll','images','graphics','motions','masks','effects','sfx','music'].includes(s.kind))kind=s.kind;selected=s.selected??null;mainSelection=s.mainSelection??null;draft=clone(s.draft);draft.montageCuts??=[];draft.montageSplits??=[];draft.captionTransforms??={};draft.captionScaleKeyframes??={};draft.motionLayerOverrides??={};draft.musicTracks??=[];draft.transitions??=clone(current.settings.transitions??[]);draft.zoomEvents??=clone(current.settings.zoomEvents??[]);draft.zoomIntensity??=current.settings.zoomIntensity??0;for(const e of $('captions').querySelectorAll('select[data-keyword],select[data-level],select[data-style],select[data-scale]')){const k=Object.keys(e.dataset)[0]+':'+Object.values(e.dataset)[0];if(s.keywords&&Object.hasOwn(s.keywords,k))e.value=s.keywords[k];}touched=new Set(s.touched);for(const f of $('captions').querySelectorAll('textarea[data-id]'))if(Object.hasOwn(s.captions,f.dataset.id))f.value=s.captions[f.dataset.id];$('music-gain').value=s.musicGain;$('music-value').textContent=s.musicGain+' %';};
 function validateBrollDraft(){
  const rules=plan?.manifest?.policy?.visualStyle?.broll;if(!rules)return;
  const endLimit=duration()-Math.max(rules.closingPresenterSeconds,plan.manifest.policy.outro?.duration??0),events=[...draft.videoEvents].sort((a,b)=>a.start-b.start);let previous=-Infinity,total=0;const used=new Set();
  for(const event of events){const length=event.end-event.start,asset=assetLibrary.find(a=>a.id===event.assetId);
   if(!Number.isFinite(event.start)||!Number.isFinite(event.end)||length<rules.minShot-1e-6||length>rules.maxShot+1e-6)throw Error('El B-roll debe durar entre '+rules.minShot+' y '+rules.maxShot+' segundos.');
   if(event.start<rules.openingPresenterSeconds||event.end>endLimit)throw Error('Coloca el B-roll entre '+rules.openingPresenterSeconds.toFixed(2)+' y '+endLimit.toFixed(2)+' s; conserva la apertura y el cierre de la plantilla.');
   if(event.start-previous<rules.minPresenterGap-1e-6)throw Error('Deja '+rules.minPresenterGap+' segundos entre B-rolls.');
   if(used.has(event.assetId))throw Error('Este B-roll ya se utiliza en el montaje.');
   if(!asset||!Number.isFinite(asset.duration)||(event.sourceIn??0)<0||(event.sourceIn??0)+length>asset.duration+1e-6)throw Error('El intervalo supera la duración del archivo original.');
   previous=event.end;used.add(event.assetId);total+=length;
  }
  if(total>duration()*rules.maxCoverage+1e-6)throw Error('Los B-rolls superan el '+Math.round(rules.maxCoverage*100)+' % permitido por la plantilla.');
 }
 function change(fn,field){if(!canEdit())return;const previous=snapshot();try{fn();if(field==='videoEvents')validateBrollDraft();if(field)touched.add(field);history.push(previous);if(history.length>40)history.shift();invalidateFragment();markPreviewDirty();persist();window.suesLivePreview?.refresh();status(window.suesLivePreview?.isReady()?'Actualizando la vista interactiva. Aplicar cambios guardará una nueva versión.':'Ajustes pendientes. Preparando la vista interactiva.');}catch(err){restore(previous);status('No se pudo aplicar el ajuste: '+err.message);}render();}
 const manifestItems=()=>{
  if(!plan?.manifest)return [];
  const p=plan.manifest;
  if(kind==='captions')return p.captions.map(c=>({key:c.id,id:c.id,start:draft.captionTimingOverrides[c.id]?.start??c.start,end:draft.captionTimingOverrides[c.id]?.end??c.end,title:c.text,hidden:draft.hiddenCaptionIds.includes(c.id)}));
  if(kind==='broll')return [...draft.videoEvents.map((e,i)=>({key:'broll-'+i,id:i,start:e.start,end:e.end,title:e.reason||'B-roll '+(i+1)})),
   ...(draft.reviewedForeground?.events??[]).map((e,i)=>({...e,key:'mask-'+i,id:i,title:e.type==='behind-video'?'B-roll · Máscara de sujeto':null})).filter(e=>e.title)];
  if(kind==='sfx')return draft.sfxEvents.map((e,i)=>({key:'sfx-'+i,id:i,start:e.start,end:e.start+(e.duration??((assetLibrary.find(a=>a.id===e.assetId)?.duration??.3)-(e.sourceIn??0))),title:assetLibrary.find(a=>a.id===e.assetId)?.title??'Sonido '+(i+1)}));
  if(kind==='images')return [...draft.imageEvents.map((e,i)=>({key:'image-'+i,id:i,start:e.start,end:e.end,title:assetLibrary.find(a=>a.id===e.assetId)?.title??'Imagen '+(i+1)})),...(p.manualVisuals?.events??[]).filter(e=>e.category==='images'&&!(current.settings.imageEvents??[]).some(x=>x.assetId===e.assetId&&x.start===e.start&&x.end===e.end)).map(e=>({...e,key:e.id,automatic:true,hidden:draft.hiddenVisualEventIds.includes(e.id)}))];
  if(kind==='graphics'){
   const all=(p.manualVisuals?.events??[]).filter(e=>e.category===kind).map(e=>{const element=(p.elements??[]).find(x=>x.captionId===e.captionId);const changed=draft.elements?.items.find(x=>x.captionId===e.captionId);const offset=(draft.elements?.offset??0)-(current.settings.elements?.offset??0);return {...e,key:e.id,title:changed?.label??e.title,...(element&&!element.compositionId?{elementItem:element,start:e.start+offset,end:e.end+offset,revealAt:Math.max(e.start+offset,Math.min(e.end+offset-.05,element.revealAt+offset+(changed?.revealOffset??0)-(element.revealOffset??0)))}:{}),hidden:draft.hiddenVisualEventIds.includes(e.id)};});
   const grouped=new Map(),nested=new Set();
   const offset=(draft.elements?.offset??0)-(current?.settings?.elements?.offset??0);
   for(const e of p.elements??[])if(e.compositionId){const children=grouped.get(e.compositionId)??[];
    const changed=draft.elements?.items.find(x=>x.captionId===e.captionId);
    children.push({...e,start:e.start+offset,end:e.end+offset,revealAt:e.revealAt+offset+(changed?.revealOffset??0)-(e.revealOffset??0),label:changed?.label??e.label});
    grouped.set(e.compositionId,children);nested.add(e.captionId);
   }
   const compositions=[...grouped].map(([id,children])=>{
    children.sort((a,b)=>a.start-b.start);
    const start=children[0].compositionStart+offset,end=children.at(-1).compositionEnd+offset;
    return {key:'element-composition-'+id,id,start,end,title:(children[0].format==='LIST'?'Razones':children[0].format==='RANKING'?'Ranking':'Gráfica')+' · '+children.length+' elementos',isComposition:true,children,group:'elements'};
   });
   return [...compositions,...all.filter(e=>e.group!=='elements'||!nested.has(e.captionId))];
  }
  if(kind==='effects')return [...(draft.transitions??[]).map((e,i)=>({...e,key:'effect-'+i,id:i,start:e.start,end:e.start+.4,title:({warm:'Destello cálido',blur:'Pulso de desenfoque',radial:'Expansión radial'})[e.type],manualTransition:true})).filter(e=>Number.isFinite(e.start)),...(p.manualVisuals?.events??[]).filter(e=>e.category==='effects'&&!(e.group==='global-transitions'&&(current.settings.transitions??[]).some(t=>t.start===e.start))).map(e=>({...e,key:e.id,hidden:draft.hiddenVisualEventIds.includes(e.id)}))];
  if(kind==='motions')return (p.manualVisuals?.events??[]).filter(e=>e.category===kind&&!(e.group==='foreground'&&e.assetId)).map(e=>{
   const edit=e.sourceId&&draft.motionLayerOverrides?.[e.sourceId],saved=e.sourceId&&current.settings.motionLayerOverrides?.[e.sourceId],offset=(edit?.offset??0)-(saved?.offset??0);
   return {...e,key:e.id,start:e.start+offset,end:e.end+offset,
    children:e.children?.map(child=>{const layerOffset=(edit?.layers?.[child.id]?.offset??0)-(saved?.layers?.[child.id]?.offset??0);return {...child,start:child.start+offset+layerOffset,end:child.end+offset+layerOffset,content:edit?.layers?.[child.id]?.text??child.content};}),
    hidden:draft.hiddenVisualEventIds.includes(e.id)};
  });
  if(kind==='masks')return (draft.reviewedForeground?.events??[]).map((e,i)=>({key:'mask-'+i,id:i,start:e.start,end:e.end,title:e.type==='behind-video'?'B-roll detrás del sujeto':e.type==='behind-text'?e.lines.join(' '):'Desenfoque de fondo',type:e.type}));
  if(kind==='music')return [...(p.audioMix?[{key:'music',id:'music',start:0,end:duration(),title:'Música de fondo'}]:[]),...(draft.musicTracks??[]).map((e,i)=>({key:'music-track-'+i,id:i,start:e.start,end:e.end,title:assetLibrary.find(a=>a.id===e.assetId)?.title??'Pista '+(i+1)}))];
  return [];
 };
 function openElementPanel(){
  if(!matchMedia('(max-width:700px)').matches)return;let back=$('manual-layer-back');if(!back){back=button('← Línea de tiempo',()=>{document.body.dataset.manualPanel='timeline';back.hidden=true;$('tool-panel').scrollTop=0;render();});back.id='manual-layer-back';$('adjust-studio').querySelector('.adjust-heading').prepend(back);}const was=document.body.dataset.manualPanel==='element';document.body.dataset.manualPanel='element';if($('manual-layer-back'))$('manual-layer-back').hidden=false;$('tool-panel').scrollTop=0;/* Keep original framing; never auto-zoom on selection. */
 }
 function selectEvent(item){selected=item?.key??null;const video=player();if(item&&video&&Number.isFinite(video.duration)&&video.duration>0&&(video.currentTime<item.start||video.currentTime>=item.end)){video.currentTime=Math.max(0,Math.min(video.duration,item.start));}render();openElementPanel();}
 function changeMaskTimes(index,start,end){
  change(()=>{
   const fg=draft.reviewedForeground,e=fg?.events[index];
   if(!e||!Number.isFinite(start)||!Number.isFinite(end)||start<0||end>duration()||end-start<1/30)throw Error('Intervalo inválido');
   if(!fg.matte.activeRanges.some(r=>r.start<=start&&r.end>=end))throw Error('La máscara del sujeto no cubre ese intervalo. Ajusta el tiempo dentro de la zona revisada.');
   if(e.type==='behind-video'&&e.sourceIn+end-start>(e.mediaDuration??assetLibrary.find(a=>a.id===e.assetId)?.duration??0))throw Error('El recurso es más corto que el intervalo');
   e.start=millis(start);e.end=millis(end);
  },'reviewedForeground');
 }
 const button=(label,handler,css)=>{const b=n('button',label,css);b.type='button';b.onclick=handler;return b;};
 function seeked(){const video=player();const pct=video&&Number.isFinite(video.duration)&&video.duration>0?video.currentTime/video.duration*100:0;$('adjust-playhead').style.left=pct+'%';$('adjust-time-now').textContent=time(video?.currentTime??0);}
 function changeTimes(index,patch){
  const field={broll:'videoEvents',sfx:'sfxEvents',images:'imageEvents',music:'musicTracks'}[kind];if(!field)return;
  change(()=>{const e=draft[field][index],old={...e},d=duration();
   if(!e)throw Error('Elemento ya no disponible');
   if(Number.isFinite(patch.move)){
    const len=kind==='sfx'?(e.duration??((assetLibrary.find(a=>a.id===e.assetId)?.duration??.3)-(e.sourceIn??0))):e.end-e.start;
    const start=Math.max(0,Math.min(d-len,millis(e.start+patch.move)));
    if(kind==='sfx'){e.start=start;}else{e.start=start;e.end=millis(start+len);}
   }else if(Number.isFinite(patch.start)&&Number.isFinite(patch.end)){

    if(patch.start<0||patch.end>duration()||patch.end<=patch.start)throw Error('Intervalo inválido');
    const oldEnd=kind==='sfx'?old.start+(old.duration??((assetLibrary.find(a=>a.id===old.assetId)?.duration??.3)-(old.sourceIn??0))):old.end;
    if(['broll','sfx','music'].includes(kind)&&Math.abs(patch.end-oldEnd)<.001&&patch.start!==old.start){
     const sourceIn=millis((old.sourceIn??0)+patch.start-old.start);if(sourceIn<0)throw Error('No hay más material antes del inicio del recurso');e.sourceIn=sourceIn;
    }
    e.start=millis(patch.start);if(kind==='sfx'){e.duration=millis(patch.end-patch.start);delete e.end;}else e.end=millis(patch.end);
    if(['broll','sfx','music'].includes(kind)){const available=assetLibrary.find(a=>a.id===e.assetId)?.duration;if(Number.isFinite(available)&&(e.sourceIn??0)+patch.end-patch.start>available+.001)throw Error('El recurso es más corto que el intervalo');}

   }
   const sorted=draft[field].map((v,i)=>({...v,originalIndex:i})).sort((a,b)=>a.start-b.start);
   if(kind==='broll'&&sorted.some((v,i)=>i>0&&v.start<sorted[i-1].end))throw Error('El B-roll se solapa con otro. Reduce la duración o muévelo menos.');
   if(kind==='images'&&(e.end-e.start<.6||e.end-e.start>8))throw Error('Las imágenes duran entre 0,6 y 8 segundos.');
   if(kind==='music'&&e.end-e.start<1/30-1e-6)throw Error('Fragmento musical inferior a un fotograma');
   if(kind==='broll'&&e.end-e.start<2.5-1e-6)throw Error('B-roll demasiado corto.');
  },field);
 }
 function addAtPlayhead(box){
  if(kind==='effects'){
   const group=n('details'),summary=n('summary','Añadir efecto en el punto actual'),label=n('label','Efecto'),select=n('select');select.setAttribute('aria-label','Efecto para añadir');
   for(const [value,text] of [['warm','Destello cálido'],['blur','Pulso de desenfoque'],['radial','Expansión radial']]){const option=n('option',text);option.value=value;select.append(option);}label.append(select);group.append(summary,label,button('Añadir efecto aquí',()=>change(()=>{
    const start=millis(player().currentTime);if(start+.4>duration()-(plan.manifest.policy.outro?.duration??0))throw Error('Sitúa el cabezal antes del cierre');
    if(draft.transitions.some(e=>Number.isFinite(e.start)&&e.start<start+.4&&e.start+.4>start))throw Error('El efecto se solapa con otro');
    draft.transitions.push({type:select.value,start});selected='effect-'+(draft.transitions.length-1);
   },'transitions')));box.append(group);return;
  }
  const assetKind={broll:'video',sfx:'sfx',images:'image',music:'audio'}[kind];if(!assetKind)return;
  const candidates=assetLibrary.filter(a=>a.kind===assetKind&&['owned','licensed'].includes(a.rights));
  if(!candidates.length)return;
  const group=n('details'),heading=n('summary','Añadir recurso en el punto actual');group.append(heading);
  const label=n('label','Recurso de la biblioteca'),picker=n('select');picker.setAttribute('aria-label','Recurso para añadir');
  const empty=n('option','Elige un recurso');empty.value='';picker.append(empty);
  for(const a of candidates){const option=n('option',a.title??a.id);option.value=a.id;picker.append(option);}label.append(picker);group.append(label);
  const media=n(assetKind==='image'?'img':['sfx','audio'].includes(assetKind)?'audio':'video');media.hidden=true;media.style.maxWidth='100%';media.style.maxHeight='150px';if(assetKind!=='image'){media.controls=true;media.preload='none';}
  picker.onchange=()=>{media.hidden=!picker.value;if(picker.value)media.src='/api/assets/'+picker.value+'/media';else media.removeAttribute('src');};group.append(media);
  const lengthLabel=n('label','Duración (s)'),length=n('input');length.type='number';length.min=kind==='broll'?'2.5':kind==='images'?'.6':'.03';length.max=kind==='images'?'8':'30';length.step='.1';length.value=kind==='sfx'?'.5':'3';length.setAttribute('aria-label','Duración del recurso nuevo');lengthLabel.append(length);group.append(lengthLabel);
  const reason=n('input');if(kind==='broll'){const label=n('label','Qué aporta este B-roll aquí');reason.maxLength=160;label.append(reason);group.append(label);}
  const replace=n('input'),omitZoom=n('input');replace.type=omitZoom.type='checkbox';
  if(kind==='broll'){for(const [input,text] of [[replace,'Sustituir B-rolls incompatibles en este intervalo'],[omitZoom,'Omitir zooms ocultos por este B-roll']]){const label=n('label',text);label.prepend(input);group.append(label);}}
  group.append(button('Añadir aquí',()=>{const asset=assetLibrary.find(a=>a.id===picker.value&&a.kind===assetKind);if(!asset){status('Elige un recurso de la biblioteca.');return;}
   const field={broll:'videoEvents',sfx:'sfxEvents',images:'imageEvents',music:'musicTracks'}[kind],start=millis(player().currentTime),len=Number(length.value),end=millis(start+len);
   change(()=>{if(!Number.isFinite(len)||len<Number(length.min)||len>Number(length.max)||end>duration())throw Error('El recurso no cabe en ese intervalo');
    if(assetKind!=='image'&&Number.isFinite(asset.duration)&&len>asset.duration)throw Error('El archivo es más corto que el intervalo');
    const event={assetId:asset.id,start,...(kind==='images'?{box:{left:120,right:900,top:140,bottom:420}}:{}),...(kind==='sfx'?{sourceIn:0,duration:len,gain:.3}:kind==='music'?{end,sourceIn:0,gain:.16,keyframes:[]}:{end})};
    if(kind==='broll'){if(reason.value.trim().length<5)throw Error('Explica qué aporta el B-roll en ese momento');const gap=plan.manifest.policy.visualStyle?.broll?.minPresenterGap??3;
     if(replace.checked)draft.videoEvents=draft.videoEvents.filter(e=>e.end+gap<=start||end+gap<=e.start);
     if(draft.videoEvents.some(e=>e.assetId===asset.id||start<e.end+gap&&end+gap>e.start))throw Error('El B-roll ya está utilizado o no deja el margen necesario con otro');
     if(omitZoom.checked){draft.zoomEvents=(draft.zoomEvents??[]).filter(e=>e.end<=start||e.start>=end);if(!draft.zoomEvents.length)draft.zoomIntensity=0;touched.add('zoomEvents');touched.add('zoomIntensity');}
     event.reason=reason.value.trim();event.sourceIn=0;}
    draft[field].push(event);draft[field].sort((a,b)=>a.start-b.start);const index=draft[field].indexOf(event);selected=({broll:'broll-',images:'image-',sfx:'sfx-',music:'music-track-'})[kind]+index;
   },field);
  }));box.append(group);
 }
 function inspector(items){const box=$('adjust-inspector');box.replaceChildren();addAtPlayhead(box);const item=items.find(e=>e.key===selected);if(!item){inspectorContext='';inspectorPage=0;box.append(n('p','Selecciona una capa. Arrastra el centro para moverla o sus extremos para cambiar su duración.'));return;}
  box.append(n('h3',item.title),n('p',time(toOutput(item.start))+'–'+time(toOutput(item.end))+' · '+({captions:'Subtítulo',broll:'B-roll',images:'Imagen',masks:'Máscara',sfx:'Sonido',graphics:'Gráfica',motions:'Motion',effects:'Efecto',music:'Música'}[kind]??kind)));
  if(item.automatic){const hidden=draft.hiddenVisualEventIds.includes(item.id);box.append(button(hidden?'Restaurar imagen':'Ocultar imagen',()=>change(()=>{draft.hiddenVisualEventIds=hidden?draft.hiddenVisualEventIds.filter(id=>id!==item.id):[...draft.hiddenVisualEventIds,item.id];},'hiddenVisualEventIds')));return;}
  if(kind==='captions'){
   const old=draft.hiddenCaptionIds.includes(item.id);
   box.append(button(old?'Mostrar subtítulo':'Ocultar subtítulo',()=>change(()=>{draft.hiddenCaptionIds=old?draft.hiddenCaptionIds.filter(id=>id!==item.id):[...draft.hiddenCaptionIds,item.id];},'hiddenCaptionIds')),n('p','Se ocultará solamente este segmento; la voz seguirá intacta.'));
   const times=n('div',undefined,'adjust-inline');
   const move=delta=>change(()=>{const len=item.end-item.start,start=Math.max(0,Math.min(duration()-len,millis(item.start+delta)));draft.captionTimingOverrides[item.id]={start,end:millis(start+len)};},'captionTimingOverrides');
   times.append(button('−0,1 s',()=>move(-.1)),button('+0,1 s',()=>move(.1)));box.append(times);
   const fields=n('div',undefined,'adjust-field-grid'),values=[];
   for(const [label,value]of [['Inicio',item.start],['Final',item.end]]){const lab=n('label',label),input=n('input');input.type='number';input.step='.1';input.min='0';input.max=String(displayDuration());input.value=String(millis(toOutput(value)));lab.append(input);fields.append(lab);values.push(input);}
   box.append(fields,button('Aplicar tiempo',()=>change(()=>{const start=fromOutput(Number(values[0].value)),end=fromOutput(Number(values[1].value));if(start<0||end>duration()||end-start<1/30)throw Error('Intervalo inválido');draft.captionTimingOverrides[item.id]={start,end};},'captionTimingOverrides')));
   const field=$('captions').querySelector('textarea[data-id="'+item.id+'"]');if(field){const label=n('label','Texto del subtítulo'),input=n('input');input.type='text';input.maxLength=52;input.value=field.value;input.addEventListener('change',()=>{if(input.value.trim()&&input.value!==field.value)change(()=>{field.value=input.value.trim();});});label.append(input);box.append(label);}
   for(const [data,labelText] of [['keyword','Palabra a modificar'],['style','Color y acabado'],['scale','Tamaño de la palabra'],['level','Importancia']]){
    const source=$('captions').querySelector('select[data-'+data+'="'+item.id+'"]');if(!source)continue;
    const label=n('label',labelText),proxy=source.cloneNode(true);proxy.value=source.value;for(const k of Object.keys(proxy.dataset))delete proxy.dataset[k];proxy.setAttribute('aria-label',labelText);proxy.onchange=()=>change(()=>{source.value=proxy.value;source.dispatchEvent(new Event('change',{bubbles:true}));});label.append(proxy);box.append(label);
   }
  }else if(kind==='effects'&&item.manualTransition){
   const event=draft.transitions[item.id],label=n('label','Inicio del efecto (s)'),input=n('input');input.type='number';input.min='0';input.step=String(1/30);input.value=String(event.start);label.append(input);box.append(label,button('Aplicar tiempo del efecto',()=>change(()=>{const start=Number(input.value);if(!Number.isFinite(start)||start<0||start+.4>duration()-(plan.manifest.policy.outro?.duration??0))throw Error('El efecto no cabe en ese momento');if(draft.transitions.some((e,i)=>i!==item.id&&Number.isFinite(e.start)&&e.start<start+.4&&e.start+.4>start))throw Error('El efecto se solapa con otro');event.start=millis(start);},'transitions')));
   const typeLabel=n('label','Tipo de efecto'),choice=n('select');choice.setAttribute('aria-label','Tipo de efecto');for(const [value,text] of [['warm','Destello cálido'],['blur','Pulso de desenfoque'],['radial','Expansión radial']]){const option=n('option',text);option.value=value;choice.append(option);}choice.value=event.type;choice.onchange=()=>change(()=>{event.type=choice.value;},'transitions');typeLabel.append(choice);box.append(typeLabel,button('Quitar efecto',()=>change(()=>{draft.transitions.splice(item.id,1);selected=null;},'transitions')),n('p','Revisa el efecto con Ver fragmento; utiliza el mismo motor que el MP4 final.'));
  }else if(kind==='music'&&item.id!=='music'){
   const e=draft.musicTracks[item.id];
   const gain=n('label','Volumen de esta pista (%)'),slider=n('input');slider.type='range';slider.min='0';slider.max='100';slider.step='1';slider.value=String(Math.round(e.gain*100));
   const numeric=n('input');numeric.type='number';numeric.min='0';numeric.max='100';numeric.step='1';numeric.value=slider.value;
   let beforeGain=null;
   const volumeAtHead=()=>{const track=e.keyframes??[],t=localTime();return track.findIndex(k=>Math.abs(k.time-t)<1/60);};
   const updateGain=n=>{
    if(!beforeGain)beforeGain=snapshot();const g=Math.max(0,Math.min(1,Number(n)/100));
    const at=volumeAtHead();if(at>=0)e.keyframes[at].value=g;else e.gain=g;
    slider.value=numeric.value=String(Math.round(g*100));window.suesLivePreview?.markDirty();
   };
   const commitGain=()=>{
    if(!beforeGain)return;history.push(beforeGain);if(history.length>40)history.shift();beforeGain=null;
    touched.add('musicTracks');invalidateFragment();markPreviewDirty();persist();window.suesLivePreview?.refresh();render();
   };
   slider.oninput=()=>updateGain(slider.value);slider.onchange=commitGain;
   numeric.oninput=()=>{if(numeric.value!=='')updateGain(numeric.value);};numeric.onchange=commitGain;
   gain.append(slider,numeric);box.append(gain);
   const localTime=()=>Math.max(0,Math.min(e.end-e.start,player().currentTime-e.start));
   const gainAtHead=()=>{const track=e.keyframes??[],t=localTime();if(!track.length)return e.gain;if(t<=track[0].time)return track[0].value;for(let i=1;i<track.length;i++)if(t<=track[i].time){const a=track[i-1],b=track[i];return a.value+(b.value-a.value)*(t-a.time)/(b.time-a.time);}return track.at(-1).value;};slider.value=numeric.value=String(Math.round(gainAtHead()*100));
   box.append(button('◆ Keyframe de volumen aquí',()=>change(()=>{
    const at=millis(localTime()),keys=e.keyframes??(e.keyframes=[]),index=keys.findIndex(k=>Math.abs(k.time-at)<.017),frame={time:at,value:Number(numeric.value)/100};
    if(index>=0)keys[index]=frame;else keys.push(frame);keys.sort((a,b)=>a.time-b.time);
   },'musicTracks')));
   const existing=n('div',undefined,'live-music-keyframes');for(const k of (e.keyframes??[]))existing.append(button('◆ '+k.time.toFixed(2)+' s · '+Math.round(k.value*100)+' %',()=>{player().currentTime=e.start+k.time;render();}));box.append(existing);
   box.append(button('Silenciar en este instante',()=>change(()=>{e.keyframes=[...(e.keyframes??[]).filter(k=>Math.abs(k.time-localTime())>.017),{time:millis(localTime()),value:0}].sort((a,b)=>a.time-b.time);},'musicTracks')));
   const times=n('div',undefined,'adjust-field-grid'),inputs=[];
   for(const [title,v] of [['Inicio',e.start],['Final',e.end]]){const label=n('label',title),input=n('input');input.type='number';input.step='.033333';input.min='0';input.max=String(duration());input.value=String(v);label.append(input);times.append(label);inputs.push(input);}
   box.append(times,button('Aplicar tiempo',()=>changeTimes(item.id,{start:Number(inputs[0].value),end:Number(inputs[1].value)})));
   box.append(button('Dividir pista aquí',()=>change(()=>{
    const at=millis(player().currentTime),before=e.start,after=e.end;if(at-before<1/30||after-at<1/30)throw Error('Sitúa el cabezal dentro de la pista');
    const shift=at-before,oldKeys=e.keyframes??[];
    const value=oldKeys.length?(()=>{
     if(shift<=oldKeys[0].time)return oldKeys[0].value;
     for(let j=1;j<oldKeys.length;j++)if(shift<=oldKeys[j].time){const a=oldKeys[j-1],b=oldKeys[j],f=(shift-a.time)/(b.time-a.time);return a.value+(b.value-a.value)*f;}
     return oldKeys.at(-1).value;
    })():e.gain;
    const first={...e,end:at,keyframes:oldKeys.length?[...oldKeys.filter(k=>k.time<shift),{time:shift,value}]:[]};
    const second={...e,start:at,sourceIn:e.sourceIn+shift,keyframes:[{time:0,value},...oldKeys.filter(k=>k.time>=shift).map(k=>({...k,time:millis(k.time-shift)})).filter(k=>k.time>.000001)]};
    draft.musicTracks.splice(item.id,1,first,second);selected='music-track-'+(item.id+1);
   },'musicTracks')));
   box.append(button('Eliminar pista',()=>change(()=>{draft.musicTracks.splice(item.id,1);selected=null;},'musicTracks'),'adjust-remove'));
  }else if(kind==='masks'||(kind==='broll'&&item.type==='behind-video')){
   const e=draft.reviewedForeground.events[item.id];
   const timing=n('div',undefined,'adjust-field-grid'),timingInputs=[];
   for(const [label,value]of [['Inicio',item.start],['Final',item.end]]){const lab=n('label',label),input=n('input');input.type='number';input.step=String(1/30);input.min='0';input.max=String(displayDuration());input.value=String(millis(toOutput(value)));lab.append(input);timing.append(lab);timingInputs.push(input);}
   box.append(timing,button('Aplicar tiempo',()=>changeMaskTimes(item.id,fromOutput(Number(timingInputs[0].value)),fromOutput(Number(timingInputs[1].value)))));

   box.append(n('p','La máscara del sujeto permanece vinculada al vídeo. Estos controles ajustan el recurso y su degradado, no inventan una nueva segmentación.'));
   const numeric=(title,value,min,max,step,apply)=>{const label=n('label',title),field=n('input');field.type='number';field.min=String(min);field.max=String(max);field.step=String(step);field.value=String(value);field.setAttribute('aria-label',title);field.onchange=()=>change(()=>{const v=Number(field.value);if(!Number.isFinite(v)||v<min||v>max)throw Error('Valor fuera de rango');apply(v);},'reviewedForeground');label.append(field);box.append(label);};
   if(e.type==='behind-video'){
    const r=e.region??{x:0,y:0,width:1080,height:1920,featherBottom:0};e.region=r;
    numeric('Altura del recurso (px)',r.height,32,1920-r.y,2,v=>{if(v%2)throw Error('Usa un valor par');r.height=v;r.featherBottom=Math.min(v,r.featherBottom);});
    numeric('Difusión inferior (px)',r.featherBottom,0,r.height,2,v=>{r.featherBottom=Math.round(v);});
    numeric('Opacidad (%)',e.opacity*100,5,100,1,v=>{e.opacity=v/100;});
   }else if(e.type==='background-blur')numeric('Difusión del fondo',e.sigma,2,20,1,v=>{e.sigma=v;});
   else {const label=n('label','Texto detrás del sujeto'),text=n('input');text.value=e.lines.join(' / ');text.onchange=()=>change(()=>{const lines=text.value.toUpperCase().split('/').map(x=>x.trim());if(lines.length>2||lines.some(x=>!/^[A-ZÁÉÍÓÚÜÑ0-9 ]{1,12}$/u.test(x)))throw Error('Máximo dos líneas de doce caracteres');e.lines=lines;},'reviewedForeground');label.append(text);box.append(label);}
  }else if(['broll','images','sfx','music'].includes(kind)){
   const controls=n('div',undefined,'adjust-inline');controls.append(button('−0,1 s',()=>changeTimes(item.id,{move:-.1})),button('+0,1 s',()=>changeTimes(item.id,{move:.1})));box.append(controls);
   if(['broll','images','sfx','music'].includes(kind)){
    const fields=n('div',undefined,'adjust-field-grid'),inputs=[];
    for(const [name,value] of [['Inicio',item.start],['Final',item.end]]){const lab=n('label',name),field=n('input');field.type='number';field.min='0';field.max=String(displayDuration());field.step='.1';field.value=String(millis(toOutput(value)));lab.append(field);fields.append(lab);inputs.push(field);}
    box.append(fields,button('Aplicar tiempo',()=>changeTimes(item.id,{start:fromOutput(Number(inputs[0].value)),end:fromOutput(Number(inputs[1].value))})));
   }
   const prop={broll:'videoEvents',images:'imageEvents',sfx:'sfxEvents',music:'musicTracks'}[kind],assetKind={broll:'video',images:'image',sfx:'sfx',music:'audio'}[kind],event=draft[prop][item.id];
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
  }else if(kind==='graphics'&&item.elementItem){
   const data=draft.elements?.items.find(e=>e.captionId===item.captionId);if(!data)return;
   const label=n('label','Texto del elemento'),text=n('input');text.value=data.label;text.maxLength=48;text.onchange=()=>change(()=>{if(!text.value.trim())throw Error('El texto no puede estar vacío');data.label=text.value.trim();},'elements');label.append(text);box.append(label);
   if(item.elementItem.format==='TRUE_FALSE'){
    const answer=n('label','Respuesta que se revela'),choice=n('select');choice.setAttribute('aria-label','Respuesta verdadero o falso');for(const [value,title]of [['true','Verdadero'],['false','Falso']]){const option=n('option',title);option.value=value;choice.append(option);}choice.value=data.answer;choice.onchange=()=>change(()=>{data.answer=choice.value;},'elements');answer.append(choice);box.append(answer);
   }
   box.append(n('p','Revelación: '+item.revealAt.toFixed(3)+' s · ligada al intervalo de voz.'));
   const timing=n('label','Desplazamiento de revelación (s)'),field=n('input');field.type='number';field.min='-1.5';field.max='1.5';field.step=String(1/30);field.value=String(data.revealOffset??0);timing.append(field);box.append(timing,button('Aplicar revelación',()=>change(()=>{const offset=Number(field.value);if(!Number.isFinite(offset)||Math.abs(offset)>1.5)throw Error('Desplazamiento entre −1,5 y 1,5 segundos');data.revealOffset=millis(offset);},'elements')));
   box.append(button('Ver revelación',()=>{player().pause();player().currentTime=item.revealAt;render();}));
  }else if(kind==='graphics'&&item.isComposition){
   box.append(n('p','Esta gráfica se mueve como una composición. Cada razón tiene su aparición independiente, sincronizada con la voz.'));
   const move=(amount)=>change(()=>{
    if(!draft.elements)throw Error('No hay composición ELEMENTS editable');
    draft.elements.offset=millis((draft.elements.offset??0)+amount);
   },'elements');
   const moving=n('div',undefined,'adjust-inline');moving.append(button('Mover −0,1 s',()=>move(-.1)),button('Mover +0,1 s',()=>move(.1)));box.append(moving);
   for(const child of item.children){
    const line=n('div',undefined,'live-element-layer'),data=draft.elements?.items.find(e=>e.captionId===child.captionId);
    if(!data)continue;
    line.append(button('◆ '+time(child.revealAt)+' · '+child.label,()=>{player().currentTime=child.revealAt;render();}));
    const label=n('label','Texto del elemento'),text=n('input');text.value=data.label;text.maxLength=48;
    text.onchange=()=>change(()=>{if(!text.value.trim())throw Error('El texto no puede estar vacío');data.label=text.value.trim();},'elements');label.append(text);line.append(label);
    const shift=n('div',undefined,'adjust-inline');
    for(const [name,delta] of [['−0,1 s',-.1],['+0,1 s',.1]])shift.append(button(name,()=>change(()=>{
     data.revealOffset=millis(Math.max(-1.5,Math.min(1.5,(data.revealOffset??0)+delta)));
    },'elements')));
    line.append(shift);box.append(line);
   }
  }else if(kind==='motions'&&item.sourceId&&item.children?.length){
   const sourceId=item.sourceId;
   const update=fn=>change(()=>{const x=draft.motionLayerOverrides[sourceId]??(draft.motionLayerOverrides[sourceId]={offset:0,layers:{}});fn(x);},'motionLayerOverrides');
   box.append(n('p','Composición por capas · mueve todo el bloque o ajusta cada elemento para sincronizarlo.'));
   const row=n('div',undefined,'adjust-inline');row.append(button('Mover −0,1 s',()=>update(x=>{x.offset=millis((x.offset??0)-.1);})),button('Mover +0,1 s',()=>update(x=>{x.offset=millis((x.offset??0)+.1);})));box.append(row);
   for(const child of item.children){
    const layer=n('div',undefined,'live-element-layer');layer.append(n('strong',(child.kind==='text'?'Texto':'Capa')+' · '+child.id));
    if(child.kind==='text'){
     const label=n('label','Contenido de esta capa'),input=n('input');input.value=child.content??'';input.maxLength=52;
     input.onchange=()=>update(x=>{const a=x.layers[child.id]??(x.layers[child.id]={});a.text=input.value.trim();});label.append(input);layer.append(label);
    }
    const shift=n('div',undefined,'adjust-inline');
    for(const [label,delta] of [['−0,1 s',-.1],['+0,1 s',.1]])shift.append(button(label,()=>update(x=>{
      const a=x.layers[child.id]??(x.layers[child.id]={});a.offset=millis((a.offset??0)+delta);
    })));
    layer.append(shift);box.append(layer);
   }
   const hide=draft.hiddenVisualEventIds.includes(item.id);box.append(button(hide?'Mostrar motion':'Ocultar motion',()=>change(()=>{draft.hiddenVisualEventIds=hide?draft.hiddenVisualEventIds.filter(id=>id!==item.id):[...draft.hiddenVisualEventIds,item.id];},'hiddenVisualEventIds')));
  }else if(['graphics','motions','effects'].includes(kind)){
   const hidden=draft.hiddenVisualEventIds.includes(item.id);
   box.append(button(hidden?'Restaurar elemento':'Ocultar elemento',()=>change(()=>{draft.hiddenVisualEventIds=hidden?draft.hiddenVisualEventIds.filter(id=>id!==item.id):[...draft.hiddenVisualEventIds,item.id];},'hiddenVisualEventIds')));
   if(kind==='motions'||kind==='effects'){box.append(n('p','La capa conserva su animación y máscara verificadas. Puedes ocultarla y restaurarla sin alterar el original.'));return;}
   const anchor=item.captionId;

   box.append(button('Eliminar tarjeta gráfica',()=>change(()=>{draft.hiddenVisualEventIds=[...new Set([...draft.hiddenVisualEventIds,item.id])];},'hiddenVisualEventIds'),'adjust-remove'));
   const card=draft.graphicCards.find(c=>c.captionId===anchor);
   if(card){for(const key of ['heading','lead','left','right']){if(card[key]===undefined)continue;const label=n('label',({heading:'Título',lead:'Entrada',left:'Texto izquierdo',right:'Texto derecho'})[key]),input=n('input');input.maxLength=26;input.value=card[key];input.onchange=()=>change(()=>{if(!input.value.trim())throw Error('El texto no puede quedar vacío');card[key]=input.value.trim();},'graphicCards');label.append(input);box.append(label);}
   for(const [index,text]of (card.bodyLines??[]).entries()){const label=n('label','Línea '+(index+1)),input=n('input');input.maxLength=26;input.value=text;input.onchange=()=>change(()=>{if(!input.value.trim())throw Error('El texto no puede quedar vacío');card.bodyLines[index]=input.value.trim();},'graphicCards');label.append(input);box.append(label);}}
   box.append(n('p','La tarjeta conserva sus anclajes de voz. Guarda y genera una versión para revisar el resultado.'));
  }else if(kind==='music'){
   const l=n('label','Volumen de música ('+$('music-gain').value+' %)'),range=n('input');range.type='range';range.min='0';range.max='18';range.step='1';range.value=$('music-gain').value;range.onchange=()=>change(()=>{$('music-gain').value=range.value;$('music-value').textContent=range.value+' %';});l.append(range);box.append(l);
  }
 }
 function simplifyInspector(){
  const box=$('adjust-inspector');if(!box.querySelector('h3'))return;
  const primary=n('div',undefined,'live-primary-fields'),more=n('details',undefined,'live-more-settings'),summary=n('summary','Tiempo y más ajustes');more.append(summary);
  const heading=box.querySelector('h3');
  if(kind==='captions'){
   for(const title of ['Palabra a modificar','Color y acabado']){
    const select=box.querySelector('select[aria-label="'+title+'"]');if(select){const label=select.closest('label');
     if(title==='Palabra a modificar'){
      const chips=n('div',undefined,'live-word-chips');chips.setAttribute('role','group');chips.setAttribute('aria-label','Elegir palabra');
      const item=manifestItems().find(e=>e.key===selected),words=item?.title.split(/\s+/)??[];
      const add=(text,value)=>{const chip=button(text,()=>{select.value=value;select.dispatchEvent(new Event('change',{bubbles:true}));});chip.setAttribute('aria-pressed',String(select.value===value));chips.append(chip);};
      if([...select.options].some(o=>o.value==='auto'))add('Auto','auto');
      words.forEach((word,i)=>{if([...select.options].some(o=>o.value===String(i)))add(word,String(i));});
      primary.append(chips);continue;
     }
     if(title==='Tamaño de la palabra'){label.firstChild.textContent='Tamaño palabra';for(const option of select.options)if(Number.isFinite(Number(option.value)))option.textContent=Math.round(Number(option.value)*100)+' %';}
     if(title==='Color y acabado'){label.firstChild.textContent='Color';for(const option of select.options)option.textContent=({white:'Blanco',fire:'Naranja',fireMetal:'Naranja metal',gold:'Oro',green:'Verde',cyan:'Cian',blue:'Azul',coral:'Coral',oblique:'Inclinado',condensed:'Estrecho'})[option.value]??option.textContent;}
     primary.append(label);}
   }
   const item=manifestItems().find(e=>e.key===selected);
   if(item){
    const base=()=>Number(window.suesLivePreview?.scene()?.captionFontSizes?.[item.id]??plan?.manifest?.policy?.captions?.fontSize??80)||80;
    const transform=()=>draft.captionTransforms[item.id]??{dx:0,dy:0,scale:1};
    const keys=()=>draft.captionScaleKeyframes?.[item.id]??[];
    const captionTime=()=>Math.max(0,Math.min(item.end-item.start,player().currentTime-item.start));
    const keyIndex=()=>keys().findIndex(k=>Math.abs(k.time-captionTime())<1/60);
    const currentMultiplier=()=>{const track=keys(),t=captionTime();if(!track.length)return 1;if(t<=track[0].time)return track[0].value;for(let i=1;i<track.length;i++)if(t<=track[i].time){const a=track[i-1],b=track[i];return a.value+(b.value-a.value)*(t-a.time)/(b.time-a.time);}return track.at(-1).value;};
    const pixels=()=>Math.round(base()*transform().scale*currentMultiplier());
    const box=n('div',undefined,'live-font-editor'),heading=n('div',undefined,'live-font-heading'),title=n('strong','Tamaño de letra · px'),value=n('input'),range=n('input'),tools=n('div',undefined,'live-font-tools');
    value.type='number';value.min='8';value.max='600';value.step='1';value.value=String(pixels());value.setAttribute('aria-label','Tamaño de fuente en píxeles del vídeo 1080 × 1920');
    range.type='range';range.min='8';range.max='600';range.step='1';range.value=String(Math.max(8,Math.min(600,pixels())));range.setAttribute('aria-label','Deslizar tamaño de letra');
    heading.append(title,value);box.append(heading,range);
    let gestureBefore=null;
    const update=number=>{
     if(!Number.isFinite(number))return;
     const requested=Math.max(8,Math.min(600,Math.round(number)));
     const atKey=keyIndex();
     if(atKey>=0){
      const multiplier=Math.max(.05,Math.min(12,requested/(base()*transform().scale)));
      draft.captionScaleKeyframes[item.id][atKey].value=Math.round(multiplier*100000)/100000;
     }else{
      const newScale=Math.max(.05,Math.min(12,requested/base()));
      draft.captionTransforms[item.id]={...transform(),scale:Math.round(newScale*100000)/100000};
     }
     const actual=pixels();value.value=String(actual);range.value=String(Math.max(8,Math.min(600,actual)));
     window.suesLivePreview?.gesture(item.id,draft.captionTransforms[item.id]);
     window.suesLivePreview?.markDirty();syncTouch();
    };
    const commit=()=>{
     if(!gestureBefore)return;
     history.push(gestureBefore);if(history.length>40)history.shift();gestureBefore=null;
     touched.add('captionTransforms');touched.add('captionScaleKeyframes');invalidateFragment();markPreviewDirty();persist();
     window.suesLivePreview?.refresh();status('Tamaño aplicado al texto; compruébalo en vídeo y exportación.');render();
    };
    range.oninput=()=>{if(!gestureBefore)gestureBefore=snapshot();update(Number(range.value));};
    range.onchange=commit;
    value.onchange=()=>{if(!gestureBefore)gestureBefore=snapshot();update(Number(value.value));commit();};
    const resize=delta=>{gestureBefore=snapshot();update(pixels()+delta);commit();};
    tools.append(button('−',()=>resize(-1)),button('+',()=>resize(1)),button('Restablecer',()=>resize(Math.round(base())-pixels())));
    box.append(tools);
    const markers=n('div',undefined,'live-caption-keys');
    markers.append(button('◆ Añadir keyframe',()=>change(()=>{
     const at=millis(captionTime()),track=draft.captionScaleKeyframes[item.id]??(draft.captionScaleKeyframes[item.id]=[]);
     if(!track.length&&at>0)track.push({time:0,value:1});
     if(!track.some(k=>Math.abs(k.time-at)<1/60))track.push({time:at,value:currentMultiplier()});
     track.sort((a,b)=>a.time-b.time);
    },'captionScaleKeyframes')));
    for(const key of keys())markers.append(button('◆ '+key.time.toFixed(2)+' s',()=>{player().currentTime=item.start+key.time;render();}));
    if(keys().length)markers.append(button('Quitar keyframe actual',()=>change(()=>{
     const index=keyIndex();if(index>=0)draft.captionScaleKeyframes[item.id].splice(index,1);
    },'captionScaleKeyframes')));
    box.append(markers);const fontReady=window.suesLivePreview?.isReady()&&!window.suesLivePreview?.isLoading();for(const control of box.querySelectorAll('input,button'))control.disabled=!fontReady;if(!fontReady)box.append(n('p','Preparando tamaño exacto de letra…'));primary.prepend(box);

   }
  }else if(kind==='masks'){
   for(const input of [...box.querySelectorAll('input[aria-label]')]){const lab=input.closest('label');if(lab)primary.append(lab);}
  }else{
   const times=box.querySelector('.adjust-field-grid');if(times)primary.append(times);
   const apply=[...box.querySelectorAll('button')].find(b=>b.textContent==='Aplicar tiempo');if(apply)primary.append(apply);
   for(const el of [...box.querySelectorAll('label')])if(el.textContent.startsWith('Volumen'))primary.append(el);
  }
  for(const child of [...box.children])if(child!==heading)more.append(child);
  box.append(primary,more);
  const toolbarHeading=$('adjust-studio').querySelector('.adjust-heading');
  let back=$('manual-layer-back');if(!back){back=button('← Línea de tiempo',()=>{document.body.dataset.manualPanel='timeline';if($('manual-layer-back'))$('manual-layer-back').hidden=true;$('tool-panel').scrollTop=0;});back.id='manual-layer-back';toolbarHeading.prepend(back);}
  const compact=matchMedia('(max-width:700px)').matches;back.hidden=!compact||!['element','main'].includes(document.body.dataset.manualPanel);
  if(compact){
   toolbarHeading.append($('adjust-apply'));$('adjust-apply').textContent='Aplicar cambios';
   const context=kind+':'+selected;
   if(context!==inspectorContext){inspectorContext=context;inspectorPage=0;}
   const controls=[...primary.children,...more.children].flatMap(el=>el.classList.contains('live-font-editor')?[...el.children].flatMap(child=>child.classList.contains('live-caption-keys')?[...child.children]:[child]):[el]).filter(el=>el!==summary&&!(el.tagName==='P'&&!el.querySelector('input,button,select,textarea')));
   if(controls.length){
    inspectorPage=Math.min(inspectorPage,controls.length-1);
    const viewport=n('div',undefined,'mobile-property-viewport');
    const groups=[];for(const el of controls){
     const complex=el.classList.contains('live-element-layer')||el.classList.contains('adjust-inline')||el.classList.contains('live-word-chips')||el.classList.contains('live-size-stepper')||el.classList.contains('adjust-field-grid')||!!el.querySelector('textarea');
     const last=groups.at(-1),lastComplex=last?.some(x=>x.classList.contains('live-element-layer')||x.classList.contains('adjust-inline')||x.classList.contains('live-word-chips')||x.classList.contains('live-size-stepper')||x.classList.contains('adjust-field-grid')||x.querySelector('textarea'));
     if(!complex&&last&&!lastComplex&&last.length<2)last.push(el);else groups.push([el]);
    }
    inspectorPage=Math.min(inspectorPage,Math.max(0,groups.length-1));const pages=groups.map(group=>{const page=n('div',undefined,'mobile-property-page');page.append(...group);viewport.append(page);return page;});
    const pager=n('nav',undefined,'mobile-property-pager');pager.setAttribute('aria-label','Opciones del elemento');
    const prev=button('‹ Anterior',()=>{inspectorPage=Math.max(0,inspectorPage-1);refreshPages();});
    const count=n('output');
    const next=button('Siguiente ›',()=>{inspectorPage=Math.min(pages.length-1,inspectorPage+1);refreshPages();});
    function refreshPages(){pages.forEach((p,i)=>p.hidden=i!==inspectorPage);prev.disabled=inspectorPage===0;next.disabled=inspectorPage===pages.length-1;count.textContent=(inspectorPage+1)+' / '+pages.length;}
    pager.append(prev,count,next);refreshPages();
    box.replaceChildren(heading,viewport,pager);
   }
  }
  else if($('adjust-apply').parentElement===toolbarHeading)$('adjust-studio').querySelector('.adjust-actions').append($('adjust-apply'));
 }
 function render(){if(!draft||!canEdit())return;
  const d=duration(),items=manifestItems();$('adjust-time-end').textContent=time(d);
  for(const b of $('adjust-kinds').querySelectorAll('[data-adjust-kind]'))b.setAttribute('aria-pressed',String(b.dataset.adjustKind===kind));
  if(!items.some(x=>x.key===selected))selected=null;
  const blocks=$('adjust-blocks'),list=$('adjust-event-list');blocks.replaceChildren();list.replaceChildren();
  $('adjust-add-resource')?.remove();
  if(['broll','sfx','images','music','effects'].includes(kind)){const add=button('Añadir '+({broll:'B-roll',sfx:'sonido',images:'imagen',music:'música',effects:'efecto'}[kind]),()=>{selected=null;render();const group=$('adjust-inspector').querySelector('details');if(group)group.open=true;openElementPanel();});add.id='adjust-add-resource';$('adjust-kinds').after(add);}
  for(const item of items){
   const segment=button(item.title,()=>selectEvent(item),'adjust-block'+(item.hidden?' is-hidden':''));segment.title=item.title+' · '+time(item.start)+'–'+time(item.end);segment.setAttribute('aria-pressed',String(item.key===selected));segment.style.left=(d?item.start/d*100:0)+'%';segment.style.width=(d?Math.max(.8,(item.end-item.start)/d*100):0)+'%';
   // Touch/mouse drag of timed B-roll, SFX and images. Small accidental movement is ignored.
   if(['captions','broll','sfx','images','music'].includes(kind)&&!item.automatic&&item.type!=='behind-video'&&(kind!=='music'||typeof item.id==='number')){
    let origin=null;segment.style.touchAction='none';segment.onpointerdown=event=>{const box=segment.getBoundingClientRect();const edge=Math.min(12,box.width/3);origin={x:event.clientX,width:blocks.clientWidth,key:item.key,handle:event.clientX-box.left<edge?'start':box.right-event.clientX<edge?'end':'move'};segment.setPointerCapture(event.pointerId);};
    segment.onpointerup=event=>{if(!origin)return;const diff=(event.clientX-origin.x)/Math.max(1,origin.width)*d,handle=origin.handle;origin=null;if(Math.abs(diff)>=.075){selected=item.key;const delta=Math.round(diff*10)/10,patch=handle==='move'?{move:delta}:{start:item.start+(handle==='start'?delta:0),end:item.end+(handle==='end'?delta:0)};
     if(kind==='captions')change(()=>{const start=patch.start??Math.max(0,item.start+delta),end=patch.end??Math.min(duration(),item.end+delta);if(start<0||end>duration()||end-start<1/30)throw Error('Intervalo inválido');draft.captionTimingOverrides[item.id]={start,end};},'captionTimingOverrides');else changeTimes(item.id,patch);
    }};
    segment.onpointercancel=()=>{origin=null;};
   }
   blocks.append(segment);
   const entry=button(time(item.start)+' · '+item.title,()=>selectEvent(item));entry.title=item.title;entry.setAttribute('aria-pressed',String(item.key===selected));list.append(entry);
  }
  if(!items.length)list.append(n('p',kind==='music'?'No hay pista musical disponible.':'No hay elementos editables de esta categoría en el montaje.'));
  inspector(items);simplifyInspector();seeked();$('adjust-preview').disabled=fragmentBusy||frameSheetBusy;$('adjust-undo').disabled=!history.length;$('adjust-apply').disabled=!previewDirty||fragmentBusy;
 }
 function invalidateFragment(){fragmentEpoch++;const v=$('adjust-fragment-video');v.pause();v.removeAttribute('src');v.load();v.hidden=true;}
 function changeMode(mode){document.body.dataset.postMode=mode;$('adjust-studio').hidden=mode!=='adjust';$('validation-studio').hidden=mode!=='validation';if(mode==='adjust')render();}
 function load(job){
  if(!job||job.state!=='DONE'){if(document.body.dataset.postMode)changeMode('off');$('post-render-actions').hidden=true;parentId=null;draft=null;return;}
  invalidateFragment();parentId=job.id;history=[];selected=null;mainSelection=null;touched.clear();
  draft={transitions:clone(job.settings.transitions??[]),zoomEvents:clone(job.settings.zoomEvents??[]),zoomIntensity:job.settings.zoomIntensity??0,montageCuts:clone(job.settings.montageCuts??[]),montageSplits:clone(job.settings.montageSplits??[]),reviewedForeground:clone(job.settings.reviewedForeground??null),captionTransforms:clone(job.settings.captionTransforms??{}),captionScaleKeyframes:clone(job.settings.captionScaleKeyframes??{}),hiddenVisualEventIds:clone(job.settings.hiddenVisualEventIds??[]),captionTimingOverrides:clone(job.settings.captionTimingOverrides??{}),hiddenCaptionIds:[...(job.settings.hiddenCaptionIds??[])],videoEvents:clone(job.settings.videoEvents??[]),sfxEvents:clone(job.settings.sfxEvents??[]),graphicCards:clone(job.settings.graphicCards??[]),imageEvents:clone(job.settings.imageEvents??[]),motionLayerOverrides:clone(job.settings.motionLayerOverrides??{}),elements:clone(job.settings.elements??null),musicTracks:clone(job.settings.musicTracks??[])};
  $('post-render-actions').hidden=false;$('post-validate').disabled=false;
  for(const [key,name] of [['captions','captionsReviewed'],['framing','framingReviewed'],['audio','audioReviewed']])$('quick-review-'+key).checked=job.editorialReview?.[name]??false;
  $('quick-review-major').value=String(job.editorialReview?.majorChanges??0);$('quick-review-minor').value=String(job.editorialReview?.minorChanges??0);
  $('quick-validation-status').textContent=job.editorialReview?.pass?'Esta versión ya tiene validación registrada.':'Revisión todavía pendiente.';
  try{const saved=JSON.parse(localStorage.getItem(draftKey()));if(saved?.fingerprint===job.fingerprint&&saved.snapshot?.draft){restore(saved.snapshot);markPreviewDirty();status('Ajustes pendientes recuperados. El reproductor conserva el último vídeo generado.');}}catch{}
  changeMode('off');render();
 }
 function settingsPatch(){if(!draft||!canEdit())return {};const data={transitions:clone(draft.transitions??[]),zoomEvents:clone(draft.zoomEvents??[]),zoomIntensity:draft.zoomIntensity,montageCuts:clone(draft.montageCuts),montageSplits:clone(draft.montageSplits),reviewedForeground:clone(draft.reviewedForeground),captionTransforms:clone(draft.captionTransforms),captionScaleKeyframes:clone(draft.captionScaleKeyframes),hiddenVisualEventIds:clone(draft.hiddenVisualEventIds),captionTimingOverrides:clone(draft.captionTimingOverrides),hiddenCaptionIds:[...draft.hiddenCaptionIds].sort(),videoEvents:clone(draft.videoEvents),sfxEvents:clone(draft.sfxEvents),graphicCards:clone(draft.graphicCards),imageEvents:clone(draft.imageEvents),motionLayerOverrides:clone(draft.motionLayerOverrides),elements:clone(draft.elements),musicTracks:clone(draft.musicTracks)};return Object.fromEntries([...touched].map(k=>[k,data[k]]));}
 $('post-adjust').onclick=()=>{if(!canEdit())return;showPlayer('preview',{allowPrevious:true});const v=player();v.preload='auto';if(v.readyState<2)v.load();changeMode('adjust');};
 $('post-validate').onclick=()=>{if(!canEdit()||previewDirty)return;changeMode('validation');};
 $('adjust-close').textContent='Pausar edición';$('adjust-close').onclick=()=>changeMode('off');
 for(const b of $('adjust-kinds').querySelectorAll('[data-adjust-kind]'))b.onclick=()=>{kind=b.dataset.adjustKind;selected=null;render();};
 $('adjust-undo').onclick=()=>{const prev=history.pop();if(!prev)return;restore(prev);markPreviewDirty();persist();status('Último cambio deshecho. La nueva versión aún no se ha generado.');window.suesLivePreview?.refresh();render();};
 $('adjust-reset').onclick=()=>{if(!canEdit())return;if(previewDirty&&!confirm('Descartar los ajustes pendientes y volver a la versión guardada?'))return;try{localStorage.removeItem(draftKey());}catch{}work(async()=>{await select(parentId);changeMode('adjust');showPlayer('preview');});};
 $('adjust-preview').onclick=async()=>{
  if(!canEdit()||fragmentBusy)return;
  const epoch=++fragmentEpoch,id=parentId,fingerprint=current.fingerprint,patch=settings();
  const item=manifestItems().find(e=>e.key===selected),focus=item?.start??player().currentTime??0;
  const start=Math.max(0,Math.min(displayDuration()-.5,toOutput(focus)-.7)),length=Math.min(4,displayDuration()-start);
  fragmentBusy=true;activeFragment=null;fragmentCancelRequested=false;$('adjust-preview').disabled=true;$('adjust-apply').disabled=true;
  const dialog=$('adjust-fragment-dialog'),video=$('adjust-fragment-video');video.pause();video.removeAttribute('src');video.hidden=true;
  $('adjust-fragment-status').textContent='Preparando '+length.toFixed(1)+' s del borrador desde '+time(start)+'. Puede tardar según la posición del fragmento.';dialog.showModal();
  try{
   let result=await api('jobs/'+id+'/adjust-preview','POST',{fingerprint,settings:patch,start,duration:length});
   activeFragment={id,key:result.key};if(fragmentCancelRequested)await api('jobs/'+id+'/adjust-preview?key='+result.key,'DELETE',{});
   for(let attempt=0;result.state==='RUNNING'&&attempt<900;attempt++){
    await new Promise(r=>setTimeout(r,1000));
    result=await api('jobs/'+id+'/adjust-preview?key='+result.key);
    if(epoch===fragmentEpoch)$('adjust-fragment-status').textContent='Preparando fragmento · '+result.elapsedSeconds+' s de proceso. La versión completa sigue guardada.';
   }
   if(result.state!=='READY')throw Error(result.error||'El fragmento no está disponible. Puedes volver a solicitarlo.');
   if(epoch!==fragmentEpoch||parentId!==id)return;
   video.preload='auto';video.src='/api/jobs/'+id+'/adjust-preview?key='+result.key+'&media=1';video.hidden=false;video.load();
   $('adjust-fragment-status').textContent='Borrador · '+time(result.start)+'–'+time(result.start+result.duration)+' del montaje. Este fragmento no valida ni sustituye la exportación completa.';
   status('Fragmento del borrador listo. Guarda y genera cuando quieras aplicar el montaje completo.');
  }catch(e){if(epoch===fragmentEpoch)$('adjust-fragment-status').textContent=e.message;}
  finally{fragmentBusy=false;$('adjust-preview').disabled=false;if(canEdit())render();}
 };
 $('adjust-fragment-close').onclick=()=>{$('adjust-fragment-video').pause();$('adjust-fragment-dialog').close();};
 $('adjust-fragment-dialog').addEventListener('close',()=>{$('adjust-fragment-video').pause();if(fragmentBusy){fragmentCancelRequested=true;if(activeFragment)void api('jobs/'+activeFragment.id+'/adjust-preview?key='+activeFragment.key,'DELETE',{}).catch(e=>status(e.message));}});
 $('adjust-apply').onclick=()=>work(async()=>{
  if(!canEdit()||!previewDirty)return;
  $('adjust-apply').disabled=true;status('Preparando nueva versión sin utilizar servicios de IA…');
  try {
   const sourceId=parentId,settingsData=settings(),next=await api('jobs','POST',{profileId:current.profileId,settings:settingsData,parentId:sourceId});
   await api('jobs/'+next.id+'/render','POST',{});
   try{localStorage.removeItem(draftKey());}catch{}
   await select(next.id);changeMode('off');$('workflow-status').textContent='Montaje manual en proceso. La versión original sigue guardada.';
  }finally{if(canEdit())$('adjust-apply').disabled=!previewDirty||fragmentBusy;}
 });
 $('quick-validate-save').onclick=()=>work(async()=>{
  if(!canEdit()||previewDirty)throw Error('Genera primero la versión con los últimos ajustes.');
  const body={captionsReviewed:$('quick-review-captions').checked,framingReviewed:$('quick-review-framing').checked,audioReviewed:$('quick-review-audio').checked,majorChanges:Number($('quick-review-major').value),minorChanges:Number($('quick-review-minor').value)};
  const result=await api('jobs/'+current.id+'/acceptance','POST',body);
  current.editorialReview=result;$('export-video').disabled=!versionApproved()||previewDirty;
  $('quick-validation-status').textContent=result.pass?'Versión aceptada. Ya puedes exportar el MP4.':'Revisión registrada; '+(result.technicalQuality?.issues?.join('; ')||'quedan elementos sin revisar o cambios pendientes.');
  for(const [k,name] of [['captions','captionsReviewed'],['framing','framingReviewed'],['audio','audioReviewed']])$('review-'+k).checked=body[name];$('review-major').value=String(body.majorChanges);$('review-minor').value=String(body.minorChanges);
 });

 const timeline=n('section',undefined,'manual-timeline');timeline.setAttribute('aria-label','Línea de tiempo de todas las capas');
 const toolbar=n('div',undefined,'manual-timeline-toolbar');
 const zoomLabel=n('span','Escala temporal');
 let pixelsPerSecond=60,timelineDrag=false,scrollFromCode=false;
 const zoomControl=n('input');zoomControl.type='range';zoomControl.min='15';zoomControl.max='480';zoomControl.step='5';zoomControl.value='60';zoomControl.setAttribute('aria-label','Ampliar línea de tiempo');
 const timeLabel=n('output','00:00 / 00:00');
 const zoomOut=n('button','−','manual-zoom-step'),zoomIn=n('button','+','manual-zoom-step');
 zoomOut.type=zoomIn.type='button';zoomOut.setAttribute('aria-label','Reducir zoom de timeline');zoomIn.setAttribute('aria-label','Ampliar zoom de timeline');
 toolbar.append(timeLabel,zoomLabel,zoomOut,zoomControl,zoomIn);
 const cutbar=n('div',undefined,'montage-cut-toolbar');
 const splitButton=button('✂ Dividir aquí',()=>change(()=>{
  const t=Math.round(player().currentTime*30)/30;
  if(t<1/30||t>duration()-1/30||draft.montageCuts.some(c=>t>=c.start&&t<c.end))throw Error('Sitúa el cabezal dentro de un tramo conservado');
  if(draft.montageSplits.some(s=>Math.abs(s-t)<1/30-.00001))throw Error('Ya existe una división en ese fotograma');
  if(draft.montageSplits.length>=120)throw Error('Máximo 120 divisiones');
  draft.montageSplits.push(t);draft.montageSplits.sort((a,b)=>a-b);mainSelection=null;
 },'montageSplits'));splitButton.id='montage-split';
 function deleteMain(start,end){change(()=>{
  start=Math.round(start*30)/30;end=Math.min(duration(),Math.round(end*30)/30);
  if(!Number.isFinite(start)||!Number.isFinite(end)||start<0||end>duration()||end-start<1/30-1e-7)throw Error('Selecciona un tramo de al menos un fotograma');
  const merged=[];for(const c of [...draft.montageCuts,{start,end}].sort((a,b)=>a.start-b.start)){const p=merged.at(-1);if(p&&c.start<=p.end+1e-7)p.end=Math.max(p.end,c.end);else merged.push({...c});}
  const removed=merged.reduce((s,c)=>s+c.end-c.start,0);if(duration()-removed<.5)throw Error('Conserva al menos medio segundo de vídeo');
  if(merged.length>60)throw Error('Máximo 60 borrados');draft.montageCuts=merged;mainSelection=null;
 },'montageCuts');}
 const deleteButton=button('Borrar tramo',()=>{if(mainSelection)deleteMain(mainSelection.start,mainSelection.end);else status('Toca primero un tramo del vídeo principal. Usa Dividir aquí para separar la parte que quieras borrar.');});deleteButton.id='montage-delete';
 const restoreButton=button('Restaurar vídeo completo',()=>{change(()=>{draft.montageCuts=[];mainSelection=null;},'montageCuts');});restoreButton.id='montage-restore';
 const cutInfo=n('output');cutInfo.id='montage-cut-info';cutInfo.setAttribute('aria-live','polite');
 cutbar.append(splitButton,deleteButton,restoreButton,cutInfo);timeline.append(cutbar);
 const scroller=n('div',undefined,'manual-timeline-scroll');scroller.setAttribute('tabindex','0');scroller.setAttribute('aria-label','Desplazar todas las pistas');
 const strip=n('div',undefined,'manual-timeline-strip');scroller.append(strip);
 const fixedHead=n('div',undefined,'manual-fixed-playhead');fixedHead.setAttribute('aria-hidden','true');
 const frame=n('div',undefined,'manual-timeline-frame');frame.append(scroller,fixedHead);timeline.append(toolbar,frame);
 $('adjust-studio').insertBefore(timeline,$('adjust-event-list'));
 // One fixed mobile editor shell: preview, persistent timeline and contextual toolbox.
 const previewWrap=document.querySelector('#video-panel .preview-wrap');
 const mobilePlay=n('button','▶','mobile-stage-play');
 mobilePlay.type='button';mobilePlay.setAttribute('aria-label','Reproducir o pausar');
 previewWrap.append(mobilePlay);
 const playable=()=>document.getElementById('video').hidden?document.getElementById('source-video'):document.getElementById('video');
 const toggleStage=()=>{const v=playable();if(!v||v.hidden)return;if(document.body.dataset.livePreview==='true'){const control=document.querySelector('.live-preview-bar button');if(control){control.click();return;}}if(v.paused)v.play().catch(()=>{});else v.pause();};
 mobilePlay.addEventListener('click',e=>{e.stopPropagation();toggleStage();});
 previewWrap.addEventListener('click',e=>{if(document.body.dataset.postMode!=='adjust'||e.target.closest('.touch-edit-target,.touch-edit-surface,button'))return;toggleStage();});
 for(const v of [document.getElementById('video'),document.getElementById('source-video')]){
  v.addEventListener('play',()=>{mobilePlay.textContent='Ⅱ';mobilePlay.setAttribute('aria-label','Pausar');});
  v.addEventListener('pause',()=>{mobilePlay.textContent='▶';mobilePlay.setAttribute('aria-label','Reproducir');});
 }
 function mountMobileTimeline(){
  if(matchMedia('(max-width:700px)').matches){if(timeline.parentElement!==document.getElementById('video-panel'))previewWrap.after(timeline);}
  else if(timeline.parentElement!==$('adjust-studio'))$('adjust-studio').insertBefore(timeline,$('adjust-event-list'));
 }
 mountMobileTimeline();matchMedia('(max-width:700px)').addEventListener('change',mountMobileTimeline);
 const viewport=window.visualViewport;
 if(viewport){
  let viewportPending=false;
  const updateViewport=()=>{if(viewportPending)return;viewportPending=true;requestAnimationFrame(()=>{
   viewportPending=false;
   document.documentElement.style.setProperty('--sues-editor-vh',viewport.height+'px');
   document.body.dataset.mobileKeyboard=viewport.height<window.innerHeight-120?'true':'false';
  });};
  viewport.addEventListener('resize',updateViewport,{passive:true});updateViewport();
 }


 let timelineSignature='',frameSheet=null,frameSheetJob=null,frameSheetBusy=false;
 async function ensureFrames(){if(!parentId||frameSheetJob===parentId||frameSheetBusy)return;frameSheetBusy=true;const id=parentId;try{const data=await api('jobs/'+id+'/timeline-frames');if(parentId!==id)return;frameSheet=data;frameSheetJob=id;timelineSignature='';renderTimeline();}catch(e){status('Tira de fotogramas pendiente: '+e.message);}finally{frameSheetBusy=false;render();}}
 const groups=[['captions','Subtítulos'],['broll','B-roll'],['images','Imágenes'],['motions','Motion'],['graphics','Gráficas'],['sfx','SFX'],['music','Música'],['effects','Efectos']];
 function setZoom(value){pixelsPerSecond=Math.max(15,Math.min(480,value));zoomControl.value=String(pixelsPerSecond);timelineSignature='';renderTimeline();followTimeline(true);}
 zoomControl.oninput=()=>setZoom(Number(zoomControl.value));
 zoomOut.onclick=()=>setZoom(Math.floor(pixelsPerSecond/1.4/5)*5);zoomIn.onclick=()=>setZoom(Math.ceil(pixelsPerSecond*1.4/5)*5);
 function followTimeline(force=false){if(!draft)return;timeLabel.textContent=time(toOutput(player().currentTime))+' / '+time(displayDuration());
  if(force||!player().paused){scrollFromCode=true;scroller.scrollLeft=toOutput(player().currentTime)*pixelsPerSecond;requestAnimationFrame(()=>{scrollFromCode=false;});}
 }
 scroller.onscroll=()=>{if(scrollFromCode||timelineDrag)return;if(!player().paused)player().pause();const t=fromOutput(Math.max(0,Math.min(displayDuration(),scroller.scrollLeft/pixelsPerSecond)));if(Math.abs(player().currentTime-t)>.08)player().currentTime=t;timeLabel.textContent=time(toOutput(t))+' / '+time(displayDuration());};
 let pinchPoints=new Map(),pinchOrigin=null;
 scroller.addEventListener('pointerdown',e=>{if(!player().paused)player().pause();pinchPoints.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pinchPoints.size===2){const a=[...pinchPoints.values()];pinchOrigin={distance:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),scale:pixelsPerSecond};}});
 scroller.addEventListener('pointermove',e=>{if(!pinchPoints.has(e.pointerId))return;pinchPoints.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pinchPoints.size===2&&pinchOrigin){const a=[...pinchPoints.values()];setZoom(pinchOrigin.scale*Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)/Math.max(1,pinchOrigin.distance));}});
 const releasePinch=e=>{pinchPoints.delete(e.pointerId);if(pinchPoints.size<2)pinchOrigin=null;};
 scroller.addEventListener('pointerup',releasePinch);scroller.addEventListener('pointercancel',releasePinch);
 function renderTimeline(){
  if(!canEdit())return;
  const originalKind=kind,tracks=groups.filter(([k])=>k===kind).map(([k,label])=>{kind=k;return {kind:k,label,items:manifestItems()};});kind=originalKind;
  const signature=JSON.stringify({tracks,elementSettings:draft.elements,keys:draft.captionScaleKeyframes,musicKeys:draft.musicTracks?.map(e=>e.keyframes),selected,mainSelection,cuts:draft.montageCuts,splits:draft.montageSplits,kind,pixelsPerSecond,duration:duration(),width:scroller.clientWidth});
  cutInfo.textContent='Duración final: '+displayDuration().toFixed(2)+' s · '+(duration()-displayDuration()).toFixed(2)+' s borrados';deleteButton.disabled=!mainSelection;restoreButton.disabled=!draft.montageCuts.length;
  if(signature===timelineSignature){followTimeline();return;}timelineSignature=signature;
  strip.replaceChildren();const padding=scroller.clientWidth/2;strip.style.paddingLeft=padding+'px';strip.style.paddingRight=padding+'px';strip.style.width=(displayDuration()*pixelsPerSecond+padding*2)+'px';
  const ruler=n('div',undefined,'manual-seconds');ruler.style.width=displayDuration()*pixelsPerSecond+'px';
  const step=pixelsPerSecond<35?5:pixelsPerSecond<120?1:pixelsPerSecond<250?.5:.2;
  const rulerLabel=t=>{if(pixelsPerSecond<120)return time(t);const minutes=String(Math.floor(t/60)).padStart(2,'0'),seconds=String(Math.floor(t%60)).padStart(2,'0'),frame=String(Math.round((t%1)*30)).padStart(2,'0');return minutes+':'+seconds+'.'+frame;};
  for(let tick=0;tick*step<=displayDuration()+.001;tick++){
   const t=tick*step,mark=n('span',rulerLabel(t));mark.style.left=t*pixelsPerSecond+'px';ruler.append(mark);
  }
  if(pixelsPerSecond>=250)for(let frame=0;frame/30<=displayDuration()+.001;frame++){
   if(frame%6===0)continue;
   const mark=n('i',undefined,'manual-frame-tick');mark.style.left=frame/30*pixelsPerSecond+'px';ruler.append(mark);
  }
  strip.append(ruler);
  const main=n('div',undefined,'manual-lane montage-main-lane');main.setAttribute('aria-label','Vídeo principal dividido');main.style.width=displayDuration()*pixelsPerSecond+'px';
  const bounds=[...new Set([0,duration(),...draft.montageSplits,...draft.montageCuts.flatMap(c=>[c.start,c.end])])].sort((a,b)=>a-b);
  for(let j=0;j<bounds.length-1;j++){
   const start=bounds[j],end=bounds[j+1];if(end-start<1/30-1e-7||draft.montageCuts.some(c=>start>=c.start-1e-7&&end<=c.end+1e-7))continue;
   const source=button('Tramo '+(j+1),()=>{mainSelection={start,end};document.body.dataset.manualPanel='main';if($('manual-layer-back'))$('manual-layer-back').hidden=false;player().currentTime=start;render();followTimeline(true);},'manual-source montage-source-segment');
   source.dataset.compositionStart=start;source.dataset.compositionEnd=end;source.setAttribute('aria-label','Tramo de vídeo '+toOutput(start).toFixed(2)+' a '+toOutput(end).toFixed(2)+' segundos');source.setAttribute('aria-pressed',String(mainSelection?.start===start&&mainSelection?.end===end));
   source.style.left=toOutput(start)*pixelsPerSecond+'px';source.style.width=Math.max(2,(end-start)*pixelsPerSecond)+'px';source.title='Vídeo · '+toOutput(start).toFixed(2)+'–'+toOutput(end).toFixed(2)+' s';
   if(frameSheetJob===parentId&&frameSheet){for(let x=0;x<(end-start)*pixelsPerSecond;x+=33.75){const canonical=start+x/pixelsPerSecond,savedTime=toOutput(canonical,current?.settings?.montageCuts??[]),i=Math.min(frameSheet.count-1,Math.floor(savedTime/frameSheet.step)),cell=n('span',undefined,'manual-film-frame');cell.style.left=x+'px';cell.style.width='33.75px';cell.style.backgroundImage='url("/api/jobs/'+parentId+'/timeline-frames?media=1")';cell.style.backgroundSize=(frameSheet.columns*33.75)+'px '+(frameSheet.rows*60)+'px';cell.style.backgroundPosition=(-(i%frameSheet.columns)*33.75)+'px '+(-Math.floor(i/frameSheet.columns)*60)+'px';source.append(cell);}}
   main.append(source);
  }
  strip.append(main);if(frameSheetJob!==parentId)void ensureFrames();
  for(const track of tracks){
   const lane=n('div',undefined,'manual-lane manual-lane-'+track.kind);lane.style.width=displayDuration()*pixelsPerSecond+'px';lane.setAttribute('aria-label',track.label);
   const label=n('span',track.label,'manual-lane-label');lane.append(label);
   const rowEnds=[];
   for(const item of [...track.items].sort((a,b)=>a.start-b.start||a.end-b.end)){
    if(toOutput(item.end)-toOutput(item.start)<.00001)continue;
    let row=rowEnds.findIndex(end=>end<=toOutput(item.start));if(row<0)row=rowEnds.length;rowEnds[row]=toOutput(item.end);
    const b=button(item.title,()=>{kind=track.kind;selected=item.key;if(player().currentTime<item.start||player().currentTime>=item.end)player().currentTime=item.start;render();followTimeline(true);openElementPanel();},'manual-layer-block');
    b.style.top=(7+row*44)+'px';b.style.left=toOutput(item.start)*pixelsPerSecond+'px';b.style.width=Math.max(12,(toOutput(item.end)-toOutput(item.start))*pixelsPerSecond)+'px';b.setAttribute('aria-label',track.label+': '+item.title);b.setAttribute('aria-pressed',String(kind===track.kind&&selected===item.key));b.title=item.title+' · '+time(item.start)+'–'+time(item.end);
    if(['captions','broll','images','sfx','masks','music'].includes(track.kind)&&!item.automatic&&(track.kind!=='music'||typeof item.id==='number')){
     const left=n('span','‹','manual-trim-handle left'),right=n('span','›','manual-trim-handle right');left.setAttribute('aria-hidden','true');right.setAttribute('aria-hidden','true');b.prepend(left);b.append(right);
     let drag=null;
     b.onpointerdown=e=>{if(pinchPoints.size>1)return;const box=b.getBoundingClientRect(),edge=Math.min(14,box.width/3);drag={x:e.clientX,edge:e.clientX-box.left<edge?'start':box.right-e.clientX<edge?'end':'move'};timelineDrag=true;b.setPointerCapture(e.pointerId);};
     b.onpointerup=e=>{timelineDrag=false;if(!drag)return;const d=drag;drag=null;const delta=millis((e.clientX-d.x)/pixelsPerSecond);if(Math.abs(delta)<.03)return;kind=track.kind;selected=item.key;
      const start=d.edge==='end'?item.start:fromOutput(toOutput(item.start)+delta),end=d.edge==='start'?item.end:fromOutput(toOutput(item.end)+delta);
      if(kind==='captions')change(()=>{if(start<0||end>duration()||end-start<1/30)throw Error('Intervalo inválido');draft.captionTimingOverrides[item.id]={start,end};},'captionTimingOverrides');
      else if(kind==='masks'||item.type==='behind-video')changeMaskTimes(item.id,start,end);
      else changeTimes(item.id,{start,end});
     };
     b.onpointercancel=()=>{drag=null;timelineDrag=false;};
    }
    if(track.kind==='graphics'&&item.isComposition){
     let origin=null;
     b.onpointerdown=e=>{origin=e.clientX;timelineDrag=true;b.setPointerCapture(e.pointerId);};
     b.onpointerup=e=>{timelineDrag=false;if(origin===null)return;const delta=Math.round((e.clientX-origin)/pixelsPerSecond*30)/30;origin=null;
      if(Math.abs(delta)<1/30-.000001)return;
      change(()=>{if(!draft.elements)throw Error('Composición no editable');const proposed=(draft.elements.offset??0)+delta;
       if(proposed<-4||proposed>4)throw Error('La composición puede desplazarse como máximo cuatro segundos');
       draft.elements.offset=millis(proposed);
      },'elements');
     };
     b.onpointercancel=()=>{origin=null;timelineDrag=false;};
    }
    if(track.kind==='motions'&&item.sourceId&&item.children?.length){
     let origin=null;b.onpointerdown=e=>{origin=e.clientX;timelineDrag=true;b.setPointerCapture(e.pointerId);};
     b.onpointerup=e=>{timelineDrag=false;if(origin===null)return;const delta=Math.round((e.clientX-origin)/pixelsPerSecond*30)/30;origin=null;if(Math.abs(delta)<1/30-.000001)return;
      change(()=>{const m=draft.motionLayerOverrides[item.sourceId]??(draft.motionLayerOverrides[item.sourceId]={offset:0,layers:{}});m.offset=millis((m.offset??0)+delta);},'motionLayerOverrides');};
     b.onpointercancel=()=>{origin=null;timelineDrag=false;};
    }
    lane.append(b);
    if(track.kind==='motions'&&item.sourceId&&item.children?.length)for(const child of item.children){
     const marker=button('◆',()=>{kind='motions';selected=item.key;player().pause();player().currentTime=child.start;render();openElementPanel();},'manual-keyframe');
     marker.style.left=toOutput(child.start)*pixelsPerSecond+'px';marker.style.top=(9+row*44)+'px';marker.title=child.id+' · '+time(child.start);
     let origin=null;marker.onpointerdown=e=>{e.stopPropagation();origin=e.clientX;timelineDrag=true;marker.setPointerCapture(e.pointerId);};
     marker.onpointerup=e=>{e.stopPropagation();timelineDrag=false;if(origin===null)return;const delta=Math.round((e.clientX-origin)/pixelsPerSecond*30)/30;origin=null;if(Math.abs(delta)<1/30-.000001)return;
      change(()=>{const m=draft.motionLayerOverrides[item.sourceId]??(draft.motionLayerOverrides[item.sourceId]={offset:0,layers:{}}),layer=m.layers[child.id]??(m.layers[child.id]={});layer.offset=millis((layer.offset??0)+delta);},'motionLayerOverrides');
     };marker.onpointercancel=()=>{origin=null;timelineDrag=false;};lane.append(marker);
    }
    if(track.kind==='graphics'&&item.isComposition)for(const child of item.children){
     const diamond=button('◆',()=>{selected=item.key;kind='graphics';player().pause();player().currentTime=child.revealAt;render();openElementPanel();},'manual-keyframe');
     diamond.title='Aparición · '+child.label+' · '+child.revealAt.toFixed(2)+' s';diamond.setAttribute('aria-label','Mover aparición de '+child.label);
     diamond.style.left=toOutput(child.revealAt)*pixelsPerSecond+'px';diamond.style.top=(9+row*44)+'px';
     let down=null;diamond.onpointerdown=e=>{e.stopPropagation();down=e.clientX;timelineDrag=true;diamond.setPointerCapture(e.pointerId);};
     diamond.onpointerup=e=>{e.stopPropagation();timelineDrag=false;if(down===null)return;const delta=Math.round((e.clientX-down)/pixelsPerSecond*30)/30;down=null;
      if(Math.abs(delta)<1/30-.000001)return;change(()=>{
       const entry=draft.elements?.items.find(x=>x.captionId===child.captionId);if(!entry)throw Error('Capa no editable');
       const next=(entry.revealOffset??0)+delta;if(next<-1.5||next>1.5)throw Error('Límite de sincronización de ±1,5 segundos');
       entry.revealOffset=millis(next);
      },'elements');
     };
     diamond.onpointercancel=()=>{down=null;timelineDrag=false;};lane.append(diamond);
    }
    const keyframes=track.kind==='captions'?draft.captionScaleKeyframes?.[item.id]:track.kind==='music'&&typeof item.id==='number'?draft.musicTracks?.[item.id]?.keyframes:null;
    if(Array.isArray(keyframes))for(const key of keyframes){
     const diamond=button('◆',()=>{selected=item.key;kind=track.kind;player().pause();player().currentTime=Math.max(0,Math.min(duration(),item.start+key.time));render();openElementPanel();},'manual-keyframe');
     diamond.title='Keyframe · '+key.time.toFixed(2)+' s · '+key.value.toFixed(2);
     diamond.setAttribute('aria-label','Editar keyframe en '+(item.start+key.time).toFixed(2)+' segundos');
     diamond.style.left=toOutput(item.start+key.time)*pixelsPerSecond+'px';diamond.style.top=(9+row*44)+'px';
     let origin=null;diamond.onpointerdown=e=>{e.stopPropagation();origin={x:e.clientX};timelineDrag=true;diamond.setPointerCapture(e.pointerId);};
     diamond.onpointerup=e=>{
      e.stopPropagation();timelineDrag=false;if(!origin)return;
      const delta=Math.round((e.clientX-origin.x)/pixelsPerSecond*30)/30;origin=null;
      if(Math.abs(delta)<1/30-.000001)return;
      change(()=>{const now=track.kind==='captions'?draft.captionScaleKeyframes[item.id]:draft.musicTracks[item.id].keyframes;
       const updated=Math.max(0,Math.min(item.end-item.start,Math.round((key.time+delta)*30)/30));
       if(now.some(k=>k!==key&&Math.abs(k.time-updated)<1/60))throw Error('Ya existe un keyframe en ese fotograma');
       const target=now.find(k=>Math.abs(k.time-key.time)<1e-5);if(!target)throw Error('Keyframe desactualizado');
       target.time=millis(updated);now.sort((a,b)=>a.time-b.time);
      },track.kind==='captions'?'captionScaleKeyframes':'musicTracks');
     };
     diamond.onpointercancel=()=>{origin=null;timelineDrag=false;};
     lane.append(diamond);
    }
   }
   lane.style.height=Math.max(44,rowEnds.length*44)+'px';
   if(!track.items.length)lane.append(n('span','Sin elementos','manual-lane-empty'));
   strip.append(lane);
  }
  followTimeline(true);
 }
 player().addEventListener('timeupdate',()=>followTimeline());
 player().addEventListener('seeked',()=>followTimeline(true));
 const surface=n('div',undefined,'touch-edit-surface');surface.hidden=true;
 const target=n('button','Toca el subtítulo activo para moverlo o cambiar su tamaño','touch-edit-target');target.type='button';target.setAttribute('aria-label','Mover o ampliar subtítulo seleccionado');surface.append(target);
 player().parentElement.append(surface);
 let points=new Map(),gesture=null;
 const distance=()=>{const a=[...points.values()];return a.length>1?Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y):0;};
 function activeCaption(){const now=player().currentTime;return plan?.manifest?.captions?.find(c=>now>=(draft?.captionTimingOverrides?.[c.id]?.start??c.start)&&now<(draft?.captionTimingOverrides?.[c.id]?.end??c.end)&&!draft?.hiddenCaptionIds.includes(c.id));}
 function syncTouch(){
  const enabled=document.body.dataset.postMode==='adjust'&&canEdit()&&!player().hidden;surface.hidden=!enabled;
  if(!enabled)return;
  const v=player(),w=v.clientWidth,h=v.clientHeight,ratio=Math.min(w/1080,h/1920),width=1080*ratio,height=1920*ratio;
  surface.style.cssText='width:'+width+'px;height:'+height+'px;left:'+((v.offsetLeft+(w-width)/2))+'px;top:'+((v.offsetTop+(h-height)/2))+'px;';
  const now=player().currentTime;
  if(kind==='images'){
   const index=draft.imageEvents.findIndex((e,i)=>now>=e.start&&now<e.end&&(selected===null||selected==='image-'+i));
   const e=draft.imageEvents[index];target.hidden=!e;target.disabled=!e;
   if(!e)return;
   const compiled=plan?.manifest?.illustrations?.find(v=>v.assetId===e.assetId&&Math.abs(v.start-e.start)<.001);
   const b=e.box??compiled?.box??{left:120,right:900,top:140,bottom:420};
   target.dataset.mode='image';target.dataset.captionId=String(index);target.textContent='Imagen '+(index+1);target.setAttribute('aria-label','Mover o ampliar imagen seleccionada');
   target.style.maxWidth='none';target.style.width=((b.right-b.left)/1080*100)+'%';target.style.height=((b.bottom-b.top)/1920*100)+'%';
   target.style.left=((b.left+b.right)/2/1080*100)+'%';target.style.top=((b.top+b.bottom)/2/1920*100)+'%';target.style.transform='translate(-50%,-50%)';return;
  }
  if(kind==='masks'||kind==='broll'&&(selected===null||selected.startsWith('mask-'))){
   const events=draft.reviewedForeground?.events??[],i=events.findIndex((e,index)=>e.type==='behind-video'&&now>=e.start&&now<e.end&&(selected===null||selected==='mask-'+index)),e=events[i];
   target.hidden=!e;target.disabled=!e;if(!e)return;const r=e.region??{x:0,y:0,width:1080,height:1920,featherBottom:0};
   target.dataset.mode='mask';target.dataset.captionId=String(i);target.textContent='B-roll detrás del sujeto';target.setAttribute('aria-label','Mover o ampliar máscara seleccionada');
   target.style.width=(r.width/1080*100)+'%';target.style.maxWidth='100%';target.style.height=(r.height/1920*100)+'%';target.style.left=((r.x+r.width/2)/1080*100)+'%';target.style.top=((r.y+r.height/2)/1920*100)+'%';target.style.transform='translate(-50%,-50%)';return;
  }
  const c=kind==='captions'?activeCaption():null;target.hidden=!c;target.disabled=!c;
  if(c){const b=plan.manifest.layout.caption,t=draft.captionTransforms[c.id]??{dx:0,dy:0,scale:1};target.dataset.mode='caption';target.dataset.captionId=c.id;target.textContent=c.text;target.setAttribute('aria-label','Mover o ampliar subtítulo seleccionado');
   const pixels=window.suesLivePreview?.bounds(c.id);
   if(pixels){target.textContent='';target.style.maxWidth='none';target.style.width=((pixels.right-pixels.left)/1080*100)+'%';target.style.height=((pixels.bottom-pixels.top)/1920*100)+'%';target.style.left=((pixels.left+pixels.right)/2/1080*100)+'%';target.style.top=((pixels.top+pixels.bottom)/2/1920*100)+'%';target.style.transform='translate(-50%,-50%)';window.suesLivePreview?.position();return;}
   target.style.width='';target.style.maxWidth='82%';target.style.height='';target.style.left=((540+t.dx)/1080*100)+'%';target.style.top=(((b.top+b.bottom)/2+t.dy)/1920*100)+'%';target.style.transform='translate(-50%,-50%) scale('+t.scale+')';}
 }
 const maskRegion=id=>draft.reviewedForeground.events[Number(id)].region??{x:0,y:0,width:1080,height:1920,featherBottom:0};
 const imageRegion=id=>{const e=draft.imageEvents[Number(id)],compiled=plan?.manifest?.illustrations?.find(v=>v.assetId===e.assetId&&Math.abs(v.start-e.start)<.001);return e.box??compiled?.box??{left:120,right:900,top:140,bottom:420};};
 target.onpointerdown=e=>{if(!canEdit())return;if(window.suesLivePreview&&!window.suesLivePreview.isReady()){status('Espera a que termine de preparar la vista interactiva. El borrador se conserva.');return;}e.preventDefault();player().pause();target.setPointerCapture(e.pointerId);points.set(e.pointerId,{x:e.clientX,y:e.clientY});
  const mode=target.dataset.mode,id=target.dataset.captionId;
  selected=mode==='mask'?'mask-'+id:mode==='image'?'image-'+id:id;
  if(!gesture)gesture={mode,id,before:snapshot(),base:clone(mode==='mask'?maskRegion(id):mode==='image'?imageRegion(id):draft.captionTransforms[id]??{dx:0,dy:0,scale:1}),x:e.clientX,y:e.clientY,ratio:surface.getBoundingClientRect().width/1080,changed:false};
  if(points.size===2){gesture.distance=distance();gesture.pinchScale=mode==='caption'?(draft.captionTransforms[id]??gesture.base).scale:1;}
 };
 target.onpointermove=e=>{if(!gesture||!points.has(e.pointerId))return;e.preventDefault();points.set(e.pointerId,{x:e.clientX,y:e.clientY});
  const g=gesture;
  if(g.mode==='mask'){
   const r=clone(g.base);
   if(points.size>=2){const factor=distance()/Math.max(1,g.distance);r.width=Math.max(32,Math.min(1080,2*Math.round(g.base.width*factor/2)));r.height=Math.max(32,Math.min(1920,2*Math.round(g.base.height*factor/2)));r.featherBottom=Math.min(r.height,Math.round(g.base.featherBottom*factor));}
   else if(!g.distance){r.x=Math.round(g.base.x+(e.clientX-g.x)/Math.max(.01,g.ratio));r.y=Math.round(g.base.y+(e.clientY-g.y)/Math.max(.01,g.ratio));}
   r.x=Math.max(0,Math.min(1080-r.width,r.x));r.y=Math.max(0,Math.min(1920-r.height,r.y));draft.reviewedForeground.events[Number(g.id)].region=r;
  }else if(g.mode==='image'){
   const b=g.base,centerX=(b.left+b.right)/2,centerY=(b.top+b.bottom)/2;
   let width=b.right-b.left,height=b.bottom-b.top,cx=centerX,cy=centerY;
   if(points.size>=2){const factor=distance()/Math.max(1,g.distance);width=Math.round(Math.max(64,Math.min(2400,width*factor)));height=Math.round(Math.max(64,Math.min(3000,height*factor)));}
   else if(!g.distance){cx=Math.round(centerX+(e.clientX-g.x)/Math.max(.01,g.ratio));cy=Math.round(centerY+(e.clientY-g.y)/Math.max(.01,g.ratio));}
   const left=Math.max(-1080,Math.min(2160-width,Math.round(cx-width/2))),top=Math.max(-1920,Math.min(3840-height,Math.round(cy-height/2)));
   draft.imageEvents[Number(g.id)].box={left,right:left+width,top,bottom:top+height};
  }else{
   let t=clone(draft.captionTransforms[g.id]??g.base);
   if(points.size>=2)t.scale=Math.max(.05,Math.min(12,g.pinchScale*distance()/Math.max(1,g.distance)));
   else if(!g.distance){t.dx=Math.max(-420,Math.min(420,g.base.dx+(e.clientX-g.x)/Math.max(.01,g.ratio)));t.dy=Math.max(-1300,Math.min(1300,g.base.dy+(e.clientY-g.y)/Math.max(.01,g.ratio)));}
   draft.captionTransforms[g.id]=t;
  }
  if(g.mode==='caption')window.suesLivePreview?.gesture(g.id,draft.captionTransforms[g.id]);
  window.suesLivePreview?.markDirty();g.changed=true;syncTouch();
 };
 function endTouch(cancel){if(!gesture)return;const g=gesture;gesture=null;points.clear();
  if(cancel){restore(g.before);window.suesLivePreview?.resetGesture();syncTouch();return;}
  if(g.changed){history.push(g.before);touched.add(g.mode==='mask'?'reviewedForeground':g.mode==='image'?'imageEvents':'captionTransforms');invalidateFragment();markPreviewDirty();persist();window.suesLivePreview?.refresh();status('Tamaño y posición ajustados en la vista. Aplicar cambios guardará el resultado.');render();}
 }
 target.onpointerup=e=>{points.delete(e.pointerId);if(!points.size){endTouch(false);render();openElementPanel();}};
 target.onpointercancel=()=>endTouch(true);
 const originalRender=render;render=function(){originalRender();syncTouch();renderTimeline();window.suesLivePreview?.position();};
 const originalMode=changeMode;changeMode=function(mode){if(mode==='adjust'&&document.body.dataset.postMode!=='adjust')document.body.dataset.manualPanel='timeline';originalMode(mode);syncTouch();window.suesLivePreview?.mode(mode);};
 let resizeQueued=false;const observer=new ResizeObserver(()=>{if(resizeQueued)return;resizeQueued=true;requestAnimationFrame(()=>{resizeQueued=false;syncTouch();renderTimeline();});});observer.observe(document.getElementById('video'));player().addEventListener('timeupdate',syncTouch);player().addEventListener('seeked',syncTouch);
 const vid=player();vid.addEventListener('timeupdate',seeked);vid.addEventListener('loadedmetadata',seeked);
 window.suesManualAdjust={load,settingsPatch,render,changeMode,toOutput,fromOutput,displayDuration,selectedRange:()=>manifestItems().find(e=>e.key===selected),liveState:()=>({kind,selected,draft,jobId:parentId})};
})();
