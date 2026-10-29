/* Interactive rehearsal of the existing compiled edit plan. Final export remains FFmpeg. */
(()=>{
'use strict';
const $=id=>document.getElementById(id),video=$('video'),wrap=video.parentElement;
const make=(tag,cls)=>{const x=document.createElement(tag);if(cls)x.className=cls;return x;};
const root=make('div','live-preview-root');root.hidden=true;
const picture=make('canvas','live-picture');picture.width=540;picture.height=960;
const graphics=make('canvas','live-ass-graphics'),captions=make('canvas','live-ass-captions'),captionWrap=make('div','live-caption-wrapper');
captionWrap.append(captions);root.append(picture,graphics,captionWrap);wrap.append(root);
const message=make('div','live-preview-message');message.setAttribute('role','status');message.hidden=true;wrap.append(message);
const bar=make('div','live-preview-bar'),play=make('button'),zoom=make('button'),clock=make('output'),label=make('span');
play.type=zoom.type='button';play.textContent='▶ Reproducir';play.setAttribute('aria-label','Reproducir o pausar edición');
zoom.textContent='Ampliar vista';zoom.type='button';label.textContent='Vista interactiva';bar.append(play,clock,zoom,label);bar.hidden=true;wrap.parentElement.insertBefore(bar,wrap.nextSibling);
let enabled=false,ready=false,scene=null,epoch=0,requestEpoch=0,timer=null,loading=false,jobId=null,oldSrc=null,oldControls=true;
let capASS=null,graphicASS=null,capReady=false,graphicReady=false,lastASS=null,frame=-1,raf=null,viewZoom=1,lastMeasured=null;
let pendingCaptionReset=false,busyRetries=0;
const resources=new Map(),ctx=picture.getContext('2d',{willReadFrequently:true});
const matte=make('video');matte.muted=true;matte.playsInline=true;matte.preload='auto';
const original=make('canvas'),person=make('canvas'),mask=make('canvas'),layer=make('canvas');
for(const c of [original,person,mask,layer]){c.width=540;c.height=960;}
const oc=original.getContext('2d'),pc=person.getContext('2d'),mc=mask.getContext('2d',{willReadFrequently:true}),lc=layer.getContext('2d',{willReadFrequently:true});
let audioContext=null,voiceNode=null,voiceGain=null,compressor=null,visualDirty=true;
matte.addEventListener('seeked',()=>{visualDirty=true;});matte.addEventListener('loadeddata',()=>{visualDirty=true;});
const state=()=>window.suesManualAdjust?.liveState?.();
const active=()=>enabled&&document.body.dataset.postMode==='adjust'&&state()?.jobId===jobId;
const notify=text=>{message.textContent=text;message.hidden=!text;};
const time=t=>{t=Math.max(0,t||0);return String(Math.floor(t/60)).padStart(2,'0')+':'+String(Math.floor(t%60)).padStart(2,'0');};
const fonts=['montserrat-bold','montserrat-extrabold','montserrat-bold-italic','montserrat-extrabold-italic','anton','stencil','futhark'].map(id=>'/api/fonts/'+id+'/file');
function parts(ass){
 const lines=ass.split('\n'),head=lines.filter(l=>!l.startsWith('Dialogue:')).join('\n')+'\n',text=[],other=[];
 for(const line of lines.filter(l=>l.startsWith('Dialogue:'))){const name=line.split(',')[4];(/^seg-\d+$/.test(name)?text:other).push(line);}
 return {captions:head+text.join('\n')+'\n',graphics:head+other.join('\n')+'\n'};
}
function assEngine(canvas,content,onReady){
 canvas.width=540;canvas.height=960;
 return new SubtitlesOctopus({canvas,subContent:content,fonts,lazyFileLoading:false,fallbackFont:fonts[0],
  workerUrl:'/vendor/libass-wasm/subtitles-octopus-worker.js',renderMode:'wasm-blend',targetFps:30,maxRenderHeight:960,
  libassMemoryLimit:48,libassGlyphLimit:12,onReady,onError:()=>{notify('Este navegador no pudo abrir las capas. Puedes usar Ver fragmento sin perder tus ajustes.');}});
}
function hookCaptionPixels(){
 const c=captions.getContext('2d');if(c.suesLiveHook)return;c.suesLiveHook=true;
 for(const name of ['putImageData','drawImage']){const draw=c[name].bind(c);c[name]=(...args)=>{const out=draw(...args);if(pendingCaptionReset){pendingCaptionReset=false;queueMicrotask(()=>{captionWrap.style.transform='';lastMeasured=null;});}return out;};}
}
function installASS(){
 if(!scene||scene.ass===lastASS)return;const tracks=parts(scene.ass);lastASS=scene.ass;
 if(!capASS){
  capASS=assEngine(captions,tracks.captions,()=>{capReady=true;capASS.resize(540,960);capASS.setIsPaused(video.paused,video.currentTime);});
  graphicASS=assEngine(graphics,tracks.graphics,()=>{graphicReady=true;graphicASS.resize(540,960);graphicASS.setIsPaused(video.paused,video.currentTime);});
  hookCaptionPixels();
 }else{
  pendingCaptionReset=true;capASS.setTrack(tracks.captions);graphicASS.setTrack(tracks.graphics);
  if(capReady)capASS.setCurrentTime(video.currentTime);
  if(graphicReady)graphicASS.setCurrentTime(video.currentTime);
 }
}
function asset(url,kind){
 if(!url)return null;if(resources.has(url))return resources.get(url);
 const e=make(kind==='image'?'img':kind==='audio'?'audio':'video');
 if(kind!=='image'){e.preload='auto';e.playsInline=true;e.muted=kind!=='audio';}
 e.addEventListener('seeked',()=>{visualDirty=true;});e.addEventListener('loadeddata',()=>{visualDirty=true;});e.addEventListener('error',()=>{if(active())notify('Un recurso no se puede reproducir en este navegador. Compruébalo con Ver fragmento; tus ajustes se conservan.');});e.src=url;if(e.load)e.load();resources.set(url,e);return e;
}
function mediaAt(e,t,playing,audible=false,gain=0){
 if(!e)return false;
 if(e.readyState<1)return false;
 if(Math.abs((e.currentTime||0)-t)>(playing?.13:.012))try{e.currentTime=Math.max(0,t);}catch{}
 if(audible)e.volume=Math.max(0,Math.min(1,gain));
 if(playing&&e.paused)void e.play().catch(()=>{});else if(!playing&&!e.paused)e.pause();
 return e.readyState>=2&&!e.seeking;
}
function cover(c,e,x,y,w,h,zoom=1){
 const iw=e.videoWidth??e.naturalWidth,ih=e.videoHeight??e.naturalHeight;if(!iw||!ih)return;
 const factor=Math.max(w/iw,h/ih)*zoom,sw=w/factor,sh=h/factor;c.drawImage(e,(iw-sw)/2,(ih-sh)/2,sw,sh,x,y,w,h);
}
function fadedImage(e,b,feather,direction,alpha=1,zoom=1){
 lc.clearRect(0,0,540,960);lc.globalAlpha=alpha;cover(lc,e,b.x,b.y,b.w,b.h,zoom);lc.globalAlpha=1;
 if(feather>0){lc.globalCompositeOperation='destination-in';const g=direction==='top'?lc.createLinearGradient(0,b.y,0,b.y+feather):lc.createLinearGradient(0,b.y+b.h-feather,0,b.y+b.h);
  g.addColorStop(0,direction==='top'?'rgba(0,0,0,0)':'rgba(0,0,0,1)');g.addColorStop(1,direction==='top'?'rgba(0,0,0,1)':'rgba(0,0,0,0)');lc.fillStyle=g;lc.fillRect(b.x,b.y,b.w,b.h);lc.globalCompositeOperation='source-over';}
 ctx.drawImage(layer,0,0);
}
function compose(t){
 if(video.readyState<2||video.seeking)return;
 ctx.clearRect(0,0,540,960);ctx.drawImage(video,0,0,540,960);oc.clearRect(0,0,540,960);oc.drawImage(picture,0,0);
 const playing=!video.paused,draft=state()?.draft;
 const foreground=scene.foreground?.events??[];
 let subject=false;
 const edits=draft?.reviewedForeground?.events;
 for(const [i,baseline]of foreground.entries()){
  const e=edits?.[baseline.draftIndex>=0?baseline.draftIndex:i]??baseline;if(t<e.start||t>=e.end)continue;
  if(e.type==='behind-video'){
   const source=asset(baseline.url,'video'),r=e.region??{x:0,y:0,width:1080,height:1920,featherBottom:0};
   if(mediaAt(source,e.sourceIn+t-e.start,playing)){
    const fade=Math.min(.2,(e.end-e.start)/3),alpha=e.opacity*Math.min(1,(t-e.start)/fade,(e.end-t)/fade);
    fadedImage(source,{x:r.x/2,y:r.y/2,w:r.width/2,h:r.height/2},r.featherBottom/2,'bottom',Math.max(0,alpha));subject=true;
   }
  }else if(e.type==='background-blur'){
   ctx.filter='blur('+e.sigma/2+'px)';ctx.drawImage(original,0,0);ctx.filter='none';subject=true;
  }else if(e.type==='behind-text'){
   ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.fillStyle='#ff7a18';ctx.strokeStyle='#ffd3a4';ctx.lineWidth=2;
   ctx.globalAlpha=Math.max(0,Math.min(1,(t-e.start)/.2,(e.end-t)/.2));
   for(const [i,line]of e.lines.entries()){ctx.font='800 '+((baseline.textSizes?.[i]??140)/2)+'px SuesStageExtraBold';const y=(120+i*160-12*(t-e.start))/2+ctx.measureText(line).actualBoundingBoxAscent;ctx.shadowColor='#331100';ctx.shadowOffsetX=1.5;ctx.shadowOffsetY=2.5;ctx.fillText(line,270,y,390);ctx.shadowColor='transparent';ctx.strokeText(line,270,y,390);ctx.fillText(line,270,y,390);}ctx.shadowOffsetX=ctx.shadowOffsetY=0;ctx.globalAlpha=1;subject=true;
  }
 }
 if(subject&&matte.readyState>=2&&!matte.seeking){
  mc.clearRect(0,0,540,960);mc.drawImage(matte,0,0,540,960);const data=mc.getImageData(0,0,540,960);
  for(let i=0;i<data.data.length;i+=4){data.data[i+3]=data.data[i];data.data[i]=data.data[i+1]=data.data[i+2]=255;}
  mc.putImageData(data,0,0);pc.clearRect(0,0,540,960);pc.globalCompositeOperation='source-over';pc.drawImage(original,0,0);pc.globalCompositeOperation='destination-in';pc.drawImage(mask,0,0);pc.globalCompositeOperation='source-over';ctx.drawImage(person,0,0);
 }
 for(const e of scene.videos??[]){const source=asset(e.url,'video');if(t>=e.start&&t<e.end){if(mediaAt(source,e.sourceIn+t-e.start,playing))cover(ctx,source,0,0,540,960);}else if(source&&!source.paused)source.pause();}
 for(const e of scene.images??[]){
  if(t<e.start||t>=e.end)continue;const img=asset(e.url,'image');if(!img.complete||!img.naturalWidth)continue;
  const b=e.box,fade=e.fadeSeconds??.2,alpha=Math.max(0,Math.min(1,(t-e.start)/fade,(e.end-t)/fade));
  fadedImage(img,{x:b.left/2,y:b.top/2,w:(b.right-b.left)/2,h:(b.bottom-b.top)/2},e.featherPx/2,e.mask==='soft-top'?'top':'bottom',alpha,e.motion==='slow-push'?1.02+.06*(t-e.start)/(e.end-e.start):1);
 }
 // Imported ambient overlays need their original alpha/codec. When unavailable,
 // retain the explicit fragment fallback instead of pretending a layer rendered.
 root.dataset.backgroundReady=String(!subject||matte.readyState>=2);
}
function audioFrame(t){
 if(!scene)return;const playing=!video.paused;
 if(voiceGain&&audioContext?.state==='running')voiceGain.gain.value=Number($('voice-gain').value)/100;
 const speaking=(scene.captions??[]).some(c=>t>=c.start&&t<c.end);
 if(scene.music){const e=scene.music,media=asset(e.url,'audio'),gain=Number($('music-gain').value)/100,fade=Math.min(1,t/e.fadeIn,(scene.duration-t)/e.fadeOut);
  mediaAt(media,e.sourceIn+t,playing&&$('music-enabled').checked,true,gain*Math.max(0,fade)*($('music-duck').checked&&speaking ? .5 : 1));}
 const automatic=scene.proceduralSfx?.events??[];
 for(const [i,e]of automatic.entries()){const key=e.url+'#auto='+i,at=t>=e.start&&t<e.end,media=at?asset(key,'audio'):resources.get(key);if(at)mediaAt(media,t-e.start,playing,true,(scene.proceduralSfx.gain??0)*(e.weight??1)*(speaking?.65:1));else if(media&&!media.paused)media.pause();}
 const events=scene.sfx??[];for(const [i,e]of events.entries()){const key=e.url+'#cue='+i,at=t>=e.start&&t<e.end,media=at?asset(key,'audio'):resources.get(key);
  if(at)mediaAt(media,(e.sourceIn??0)+t-e.start,playing,true,e.gain*(speaking ? .65 : 1));else if(media&&!media.paused)media.pause();}
}
function loop(){
 if(!active()||!ready){raf=null;return;}
 const t=video.currentTime;root.hidden=video.hidden;const changed=frame!==Math.round(t*30)||!video.paused;
 if(changed&&capReady)capASS.setIsPaused(video.paused,t);if(changed&&graphicReady)graphicASS.setIsPaused(video.paused,t);
 if(scene.foreground)mediaAt(matte,t,!video.paused);if(changed||visualDirty){compose(t);visualDirty=false;}audioFrame(t);frame=Math.round(t*30);
 play.textContent=video.paused?'▶ Reproducir':'❚❚ Pausar';clock.textContent=time(t)+' / '+time(scene.duration);
 position();raf=requestAnimationFrame(loop);
}
function position(){
 const w=video.clientWidth,h=video.clientHeight,r=Math.min(w/1080,h/1920),width=1080*r,height=1920*r;
 root.style.width=width+'px';root.style.height=height+'px';root.style.left=(video.offsetLeft+(w-width)/2)+'px';root.style.top=(video.offsetTop+(h-height)/2)+'px';
 viewport();
}
function viewport(){
 const s=state(),box=scene?.captionBox,t=s?.draft?.captionTransforms?.[s.selected]??{dx:0,dy:0},origin=s?.kind==='captions'&&box?((540+t.dx)/1080*100)+'% '+(((box.top+box.bottom)/2+t.dy)/1920*100)+'%':'50% 50%';
 for(const el of [root,document.querySelector('.touch-edit-surface')])if(el){el.style.transformOrigin=origin;el.style.transform=viewZoom===1?'':'scale('+viewZoom+')';}
 zoom.textContent=viewZoom===1?'Ampliar vista':viewZoom+'× · Ver encuadre';
}
async function start(){
 const s=state();if(!s?.jobId||!active())return;const mine=++requestEpoch;
 loading=true;if(!ready)notify('Preparando vídeo y capas para editar…');bar.hidden=false;
 try{
  let data=await api('jobs/'+s.jobId+'/live-preview','POST',{fingerprint:current.fingerprint,settings:settings()});
  while(data.state==='PREPARING'&&active()&&mine===requestEpoch){notify('Preparando vista interactiva · '+data.percent+' %. Sólo se hace una vez por encuadre.');await new Promise(r=>setTimeout(r,1000));data={...data,...await api('jobs/'+s.jobId+'/live-preview?key='+data.key)};}
  if(!active()||mine!==requestEpoch)return;if(data.state!=='READY')throw Error(data.error??'Vista interactiva no disponible');
  const previousKey=scene?.key;scene=data;visualDirty=true;
  if(!ready||previousKey!==data.key){
   const at=video.currentTime;video.pause();video.controls=false;video.src=data.base;video.preload='auto';video.load();
   await new Promise((resolve,reject)=>{const done=()=>{clearTimeout(timeout);video.removeEventListener('loadeddata',done);resolve();};const timeout=setTimeout(()=>reject(Error('No se pudo cargar el vídeo para editar')),30000);video.addEventListener('loadeddata',done);});
   video.currentTime=Math.min(at,data.duration-.03);
   if(data.foreground){matte.src=data.foreground.matte;matte.load();}
  }
  await document.fonts.load('800 70px SuesStageExtraBold');
  busyRetries=0;ready=true;root.hidden=false;document.body.dataset.livePreview='true';installASS();
  notify(data.unsupported.length?data.unsupported.join(' '):'');frame=-1;lastMeasured=null;
  if(!raf)raf=requestAnimationFrame(loop);
 }catch(e){if(active()&&mine===requestEpoch){if(/render activo|busy|Espera a que termine/i.test(e.message)&&busyRetries++<60){notify('Esperando a que termine la preparación anterior… Tu borrador se conserva.');clearTimeout(timer);timer=setTimeout(start,2000);}else notify(e.message+' · Puedes usar Ver fragmento.');}}
 finally{loading=false;}
}
function stop(){
 ++requestEpoch;busyRetries=0;enabled=false;ready=false;loading=false;clearTimeout(timer);cancelAnimationFrame(raf);raf=null;root.hidden=true;message.hidden=true;bar.hidden=true;delete document.body.dataset.livePreview;
 for(const e of resources.values())if(e.pause)e.pause();matte.pause();
 capASS?.dispose();graphicASS?.dispose();capASS=graphicASS=null;capReady=graphicReady=false;
 if(oldSrc&&current?.id===jobId){const at=video.currentTime;video.pause();video.controls=oldControls;video.src=oldSrc;video.load();video.addEventListener('loadedmetadata',()=>{video.currentTime=Math.min(at,video.duration||at);},{once:true});}
 if(voiceNode){voiceNode.disconnect();voiceNode.connect(audioContext.destination);}if(voiceGain)voiceGain.gain.value=1;
 oldSrc=null;scene=null;captionWrap.style.transform='';viewZoom=1;const surface=document.querySelector('.touch-edit-surface');if(surface)surface.style.transform='';
}
function refresh(){if(!active())return;clearTimeout(timer);timer=setTimeout(start,100);}
function gesture(id,t){
 if(!ready||!scene)return;const base=scene.transforms[id]??{dx:0,dy:0,scale:1},b=scene.captionBox;
 captionWrap.style.transformOrigin=((540+base.dx)/1080*100)+'% '+(((b.top+b.bottom)/2+base.dy)/1920*100)+'%';
 captionWrap.style.transform='translate('+((t.dx-base.dx)/1080*100)+'%,'+((t.dy-base.dy)/1920*100)+'%) scale('+(t.scale/base.scale)+')';
}
function adjustedBounds(box,id){const base=scene?.transforms?.[id]??{dx:0,dy:0,scale:1},now=state()?.draft?.captionTransforms?.[id]??base,r=now.scale/base.scale,b=scene.captionBox,cx=540+base.dx,cy=(b.top+b.bottom)/2+base.dy;
 return {left:cx+(box.left-cx)*r+now.dx-base.dx,right:cx+(box.right-cx)*r+now.dx-base.dx,top:cy+(box.top-cy)*r+now.dy-base.dy,bottom:cy+(box.bottom-cy)*r+now.dy-base.dy};}
function bounds(id){
 if(!ready||!capReady||!captions.width)return null;
 const t=video.currentTime;if(lastMeasured&&lastMeasured.id===id&&Math.abs(lastMeasured.time-t)<.04)return adjustedBounds(lastMeasured.box,id);
 try{
  const c=captions.getContext('2d',{willReadFrequently:true}),d=c.getImageData(0,0,captions.width,captions.height),w=d.width,h=d.height;
  let x0=w,y0=h,x1=0,y1=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(d.data[(y*w+x)*4+3]>30){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
  if(x1<=x0)return null;const box={left:x0/w*1080,right:x1/w*1080,top:y0/h*1920,bottom:y1/h*1920};lastMeasured={id,time:t,box};return adjustedBounds(box,id);
 }catch{return null;}
}
play.onclick=async()=>{if(!ready)return;if(video.paused){
 try{if(!audioContext){audioContext=new AudioContext();voiceNode=audioContext.createMediaElementSource(video);voiceGain=audioContext.createGain();compressor=audioContext.createDynamicsCompressor();compressor.threshold.value=-2;compressor.ratio.value=20;voiceGain.connect(compressor).connect(audioContext.destination);}voiceNode.disconnect();voiceNode.connect(voiceGain);voiceGain.gain.value=Number($('voice-gain').value)/100;await audioContext.resume();}catch{}
 await video.play().catch(()=>{});
 }else video.pause();};
zoom.onclick=()=>{viewZoom=viewZoom===1?1.5:viewZoom===1.5?2:1;viewport();};
new ResizeObserver(position).observe(video);
window.suesLivePreview={mode(mode){
 if(mode!=='adjust'){if(enabled)stop();return;}
 if(enabled&&jobId===state()?.jobId)return;
 if(enabled)stop();jobId=state()?.jobId;if(!jobId)return;oldSrc=video.getAttribute('src');oldControls=video.controls;enabled=true;viewZoom=1;void start();
},refresh,gesture,bounds,position,markDirty:()=>{visualDirty=true;},resetGesture:()=>{captionWrap.style.transform='';lastMeasured=null;},isReady:()=>ready,isLoading:()=>loading,viewportZoom:()=>viewZoom,focusElement:()=>{if(state()?.kind==='captions'&&viewZoom===1)viewZoom=1.5;else if(state()?.kind!=='captions')viewZoom=1;viewport();},scene:()=>scene};
})();
