/** Evidence-only technical closure of B02, not approval of the film or any media.
 * Designed to fail closed when an upstream QA gate, source fingerprint, time
 * window, original voice or temporal matte changes. No rendering side effect.
 */
const SHA=/^[a-f0-9]{64}$/;
const REQUIREMENTS=[
  {id:'mask-art-review',text:'Full-resolution foreground hair, hand and clothing matte edges need artistic review for all 120 frames'},
  {id:'children-composition-review',text:'Group-of-children integration, position, rights and narrative intent require approval'},
  {id:'title-3-voice',text:'Hero title NO MOLESTAR requires verified spoken phrase and safe-zone review'},
  {id:'captions-2-voice',text:'11 uncertain ASR candidates require human audio verification before true word-by-word captions'},
  {id:'audio-licensing',text:'Music/SFX usage and dynamic ducking require license and auditory QA'},
  {id:'full-story',text:'Seven scenes, 49 original operations, Reel timeline and two complete film QA passes remain pending'},
  {id:'aesthetic-approval',text:'Carlos must explicitly approve cinematic direction; technical correctness cannot approve it'},
];
export function evaluateB02TechnicalClosure({project,nativeAudit,sourceRoi,temporalMatte,actualVideoSha256,sourceSha256,matteSha256}={}){
 const failures=[];
 const fail=(condition,id)=>{if(!condition)failures.push(id)};
 fail(project&&project.fps===30&&project.width===1080&&project.height===1920&&project.inPoint===9.5&&project.outPoint===13.5,'wrong-b02-canvas-or-window');
 const clips=Array.isArray(project?.clips)?project.clips:[];
 const byId=id=>clips.find(c=>c?.id===id);
 const source=byId('sues_video_source'),voice=byId('sues_audio_original'),child=byId('sues_b02_child_review_only'),matte=byId('sues_b02_temporal_luma_qa'),foreground=byId('sues_b02_carlos_foreground_luma_qa'),gold=byId('sues_hyperframes_gold_3d_review_only');
 fail(source?.locked===true&&voice?.locked===true,'original-video-voice-not-locked');
 fail(child?.start===9.5&&child?.duration===4&&child?.track==='V2'&&child?.disabled!==true&&
   child?.props?.x===180&&child?.props?.y===-250&&child?.props?.scale===.73&&
   child?.transitionIn?.type==='fade'&&child?.transitionOut?.type==='fade'&&
   child?.transitionIn?.duration===.3&&child?.transitionOut?.duration===.3,'wrong-child-or-fades');
 fail(matte?.track==='V4'&&foreground?.track==='V3'&&foreground?.props?.matteTrack===matte?.track&&gold?.disabled===true,'matte-or-gold-protection-broken');
 const media=Array.isArray(project?.media)?project.media:[];
 fail(media.some(m=>m?.id===source?.mediaId&&m.src==='/media/sues-158404-original.mp4')&&
   media.some(m=>m?.id===voice?.mediaId&&m.src==='/media/sues-158404-voice.m4a')&&
   media.some(m=>m?.id===matte?.mediaId&&m.src==='/media/sues-158404-b02-modnet-luma-120.mp4'), 'original-asset-binding-changed');
 fail(SHA.test(sourceSha256||'')&&SHA.test(matteSha256||'')&&SHA.test(actualVideoSha256||''),'authentic-sha256-missing');
 fail(nativeAudit?.technicalChecksPassed===true&&nativeAudit?.nativeReportOk===true&&
    nativeAudit?.frameCount===120&&nativeAudit?.frameRate===30&&nativeAudit?.frameHashes?.distinctFrames===120&&
    nativeAudit?.frameHashes?.adjacentDuplicateFrames===0&&nativeAudit?.ssimMinimum>=.95&&
    nativeAudit?.mp4Sha256===actualVideoSha256,'native-120f-export-proof-failed');
 fail(sourceRoi?.status==='SOURCE_BACKGROUND_TECHNICAL_PASS'&&sourceRoi?.frames===120&&
    sourceRoi?.belowThreshold===0&&sourceRoi?.minSSIM>=.95&&sourceRoi?.sourceSha256===sourceSha256&&
    sourceRoi?.renderedSha256===actualVideoSha256,'authentic-source-vfr-timing-proof-failed');
 fail(temporalMatte?.status==='TEMPORAL_MATTE_CONTINUITY_TECHNICAL_PASS'&&temporalMatte?.frames===120&&
    temporalMatte?.sourceSha256===matteSha256&&Array.isArray(temporalMatte?.alertFrameIndices)&&
    temporalMatte?.alertFrameIndices.length===0,'temporal-matte-continuity-proof-failed');
 return {schema:'sues-b02-evidence-closure/v1',sceneId:'scene-02',operationId:'shot-2-2',
  technicalReady:failures.length===0,technicalFailures:failures,
  photoAndVoiceOriginalsPreserved:failures.length===0,fullReelCompleted:false,
  cinematicQA:false,approvedByCarlos:false,publiclyPublished:false,
  creativeBlockers:REQUIREMENTS,
  note:'This proof combines distinct methods and never implies approval of appearance, subtitles, licensing or full Reel.'};
}
