/** Build a single editable 7-scene NLE *review project*, retaining all 49
 * operation IDs in an auditable sidecar. This is NOT a finished Reel, master
 * story compiler, licensed asset resolver, or artistic approval.
 * Never materialize unlicensed/unverified graphics, titles or captions.
 */
const SOURCE_SHA='9e06f49c30731d8a57aed312cfb46281bcffb7b3d5d62bf5a2164333944ccaad';
const FPS=30, SCENES=['scene-01','scene-02','scene-03','scene-04','scene-05','scene-06','scene-07'];
const DAY='2026-11-08';
const expectedNames={
 'shot-2-2':['sues_b02_child_review_only','sues_b02_carlos_foreground_luma_qa','sues_b02_temporal_luma_qa'],
 'GIF-STOP-overlay':['sues_alpha_hand_review_only'],
 'title-1':['sues_title_after_word'],
};
const approvedDisabled=new Set(['sues_alpha_hand_review_only','sues_title_after_word','sues_hyperframes_gold_3d_review_only']);
const fail=(msg)=>{throw Error('SUES native assembly: '+msg)};
const at=(n)=>Number(n.toFixed(6));
const r3=n=>Math.round(n*1000)/1000;
export function stageReel158404NativeAssembly(project,gap,{actualSourceSha256,actualVoiceSha256}={}){
 if(!gap||gap.schema!=='sues-engine-next-gap-ledger/v1'||gap.storySchema!=='sues-master-story/v1'||
    gap.sceneCount!==7||gap.operationCount!==49||!Array.isArray(gap.operations)||gap.operations.length!==49||
    gap.sourceSha256!==SOURCE_SHA||gap.approvedByCarlos!==false)fail('incomplete or unexpectedly approved official gap ledger');
 if(!project||project.width!==1080||project.height!==1920||project.fps!==FPS||
    !Number.isInteger(project.revision)||!Array.isArray(project.clips)||!Array.isArray(project.media)||
    !Array.isArray(project.tracks)||project.clips.length!==8||project.media.length!==9||
    !/^[0-9a-f]{64}$/.test(actualVoiceSha256||'')||actualSourceSha256!==SOURCE_SHA)
    fail('unverified native FableCut project, source, or authentic voice fingerprint');
 const find=(id)=>project.clips.find(c=>c.id===id);
 const source=find('sues_video_source'),voice=find('sues_audio_original');
 const media=id=>project.media.find(m=>m.id===id);
 if(!source?.locked||source.kind!=='video'||source.track!=='V1'||source.start!==0||source.in!==0||
    source.mediaId!=='m_sues_158404_video'||media(source.mediaId)?.src!=='/media/sues-158404-original.mp4'||
    !voice?.locked||voice.kind!=='audio'||voice.track!=='A1'||voice.start!==0||voice.in!==0||
    voice.mediaId!=='m_sues_158404_audio'||media(voice.mediaId)?.src!=='/media/sues-158404-voice.m4a'||
    Math.abs(source.duration-73.766667)>0.000001||Math.abs(voice.duration-source.duration)>0.000001)
    fail('source or voice was re-timed, changed, unlocked, or replaced');
 if(project.clips.some(c=>!c?.id||c.start<0||c.duration<=0)||
    new Set(project.clips.map(c=>c.id)).size!==project.clips.length)fail('invalid native clip inventory');
 const b02=expectedNames['shot-2-2'].map(find);
 if(b02.some(x=>!x)||b02[0].track!=='V2'||b02[1].track!=='V3'||b02[2].track!=='V4'||
    b02.some(x=>x.start!==9.5||x.duration!==4)||b02[1].in!==9.5||b02[2].in!==0||
    b02[1].props?.matte!=='luma'||b02[1].props?.matteTrack!=='V4'||
    b02[0].transitionIn?.type!=='fade'||b02[0].transitionIn?.duration!==.3||
    b02[0].transitionOut?.type!=='fade'||b02[0].transitionOut?.duration!==.3||
    b02[0].props?.x!==180||b02[0].props?.y!==-250||b02[0].props?.scale!==.73||
    b02[0].mediaId!=='m_sues_b02_child_refined50_qa'||b02[2].mediaId!=='m_sues_b02_modnet_luma_qa')
    fail('validated B02 native track geometry/fades/matte are no longer the same candidate');
 for(const id of approvedDisabled)if(!find(id))fail('missing existing experimental layer '+id);
 const ids=new Set(),byScene=new Map(SCENES.map(s=>[s,[]]));
 for(const op of gap.operations){
  if(!op||typeof op.operationId!=='string'||!op.operationId||ids.has(op.operationId)||
     !byScene.has(op.sceneId)||!Number.isFinite(op.start)||!Number.isFinite(op.end)||
     op.start<0||op.end<=op.start||op.end>source.duration+1e-6||
     op.creativeApproved!==false||op.renderProven!==false)fail('missing/invalid or silently approved operation');
  ids.add(op.operationId);byScene.get(op.sceneId).push(op);
 }
 const sceneRanges=SCENES.map(s=>{
  const all=byScene.get(s),shots=all.filter(o=>o.operationId.startsWith('shot-')).sort((a,b)=>a.start-b.start);
  if(!shots.length)fail('scene with no source storytelling shots '+s);
  const start=shots[0].start,end=shots[shots.length-1].end;
  if(all.some(o=>o.start<start-1e-6||o.end>end+1e-6))fail('operation not covered by its scene '+s);
  for(let i=1;i<shots.length;i++)if(Math.abs(shots[i].start-shots[i-1].end)>0.000001)
    fail('unaccounted camera/broll gap inside '+s);
  return {sceneId:s,start,end,shotCount:shots.length,operationCount:all.length};
 });
 if(sceneRanges[0].start!==0||Math.abs(sceneRanges.at(-1).end-73.753467)>0.000001)
    fail('the 7-scene contract is not the original 73.753467 sec plan');
 for(let i=1;i<sceneRanges.length;i++)if(Math.abs(sceneRanges[i].start-sceneRanges[i-1].end)>1e-6)
    fail('story discontinuity between scenes');
 const clone=structuredClone(project);
 clone.name='SUES REEL 158404 · 7 scenes / 49 operation cues · EDITABLE REVIEW · NOT FINAL';
 clone.revision=project.revision+1;
 clone.inPoint=0;clone.outPoint=at(source.duration);
 for(const c of clone.clips)if(approvedDisabled.has(c.id))c.disabled=true;
 // Main editor ruler remains legible: scene starts + only meaningful insertions.
 // The full 49:49 ID crosswalk is kept in the sidecar, never squeezed into markers.
 const markers=[];
 for(let i=0;i<sceneRanges.length;i++){
  const sc=sceneRanges[i];markers.push({t:r3(sc.start),label:`S${String(i+1).padStart(2,'0')} | ${sc.operationCount} planned operations`,color:'cyan'});
 }
 for(const op of gap.operations){
  if(['broll','graphics'].includes(op.track)&&(
       op.operationId.startsWith('shot-')||op.operationId==='GIF-STOP-overlay'||op.operationId==='M01-overlay')){
    markers.push({t:r3(op.start),label:`${op.operationId} · ${op.status} · REVIEW`,color:op.track==='broll'?'orange':'purple'});
  }
 }
 markers.push({t:r3(sceneRanges.at(-1).end),label:'STORY END · 49 operations not yet rendered',color:'red'});
 // Preserve existing 3 native cues, including B02 and M02 resource/dependency notes.
 for(const m of project.markers||[])if(Number.isFinite(m.t)&&m.t>=0&&m.t<=source.duration)
   markers.push({...m,t:r3(m.t)});
 clone.markers=markers.sort((a,b)=>a.t-b.t||a.label.localeCompare(b.label));
 const crosswalk=gap.operations.map(op=>{
  let state='NOT_STAGED',clips=[],reason='Asset, renderer, semantic/audio review or native adaptor not verified';
  if(op.track==='camera'&&op.effect==='original-camera-visual'){
   state='AUTHENTIC_SOURCE_CONTINUOUS';clips=['sues_video_source'];
   reason='Original footage visible in one protected continuous V1 clip. This operation is NOT yet a separate approved shot, cut or effect';
  }else if(op.operationId==='shot-2-2'){
   state='TECHNICAL_NATIVE_CANDIDATE';clips=[...expectedNames[op.operationId]];
   reason='B02 Wide/temporal matte/fades native 120f technically tested; creative/hair/child occlusion approval outstanding';
  }else if(op.operationId==='GIF-STOP-overlay'){
   state='STAGED_DISABLED';clips=[...expectedNames[op.operationId]];
   reason='Real WebM alpha 29f exists but wrist edge, 1.10s plan vs .966s asset and licensing unresolved; keep layer disabled';
  }else if(op.operationId==='title-1'){
   state='STAGED_DISABLED';clips=[...expectedNames[op.operationId]];
   reason='Existing text clip is unverified against the real voice; disabled until semantic timing/source approval';
  }
  return {operationId:op.operationId,sceneId:op.sceneId,track:op.track,effect:op.effect,
   planStart:op.start,planEnd:op.end,plannedDuration:at(op.end-op.start),
   nearestFrameStart:Math.round(op.start*FPS),nearestFrameEnd:Math.round(op.end*FPS),
   startQuantizationErrorMs:at((Math.round(op.start*FPS)/FPS-op.start)*1000),
   endQuantizationErrorMs:at((Math.round(op.end*FPS)/FPS-op.end)*1000),
   state,clipIds:clips,reason,creativeApproved:false,renderProvenForFullOperation:false,
   sourceGapStatus:op.status,requiredAssetId:op.assetId||null};
 });
 for(const row of crosswalk){
  if(row.clipIds.some(id=>!clone.clips.some(c=>c.id===id)))fail('a crosswalk refers to missing native clip');
  if(row.state==='STAGED_DISABLED'&&row.clipIds.some(id=>clone.clips.find(c=>c.id===id)?.disabled!==true))
   fail('a disabled candidate was accidentally enabled');
 }
 const group=(state)=>crosswalk.filter(x=>x.state===state).length;
 const coverage={
  schema:'sues-native-reel-review-bridge/v1',status:'PROVISIONAL_EDITABLE_NATIVE_TIMELINE_NOT_REEL',day:DAY,
  originalSourceSha256:actualSourceSha256,originalVoiceSha256:actualVoiceSha256,
  sourceDurationSeconds:source.duration,plannedDurationSeconds:sceneRanges.at(-1).end,
  plannedEndVersusSourceEndMs:at((source.duration-sceneRanges.at(-1).end)*1000),
  allOperationsPreserved:true,sceneCount:sceneRanges.length,operationCount:crosswalk.length,
  originalFableCutRevision:project.revision,stagedFableCutRevision:clone.revision,
  nativeMediaCount:clone.media.length,nativeClipCount:clone.clips.length,
  activeNativeClips:clone.clips.filter(x=>!x.disabled).map(x=>x.id),
  disabledExperimentalClips:clone.clips.filter(x=>x.disabled).map(x=>x.id),
  cameraOperationsCoveredByContinuousSource:group('AUTHENTIC_SOURCE_CONTINUOUS'),
  nativeMultilayerCandidateOperations:group('TECHNICAL_NATIVE_CANDIDATE'),
  disabledLayerCandidates:group('STAGED_DISABLED'),
  pendingUninstantiatedOperations:group('NOT_STAGED'),
  scenes:sceneRanges,operations:crosswalk,
  guardrails:{
   sourceAndVoiceLocked:true,doNotClaimFullEdit:true,noFakeClipsForPendingOperations:true,
   noGeneratedImageOrFace:true,noMusicOrSubtitlesAdded:true,noArtisticApproval:true,
   exportUnprovenBeyondSampledIntervals:true,publicReleaseAllowed:false,productionChanged:false,
   originalMediaRetained:true,quantizationNotSilentlyApplied:true,
  },
  limitations:[
   'FableCut native clip UI cannot represent pending 49 operations simply because they are in a plan; sidecar is authoritative',
   'Continuous source/voice does not mean 15 authored camera cuts already executed',
   'B02 candidate is visible but not creatively accepted; B03 and title-1 remain disabled',
   'The 73.753467s story end differs by 13.2ms from the 73.766667s original media duration',
   'Many planned timestamps do not fall on exact 30fps boundaries; quantization requires a separate explicit policy',
   'No full 74-second render or cinematographic approval; only short intervals may be separately tested',
  ],
 };
 if(coverage.operationCount!==49||coverage.cameraOperationsCoveredByContinuousSource!==15||
    coverage.nativeMultilayerCandidateOperations!==1||coverage.disabledLayerCandidates!==2||
    coverage.pendingUninstantiatedOperations!==31)fail('incorrect or silently lost story operation coverage');
 return {nativeProject:clone,coverage};
}
