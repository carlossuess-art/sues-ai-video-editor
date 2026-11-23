/** Private, filesystem-backed, one-use approval and append-only audit ledger.
 * The SUES host is responsible for authenticating the human/session before grant.
 * No public API and no automatic edit approval is provided by this module.
 */
import {mkdirSync,openSync,writeSync,closeSync,readFileSync,statSync,fsyncSync,lstatSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createHash,randomBytes} from 'node:crypto';
const ID=/^p_[a-zA-Z0-9_-]{2,96}$/;
const CLIP=/^[a-zA-Z0-9_-]{1,100}$/;
const ACTOR=/^[a-zA-Z0-9@._-]{3,100}$/;
const refOf=r=>createHash('sha256').update(JSON.stringify([r.actor,r.projectId,r.revision,r.clipId,r.x,r.y,r.scale,r.planProof??null])).digest('hex');
const SHA=/^[a-f0-9]{64}$/;
const batchKeys=['actor','projectId','storyRevision','decisionId','planFingerprint','projectFingerprint','nativeFingerprint','requestFingerprint','baseRevision'];
const validBatchProof=p=>p&&Object.keys(p).length===batchKeys.length&&batchKeys.every(k=>Object.hasOwn(p,k))&&ACTOR.test(p.actor??'')&&ID.test(p.projectId??'')&&Number.isInteger(p.baseRevision)&&p.baseRevision>=0&&batchKeys.slice(2,8).every(k=>SHA.test(p[k]??''));
const batchRef=p=>createHash('sha256').update(JSON.stringify(batchKeys.map(k=>p[k]))).digest('hex');
export class DirectorApprovalLedger{
 constructor({directory,now=Date.now,ttlMs=300000}={}){
  if(typeof directory!=='string'||!directory.startsWith('/')||!Number.isInteger(ttlMs)||ttlMs<1000||ttlMs>600000)throw Error('Private absolute ledger directory and bounded TTL required');
  this.directory=resolve(directory);mkdirSync(this.directory,{recursive:true,mode:0o700});
  if(!lstatSync(this.directory).isDirectory()||lstatSync(this.directory).isSymbolicLink())throw Error('Unsafe approval ledger directory');
  this.now=now;this.ttlMs=ttlMs;
 }
 /** Must be called only by trusted host after authenticating a human confirmation. */
 issue(request,{verifiedHumanSession=false}={}){
  if(verifiedHumanSession!==true)throw Error('Verified human approval required');
  if(!request||!ACTOR.test(request.actor||'')||!ID.test(request.projectId||'')||!CLIP.test(request.clipId||'')||
    !Number.isInteger(request.revision)||request.revision<0||![request.x,request.y,request.scale].every(Number.isFinite))
    throw Error('Approval must specify an exact native transform');
  const id='a_'+randomBytes(16).toString('hex'),record={schema:'sues-director-approval/v1',approvalId:id,requestHash:refOf(request),
    actor:request.actor,projectId:request.projectId,clipId:request.clipId,revision:request.revision,planProof:request.planProof??null,
    createdAt:this.now(),expiresAt:this.now()+this.ttlMs};
  const path=join(this.directory,id+'.json'),fd=openSync(path,'wx',0o600);
  try{writeSync(fd,JSON.stringify(record)+'\n');fsyncSync(fd);}finally{closeSync(fd);}
  return {approvalId:id,expiresAt:record.expiresAt};
 }
 /** Atomic one-time claim; never allows same approval reused after crash/conflict. */
 consume(request){
  if(!request||typeof request.approvalId!=='string'||!/^a_[a-f0-9]{32}$/.test(request.approvalId))return false;
  const path=join(this.directory,request.approvalId+'.json');let record;
  try{const st=statSync(path);if(!st.isFile()||st.size>2048)return false;record=JSON.parse(readFileSync(path,'utf8'));}catch{return false;}
  if(record.schema!=='sues-director-approval/v1'||record.approvalId!==request.approvalId||
    record.expiresAt<=this.now()||record.createdAt>this.now()||record.expiresAt-record.createdAt>600000||
    record.requestHash!==refOf(request)||record.projectId!==request.projectId||record.actor!==request.actor)return false;
  let fd;try{fd=openSync(join(this.directory,request.approvalId+'.claimed'),'wx',0o600);writeSync(fd,JSON.stringify({at:this.now(),id:request.approvalId})+'\n');fsyncSync(fd);return true;}catch{return false;}finally{if(fd!==undefined)closeSync(fd);}
 }
 /** Batch authorization binds the exact approved story and native revision.
  * Separate record schema; shares one-use claim and durable audit directory. */
 issueBatch(proof,{verifiedHumanSession=false}={}){
  if(verifiedHumanSession!==true||!validBatchProof(proof))throw Error('Verified exact batch approval required');
  const approvalId='a_'+randomBytes(16).toString('hex'),record={schema:'sues-director-batch-approval/v1',approvalId,requestHash:batchRef(proof),actor:proof.actor,projectId:proof.projectId,createdAt:this.now(),expiresAt:this.now()+this.ttlMs};
  const fd=openSync(join(this.directory,approvalId+'.json'),'wx',0o600);
  try{writeSync(fd,JSON.stringify(record)+'\n');fsyncSync(fd);}finally{closeSync(fd);}
  return {approvalId,expiresAt:record.expiresAt};
 }
 consumeBatch(proof,approvalId){
  if(!validBatchProof(proof)||!/^a_[a-f0-9]{32}$/.test(approvalId??''))return false;
  let r;try{const f=join(this.directory,approvalId+'.json'),st=lstatSync(f);if(!st.isFile()||st.isSymbolicLink()||st.size>2048)return false;r=JSON.parse(readFileSync(f,'utf8'));}catch{return false}
  if(r.schema!=='sues-director-batch-approval/v1'||r.approvalId!==approvalId||r.requestHash!==batchRef(proof)||r.actor!==proof.actor||r.projectId!==proof.projectId||r.expiresAt<=this.now()||r.createdAt>this.now()||r.expiresAt-r.createdAt>600000)return false;
  let fd;try{fd=openSync(join(this.directory,approvalId+'.claimed'),'wx',0o600);writeSync(fd,JSON.stringify({id:approvalId,at:this.now()})+'\n');fsyncSync(fd);return true}catch{return false}finally{if(fd!==undefined)closeSync(fd)}
 }
 /** Preserve exact per-operation receipts and an immutable private undo snapshot. */
 recordBatchResult(approvalId,proof,result){
  if(!validBatchProof(proof)||!/^a_[a-f0-9]{32}$/.test(approvalId??'')||result?.revision!==proof.baseRevision+1||!Array.isArray(result.receipts)||!result.undo)throw Error('Invalid batch result');
  const record=JSON.parse(readFileSync(join(this.directory,approvalId+'.json'),'utf8'));
  if(record.schema!=='sues-director-batch-approval/v1'||record.requestHash!==batchRef(proof))throw Error('Batch result proof mismatch');
  const content=JSON.stringify({schema:'sues-director-batch-result/v1',approvalId,proof,result,at:this.now()})+'\n';
  const fd=openSync(join(this.directory,approvalId+'.result.json'),'wx',0o600);
  try{writeSync(fd,content);fsyncSync(fd);}finally{closeSync(fd)}
 }
 /** Fail-closed revocation. Competes atomically with consume() for the same claim.
  * The trusted caller must authenticate the actor and own the request context.
  */
 revoke({approvalId,actor}={}){
  if(typeof approvalId!=='string'||!/^a_[a-f0-9]{32}$/.test(approvalId)||!ACTOR.test(actor||''))return false;
  let record;try{
   const path=join(this.directory,approvalId+'.json'),st=lstatSync(path);
   if(!st.isFile()||st.isSymbolicLink()||st.size>2048)return false;
   record=JSON.parse(readFileSync(path,'utf8'));
  }catch{return false;}
  if(!['sues-director-approval/v1','sues-director-batch-approval/v1'].includes(record.schema)||record.approvalId!==approvalId||record.actor!==actor)return false;
  let fd;try{
   fd=openSync(join(this.directory,approvalId+'.claimed'),'wx',0o600);
   writeSync(fd,JSON.stringify({at:this.now(),id:approvalId,reason:'revoked'})+'\n');
   fsyncSync(fd);return true;
  }catch{return false;}finally{if(fd!==undefined)closeSync(fd);}
 }
 /** Each event has a durable append; failure stops dispatch before the native edit. */
 audit(event){
  if(!event||event.schema!=='sues-director-mcp-dispatch/v1'||typeof event.stage!=='string'||event.stage.length>80||
     typeof event.approvalId!=='string'||!/^a_[a-f0-9]{32}$/.test(event.approvalId))throw Error('Invalid native MCP audit event');
  const serialized=JSON.stringify({...event,at:this.now()})+'\n';if(Buffer.byteLength(serialized)>4096)throw Error('Audit event too large');
  const fd=openSync(join(this.directory,'dispatch-audit.jsonl'),'a',0o600);
  try{writeSync(fd,serialized);fsyncSync(fd);}finally{closeSync(fd);}
 }
}
