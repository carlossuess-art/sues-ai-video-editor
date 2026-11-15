/**
 * Explicit mapping only. No ASR or keyword selection is performed here.
 * Binds a human-reviewed ordered set of word IDs to one motion card.
 * Demo metadata is not authorisation to edit or publish.
 */
import {sampleHookDropCard,FPS} from './hook-drop-card-engine.js';
const norm=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const finite=v=>typeof v==='number'&&Number.isFinite(v);
export function bindHookToSpeech({line1,line2,clipStartSec,transcriptWords,selectedWordIds,fps=FPS}={}){
 if(fps!==FPS)throw Error('only project FPS 30 is supported by this prototype');
 if(!finite(clipStartSec)||clipStartSec<0)throw Error('clip start must be a nonnegative timestamp');
 if(!Array.isArray(transcriptWords)||!transcriptWords.length)throw Error('real transcript words are required');
 if(!Array.isArray(selectedWordIds)||!selectedWordIds.length||new Set(selectedWordIds).size!==selectedWordIds.length)throw Error('explicit unique word IDs required');
 const desired=[line1,line2].flatMap(v=>typeof v==='string'?v.trim().split(/\s+/):[]);
 if(desired.length!==selectedWordIds.length||desired.some(x=>!x))throw Error('selected ID count does not match displayed words');
 const wordMap=new Map();
 for(let i=0;i<transcriptWords.length;i++){
  const w=transcriptWords[i];
  if(!w||typeof w.id!=='string'||!w.id||wordMap.has(w.id)||typeof w.text!=='string'||!finite(w.start)||!finite(w.end)||w.start<0||w.end<=w.start)throw Error('invalid transcript words or duplicate IDs');
  wordMap.set(w.id,{...w,index:i});
 }
 const actual=selectedWordIds.map((id,i)=>{
  const w=wordMap.get(id);
  if(!w)throw Error('selected word ID not found');
  if(norm(w.text)!==norm(desired[i]))throw Error('selected word does not match card text');
  if(w.start<clipStartSec||w.start>=clipStartSec+2.1)throw Error('word outside safe motion reveal window');
  if(i>0&&w.index<=wordMap.get(selectedWordIds[i-1]).index)throw Error('word IDs not in transcript order');
  return w;
 });
 const wordStartFrames=actual.map(w=>Math.round((w.start-clipStartSec)*fps));
 const params={line1,line2,wordIds:selectedWordIds,wordStartFrames};
 sampleHookDropCard(0,params);
 return {templateId:'TPL_HOOK_DROP_CARD',fps,params,
   transcriptEvidence:{kind:'explicit-word-id-selection',ids:[...selectedWordIds],wordStartsSec:actual.map(w=>w.start)},
   sourceTimeMap:'not-verified',timelineFingerprint:'not-provided',
   readyForRealReel:false,requiresCreativeApproval:true};
}
