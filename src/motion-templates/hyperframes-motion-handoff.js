/**
 * SUES | HyperFrames is the animation owner, FableCut is the editorial owner.
 *
 * This is a REVIEW-ONLY transport contract. It MUST NEVER map a full-screen
 * HyperFrames composition into fake editable FableCut shapes, or mistake the
 * existing SVG proxy render for an accredited native HyperFrames export.
 *
 * Source owns geometry, easing, font, blur, masks and per-word animation.
 * FableCut will own the Reel timeline, clip timing, voice and other tracks,
 * but only after render evidence, rights, source identity, approval and QA.
 */
import {createHash} from 'node:crypto';
import {SEQUENCE_FRAMES,SEQUENCE_ID} from './sequence-card-to-space.js';
import {FPS} from './hook-drop-card-engine.js';

export const HYPERFRAMES_MOTION_ROOT='examples/motions/hyperframes-card-to-space';
export const REQUIRED_SOURCE_FILES=Object.freeze([
 'index.html',
 'runtime/hook-drop-card-engine.js',
 'runtime/sequence-card-to-space.js'
]);
const sha=s=>typeof s==='string'&&/^[0-9a-f]{64}$/i.test(s);
const check=(ok,message)=>{if(!ok)throw Error(message);};
const editable={
 geometry:'HYPERFRAMES_SOURCE',
 wordContent:'HYPERFRAMES_SOURCE',
 wordTiming:'HYPERFRAMES_SOURCE',
 blurAndMasks:'HYPERFRAMES_SOURCE',
 cameraAnimation:'HYPERFRAMES_SOURCE',
 afterExportClipTrim:'FABLECUT_EDITOR_IF_VERIFIED',
 afterExportClipPosition:'FABLECUT_EDITOR_IF_VERIFIED',
 afterExportInternalWordEffects:'NOT_EDITABLE_AS_FABLECUT_MEDIA'
};
const same=(arr)=>new Set(arr).size===arr.length;
export function buildHyperFramesMotionHandoff({
  sourceHashes,mode='SYNTHETIC_DEMO',transcriptSha256=null,
  selectedWordIds=null,approvedPlanFingerprint=null,
  sceneId=SEQUENCE_ID,profile='DOPAMIN'
}={}){
 check(sourceHashes&&typeof sourceHashes==='object'&&!Array.isArray(sourceHashes),'Source-file SHA256 evidence required');
 const keys=Object.keys(sourceHashes);
 check(keys.length===REQUIRED_SOURCE_FILES.length&&
  REQUIRED_SOURCE_FILES.every(p=>keys.includes(p)&&sha(sourceHashes[p])),
  'Require SHA256 for exactly the three local source files');
 check(sceneId===SEQUENCE_ID,'Unknown HyperFrames scene');
 check(['SYNTHETIC_DEMO','REVIEWED_SPEECH'].includes(mode),'Unknown speech mode');
 check(['DOPAMIN','CALMA','ELEMENTS'].includes(profile),'Unknown SUES profile');
 if(mode==='SYNTHETIC_DEMO'){
  check(transcriptSha256===null&&selectedWordIds===null&&approvedPlanFingerprint===null,
    'Synthetic demo cannot pretend to have voice, transcript or approval');
 }else{
  check(sha(transcriptSha256),'Reviewed speech requires transcript fingerprint');
  check(Array.isArray(selectedWordIds)&&selectedWordIds.length>0&&selectedWordIds.every(id=>typeof id==='string'&&id.trim())&&same(selectedWordIds),
    'Reviewed speech requires distinct real word IDs');
  check(typeof approvedPlanFingerprint==='string'&&approvedPlanFingerprint.trim().length>=12,
    'Reviewed speech requires a reviewed plan fingerprint');
 }
 const sourceFingerprint=createHash('sha256').update(REQUIRED_SOURCE_FILES.map(p=>p+':'+sourceHashes[p].toLowerCase()).join('\n')).digest('hex');
 const packet={
  schema:'sues-hyperframes-motion-handoff/v1',
  status:'SOURCE_REVIEW_ONLY_RENDER_NOT_VERIFIED',
  owner:{animation:'HyperFrames',editorial:'FableCut',decision:'SUES MASTER DIRECTOR'},
  source:{root:HYPERFRAMES_MOTION_ROOT,files:REQUIRED_SOURCE_FILES.map(path=>({path,sha256:sourceHashes[path].toLowerCase()})),fingerprint:sourceFingerprint,
   templateId:sceneId,editableAt:'HyperFrames',engine:'HTML SVG + GSAP timeline',runtimeSeek:'hf-seek'},
  timeline:{fps:FPS,width:1080,height:1920,frames:SEQUENCE_FRAMES,durationSec:SEQUENCE_FRAMES/FPS,
   voiceTimeMap:'REQUIRES_VERIFIED_SOURCE_TO_EDIT_MAPPING'},
  identity:{mode,transcriptSha256,selectedWordIds,approvedPlanFingerprint,profile},
  typography:{primary:'Montserrat',brandPalette:'antracita / dorado oscuro / dorado luminoso / blanco',
   actualFontAvailability:'REQUIRES_RENDER_VERIFICATION'},
  render:{
   nativeHyperFramesVideo:null,nativeRendered:false,
   svgProxyMayBeUsedAsNativeEvidence:false,
   alphaChannel:'NOT_VERIFIED',
   frameChecks:[0,7,8,12,19,26,51,59,64,69,81,91,104,112,119,150],
   mustCheck:'HyperFrames native render at correct FPS/resolution, frames, source identity, audio, and rights'},
  editorial:{
   target:'FableCut',suggestedTrackRole:'GRAPHICS',
   clipTypeAfterAcceptedRender:'MEDIA_CLIP_WITH_LINKED_HYPERFRAMES_SOURCE',
   compositing:'FULL_FRAME_ONLY_UNTIL_ALPHA_AND_BACKGROUND_ARE_VERIFIED',
   editable:editable,
   captions:'Never duplicate regular captions during verified full-coverage motion; protect all speech tokens and negations'
  },
  gates:{
   canImportToProduction:false,canPublish:false,creativeApproved:false,
   blockers:[
    'Native HyperFrames render not proven',
    'Chromium full-frame visual review pending',
    'Actual source-to-Reel timeline map and word coverage pending',
    'FableCut ingest pathway and media metadata proof pending',
    'Full A/V plan, two-pass QA and separate creative approval pending'
   ]
  }
 };
 return packet;
}
/**
 * Only *inspect* a claimed render proof. This never moves, imports, approves
 * or marks assets ready. Caller must verify media hashes on disk separately.
 */
export function inspectNativeRenderEvidence(packet,reported){
 check(packet?.schema==='sues-hyperframes-motion-handoff/v1','Expected HyperFrames source packet');
 check(reported&&typeof reported==='object','Render evidence object required');
 check(reported.renderer==='HyperFrames'&&reported.kind==='NATIVE_HYPERFRAMES_RENDER',
  'SVG proxy or FableCut preview must not be promoted to HyperFrames output');
 check(reported.sourceFingerprint===packet.source.fingerprint,'Render source changed');
 check(sha(reported.outputSha256),'Verified media file hash required');
 check(reported.fps===packet.timeline.fps&&reported.frames===packet.timeline.frames&&
  reported.width===packet.timeline.width&&reported.height===packet.timeline.height,
  'Render frame-count/FPS/dimensions mismatch');
 check(typeof reported.proofPath==='string'&&reported.proofPath.trim()&&typeof reported.filePath==='string'&&reported.filePath.trim(),
  'Both media and machine-readable proof paths required');
 return {
  schema:'sues-hyperframes-render-evidence-inspection/v1',
  status:'METADATA_MATCH_ONLY_NOT_INTEGRATED',
  outputSha256:reported.outputSha256.toLowerCase(),
  sourceFingerprint:packet.source.fingerprint,
  mediaPath:reported.filePath,proofPath:reported.proofPath,
  exactMediaHashRecheckRequired:true,visualAndAudioQARequired:true,
  fablecutIngestApproved:false,productionChanged:false
 };
}
