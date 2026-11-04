// The single read-only orchestration entrypoint for a trusted editor backend.
// Never expose registry, rulebook or approval lists as user-editable request data.
import {resolveMasterDirectorRules} from './master-director-rulebook.js';
import {compileMasterDirectorStory} from './master-director-story.js';
import {reviewMasterDirectorPlan} from './master-director-gate.js';

const issue=(code,subject='orchestration')=>({code,subject});
const validKey=x=>typeof x==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/.test(x);

/**
 * Pure preflight. Does not call AI, generate media, submit jobs, render or deploy.
 * All trusted inputs MUST be assembled by the server from its own records.
 */
export function prepareMasterDirectorSession({story,registry,rulebook}={}){
 if(!registry||!Array.isArray(registry.approvedRuleIds)||!Array.isArray(registry.requiredRuleKeys)||
    !registry.requiredRuleKeys.length||!registry.requiredRuleKeys.every(validKey)||
    !Array.isArray(registry.approvedReferenceIds))
   return {status:'BLOCKED',phase:'registry',issues:[issue('TRUSTED_REGISTRY_INCOMPLETE')],plan:null};
 const context={
  brandId:registry.brandId,profileId:registry.profileId,projectId:registry.projectId,
  sceneId:registry.sceneId,visualMode:story?.visual?.mode,
  referenceId:story?.visual?.referenceId,authorizedReferenceIds:registry.approvedReferenceIds
 };
 const resolved=resolveMasterDirectorRules(rulebook,context,registry.approvedRuleIds);
 if(resolved.status!=='READY')
   return {status:'BLOCKED',phase:'rulebook',issues:[...resolved.issues,...resolved.conflicts.map(x=>issue('UNRESOLVED_RULE_CONFLICT',x.key))],
     unresolvedRuleConflicts:resolved.unresolvedRuleConflicts,plan:null};
 const missing=registry.requiredRuleKeys.filter(k=>!resolved.selectedRules.some(r=>r.key===k));
 if(missing.length)
   return {status:'BLOCKED',phase:'rulebook',issues:missing.map(k=>issue('REQUIRED_RULE_NOT_APPROVED',k)),plan:null};
 const verified={...registry,unresolvedRuleConflicts:resolved.unresolvedRuleConflicts};
 const built=compileMasterDirectorStory(story,verified);
 if(built.status!=='READY_FOR_PLAN_REVIEW')
   return {status:built.status,phase:'story',issues:built.issues,assetRequests:built.assetRequests,plan:null};
 // The exact applied rule VALUES are part of the approval hash of the future render.
 // A value change revokes approval even if a rule ID and registry version were reused.
 const plan={...built.plan,appliedRuleSnapshot:resolved.selectedRules.map(r=>({
  id:r.id,key:r.key,scope:r.scope,scopeId:r.scopeId??null,authority:r.authority,value:r.value
 }))};
 const preflight=reviewMasterDirectorPlan(plan,verified);
 return {status:preflight.status,phase:'approval',issues:preflight.issues,
  fingerprint:preflight.fingerprint,plan,assetRequests:[],
  appliedRuleIds:resolved.selectedRules.map(r=>r.id)};
}
