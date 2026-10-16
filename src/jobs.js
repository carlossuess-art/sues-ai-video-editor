import {mkdirSync,writeFileSync,readFileSync,renameSync,openSync,closeSync,unlinkSync,existsSync} from 'node:fs';
import {join} from 'node:path';
export const STATES=['CREATED','UPLOADING','INGESTING','READY','SUBMITTING','RENDERING','DONE','FAILED','SUBMISSION_UNKNOWN','CLEANED'];
const transitions={CREATED:['UPLOADING'],UPLOADING:['INGESTING','FAILED'],INGESTING:['READY','FAILED'],READY:['SUBMITTING'],SUBMITTING:['RENDERING','SUBMISSION_UNKNOWN'],RENDERING:['DONE','FAILED'],DONE:['CLEANED'],FAILED:['CLEANED'],SUBMISSION_UNKNOWN:['RENDERING','CLEANED'],CLEANED:[]};
export class Jobs {
  constructor(dir){this.dir=dir;mkdirSync(dir,{recursive:true,mode:0o700});}
  file(){return join(this.dir,'job.json');}
  load(){return JSON.parse(readFileSync(this.file(),'utf8'));}
  save(j){j.updatedAt=new Date().toISOString();const tmp=join(this.dir,'job.tmp');writeFileSync(tmp,JSON.stringify(j,null,2),{mode:0o600});renameSync(tmp,this.file());return j;}
  create(){if(existsSync(this.file())) throw new Error('Job existente: usa resume o un directorio nuevo');return this.save({version:1,state:'CREATED',createdAt:new Date().toISOString(),cleanupDueAt:new Date(Date.now()+86400000).toISOString(),costUsd:0});}
  transition(j,state,patch={}){if(!transitions[j.state]?.includes(state)) throw new Error(`Transición inválida ${j.state} → ${state}`);return this.save({...j,...patch,state});}
  lock(){const p=join(this.dir,'.lock');const fd=openSync(p,'wx',0o600);writeFileSync(fd,String(process.pid));return ()=>{closeSync(fd);unlinkSync(p);};}
}
