// Host-only bridge. All binding, registry, native resource and staging functions
// come from trusted server configuration, not from the client's payload.
import {prepareStoryBatch,projectFingerprint,applyCommandBatch} from './fablecut-command-batch.js';
import {dispatchCommandBatch} from './fablecut-command-dispatcher.js';
import {assertStoryOperationCoverage} from './fablecut-native-supervisor.js';
const SHA=/^[a-f0-9]{64}$/;
export function createApprovedBatchService({ledger,resolveContext,readProject,native,resolveAsset,stageAssets,invokeMcp}={}){
 if(!ledger||![resolveContext,readProject,resolveAsset,stageAssets,invokeMcp].every(x=>typeof x==='function')||!native?.applyPatch)throw Error('TRUSTED_BATCH_HOST_REQUIRED');
 async function prepare({actor,projectId,storyRevision,decisionId}){
  if(!/^p_[A-Za-z0-9_-]{2,96}$/.test(projectId??'')||![storyRevision,decisionId].every(x=>SHA.test(x??'')))throw Error('INVALID_BATCH_REFERENCE');
  const c=await resolveContext(projectId);
  if(!c||c.nativeProjectId!==projectId||c.privateClone!==true||!c.store?.approved||!c.store?.current||!c.store?.readDraft)throw Error('PRIVATE_BOUND_PROJECT_REQUIRED');
  const before=await readProject();
  if(before.projectId!==projectId||c.nativeFingerprint!==projectFingerprint(before.data))throw Error('NATIVE_BINDING_STALE');
  if(c.store.current().revision!==storyRevision)throw Error('STORY_HEAD_STALE');
  const approved=await c.store.approved(storyRevision,decisionId);
  if(!approved||approved.mode!=='approve'||approved.view?.status!=='READY_FOR_CHOICE'||c.store.current().revision!==storyRevision)throw Error('CREATIVE_APPROVAL_REQUIRED');
  const story=c.store.readDraft(storyRevision);
  if(approved.registry.projectFingerprint!==c.nativeFingerprint||
     projectFingerprint(approved.registry.nativeTrackRoles??{})!==projectFingerprint(c.nativeTrackRoles??{})||
     projectFingerprint(approved.registry.nativeMediaBindings??{})!==projectFingerprint(c.nativeMediaBindings??{}))
   throw Error('APPROVED_NATIVE_BINDING_CHANGED');
  const registry={...approved.registry,projectFingerprint:c.nativeFingerprint,nativeTrackRoles:c.nativeTrackRoles,nativeMediaBindings:c.nativeMediaBindings,unresolvedRuleConflicts:[]};
  const plan=await prepareStoryBatch(story,{registry,project:before.data,bindings:c.bindings,authorize:async()=>true});
  if(plan.status!=='PREPARED_NOT_EXECUTED')return {status:'BLOCKED',issues:plan.issues??[],storyRevision};
  const predicted=applyCommandBatch(before.data,plan.request,{native,resolveAsset});
  // Exact one-to-one coverage before any write authorization.
  assertStoryOperationCoverage(story.operations,predicted.receipts);
  // Untrusted resource bytes may never stage in an approved batch.
  if(predicted.assets.some(a=>a.rightsVerified!==true))throw Error('RESOURCE_RIGHTS_UNVERIFIED');
  const proof={actor,projectId,storyRevision,decisionId,planFingerprint:approved.view.fingerprint,projectFingerprint:approved.view.projectFingerprint,nativeFingerprint:c.nativeFingerprint,requestFingerprint:projectFingerprint(plan.request),baseRevision:before.data.revision};
  return {status:'PREPARED',proof,request:plan.request,receipts:predicted.receipts};
 }
 return {
  async issue(input,{verifiedHumanSession=false}={}){
   const p=await prepare(input);if(p.status!=='PREPARED')return p;
   return {status:'APPROVAL_ISSUED_NOT_EXECUTED',...ledger.issueBatch(p.proof,{verifiedHumanSession}),proof:p.proof,receipts:p.receipts};
  },
  async execute(input){
   const p=await prepare(input);if(p.status!=='PREPARED')return p;
   const audit=e=>ledger.audit({...e,schema:'sues-director-mcp-dispatch/v1',storyRevision:p.proof.storyRevision,decisionId:p.proof.decisionId,planFingerprint:p.proof.planFingerprint,operationIds:undefined});
   const result=await dispatchCommandBatch({projectId:input.projectId,approvalId:input.approvalId,request:p.request},{
    native,resolveAsset,stageAssets,readProject,invokeMcp,audit,
    authorize:async()=>{const fresh=await prepare(input);return fresh.status==='PREPARED'&&projectFingerprint(fresh.proof)===projectFingerprint(p.proof)&&ledger.consumeBatch(p.proof,input.approvalId)}
   });
   try{ledger.recordBatchResult(input.approvalId,p.proof,result)}catch{throw Error('NATIVE_COMMITTED_RESULT_PERSISTENCE_FAILED_DO_NOT_RETRY')}
   // Preserve the durable result before blocking any post-commit discrepancy.
   assertStoryOperationCoverage(p.receipts.map(r=>({id:r.operationId})),result.receipts,'NATIVE_COMMITTED_RECEIPT_COVERAGE_MISMATCH_DO_NOT_RETRY');
   return {...result,receiptPersisted:true};
  }
 };
}
