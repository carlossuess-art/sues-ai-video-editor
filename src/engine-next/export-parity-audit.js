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

/** Diagnostics only: adjacent repeated decoded frames may be intentional holds. */
export function summarizeDecodedFrameHashes(framemd5,{expectedFrames}={}) {
 if(typeof framemd5!=="string" || !Number.isInteger(expectedFrames)||expectedFrames<1)throw Error('Expected frame stream and count');
 const hashes=framemd5.split('\n').filter(x=>/^\s*\d+\s*,/.test(x)).map(line=>line.split(',').at(-1)?.trim()).filter(Boolean);
 if(hashes.length!==expectedFrames||hashes.some(h=>!/^[a-f0-9]{32}$/.test(h)))throw Error('Decoded frame hashes incomplete');
 const unique=new Set(hashes).size;
 const adjacentDuplicates=hashes.reduce((n,x,i)=>n+(i>0&&x===hashes[i-1]?1:0),0);
 return {decodedFrames:hashes.length,distinctFrames:unique,adjacentDuplicateFrames:adjacentDuplicates,
  cinematicQA:false,notes:'Repeated frames are diagnostic, not automatically a failure; deliberate static shots may repeat.'};
}