/** First-frame export vs native compositor diagnostic. Never imply cinematic approval. */
export function checkExportParityEvidence({video,ssim,expectedFrames,expectedWidth=1080,expectedHeight=1920,expectedFps=30}={}){
 if(!video||video.width!==expectedWidth||video.height!==expectedHeight||video.codec_name!=='h264'||
    video.r_frame_rate!==`${expectedFps}/1`||Number(video.nb_frames)!==expectedFrames||
    !Number.isInteger(expectedFrames)||expectedFrames<1||expectedFrames>9000||
    !ssim||typeof ssim.all!=='number'||!Number.isFinite(ssim.all)||ssim.all<0||ssim.all>1)
   throw Error('Native export evidence missing or inconsistent');
 return {schema:'sues-native-preview-export-parity/v1',status:'QUANTITATIVE_EVIDENCE_ONLY_NOT_CINEMATIC_QA',
  width:video.width,height:video.height,frames:expectedFrames,fps:expectedFps,ssimFirstFrame:ssim.all,
  highSimilarity: ssim.all>=.95,
  cinematicQA:false,notes:['First-frame comparison only; no continuous 120-frame mask QA',
  'H.264 is lossy; SSIM does not verify correct character occlusion, alpha edges, or semantic quality',
  'Audio true peak and user approval must be audited independently']};
}