/**
 * Review-only binding from explicit transcript word IDs to both demo scenes.
 * No transcription, NLP keyword picking, sourceTimeMap invention or auto edit.
 */
import {bindHookToSpeech} from './bind-hook-to-speech.js';
import {sampleCardToSpace,SPACE_EVENTS,SEQUENCE_FRAMES} from './sequence-card-to-space.js';
import {FPS,EVENTS as CARD_EVENTS} from './hook-drop-card-engine.js';
const norm=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const finite=x=>typeof x==='number'&&Number.isFinite(x);
export function bindCardToSpaceToSpeech({line1,line2,followLine1,followLine2,clipStartSec,transcriptWords,cardWordIds,followWordIds,fps=FPS}={}){
 if(fps!==FPS||!finite(clipStartSec)||clipStartSec<0)throw Error('requires verified 30fps and clip start');
 const first=bindHookToSpeech({line1,line2,clipStartSec,transcriptWords,selectedWordIds:cardWordIds,fps});
 const wanted=[followLine1,followLine2].flatMap(v=>typeof v==='string'?v.trim().split(/\s+/u):[]);
 if(!Array.isArray(followWordIds)||!wanted.length||wanted.some(w=>!w)||wanted.length!==followWordIds.length||new Set(followWordIds).size!==followWordIds.length)throw Error('explicit follow-up word IDs required');
 const catalog=new Map(transcriptWords.map((w,i)=>[w.id,{...w,index:i}]));
 if(catalog.size!==transcriptWords.length)throw Error('duplicate transcript IDs');
 const follow=followWordIds.map((id,i)=>{
  const w=catalog.get(id);if(!w)throw Error('follow-up word ID missing');
  if(norm(w.text)!==norm(wanted[i]))throw Error('follow-up text differs from transcript');
  if(i>0&&w.index<=catalog.get(followWordIds[i-1]).index)throw Error('follow-up word order invalid');
  if(i===0&&w.index<=catalog.get(cardWordIds[cardWordIds.length-1]).index)throw Error('follow-up must occur after card phrase');
  return w;
 });
 const frameStarts=follow.map(w=>Math.round((w.start-clipStartSec)*fps));
 if(frameStarts[0]<SPACE_EVENTS.railsEnd||frameStarts.at(-1)>SPACE_EVENTS.end-7)throw Error('follow-up timing outside supported graphic window');
 if(first.params.wordStartFrames[0]<CARD_EVENTS.firstWord)throw Error('card begins before rectangle is ready');
 const args={...first.params,followLine1,followLine2,followWordIds:[...followWordIds],followWordStartFrames:frameStarts};
 sampleCardToSpace(0,args);
 return {templateId:'SUES_CARD_TO_SPACE_DEMO',durationFrames:SEQUENCE_FRAMES,fps,
  params:args,transcriptEvidence:{kind:'explicit-reviewed-word-ids',cardIds:[...cardWordIds],followIds:[...followWordIds]},
  sourceTimeMap:'not-verified',timelineFingerprint:'not-verified',
  nativeMapping:'not-available',readyForAutomaticEdit:false,requiresCreativeApproval:true};
}