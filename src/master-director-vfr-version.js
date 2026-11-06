// Explicit, reversible project-version proposal for a VFR-to-CFR derivative.
// The result is NOT an activation, approval or edit of the original project.
import {readFileSync} from 'node:fs';
import {resolve,isAbsolute} from 'node:path';
import {createHash} from 'node:crypto';
import {reviewMasterVfrDerivationEvidence} from './master-director-vfr-lineage.js';

const HASH=/^[a-f0-9]{64}$/;
const fail=(code)=>({status:'BLOCKED',canExecute:false,issues:[{code}]});
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?
 Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const digest=x=>createHash('sha256').update(JSON.stringify(canonical(x))).digest('hex');

export function proposeMasterVfrSourceVersion({projectConfig,originalPath,derivedPath,visualPath,audioPath,cfrPath}={}){
 if(!projectConfig||typeof projectConfig!=='object'||Array.isArray(projectConfig)||
    ![originalPath,derivedPath,visualPath,audioPath,cfrPath].every(p=>typeof p==='string'&&isAbsolute(p))||
    !HASH.test(projectConfig.source?.sha256??'')||!Number.isFinite(projectConfig.source?.duration)||
    !Number.isInteger(projectConfig.source?.width)||!Number.isInteger(projectConfig.source?.height))
  return fail('VFR_VERSION_INPUT_INVALID');
 // This workflow never silently replaces an already derived source. The
 // caller must provide the project that truly owns the original hash.
 const currentSource=projectConfig.source?.sha256;
 const evidence=reviewMasterVfrDerivationEvidence({originalPath,derivedPath,visualPath,audioPath,cfrPath});
 if(evidence.status!=='DERIVATION_EVIDENCE_READY_REVIEW_REQUIRED')return evidence;
 if(currentSource!==evidence.originalSha256||
    projectConfig.source.width!==1080||projectConfig.source.height!==1920)
  return fail('VFR_VERSION_ORIGINAL_PROJECT_MISMATCH');
 // Source durations differ slightly because CFR 30 has a discrete frame
 // clock. A significant drift needs a real transcript/audio retime, not a
 // metadata patch.
 const delta=evidence.derivedDuration-projectConfig.source.duration;
 if(Math.abs(delta)>1/30+.000001)return fail('VFR_VERSION_RETIME_REQUIRED');
 const manifest=JSON.parse(readFileSync(visualPath,'utf8'));
 // Mapping is the measured FFmpeg correspondence, not the preliminary
 // "last preceding" source sampling proposal.
 if(manifest.targetFrames!==evidence.derivedFrameCount||
    manifest.mapping.at(-1)>=evidence.sourceFrameCount)return fail('VFR_VERSION_MAPPING_INVALID');
 const revised={...structuredClone(projectConfig),
  source:{...structuredClone(projectConfig.source),sha256:evidence.derivedSha256,duration:evidence.derivedDuration},
  sourcePath:resolve(derivedPath),
  sourceLineage:{schema:'sues-master-source-lineage/v1',type:'cfr30-derived-from-vfr',
   originalSha256:evidence.originalSha256,derivedSha256:evidence.derivedSha256,
   originalDuration:projectConfig.source.duration,derivedDuration:evidence.derivedDuration,
   sourceFrameCount:evidence.sourceFrameCount,derivedFrameCount:evidence.derivedFrameCount,
   visualEvidenceFingerprint:evidence.visualEvidenceFingerprint,
   originalPreserved:true,approvalInherited:false}};
 // The new project identity forces a new external catalog fingerprint and
 // new master-plan sourceSha256. Old approvals MUST NOT follow the derivative.
 const proposal={schema:'sues-master-source-version-proposal/v1',status:'SOURCE_VERSION_PROPOSED_NEW_APPROVAL_REQUIRED',
  previousSourceSha256:evidence.originalSha256,newSourceSha256:evidence.derivedSha256,
  previousSourceDuration:projectConfig.source.duration,newSourceDuration:evidence.derivedDuration,
  durationDeltaSeconds:Math.round(delta*1e6)/1e6,derivedFrames:evidence.derivedFrameCount,
  sampledSourceFrames:evidence.sourceFrameCount,visualEvidenceFingerprint:evidence.visualEvidenceFingerprint,
  sourceVersion:revised.sourceLineage,
  approvalsInvalidated:true,sourceTimeMapMustBeRecomputed:true,
  transcriptTimesPreservedUntilHumanQA:true,canExecute:false,
  next:['CREATE_SEPARATE_EDITABLE_PROJECT_VERSION','REBUILD_SOURCE_TIME_MAP','REVIEW_NEW_MASTER_PLAN',
   'RECORD_NEW_APPROVAL','LISTEN_AND_REVIEW_CUT_BOUNDARIES']};
 return {...proposal,proposalFingerprint:digest(proposal),projectConfig:revised,issues:[]};
}
