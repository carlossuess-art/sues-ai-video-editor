// Timestamp-preserving transcript rebasing for an explicit CFR30 derivative.
// This extends only the final source clock by <one frame; it never retimes
// words, reconstructs voice, changes an original transcript or grants approval.
import {validateTranscript} from './transcript.js';
const HASH=/^[a-f0-9]{64}$/;
const fail=(code)=>({status:'BLOCKED',canExecute:false,issues:[{code}]});
export function rebaseMasterVfrTranscript({proposal,transcript,originalSourceSha256}={}){
 if(proposal?.status!=='SOURCE_VERSION_PROPOSED_NEW_APPROVAL_REQUIRED'||
    proposal.canExecute!==false||proposal.approvalsInvalidated!==true||
    !HASH.test(originalSourceSha256??'')||originalSourceSha256!==proposal.previousSourceSha256||
    !Number.isFinite(proposal.newSourceDuration)||!Number.isFinite(proposal.previousSourceDuration)||
    proposal.newSourceDuration<proposal.previousSourceDuration||
    proposal.newSourceDuration-proposal.previousSourceDuration>1/30+.000001)
  return fail('VFR_TRANSCRIPT_REBASE_SOURCE_INVALID');
 try{validateTranscript(transcript);}catch{return fail('VFR_TRANSCRIPT_INVALID');}
 if(Math.abs(transcript.sourceDuration-proposal.previousSourceDuration)>0.001||
    transcript.words.some(w=>w.end>proposal.newSourceDuration))
  return fail('VFR_TRANSCRIPT_TIME_IDENTITY_CHANGED');
 const rebased={...structuredClone(transcript),sourceDuration:proposal.newSourceDuration};
 return {status:'VFR_TRANSCRIPT_REBASED_NOT_APPROVED',canExecute:false,issues:[],
  transcript:rebased,wordTimesUnchanged:true,requiresNewPlanApproval:true,
  previousDuration:transcript.sourceDuration,newDuration:rebased.sourceDuration};
}
export function inspectMasterVfrCatalog({proposal,catalog}={}){
 if(proposal?.status!=='SOURCE_VERSION_PROPOSED_NEW_APPROVAL_REQUIRED'||
    catalog?.sourceSha256!==proposal.newSourceSha256||
    catalog?.sourceTimeMap?.sourceDuration!==proposal.newSourceDuration||
    !Number.isFinite(catalog.duration)||Math.abs(catalog.duration*30-Math.round(catalog.duration*30))>1e-5||
    !Array.isArray(catalog.sourceTimeMap.spans)||catalog.sourceTimeMap.spans.length<1||
    catalog.sourceTimeMap.spans.some(s=>[s.sourceIn,s.sourceOut,s.editIn,s.editOut].some(t=>Math.abs(t*30-Math.round(t*30))>1e-5))||
    Math.abs(catalog.sourceTimeMap.duration-catalog.duration)>1e-6)
  return fail('VFR_REBASED_CATALOG_NOT_FRAME_ALIGNED');
 return {status:'VFR_CATALOG_FRAME_ALIGNED_NEW_PLAN_REQUIRED',canExecute:false,issues:[],
  sourceSha256:catalog.sourceSha256,duration:catalog.duration,
  timelineFingerprint:catalog.timelineFingerprint,requiresNewApproval:true};
}
