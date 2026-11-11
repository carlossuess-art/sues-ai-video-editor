// Verifies an explicitly produced CFR derivative and audit receipts. Does not
// activate a source, transfer a plan approval or authorize any render.
import {readFileSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileSha256} from './local-pipeline.js';
const HASH=/^[a-f0-9]{64}$/;
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;
const blocked=code=>({status:'BLOCKED',canExecute:false,issues:[{code}]});
export function reviewMasterVfrDerivationEvidence({originalPath,derivedPath,visualPath,audioPath,cfrPath}={}){
 if(![originalPath,derivedPath,visualPath,audioPath,cfrPath].every(p=>typeof p==='string'&&p.startsWith('/'))||originalPath===derivedPath)
  return blocked('VFR_EVIDENCE_INPUT_INVALID');
 try{
  const visual=JSON.parse(readFileSync(visualPath,'utf8')),
    audio=JSON.parse(readFileSync(audioPath,'utf8')),
    cfr=JSON.parse(readFileSync(cfrPath,'utf8'));
  const originalSha256=fileSha256(originalPath),derivedSha256=fileSha256(derivedPath);
  if(!HASH.test(originalSha256)||!HASH.test(derivedSha256)||originalSha256===derivedSha256||
    visual.schema!=='sues-vfr-derived-evidence/v1'||visual.approved!==false||visual.creativeAccepted!==false||
    visual.originalSha256!==originalSha256||visual.derivedSha256!==derivedSha256||
    !HASH.test(visual.evidenceFingerprint??''))return blocked('VFR_LINEAGE_IDENTITY_UNVERIFIED');
  const unsigned={...visual};delete unsigned.evidenceFingerprint;
  if(createHash('sha256').update(JSON.stringify(stable(unsigned))).digest('hex')!==visual.evidenceFingerprint)
   return blocked('VFR_VISUAL_MANIFEST_CHANGED');
  const map=visual.mapping;
  if(visual.status!=='FRAME_CORRESPONDENCE_PASS_LOW_RES_NOT_APPROVAL'||
    !Array.isArray(map)||map.length!==visual.targetFrames||map.length<1||map.length>108000||
    !Number.isInteger(visual.sourceFrames)||visual.sourceFrames<2||
    !map.every((i,n)=>Number.isInteger(i)&&i>=0&&i<visual.sourceFrames&&(n===0||i>=map[n-1]))||
    visual.monotone!==true||visual.meanSampledPixelError>=2||visual.maxSampledPixelError>=4||
    visual.maxTemporalOffsetMs>150||visual.downscaledWidth!==54||visual.downscaledHeight!==96||visual.pixelStride!==16)
   return blocked('VFR_FRAME_CORRESPONDENCE_UNVERIFIED');
  const windows=audio.windows;
  if(audio.status!=='SIGNAL_TIMING_PASS_NOT_LISTENING'||audio.sampleRate!==8000||
    !Array.isArray(windows)||windows.length!==3||windows.some((w,i)=>w.atSecond!==[5,34,65][i]||
    !Number.isFinite(w.correlation)||w.correlation<.92||!Number.isInteger(w.lagMs)||Math.abs(w.lagMs)>40)||
    Math.max(...windows.map(w=>w.lagMs))-Math.min(...windows.map(w=>w.lagMs))>20||
    audio.sourceSamples!==audio.derivedSamples)return blocked('VFR_AUDIO_SIGNAL_UNVERIFIED');
  if(cfr.schema!=='sues-vfr-derived-cfr-probe/v1'||cfr.status!=='SOURCE_CFR30_VERIFIED'||
    cfr.sourceTiming!=='cfr30-verified'||cfr.sourceHasAudio!==true||cfr.humanReview!==false||
    cfr.derivedSha256!==derivedSha256||cfr.frameCount!==visual.targetFrames||
    !Number.isFinite(cfr.sourceDuration)||Math.abs(cfr.sourceDuration*30-cfr.frameCount)>0.0001||
    cfr.width!==1080||cfr.height!==1920)return blocked('VFR_DERIVED_CFR_UNVERIFIED');
  const sourceSize=statSync(originalPath).size,derivedSize=statSync(derivedPath).size;
  if(!sourceSize||!derivedSize)return blocked('VFR_EMPTY_MEDIA');
  // Rehash to detect modifications while checking the independent receipts.
  if(fileSha256(originalPath)!==originalSha256||fileSha256(derivedPath)!==derivedSha256)
   return blocked('VFR_MEDIA_CHANGED_DURING_REVIEW');
  return {status:'DERIVATION_EVIDENCE_READY_REVIEW_REQUIRED',canExecute:false,issues:[],
   originalSha256,derivedSha256,sourceBytes:sourceSize,derivedBytes:derivedSize,
   sourceFrameCount:visual.sourceFrames,derivedFrameCount:visual.targetFrames,
   derivedDuration:cfr.sourceDuration,visualEvidenceFingerprint:visual.evidenceFingerprint,
   audioStatus:audio.status,requires:['EXPLICIT_SOURCE_VERSION_REGISTRATION','REBASE_TIME_MAP',
    'EXTERNAL_PLAN_REVIEW_AND_NEW_APPROVAL','FULL_AUDIOVISUAL_QA','TWO_CLEAN_AUDITS']};
 }catch{return blocked('VFR_EVIDENCE_UNREADABLE');}
}
