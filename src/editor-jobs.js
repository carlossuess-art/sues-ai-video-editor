import {renderProgress} from './render-progress.js';
import {LocalPrivateStorage} from './private-storage.js';
import {mkdirSync,readdirSync,readFileSync,writeFileSync,renameSync,openSync,closeSync,unlinkSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {bundleDigest,startLocalRender,validateRenderResult,validateRenderRequest} from './render-worker.js';
import {loadProject,prepareProject,writePreparedBundle,RENDER_SCRIPT,fileSha256} from './local-pipeline.js';
import {buildPreviewASS,buildPreviewFilter} from './local-preview.js';
import {canTransition} from './app-contract.js';
const ID=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const now=()=>new Date().toISOString();
export class EditorJobs{
 constructor({directory,profiles,renderer=RENDER_SCRIPT,maxQueued=16,autoStart=true,storage}){
  if(!Number.isInteger(maxQueued)||maxQueued<1||maxQueued>100)throw new Error('maxQueued 1..100');
  this.maxQueued=maxQueued;this.autoStart=autoStart;this.closing=false;this.retryTimer=null;
  this.directory=resolve(directory);this.profiles=profiles;this.renderer=renderer;this.children=new Map();this.jobs=new Map();
  mkdirSync(this.directory,{recursive:true,mode:0o700});
  this.storeLock=this.acquireLock('store.lock');
  this.storage=storage??new LocalPrivateStorage({directory:join(this.directory,'private-objects')});this.publishing=new Set();const recover=[];
  for(const id of readdirSync(this.directory).filter(id=>ID.test(id))){
   const job=JSON.parse(readFileSync(join(this.directory,id,'job.json'),'utf8'));this.jobs.set(id,job);
   if(['PUBLISHING','RENDERING'].includes(job.state)){
    try{validateRenderResult(this.requestFor(job));if(job.state==='RENDERING')this.transition(job,'PUBLISHING');recover.push(job);continue;}catch(error){if(job.state==='PUBLISHING'){job.error='Guardado interrumpido: '+error.message;this.transition(job,'PUBLISH_FAILED');continue;}}
   }
   if(['ANALYZING','PLANNED','ADJUSTING','RENDERING'].includes(job.state)){
    job.state='FAILED';job.error='El worker se interrumpió. Puedes volver a exportar.';job.history.push({state:'FAILED',at:now(),reason:'worker-restart'});this.save(job);
   }
  }
  this.nextQueueOrder=Math.max(0,...[...this.jobs.values()].map(j=>j.queueOrder??0))+1;
  for(const job of recover)setImmediate(()=>this.publish(job));
  if(autoStart)setImmediate(()=>this.drain());
 }
 dir(id){if(!ID.test(id)||!this.jobs.has(id))throw new Error('Job not found');return join(this.directory,id);}
 save(job){const dir=join(this.directory,job.id),tmp=join(dir,'.job-'+randomUUID()+'.json');mkdirSync(dir,{recursive:true,mode:0o700});writeFileSync(tmp,JSON.stringify(job,null,2)+'\n',{mode:0o600});renameSync(tmp,join(dir,'job.json'));}
 transition(job,state){if(!canTransition(job.state,state))throw new Error(`Invalid transition ${job.state} -> ${state}`);job.state=state;job.updatedAt=now();job.history.push({state,at:job.updatedAt});this.save(job);}
 get(id){this.dir(id);return this.jobs.get(id);}
 view(job){return {id:job.id,profileId:job.profileId,title:job.title,state:job.state,revision:job.revision??0,canUndo:job.state==='PREVIEW_READY'&&(job.undo?.length??0)>0,progress:renderProgress(join(this.dir(job.id),'render-'+(job.attempt??1),'ffmpeg-progress.txt'),job.summary?.duration,job.state),storageReady:!!job.artifact,queuePosition:job.state==='QUEUED'?this.queued().findIndex(j=>j.id===job.id)+1:null,createdAt:job.createdAt,updatedAt:job.updatedAt,settings:job.settings,summary:job.summary,fingerprint:job.fingerprint,error:job.error??null,cancelRequested:job.cancelRequested??false,attempt:job.attempt??0,history:job.history};}
 health(){return {version:'1.0',mode:'local-worker',status:this.closing?'stopping':'available',queue:{rendering:this.children.size,waiting:this.queued().length,saving:this.publishing.size,capacity:this.maxQueued},storage:{provider:'private-local',remote:false},dependencyReadiness:'use-editor-doctor'};}
 list(){return [...this.jobs.values()].map(j=>this.view(j)).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));}
 create(profileId,settings={}){
  if(!Object.hasOwn(this.profiles,profileId))throw new Error('Unknown profile');
  const project=loadProject(this.profiles[profileId]),prepared=prepareProject(project,settings),id=randomUUID(),job={id,profileId,title:project.title,state:'DRAFT',createdAt:now(),updatedAt:now(),history:[{state:'DRAFT',at:now()}],settings:prepared.settings,fingerprint:prepared.fingerprint};
  this.jobs.set(id,job);this.save(job);this.transition(job,'UPLOADED');this.transition(job,'ANALYZING');
  try{writePreparedBundle(project,prepared,join(this.dir(id),'bundle-1'));job.bundle='bundle-1';job.bundleDigest=bundleDigest(join(this.dir(id),job.bundle));job.revision=1;job.summary=this.summary(prepared);this.transition(job,'PLANNED');this.transition(job,'PREVIEW_READY');return this.view(job);}
  catch(error){job.error=error.message;this.transition(job,'FAILED');throw error;}
 }
 summary(p){return {duration:p.plan.duration,sourceWords:p.director.audit.sourceWords,mappedWords:p.director.audit.mappedWords,omittedWords:p.director.audit.omittedWords,captions:p.plan.captions.length,zooms:p.plan.semantic.zooms.length,motions:p.plan.semantic.motions.length,manualHighlights:p.director.audit.manualHighlights??0,rejections:p.director.audit.rejections,externalCostUSD:0,productionReady:false};}
 plan(id){const job=this.get(id),bundle=join(this.dir(id),job.bundle);return {manifest:JSON.parse(readFileSync(join(bundle,'manifest.json'),'utf8')),director:JSON.parse(readFileSync(join(bundle,'director.json'),'utf8'))};}
 adjust(id,settings,{recordHistory=true}={}){
  const job=this.get(id);if(job.state!=='PREVIEW_READY')throw new Error('Adjustments require PREVIEW_READY; duplicate completed jobs to adjust');
  if(recordHistory&&settings.captionWords!==undefined&&settings.captionWords!==(job.settings.captionWords??3)&&(Object.keys(settings.captionOverrides??{}).length||(settings.highlightCaptions??[]).length))throw new Error('Changing caption groups requires resetting caption edits and highlights');
  const project=loadProject(this.profiles[job.profileId]),prepared=prepareProject(project,settings);
  if(prepared.fingerprint===job.fingerprint){if(bundleDigest(join(this.dir(id),job.bundle))!==job.bundleDigest)throw new Error('Prepared bundle changed; create a new job');return this.view(job);}
  const prior=structuredClone(job.settings);
  this.transition(job,'ADJUSTING');
  try{
   const revision=job.revision+1,bundle='bundle-'+revision;writePreparedBundle(project,prepared,join(this.dir(id),bundle));job.revision=revision;job.bundle=bundle;job.bundleDigest=bundleDigest(join(this.dir(id),bundle));job.settings=prepared.settings;job.fingerprint=prepared.fingerprint;job.summary=this.summary(prepared);if(recordHistory)job.undo=[...(job.undo??[]),prior].slice(-10);this.transition(job,'PREVIEW_READY');return this.view(job);
  }catch(error){job.error=error.message;this.transition(job,'FAILED');throw error;}
 }
 acquireLock(name='worker.lock'){
  const path=join(this.directory,name);
  try{const fd=openSync(path,'wx',0o600);writeFileSync(fd,JSON.stringify({pid:process.pid}));closeSync(fd);return path;}
  catch(error){if(error.code!=='EEXIST')throw error;
   let old;try{old=JSON.parse(readFileSync(path,'utf8'));}catch{throw new Error('Worker lock needs manual inspection');}
   if(!Number.isInteger(old.pid)||old.pid<1)throw new Error('Invalid worker lock');
   try{process.kill(old.pid,0);}catch(e){if(e.code==='ESRCH'){unlinkSync(path);return this.acquireLock(name);}throw e;}
   throw new Error('Worker busy');
  }
 }
 undo(id){const job=this.get(id);if(job.state!=='PREVIEW_READY'||!job.undo?.length)throw new Error('No saved adjustment to undo');const history=[...job.undo],settings=history.pop();this.adjust(id,settings,{recordHistory:false});job.undo=history;this.save(job);return this.view(job);}
 queued(){return [...this.jobs.values()].filter(j=>j.state==='QUEUED').sort((a,b)=>a.queueOrder-b.queueOrder||a.id.localeCompare(b.id));}
 validatePrepared(job){
  const project=loadProject(this.profiles[job.profileId]),prepared=prepareProject(project,job.settings);
  if(prepared.fingerprint!==job.fingerprint)throw new Error('Inputs or engine changed; create a new job');
  const digest=bundleDigest(join(this.dir(job.id),job.bundle));
  if(job.bundleDigest&&job.bundleDigest!==digest)throw new Error('Prepared bundle changed; create a new job');
  // Upgrade legacy snapshots only after comparing the generated render graph.
  if(!job.bundleDigest){
   const manifest=JSON.parse(readFileSync(join(this.dir(job.id),job.bundle,'manifest.json'),'utf8'));
   if(JSON.stringify(manifest)!==JSON.stringify(prepared.plan)||readFileSync(join(this.dir(job.id),job.bundle,'filter.ffscript'),'utf8')!==buildPreviewFilter(prepared.plan)||readFileSync(join(this.dir(job.id),job.bundle,'captions.ass'),'utf8')!==buildPreviewASS(prepared.plan)||Object.entries(project.fontHashes).some(([name,sha])=>fileSha256(join(this.dir(job.id),job.bundle,'fonts',name))!==sha))throw new Error('Legacy bundle changed; create a new job');
   job.bundleDigest=digest;this.save(job);
  }
  return project;
 }
 render(id){
  if(this.closing)throw new Error('Worker is closing');
  const job=this.get(id);if(['QUEUED','RENDERING','PUBLISHING','DONE'].includes(job.state))return this.view(job);
  if(job.state==='PUBLISH_FAILED'){this.publish(job);return this.view(job);}
  if(!['PREVIEW_READY','FAILED'].includes(job.state)||!job.bundle)throw new Error('Job is not ready to render');
  if(this.queued().length>=this.maxQueued)throw new Error('Render queue full');
  this.validatePrepared(job);job.queueOrder=this.nextQueueOrder++;job.enqueuedAt=now();job.cancelRequested=false;delete job.error;
  this.transition(job,'QUEUED');if(this.autoStart)this.drain();return this.view(job);
 }
 drain(){
  if(this.closing||!this.autoStart||this.children.size)return;
  clearTimeout(this.retryTimer);this.retryTimer=null;
  for(const job of this.queued()){
   let project,lock;
   try{project=this.validatePrepared(job);}catch(error){job.error=error.message;this.transition(job,'FAILED');continue;}
   try{lock=this.acquireLock();}catch(error){
    if(error.message==='Worker busy'){this.retryTimer=setTimeout(()=>this.drain(),1000);this.retryTimer.unref();return;}
    job.error=error.message;this.transition(job,'FAILED');continue;
   }
   this.start(job,project,lock);return;
  }
 }
 start(job,project,lock){
  const id=job.id,attempt=(job.attempt??0)+1,relative='render-'+attempt,dir=join(this.dir(id),relative);
  try{
   mkdirSync(dir,{mode:0o700});job.attempt=attempt;job.output=relative+'/preview.mp4';delete job.error;job.cancelRequested=false;this.transition(job,'RENDERING');
   const request={version:'1.0',provider:'local-ffmpeg',jobId:id,attempt,fingerprint:job.fingerprint,bundleDigest:job.bundleDigest,sourceSha256:project.boundHashes.source,source:project.sourcePath,bundle:join(this.dir(id),job.bundle),output:join(dir,'preview.mp4'),log:join(dir,'worker.log'),duration:job.summary.duration};
   const child=startLocalRender(request,{renderer:this.renderer});this.children.set(id,child);
   const finish=(code,error)=>{
    if(!this.children.has(id))return;this.children.delete(id);try{unlinkSync(lock);}catch{}
    if(job.cancelRequested){job.error='Exportación cancelada';this.transition(job,'CANCELLED');}
    else{
     try{if(code!==0||error)throw new Error('Exportación fallida; consulta el registro local del trabajo');validateRenderResult(request);this.publish(job);return;}
     catch(failure){job.error=failure.message;this.transition(job,'FAILED');}
    }
    setImmediate(()=>this.drain());
   };
   child.once('error',error=>finish(null,error));child.once('close',code=>finish(code));
   if(child.pid)writeFileSync(lock,JSON.stringify({pid:child.pid,jobId:id}));
  }catch(error){
   const child=this.children.get(id);if(child){try{process.kill(-child.pid,'SIGTERM');}catch{}return;}
   try{unlinkSync(lock);}catch{}if(['QUEUED','RENDERING'].includes(job.state)){job.error=error.message;this.transition(job,'FAILED');}setImmediate(()=>this.drain());
  }
 }
 cancel(id){const job=this.get(id);if(job.state==='RENDERING'){
   const child=this.children.get(id);if(!child)throw new Error('Worker not owned by this server');job.cancelRequested=true;this.save(job);try{process.kill(-child.pid,'SIGTERM');}catch(e){if(e.code!=='ESRCH')throw e;}return this.view(job);
  }
  if(job.state!=='CANCELLED')this.transition(job,'CANCELLED');return this.view(job);
 }
 storageContext(job){return {ownerId:'local-session',projectId:job.id};}
 requestFor(job){
  if(!Number.isInteger(job.attempt)||job.attempt<1||!/^bundle-\d+$/.test(job.bundle))throw new Error('Missing render provenance');
  const root=this.dir(job.id),request=JSON.parse(readFileSync(join(root,'render-'+job.attempt,'render-request.json'),'utf8'));validateRenderRequest(request);
  const project=loadProject(this.profiles[job.profileId]);
  if(request.jobId!==job.id||request.attempt!==job.attempt||request.fingerprint!==job.fingerprint||request.bundleDigest!==job.bundleDigest||request.bundle!==join(root,job.bundle)||request.output!==join(root,'render-'+job.attempt,'preview.mp4')||request.source!==project.sourcePath||request.sourceSha256!==project.boundHashes.source||request.duration!==job.summary.duration)throw new Error('Render provenance mismatch');
  return request;
 }
 async publish(job){
  if(this.publishing.has(job.id)||this.closing)return;
  this.publishing.add(job.id);
  try{
   if(job.state!=='PUBLISHING')this.transition(job,'PUBLISHING');
   const request=this.requestFor(job),audit=validateRenderResult(request),context=this.storageContext(job);
   const video=await this.storage.put(request.output,context,{mediaType:'video/mp4'});
   if(video.key!=='sha256:'+audit.outputSha256||video.bytes!==audit.bytes)throw new Error('Stored video differs from render audit');
   await this.storage.resolve(video,context);
   const auditObject=await this.storage.put(request.output.replace(/\.mp4$/,'.audit.json'),context,{mediaType:'application/json'}),auditPath=await this.storage.resolve(auditObject,context);
   if(JSON.stringify(JSON.parse(readFileSync(auditPath,'utf8')))!==JSON.stringify(audit))throw new Error('Stored audit differs from validated audit');
   job.artifact=video;job.auditArtifact=auditObject;delete job.error;this.transition(job,'DONE');
  }catch(error){job.error='Guardado pendiente: '+error.message;this.transition(job,'PUBLISH_FAILED');}
  finally{this.publishing.delete(job.id);setImmediate(()=>this.drain());}
 }
 async media(id){const job=this.get(id);if(job.state!=='DONE')throw new Error('Video not ready');if(job.artifact)return this.storage.resolve(job.artifact,this.storageContext(job));return join(this.dir(id),job.output);}
 async audit(id){const job=this.get(id);if(job.state!=='DONE')throw new Error('Video not ready');const path=job.auditArtifact?await this.storage.resolve(job.auditArtifact,this.storageContext(job)):(await this.media(id)).replace(/\.mp4$/,'.audit.json');return JSON.parse(readFileSync(path,'utf8'));}
 async close(){this.closing=true;clearTimeout(this.retryTimer);const waits=[];for(const [id,child]of this.children){waits.push(new Promise(r=>child.once('close',r)));this.cancel(id);}await Promise.all(waits);while(this.publishing.size)await new Promise(r=>setTimeout(r,10));if(this.storeLock){unlinkSync(this.storeLock);this.storeLock=null;}}
}
