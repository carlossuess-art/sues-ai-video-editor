// Frame-accurate, non-executable EDL for the human Film Director brief.
// No assets, transitions, cuts or permissions are inferred.
import {inspectFilmBriefShotCoverage} from './master-director-brief-shot-coverage.js';
const deny=(code,issues=[])=>({schema:'sues-film-brief-base-track/v1',status:'BLOCKED',
  code,issues,approved:false,canExecute:false});
export function prepareFilmDirectorBaseTrack(annex){
 const coverage=inspectFilmBriefShotCoverage(annex);
 if(coverage.status==='BLOCKED')return deny('SHOT_COVERAGE_NOT_SAFE',coverage.issues);
 if(annex?.workingClock!=='verified-CFR30-no-cuts'||annex.fps!==30||
    !/^[a-f0-9]{64}$/.test(annex.sourceSha256??'')||
    !/^[a-f0-9]{64}$/.test(annex.timelineFingerprint??'')||
    !/^[a-f0-9]{64}$/.test(annex.originalSha256??''))
   return deny('SOURCE_TIMELINE_LINEAGE_NOT_VERIFIED');
 const segments=[],requirements=[];
 for(const scene of coverage.scenes)for(const shot of scene.shots){
  const segment={shotId:shot.id,sceneId:scene.sceneId,startFrame:shot.startFrame,
   endFrame:shot.endFrame,layerKind:shot.kind,
   preservation:shot.kind==='camera'?'RETAIN_ORIGINAL_CAMERA_WITH_SOURCE_AUDIO':
     shot.kind==='broll'?'FULL_FRAME_VIDEO_SUBSTITUTION_CONTINUOUS_ORIGINAL_AUDIO':
     'FULL_FRAME_MOTION_COMPOSITION_CONTINUOUS_ORIGINAL_AUDIO',
   resourceSlot:shot.kind==='camera'?null:shot.base,
   overlays:shot.overlayResourceHints.map(slot=>({slot,kind:'motion',startFrame:shot.startFrame,
     endFrame:shot.endFrame,status:'RESOURCE_AND_COMPOSITING_EVIDENCE_PENDING'})),
   sourceAudioPolicy:'CONTINUOUS_ORIGINAL_RECORDING_NO_UNAPPROVED_CUTS',
   transitionPolicy:shot.kind==='broll'?'IN_AND_OUT_MUST_BE_EXPLICITLY_APPROVED':
     'NO_ASSUMED_TRANSITION',
   canExecute:false};
  segments.push(segment);
  if(segment.resourceSlot)requirements.push({slot:segment.resourceSlot,shotId:segment.shotId,
   kind:shot.kind,requiredFrames:shot.endFrame-shot.startFrame,
   minimumDurationSeconds:(shot.endFrame-shot.startFrame)/30});
  for(const overlay of segment.overlays)requirements.push({slot:overlay.slot,shotId:segment.shotId,
   kind:'motion-overlay',requiredFrames:shot.endFrame-shot.startFrame,
   minimumDurationSeconds:(shot.endFrame-shot.startFrame)/30});
 }
 const last=segments.at(-1);
 if(!last||last.endFrame!==coverage.frameCount||segments.length!==coverage.shotCount||
    requirements.some(r=>(r.kind==='broll'&&!/^B0\d+$/.test(r.slot))||
      (r.kind.startsWith('motion')&&!/^M0\d+$/.test(r.slot))))
   return deny('SOURCE_BASE_TRACK_INTEGRITY_FAILED');
 return {schema:'sues-film-brief-base-track/v1',status:'PREPARED_NOT_EXECUTABLE',
  sourceBriefSha256:annex.sourceBriefSha256,sourceSha256:annex.sourceSha256,
  originalSha256:annex.originalSha256,timelineFingerprint:annex.timelineFingerprint,
  fps:30,frameCount:coverage.frameCount,sceneCount:coverage.sceneCount,
  shotCount:segments.length,segments,resourceRequirements:requirements,
  safety:['NO_ASSET_BINDINGS','NO_ASSUMED_TRANSITIONS','NO_AUDIO_CUTS',
    'NO_EDITORIAL_REWRITE','NO_RENDER_APPROVAL'],
  approved:false,canExecute:false};
}
