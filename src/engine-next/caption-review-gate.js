/** A read-only reviewer packet for candidate ASR words in a timeline segment.
 * Human approval and face-safe placement are never inferred from confidence.
 * This module cannot create or enable clips, nor alter the source.
 */
const SHA=/^[a-f0-9]{64}$/;
export function auditAsrCaptionWindow({words,sourceSha256,voiceSha256,start,end,fps=30,lowConfidence=0.6}={}) {
 if(!SHA.test(sourceSha256||'')||!SHA.test(voiceSha256||'')||
    !Array.isArray(words)||words.length<1||words.length>10000||
    !Number.isFinite(start)||!Number.isFinite(end)||start<0||end<=start||
    !Number.isInteger(fps)||fps!==30||lowConfidence!==0.6)
   throw Error('Source-bound 30fps ASR review contract required');
 const issues=[],items=[];
 let previousStart=-1,previousEnd=-1;
 for(let i=0;i<words.length;i++) {
  const w=words[i];
  if(!w||typeof w.text!=='string'||!w.text.trim()||w.text.length>80||
     !Number.isFinite(w.start)||!Number.isFinite(w.end)||w.start<0||w.end<w.start||
     !Number.isFinite(w.confidence)||w.confidence<0||w.confidence>1||w.start<previousStart) {
    throw Error('Invalid ASR word ordering or confidence at '+i);
  }
  if(w.start<previousEnd-0.001)issues.push({code:'OVERLAPPING_WORD_TIMES',sourceIndex:i});
  previousStart=w.start;previousEnd=w.end;
  // Strict overlap, not starts-in: include segments crossing the boundary.
  if(w.start>=end||w.end<=start)continue;
  const flags=[];
  if(w.confidence<lowConfidence)flags.push('LOW_CONFIDENCE');
  if(w.start<start+0.08)flags.push('LEFT_BOUNDARY_MAY_CLIP_WORD');
  if(w.end>end-0.08)flags.push('RIGHT_BOUNDARY_MAY_CLIP_WORD');
  if(w.start===w.end)flags.push('ZERO_DURATION');
  if(Math.round(w.end*fps)<=Math.round(w.start*fps))flags.push('SUBFRAME_DURATION');
  if(items.length&&Math.round(w.start*fps)<=Math.round(items.at(-1).start*fps))flags.push('FRAME_COLLISION');
  items.push({sourceIndex:i,text:w.text,start:w.start,end:w.end,confidence:w.confidence,flags});
 }
 if(!items.length)issues.push({code:'NO_WORDS_IN_WINDOW'});
 const boundaryIndices=new Set([items[0]?.sourceIndex,items.at(-1)?.sourceIndex]);
 const context=words.filter((w,i)=>!boundaryIndices.has(i)&&
   ((w.end>start-0.75&&w.end<=start)||(w.start>=end&&w.start<end+0.75)))
   .map(w=>({text:w.text,start:w.start,end:w.end,confidence:w.confidence}));
 const hard=issues.concat(items.flatMap(w=>w.flags.map(code=>({code,sourceIndex:w.sourceIndex}))));
 return {schema:'sues-asr-caption-review/v1',status:'REQUIRES_HUMAN_REVIEW',sourceSha256,voiceSha256,window:[start,end],fps,
   candidateWordCount:items.length,candidates:items,boundaryContext:context,issues:hard,
   stagedClipCount:0,automaticallyApproved:false, geometryVerified:false,
   nextSteps:['Listen to original and verify each word and timestamp, especially window edges','Check face/chin-safe caption anchor in moving video','Compile ONLY with human-reviewed source and verified geometry']};
}
