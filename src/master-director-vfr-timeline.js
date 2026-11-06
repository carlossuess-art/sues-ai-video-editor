// Read-only, deterministic CFR30 sampling proposal for VFR source. This is
// diagnostic evidence, NOT authorization to replace the source or render.
import {createHash} from 'node:crypto';
const HASH=/^[a-f0-9]{64}$/;
const fail=(code,detail)=>({status:'BLOCKED',issues:[{code,...(detail?{detail}:{})}]});
export function proposeVfrCfr30Map({sourceSha256,frames,sourceDuration,audioStart,audioDuration}={}){
 if(!HASH.test(sourceSha256??'')||!Array.isArray(frames)||frames.length<2||frames.length>108000||
   !Number.isFinite(sourceDuration)||sourceDuration<=0||sourceDuration>3600||
   !Number.isFinite(audioStart)||Math.abs(audioStart)>.002||!Number.isFinite(audioDuration)||audioDuration<sourceDuration-.05)
  return fail('VFR_EVIDENCE_INCOMPLETE');
 const pts=[];
 for(let i=0;i<frames.length;i++){
  const raw=frames[i]?.best_effort_timestamp_time;
  const t=typeof raw==='string'&&raw.trim()?Number(raw):NaN;
  if(!Number.isFinite(t)||t<-.002||(i===0&&Math.abs(t)>.002)||(i&&t<=pts[i-1]))return fail('VFR_PTS_INVALID',{frame:i});
  pts.push(t);
 }
 // Record no guessed timeline beyond the last video frame without an explicit
 // end time. Derived output may duplicate frames but must never extrapolate >150ms.
 if(sourceDuration<pts.at(-1)||sourceDuration-pts.at(-1)>.15)return fail('VFR_END_UNVERIFIED');
 const outputCount=Math.round(sourceDuration*30);
 if(outputCount<1||outputCount>108000||Math.abs(outputCount/30-sourceDuration)>.017)
  return fail('VFR_DURATION_NOT_FRAME_ALIGNED');
 const samples=[];let i=0,previous=-1,duplicateCount=0,skippedCount=0;
 for(let n=0;n<outputCount;n++){
  const time=n/30;
  while(i+1<pts.length&&pts[i+1]<=time+0.0000001)i++;
  if(time-pts[i]>.15)return fail('VFR_GAP_EXCEEDS_POLICY',{outputFrame:n});
  if(i===previous)duplicateCount++;
  else if(previous>=0)skippedCount+=Math.max(0,i-previous-1);
  samples.push(i);previous=i;
 }
 const segments=[];
 for(let n=0;n<samples.length;n++){
  const last=segments.at(-1);
  if(last?.sourceFrame===samples[n])last.endFrame=n+1;
  else segments.push({startFrame:n,endFrame:n+1,sourceFrame:samples[n],sourcePts:pts[samples[n]]});
 }
 const mappingSha256=createHash('sha256').update(JSON.stringify({sourceSha256,sourceDuration,pts,samples})).digest('hex');
 return {status:'VFR_DERIVATION_PROPOSED_NOT_APPROVED',issues:[],schema:'sues-source-vfr-map/v1',
  sourceSha256,sourceDuration,sourceFrameCount:frames.length,targetFps:30,targetFrameCount:outputCount,
  mappingSha256,duplicateCount,skippedCount,segments,
  requires:['CFR_DERIVED_SHA256','OUTPUT_FRAME_BY_FRAME_CHECK','AUDIO_SYNC_EVIDENCE','REVIEW_AND_NEW_APPROVAL']};
}