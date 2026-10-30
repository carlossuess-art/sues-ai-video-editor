import {fitCaptionSize} from './font-kits.js';
import {hierarchyLayout} from './caption-hierarchy.js';
import {SOUND_PRESETS} from './sound-effects.js';
import {resourceLevelFilter} from './audio-levels.js';
import {mkdirSync,readFileSync,writeFileSync,existsSync,statSync,rmSync,cpSync,lstatSync,readdirSync} from 'node:fs';
import {join,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {spawn,execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {prepareProject,fileSha256,ENGINE_HASH} from './local-pipeline.js';
import {buildPreviewASS,buildVideoPassFilter,buildAudioPassFilter} from './local-preview.js';
const run=promisify(execFile),KEY=/^[a-f0-9]{64}$/;
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const mime=file=>({'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.wav':'audio/wav','.mp3':'audio/mpeg','.m4a':'audio/mp4','.ogg':'audio/ogg','.webm':'video/webm'}[extname(file).toLowerCase()]??'video/mp4');
export function editableBasePlan(plan){
 const p=structuredClone(plan);delete p.postEdit;delete p.outputDuration;
 p.captions=[];p.captionTransforms={};p.selectedMedia=[];p.illustrations=[];p.foregroundEffects=null;
 p.subjectLayers=[];p.ambientOverlays=[];p.globalTransitions=[];p.finishFade=null;
 p.audioMix=null;p.musicTracks=[];p.soundEffects={events:[]};p.customSfx={events:[]};p.voiceEffects={events:[]};
 p.voiceGain=1;p.mastering={enabled:false};
 // Drawings remain in the browser's original ASS track. Only background
 // treatments stay in the clean plate; no text or resource is burned in.
 return p;
}
export function editableBaseKey(jobId,project,prepared){
 const p=editableBasePlan(prepared.plan);
 return hash({version:2,engine:ENGINE_HASH,levels:prepared.settings.levelResources,jobId,source:project.boundHashes.source,camera:p.camera,timeMap:p.timeMap,
  zooms:p.semantic?.zooms,anchors:p.semantic?.anchors,trajectory:p.semantic?.trajectory,
  focus:(p.semantic?.motions??[]).filter(x=>x.backgroundTreatment),
  paper:(p.graphics??[]).map(g=>({type:g.type,start:g.start,end:g.end,box:g.box})),
  normalized:prepared.settings.voiceNormalization,matte:prepared.plan.foregroundEffects?.matte?.sha256??null});
}
export class LivePreviews{
 constructor(directory,jobs,{busy=()=>false}={}){
  this.directory=directory;this.jobs=jobs;this.busy=busy;this.tasks=new Map();this.running=null;this.checkedFiles=new Map();
  mkdirSync(directory,{recursive:true,mode:0o700});if(lstatSync(directory).isSymbolicLink())throw Error('Invalid live preview cache');
  for(const key of readdirSync(directory).filter(x=>KEY.test(x))){try{const t=JSON.parse(readFileSync(join(directory,key,'state.json')));
   if(t.key!==key)continue;if(t.state==='PREPARING'){t.state='INTERRUPTED';t.error='La vista interactiva se interrumpió; vuelve a abrirla.';}this.tasks.set(key,t);
  }catch{}}
 }
 save(t){writeFileSync(join(this.directory,t.key,'state.json'),JSON.stringify(t),{mode:0o600});}
 task(id,key){const t=this.tasks.get(key);if(!KEY.test(key??'')||!t||t.jobId!==id)throw Error('Live preview not found');return t;}
 view(t){
  let percent=0;try{const s=readFileSync(join(this.directory,t.key,'progress.txt'),'utf8'),m=[...s.matchAll(/out_time_us=(\d+)/g)].at(-1);percent=Math.min(99,Math.round(Number(m?.[1]??0)/1e6/t.duration*100));}catch{}
  return {key:t.key,jobId:t.jobId,state:t.state,error:t.error??null,percent:t.state==='READY'?100:percent,elapsedSeconds:Math.round((Date.now()-t.createdAt)/1000)};
 }
 get(id,key){return this.view(this.task(id,key));}
 scene(id,request){
  if(!request||Object.keys(request).some(k=>!['fingerprint','settings'].includes(k)))throw Error('Invalid live preview request');
  const job=this.jobs.get(id);if(job.state!=='DONE'||job.fingerprint!==request.fingerprint)throw Error('El proyecto ha cambiado; recarga la versión.');
  const project=this.jobs.loadProfile(job.profileId),prepared=prepareProject(project,request.settings),p=prepared.plan,key=editableBaseKey(id,project,prepared);
  let t=this.tasks.get(key);
  if(!t||['FAILED','INTERRUPTED'].includes(t.state)){
   if(this.running||this.jobs.previewBusy||this.busy()||this.jobs.children.size||this.jobs.queued().length||this.jobs.publishing.size)throw Error('Hay otro render activo; la vista guardada se conserva.');
   const old=[...this.tasks.values()].filter(x=>x.state!=='PREPARING').sort((a,b)=>a.createdAt-b.createdAt);
   while(this.tasks.size>=2&&old.length){const v=old.shift();rmSync(join(this.directory,v.key),{recursive:true,force:true});this.tasks.delete(v.key);}
   const dir=join(this.directory,key);if(existsSync(dir))rmSync(dir,{recursive:true,force:true});mkdirSync(dir,{mode:0o700});
   t={key,jobId:id,state:'PREPARING',createdAt:Date.now(),duration:p.duration,files:{}};this.tasks.set(key,t);this.save(t);
   this.jobs.previewBusy=true;this.running={key,child:null,done:null};
   this.running.done=this.build(t,project,prepared).catch(e=>{t.state='FAILED';t.error='No se pudo preparar la vista interactiva. Conservamos el vídeo y el borrador.';t.detail=e.message;this.save(t);}).finally(()=>{this.running=null;this.jobs.previewBusy=false;this.jobs.drain();});
  }
  if(t.state==='READY'&&t.browserVideoCompatibility!==1){
   if(this.running||this.jobs.previewBusy||this.busy()||this.jobs.children.size||this.jobs.queued().length||this.jobs.publishing.size)throw Error('Hay otro render activo; la vista guardada se conserva.');
   t.state='PREPARING';this.save(t);this.jobs.previewBusy=true;this.running={key,child:null,done:null};
   this.running.done=this.browserVideos(t,prepared.plan).then(()=>{t.state='READY';this.save(t);}).catch(e=>{t.state='FAILED';t.error='No se pudo preparar un recurso para este navegador; el original se conserva.';t.detail=e.message;this.save(t);}).finally(()=>{this.running=null;this.jobs.previewBusy=false;this.jobs.drain();});
  }
  const bind=a=>{
   if(!a?.localFile)return null;const sha=a.sha256??fileSha256(a.localFile),part='a-'+sha;
   if(!KEY.test(sha)||lstatSync(a.localFile).isSymbolicLink())throw Error('Invalid bound live resource');
   t.files[part]=t.browserVideoProxies?.[sha]??{file:a.localFile,sha256:sha,size:statSync(a.localFile).size,mime:mime(a.localFile)};
   return '/api/jobs/'+id+'/live-preview?key='+key+'&part='+part+(t.browserVideoProxies?.[sha]?'&compat=1':'');
  };
  const clean=o=>Object.fromEntries(Object.entries(o??{}).filter(([k])=>!['localFile','sha256','rights','sourceSha256'].includes(k)));
  const videos=(p.selectedMedia??[]).map(e=>({...clean(e),url:bind(e)}));
  const images=(p.illustrations??[]).map(e=>({...clean(e),url:bind(e)}));
  const overlays=(p.ambientOverlays??[]).map(e=>({...clean(e),url:bind(e)}));
  const fg=p.foregroundEffects?{events:p.foregroundEffects.events.map(e=>({...clean(e),draftIndex:(prepared.settings.reviewedForeground?.events??[]).findIndex(v=>v.type===e.type&&v.start===e.start&&v.end===e.end&&v.assetId===e.assetId),...(e.type==='behind-text'?{textSizes:e.lines.map(line=>fitCaptionSize([line],{font:'Montserrat',fontRole:'keyword',fontSize:140},780))}:{}),...(e.type==='behind-video'?{url:bind(e)}:{})})),matte:'/api/jobs/'+id+'/live-preview?key='+key+'&part=matte'}:null;
  const sfx=(p.customSfx?.events??[]).map(e=>({...clean(e),url:bind(p.customSfx.assets[e.input])}));
  const music=p.audioMix?{...clean(p.audioMix),url:bind(p.audioMix)}:null;
  const musicTracks=(p.musicTracks??[]).map(e=>({...clean(e),url:bind(e)}));
  this.save(t);
  return {...this.view(t),base:'/api/jobs/'+id+'/live-preview?key='+key+'&part=base',ass:buildPreviewASS(p),
   captions:p.captions.map(c=>({id:c.id,start:c.start,end:c.end,text:c.text,box:p.layout.caption})),
   captionBox:p.layout.caption,transforms:p.captionTransforms??{},
   captionFontSizes:Object.fromEntries(p.captions.map(c=>{const hierarchy=hierarchyLayout(c,p.policy.captions,p.layout.caption);const size=hierarchy?.find(row=>row.role==='keyword')?.size??fitCaptionSize(p.policy.captions.inlineGroups?[c.text]:c.lines,p.policy.captions);return [c.id,size];})),
   videos,images,overlays,foreground:fg,
   music,musicTracks,sfx,voiceGain:prepared.settings.voiceGain,proceduralSfx:{...p.soundEffects,events:(p.soundEffects?.events??[]).map(e=>({...e,end:e.start+e.duration,url:'/api/jobs/'+id+'/live-preview?key='+key+'&part=p-'+e.preset}))},
   postEdit:p.postEdit??null,transitions:p.globalTransitions??[],finishFade:p.finishFade??null,duration:p.duration,
   unsupported:[...((p.globalTransitions??[]).length||p.finishFade?['Las transiciones y el fundido final se verifican con Ver fragmento.']:[]),...((p.subjectLayers??[]).length?['Las capas de máscara heredadas se comprueban con Ver fragmento.']:[]),...((p.ambientOverlays??[]).length?['Los overlays importados se comprueban con Ver fragmento.']:[]),...((p.voiceEffects?.events??[]).length?['Los filtros de voz se comprueban con Ver fragmento.']:[])],
   fidelity:{captions:'original-ASS-libass',spatial:'interactive-composition',audio:'interactive-audition-final-mix-requires-fragment'},isFinalExport:false};
 }
 async build(t,project,prepared){
  const dir=join(this.directory,t.key),p=editableBasePlan(prepared.plan);
  const head=buildPreviewASS(p).split('[Events]')[0]+'[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n';
  writeFileSync(join(dir,'empty.ass'),head);cpSync(project.fontDirectory,join(dir,'fonts'),{recursive:true});
  let audio=buildAudioPassFilter(p);
  if(prepared.settings.voiceNormalization)audio='[0:a]loudnorm=I=-16:TP=-3:LRA=11,aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo[stage-voice-input];\n'+audio.replaceAll('[0:a]','[stage-voice-input]');
  writeFileSync(join(dir,'base.ffscript'),buildVideoPassFilter(p,{assFile:'empty.ass'})+';\n'+audio);
  const args=['-v','error','-nostdin','-threads','1','-i',project.sourcePath,'-filter_complex_threads','1','-filter_complex_script','base.ffscript','-map','[video]','-map','[mixed-audio]','-vf','scale=540:960'];
  // Scaling an output already fed by a complex graph needs its own graph label.
  let graph=readFileSync(join(dir,'base.ffscript'),'utf8').replaceAll('[video]','[stage-unscaled]');
  graph+=';\n[stage-unscaled]scale=540:960:flags=fast_bilinear[video]\n';writeFileSync(join(dir,'base.ffscript'),graph.replace(/;\s*;/g,';'));
  args.splice(args.indexOf('-vf'),2);
  args.push('-c:v','libx264','-threads','1','-preset','veryfast','-crf','26','-pix_fmt','yuv420p','-c:a','aac','-b:a','96k','-t',String(p.duration),'-movflags','+faststart','-progress',join(dir,'progress.txt'),'-y','base.mp4');
  await this.ffmpeg(args,dir);
  for(const [name,preset]of Object.entries(SOUND_PRESETS)){
   const d=preset.duration,attack=Math.min(preset.attack,d/3),release=Math.min(.09,d/2),fx='afade=t=in:st=0:d='+attack+',afade=t=out:st='+(d-release)+':d='+release+','+(prepared.settings.levelResources?resourceLevelFilter(d):'')+'aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo';
   await this.ffmpeg(['-v','error','-nostdin','-f','lavfi','-i',preset.source,'-af',fx,'-c:a','pcm_s16le','-y','p-'+name+'.wav'],dir);
   const f=join(dir,'p-'+name+'.wav');t.files['p-'+name]={file:f,sha256:fileSha256(f),size:statSync(f).size,mime:'audio/wav'};
  }
  if(prepared.plan.foregroundEffects){
   await this.ffmpeg(['-v','error','-nostdin','-threads','1','-i',prepared.plan.foregroundEffects.matte.localFile,'-vf','scale=270:480:flags=bilinear,format=yuv420p','-an','-c:v','libx264','-threads','1','-preset','veryfast','-crf','12','-movflags','+faststart','-y','matte.mp4'],dir);
   const f=join(dir,'matte.mp4');t.files.matte={file:f,sha256:fileSha256(f),size:statSync(f).size,mime:'video/mp4'};
  }
  const f=join(dir,'base.mp4'),probe=JSON.parse((await run('ffprobe',['-v','error','-show_streams','-show_format','-of','json',f])).stdout),v=probe.streams.find(s=>s.codec_type==='video');
  if(v?.width!==540||v?.height!==960||Math.abs(Number(probe.format.duration)-p.duration)>.12||fileSha256(project.sourcePath)!==project.boundHashes.source)throw Error('Live base verification failed');
  await run('ffmpeg',['-v','error','-xerror','-threads','1','-i',f,'-f','null','-'],{timeout:180000});
  t.files.base={file:f,sha256:fileSha256(f),size:statSync(f).size,mime:'video/mp4'};
  await this.browserVideos(t,prepared.plan);
  t.state='READY';this.save(t);
 }
 async browserVideos(t,plan){
  const unique=new Map([...(plan.selectedMedia??[]),...(plan.foregroundEffects?.events??[]).filter(e=>e.type==='behind-video')].filter(e=>e.localFile).map(e=>[e.localFile,e]));
  t.browserVideoProxies??={};const dir=join(this.directory,t.key);
  for(const [file,e]of unique){
   const sha=e.sha256??fileSha256(file);if(t.browserVideoProxies[sha])continue;
   const probe=JSON.parse((await run('ffprobe',['-v','error','-select_streams','v:0','-show_streams','-show_format','-of','json',file],{timeout:15000})).stdout),v=probe.streams[0];
   if(['h264','vp8','vp9','av1'].includes(v?.codec_name))continue;
   const name='browser-'+sha+'.mp4',target=join(dir,name);
   await this.ffmpeg(['-v','error','-nostdin','-threads','1','-i',file,'-map','0:v:0','-vf','scale=540:960:force_original_aspect_ratio=decrease:force_divisible_by=2,fps=30','-an','-c:v','libx264','-threads','1','-preset','veryfast','-crf','26','-pix_fmt','yuv420p','-movflags','+faststart','-y',name],dir);
   const checked=JSON.parse((await run('ffprobe',['-v','error','-show_streams','-show_format','-of','json',target],{timeout:15000})).stdout),cv=checked.streams.find(s=>s.codec_type==='video');
   if(cv?.codec_name!=='h264'||statSync(target).size>40*1024*1024||Math.abs(Number(checked.format.duration)-Number(probe.format.duration))>.12||fileSha256(file)!==sha)throw Error('Browser video derivative verification failed');
   const record={file:target,sha256:fileSha256(target),size:statSync(target).size,mime:'video/mp4'};t.browserVideoProxies[sha]=record;t.files['a-'+sha]=record;
  }
  t.browserVideoCompatibility=1;this.save(t);
 }
 ffmpeg(args,cwd){return new Promise((resolve,reject)=>{
  const child=spawn('ffmpeg',args,{cwd,stdio:['ignore','ignore','pipe']});if(this.running)this.running.child=child;
  let err='';child.stderr.on('data',b=>{err=(err+b).slice(-10000);});const timer=setTimeout(()=>child.kill('SIGKILL'),600000);
  child.once('error',e=>{clearTimeout(timer);reject(e);});child.once('close',code=>{clearTimeout(timer);code===0?resolve():reject(Error('Live FFmpeg: '+err));});
 });}
 media(id,key,part){
  const t=this.task(id,key);if(t.state!=='READY')throw Error('Live preview is preparing');
  if(!/^(base|matte|a-[a-f0-9]{64}|p-(whoosh|impact|draw|neon))$/.test(part??''))throw Error('Live resource not found');
  const f=t.files[part];if(!f||!existsSync(f.file)||lstatSync(f.file).isSymbolicLink()||statSync(f.file).size!==f.size)throw Error('Live resource changed');
  const st=statSync(f.file,{bigint:true}),signature=[st.dev,st.ino,st.size,st.mtimeNs,st.ctimeNs].join(':'),cached=this.checkedFiles.get(f.file);
  if(cached?.signature!==signature||cached?.sha256!==f.sha256){if(fileSha256(f.file)!==f.sha256)throw Error('Live resource changed');this.checkedFiles.set(f.file,{signature,sha256:f.sha256});}
  return f;
 }
 async close(){if(this.running){this.running.child?.kill('SIGTERM');await this.running.done;}}
}
