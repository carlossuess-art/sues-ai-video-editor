/** Pure, scene-specific audit requirements. A technical pass is never an art pass. */
export function checkB02FullWindowInputs({project,job,video,audio,hashes,refs}={}) {
 if(!project||project.inPoint!==9.5||project.outPoint!==13.5||project.width!==1080||project.height!==1920||project.fps!==30||!Array.isArray(project.clips))
  throw Error('Wrong B02 in/out window or scene canvas');
 const ids=new Set(project.clips.map(x=>x.id));
 for(const id of ['sues_video_source','sues_audio_original','sues_b02_child_review_only','sues_b02_carlos_foreground_luma_qa','sues_b02_temporal_luma_qa','sues_hyperframes_gold_3d_review_only'])
  if(!ids.has(id))throw Error('Missing B02 native scene layer: '+id);
 const clip=id=>project.clips.find(x=>x.id===id);
 if(!clip('sues_video_source').locked||!clip('sues_audio_original').locked||clip('sues_hyperframes_gold_3d_review_only').disabled!==true)
  throw Error('Unprotected source/voice or experimental gold not disabled');
 for(const id of ['sues_b02_child_review_only','sues_b02_carlos_foreground_luma_qa','sues_b02_temporal_luma_qa'])
  if(clip(id).start!==9.5||clip(id).duration!==4||clip(id).disabled===true)throw Error('Wrong native B02 layer placement');
 if(clip('sues_b02_carlos_foreground_luma_qa').props?.matteTrack!==clip('sues_b02_temporal_luma_qa').track)
  throw Error('Missing live temporal foreground matte');
 const j=job?.job??job;
 if(!j||j.status!=='done'||j.range!=='in-out'||j.progress!==1||job?.browserErrors?.length)throw Error('No successful native FableCut job evidence');
 const results=j.result?.outputs;
 if(!Array.isArray(results)||results.length!==1||results[0]?.ok!==true||results[0]?.report?.ok!==true||
  !Array.isArray(results[0].report.checks)||results[0].report.checks.some(x=>x.ok!==true))
  throw Error('Native export report failed some checks');
 if(!video||video.codec_name!=='h264'||video.width!==1080||video.height!==1920||
  !['30/1','30'].includes(video.avg_frame_rate)||Number(video.nb_read_frames)!==120||Math.abs(Number(video.duration)-4)>0.03)
  throw Error('Wrong 120-frame native H264 video');
 if(!audio||audio.codec_name!=='aac'||Number(audio.sample_rate)!==48000||Number(audio.channels)!==2||Math.abs(Number(audio.duration)-4)>0.12)
  throw Error('Wrong native AAC voice/audio stream');
 if(!hashes||hashes.decodedFrames!==120||hashes.distinctFrames!==120||hashes.adjacentDuplicateFrames!==0)
  throw Error('B02 moving foreground export includes missing or duplicate frames');
 if(!Array.isArray(refs)||refs.length!==3||refs.some((x,i)=>x?.time!==[10,11.5,13][i]||!Number.isFinite(x.all)||x.all<0||x.all>1||!(/^[a-f0-9]{64}$/).test(x.nativeFrameSha256||'')))
  throw Error('Missing aligned native-canvas SSIM samples');
 const highSampledSimilarity=refs.every(x=>x.all>=.95);
 return {ok:true,technicalChecksPassed:highSampledSimilarity,frameCount:120,frameRate:30,window:[9.5,13.5],
  sampleTimes:[10,11.5,13],sampleCount:3,ssimMinimum:Math.min(...refs.map(x=>x.all)),
  visualSimilarityThreshold:.95,highSampledSimilarity,
  noDuplicateDecodedFrames:true,nativeReportOk:true,
  status:'TECHNICAL_PROOF_ONLY_NOT_CINEMATIC_QA',cinematicQA:false,
  notes:['Three samples do not establish perceptual correctness of all 120 frames',
   'No automated test approves child visibility, hair edge halos, masks, transcribed speech, voice mix or artistic intent',
   'Gold is disabled in a separate QA variant only; production and creative plan are unmodified']};
}
