// Durable state for asynchronous private previews. The request ID is a local,
// non-secret idempotency key and cannot contain a path.
import {mkdirSync,lstatSync,existsSync,readFileSync,writeFileSync,renameSync,readdirSync,unlinkSync} from 'node:fs';
import {join} from 'node:path';import {randomBytes} from 'node:crypto';
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const HASH=/^[a-f0-9]{64}$/;
export class MasterPreviewRequests{
 constructor(jobDirectory){this.root=join(jobDirectory,'master-director','requests');}
 path(id){if(!UUID.test(id??''))throw Error('Invalid preview request');return join(this.root,id+'.json');}
 get(id){const path=this.path(id);if(!existsSync(path))return null;const st=lstatSync(path);if(!st.isFile()||st.isSymbolicLink()||st.size>262144)throw Error('Invalid preview request file');
  const r=JSON.parse(readFileSync(path,'utf8'));if(r.schema!=='sues-master-preview-request/v1'||r.requestId!==id||!HASH.test(r.revision??'')||!HASH.test(r.decisionId??'')||!['RUNNING','READY','BLOCKED','FAILED','INTERRUPTED'].includes(r.status)||(r.quality!==undefined&&!['preview','full-hd'].includes(r.quality)))throw Error('Invalid preview request record');return r;}
 create({requestId,revision,decisionId,quality='preview'}){
  const path=this.path(requestId);if(!HASH.test(revision??'')||!HASH.test(decisionId??'')||!['preview','full-hd'].includes(quality))throw Error('Invalid preview decision');
  mkdirSync(this.root,{recursive:true,mode:0o700});if(lstatSync(this.root).isSymbolicLink())throw Error('Invalid preview request directory');
  const r={schema:'sues-master-preview-request/v1',requestId,revision,decisionId,quality,status:'RUNNING',createdAt:new Date().toISOString()};writeFileSync(path,JSON.stringify(r),{mode:0o600,flag:'wx'});return r;
 }
 save(record){
  const old=this.get(record.requestId);if(!old||old.revision!==record.revision||old.decisionId!==record.decisionId||(old.quality??'preview')!==(record.quality??'preview'))throw Error('Preview request changed');
  const tmp=join(this.root,'.request-'+randomBytes(12).toString('hex'));try{writeFileSync(tmp,JSON.stringify(record),{mode:0o600,flag:'wx'});renameSync(tmp,this.path(record.requestId));}finally{if(existsSync(tmp))try{unlinkSync(tmp)}catch{}}
 }
 records(){if(!existsSync(this.root))return [];const names=readdirSync(this.root);if(names.length>1000)throw Error('Preview request limit');return names.filter(n=>/^[a-f0-9-]{36}\.json$/.test(n)).map(n=>this.get(n.slice(0,-5)));}
 hasInterrupted(){return this.records().some(r=>r?.status==='INTERRUPTED');}
}
