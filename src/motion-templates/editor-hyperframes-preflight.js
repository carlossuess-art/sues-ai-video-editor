/**
 * SUES MASTER DIRECTOR -> HyperFrames, first trusted seam (read only).
 *
 * Converts reviewed keyword choices + ORIGINAL source word timing and a
 * VERIFIED IDENTITY edit map into precise HyperFrames variables. This never
 * approves creativity, writes a Reel, renders or imports media to FableCut.
 *
 * Full 2-scene demo grammar is only applicable to two genuine 4-word
 * utterances (question + create-space). Other narratives are safely blocked
 * rather than silently rewritten to fit the fixed 151-frame composition.
 */
import {createHash} from 'node:crypto';
import {bindCardToSpaceToSpeech} from './bind-sequence-to-speech.js';
import {SEQUENCE_FRAMES,SEQUENCE_ID} from './sequence-card-to-space.js';
import {FPS,EVENTS} from './hook-drop-card-engine.js';

const SHA=/^[a-f0-9]{64}$/;
const as=(ok,msg)=>{if(!ok)throw Error(msg);};
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
 .toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const close=(a,b)=>typeof a==='number'&&Number.isFinite(a)&&Math.abs(a-b)<.0001;
const frame=x=>Math.round(x*FPS);
const digest=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const block=(code,description)=>({
 schema:'sues-editor-hyperframes-preflight/v1',
 status:'BLOCKED_FOR_EVIDENCE',readOnly:true,rendered:false,
 productionChanged:false,creativeApproved:false,canExecute:false,
 issues:[{code,description}]
});
function trueIdentityMap(map,duration){
 if(!map||map.version!=='1.0'||!Array.isArray(map.spans)||map.spans.length!==1||
  !close(map.duration,duration)||!close(map.sourceDuration,duration))return false;
 const span=map.spans[0];
 return close(span.sourceIn,0)&&close(span.editIn,0)&&
  close(span.sourceOut,duration)&&close(span.editOut,duration);
}
function selectCandidate(review,id){
 const list=review?.review?.candidates?.filter(c=>c.templateId===id)??[];
 if(list.length!==1)return null;
 const c=list[0];
 if(!['standalone-svg-prototype','native-hyperframes-prototype'].includes(c.implementation)||
  !Array.isArray(c.sourceSpeech?.wordIds)||!Array.isArray(c.sourceSpeech.selectedWordIds)||
  c.sourceSpeech.selectedWordIds.length<1||!c.sourceSpeech.wordIds.length)return null;
 return c;
}
export function prepareEditorHyperFramesPreflight({
 editorReview,transcript,sourceSha256,jobFingerprint,timelineFingerprint,
 sourceTimeMap,editedDuration,profile='DOPAMIN'
}={}){
 as(SHA.test(sourceSha256??'')&&typeof jobFingerprint==='string'&&jobFingerprint.length>=12&&
  SHA.test(timelineFingerprint??''),'Trusted source/job/timeline required');
 as(editorReview?.schema==='sues-editor-narrative-review-bridge/v1'&&
  editorReview.sourceSha256===sourceSha256&&editorReview.jobFingerprint===jobFingerprint,
  'Narrative review does not match this job/source');
 as(transcript?.version==='1.0'&&Array.isArray(transcript.words),'Original transcript required');
 as(['DOPAMIN','CALMA','ELEMENTS'].includes(profile),'Unknown profile');
 if(!Number.isFinite(editedDuration)||editedDuration<=0)
  return block('EDIT_DURATION_NOT_VERIFIED','Falta la duración editada comprobada.');
 if(!trueIdentityMap(sourceTimeMap,editedDuration))
  return block('SOURCE_TO_EDIT_MAP_NOT_VERIFIED',
   'El proyecto contiene cortes o un mapa temporal no comprobado: no se moverá ningún motion hasta verificar la conversión del bruto al montaje.');
 const hook=selectCandidate(editorReview,'TPL_HOOK_DROP_CARD'),
  follow=selectCandidate(editorReview,SEQUENCE_ID);
 if(!hook||!follow)return block('PAIRED_NARRATIVE_CUES_REQUIRED',
  'Marca una palabra de una pregunta y otra de una frase que relacione espacio con escucharse. No se impondrá la plantilla a otros discursos.');
 const cardIds=hook.sourceSpeech.wordIds,followIds=follow.sourceSpeech.wordIds;
 if(cardIds.length!==4||followIds.length!==4)return block('FOUR_WORD_LAYOUT_NOT_SUPPORTED',
  'La plantilla de demostración admite exactamente cuatro palabras en cada una de las dos frases. El diseño de otras frases requiere revisión.');
 const all=[...cardIds,...followIds];
 if(new Set(all).size!==all.length)return block('DUPLICATE_SOURCE_WORDS','La propuesta repite palabras originales.');
 const words=transcript.words.map((w,i)=>({...w,id:'source-'+sourceSha256.slice(0,16)+'-w'+i}));
 const byId=new Map(words.map(w=>[w.id,w]));
 if(all.some(id=>!byId.has(id)))return block('SOURCE_WORD_NOT_FOUND','Los ID de palabra ya no existen en la transcripción.');
 const first=byId.get(cardIds[0]),last=byId.get(followIds.at(-1));
 if(first.timingUncertain||last.timingUncertain||
  all.some(id=>byId.get(id).timingUncertain===true))
  return block('UNCERTAIN_SPEECH_TIMES','Una palabra no tiene tiempo real suficientemente fiable.');
 const clipStartFrame=frame(first.start)-EVENTS.firstWord;
 if(clipStartFrame<0)return block('CARD_BEFORE_TIMELINE_START',
  'La primera palabra está demasiado cerca del inicio para abrir la tarjeta.');
 const clipStartSec=clipStartFrame/FPS;
 const clipEndSec=(clipStartFrame+SEQUENCE_FRAMES)/FPS;
 if(clipEndSec>editedDuration+.0001||last.end>clipEndSec+.0001)
  return block('MOTION_OUTSIDE_EDITED_VIDEO','La composición supera el final del vídeo o de la frase.');
 // The layout is a *proposed* fixed template design, not a claim of creative
 // approval, and never changes the original utterance or its punctuation.
 const tokenIds=ids=>ids.map(id=>byId.get(id).text);
 const card=tokenIds(cardIds),ending=tokenIds(followIds);
 const layout={
  line1:card.slice(0,3).join(' '),line2:card[3],
  followLine1:ending.slice(0,2).join(' '),followLine2:ending.slice(2).join(' ')
 };
 let binding;
 try{
  binding=bindCardToSpaceToSpeech({...layout,clipStartSec,transcriptWords:words,
   cardWordIds:cardIds,followWordIds:followIds,fps:FPS});
 }catch(error){
  return block('REAL_SPEECH_OUTSIDE_TEMPLATE_WINDOW',
   'Los tiempos reales no encajan en esta gramática fija de motion: '+error.message);
 }
 const schedule={
  schema:'sues-hyperframes-word-schedule/v1',
  wordStartFrames:binding.params.wordStartFrames,
  wordIds:binding.params.wordIds,
  followWordStartFrames:binding.params.followWordStartFrames,
  followWordIds:binding.params.followWordIds
 };
 // HyperFrames CLI v0.9.20 accepts --variables-file. Passing JSON as a
 // declared string preserves strict composition-variable validation, while
 // the HTML motion source parses and validates the schedule before painting.
 const variables={...layout,wordScheduleJson:JSON.stringify(schedule)};
 const manifestIdentity={sourceSha256,jobFingerprint,timelineFingerprint,
  clipStartFrame,clipStartSec,clipEndSec,cardIds,followIds,variables};
 return {
  schema:'sues-editor-hyperframes-preflight/v1',status:'READY_FOR_CREATIVE_REVIEW',
  readOnly:true,rendered:false,creativeApproved:false,canExecute:false,
  productionChanged:false,canPublish:false,
  sourceSha256,jobFingerprint,timelineFingerprint,
  profile,templateId:SEQUENCE_ID,owner:{motion:'HyperFrames',editorial:'FableCut',creative:'SUES MASTER DIRECTOR'},
  sourceTimeSpace:'original-seconds-identity-map-only',
  scene:{startFrame:clipStartFrame,endFrameExclusive:clipStartFrame+SEQUENCE_FRAMES,
   startSec:clipStartSec,endSec:clipEndSec,frames:SEQUENCE_FRAMES,fps:FPS,
   width:1080,height:1920,placement:'FULL_FRAME_ONLY_NOT_SUBJECT_OVERLAY'},
  words:{
   selectedKeywordIds:editorReview.review?.selectedWordIds??[],
   card:cardIds.map((id,i)=>({id,text:card[i],sourceStartSec:byId.get(id).start,
    motionFrame:schedule.wordStartFrames[i],editedFrame:clipStartFrame+schedule.wordStartFrames[i]})),
   follow:followIds.map((id,i)=>({id,text:ending[i],sourceStartSec:byId.get(id).start,
    motionFrame:schedule.followWordStartFrames[i],editedFrame:clipStartFrame+schedule.followWordStartFrames[i]}))
  },
  hyperframes:{
   composition:'examples/motions/hyperframes-card-to-space',
   engine:'HyperFrames v0.9.20 CLI (version must be verified on target host)',
   variablesFormat:'--variables-file --strict-variables',
   variables,variablesSha256:digest(variables),
   runtimeScheduleSchema:schedule.schema,
   sourceFilesAndHashes:'REQUIRE_PRIVATE_HOST_AT_RENDER',
   sourceStillEditable:true,nativeVideo:'NOT_RENDERED'
  },
  fablecut:{
   operationStatus:'NOT_PREPARED',mediaId:null,clipId:null,
   requiresVerifiedNativeHFRender:true,requiresEditorialCAS:true,
   originalAnimationInternallyEditable:false
  },
  proposedPlanFingerprint:digest(manifestIdentity),
  unresolved:[
   'Carlos must review and approve the A/V creative plan (not a mere keyword selection)',
   'Actual subject/face/safe zone inspection and subtitle-coverage verification',
   'Source asset rights and a current HyperFrames renderer source fingerprint',
   'Native render with verified variables, source and media SHA',
   'Verified FableCut editorial binding, ledger, CAS and QA',
   'Two complete A/V reviews before creative approval; publishing separate'
  ]
 };
}
