/** Validates identity and time span of a temporal matte candidate; never approves its visual edges. */
export function validateTemporalMatteEvidence(report,probe,{sourceSha256,expectedStart,expectedFrames}={}) {
 const sha=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
 if(report?.schema!=='sues-modnet-temporal-candidate/v1'||report.status!=='CANDIDATE_NOT_VERIFIED'||
   !sha(report.sourceSha256)||!sha(report.modelSha256)||!sha(report.outputSha256)||
   (sourceSha256&&report.sourceSha256!==sourceSha256)||
   !Number.isInteger(report.frames)||report.frames<1||report.frames>120||report.fps!==30||
   report.width!==512||report.height!==896||
   !Number.isFinite(report.startSeconds)||report.startSeconds<0||
   Math.abs(report.startSeconds*30-Math.round(report.startSeconds*30))>1e-6||
   Math.abs(report.durationSeconds-report.frames/30)>1e-6||
   !Number.isFinite(report.coverageMin)||!Number.isFinite(report.coverageMax)||
   report.coverageMin<0||report.coverageMax>1||report.coverageMin>report.coverageMax||
   (expectedFrames!==undefined&&report.frames!==expectedFrames)||
   (expectedStart!==undefined&&report.startSeconds!==expectedStart))throw Error('Matte candidate evidence mismatch');
 if(!probe||probe.codec_name!=='ffv1'||probe.pix_fmt!=='gray'||probe.width!==512||probe.height!==896||Number(probe.nb_frames)!==report.frames)throw Error('Matte stream mismatch');
 return {status:'TEMPORAL_SOURCE_ALIGNED_CANDIDATE_NOT_VISUALLY_APPROVED',frames:report.frames,
   start:report.startSeconds,end:report.startSeconds+report.durationSeconds,
   coverageRange:[report.coverageMin,report.coverageMax],visualQA:false,
   notes:['No full-frame alpha compositing tested','No matte edge or motion continuity validated','No human approval or release']};
}