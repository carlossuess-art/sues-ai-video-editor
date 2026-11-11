import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,rmSync,writeFileSync,readFileSync,chmodSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {stageMasterVfrProjectVersion} from '../src/master-director-vfr-stage.js';
const hash=x=>createHash('sha256').update(x).digest('hex');
function setup(){
 const dir=mkdtempSync(join(tmpdir(),'sues-vfr-stage-'));
 const staging=join(dir,'private'),sourcePath=join(dir,'source.mp4');
 mkdirSync(staging,{mode:0o700});writeFileSync(sourcePath,'derived-media-fixture');
 const derived=hash(readFileSync(sourcePath)),original='a'.repeat(64);
 const proposal={status:'SOURCE_VERSION_PROPOSED_NEW_APPROVAL_REQUIRED',canExecute:false,
  approvalsInvalidated:true,previousSourceSha256:original,newSourceSha256:derived,
  proposalFingerprint:'f'.repeat(64),visualEvidenceFingerprint:'e'.repeat(64),
  previousSourceDuration:1.018,newSourceDuration:31/30,
  projectConfig:{sourcePath,transcriptPath:join(dir,'transcript.json'),
   source:{sha256:derived,duration:31/30,width:1080,height:1920},
   sourceLineage:{schema:'sues-master-source-lineage/v1',originalSha256:original,derivedSha256:derived}}};
 const rebasedTranscript={status:'VFR_TRANSCRIPT_REBASED_NOT_APPROVED',canExecute:false,
  wordTimesUnchanged:true,previousDuration:1.018,
  transcript:{version:'1.0',language:'es',sourceDuration:31/30,words:[{text:'Hola',start:.1,end:.8}]}};
 return {dir,staging,sourcePath,proposal,rebasedTranscript};
}
test('phase 2: a distinct immutable private source version is staged and idempotent',()=>{
 const f=setup();
 try{
  const inputs={proposal:f.proposal,rebasedTranscript:f.rebasedTranscript,stagingDir:f.staging};
  const a=stageMasterVfrProjectVersion(inputs),b=stageMasterVfrProjectVersion(inputs);
  assert.equal(a.status,'SOURCE_VERSION_STAGED_REVIEW_REQUIRED',JSON.stringify(a));
  assert.equal(a.canExecute,false);assert.deepEqual(a.paths,b.paths);
  const profile=JSON.parse(readFileSync(a.paths.projectPath,'utf8'));
  assert.equal(profile.source.sha256,f.proposal.newSourceSha256);
  assert.equal(profile.transcriptPath,a.paths.transcriptPath);
  assert.equal(profile.sourceLineage.approvalInherited,undefined);
  assert.equal(profile.sourceLineage.provenanceProposalFingerprint,f.proposal.proposalFingerprint);
  assert.equal(JSON.parse(readFileSync(a.paths.recordPath,'utf8')).approved,false);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('phase 2: stage blocks modified media, unsafe folders and changed immutable record',()=>{
 const f=setup();
 try{
  const inputs={proposal:f.proposal,rebasedTranscript:f.rebasedTranscript,stagingDir:f.staging};
  writeFileSync(f.sourcePath,'modified');
  assert.equal(stageMasterVfrProjectVersion(inputs).issues[0].code,'VFR_VERSION_STAGE_MEDIA_CHANGED');
  writeFileSync(f.sourcePath,'derived-media-fixture');
  const ok=stageMasterVfrProjectVersion(inputs);
  assert.equal(ok.status,'SOURCE_VERSION_STAGED_REVIEW_REQUIRED');
  writeFileSync(ok.paths.recordPath,'malicious');
  assert.equal(stageMasterVfrProjectVersion(inputs).status,'BLOCKED');
  chmodSync(f.dir,0o755);
  assert.equal(stageMasterVfrProjectVersion({...inputs,stagingDir:f.dir}).status,'BLOCKED');
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
