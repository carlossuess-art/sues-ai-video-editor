// Durable, private hybrid worker journal. A crash is NEVER permission to
// duplicate a native child or replay an unapproved render.
import {mkdirSync,lstatSync,existsSync,readFileSync,writeFileSync,renameSync,readdirSync,unlinkSync} from 'node:fs';
import {join} from 'node:path';
import {randomBytes} from 'node:crypto';
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const HASH=/^[a-f0-9]{64}$/;
const STATES=new Set(['RUNNING','READY','BLOCKED','FAILED','INTERRUPTED']);
const terminal=new Set(['READY','BLOCKED','FAILED','INTERRUPTED']);
export class MasterHybridRequests{
 constructor(jobDirectory){this.root=join(jobDirectory,'master-director','hybrid-runs');}
 path(requestId){if(!UUID.test(requestId??''))throw Error('Invalid hybrid request ID');return join(this.root,requestId+'.json');}
 get(requestId){
  const path=this.path(requestId);if(!existsSync(path))return null;
  const st=lstatSync(path);if(!st.isFile()||st.isSymbolicLink()||st.size<1||st.size>65536)throw Error('Invalid hybrid request file');
  const r=JSON.parse(readFileSync(path,'utf8'));
  if(r.schema!=='sues-master-hybrid-run/v1'||r.requestId!==requestId||
     !HASH.test(r.revision??'')||!HASH.test(r.decisionId??'')||!STATES.has(r.status)||
     (r.childId!==undefined&&!UUID.test(r.childId))||
     (r.previewId!==undefined&&!UUID.test(r.previewId))||(r.quality!==undefined&&!['preview','full-hd'].includes(r.quality)))throw Error('Invalid hybrid request record');
  return r;
 }
 create({requestId,revision,decisionId,quality='preview'}){
  if(!HASH.test(revision??'')||!HASH.test(decisionId??'')||!['preview','full-hd'].includes(quality))throw Error('Invalid hybrid approval');
  const path=this.path(requestId);mkdirSync(this.root,{recursive:true,mode:0o700});
  if(lstatSync(this.root).isSymbolicLink())throw Error('Unsafe hybrid journal');
  const record={schema:'sues-master-hybrid-run/v1',requestId,revision,decisionId,quality,status:'RUNNING',step:'NATIVE_STAGE',
   createdAt:new Date().toISOString(),final:false};
  writeFileSync(path,JSON.stringify(record),{flag:'wx',mode:0o600});return record;
 }
 save(record){
  const old=this.get(record.requestId);
  if(!old||old.revision!==record.revision||old.decisionId!==record.decisionId||(old.quality??'preview')!==(record.quality??'preview')||
     terminal.has(old.status)||!STATES.has(record.status)||record.final!==false)throw Error('Hybrid run changed or terminal');
  if(old.childId&&old.childId!==record.childId)throw Error('Native child identity changed');
  if(JSON.stringify(record).length>60000)throw Error('Hybrid record too large');
  const tmp=join(this.root,'.hybrid-'+randomBytes(12).toString('hex'));
  try{writeFileSync(tmp,JSON.stringify(record),{flag:'wx',mode:0o600});renameSync(tmp,this.path(record.requestId));}
  finally{if(existsSync(tmp))try{unlinkSync(tmp)}catch{}}
  return record;
 }
 records(){
  if(!existsSync(this.root))return [];
  const names=readdirSync(this.root);if(names.length>1000)throw Error('Hybrid request limit');
  return names.filter(n=>/^[a-f0-9-]{36}\.json$/.test(n)).map(n=>this.get(n.slice(0,-5)));
 }
 hasInterrupted(){return this.records().some(r=>r.status==='INTERRUPTED');}
}
