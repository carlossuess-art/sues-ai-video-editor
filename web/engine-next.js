'use strict';
const el=id=>document.getElementById(id);let project=null,selected=null,timeSec=0,displayedFrameTime=null;
function setTime(next,{seekSource=true}={}){
 if(!project)return;const total=SuesTimeline.duration(project.clips);timeSec=SuesTimeline.snap(next,total);
 const slider=el('timeline-seek');slider.value=String(timeSec);
 if(displayedFrameTime!==null&&Math.abs(displayedFrameTime-timeSec)>.017){
   el('program-frame').hidden=true;el('source-video').hidden=false;el('view-source').hidden=true;
   el('preview-warning').textContent='El fotograma anterior no corresponde al cabezal actual. Solicita otra captura nativa.';displayedFrameTime=null;
 }
 el('timeline-time').textContent=SuesTimeline.stamp(timeSec)+' / '+SuesTimeline.stamp(total);
 for(const marker of el('tracks').querySelectorAll('.playhead-marker'))marker.style.left=(100*timeSec/total)+'%';
 const player=el('source-video');if(seekSource&&player.readyState>=1&&Math.abs(player.currentTime-timeSec)>.017)player.currentTime=timeSec;
 el('playhead').textContent='Cabezal '+SuesTimeline.stamp(timeSec);
}

async function api(path,method='GET',body){const r=await fetch(path,{method,credentials:'same-origin',headers:{'x-sues-request':'editor','content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const data=await r.json();if(!r.ok)throw Error(data.error||`HTTP ${r.status}`);return data;}
async function refreshHistory(){
 const state=el('history-status'),list=el('history-list');state.textContent='Comprobando historial…';
 try{
  const d=await api('/api/engine-next/history');
  if(!project||d.projectId!==project.projectId||d.currentRevision!==project.revision){
   list.replaceChildren();state.textContent='Revisión cambiada. Actualiza el proyecto para mostrar su historial.';return;
  }
  list.replaceChildren();for(const v of d.versions){
   const item=document.createElement('div');item.className='history-item';
   const title=document.createElement('strong');title.textContent='Versión '+v.version+' · revisión '+v.revision;
   const description=document.createElement('small');description.textContent=' '+v.kind+' · '+v.created.slice(0,16).replace('T',' ');
   item.append(title,description);list.append(item);
  }
  state.textContent=d.versionCount+' versiones verificadas · consulta sin restauración';
 }catch(e){list.replaceChildren();state.textContent='Historial no disponible: '+e.message;}
}
function draw(data){project=data;const total=SuesTimeline.duration(data.clips);
 el('timeline-seek').max=String(total);el('timeline-end').textContent=SuesTimeline.stamp(total);
 el('status').textContent=`Proyecto ${data.projectId} · revisión ${data.revision}`;
 const media=el('media');media.replaceChildren();for(const m of data.media){const div=document.createElement('div');div.className='media';div.textContent=`${m.kind} · ${m.name}`;media.append(div);}
 const source=data.media.find(m=>m.id==='m_sues_158404_video' && m.playable) || data.media.find(m=>m.kind==='video' && m.playable && !/3d|hyperframes/i.test(m.name));
 const player=el('source-video');
 if(source && player.dataset.mediaId!==source.id){player.src='/api/engine-next/media/'+encodeURIComponent(source.id);player.dataset.mediaId=source.id;player.hidden=false;el('preview-empty').hidden=true;}
 const tracks=el('tracks');tracks.replaceChildren();for(const t of data.tracks){const row=document.createElement('div');row.className='track';const label=document.createElement('label');label.textContent=t.id;row.append(label);
  const lane=document.createElement('div');lane.className='track-lane';lane.setAttribute('aria-label','Pista '+t.id);
  for(const clip of data.clips.filter(c=>c.track===t.id)){const b=document.createElement('button');b.className='clip'+(clip.disabled?' disabled':'')+(clip.locked?' locked':'');
    b.textContent=clip.name||clip.id;b.title=clip.id+' · '+clip.start.toFixed(2)+'–'+(clip.start+clip.duration).toFixed(2)+' s';b.dataset.clipId=clip.id;b.setAttribute('aria-pressed',String(selected===clip.id));
    const geometry=SuesTimeline.bounds(clip,total);b.style.left=geometry.left+'%';b.style.width=geometry.width+'%';
    b.addEventListener('click',()=>choose(clip.id));lane.append(b);}
  const marker=document.createElement('span');marker.className='playhead-marker';marker.setAttribute('aria-hidden','true');lane.append(marker);row.append(lane);tracks.append(row);}
 if(selected&&!data.clips.some(c=>c.id===selected))selected=null;choose(selected,{seek:false});setTime(timeSec,{seekSource:false});
}
function choose(id,{seek=true}={}){selected=id;const clip=project?.clips.find(c=>c.id===id);if(clip&&seek&&Number.isFinite(clip.start))setTime(clip.start);el('info').textContent=clip?`${clip.name||clip.id} · ${clip.kind}`:'Selecciona una capa del timeline';const ok=clip?.kind==='text';el('fontSize').disabled=!ok;el('apply').disabled=!ok;el('fontSize').value=ok?(clip.fontSize||72):72;el('fontValue').textContent=ok?`${clip.fontSize||72} px`:'—';const editableText=!!clip&&clip.kind==='text'&&!clip.locked;el('timingControls').hidden=!editableText;if(editableText){el('clipStartFrame').value=String(Math.round(clip.start*30));el('clipDurationFrames').value=String(Math.round(clip.duration*30));} const transform=!!clip&&['video','image'].includes(clip.kind)&&!clip.locked;el('transformControls').hidden=!transform;if(transform){for(const [id,value] of [['posX',clip.x],['posY',clip.y],['scale',clip.scale]]){el(id).value=String(value);}updateTransformOutputs();}for(const b of el('tracks').querySelectorAll('.clip'))b.setAttribute('aria-pressed',String(b.dataset.clipId===selected));}
el('view-program').addEventListener('click',()=>{
 if(!project)return;const img=el('program-frame'),video=el('source-video'),capturedTime=timeSec,capturedRevision=project.revision;
 video.pause();
 img.onload=()=>{if(!project||project.revision!==capturedRevision||Math.abs(timeSec-capturedTime)>.017)return;
   displayedFrameTime=capturedTime;img.hidden=false;video.hidden=true;el('view-source').hidden=false;el('preview-warning').textContent='Fotograma compuesto nativo · no equivale a reproducción continua ni exportación QA.';void load();};
 img.onerror=()=>{el('preview-warning').textContent='No se ha podido obtener el fotograma compuesto. El bruto original sigue disponible.';};
 img.src='/api/engine-next/program-frame?time='+encodeURIComponent(timeSec.toFixed(6))+'&revision='+encodeURIComponent(project.revision);
});
el('view-source').addEventListener('click',()=>{displayedFrameTime=null;el('program-frame').hidden=true;el('source-video').hidden=false;el('view-source').hidden=true;el('preview-warning').textContent='Vista del bruto original (sin capas). La revisión compuesta debe superar QA.';});
el('source-video').addEventListener('timeupdate',e=>setTime(e.target.currentTime,{seekSource:false}));
el('source-video').addEventListener('loadedmetadata',()=>setTime(timeSec));
el('timeline-seek').addEventListener('input',e=>setTime(Number(e.target.value)));
for(const [id,delta] of [['frame-back',-1],['frame-next',1]])el(id).addEventListener('click',()=>{if(!project)return;setTime(timeSec+delta/30);el('view-program').click();});
el('frame-current').addEventListener('click',()=>{if(project)el('view-program').click();});
function updateTransformOutputs(){el('posXValue').textContent=el('posX').value+' px';el('posYValue').textContent=el('posY').value+' px';el('scaleValue').textContent=Number(el('scale').value).toFixed(2)+'×';}
for(const id of ['posX','posY','scale'])el(id).addEventListener('input',updateTransformOutputs);
el('applyTransform').addEventListener('click',async()=>{
 if(!project||!selected)return;const button=el('applyTransform');button.disabled=true;el('transformNotice').textContent='Guardando…';
 try{await api('/api/engine-next/clip-transform','POST',{expectedRevision:project.revision,clipId:selected,x:Number(el('posX').value),y:Number(el('posY').value),scale:Number(el('scale').value)});el('transformNotice').textContent='Transformación guardada sin activar las capas bloqueadas';await load();}
 catch(e){el('transformNotice').textContent=e.message;await load().catch(()=>{});}
 finally{button.disabled=false;}
});
el('applyTiming').addEventListener('click',async()=>{
 if(!project||!selected)return;const button=el('applyTiming');button.disabled=true;el('timingNotice').textContent='Guardando tiempo…';
 try{await api('/api/engine-next/clip-timing','POST',{expectedRevision:project.revision,clipId:selected,startFrame:Number(el('clipStartFrame').value),durationFrames:Number(el('clipDurationFrames').value)});
   el('timingNotice').textContent='Tiempo guardado en el proyecto FableCut';await load();
 }catch(e){el('timingNotice').textContent=e.message;await load().catch(()=>{});}finally{button.disabled=false;}
});
el('fontSize').addEventListener('input',e=>el('fontValue').textContent=`${e.target.value} px`);
el('apply').addEventListener('click',async()=>{if(!project||!selected)return;el('apply').disabled=true;el('notice').textContent='Guardando…';try{await api('/api/engine-next/title-size','POST',{expectedRevision:project.revision,clipId:selected,fontSize:Number(el('fontSize').value)});el('notice').textContent='Revisión guardada';await load();}catch(e){el('notice').textContent=e.message;await load().catch(()=>{});}});
async function load(){try{draw(await api('/api/engine-next/project'));await refreshHistory();}catch(e){el('status').textContent=e.message;el('notice').textContent='Es necesario iniciar sesión en SUES y activar el motor de pruebas.';}}
el('history-refresh').addEventListener('click',refreshHistory);
load();
