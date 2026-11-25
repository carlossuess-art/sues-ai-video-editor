// Private administrator-provisioned delegation; no HTTP endpoint, no human-session flag.
import {lstatSync,readFileSync,openSync,writeSync,fsyncSync,closeSync,constants} from 'node:fs';
import {join,dirname} from 'node:path';
import {createHash} from 'node:crypto';
const sha=x=>createHash('sha256').update(x).digest('hex');
const hash=x=>sha(JSON.stringify(x));
const root='/opt/sues-ingest-20261125-095821';
const projectId='p_09711868a5',actor='sues-delegated-director';
const source='/var/lib/sues-v11-preview/media/SUES_20261125_095821_original.mp4';
const selected=join(root,'keywords-user-confirmed.json');
const dir=join(root,'delegated-authority');
function privateJson(p){
 for(let d=dirname(p);d!=='/';d=dirname(d)){
  const s=lstatSync(d);
  if(!s.isDirectory()||s.isSymbolicLink()||s.uid!==0||(s.mode&0o022))throw Error('UNSAFE_DELEGATION_DIRECTORY');
 }
 const fd=openSync(p,constants.O_RDONLY|constants.O_NOFOLLOW);
 try{const s=lstatSync(p);if(!s.isFile()||s.uid!==0||(s.mode&0o077)||s.size>32768)throw Error('UNSAFE_DELEGATION_FILE');return JSON.parse(readFileSync(fd,'utf8'))}finally{closeSync(fd)}
}
function scope(){
 const s=privateJson(join(dir,'scope.json'));
 if(s.schema!=='sues-mobile-delegation/v1'||s.projectId!==projectId||s.actor!==actor||
 s.purpose!=='edit-existing-reel-only'||s.publication!==false||s.spend!==false||
 !Number.isFinite(s.expiresAt)||Date.now()>=s.expiresAt||
 s.expiresAt-s.createdAt>86400000||s.createdAt>Date.now()||
 s.selectionSha256!==sha(readFileSync(selected))||s.sourceSha256!==sha(readFileSync(source)))throw Error('DELEGATION_INVALID_OR_EXPIRED');
 return s;
}
function check(p,s){
 if(p.actor!==actor||p.projectId!==projectId||!Number.isInteger(p.baseRevision)||p.baseRevision<s.baseRevision||
 !['storyRevision','decisionId','planFingerprint','projectFingerprint','nativeFingerprint','requestFingerprint'].every(k=>/^[a-f0-9]{64}$/.test(p[k]??'')))throw Error('DELEGATION_PROOF_SCOPE_MISMATCH');
}
export function createMobileDelegatedAuthority(){
 if(process.getuid?.()!==0)throw Error('PRIVATE_ADMIN_HOST_REQUIRED');
 return Object.freeze({
  projectAllowed(id){try{return id===scope().projectId}catch{return false}},
  seal(proof,story,request){
   const s=scope();check(proof,s);
   if(story.sourceSha256!==s.sourceSha256||hash(story)!==proof.storyRevision||
   hash(request)!==proof.requestFingerprint||request.baseRevision!==proof.baseRevision||
   request.baseFingerprint!==proof.nativeFingerprint||!Array.isArray(request.commands)||
   !request.commands.length||request.commands.length>100)throw Error('DELEGATION_SEAL_MISMATCH');
   const record={schema:'sues-delegated-exact-proof/v1',scopeHash:hash(s),proof};
   const file=join(dir,hash(proof)+'.json');
   try{const fd=openSync(file,'wx',0o600);try{writeSync(fd,JSON.stringify(record));fsyncSync(fd)}finally{closeSync(fd)}}
   catch(e){if(e.code!=='EEXIST'||hash(privateJson(file))!==hash(record))throw e}
   return hash(record);
  },
  verify(proof){
   try{const s=scope();check(proof,s);const r=privateJson(join(dir,hash(proof)+'.json'));
    return r.schema==='sues-delegated-exact-proof/v1'&&r.scopeHash===hash(s)&&hash(r.proof)===hash(proof)?hash(r):null;
   }catch{return null}
  }
 });
}
