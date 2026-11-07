// Proposal only. Projects word-by-word captions from the source's real ASR;
// never rewrites speech, chops a word or grants final subtitle approval.
const EPS=1e-6;
const blocked=(code)=>({status:'BLOCKED',code,approved:false,canExecute:false});
export function draftFilmDirectorCaptions(annex,transcript){
 if(annex?.schema!=='sues-master-film-brief-translation/v1'||annex.approved!==false||
  annex.canExecute!==false||annex.fps!==30||!Array.isArray(annex.scenes)||
  transcript?.language!=='es'||!Array.isArray(transcript.words)||!transcript.words.length||
  !Number.isFinite(transcript.sourceDuration)||
  Math.abs(transcript.sourceDuration-annex.duration)>1/30+0.001)
  return blocked('ASR_OR_TIMELINE_UNVERIFIED');
 const spans=[],risks=[],wordRows=[];
 for(let index=0;index<transcript.words.length;index++){
  const w=transcript.words[index];
  if(!Number.isFinite(w?.start)||!Number.isFinite(w?.end)||w.start<0||
     w.end<=w.start||w.end>annex.duration+1/30+EPS||
     typeof w.text!=='string'||!w.text.trim()||w.text.length>80)
   return blocked('INVALID_ASR_WORD_TIMING');
  if(index&&w.start<transcript.words[index-1].start-EPS)return blocked('ASR_WORD_ORDER_INVALID');
  const center=(w.start+w.end)/2,
   matches=annex.scenes.filter(s=>center>=s.sourceStart-EPS&&center<s.sourceEnd+EPS),
   scene=matches.length?matches[0]:null;
  const full=scene&&w.start>=scene.sourceStart-EPS&&w.end<=scene.sourceEnd+EPS;
  const shotMatches=scene?.shots?.filter(s=>w.start>=s.sourceStart-EPS&&w.end<=s.sourceEnd+EPS)??[];
  const row={wordId:`asr-word-${index}`,index,text:w.text,start:w.start,end:w.end,
   sceneId:scene?.id??null,shotIds:shotMatches.map(s=>s.id),
   confidence:Number.isFinite(w.confidence)?w.confidence:null,
   startFrame:Math.floor(w.start*30+EPS),endFrame:Math.ceil(w.end*30-EPS),
   unverified:true};
  if(!scene)risks.push({code:'WORD_OUTSIDE_SCENES',wordId:row.wordId});
  else if(!full)risks.push({code:'WORD_CROSSES_SCENE_BOUNDARY',wordId:row.wordId,sceneId:scene.id});
  if(scene&&!shotMatches.length)risks.push({code:'WORD_WITHOUT_FULL_SHOT_COVERAGE',wordId:row.wordId,sceneId:scene.id});
  if(row.confidence===null||row.confidence<.8)risks.push({code:'LOW_ASR_CONFIDENCE_REVIEW',wordId:row.wordId,confidence:row.confidence});
  wordRows.push(row);
 }
 // Stable groups of at most 6 whole words and 37 characters. This does not
 // claim exact visual line count or typography: those require frame QA.
 const groups=[];
 for(const scene of annex.scenes){
  let buffer=[];
  const flush=()=>{if(buffer.length){groups.push({sceneId:scene.id,wordIds:buffer.map(w=>w.wordId),
   words:buffer.map(w=>w.text),startFrame:buffer[0].startFrame,endFrame:buffer.at(-1).endFrame});buffer=[];}};
  for(const word of wordRows.filter(w=>w.sceneId===scene.id)){
   const next=[...buffer,word];
   if(buffer.length&&(next.length>6||next.map(x=>x.text).join(' ').length>37))flush();
   buffer.push(word);
  }
  flush();
 }
 const cues=[];
 for(const group of groups){
  const words=group.wordIds.map(id=>wordRows[Number(id.slice('asr-word-'.length))]);
  for(let i=0;i<words.length;i++){
   const current=words[i],next=words[i+1],startFrame=current.startFrame;
   const endFrame=Math.max(startFrame+1,next?next.startFrame:current.endFrame);
   // When two spoken words snap to the same frame they remain represented;
   // the collision is flagged instead of changing speech timings silently.
   if(next&&next.startFrame<=startFrame)risks.push({code:'WORDS_SAME_FRAME_REVIEW',wordId:current.wordId,nextWordId:next.wordId});
   cues.push({id:`cue-${current.wordId}`,sceneId:group.sceneId,wordId:current.wordId,
    startFrame,endFrame,text:words.slice(0,i+1).map(w=>w.text).join(' '),
    originalStart:current.start,originalEnd:current.end,approved:false,renderable:false});
  }
 }
 if(wordRows.length!==cues.length)return blocked('SPEECH_DRAFT_LOST_WORDS');
 return {schema:'sues-film-director-word-captions-draft/v1',status:'WORD_CAPTIONS_PREPARED_NOT_APPROVED',
  sourceBriefSha256:annex.sourceBriefSha256,sourceSha256:annex.sourceSha256,
  originalSourceSha256:annex.originalSha256,timelineFingerprint:annex.timelineFingerprint,
  asrProvenance:transcript.provenance??null,
  wordCount:wordRows.length,groups:groups.length,captionCues:cues,
  words:wordRows,risks,needsReview:[
   'ASR_WORDS_AND_PUNCTUATION','PROGRESSIVE_GROUPING_AND_LINE_BREAKS',
   'SAFE_ZONE_FACE_AND_CHIN','FONT_LICENSE_AND_VISUAL_QA','WORDS_CROSSING_SHOT_BOUNDARIES'],
  approved:false,canExecute:false};
}
