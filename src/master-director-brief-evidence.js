// Immutable, review-only Film Director Markdown source. Never compiles a plan,
// grants rights, changes the active revision, or authorizes rendering.
import {createHash} from 'node:crypto';
import {mkdirSync,writeFileSync,readFileSync,readdirSync,lstatSync,existsSync} from 'node:fs';
import {join} from 'node:path';
const HASH=/^[a-f0-9]{64}$/, sha=x=>createHash('sha256').update(x).digest('hex');
const BLOCKED='SOURCE_BRIEF_NOT_AN_EXECUTABLE_PLAN';
const bad=code=>({status:'BLOCKED',code,approved:false,canExecute:false});
export function saveMasterSourceBrief(jobDirectory,{text,sourceSha256,originalSha256,timelineFingerprint}={}){
 if(typeof jobDirectory!=='string'||typeof text!=='string'||!text.trim()||
    Buffer.byteLength(text,'utf8')>60000||text.includes('\u0000')||
    !HASH.test(sourceSha256??'')||!HASH.test(originalSha256??'')||
    typeof timelineFingerprint!=='string'||!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/.test(timelineFingerprint))
  return bad('INVALID_SOURCE_BRIEF');
 if(!text.includes(originalSha256))return bad('ORIGINAL_SOURCE_NOT_DECLARED_IN_BRIEF');
 const root=join(jobDirectory,'master-director','source-briefs');
 mkdirSync(root,{recursive:true,mode:0o700});
 const report={schema:'sues-master-source-brief/v1',text,sourceSha256,originalSha256,timelineFingerprint,
  reviewStatus:BLOCKED,approved:false,canExecute:false};
 const raw=JSON.stringify(report),revision=sha(raw),filename=join(root,revision+'.json');
 if(!existsSync(filename)){
  if(readdirSync(root).length>=20)return bad('TOO_MANY_BRIEF_REVISIONS');
  try{writeFileSync(filename,raw,{mode:0o600,flag:'wx'});}catch(error){
   if(error.code!=='EEXIST')throw error;
  }
 }
 if(readFileSync(filename,'utf8')!==raw)throw Error('Source brief integrity failure');
 return {status:'STORED_REVIEW_ONLY',revision,sourceSha256,originalSha256,timelineFingerprint,
  reviewStatus:BLOCKED,approved:false,canExecute:false};
}
export function listMasterSourceBriefs(jobDirectory){
 const root=join(jobDirectory,'master-director','source-briefs');if(!existsSync(root))return [];
 const names=readdirSync(root);if(names.length>20)throw Error('Too many source briefs');
 return names.map(name=>{
  if(!/^[a-f0-9]{64}\.json$/.test(name))throw Error('Unexpected source brief file');
  const filename=join(root,name),stat=lstatSync(filename);
  if(!stat.isFile()||stat.isSymbolicLink()||stat.size>65000)throw Error('Invalid source brief file');
  const raw=readFileSync(filename,'utf8'),hash=sha(raw);
  if(name!==hash+'.json')throw Error('Source brief integrity failure');
  const item=JSON.parse(raw);
  if(item?.schema!=='sues-master-source-brief/v1'||item.reviewStatus!==BLOCKED||
     item.approved!==false||item.canExecute!==false||!HASH.test(item.sourceSha256??'')||
     !HASH.test(item.originalSha256??'')||typeof item.timelineFingerprint!=='string'||
     !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/.test(item.timelineFingerprint)||
     typeof item.text!=='string'||!item.text.includes(item.originalSha256))
    throw Error('Source brief content integrity failure');
  return {revision:hash,sourceSha256:item.sourceSha256,originalSha256:item.originalSha256,
   timelineFingerprint:item.timelineFingerprint,text:item.text,
   reviewStatus:BLOCKED,approved:false,canExecute:false};
 }).sort((a,b)=>a.revision.localeCompare(b.revision));
}
