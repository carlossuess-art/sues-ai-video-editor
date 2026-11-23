// Offline-only staging of a verified VFR derivative as a distinct editable
// project version. No live registry mutation, deployment, or plan approval.
import {mkdirSync,readFileSync,writeFileSync,lstatSync} from 'node:fs';
import {resolve,join,isAbsolute} from 'node:path';
import {createHash} from 'node:crypto';
import {fileSha256} from './local-pipeline.js';
const HASH=/^[a-f0-9]{64}$/;
const digest=s=>createHash('sha256').update(s).digest('hex');
const blocked=code=>({status:'BLOCKED',canExecute:false,issues:[{code}]});
function writeImmutable(path,content){
 try{writeFileSync(path,content,{flag:'wx',mode:0o600});}
 catch(e){if(e.code!=='EEXIST'||readFileSync(path,'utf8')!==content)throw e;}
}
export function stageMasterVfrProjectVersion({proposal,rebasedTranscript,stagingDir}={}){
 const c=proposal?.projectConfig,t=rebasedTranscript?.transcript;
 if(proposal?.status!=='SOURCE_VERSION_PROPOSED_NEW_APPROVAL_REQUIRED'||proposal.canExecute!==false||
   proposal.approvalsInvalidated!==true||!HASH.test(proposal.newSourceSha256??'')||
   !HASH.test(proposal.previousSourceSha256??'')||!HASH.test(proposal.proposalFingerprint??'')||
   !c||c.source?.sha256!==proposal.newSourceSha256||c.sourceLineage?.originalSha256!==proposal.previousSourceSha256||
   rebasedTranscript?.status!=='VFR_TRANSCRIPT_REBASED_NOT_APPROVED'||rebasedTranscript.canExecute!==false||
   rebasedTranscript.wordTimesUnchanged!==true||rebasedTranscript.previousDuration!==proposal.previousSourceDuration||
   t?.sourceDuration!==proposal.newSourceDuration||
   !isAbsolute(stagingDir??'')||!isAbsolute(c.sourcePath??'')||!isAbsolute(c.transcriptPath??''))
  return blocked('VFR_VERSION_STAGE_INPUT_INVALID');
 try{
  if(fileSha256(c.sourcePath)!==proposal.newSourceSha256)return blocked('VFR_VERSION_STAGE_MEDIA_CHANGED');
  // The destination must already exist and be a private work folder, not
  // a symlink. The caller controls where private work is permitted.
  const path=resolve(stagingDir),st=lstatSync(path);
  if(!st.isDirectory()||st.isSymbolicLink()||(st.mode&0o077)!==0)
   return blocked('VFR_VERSION_STAGE_DIRECTORY_UNSAFE');
  const identity=proposal.newSourceSha256,transcriptPath=join(path,identity+'.rebased-transcript.json');
  const rebasedBytes=JSON.stringify(t)+'\n',rebasedSha256=digest(rebasedBytes);
  writeImmutable(transcriptPath,rebasedBytes);
  const version={...structuredClone(c),transcriptPath,
   sourceLineage:{...structuredClone(c.sourceLineage),transcriptSha256:rebasedSha256,
    provenanceProposalFingerprint:proposal.proposalFingerprint}};
  const projectPath=join(path,identity+'.derived-project.json'),projectBytes=JSON.stringify(version)+'\n';
  writeImmutable(projectPath,projectBytes);
  const record={schema:'sues-master-source-version-record/v1',status:'STAGED_FOR_REVIEW_NOT_ACTIVE',
   previousSourceSha256:proposal.previousSourceSha256,derivedSourceSha256:identity,
   proposalFingerprint:proposal.proposalFingerprint,transcriptSha256:rebasedSha256,
   projectSha256:digest(projectBytes),visualEvidenceFingerprint:proposal.visualEvidenceFingerprint,
   originalPreserved:true,approved:false,canExecute:false};
  const recordPath=join(path,identity+'.source-version-record.json');
  writeImmutable(recordPath,JSON.stringify(record)+'\n');
  return {status:'SOURCE_VERSION_STAGED_REVIEW_REQUIRED',issues:[],canExecute:false,
   record,paths:{projectPath,transcriptPath,recordPath},requires:['REGISTER_SEPARATE_PROFILE',
    'REVIEW_SKILL_PLAN_AND_APPROVE','QA_CUTS_AND_AUDIO']};
 }catch{return blocked('VFR_VERSION_STAGE_FAILED');}
}
