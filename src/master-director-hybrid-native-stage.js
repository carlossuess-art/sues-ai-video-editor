// Trusted internal preflight for the native half of an approved hybrid story.
// Never expose this return object to an HTTP response or execute it alone.
import {reviewMasterDirectorNative} from './master-director-native-review.js';
import {bridgeMasterDirectorToNative} from './master-director-native-bridge.js';
import {masterDirectorFingerprint} from './master-director-gate.js';
import {reviewExternalPlan} from './external-edit-plan.js';

const block=(code)=>({status:'BLOCKED',canExecute:false,issues:[{code}]});
export function prepareMasterHybridNativeStage({plan,registry,catalog,project,settings,assets=[],commandPlanner}={}){
 const checked=reviewMasterDirectorNative({plan,registry,catalog,project,settings,assets,commandPlanner});
 if(checked.status!=='HYBRID_NATIVE_PART_REVIEWED_NOT_EXECUTABLE')
  return block(checked.issues?.[0]?.code??'HYBRID_NATIVE_REVIEW_REQUIRED');
 if(!Array.isArray(plan?.operations)||!plan.operations.length||!checked.nativeOperationIds?.length||
    !checked.remotionOperationIds?.length||typeof commandPlanner!=='function')
  return block('HYBRID_SUBSET_INVALID');
 const subset={...structuredClone(plan),operations:plan.operations.filter(o=>o.renderer==='native')};
 const derivedRegistry={...registry,approvedPlanFingerprint:masterDirectorFingerprint(subset)};
 const bridged=bridgeMasterDirectorToNative(subset,derivedRegistry,catalog);
 if(bridged.status!=='READY_FOR_NATIVE_REVIEW'||bridged.plan?.operations.length!==checked.nativeOperationIds.length||
    bridged.operationMapping.some((o,i)=>o.masterOperationId!==checked.nativeOperationIds[i]))
  return block('HYBRID_NATIVE_SUBSET_DIVERGED');
 const reviewed=reviewExternalPlan(JSON.stringify(bridged.plan),{project,settings,assets,commandPlanner});
 if(!reviewed.canApply||reviewed.reviewId!==checked.nativeReviewId||
    reviewed.rows?.length!==bridged.plan.operations.length||
    !reviewed.rows.every((row,i)=>row.index===i+1&&row.status==='ready'))
  return block('HYBRID_NATIVE_REVIEW_CHANGED');
 if(JSON.stringify(reviewed.changes).length>100000)return block('HYBRID_CHANGES_TOO_LARGE');
 return {schema:'sues-master-hybrid-native-stage/v1',status:'NATIVE_STAGE_PREPARED',
  canExecute:false,canPublish:false,planFingerprint:checked.fullPlanFingerprint,
  originalSourceSha256:plan.source.sha256,reviewId:checked.nativeReviewId,
  nativeOperationIds:checked.nativeOperationIds,remotionOperationIds:checked.remotionOperationIds,
  changes:reviewed.changes,actions:reviewed.actions};
}
