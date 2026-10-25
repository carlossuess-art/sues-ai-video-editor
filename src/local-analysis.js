// Private disk mailbox for the separately sandboxed, offline Whisper worker.
import {mkdirSync,readFileSync,writeFileSync,renameSync,existsSync,lstatSync} from 'node:fs';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
const HASH=/^[a-f0-9]{64}$/;
const read=p=>JSON.parse(readFileSync(p,'utf8'));
function atomic(path,data){const tmp=path+'.'+randomUUID()+'.tmp';writeFileSync(tmp,JSON.stringify(data),{mode:0o600,flag:'wx'});renameSync(tmp,path);}
export class LocalAnalysis{
 constructor(intake){this.intake=intake;this.directory=join(intake.directory,'asr');mkdirSync(this.directory,{recursive:true,mode:0o700});if(lstatSync(this.directory).isSymbolicLink())throw Error('Invalid analysis directory');}
 available(){try{const h=read(join(this.directory,'worker.json'));return h.engine==='faster-whisper-base-int8'&&Date.now()-h.at>=-5000&&Date.now()-h.at<90000;}catch{return false;}}
 status(id){
  if(!HASH.test(id)||!this.intake.records().some(r=>r.sha256===id))throw Error('Upload not found');
  const path=join(this.directory,id+'.status.json');let state=existsSync(path)?read(path):{state:'IDLE'};
  if(state.state==='COMPLETE'){
   const entry=this.intake.list().find(u=>u.id===id);
   if(entry.state!=='READY'){
    try{const result=join(this.directory,id+'.result.json');if(lstatSync(result).size>2*1024*1024)throw Error('Analysis too large');this.intake.importAnalysis(id,read(result));}
    catch{state={state:'FAILED',error:'No se ha podido validar el análisis. El vídeo y el encargo se conservan.'};atomic(path,state);}
   }
  }
  return {...state,available:this.available(),...(state.state==='COMPLETE'?{upload:this.intake.list().find(u=>u.id===id)}:{})};
 }
 request(id){
  const state=this.status(id);if(['QUEUED','RUNNING','COMPLETE'].includes(state.state))return state;
  const record=this.intake.records().find(r=>r.sha256===id);
  if(record.profileId)throw Error('Analysis already ready');
  if(state.state==='FAILED'){
   try{this.intake.media(id);const path=join(this.directory,id+'.result.json'),st=lstatSync(path);if(!st.isFile()||st.isSymbolicLink()||st.size>2*1024*1024)throw Error('Unsafe retained analysis');const data=read(path);if(data.sourceSha256!==id)throw Error('Source binding');this.intake.importAnalysis(id,data);
    atomic(join(this.directory,id+'.status.json'),{state:'COMPLETE',finishedAt:Date.now(),engine:data.transcript.provenance?.engine??'retained-analysis',wordCount:data.transcript.words.length,language:data.transcript.language,visionMethod:data.vision.method,visionCoverage:data.vision.coverage,reusedValidatedResult:true,externalCostUSD:0});return this.status(id);
   }catch{/* Invalid retained results follow the ordinary bounded worker path. */}
  }
  if(!this.available())throw Error('El transcriptor local no está disponible. Tu vídeo y el prompt siguen guardados.');
  this.intake.media(id); // Verify the actual original, not just its metadata.
  atomic(join(this.directory,id+'.status.json'),{state:'QUEUED',queuedAt:Date.now()});
  atomic(join(this.directory,id+'.request.json'),{sourceSha256:id,source:record.source});
  return this.status(id);
 }
}
