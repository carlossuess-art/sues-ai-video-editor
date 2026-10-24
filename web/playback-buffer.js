// Private in-memory buffering; media is never persisted in the shell cache.
globalThis.createSuesPlayback=function({videos,button,status,meter,fetcher=fetch,urlAPI=URL,maxBytes=128*1024*1024}){
 const states=new Map(videos.map(v=>[v,{source:'',blob:null,controller:null,version:0,time:0,received:0,total:0}]));let active=null;
 const state=v=>states.get(v);
 function update(){
  const s=state(active);button.hidden=meter.hidden=status.hidden=!s?.source;if(!s?.source)return;
  button.disabled=!!s.blob||s.source.startsWith('blob:');
  button.textContent=s.controller?'Cancelar carga':s.blob?'Vídeo cargado completo':'Cargar completo para verlo sin cortes';
  if(s.controller){meter.removeAttribute('value');if(s.total){meter.value=s.received/s.total*100;status.textContent='Cargando vídeo · '+Math.floor(meter.value)+' %';}else status.textContent='Cargando vídeo · '+(s.received/1048576).toFixed(1)+' MB';return;}
  if(s.blob||s.source.startsWith('blob:')){meter.value=100;status.textContent='Vídeo disponible en este dispositivo';return;}
  let end=active.currentTime||0;
  for(let i=0;i<active.buffered.length;i++)if(active.buffered.start(i)<=end+.1&&active.buffered.end(i)>=end)end=active.buffered.end(i);
  meter.value=Number.isFinite(active.duration)&&active.duration>0?Math.min(100,end/active.duration*100):0;
  const ahead=Math.max(0,end-(active.currentTime||0));status.textContent=ahead>.2?'Cargado '+ahead.toFixed(0)+' s por delante':'Esperando datos del vídeo…';
 }
 function stop(s){s.version++;s.controller?.abort();s.controller=null;}
 function mount(v){const s=state(v),url=s.blob||s.source;if(!url||v.getAttribute('src')===url)return;v.src=url;v.preload='auto';v.addEventListener('loadedmetadata',()=>{if(v.getAttribute('src')===url&&s.time>0&&Number.isFinite(v.duration))v.currentTime=Math.min(s.time,v.duration);},{once:true});v.load();}
 function source(v,url){const s=state(v);if(arguments.length===1)return s.source;if(s.source===url)return;stop(s);if(s.blob)urlAPI.revokeObjectURL(s.blob);Object.assign(s,{source:url,blob:null,time:0,received:0,total:0});v.pause();v.removeAttribute('src');v.load();if(v===active)mount(v);update();}
 function activate(v){
  active=v;
  for(const other of videos){const s=state(other);if(other===v){other.preload='auto';mount(other);}else{stop(s);if(other.hasAttribute('src'))s.time=other.currentTime||0;other.pause();other.preload='none';if(other.hasAttribute('src')){other.removeAttribute('src');other.load();}}}
  update();
 }
 async function download(){
  const v=active,s=state(v);if(!s?.source||s.blob||s.source.startsWith('blob:'))return;
  if(s.controller){stop(s);update();return;}
  const version=++s.version,controller=new AbortController();s.controller=controller;s.received=s.total=0;update();let reader;
  try{
   const response=await fetcher(s.source,{credentials:'same-origin',cache:'no-store',signal:controller.signal});
   if(s.version!==version){await response.body?.cancel();return;}
   if(!response.ok)throw Error('No se ha podido cargar el vídeo. Comprueba tu conexión e inténtalo de nuevo.');
   s.total=Number(response.headers.get('content-length'))||0;
   if(s.total>maxBytes){await response.body?.cancel();throw Error('Este vídeo es demasiado grande para cargarlo en memoria. Puedes descargar el MP4.');}
   const chunks=[];
   if(response.body?.getReader){reader=response.body.getReader();while(true){const {done,value}=await reader.read();if(done)break;if(s.version!==version)return;s.received+=value.byteLength;if(s.received>maxBytes)throw Error('El vídeo supera el límite de carga en memoria. Puedes descargar el MP4.');chunks.push(value);update();}}
   else{const data=await response.arrayBuffer();if(data.byteLength>maxBytes)throw Error('El vídeo supera el límite de carga en memoria.');chunks.push(data);s.received=data.byteLength;}
   if(s.version!==version)return;
   if(!s.received||s.total&&s.received!==s.total)throw Error('La descarga se ha interrumpido. Intenta cargar el vídeo otra vez.');
   const time=v.currentTime||0,playing=!v.paused;s.blob=urlAPI.createObjectURL(new Blob(chunks,{type:response.headers.get('content-type')||'video/mp4'}));s.time=time;s.controller=null;
   mount(v);if(playing)v.addEventListener('canplay',()=>{if(v===active&&s.version===version)v.play().catch(()=>{});},{once:true});update();
  }catch(e){if(s.version===version){s.controller=null;update();if(e.name!=='AbortError')status.textContent=e.message;}}
  finally{await reader?.cancel().catch(()=>{});}
 }
 button.onclick=download;
 for(const v of videos)for(const event of ['progress','timeupdate','durationchange','waiting','playing','loadedmetadata'])v.addEventListener(event,()=>{if(v===active)update();});
 return {source,activate,download,clear(v){source(v,'');},dispose(){for(const v of videos)source(v,'');active=null;}};
};
