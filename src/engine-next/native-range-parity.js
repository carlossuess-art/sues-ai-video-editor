/** Evidence-only parity. Reference PNGs are original compositor pixels, not a creative specification. */
export function assessNativeRangeParity({fps,frames,start,ssimSamples,decodedFrameEvidence,exportAudioReport}={}){
 if(fps!==30||frames!==120||start!==9.5||!Array.isArray(ssimSamples)||ssimSamples.length!==3||
   !decodedFrameEvidence||decodedFrameEvidence.decodedFrames!==frames||
   !Array.isArray(exportAudioReport?.checks)||typeof exportAudioReport.ok!=='boolean')throw Error('Full B02 export evidence incomplete');
 const expected=[10,11.5,13];
 for(let i=0;i<expected.length;i++){
  const x=ssimSamples[i];if(x?.time!==expected[i]||!Number.isFinite(x.all)||x.all<0||x.all>1||
   typeof x.nativeFrameSha256!=='string'||!/^([a-f0-9]{64})$/.test(x.nativeFrameSha256))throw Error('Misaligned source vs export evidence');
 }
 const ssimMin=Math.min(...ssimSamples.map(x=>x.all));
 return {schema:'sues-b02-native-range-parity/v1',status:'TECHNICAL_EVIDENCE_ONLY_NOT_CINEMATIC_APPROVAL',
  windowStart:start,windowEnd:start+frames/fps,frames,fps,
  sampleTimes:expected,ssimMinimum:ssimMin,ssimMean:ssimSamples.reduce((a,x)=>a+x.all,0)/3,
  frameUniqueness:decodedFrameEvidence,
  audioReportOk:exportAudioReport.ok,
  technicalChecksPassed:exportAudioReport.ok&&ssimMin>=.95&&decodedFrameEvidence.decodedFrames===120,
  cinematicQA:false,
  notes:['Only three selected times visually compared, not every frame','SSIM cannot verify semantic quality, child visibility, silhouette edge halos or motion pacing','Audio must be heard; track loudness and delivery targets reviewed separately','A full 120-frame encode is not Reel publication approval']};
}