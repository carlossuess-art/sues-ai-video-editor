/** Attach an authentic, already downloaded B01 stock clip to the FULL, editable
 * SUES review project (never production), preserving the 49-operation ledger.
 * Its general Pexels license is not a model release or cinematic acceptance.
 * Reversible preview only; no license, face, or voice is fabricated.
 */
const B01='e7cd8569daba11abf7065ebd8f881002630bbb04dc830e6334f51de199ed820a';
const ID='sues_b01_applause_pexels_review_only';
const MEDIA='m_sues_b01_pexels_40772168_review_only';
const NAME='sues-B01-applause-pexels-40772168-2_4s-QA.mp4';
const fail=(s)=>{throw Error('SUES B01 preview candidate: '+s)};
export function stageReel158404B01Candidate(project,crosswalk,gap,{fileSha256,fileBytes,videoEvidence}={}){
 if(!project||project.width!==1080||project.height!==1920||project.fps!==30||
    !Number.isInteger(project.revision)||!Array.isArray(project.clips)||project.clips.length!==8||
    !Array.isArray(project.media)||project.media.length!==9||!Array.isArray(project.markers))fail('unexpected full native FableCut review project');
 if(crosswalk?.schema!=='sues-native-reel-review-bridge/v1'||crosswalk.operationCount!==49||
    crosswalk.pendingUninstantiatedOperations!==31||crosswalk.stagedFableCutRevision>project.revision||
    crosswalk.originalSourceSha256!=='9e06f49c30731d8a57aed312cfb46281bcffb7b3d5d62bf5a2164333944ccaad'||
    crosswalk.sourceDurationSeconds!==73.766667||crosswalk.guardrails?.noArtisticApproval!==true||
    crosswalk.originalVoiceSha256!=='4ef5fdaa558de448dcc8f42bfd69cbbc6f41e1d7df99c977ae55731f55fb70c0'||
    crosswalk.operations?.length!==49)fail('missing exact source/voice/49-op provenance');
 const planned=gap?.resources?.find(x=>x.id==='B01');const operation=gap?.operations?.find(x=>x.operationId==='shot-1-2');
 const mapped=crosswalk.operations.find(x=>x.operationId==='shot-1-2');
 if(!planned||planned.assetId!==B01||planned.kind!=='video'||planned.source!=='library'||
    !operation||operation.track!=='broll'||operation.start!==3.2||operation.end!==5.6||
    mapped?.state!=='NOT_STAGED'||mapped.planStart!==3.2||mapped.planEnd!==5.6||
    fileSha256!==B01||fileBytes!==1312406||videoEvidence?.codec!=='h264'||
    videoEvidence?.width!==1080||videoEvidence?.height!==1920||videoEvidence?.fps!==30||
    videoEvidence?.duration!==2.4||videoEvidence?.frames!==72)
    fail('Pexels B01 file, format, duration or expected source fingerprint did not verify');
 if(project.clips.some(x=>x.id===ID)||project.media.some(x=>x.id===MEDIA)||
   project.clips.some(x=>x.id==='sues_alpha_hand_review_only'&&x.disabled!==true)||
   project.clips.some(x=>x.id==='sues_title_after_word'&&x.disabled!==true)||
   project.clips.some(x=>x.id==='sues_hyperframes_gold_3d_review_only'&&x.disabled!==true))
   fail('unsafe existing clip or unapproved overlays enabled');
 const src=project.clips.find(x=>x.id==='sues_video_source'),voice=project.clips.find(x=>x.id==='sues_audio_original'),b02=project.clips.find(x=>x.id==='sues_b02_child_review_only');
 if(!src?.locked||!voice?.locked||src.duration!==73.766667||voice.duration!==73.766667||
    project.clips.filter(c=>!c.disabled&&c.track==='V2').some(c=>c.id!=='sues_b02_child_review_only')||
    b02?.start!==9.5||b02?.duration!==4)fail('protected voice, source, or B02 layout altered');
 const native=structuredClone(project),proof=structuredClone(crosswalk);
 native.revision++;
 native.name='SUES REEL 158404 · B01 + B02 native candidate · 7 scenes / 49 ops · NOT APPROVED';
 native.media.push({id:MEDIA,name:'B01 · Pexels 40772168 applause · QA only, rights context review',kind:'video',
   src:'/media/'+NAME,duration:2.4,width:1080,height:1920,size:fileBytes,fps:30,folderId:null});
 native.clips.push({id:ID,mediaId:MEDIA,kind:'video',track:'V2',start:3.2,in:0,duration:2.4,
   name:'B01 · audience applause · full-frame candidate · 0.2s IN/OUT fades · NOT APPROVED',
   props:{...structuredClone(src.props),x:0,y:0,scale:1,rotation:0,opacity:1,volume:0,pan:0,fit:'cover',blend:'normal',matte:'none'},
   transitionIn:{type:'fade',duration:0.2},transitionOut:{type:'fade',duration:0.2}});
 native.markers.push({t:3.2,label:'B01 · verified Pexels stock · 72f preview candidate, not approved',color:'orange'});
 native.markers.sort((a,b)=>a.t-b.t);
 const row=proof.operations.find(x=>x.operationId==='shot-1-2');row.state='TECHNICAL_NATIVE_CANDIDATE';row.clipIds=[ID];
 row.reason='Verified Pexels ID 40772168 SHA, 72f; unapproved 2.4s full-screen candidate with 0.2s fades; model/property rights and semantic/artistic approval unresolved';
 row.renderProvenForFullOperation=false;
 proof.schema='sues-native-reel-review-bridge/v1';
 proof.status='PROVISIONAL_EDITABLE_NATIVE_TIMELINE_WITH_B01_CANDIDATE_NOT_FINAL';
 proof.stagedFableCutRevision=native.revision;
 proof.nativeMediaCount=native.media.length;proof.nativeClipCount=native.clips.length;
 proof.activeNativeClips=native.clips.filter(x=>!x.disabled).map(x=>x.id);
 proof.nativeMultilayerCandidateOperations++;
 proof.pendingUninstantiatedOperations--;
 proof.additionalCandidateResources=[{operationId:'shot-1-2',clipId:ID,assetSha256:B01,
   assetUrl:'https://www.pexels.com/video/audience-applauding-during-live-performance-40772168/',
   fileName:NAME,sourceType:'verified-derived-asset-from-existing-local-staging',durationSec:2.4,
   frameCount:72,fadeInFrames:6,fadeOutFrames:6,sourceAudioIncluded:false,
   generalLicense:'Pexels free commercial use with restrictions',thirdPartyConsentVerified:false,
   faceUseInContextApprovedByCarlos:false,cinematicApproval:false}];
 proof.limitations.push('B01 scene01 crowd footage includes recognisable viewers; suitability/endorsement/privacy require human review before public use');
 proof.limitations.push('B01 is an active QA preview only; valid 72f clip and fades do not establish cinematic adequacy');
 if(proof.operationCount!==49||proof.operations.length!==49||proof.pendingUninstantiatedOperations!==30||
    proof.nativeMultilayerCandidateOperations!==2||native.clips.length!==9||native.media.length!==10)
    fail('story operation conservation failed');
 return {nativeProject:native,crosswalk:proof};
}
export const B01_NATIVE_CANDIDATE={assetSha256:B01,mediaFilename:NAME,clipId:ID,mediaId:MEDIA};
