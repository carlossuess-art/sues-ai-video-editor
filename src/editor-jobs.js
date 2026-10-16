import {mkdirSync,readdirSync,readFileSync,writeFileSync,renameSync,existsSync,openSync,closeSync,unlinkSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {spawn} from 'node:child_process';
import {loadProject,prepareProject,writePreparedBundle,RENDER_SCRIPT} from './local-pipeline.js';
import {canTransition} from './app-contract.js';
const ID=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const now=()=>new Date().toISOString();
export class EditorJobs{
 constructor({directory,profiles,renderer=RENDER_SCRIPT}){
  this.directory=resolve(directory);this.profiles=profiles;this.renderer=renderer;this.children=new Map();this.jobs=new Map();
  mkdirSync(this.directory,{recursive:true,mode:0o700});
  this.storeLock=this.acquireLock('store.lock');
  for(const id of readdirSync(this.directory).filter(id=>ID.test(id))){
   const job=JSON.parse(readFileSync(join(this.directory,id,'job.json'),'utf8'));this.jobs.set(id,job);
   if(['ANALYZING','PLANNED','ADJUSTING','RENDERING'].includes(job.state)){
    job.state='FAILED';job.error='El worker se interrumpió. Puedes volver a exportar.';job.history.push({state:'FAILED',at:now(),reason:'worker-restart'});this.save(job);
   }
  }
 }
 dir(id){if(!ID.test(id)||!this.jobs.has(id))throw new Error('Job not found');return join(this.directory,id);}
 save(job){const dir=join(this.directory,job.id),tmp=join(dir,'.job-'+randomUUID()+'.json');mkdirSync(dir,{recursive:true,mode:0o700});writeFileSync(tmp,JSON.stringify(job,null,2)+'\n',{mode:0o600});renameSync(tmp,join(dir,'job.json'));}
 transition(job,state){if(!canTransition(job.state,state))throw new Error(`Invalid transition ${job.state} -> ${state}`);job.state=state;job.updatedAt=now();job.history.push({state,at:job.updatedAt});this.save(job);}
 get(id){this.dir(id);return this.jobs.get(id);}
 view(job){return {id:job.id,profileId:job.profileId,title:job.title,state:job.state,createdAt:job.createdAt,updatedAt:job.updatedAt,settings:job.settings,summary:job.summary,fingerprint:job.fingerprint,error:job.error??null,cancelRequested:job.cancelRequested??false,attempt:job.attempt??0,history:job.history};}
 list(){return [...this.jobs.values()].map(j=>this.view(j)).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));}
 create(profileId,settings={}){
  if(!Object.hasOwn(this.profiles,profileId))throw new Error('Unknown profile');
  const project=loadProject(this.profiles[profileId]),prepared=prepareProject(project,settings),id=randomUUID(),job={id,profileId,title:project.title,state:'DRAFT',createdAt:now(),updatedAt:now(),history:[{state:'DRAFT',at:now()}],settings:prepared.settings,fingerprint:prepared.fingerprint};
  this.jobs.set(id,job);this.save(job);this.transition(job,'UPLOADED');this.transition(job,'ANALYZING');
  try{writePreparedBundle(project,prepared,join(this.dir(id),'bundle-1'));job.bundle='bundle-1';job.revision=1;job.summary=this.summary(prepared);this.transition(job,'PLANNED');this.transition(job,'PREVIEW_READY');return this.view(job);}
  catch(error){job.error=error.message;this.transition(job,'FAILED');throw error;}
 }
 summary(p){return {duration:p.plan.duration,sourceWords:p.director.audit.sourceWords,mappedWords:p.director.audit.mappedWords,omittedWords:p.director.audit.omittedWords,captions:p.plan.captions.length,zooms:p.plan.semantic.zooms.length,motions:p.plan.semantic.motions.length,rejections:p.director.audit.rejections,externalCostUSD:0,productionReady:false};}
 plan(id){const job=this.get(id),bundle=join(this.dir(id),job.bundle);return {manifest:JSON.parse(readFileSync(join(bundle,'manifest.json'),'utf8')),director:JSON.parse(readFileSync(join(bundle,'director.json'),'utf8'))};}
 adjust(id,settings){
  const job=this.get(id);if(job.state!=='PREVIEW_READY')throw new Error('Adjustments require PREVIEW_READY; duplicate completed jobs to adjust');
  const project=loadProject(this.profiles[job.profileId]),prepared=prepareProject(project,settings);
  this.transition(job,'ADJUSTING');
  try{
   const revision=job.revision+1,bundle='bundle-'+revision;writePreparedBundle(project,prepared,join(this.dir(id),bundle));job.revision=revision;job.bundle=bundle;job.settings=prepared.settings;job.fingerprint=prepared.fingerprint;job.summary=this.summary(prepared);this.transition(job,'PREVIEW_READY');return this.view(job);
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
 render(id){
  const job=this.get(id);if(job.state==='RENDERING'||job.state==='DONE')return this.view(job);
  if(!['PREVIEW_READY','FAILED'].includes(job.state)||!job.bundle)throw new Error('Job is not ready to render');
  const project=loadProject(this.profiles[job.profileId]),prepared=prepareProject(project,job.settings);
  if(prepared.fingerprint!==job.fingerprint)throw new Error('Inputs or engine changed; create a new job');
  const lock=this.acquireLock(),attempt=(job.attempt??0)+1,relative='render-'+attempt,dir=join(this.dir(id),relative);
  try{
   mkdirSync(dir,{mode:0o700});job.attempt=attempt;job.output=relative+'/preview.mp4';delete job.error;job.cancelRequested=false;this.transition(job,'RENDERING');
   const fd=openSync(join(dir,'worker.log'),'wx',0o600),child=spawn('python3',[this.renderer,'--source',project.sourcePath,'--bundle',join(this.dir(id),job.bundle),'--out',join(dir,'preview.mp4')],{detached:true,stdio:['ignore',fd,fd]});closeSync(fd);this.children.set(id,child);
   if(child.pid)writeFileSync(lock,JSON.stringify({pid:child.pid,jobId:id}));
   const finish=(code,error)=>{
    if(!this.children.has(id))return;this.children.delete(id);try{unlinkSync(lock);}catch{}
    if(job.cancelRequested){job.error='Exportación cancelada';this.transition(job,'CANCELLED');}
    else if(code===0&&existsSync(join(dir,'preview.audit.json'))){this.transition(job,'DONE');}
    else{job.error=error?'No se pudo iniciar el worker':'Exportación fallida; consulta el registro local del trabajo';this.transition(job,'FAILED');}
   };
   child.once('error',error=>finish(null,error));child.once('close',code=>finish(code));return this.view(job);
  }catch(error){try{unlinkSync(lock);}catch{}if(job.state==='RENDERING'){job.error=error.message;this.transition(job,'FAILED');}throw error;}
 }
 cancel(id){const job=this.get(id);if(job.state==='RENDERING'){
   const child=this.children.get(id);if(!child)throw new Error('Worker not owned by this server');job.cancelRequested=true;this.save(job);try{process.kill(-child.pid,'SIGTERM');}catch(e){if(e.code!=='ESRCH')throw e;}return this.view(job);
  }
  if(job.state!=='CANCELLED')this.transition(job,'CANCELLED');return this.view(job);
 }
 media(id){const job=this.get(id);if(job.state!=='DONE')throw new Error('Video not ready');return join(this.dir(id),job.output);}
 audit(id){const p=this.media(id);return JSON.parse(readFileSync(p.replace(/\.mp4$/,'.audit.json'),'utf8'));}
 async close(){const waits=[];for(const [id,child]of this.children){waits.push(new Promise(r=>child.once('close',r)));this.cancel(id);}await Promise.all(waits);if(this.storeLock){unlinkSync(this.storeLock);this.storeLock=null;}}
}
