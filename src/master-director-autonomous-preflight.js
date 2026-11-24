// SUES Film Director -> Master Director: fail-closed production gate.
// Pure check; caller MUST resolve evidence from trusted server-side records.
// No autoapproval, editor write, asset registration or publication.
import {createHash} from 'node:crypto';
import {inspectMasterDirectorStory} from './master-director-story.js';
const SHA=/^[a-f0-9]{64}$/,ID=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/;
const valid=x=>typeof x==='string'&&x.trim().length>0;
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const note=(issues,code,subject='preproduction')=>issues.push({code,subject});

export function reviewAutonomousPreproduction({story,registry={},project={},evidence={}}={}){
 const issues=[];
 const check=inspectMasterDirectorStory(story,registry);
 issues.push(...(check.issues??[]));
 if(check.status==='NEEDS_RESOURCES')for(const a of check.assetRequests??[])note(issues,'CRITICAL_RESOURCE_NOT_RESOLVED',a.id);
 if(story?.schema!=='sues-master-story/v1')return {status:'PREPRODUCTION_BLOCKED',canExecute:false,issues};
 const fp=hash(story),sha=story.sourceSha256??'',t=story.timeline??{};
 if(!/^p_[A-Za-z0-9_-]{2,96}$/.test(project.projectId??'')||
    !Number.isInteger(project.revision)||project.revision<0||
    project.sourceSha256!==sha||project.timelineFingerprint!==t.fingerprint||
    evidence.projectId!==project.projectId||evidence.projectRevision!==project.revision)
   note(issues,'PROJECT_OR_SOURCE_STALE');
 const d=evidence.director??{};
 if(!valid(d.version)||d.loadedCompleteRules!==true||!SHA.test(d.rulesFingerprint??'')||
    !Array.isArray(d.references)||d.references.length<8||
    !d.references.every(x=>valid(x.id)&&SHA.test(x.sha256??'')))
   note(issues,'FILM_DIRECTOR_TRAINING_NOT_PROVEN');
 const media=evidence.sourceAnalysis??{};
 if(media.sha256!==sha||media.transcriptWordTimesVerified!==true||
    media.videoFramesInspected!==true||media.faceAndHandsAnalyzed!==true||
    !Array.isArray(media.inspectedIntervals)||!media.inspectedIntervals.length)
   note(issues,'REAL_AV_ANALYSIS_MISSING');
 const human=evidence.humanAvPlan??{},technical=evidence.technicalPlan??{};
 const ids=(story.operations??[]).map(x=>x.id),approved=evidence.wordSelection??{};
 if(human.fingerprint!==fp||technical.fingerprint!==fp||
    human.complete!==true||technical.complete!==true||
    !Array.isArray(human.operationIds)||!Array.isArray(technical.operationIds)||
    human.operationIds.length!==ids.length||technical.operationIds.length!==ids.length||
    !ids.every(id=>human.operationIds.includes(id)&&technical.operationIds.includes(id))||
    !['APPROVED_EXISTING','CONFIRMED_FOR_REEL'].includes(approved.status)||
    !SHA.test(approved.selectionFingerprint??''))
   note(issues,'PLAN_COVERAGE_OR_WORD_SELECTION_MISSING');
 const assetProof=evidence.assets??{};
 for(const r of story.resources??[]){
  const resolved=check.resolvedAssets?.[r.id];
  if(!resolved)continue;
  const a=assetProof[r.id];
  if(!a||a.resourceId!==r.id||a.assetId!==resolved.assetId||
     a.sha256!==resolved.sha256||a.projectId!==project.projectId||
     !valid(a.fablecutMediaId)||a.registeredInProject!==true||
     a.physicalShaVerified!==true||a.nativeDecodeVerified!==true||
     a.visualContentVerified!==true||a.rightsVerified!==true||
     !Array.isArray(project.media)||!project.media.some(m=>m?.id===a.fablecutMediaId))
    note(issues,'FABLECUT_MEDIA_NOT_READY',r.id);
 }
 const masks=evidence.masks??{};
 for(const op of story.operations??[]){
  const isMask=/(mask|matte|roto|occlusion)/i.test(op.effect??'')||
    ['set_mask','set_matte'].includes(op.parameters?.command?.action);
  if(!isMask)continue;
  const p=masks[op.id];
  if(!p||p.operationId!==op.id||p.sourceSha256!==sha||
     p.projectId!==project.projectId||p.verifiedOnOriginal!==true||
     p.noFaceOrHandOcclusion!==true||p.alphaAndFeatherVerified!==true||
     !Array.isArray(p.samples)||p.samples.length<3||
     !p.samples.every(x=>Number.isFinite(x.time)&&valid(x.evidenceRef))||
     ![op.start,(op.start+op.end)/2,op.end-1/(t.fps||30)].every(time=>
       p.samples.some(x=>Math.abs(x.time-time)<=1/(t.fps||30)+1e-6)))
    note(issues,'SUBJECT_MASK_VISUAL_PROOF_MISSING',op.id);
 }
 const preflight=evidence.preflight??{};
 if(preflight.creative?.status!=='PASS'||preflight.technical?.status!=='PASS'||
    !valid(preflight.creative.evidenceRef)||!valid(preflight.technical.evidenceRef))
   note(issues,'DOUBLE_PREFLIGHT_MISSING');
 const mapping=evidence.nativeMapping??{};
 if(mapping.fingerprint!==fp||mapping.projectId!==project.projectId||
    mapping.supported===false||!Array.isArray(mapping.operationIds)||
    mapping.operationIds.length!==ids.length||!ids.every(id=>mapping.operationIds.includes(id)))
   note(issues,'EXECUTABLE_MAPPING_NOT_COMPLETE');
 return {schema:'sues-autonomous-preflight/v1',status:issues.length?'PREPRODUCTION_BLOCKED':'PREPRODUCTION_READY_NOT_APPROVED',
  canExecute:false,canPlanBatches:issues.length===0,storyFingerprint:fp,projectId:project.projectId,
  projectRevision:project.revision,issues};
}
