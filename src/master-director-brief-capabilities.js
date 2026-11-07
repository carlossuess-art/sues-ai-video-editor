// Conservative capability inventory for an unapproved Film Director annex.
// Reports only what the strict Remotion adapter can model in its schema;
// all rows still require trusted source, fonts, masks, rights and human QA.
const block=(code)=>({status:'BLOCKED',code,approved:false,canExecute:false});
const textEffects=new Set(['graphics','captions']);
export function auditFilmBriefCapabilities(annex){
 if(annex?.schema!=='sues-master-film-brief-translation/v1'||
  annex.approved!==false||annex.canExecute!==false||!Array.isArray(annex.operationIntents)||
  annex.translationCoverage?.lostLines!==0||annex.instructionCoverage?.unaccountedNonemptyLines?.length!==0)
  return block('INVALID_SOURCE_TECHNICAL_ANNEX');
 const bySlot=new Map(annex.resourceReferences.map(x=>[x.resourceHint,x.resourceHint[0]==='B'?'video':'motion']));
 const rows=annex.operationIntents.map(x=>{
  let model='NOT_MODELLED_BY_CURRENT_STRICT_REMOTION_ADAPTER';let blockers=[];let suggestedCapability=null;
  if(x.track==='document-context'){
   model='DOCUMENTATION_ONLY';blockers=['CHECK_NOT_EXECUTABLE'];
  }else if(x.track==='camera'){
   model='REQUIRES_NATIVE_SOURCE_COMPOSITION';blockers=['NO_DIRECT_CAMERA_OPERATION_IN_STRICT_REMOTION_ADAPTER','FRAME_VISUAL_QA_REQUIRED'];
  }else if(x.track==='broll'){
   model='STRUCTURALLY_MODELABLE_AFTER_TRUSTED_EVIDENCE';
   suggestedCapability='remotion:broll:video-exact';
   blockers=['REAL_VIDEO_ID_SHA_LICENSE_RIGHTS','VIDEO_START_FRAME_AND_DURATION','IN_OUT_TRANSITIONS_UNSUPPORTED_BY_STRICT_REMOTION'];
  }else if(x.track==='transition'){
   model='NOT_MODELLED_BY_CURRENT_STRICT_REMOTION_ADAPTER';
   blockers=['TRANSITION_TYPE_DURATION_CURVE_AND_ENGINE_MISSING'];
  }else if(x.track==='graphics'&&x.id.endsWith('-editorial-title')){
   model='STRUCTURALLY_MODELABLE_AFTER_TRUSTED_EVIDENCE';
   suggestedCapability='remotion:graphics:text';
   blockers=['VERIFIED_FONT_SHA','EXACT_RECT_AND_KEYFRAMES','FACE_OCCLUSION_QA'];
  }else if(x.track==='captions'){
   model='STRUCTURALLY_MODELABLE_AS_VERIFIED_WORD_LAYERS_ONLY';
   suggestedCapability='remotion:captions:text';
   blockers=['VERIFIED_WORD_BY_WORD_TRANSCRIPT','ASR_AMBIGUITIES','EXACT_PROGRESSIVE_TIMELINE','SAFE_ZONES_AND_FONT_PROOF'];
  }else if(x.track==='graphics'){
   model='CINEMATIC_COMPOSITION_NOT_PROVEN_REPRESENTABLE';
   blockers=['MOTION_ASSET_LAYER_GEOMETRY_AND_MATERIAL','NECESSARY_DYNAMIC_MASK_OR_COMPOSITING','TIMED_OBJECT_ANIMATION_QA'];
  }else if(x.track==='editorial-direction'){
   model='UNSTRUCTURED_DIRECTION_REQUIRES_EXACT_OPERATIONS';
   blockers=['DETAILS_NOT_MAPPED_TO_EXECUTABLE_PROPERTIES','RIGHTS_TIMELINE_SOUND_OR_MOTION_EVIDENCE'];
  }
  return {intentId:x.id,sceneId:x.sceneId,sourceLine:x.sourceLine,track:x.track,
   model,suggestedCapability,blockers,approved:false,canExecute:false};
 });
 const grouped={};for(const row of rows)grouped[row.model]=(grouped[row.model]??0)+1;
 const slots=[...bySlot].map(([slot,kind])=>({slot,kind,verified:false,model:
  kind==='video'?'VIDEO_EXACT_ONLY_AFTER_PROOF':'MOTION_REQUIRES_COMPOSITION_AND_PROOF'}));
 return {schema:'sues-master-brief-capability-audit/v1',status:'BLOCKED_PENDING_EXECUTABLE_EQUIVALENCE',
  sourceBriefSha256:annex.sourceBriefSha256,sourceSha256:annex.sourceSha256,
  timelineFingerprint:annex.timelineFingerprint,intents:rows,counts:grouped,
  unresolved:rows.filter(r=>r.model!=='DOCUMENTATION_ONLY').length,
  sourceLineLoss:0,resourceSlots:slots,approved:false,canExecute:false};
}
