// Lossless bridge from real, unapproved ASR word cues to Remotion-ready
// caption layer CANDIDATES. No importable master story, font license or render.
const blocked=(code,details={})=>({schema:'sues-film-director-caption-layer-candidates/v1',
 status:'BLOCKED',code,...details,approved:false,canExecute:false});
export function prepareFilmDirectorCaptionLayerCandidates(annex,draft,geometry){
 if(annex?.schema!=='sues-master-film-brief-translation/v1'||annex.approved!==false||
    annex.canExecute!==false||annex.fps!==30||
    draft?.schema!=='sues-film-director-word-captions-draft/v1'||
    draft.approved!==false||draft.canExecute!==false||
    draft.sourceBriefSha256!==annex.sourceBriefSha256||
    draft.sourceSha256!==annex.sourceSha256||
    draft.timelineFingerprint!==annex.timelineFingerprint||
    !Array.isArray(draft.words)||!Array.isArray(draft.captionCues)||
    !draft.words.length||draft.words.length!==draft.captionCues.length||
    geometry?.schema!=='sues-film-brief-geometry-audit/v1'||geometry.invalid!==0||
    geometry.canExecute!==false||!Array.isArray(geometry.placements))
  return blocked('UNTRUSTED_CAPTION_SOURCE_OR_GEOMETRY');
 // Only a caption-safe-zone explicitly located in the source document
 // may be used. Any move or font choice needs new real-frame approval.
 const zones=geometry.placements.filter(p=>typeof p.sourceText==='string'&&
   /subt[ií]tulos|captions/i.test(p.sourceText)&&p.rectangles?.length===1);
 if(zones.length!==1)return blocked('CAPTION_SAFE_ZONE_MISSING_OR_AMBIGUOUS');
 const zone=zones[0].rectangles[0];
 if(!zone||![zone.x,zone.y,zone.width,zone.height].every(Number.isFinite)||
    zone.width<=0||zone.height<=0||zone.x<0||zone.y<0||
    zone.x+zone.width>1080||zone.y+zone.height>1920)
  return blocked('CAPTION_RECT_OUTSIDE_CANVAS');
 const scenes=new Set(annex.scenes.map(s=>s.id)),frameCount=Math.round(annex.duration*30);
 const words=new Map(),cues=new Set(),issues=[],candidates=[];
 for(const word of draft.words){
  if(typeof word?.wordId!=='string'||words.has(word.wordId)||!scenes.has(word.sceneId)||
    typeof word.text!=='string'||!word.text.trim()||
    !Number.isInteger(word.startFrame)||word.startFrame<0||
    !Number.isInteger(word.endFrame)||word.endFrame>frameCount||word.endFrame<=word.startFrame)
   return blocked('CAPTION_WORD_INTEGRITY_INVALID');
  words.set(word.wordId,word);
 }
 let previous=null;
 for(const cue of draft.captionCues){
  const word=words.get(cue?.wordId);
  if(!word||typeof cue.id!=='string'||cues.has(cue.id)||
     cue.sceneId!==word.sceneId||!Number.isInteger(cue.startFrame)||
     !Number.isInteger(cue.endFrame)||cue.startFrame!==word.startFrame||
     cue.endFrame<=cue.startFrame||cue.endFrame>frameCount||
     cue.approved!==false||cue.renderable!==false||typeof cue.text!=='string')
   return blocked('CAPTION_CUE_INTEGRITY_INVALID');
  cues.add(cue.id);
  // Within one progressive group every next word must ACCUMULATE, not replace.
  // A fresh group is identified by exactly one source word.
  const nextWordText=word.text;
  const continuation=previous&&previous.sceneId===cue.sceneId?
      previous.text+' '+nextWordText:null;
  const restarted=cue.text===nextWordText;
  if(!restarted&&cue.text!==continuation)
   return blocked('CAPTION_CUMULATIVE_WORD_TEXT_CHANGED',{wordId:word.wordId});
  if(previous&&cue.startFrame<previous.startFrame)
   return blocked('CAPTION_WORD_ORDER_INVALID');
  if(previous&&cue.startFrame<previous.endFrame)
   issues.push({code:'CAPTION_CUE_FRAME_OVERLAP_REVIEW',cueId:cue.id});
  // This is a candidate, not an authorized Remotion operation.
  candidates.push({intent:'WORD_BY_WORD_PROGRESSIVE_CAPTION',id:cue.id,
   sceneId:cue.sceneId,wordId:cue.wordId,startFrame:cue.startFrame,
   endFrame:cue.endFrame,start:cue.startFrame/30,end:cue.endFrame/30,
   track:'captions',renderer:'remotion',effect:'text',
   text:cue.text,rect:{...zone},
   fontStatus:'FONT_FILE_LICENSE_AND_SIZE_UNVERIFIED',
   frameStatus:'SAFE_ZONE_AND_FACIAL_OCCLUSION_UNVERIFIED',
   audioStatus:'ASR_WORD_AND_PHONEME_NOT_HUMAN_APPROVED',
   approved:false,canExecute:false});
  previous=cue;
 }
 if(cues.size!==words.size)return blocked('CAPTION_WORDS_LOST');
 for(const risk of draft.risks??[])if(risk?.code)issues.push(risk);
 return {schema:'sues-film-director-caption-layer-candidates/v1',
  status:'PREPARED_NOT_EXECUTABLE_NEEDS_HUMAN_ASR_AND_FRAME_QA',
  sourceBriefSha256:annex.sourceBriefSha256,sourceSha256:annex.sourceSha256,
  timelineFingerprint:annex.timelineFingerprint,
  frameCount,wordCount:words.size,candidateCount:candidates.length,
  safeZoneProposed:{...zone},candidates,issues,approved:false,canExecute:false};
}
