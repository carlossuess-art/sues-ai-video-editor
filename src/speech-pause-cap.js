/** SUES spoken-phrase pause policy. Voice timestamps drive cuts, never a loudness
 * gate: music, ambience and SFX can be audible during a speech pause.
 * Only internal word gaps are trimmed. Intros/outros remain intact.
 */
export const MAX_SPEECH_PAUSE_SECONDS=0.7;
const round=n=>Math.round(n*1e6)/1e6;
export function capSpeechPauses(transcript,{limitSeconds=MAX_SPEECH_PAUSE_SECONDS,fps=30,guardSeconds=.04,maxCuts=60}={}){
 if(!transcript||!Array.isArray(transcript.words)||!Number.isFinite(transcript.sourceDuration)||transcript.sourceDuration<=0)
  throw Error('Pause cap requires verified transcript with duration');
 if(!Number.isFinite(limitSeconds)||limitSeconds<.3||limitSeconds>2||!Number.isInteger(fps)||fps<24||fps>120)
  throw Error('Pause cap invalid seconds/fps');
 const cuts=[],details=[],warnings=[];let lastEnd=0;
 for(let i=0;i<transcript.words.length;i++){
  const w=transcript.words[i];
  if(!w||![w.start,w.end].every(Number.isFinite)||w.start<0||w.end<=w.start||w.end>transcript.sourceDuration||w.start<lastEnd-.02)
   throw Error('Pause cap transcript not monotonically timed');
  lastEnd=w.end;
  if(i===0)continue;
  const prev=transcript.words[i-1],gap=w.start-prev.end;
  if(gap<=limitSeconds+1e-8)continue;
  if(prev.timingUncertain||w.timingUncertain){
   warnings.push({wordIndex:i,gapSeconds:round(gap),reason:'uncertain speech boundaries; manual review'});continue;
  }
  const removeFrames=Math.ceil((gap-limitSeconds-1e-9)*fps);
  const minStart=Math.ceil((prev.end+guardSeconds)*fps-1e-9);
  const maxEnd=Math.floor((w.start-guardSeconds)*fps+1e-9);
  const desiredStart=Math.round(((prev.end+w.start)*fps-removeFrames)/2);
  const startFrame=Math.max(minStart,Math.min(desiredStart,maxEnd-removeFrames));
  const endFrame=startFrame+removeFrames;
  if(startFrame<minStart||endFrame>maxEnd||removeFrames<=0){
   warnings.push({wordIndex:i,gapSeconds:round(gap),reason:'insufficient clean gap at frame boundaries'});continue;
  }
  cuts.push({start:round(startFrame/fps),end:round(endFrame/fps)});
  details.push({wordIndex:i,before:prev.text,after:w.text,originalGapSeconds:round(gap),keptGapSeconds:round(gap-removeFrames/fps),cutFrames:removeFrames});
 }
 if(cuts.length>maxCuts)throw Error('Pause cap exceeds editor cut limit; needs a segment-based render');
 const removedFrames=details.reduce((n,d)=>n+d.cutFrames,0);
 const remainingGaps=details.filter(d=>d.keptGapSeconds>limitSeconds+.002);
 if(remainingGaps.length)throw Error('Pause cap did not achieve required maximum');
 return {policy:'sues-speech-pause-cap-v1',limitSeconds,fps,sourceDuration:transcript.sourceDuration,
  cuts,details,warnings,removedFrames,removedSeconds:round(removedFrames/fps),outputDuration:round(transcript.sourceDuration-removedFrames/fps)};
}
export function mapSourceTimeAfterPauseCuts(time,cuts){
 if(!Number.isFinite(time)||time<0)throw Error('Invalid source timestamp');
 let removed=0;
 for(const cut of cuts){
  if(time>=cut.end)removed+=cut.end-cut.start;
  else if(time>cut.start)return round(cut.start-removed);
  else break;
 }
 return round(time-removed);
}
