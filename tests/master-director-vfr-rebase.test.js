import test from 'node:test';
import assert from 'node:assert/strict';
import {rebaseMasterVfrTranscript,inspectMasterVfrCatalog} from '../src/master-director-vfr-rebase.js';
const original='a'.repeat(64),derived='b'.repeat(64);
const proposal={status:'SOURCE_VERSION_PROPOSED_NEW_APPROVAL_REQUIRED',canExecute:false,
 approvalsInvalidated:true,previousSourceSha256:original,newSourceSha256:derived,
 previousSourceDuration:1.018,newSourceDuration:31/30};
const transcript={version:'1.0',language:'es',sourceDuration:1.018,words:[{text:'Hola',start:.1,end:.8}]};
test('phase 2: only source-clock tail changes and every spoken word remains untouched',()=>{
 const before=structuredClone(transcript);
 const result=rebaseMasterVfrTranscript({proposal,transcript,originalSourceSha256:original});
 assert.equal(result.status,'VFR_TRANSCRIPT_REBASED_NOT_APPROVED',JSON.stringify(result));
 assert.equal(result.canExecute,false);
 assert.equal(result.transcript.sourceDuration,31/30);
 assert.deepEqual(result.transcript.words,before.words);
 assert.deepEqual(transcript,before);
});
test('phase 2: inconsistent source provenance, cuts and stale catalog block',()=>{
 assert.equal(rebaseMasterVfrTranscript({proposal,transcript,originalSourceSha256:derived}).status,'BLOCKED');
 assert.equal(rebaseMasterVfrTranscript({proposal,transcript:{...transcript,sourceDuration:.7},originalSourceSha256:original}).status,'BLOCKED');
 assert.equal(inspectMasterVfrCatalog({proposal,catalog:{sourceSha256:original}}).status,'BLOCKED');
 const timeMap={sourceDuration:31/30,duration:31/30,spans:[{sourceIn:0,sourceOut:31/30,editIn:0,editOut:31/30}]};
 const ok=inspectMasterVfrCatalog({proposal,catalog:{sourceSha256:derived,
  sourceTimeMap:timeMap,duration:31/30,timelineFingerprint:'new'}}); 
 assert.equal(ok.status,'VFR_CATALOG_FRAME_ALIGNED_NEW_PLAN_REQUIRED',JSON.stringify(ok));
 assert.equal(ok.canExecute,false);
 assert.equal(inspectMasterVfrCatalog({proposal,catalog:{sourceSha256:derived,
  sourceTimeMap:{...timeMap,spans:[{sourceIn:0,sourceOut:1.018,editIn:0,editOut:1.018}]},
  duration:31/30}}).status,'BLOCKED');
});
