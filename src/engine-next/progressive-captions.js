/**
 * Strict Film Director word-progressive captions → FableCut review clips.
 * No real ASR is promoted without reviewed words, trusted timeline and face-safe geometry.
 * This module never changes a source clip or sends an edit to a renderer.
 */
const SHA=/^[a-f0-9]{64}$/;
const validWords=words=>Array.isArray(words)&&words.length>0&&words.every(w=>
 typeof w.text==='string'&&w.text.trim().length>0&&Number.isFinite(w.start)&&Number.isFinite(w.end)&&w.start>=0&&w.end>w.start);
export function compileVerifiedWordCaptions({words,sourceSha256,timelineFingerprint,
  humanReviewed=false,reviewIssues=[],timelineProven=false,geometryVerified=false,
  anchorX=undefined,anchorY=undefined,track='V5',fps=30,maxWords=6,maxChars=36}={}){
 const blocked=[];
 if(!SHA.test(sourceSha256??'')||!SHA.test(timelineFingerprint??''))blocked.push('SOURCE_OR_TIMELINE_UNVERIFIED');
 if(!humanReviewed||!Array.isArray(reviewIssues)||reviewIssues.length)blocked.push('WORD_TRANSCRIPT_REQUIRES_HUMAN_REVIEW');
 if(!timelineProven)blocked.push('SOURCE_TO_EDIT_TIME_MAP_NOT_PROVEN');
 if(!geometryVerified||!Number.isInteger(anchorX)||!Number.isInteger(anchorY))blocked.push('CAPTION_FACE_SAFE_POSITION_UNVERIFIED');
 if(fps!==30||!Number.isInteger(maxWords)||maxWords<1||maxWords>9||!Number.isInteger(maxChars)||maxChars<12||maxChars>50)blocked.push('UNSUPPORTED_LAYOUT_OR_FPS');
 if(!validWords(words))blocked.push('INVALID_WORDS');
 if(blocked.length)return {status:'BLOCKED',blocked,wordCount:words?.length??0,clips:[],manifest:[]};
 // Proof must be both chronologically ordered and frame-unique; source ASR often fails these checks.
 for(let i=0;i<words.length;i++){
  const w=words[i],frame=Math.round(w.start*fps);
  if(i && (w.start<words[i-1].end-0.001||frame<=Math.round(words[i-1].start*fps)))
   blocked.push('OVERLAPPING_OR_COLLIDING_WORD_TIME_'+i);
  if(Math.round(w.end*fps)<=frame)blocked.push('SUBFRAME_WORD_TIME_'+i);
  if(w.text.trim().length>maxChars)blocked.push('UNSAFE_LONG_WORD_'+i);
 }
 if(blocked.length)return {status:'BLOCKED',blocked,wordCount:words.length,clips:[],manifest:[]};
 const clips=[],manifest=[];let group=[],groupText='';
 for(let i=0;i<words.length;i++){
  const w=words[i],previous=words[i-1];
  if(group.length&&(group.length>=maxWords||(groupText+' '+w.text.trim()).length>maxChars||(previous&&w.start-previous.end>0.55))){group=[];groupText='';}
  group.push(w);groupText=group.map(x=>x.text.trim()).join(' ');
  const startFrame=Math.round(w.start*fps),next=words[i+1],nextFrame=next?Math.round(next.start*fps):Infinity;
  const lastFrame=Math.round(w.end*fps)+4;
  const endFrame=Math.min(nextFrame,lastFrame);
  if(endFrame<=startFrame){blocked.push('INVALID_CAPTION_FRAME_'+i);break;}
  const id='sues_caption_word_'+String(i).padStart(4,'0');
  clips.push({id,kind:'text',track,start:startFrame/fps,in:0,duration:(endFrame-startFrame)/fps,
    name:'CAPTION PROGRESSIVE · word '+(i+1),props:{text:groupText,font:'Montserrat',fontSize:56,bold:true,
    color:'#ffffff',strokeWidth:2,strokeColor:'#17191d',x:anchorX,y:anchorY,
    boxW:900,boxH:160,boxFit:true,align:'center',textShadow:9},disabled:true});
  manifest.push({clipId:id,wordIndex:i,sourceStart:w.start,sourceEnd:w.end,startFrame,endFrame,
    accumulatedWords:group.length,exactWord:w.text});
 }
 if(blocked.length)return {status:'BLOCKED',blocked,wordCount:words.length,clips:[],manifest:[]};
 if(clips.length!==words.length||manifest.map(m=>m.exactWord).join(' ')!==words.map(w=>w.text).join(' '))
  throw Error('Forbidden silent loss of a spoken word');
 return {status:'REVIEW_LAYERS_DISABLED',sourceSha256,timelineFingerprint,track,fps,wordCount:words.length,clips,manifest,
  cinematicQA:false,approvedByCarlos:false};
}