// Narrativa viral de reels: escenas ordenadas, caída y transformación, moraleja y CTA.
// This verifies declared evidence; it does NOT infer emotions from audio/video.
export const REEL_ARC_MINIMUM=Object.freeze([
 'hook','development','emotional-fall','transformation','moral','cta'
]);
export const REEL_ARC_WITH_SECOND_FALL=Object.freeze([
 'hook','development','emotional-fall','transformation',
 'second-fall','second-transformation','moral','cta'
]);
const validId=x=>typeof x==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/.test(x);
const issue=(list,code,beat='arc')=>list.push({code,beat});
const near=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<.000001;
export function auditMasterDirectorArc(narrative,registry={},timeline={}){
 const issues=[];
 if(!['reel-v1','reel-observed-v2'].includes(registry.arcPolicy))
  return {status:'NOT_APPLICABLE',issues:[],arc:[]};
 const observedOnly=registry.arcPolicy==='reel-observed-v2';
 const arc=narrative?.arc;
 if(!Array.isArray(arc)){
  issue(issues,'REEL_ARC_MISSING');return {status:'SCRIPT_REVIEW_REQUIRED',issues,arc:[]};
 }
 if(arc.length<(observedOnly?1:6)||arc.length>8){
  issue(issues,'REEL_ARC_SEQUENCE_INVALID');return {status:'SCRIPT_REVIEW_REQUIRED',issues,arc};
 }
 const sequence=arc.map(b=>b?.phase);
 const expected=sequence.includes('second-fall')?REEL_ARC_WITH_SECOND_FALL:REEL_ARC_MINIMUM;
 if(observedOnly){
  const allowed=REEL_ARC_WITH_SECOND_FALL;let previous=-1;
  for(const phase of sequence){const position=allowed.indexOf(phase);if(position<=previous){issue(issues,'REEL_ARC_SEQUENCE_INVALID');break;}previous=position;}
 }else if(JSON.stringify(sequence)!==JSON.stringify(expected))
  issue(issues,'REEL_ARC_SEQUENCE_INVALID');
 let cursor=0;
 const seen=new Set();
 for(const b of arc){
  if(!validId(b?.id)||seen.has(b.id))issue(issues,'REEL_BEAT_ID_INVALID',b?.id??'unknown');
  else seen.add(b.id);
  if(!Number.isFinite(b?.start)||!Number.isFinite(b?.end)||b.start<0||
     b.end<=b.start||!near(b.start,cursor)||b.end>timeline.duration+.000001)
   issue(issues,'REEL_BEAT_TIMING_INVALID',b?.id??'unknown');
  if(Number.isFinite(b?.end))cursor=b.end;
  if(typeof b?.purpose!=='string'||b.purpose.trim().length<5)
   issue(issues,'REEL_BEAT_PURPOSE_REQUIRED',b?.id??'unknown');
  const evidence=b?.evidence;
  if(!Array.isArray(evidence)||evidence.length===0){
   issue(issues,'REEL_BEAT_EVIDENCE_REQUIRED',b?.id??'unknown');continue;
  }
  let grounded=false;
  for(const e of evidence){
   if(e?.kind==='transcript-word'&&validId(e.wordId)){
    const found=registry.wordAnchors?.[e.wordId];
    if(found&&Number.isFinite(found.time)&&found.time>=b.start-1/timeline.fps&&
       found.time<=b.end+1/timeline.fps)grounded=true;
   }else if(e?.kind==='audited-frame'&&validId(e.frameId)){
    const found=registry.frameEvidence?.[e.frameId];
    if(found?.verified===true&&Number.isFinite(found.time)&&
       found.time>=b.start-1/timeline.fps&&found.time<=b.end+1/timeline.fps)grounded=true;
   }
  }
  if(!grounded)issue(issues,'REEL_BEAT_EVIDENCE_UNVERIFIED',b?.id??'unknown');
 }
 if(!near(cursor,timeline.duration))issue(issues,'REEL_ARC_COVERAGE_INCOMPLETE');
 if(arc[0]?.phase==='hook'&&arc[0].start!==0)issue(issues,'HOOK_MUST_START_VIDEO');
 if(arc.at(-1)?.phase==='cta'&&arc.at(-1).end<timeline.duration-.000001)
  issue(issues,'CTA_MUST_END_VIDEO');
 const unobservedPhases=observedOnly?REEL_ARC_MINIMUM.filter(phase=>!sequence.includes(phase)):[];
 return {status:issues.length?'SCRIPT_REVIEW_REQUIRED':'VALIDATED_ARC',issues,arc,...(observedOnly?{unobservedPhases}: {})};
}
