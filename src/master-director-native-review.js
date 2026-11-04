// Offline preview/validation against the actual native editor rules.
// Deliberately does not create a project, mutate settings, charge APIs or render.
import {bridgeMasterDirectorToNative} from './master-director-native-bridge.js';
import {reviewExternalPlan} from './external-edit-plan.js';

export function reviewMasterDirectorNative({plan,registry,catalog,project,settings,assets=[],commandPlanner}={}){
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
 return {status:'READY_FOR_EDITOR_PREVIEW',canExecute:false,issues:[],fingerprint:bridged.fingerprint,
  nativePlan:bridged.plan,operationMapping:bridged.operationMapping,
  preview:{reviewId:preview.reviewId,rows:preview.rows,notes:preview.notes,
   actions:preview.actions,editorialQuality:preview.editorialQuality}};
}
