import {mkdirSync,readdirSync,readFileSync,writeFileSync,existsSync,rmSync,lstatSync,openSync,closeSync,statSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {prepareProject,writePreparedBundle,fileSha256,RENDER_SCRIPT} from './local-pipeline.js';
const KEY=/^[a-f0-9]{64}$/;
export class AdjustmentPreviews{
 constructor(directory,jobs,{renderer=RENDER_SCRIPT,playbackBusy=()=>false}={}){
  this.directory=directory;this.jobs=jobs;this.renderer=renderer;this.playbackBusy=playbackBusy;this.tasks=new Map();this.running=null;this.closing=false;
  mkdirSync(directory,{recursive:true,mode:0o700});if(lstatSync(directory).isSymbolicLink())throw Error('Invalid adjustment preview directory');
  for(const key of readdirSync(directory).filter(n=>KEY.test(n))){
   try{const t=JSON.parse(readFileSync(join(directory,key,'state.json')));if(t.key!==key)continue;
    if(t.state==='RUNNING'){t.state='INTERRUPTED';t.error='La previsualización se interrumpió. Puedes solicitarla de nuevo.';}
    this.tasks.set(key,t);
   }catch{}
  }
 }
 save(t){writeFileSync(join(this.directory,t.key,'state.json'),JSON.stringify(t),{mode:0o600});}
 view(t){return {key:t.key,jobId:t.jobId,state:t.state,start:t.start,duration:t.duration,settingsFingerprint:t.settingsFingerprint,error:t.error??null,elapsedSeconds:Math.round(((t.finishedAt??Date.now())-t.createdAt)/100)/10,isFinalExport:false};}
 get(jobId,key){if(!KEY.test(key??'')||!this.tasks.has(key)||this.tasks.get(key).jobId!==jobId)throw Error('Preview not found');return this.tasks.get(key);}
 prune(){
  const candidates=[...this.tasks.values()].filter(t=>t.state!=='RUNNING').sort((a,b)=>a.createdAt-b.createdAt);
  while(candidates.length&&this.tasks.size>=4){const t=candidates.shift();rmSync(join(this.directory,t.key),{recursive:true,force:true});this.tasks.delete(t.key);}
 }
 start(jobId,request){
  if(this.closing||this.jobs.closing)throw Error('Preview worker closing');
  if(!request||Object.keys(request).some(k=>!['fingerprint','settings','start','duration'].includes(k)))throw Error('Preview request invalid');
  const job=this.jobs.get(jobId);if(job.state!=='DONE')throw Error('Espera a que termine el montaje.');
  if(request.fingerprint!==job.fingerprint)throw Error('El proyecto ha cambiado. Recarga la versión.');
  const project=this.jobs.loadProfile(job.profileId),prepared=prepareProject(project,request.settings);
  const outputDuration=prepared.plan.outputDuration??prepared.plan.duration;
  if(!Number.isFinite(request.start)||!Number.isFinite(request.duration)||request.start<0||request.duration<.5||request.duration>8||request.start>=outputDuration-.1)throw Error('Preview window invalid');
  const start=Math.floor(request.start*30)/30,duration=Math.min(Math.round(request.duration*30)/30,outputDuration-start);
  const key=createHash('sha256').update(JSON.stringify({jobId,settings:prepared.fingerprint,start,duration})).digest('hex');
  const cached=this.tasks.get(key);if(cached?.state==='READY'){this.media(jobId,key);return this.view(cached);}
  if(cached?.state==='RUNNING')return this.view(cached);
  if(this.running||this.playbackBusy()||this.jobs.posterBusy.size||this.jobs.children.size||this.jobs.queued().length||this.jobs.publishing.size)throw Error('Hay otro render activo. Espera antes de previsualizar.');
  this.prune();const directory=join(this.directory,key);
  if(existsSync(directory))rmSync(directory,{recursive:true,force:true});
  mkdirSync(directory,{mode:0o700});try{writePreparedBundle(project,prepared,join(directory,'bundle'));}catch(error){rmSync(directory,{recursive:true,force:true});throw error;}
  const t={key,jobId,state:'RUNNING',start,duration,settingsFingerprint:prepared.fingerprint,createdAt:Date.now()};
  this.tasks.set(key,t);this.save(t);this.jobs.previewBusy=true;
  const fd=openSync(join(directory,'worker.log'),'wx',0o600);
  let child;
  try{child=spawn('python3',[this.renderer,'--source',project.sourcePath,'--bundle',join(directory,'bundle'),'--out',join(directory,'fragment.mp4'),'--preview-start',String(start),'--preview-duration',String(duration)],{detached:true,stdio:['ignore',fd,fd]});}
  catch(e){closeSync(fd);this.jobs.previewBusy=false;t.state='FAILED';t.error=e.message;this.save(t);throw e;}
  closeSync(fd);
  const deadline=setTimeout(()=>{try{process.kill(-child.pid,'SIGKILL');}catch{}},900000);
  let settle;const done=new Promise(r=>{settle=r;});this.running={child,done,key};let finished=false;
  const complete=(code,error)=>{
   if(finished)return;finished=true;clearTimeout(deadline);
   try{
    if(code!==0||error)throw Error('No se pudo preparar el fragmento. La versión original y el borrador se conservan.');
    const path=join(directory,'fragment.mp4'),audit=JSON.parse(readFileSync(join(directory,'fragment.audit.json')));
    if(!audit.previewWindow||audit.isFinalExport!==false||audit.fullDecode!=='pass'||!audit.sourcePreserved||Math.abs(audit.durationEncoded-duration)>1/30+.002||audit.video.width!==540||audit.video.height!==960||audit.sourceSha256!==project.boundHashes.source||fileSha256(project.sourcePath)!==project.boundHashes.source||audit.outputSha256!==fileSha256(path))throw Error('Fragment verification failed');
    t.state='READY';t.sha256=audit.outputSha256;t.bytes=statSync(path).size;
   }catch(e){t.state=t.cancelRequested?'CANCELLED':'FAILED';t.error=t.cancelRequested?'Fragmento cancelado; el borrador y el montaje se conservan.':e.message;}
   t.finishedAt=Date.now();this.save(t);this.running=null;this.jobs.previewBusy=false;settle();this.jobs.drain();
  };
  child.once('error',e=>complete(null,e));child.once('close',code=>complete(code));return this.view(t);
 }
 cancel(jobId,key){const t=this.get(jobId,key);if(t.state==='RUNNING'&&this.running?.key===key){t.cancelRequested=true;try{process.kill(-this.running.child.pid,'SIGTERM');}catch{}}return this.view(t);}
 media(jobId,key){
  const t=this.get(jobId,key),path=join(this.directory,key,'fragment.mp4');
  if(t.state!=='READY'||!existsSync(path)||statSync(path).size!==t.bytes||fileSha256(path)!==t.sha256)throw Error('Preview not ready or changed');
  return path;
 }
 async close(){this.closing=true;const current=this.running;if(current){try{process.kill(-current.child.pid,'SIGTERM');}catch{}await current.done;}}
}
