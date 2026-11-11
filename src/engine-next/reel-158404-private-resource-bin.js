/** Put SHA-verified EXISTING assets into a FableCut clone's library only.
 * No automatic clips; no attribution to users or creative rights assumed.
 * Verifiable operation IDs must remain exactly as in the 49-op crosswalk.
 */
export const VERIFIED_BIN_CANDIDATES=Object.freeze([
 Object.freeze({slot:'B04',sha256:'d7a08ba26273017bb574d4ecba21606d91cf8e004162682bc4c3fc2c1ca3efd0',filename:'sues-158404-B04-isolation-QA.jpg',sourceFilename:'B04_isolation_candidate.jpg',bytes:105320,kind:'image',width:1600,height:900,frames:1,status:'REQUIRES_IMAGE_RIGHTS_AND_CONTEXT',id:'m_sues_158404_B04_isolation_unapproved',operationId:'shot-4-2'}),
 Object.freeze({slot:'B05',sha256:'183381691cc4a14c2af50d445a5007f9334b586be1190493502f772b0627f888',filename:'sues-158404-B05-mirror-QA.jpg',sourceFilename:'B05_mirror_candidate.jpg',bytes:101697,kind:'image',width:1400,height:933,frames:1,status:'REQUIRES_IMAGE_RIGHTS_AND_TEMPORAL_MATTE',id:'m_sues_158404_B05_mirror_unapproved',operationId:'shot-5-2'}),
 Object.freeze({slot:'M03',sha256:'b2c06610e66bd920b8681c76ff8407f09a625965a5a7160c735b62a2ecfdf6e0',filename:'sues-158404-M03-text-only-reference-QA.mp4',sourceFilename:'M03_reconocerte_revisar.mp4',bytes:27189,kind:'video',width:1080,height:1920,frames:160,duration:5.333333,fps:30,status:'REFERENCE_ONLY_NOT_CINEMATIC_MOTION_APPROVED',id:'m_sues_158404_M03_reference_unapproved',operationId:'shot-5-3'}),
 Object.freeze({slot:'IMPACT',sha256:'36ca38a0502ad9c30db18053a2ddc78131f078c298f9a204fcf8d68a67687995',filename:'sues-158404-impact-thunder-QA.wav',sourceFilename:'SFX_whoosh_thunder_intro_original.wav',bytes:92238,kind:'audio',duration:.96,sampleRate:48000,channels:1,status:'REQUIRES_SOUND_RIGHTS_AND_TIMING_REVIEW',id:'m_sues_158404_intro_impact_unapproved',operationId:'impact-0000'}),
]);
const fail=s=>{throw Error('SUES private resource bin: '+s)};
export function stageVerifiedResourceBin(project,crosswalk,ledger,evidence){
 if(!project||!Array.isArray(project.clips)||project.clips.length!==9||!Array.isArray(project.media)||project.media.length!==10||
    project.width!==1080||project.height!==1920||project.fps!==30||!Number.isInteger(project.revision)||
    crosswalk?.schema!=='sues-native-reel-review-bridge/v1'||crosswalk.operationCount!==49||
    crosswalk.pendingUninstantiatedOperations!==30||crosswalk.nativeMultilayerCandidateOperations!==2||
    !Array.isArray(crosswalk.operations)||crosswalk.operations.length!==49||
    ledger?.schema!=='sues-engine-next-gap-ledger/v1'||ledger.operations?.length!==49||ledger.resources?.length!==10)
  fail('not a complete, unapproved B01+B02 native FableCut review project and gap ledger');
 if(project.clips.find(c=>c.id==='sues_video_source')?.locked!==true||
    project.clips.find(c=>c.id==='sues_audio_original')?.locked!==true||
    project.inPoint!==0||project.outPoint!==73.766667||
    project.media.find(m=>m.id==='m_sues_158404_video')?.src!=='/media/sues-158404-original.mp4'||
    project.media.find(m=>m.id==='m_sues_158404_audio')?.src!=='/media/sues-158404-voice.m4a')
  fail('protected source or original voice no longer match');
 if(project.clips.some(c=>['sues_title_after_word','sues_alpha_hand_review_only','sues_hyperframes_gold_3d_review_only'].includes(c.id)&&c.disabled!==true))
  fail('unapproved future creative clip enabled');
 if(!Array.isArray(evidence)||evidence.length!==VERIFIED_BIN_CANDIDATES.length)
  fail('verified evidence missing');
 const copy=structuredClone(project),audit=structuredClone(crosswalk),records=[];
 for(const candidate of VERIFIED_BIN_CANDIDATES){
   const original=ledger.resources.find(r=>r.id===candidate.slot);
   const op=ledger.operations.find(x=>x.operationId===candidate.operationId);
   const mapped=audit.operations.find(x=>x.operationId===candidate.operationId);
   const e=evidence.find(x=>x.slot===candidate.slot);
   if(!original||original.assetId!==candidate.sha256||original.source!=='library'||original.kind!==(candidate.slot==='IMPACT'?'sfx':candidate.kind)||
      !op||op.assetId!==candidate.slot||mapped?.state!=='NOT_STAGED'||
      !e||e.sha256!==candidate.sha256||e.filename!==candidate.sourceFilename||e.bytes!==candidate.bytes||
      e.kind!==candidate.kind||e.width!==candidate.width||e.height!==candidate.height||
      (candidate.kind==='video'&&(e.frames!==candidate.frames||e.fps!==candidate.fps||Math.abs(e.duration-candidate.duration)>1e-6))||
      (candidate.kind==='audio'&&(e.sampleRate!==candidate.sampleRate||e.channels!==candidate.channels||e.duration!==candidate.duration))||
      copy.media.some(m=>m.id===candidate.id||m.src==='/media/'+candidate.filename))
      fail('missing or substituted verified resource '+candidate.slot);
   const item={id:candidate.id,name:`${candidate.slot} · verified local asset · LIBRARY ONLY / ${candidate.status}`,
     kind:candidate.kind,src:'/media/'+candidate.filename,size:candidate.bytes,folderId:null};
   if(candidate.width)item.width=candidate.width;
   if(candidate.height)item.height=candidate.height;
   if(candidate.duration)item.duration=candidate.duration;
   if(candidate.fps)item.fps=candidate.fps;
   copy.media.push(item);
   mapped.libraryAssetId=candidate.id;
   mapped.libraryCandidateAvailable=true;
   mapped.libraryCandidateAssetSha256=candidate.sha256;
   mapped.libraryCandidateRestrictions=candidate.status;
   mapped.reason+='; candidate located by SHA in private media BIN ONLY, not staged on timeline or approved';
   records.push({slot:candidate.slot,sha256:candidate.sha256,mediaId:item.id,
     filename:candidate.filename,sourceFilename:candidate.sourceFilename,
     operationId:candidate.operationId,frameCount:candidate.frames||null,
     temporalSeconds:candidate.duration||null,status:candidate.status,
     sourceOriginalContentUnmodified:true,licenseVerified:false,thirdPartyRightsVerified:false,
     creativeApproved:false,timelineClipCreated:false});
 }
 if(copy.media.length!==14||copy.clips.length!==9||audit.operations.length!==49||
    copy.clips.filter(c=>!c.disabled).length!==6||records.length!==4)
    fail('source or creative clip count changed unexpectedly');
 copy.revision++;copy.name='SUES 158404 · 7 scenes / 49 ops · 4 verified private bin candidates · NOT APPROVED';
 audit.stagedFableCutRevision=copy.revision;audit.nativeMediaCount=copy.media.length;
 audit.libraryOnlyCandidates=records;
 audit.limitations.push('Four new library entries are not timeline clips or artistically approved; their license and suitability are open');
 audit.limitations.push('M03 is text-only flat motion reference; does not fulfill the approved cinematic M03 narrative composition');
 audit.limitations.push('IMPACT asset duration .96s versus 1.10s planned; no timing/audio extension without human review');
 audit.limitations.push('B04 and B05 show identifiable subjects: do not imply endorsement or adverse real-person claims');
 if(audit.pendingUninstantiatedOperations!==30||audit.nativeMultilayerCandidateOperations!==2)
   fail('unexpected operation status changes');
 return {nativeProject:copy,crosswalk:audit,availability:{
   schema:'sues-158404-private-asset-bin-audit/v1',assetCount:records.length,items:records,
   activeClipsAdded:0,all49OperationsPreserved:true,productionChanged:false,
   userApproval:false,noMediaGenerated:true,sourceAndVoiceUnchanged:true,
   status:'MEDIA_BYTES_AVAILABLE_LICENSE_AND_ART_PENDING',
 }};
}
