// Offline preview/validation against the actual native editor rules.
// Deliberately does not create a project, mutate settings, charge APIs or render.
import {bridgeMasterDirectorToNative} from './master-director-native-bridge.js';
import {reviewExternalPlan} from './external-edit-plan.js';
import {reviewMasterDirectorPlan,masterDirectorFingerprint} from './master-director-gate.js';
import {buildMasterDirectorLayerGraph} from './master-director-layer-graph.js';
import {reviewMasterDirectorHybridGraph} from './master-director-hybrid-review.js';

function reviewNativeOnly({plan,registry,catalog,project,settings,assets=[],commandPlanner}={}){
 const bridged=bridgeMasterDirectorToNative(plan,registry,catalog);
 if(bridged.status!=='READY_FOR_NATIVE_REVIEW')
  return {status:bridged.status,canExecute:false,issues:bridged.issues??[],
   fingerprint:bridged.fingerprint,preview:null,nativePlan:null};
 if(!project||!settings||typeof commandPlanner!=='function')
  return {status:'BLOCKED',canExecute:false,
   issues:[{operationId:'plan',code:'EDITOR_CONTEXT_MISSING'}],preview:null,nativePlan:null};
 let preview;
 try{
  preview=reviewExternalPlan(JSON.stringify(bridged.plan),
   {project,settings,assets,commandPlanner});
 }catch(e){
  return {status:'NATIVE_PREVIEW_FAILED',canExecute:false,issues:[{
   operationId:'plan',code:'NATIVE_REVIEW_EXCEPTION',detail:String(e?.message??e).slice(0,350)
  }],preview:null,nativePlan:null};
 }
 const validRows=preview.rows?.length===bridged.plan.operations.length&&
  preview.rows.every((row,i)=>row.status==='ready'&&row.index===i+1);
 if(!preview.canApply||!validRows||!preview.reviewId)
  return {status:'NATIVE_PREVIEW_REJECTED',canExecute:false,
   issues:[...(preview.rows??[]).filter(x=>x.status!=='ready').map(x=>({
    operationId:bridged.operationMapping[x.index-1]?.masterOperationId??'unknown',
    code:'NATIVE_OPERATION_REJECTED',detail:x.description
   })),...(preview.notes??[]).map(x=>({operationId:'plan',code:'NATIVE_REVIEW_NOTE',detail:x}))],
   fingerprint:bridged.fingerprint,preview:{rows:preview.rows,notes:preview.notes},
   nativePlan:null};
 // Cards derive their duration from caption boundaries and editor policy.
 // Compare the resulting composition rather than assuming those bounds match.
 for(const op of plan.operations.filter(o=>o.effect==='card-grid-native')){
  const cards=(preview.compiledGraphics??[]).filter(g=>g.captionId===op.parameters?.captionId);
  if(cards.length!==1||Math.abs(cards[0].start-op.start)>1e-6||Math.abs(cards[0].end-op.end)>1e-6)
   return {status:'NATIVE_PREVIEW_REJECTED',canExecute:false,nativePlan:null,
    fingerprint:bridged.fingerprint,issues:[{operationId:op.id,code:'NATIVE_CARD_TIMING_MISMATCH'}]};
 }
 return {status:'READY_FOR_EDITOR_PREVIEW',canExecute:false,issues:[],fingerprint:bridged.fingerprint,
  nativePlan:bridged.plan,operationMapping:bridged.operationMapping,
  preview:{reviewId:preview.reviewId,rows:preview.rows,notes:preview.notes,
   actions:preview.actions,editorialQuality:preview.editorialQuality}};
}

/**
 * Review the native subset of an approved mixed-engine plan without authorizing
 * a partial native-only render. The authentic server must still issue a separate,
 * source-bound, versioned hybrid staging command before any execution.
 */
export function reviewMasterDirectorNative(args={}){
 const {plan,registry={},catalog,project,settings,assets=[],commandPlanner}=args;
 if(!Array.isArray(plan?.operations)||!plan.operations.some(o=>o.renderer==='remotion'))
  return reviewNativeOnly(args);
 const full=reviewMasterDirectorPlan(plan,registry);
 if(full.status!=='READY_TO_EXECUTE')
  return {status:full.status,canExecute:false,canApply:false,
   issues:full.issues??[],fingerprint:full.fingerprint,nativePlan:null};
 const graph=buildMasterDirectorLayerGraph(plan,registry);
 if(graph.status!=='STRUCTURE_READY_NOT_RENDERED')
  return {status:'BLOCKED',canExecute:false,canApply:false,
   issues:graph.issues??[{code:'HYBRID_GRAPH_UNAVAILABLE'}],nativePlan:null};
 const hybrid=reviewMasterDirectorHybridGraph(graph.graph,{
  verifiedFonts:registry.verifiedFonts??{},verifiedAssets:registry.licensedAssets??{},
  verifiedMasks:registry.maskEvidence??{}});
 if(hybrid.status!=='MIXED_COMPONENTS_STAGED_NOT_RENDERABLE')
  return {status:'BLOCKED',canExecute:false,canApply:false,
   issues:hybrid.issues?.length?hybrid.issues:[{code:'HYBRID_TWO_ENGINES_REQUIRED'}],nativePlan:null};
 if(hybrid.crossEngineDependencies.some(d=>d.fromEngine==='remotion'&&d.toEngine==='native'))
  return {status:'BLOCKED',canExecute:false,canApply:false,
   issues:[{code:'HYBRID_EXECUTION_ORDER_UNSUPPORTED'}],nativePlan:null};
 if(hybrid.crossEngineOverlaps.some(o=>o.classification==='visual-order-unresolved'))
  return {status:'BLOCKED',canExecute:false,canApply:false,
   issues:[{code:'HYBRID_VISUAL_ORDER_UNVERIFIED'}],nativePlan:null};
 if(hybrid.crossEngineOverlaps.some(o=>o.classification==='audio-mix'))
  return {status:'BLOCKED',canExecute:false,canApply:false,
   issues:[{code:'HYBRID_AUDIO_MIX_NOT_VERIFIED'}],nativePlan:null};
 const subset={...structuredClone(plan),operations:plan.operations.filter(o=>o.renderer==='native')};
 // This derived hash is used ONLY for offline review; full-plan approval above is
 // mandatory. Never persist this hash as a user's new approval or publish the subset.
 const derivedRegistry={...registry,approvedPlanFingerprint:masterDirectorFingerprint(subset)};
 const native=reviewNativeOnly({plan:subset,registry:derivedRegistry,catalog,project,settings,assets,commandPlanner});
 if(native.status!=='READY_FOR_EDITOR_PREVIEW')
  return {status:'BLOCKED',canExecute:false,canApply:false,nativePlan:null,
   issues:native.issues?.length?native.issues:[{code:'HYBRID_NATIVE_SUBSET_REJECTED'}],
   fullPlanFingerprint:full.fingerprint};
 if(native.operationMapping.length!==hybrid.nativeOperationIds.length||
    native.operationMapping.some((o,i)=>o.masterOperationId!==hybrid.nativeOperationIds[i]))
  return {status:'BLOCKED',canExecute:false,canApply:false,nativePlan:null,
   issues:[{code:'HYBRID_NATIVE_MAPPING_MISMATCH'}]};
 return {schema:'sues-master-hybrid-native-review/v1',
  status:'HYBRID_NATIVE_PART_REVIEWED_NOT_EXECUTABLE',
  canExecute:false,canApply:false,nativePlan:null,
  fullPlanFingerprint:full.fingerprint,nativeReviewFingerprint:native.fingerprint,
  nativeReviewId:native.preview.reviewId,
  nativeOperationIds:hybrid.nativeOperationIds,remotionOperationIds:hybrid.remotionOperationIds,
  crossEngineDependencies:hybrid.crossEngineDependencies,crossEngineOverlaps:hybrid.crossEngineOverlaps,
  nativeRows:native.preview.rows,
  issues:[{code:'HYBRID_EXECUTION_STILL_BLOCKED'}]};
}