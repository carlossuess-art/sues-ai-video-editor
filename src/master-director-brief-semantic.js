// Exact, fail-closed checks for a link between a Film Director creative
// instruction and a master-story operation. This never verifies an asset's
// license or declares that its requested effect has been rendered.
const is=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const slot=x=>typeof x==='string'&&/^[BM]0\d+$/.test(x);
const declaredMotion=(story,hint)=>slot(hint)&&hint.startsWith('M')&&
 Array.isArray(story.resources)&&story.resources.some(r=>r?.id===hint&&
 (['library','generate'].includes(r.source)&&['motion','graphic','video','image'].includes(r.kind)));
export function checkFilmBriefIntentMapping(intent,op,story){
 if(!is(intent)||!is(op)||!is(story))return 'INVALID_INTENT_OR_OPERATION';
 const details=intent.detail??{};
 if(intent.track==='graphics'&&intent.id.endsWith('-editorial-title')){
  if(op.track!=='graphics'||op.effect!=='text'||op.parameters?.text!==details.text)
   return 'EDITORIAL_TITLE_TEXT_CHANGED';
 }
 if(intent.track==='captions'){
  if(op.track!=='captions'||op.effect!=='text')return 'CAPTION_NOT_REPRESENTED_AS_TEXT';
  // Full word-by-word progression remains subject to a separate verified ASR
  // audit. Text match alone is not enough to pass creative/temporal review.
 }
 if(intent.track==='broll'){
  if(op.track!=='broll'||op.effect!=='video-exact')return 'BROLL_REPLACED_WITH_OTHER_EFFECT';
  if(!slot(details.resourceHint)||op.resourceRef!==details.resourceHint||
     !Array.isArray(story.resources)||
     !story.resources.some(r=>r.id===details.resourceHint&&(r.kind==='video'||r.source==='library')))
   return 'BROLL_RESOURCE_ID_NOT_PRESERVED';
 }
 if(intent.track==='graphics'&&intent.id.endsWith('-base')&&details.base?.startsWith('M')){
  if(!['image-exact','video-exact','text'].includes(op.effect))return 'MOTION_BASE_EFFECT_UNSUPPORTED';
  // A text-only effect may cover one layer, but cannot by itself satisfy
  // cinematic 2.5D/3D, material, mask or animated composition requirements.
  if(op.effect==='text')return 'MOTION_COMPOSITION_REQUIRES_ADDITIONAL_LAYERS';
  if(!declaredMotion(story,details.base)||op.resourceRef!==details.base)
   return 'MOTION_BASE_RESOURCE_ID_NOT_PRESERVED';
 }
 if(intent.track==='graphics'&&intent.id.includes('-overlay-M')){
  if(!['image-exact','video-exact','text'].includes(op.effect))return 'MOTION_OVERLAY_EFFECT_UNSUPPORTED';
  if(op.effect==='text')return 'MOTION_OVERLAY_COMPOSITION_UNVERIFIED';
  if(!declaredMotion(story,details.resourceHint)||op.resourceRef!==details.resourceHint)
   return 'MOTION_OVERLAY_RESOURCE_ID_NOT_PRESERVED';
 }
 if(intent.track==='transition'){
  if(op.track!=='transition')return 'BROLL_TRANSITION_NOT_REPRESENTED';
  // The transition must be checked by the trusted native/hybrid preflight,
  // not inferred from a text or a presumed edit cut.
 }
 if(intent.track==='camera'&&op.track!=='camera')return 'CAMERA_REPLACED_OR_LOST';
 if(intent.track==='editorial-direction'){
  if(typeof op.reason!=='string'||op.reason.trim().length<5)return 'CREATIVE_DIRECTION_REASON_MISSING';
 }
 return null;
}
