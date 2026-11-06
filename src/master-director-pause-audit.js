// Evidence-only cut safety audit for SUES Film Director. Never edits media.
// The 0.67s retention is a technical floor, not an aesthetic permission.
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const fixed=n=>Math.round(n*1e6)/1e6;
const blocked=(code,details={})=>({status:'BLOCKED',code,...details,approved:false,canExecute:false});
export function auditMasterPauseCandidates({words,candidates,duration,fps=30,minRetainedSeconds=.67}={}){
 if(!Array.isArray(words)||!words.length||words.length>30000||!Array.isArray(candidates)||candidates.length>60||
   !finite(duration)||duration<=0||duration>3600||fps!==30||!finite(minRetainedSeconds)||minRetainedSeconds<.5||minRetainedSeconds>.9)
  return blocked('INVALID_AUDIT_INPUT');
 const speech=words.map((w,i)=>({i,start:w?.start,end:w?.end,text:w?.text}));
 if(speech.some(w=>!finite(w.start)||!finite(w.end)||w.start<0||w.start>=w.end||w.end>duration+.01||typeof w.text!=='string'||!w.text.trim()))
  return blocked('UNTRUSTED_TRANSCRIPT');
 const sorted=[...speech].sort((a,b)=>a.start-b.start||a.end-b.end);
 const results=[];
 for(const [i,c] of candidates.entries()){
  if(!c||!finite(c.start)||!finite(c.end)||c.start<0||c.end>duration||c.start>=c.end||
     Object.keys(c).some(k=>!['start','end','expressive'].includes(k))||
     c.expressive!==undefined&&typeof c.expressive!=='boolean'){
   results.push({index:i,...blocked('INVALID_CUT')});continue;
  }
  const startFrame=Math.round(c.start*fps),endFrame=Math.round(c.end*fps),start=startFrame/fps,end=endFrame/fps;
  if(endFrame<=startFrame||end>duration+.000001){results.push({index:i,...blocked('CUT_WITHOUT_COMPLETE_FRAME')});continue;}
  if(i&&c.start<candidates[i-1]?.end){results.push({index:i,...blocked('OVERLAPPING_CUTS')});continue;}
  const overlapping=sorted.filter(w=>w.start<end-1e-6&&w.end>start+1e-6);
  const previous=[...sorted].reverse().find(w=>w.end<=start+1e-6);
  const following=sorted.find(w=>w.start>=end-1e-6);
  const metadata={index:i,startFrame,endFrame,alignedStart:fixed(start),alignedEnd:fixed(end),durationFrames:endFrame-startFrame,
   previousWord:previous?.text??null,nextWord:following?.text??null};
  if(overlapping.length){results.push({...metadata,...blocked('OVERLAPS_SPEECH',{overlappingWords:overlapping.map(w=>w.i)})});continue;}
  if(!previous||!following){results.push({...metadata,...blocked('UNBOUNDED_SPEECH_GAP')});continue;}
  const gap=following.start-previous.end,remaining=gap-(end-start);
  metadata.originalGapSeconds=fixed(gap);metadata.remainingGapSeconds=fixed(remaining);
  if(gap<=.7+1e-6){results.push({...metadata,...blocked('NO_EXCESS_PAUSE')});continue;}
  if(remaining<minRetainedSeconds-1e-6){results.push({...metadata,...blocked('INSUFFICIENT_RETAINED_PAUSE')});continue;}
  results.push({...metadata,status:c.expressive?'EXPRESSIVE_PAUSE_LISTEN_FIRST':'PENDING_PERCEPTUAL_QA',
   code:c.expressive?'EXPRESSIVE_PAUSE_UNVERIFIED':'AUDIO_LISTENING_REQUIRED',approved:false,canExecute:false});
 }
 return {schema:'sues-master-pause-candidates-qa/v1',status:'REVIEW_ONLY_NOT_APPROVED',
  sourceDurationSeconds:duration,fps,minimumRetainedSeconds:minRetainedSeconds,
  reviewedCandidates:results.length,technicalCandidates:results.filter(x=>x.status==='PENDING_PERCEPTUAL_QA').length,
  expressiveCandidates:results.filter(x=>x.status==='EXPRESSIVE_PAUSE_LISTEN_FIRST').length,
  blockedCandidates:results.filter(x=>x.status==='BLOCKED').length,
  candidates:results,approved:false,canExecute:false};
}

// Deterministic candidates from observed word gaps; these are suggestions ONLY.
// There is no automatic cut or inferential claim that any pause lacks meaning.
export function suggestMasterPauseCandidates(words,{fps=30,minRetainedSeconds=.67,limit=60}={}){
 if(!Array.isArray(words)||!Number.isInteger(limit)||limit<1||limit>60||fps!==30)return [];
 const sorted=[...words].filter(w=>finite(w?.start)&&finite(w?.end)&&w.start>=0&&w.end>w.start)
  .sort((a,b)=>a.start-b.start||a.end-b.end);
 const out=[];
 for(let i=1;i<sorted.length&&out.length<limit;i++){
  const previous=sorted[i-1],next=sorted[i],gap=next.start-previous.end;
  if(gap<=.7+1e-6)continue;
  const frames=Math.floor((gap-minRetainedSeconds)*fps+1e-6);
  if(frames<=0)continue;
  const first=Math.ceil(previous.end*fps-1e-7),last=Math.floor(next.start*fps+1e-7);
  const count=Math.min(frames,last-first);
  if(count<=0)continue;
  const startFrame=Math.max(first,Math.min(last-count,Math.round((previous.end+(gap-count/fps)/2)*fps)));
  out.push({start:fixed(startFrame/fps),end:fixed((startFrame+count)/fps)});
 }
 return out;
}
