'use strict';
const el=id=>document.getElementById(id);let project=null,selected=null;
async function api(path,method='GET',body){const r=await fetch(path,{method,credentials:'same-origin',headers:{'x-sues-request':'editor','content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const data=await r.json();if(!r.ok)throw Error(data.error||`HTTP ${r.status}`);return data;}
function draw(data){project=data;el('status').textContent=`Proyecto ${data.projectId} · revisión ${data.revision}`;
 const media=el('media');media.replaceChildren();for(const m of data.media){const div=document.createElement('div');div.className='media';div.textContent=`${m.kind} · ${m.name}`;media.append(div);}
 const source=data.media.find(m=>m.id==='m_sues_158404_video' && m.playable) || data.media.find(m=>m.kind==='video' && m.playable && !/3d|hyperframes/i.test(m.name));
 const player=el('source-video');
 if(source && player.dataset.mediaId!==source.id){player.src='/api/engine-next/media/'+encodeURIComponent(source.id);player.dataset.mediaId=source.id;player.hidden=false;el('preview-empty').hidden=true;}
 const tracks=el('tracks');tracks.replaceChildren();for(const t of data.tracks){const row=document.createElement('div');row.className='track';const label=document.createElement('label');label.textContent=t.id;row.append(label);for(const clip of data.clips.filter(c=>c.track===t.id)){const b=document.createElement('button');b.className='clip'+(clip.disabled?' disabled':'');b.textContent=`${clip.name||clip.id} · ${clip.start.toFixed(1)}–${(clip.start+clip.duration).toFixed(1)} s`;b.title=clip.id;b.setAttribute('aria-pressed',String(selected===clip.id));b.addEventListener('click',()=>choose(clip.id));row.append(b);}tracks.append(row);}
 if(selected&&!data.clips.some(c=>c.id===selected))selected=null;choose(selected);
}
function choose(id){selected=id;const clip=project?.clips.find(c=>c.id===id);if(clip && !el('source-video').hidden){const player=el('source-video');if(Number.isFinite(clip.start)&&Number.isFinite(player.duration)&&clip.start<=player.duration)player.currentTime=clip.start;}el('info').textContent=clip?`${clip.name||clip.id} · ${clip.kind}`:'Selecciona una capa del timeline';const ok=clip?.kind==='text';el('fontSize').disabled=!ok;el('apply').disabled=!ok;el('fontSize').value=ok?(clip.fontSize||72):72;el('fontValue').textContent=ok?`${clip.fontSize||72} px`:'—';const transform=!!clip&&['video','image'].includes(clip.kind)&&!clip.locked;el('transformControls').hidden=!transform;if(transform){for(const [id,value] of [['posX',clip.x],['posY',clip.y],['scale',clip.scale]]){el(id).value=String(value);}updateTransformOutputs();}for(const b of el('tracks').querySelectorAll('.clip'))b.setAttribute('aria-pressed',String(b.title===selected));}
el('source-video').addEventListener('timeupdate',e=>el('playhead').textContent=`Tiempo del bruto: ${e.target.currentTime.toFixed(2)} s`);
function updateTransformOutputs(){el('posXValue').textContent=el('posX').value+' px';el('posYValue').textContent=el('posY').value+' px';el('scaleValue').textContent=Number(el('scale').value).toFixed(2)+'×';}
for(const id of ['posX','posY','scale'])el(id).addEventListener('input',updateTransformOutputs);
el('applyTransform').addEventListener('click',async()=>{
 if(!project||!selected)return;const button=el('applyTransform');button.disabled=true;el('transformNotice').textContent='Guardando…';
 try{await api('/api/engine-next/clip-transform','POST',{expectedRevision:project.revision,clipId:selected,x:Number(el('posX').value),y:Number(el('posY').value),scale:Number(el('scale').value)});el('transformNotice').textContent='Transformación guardada sin activar las capas bloqueadas';await load();}
 catch(e){el('transformNotice').textContent=e.message;await load().catch(()=>{});}
 finally{button.disabled=false;}
});
el('fontSize').addEventListener('input',e=>el('fontValue').textContent=`${e.target.value} px`);
el('apply').addEventListener('click',async()=>{if(!project||!selected)return;el('apply').disabled=true;el('notice').textContent='Guardando…';try{await api('/api/engine-next/title-size','POST',{expectedRevision:project.revision,clipId:selected,fontSize:Number(el('fontSize').value)});el('notice').textContent='Revisión guardada';await load();}catch(e){el('notice').textContent=e.message;await load().catch(()=>{});}});
async function load(){try{draw(await api('/api/engine-next/project'));}catch(e){el('status').textContent=e.message;el('notice').textContent='Es necesario iniciar sesión en SUES y activar el motor de pruebas.';}}
load();