import {createHash,randomUUID} from 'node:crypto';
import {readFileSync,writeFileSync,renameSync,mkdirSync,rmdirSync,unlinkSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {resolveKeywordSelection,resolveCaptionEmphasis,policyFingerprint} from './sues-production-policy.js';
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const key=draft=>hash([draft.sourceSha256,draft.timelineFingerprint,draft.words]);
const path=(folder,draft)=>join(folder,'sues-keywords-'+key(draft)+'.json');
export function readKeywordSelection(folder,draft){
 if(!draft?.words?.length)return null;
 const file=path(folder,draft);if(!existsSync(file))return null;
 const data=JSON.parse(readFileSync(file,'utf8'));if(data.draftFingerprint!==key(draft)||data.policyFingerprint!==policyFingerprint||data.revision!==hash([data.draftFingerprint,data.policyFingerprint,data.selectedWordIds]))throw Error('KEYWORD_SELECTION_INTEGRITY');
 resolveKeywordSelection(draft.words,{selectedWordIds:data.selectedWordIds});return data;
}
export function saveKeywordSelection(folder,draft,input){
 if(!Array.isArray(input?.selectedWordIds)||!Object.hasOwn(input,'expectedRevision')||Object.keys(input).some(k=>!['selectedWordIds','expectedRevision'].includes(k)))throw Error('INVALID_SELECTION');
 const file=path(folder,draft),lock=file+'.lock';try{mkdirSync(lock,{mode:0o700})}catch(e){if(e.code==='EEXIST')return {status:'CONFLICT',code:'KEYWORD_SELECTION_BUSY'};throw e}
 try{const previous=readKeywordSelection(folder,draft);if((previous?.revision??null)!==input.expectedRevision)return {status:'CONFLICT',code:'STALE_KEYWORD_SELECTION',revision:previous?.revision??null};
 const selectedWordIds=resolveKeywordSelection(draft.words,{selectedWordIds:input.selectedWordIds});
 const data={schema:'sues-keyword-selection/v1',status:'SAVED',draftFingerprint:key(draft),policyFingerprint,selectedWordIds,revision:hash([key(draft),policyFingerprint,selectedWordIds])};
 const tmp=file+'.'+randomUUID();try{writeFileSync(tmp,JSON.stringify(data),{mode:0o600,flag:'wx'});renameSync(tmp,file)}finally{if(existsSync(tmp))unlinkSync(tmp)}return data;
 }finally{rmdirSync(lock)}
}
export function captionStylePlan(draft,selection,story){
 if(!selection)return {status:'KEYWORD_SELECTION_REQUIRED',renderable:false};
 if(!story||story.sourceSha256!==draft.sourceSha256||story.timeline?.fingerprint!==draft.timelineFingerprint)return {status:'TITLE_TIMELINE_REQUIRED',renderable:false};
 const heroes=[];
 for(const o of story.operations??[]){
  const c=o.parameters?.command;
  if(c?.action==='add_title'&&typeof c.text==='string')heroes.push({kind:'title',text:c.text,startFrame:Math.round(o.start*30),endFrame:Math.round(o.end*30)});
  else if(o.track==='graphics'){
   const v=o.parameters?.visual;
   if(typeof v?.text==='string')heroes.push({kind:'hero-motion',text:v.text,startFrame:Math.round(o.start*30),endFrame:Math.round(o.end*30)});
   else if(o.effect!=='fablecut-command-exact-v1'||!c||!['add_image','add_broll','add_shape','add_svg','add_vfx','set_transform','animate','set_visual_effect','transition','dissolve'].includes(c.action))return {status:'GRAPHIC_TEXT_NOT_VERIFIED',operationId:o.id,renderable:false};
  }
 }
 try{return {status:'STYLES_PLANNED_NOT_RENDERED',renderable:false,selectionRevision:selection.revision,segments:resolveCaptionEmphasis({words:draft.words,cues:draft.captionCues,selection:{selectedWordIds:selection.selectedWordIds},heroes})};}
 catch(e){return {status:'BLOCKED',code:e.message,renderable:false}}
}
