import {inspectFilmBriefShotCoverage} from './master-director-brief-shot-coverage.js';
// Conservative capability inventory for an unapproved Film Director annex.
// Reports only what the strict Remotion adapter can model in its schema;
// all rows still require trusted source, fonts, masks, rights and human QA.
const block=(code)=>({status:'BLOCKED',code,approved:false,canExecute:false});
const textEffects=new Set(['graphics','captions']);
export function auditFilmBriefCapabilities(annex){
 if(annex?.schema!=='sues-master-film-brief-translation/v1'||
  annex.approved!==false||annex.canExecute!==false||!Array.isArray(annex.operationIntents)||
  annex.translationCoverage?.lostLines!==0||!Array.isArray(annex.instructionCoverage?.unaccountedNonemptyLines)||
  annex.instructionCoverage.unaccountedNonemptyLines.length!==0||
  !Array.isArray(annex.resourceReferences)||
  annex.resourceReferences.some(r=>!r||typeof r.resourceHint!=='string'||!/^[BM][0-9]{2,}$/.test(r.resourceHint))||
  annex.operationIntents.some(x=>!x||typeof x.id!=='string'||!x.id||
    typeof x.track!=='string'||!x.track||(x.sceneId!==null&&typeof x.sceneId!=='string')||
    typeof x.sourceLine!=='number'||!Number.isInteger(x.sourceLine)||x.sourceLine<1)||
  new Set(annex.operationIntents.map(x=>x.id)).size!==annex.operationIntents.length)
  return block('INVALID_SOURCE_TECHNICAL_ANNEX');
 const shotCoverage=inspectFilmBriefShotCoverage(annex);
 if(shotCoverage.issues?.length||shotCoverage.status==='BLOCKED')
  return {...block('FILM_BRIEF_BASE_SHOT_COVERAGE_INVALID'),shotCoverage};
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
   blockers=['REAL_VIDEO_ID_SHA_LICENSE_RIGHTS','VIDEO_START_FRAME_AND_DURATION','IN_OUT_TRANSITIONS_MUST_BE_EXPLICIT_AND_MATCH_ENGINE'];
  }else if(x.track==='transition'){
   // The strict adapter has no independent transition track, but its existing
   // video layer can animate opacity at exact frames for an EXPLICIT fade.
   // Never auto-choose a fade when Film Director has not specified its kind.
   model='CONDITIONAL_VIDEO_OPACITY_FADE_CAPABILITY';
   suggestedCapability='remotion:broll:video-exact:opacity-keyframes';
   blockers=['DIRECTOR_MUST_SPECIFY_IN_OUT_TRANSITION_KIND_DURATION_AND_CURVE',
    'SAME_VERIFIED_BROLL_VIDEO_AND_FULL_FRAME_OPACITY_KEYS',
    'TRUSTED_ASSET_RIGHTS_AND_FRAME_RENDER_QA_REQUIRED',
    'OTHER_TRANSITION_STYLES_NOT_PROVEN_SUPPORTED'];
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
  sourceLineLoss:0,resourceSlots:slots,shotCoverage:{frameCount:shotCoverage.frameCount,shotCount:shotCoverage.shotCount,issues:0,status:shotCoverage.status},approved:false,canExecute:false};
}
