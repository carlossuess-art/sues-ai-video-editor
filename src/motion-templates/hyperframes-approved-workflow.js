/**
 * SUES MASTER DIRECTOR -> HyperFrames -> FableCut, private one-use bridge.
 *
 * Uses the existing MasterDirectorProjectStore approval + DirectorApprovalLedger
 * batch claim. The proof requestFingerprint is *different* from native commands,
 * binding HF source, variables, operation, exact private project and revision.
 * Only private clones. All filesystem, render and MCP calls are trusted host
 * injections. Never advertises a finished Reel, audio QA or publishing.
 */
import {createHash} from 'node:crypto';
import {projectFingerprint} from '../engine-next/fablecut-command-batch.js';
import {verifyMasterHyperFramesOperation} from './hyperframes-master-binding.js';

const SHA=/^[a-f0-9]{64}$/;
const ID=/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,79}$/;
const PROJECT=/^p_[a-zA-Z0-9_-]{2,96}$/;
const check=(v,msg)=>{if(!v)throw Error(msg)};
const digest=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');

export function createApprovedHyperFramesWorkflow({
 ledger,resolveContext,readProject,renderHyperFrames,importFableCutMotion
}={}){
 check(ledger&&typeof ledger.issueBatch==='function'&&
  typeof ledger.consumeBatch==='function'&&typeof ledger.recordBatchResult==='function'&&
  [resolveContext,readProject,renderHyperFrames,importFableCutMotion].every(fn=>typeof fn==='function'),
  'TRUSTED_HYPERFRAMES_EXECUTION_HOST_REQUIRED');

 async function prepare({actor,projectId,storyRevision,decisionId,operationId}={}){
  check(/^[a-zA-Z0-9@._-]{3,100}$/.test(actor??'')&&PROJECT.test(projectId??'')&&
   [storyRevision,decisionId].every(x=>SHA.test(x??''))&&ID.test(operationId??''),
   'INVALID_MOTION_APPROVAL_REFERENCE');
  const context=await resolveContext(projectId);
  check(context?.privateClone===true&&context.nativeProjectId===projectId&&
   typeof context.loadPreflight==='function'&&
   context.store?.current&&context.store?.approved&&context.store?.readDraft&&
   context.hfSource?.verified===true&&SHA.test(context.hfSource.fingerprint??'')&&
   context.hfSource.renderable===true,
   'PRIVATE_HYPERFRAMES_SOURCE_AND_FABLECUT_CLONE_REQUIRED');
  check(context.store.current().revision===storyRevision,'MASTER_CURRENT_HEAD_CHANGED');
  const approval=await context.store.approved(storyRevision,decisionId);
  check(approval?.mode==='approve'&&approval.view?.status==='READY_FOR_CHOICE',
   'MASTER_CREATIVE_APPROVAL_REQUIRED');
  const story=context.store.readDraft(storyRevision);
  // One operation is the current supported autonomous unit. Mixed operation
  // execution requires a future atomic multi-engine orchestration contract.
  check(story.operations?.length===1&&story.operations[0]?.id===operationId&&
   story.operations[0]?.renderer==='hyperframes',
   'MULTI_ENGINE_STORY_CANNOT_BE_PARTIALLY_AUTO_EXECUTED');
  const operation=story.operations[0];
  const preflight=context.loadPreflight(operation.parameters?.preflightFingerprint);
  const validated=verifyMasterHyperFramesOperation(operation,preflight,{
   ...approval.registry,sourceSha256:story.sourceSha256,
   timelineFingerprint:story.timeline.fingerprint});
  check(validated.status==='READY_FOR_EDITOR_PREVIEW'&&
   preflight.sourceSha256===story.sourceSha256&&
   preflight.timelineFingerprint===story.timeline.fingerprint,
   'APPROVED_HF_MOTION_BINDING_STALE');
  const before=await readProject(projectId);
  check(before?.projectId===projectId&&before.privateClone===true&&
   before.data?.fps===30&&before.data.width===1080&&before.data.height===1920&&
   Number.isInteger(before.data.revision)&&before.data.revision>=0&&
   Array.isArray(before.data.media)&&Array.isArray(before.data.clips),
   'FABLECUT_PRIVATE_PROJECT_UNAVAILABLE');
  const nativeFingerprint=projectFingerprint(before.data);
  if(context.nativeFingerprint!==undefined)
   check(context.nativeFingerprint===nativeFingerprint,'FABLECUT_PROJECT_FINGERPRINT_CHANGED');
  const proof={
   actor,projectId,storyRevision,decisionId,
   planFingerprint:approval.view.fingerprint,
   projectFingerprint:approval.view.projectFingerprint,
   nativeFingerprint,
   requestFingerprint:digest({
    schema:'sues-hyperframes-motion-request/v1',
    operationId,preflightFingerprint:operation.parameters.preflightFingerprint,
    sourceSha256:story.sourceSha256,
    timelineFingerprint:story.timeline.fingerprint,
    variablesSha256:operation.parameters.variablesSha256,
    hfSourceFingerprint:context.hfSource.fingerprint,
    expectedStartFrame:preflight.scene.startFrame,
    expectedEndFrame:preflight.scene.endFrameExclusive
   }),
   baseRevision:before.data.revision
  };
  check(Object.keys(proof).length===9&&
   Object.values(proof).every((v,i)=>i===8?Number.isInteger(v):typeof v==='string'&&v.length>0),
   'INVALID_NARROW_MOTION_APPROVAL_PROOF');
  return {status:'PRIVATE_HF_MOTION_READY_FOR_ONE_USE_APPROVAL',proof,
   operation:structuredClone(operation),preflight,
   hfSource:structuredClone(context.hfSource),
   baselineProject:structuredClone(before.data),mayPublish:false};
 }
 return {
  async inspect(input){
   const p=await prepare(input);
   return {status:p.status,proof:p.proof,operationId:p.operation.id,
    scene:p.preflight.scene,rendered:false,creativeApproved:true,
    imported:false,mayPublish:false};
  },
  async issue(input,{verifiedHumanSession=false}={}){
   const p=await prepare(input);
   const token=ledger.issueBatch(p.proof,{verifiedHumanSession});
   return {...token,status:'HF_PRIVATE_ONE_USE_APPROVAL_ISSUED_NOT_EXECUTED',
    operationId:p.operation.id,proof:p.proof,mayPublish:false};
  },
  async execute(input){
   const p=await prepare(input);
   // Single-use claim BEFORE any work. A crash/timeout means reconciliation,
   // never retrying an ambiguous render or native patch with the same token.
   check(ledger.consumeBatch(p.proof,input.approvalId),
    'HF_APPROVAL_EXPIRED_USED_OR_CHANGED_NO_RETRY');
   const rendered=await renderHyperFrames({
    operation:p.operation,preflight:p.preflight,
    approvedStoryRevision:p.proof.storyRevision,
    approvedPlanFingerprint:p.proof.planFingerprint,
    source:p.hfSource
   });
   check(rendered?.status==='NATIVE_HYPERFRAMES_RENDER_VERIFIED'&&
    rendered.sourceFingerprint===p.hfSource.fingerprint&&
    rendered.variablesSha256===p.operation.parameters.variablesSha256&&
    SHA.test(rendered.outputSha256??'')&&
    rendered.frames===151&&rendered.fps===30&&
    rendered.width===1080&&rendered.height===1920&&
    rendered.audioStreams===0,
    'HYPERFRAMES_RENDER_OR_VARIABLE_PROOF_INVALID_DO_NOT_RETRY');
   const latest=await readProject(input.projectId);
   check(latest?.privateClone===true&&
    latest.projectId===input.projectId&&
    projectFingerprint(latest.data)===p.proof.nativeFingerprint&&
    latest.data.revision===p.proof.baseRevision,
    'FABLECUT_CAS_CHANGED_AFTER_HYPERFRAMES_RENDER_NO_RETRY');
   check(p.preflight.proposedPlanFingerprint===
    p.operation.parameters.motionFingerprint,'HF_PLAN_CHANGED');
   const imported=await importFableCutMotion({
    projectId:input.projectId,baselineProject:latest.data,
    operation:p.operation,preflight:p.preflight,rendered,
    expectedNativeFingerprint:p.proof.nativeFingerprint,
    approvalId:input.approvalId,scope:'PRIVATE_CLONE_QA_ONLY'
   });
   check(imported?.status==='PRIVATE_NATIVE_HF_MEDIA_COMMITTED'&&
    imported.revision===p.proof.baseRevision+1&&
    imported.operationId===p.operation.id&&
    imported.renderSha256===rendered.outputSha256&&
    imported.sourceFingerprint===p.hfSource.fingerprint&&
    SHA.test(imported.projectFingerprintAfter??'')&&
    imported.productionChanged===false&&
    imported.publicationAuthorized===false&&
    imported.undo&&Array.isArray(imported.receipts)&&
    imported.receipts.length===1&&
    imported.receipts[0].operationId===p.operation.id,
    'PRIVATE_FABLECUT_COMMIT_RESULT_UNCERTAIN_DO_NOT_RETRY');
   try{
    ledger.recordBatchResult(input.approvalId,p.proof,{
     revision:imported.revision,receipts:imported.receipts,undo:imported.undo});
   }catch{throw Error('NATIVE_MEDIA_COMMITTED_BUT_LEDGER_PERSISTENCE_FAILED_DO_NOT_RETRY')}
   return {status:'PRIVATE_HF_FABLECUT_MEDIA_STAGED_AWAITING_AV_QA',
    operationId:p.operation.id,sourceSha256:p.preflight.sourceSha256,
    renderedSha256:rendered.outputSha256,importedRevision:imported.revision,
    projectFingerprintAfter:imported.projectFingerprintAfter,
    sourceEditableIn:'HyperFrames',internalVideoEditableInFableCut:false,
    fullReelRendered:false,fullAVReviewed:false,creativeResultApproved:false,
    publicationAuthorized:false,final:false,productionChanged:false};
  }
 };
}
