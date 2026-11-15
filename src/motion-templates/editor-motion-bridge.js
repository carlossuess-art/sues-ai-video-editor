/**
 * Read-only bridge between existing caption keyword dropdowns and motion proposals.
 * Reuses SOURCE WORD INDEX from edited captions; no second selector or fake ASR IDs.
 * A source-fingerprint scoped word key is derived only from real transcript indexes.
 */
import {prepareNarrativeMotionReview} from './narrative-motion-review.js';
import {makeMotionAVReview} from './motion-av-review.js';
const as=(condition,message)=>{if(!condition)throw Error(message)};
const hash=s=>typeof s==='string'&&/^[a-f0-9]{64}$/i.test(s);
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
 .toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const validIndex=n=>Number.isInteger(n)&&n>=0;
export function buildEditorNarrativeMotionReview({
 transcript,sourceSha256,planSourceSha256,jobFingerprint,requestedFingerprint,
 captions,selections,profile='DOPAMIN'
}={}){
 as(hash(sourceSha256)&&sourceSha256===planSourceSha256,'Source identity mismatch');
 as(typeof jobFingerprint==='string'&&jobFingerprint.length>0&&requestedFingerprint===jobFingerprint,'Project revision changed');
 as(transcript?.version==='1.0'&&Array.isArray(transcript.words)&&transcript.words.length,'Real transcript required');
 as(Array.isArray(captions),'Plan captions required');
 as(Array.isArray(selections)&&selections.length<=50,'Up to 50 explicit selections required');
 const byCaption=new Map(captions.map(c=>[c.id,c]));
 as(byCaption.size===captions.length,'Duplicate caption IDs');
 const selected=[],seen=new Set();
 for(const choice of selections){
  as(choice&&typeof choice.captionId==='string','Caption selection ID required');
  const caption=byCaption.get(choice.captionId);
  as(caption&&caption.source!=='manual','Unknown or manually rewritten caption');
  as(Array.isArray(caption.wordIndexes),'Caption source-word mapping unavailable');
  as(validIndex(choice.displayWordIndex)&&validIndex(choice.sourceWordIndex),'Word indexes must be nonnegative integers');
  as(caption.wordIndexes[choice.displayWordIndex]===choice.sourceWordIndex,'Caption word mapping changed');
  as(typeof choice.captionText==='string'&&choice.captionText===caption.text,'Unsaved caption change; prepare a new revision');
  const tokens=caption.text.trim().split(/\s+/u);
  as(tokens.length===caption.wordIndexes.length,'Edited caption does not map one-to-one to original words');
  as(caption.wordIndexes.every((idx,j)=>validIndex(idx)&&transcript.words[idx]&&
    norm(tokens[j])===norm(transcript.words[idx].text)),
    'Caption word context changed; reconcile all displayed words before preparing motion');
  const transcriptWord=transcript.words[choice.sourceWordIndex];
  as(transcriptWord&&norm(tokens[choice.displayWordIndex])===norm(transcriptWord.text),'Displayed word does not match source transcript');
  as(transcriptWord.timingUncertain!==true&&transcriptWord.end>transcriptWord.start,'Uncertain timing cannot drive motion');
  as(!seen.has(choice.sourceWordIndex),'Duplicate source word selection');
  seen.add(choice.sourceWordIndex);
  selected.push(choice.sourceWordIndex);
 }
 // The original source SHA scopes stable, deterministic IDs; no timestamps are invented.
 const scoped=transcript.words.map((w,i)=>({...w,id:'source-'+sourceSha256.slice(0,16)+'-w'+i}));
 const selectedWordIds=selected.map(i=>scoped[i].id);
 const review=prepareNarrativeMotionReview({...transcript,words:scoped},{
  selectedWordIds,sourceSha256,timelineFingerprint:null,profile
 });
 const avMarkdown=makeMotionAVReview(review);
 return {schema:'sues-editor-narrative-review-bridge/v1',status:review.status,
  sourceSha256,jobFingerprint,selectionSource:'existing-caption-keyword-controls',
  selectedSourceWordIndexes:selected,review,avMarkdown,
  readOnly:true,editingEffect:'NONE',nativeImportable:false,
  blockingReasons:['No edit-timeline mapping verified','No full source-frame review','No user creative approval','No native FableCut mapping verified']};
}
