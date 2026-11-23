/* SUES Q03 · controles aislados para el corazón y el viaje musical; sin autoguardado. */
(()=>{
'use strict';
const BASE='/q03-export-qa', $=id=>document.getElementById(id), FPS=30;
const IDS=['heartSize','heartUntil','soulUntil','calmMusic','calmUntil'];
let loadedRev=null,loadedPid=null,loading=false;
const roundFrame=x=>Math.round(x*FPS)/FPS;
const fmt=x=>Number(x).toFixed(2).replace('.',',')+' s';
const srcWater='asset-sues-agua-instrumental-user-20261123', srcMed='sues-meditative-r39';
const find=(p,id)=>{const c=p.clips.find(x=>x.id===id);if(!c)throw Error('Falta una capa de esta revisión: '+id);return c};
function labels(){
 $('heartSizeValue').textContent=Math.round(Number($('heartSize').value)*100)+' %';
 $('heartUntilValue').textContent=fmt(roundFrame(Number($('heartUntil').value)));
 $('soulUntilValue').textContent=fmt(Number($('soulUntil').value));
 $('calmUntilValue').textContent=fmt(Number($('calmUntil').value));
}
function limitMeditative(){
 const isWater=$('calmMusic').value==='water';
 $('calmUntil').max=isWater?'44.2':'47.5';
 if(Number($('calmUntil').value)>Number($('calmUntil').max))$('calmUntil').value=$('calmUntil').max;
 $('calmLimit').textContent=isWater?'Agua instrumental: audio original de 9,7 s. Fin máximo 44,20 s. Para un tramo más largo, elige Meditative. El reggae empieza a 41,97 s.':'Meditative · Introspectiva: recurso original personal de 188,68 s. El reggae empieza a 41,97 s; escucha el fundido con ambos.';
 labels();
}
async function loadTune(){
 if(loading)return;
 loading=true;$('saveTune').disabled=true;
 try{
  const r=await fetch(BASE+'/api/project',{cache:'no-store',credentials:'same-origin'});
  if(!r.ok)throw Error('HTTP '+r.status);
  const p=await r.json();
  loadedRev=p.revision;loadedPid=r.headers.get('X-FableCut-Project');
  if(p.name!=='SUES QA R14 COMPLETO 55s')throw Error('No es el proyecto QA esperado');
  const heart=find(p,'SC12-HEART-360-ALPHA'),soul=find(p,'MUSIC-01'),calm=find(p,'V12-CELESTIAL');
  $('heartSize').value=heart.props.scale;
  $('heartUntil').value=(heart.start+heart.duration).toFixed(6);
  $('soulUntil').value=(soul.start+soul.duration).toFixed(6);
  $('calmMusic').value=calm.mediaId===srcMed?'meditative':'water';
  if(![srcWater,srcMed].includes(calm.mediaId))throw Error('La pista meditativa ha cambiado; revisar antes de editar');
  $('calmUntil').value=(calm.start+calm.duration).toFixed(6);
  limitMeditative();$('tuneStatus').textContent='Revisión '+loadedRev+' · ajustes cargados. Mueve los controles y pulsa Guardar.';
  $('saveTune').disabled=false;
 }catch(e){$('tuneStatus').textContent='No se han cargado los ajustes: '+e.message}
 finally{loading=false}
}
for(const id of IDS){$(id).addEventListener(id==='calmMusic'?'change':'input',id==='calmMusic'?limitMeditative:labels)}
$('reloadTune').addEventListener('click',loadTune);
$('saveTune').addEventListener('click',async()=>{
 const btn=$('saveTune');btn.disabled=true;$('tuneStatus').textContent='Guardando en el proyecto de pruebas…';
 try{
  if(loadedRev===null)throw Error('Primero carga la revisión actual');
  const res=await fetch(BASE+'/api/project',{cache:'no-store',credentials:'same-origin'});
  if(!res.ok)throw Error('No se pudo revisar la edición antes de guardar (HTTP '+res.status+')');
  const p=await res.json();
  if(p.revision!==loadedRev)throw Error('Otro cambio ha actualizado el proyecto. Pulsa Recuperar valores actuales y revisa antes de guardar.');
  if(p.name!=='SUES QA R14 COMPLETO 55s')throw Error('Proyecto diferente; guardado cancelado');
  const q=JSON.parse(JSON.stringify(p));
  const h=find(q,'SC12-HEART-360-ALPHA'),s=find(q,'MUSIC-01'),t=find(q,'MUSIC-02'),m=find(q,'V12-CELESTIAL');
  const heartScale=Number($('heartSize').value),heartEnd=roundFrame(Number($('heartUntil').value));
  const soulEnd=roundFrame(Number($('soulUntil').value)),calmEnd=roundFrame(Number($('calmUntil').value));
  const med=$('calmMusic').value==='meditative';
  if(!(heartScale>=0.45&&heartScale<=1.45&&heartEnd>=54.2&&heartEnd<=55.11&&soulEnd>=8.9&&soulEnd<=13.51&&calmEnd>=42&&calmEnd<=47.51))throw Error('Algún ajuste está fuera de sus límites');
  const hDur=heartEnd-h.start;
  if(hDur<0.5||hDur>2)throw Error('Duración del corazón no válida');
  h.props.scale=heartScale;h.duration=hDur;
  h.keyframes.scale=[{t:0,v:+(heartScale*0.89).toFixed(4)},{t:Math.min(.30,hDur*.3),v:heartScale,ease:'ease-out'},{t:Math.max(.32,hDur-.30),v:+(heartScale*.98).toFixed(4),ease:'linear'},{t:hDur,v:+(heartScale*.92).toFixed(4),ease:'ease-in-out'}];
  h.keyframes.opacity=[{t:0,v:0},{t:Math.min(.167,hDur*.2),v:1,ease:'ease-out'},{t:Math.max(.3,hDur-.27),v:1},{t:hDur,v:0,ease:'ease-in'}];
  const peak=Number(s.props.volume);
  s.duration=soulEnd-s.start;
  s.keyframes.volume=[{t:0,v:peak,ease:'linear'},{t:s.duration-1.15,v:peak,ease:'linear'},{t:s.duration,v:0,ease:'linear'}];
  const tensionEnd=t.start+t.duration, tPeak=Number(t.props.volume);
  t.start=soulEnd-1.15;t.duration=tensionEnd-t.start;
  if(t.duration<3)throw Error('La transición con tensión no puede hacerse tan corta');
  t.keyframes.volume=[{t:0,v:0,ease:'linear'},{t:.9,v:tPeak,ease:'linear'},{t:t.duration-1.7,v:tPeak,ease:'linear'},{t:t.duration,v:0,ease:'linear'}];
  const media=findAsset(q,med?srcMed:srcWater);
  m.mediaId=media.id;m.name=med?'SUES · Meditative · introspectiva personal':'SUES · agua instrumental · reflexión';
  m.duration=calmEnd-m.start;
  if(m.duration<=1||m.duration>Number(media.duration)+.0001)throw Error('No puede prolongarse más que el audio original. Elige Meditative para mayor duración.');
  const vol=Number(m.props.volume);
  m.keyframes.volume=[{t:0,v:0,ease:'linear'},{t:.65,v:Math.min(.14,vol),ease:'linear'},{t:1.1,v:vol,ease:'linear'},{t:m.duration-1.35,v:vol,ease:'linear'},{t:m.duration,v:0,ease:'linear'}];
  q.revision=p.revision+1;
  const headers={'Content-Type':'application/json'};
  if(loadedPid)headers['X-FableCut-Project']=loadedPid;
  const saved=await fetch(BASE+'/api/project',{method:'PUT',credentials:'same-origin',headers,body:JSON.stringify(q)});
  const answer=await saved.json().catch(()=>({}));
  if(!saved.ok||!answer.ok)throw Error(answer.error||'Error de guardado HTTP '+saved.status);
  $('tuneStatus').textContent='Cambios guardados en revisión '+answer.revision+'. Pulsa «Ver / crear vista rápida» para revisar el vídeo actualizado.';
  await getProject();
  loadedRev=answer.revision;
 }catch(e){$('tuneStatus').textContent='No se guardó: '+e.message}
 finally{btn.disabled=false}
});
function findAsset(p,id){const m=p.media.find(x=>x.id===id);if(!m)throw Error('No está disponible la pista: '+id);return m}
void loadTune();
})();
