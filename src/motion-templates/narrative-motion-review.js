/**
 * SUES MASTER DIRECTOR · narrative motion proposal packet v1.
 * Read-only, deterministic, evidence-bounded: no ASR, no automatic selection,
 * no write to a Reel or FableCut, no assumptions about rendering capability.
 * The selector is for real transcript occurrences (stable, existing word IDs).
 */

export const MOTION_GRAMMAR_LIBRARY = Object.freeze([
  {id:'TPL_HOOK_DROP_CARD',intent:'question-hook',status:'standalone-svg-prototype',purpose:'La pregunta gana jerarquía sin introducir objetos decorativos',mechanism:'tarjeta con palabras por separado y salida por zoom',source:'Gemini scene 1 + Carlos corrections'},
  {id:'SUES_CARD_TO_SPACE_DEMO',intent:'create-space',status:'standalone-svg-prototype',purpose:'Dos límites se apartan para representar espacio disponible',mechanism:'raíles se separan y liberan el centro para una frase',source:'SUES original follow-up prototype'},
  {id:'TPL_BLUR_CASCADE_SWOOSH',intent:'contrast',status:'specification-only',purpose:'Desmontar una afirmación y revelar el contraste',mechanism:'cascada tipográfica y barrido direccional',source:'Gemini scenes 2 and 6'},
  {id:'TPL_METAPHOR_COUNTER_GLOW',intent:'quantified-fact',status:'specification-only',purpose:'Visualizar un dato numérico comprobado',mechanism:'objeto pertinente + contador enlazado a la cifra',source:'Gemini scene 3'},
  {id:'TPL_BOOLEAN_PUZZLE_MORPH',intent:'structured-process',status:'specification-only',purpose:'Explicar cómo diferentes partes encajan en un proceso',mechanism:'metamorfosis de formas con interacciones causales',source:'Gemini scene 4'},
  {id:'TPL_TREND_DIP_AND_RISE_UI',intent:'data-trend',status:'specification-only',purpose:'Mostrar una evolución medida, con variaciones verdaderas',mechanism:'barras crecientes + curva vinculada a datos revisados',source:'Gemini scene 5'},
  {id:'TPL_3D_BULLSEYE_IMPACT',intent:'measurable-goal',status:'specification-only',purpose:'Visualizar un objetivo concreto, sin añadir proyectiles gratuitos',mechanism:'diana aparece y recibe un impacto motivado',source:'Gemini scene 7'}
]);
const as=(x,msg)=>{if(!x)throw Error(msg);};
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const clean=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const sentence=s=>s.replace(/\s+/g,' ').trim();
function evidenceWords(transcript){
 as(transcript?.version==='1.0'&&Array.isArray(transcript.words)&&transcript.words.length,'Transcript v1 words required');
 as(finite(transcript.sourceDuration)&&transcript.sourceDuration>0,'Transcript sourceDuration required');
 as(typeof transcript.language==='string'&&transcript.language.toLowerCase().startsWith('es'),'Spanish transcript required for v1 phrase rules');
 const seen=new Set();let previous=-1;
 return transcript.words.map((w,i)=>{
  as(w&&typeof w.id==='string'&&w.id.trim()&&!seen.has(w.id),'Every word must have a stable unique id');
  seen.add(w.id);
  as(typeof w.text==='string'&&w.text.trim()&&w.text.length<=80,'Invalid transcript word text');
  as(finite(w.start)&&finite(w.end)&&w.start>=0&&w.end>w.start&&w.end<=transcript.sourceDuration&&w.start>=previous,'Invalid word timing / order');
  // A timingUncertain item is not precise enough to drive a motion trigger.
  as(w.timingUncertain!==true,'Uncertain word timing cannot drive a motion');
  previous=w.start;
  return {id:w.id,text:w.text,start:w.start,end:w.end,index:i};
 });
}
const isEnd=w=>/[.!?…]$/.test(w.text);
function phrases(words){
 const segments=[];let current=[];
 const flush=()=>{if(current.length){segments.push(current);current=[];}};
 for(const w of words){
  if(current.length&&(w.start-current.at(-1).end>0.9))flush();
  current.push(w);
  if(isEnd(w))flush();
 }
 flush();return segments;
}
const contains=(arr,rx)=>arr.some(w=>rx.test(clean(w.text)));
const token=(arr,word)=>arr.some(w=>clean(w.text)===word);
function matchIntents(segment){
 const text=segment.map(w=>w.text).join(' ');
 const results=[];
 if(/[¿?]/.test(text)&&segment.length>=3)results.push('question-hook');
 if(contains(segment,/^espacio|^abrir|^hueco/)&&contains(segment,/^escuch|^atencion|^sentir/))results.push('create-space');
 if(contains(segment,/^\d+$/)||contains(segment,/^cifra|^porcentaje|^cantidad|^millon|^miles/)){
  if(contains(segment,/^cada|^mas|^dato|^son|^total|^numero|^porcentaje|^\d/))results.push('quantified-fact');
 }
 if((contains(segment,/^piez|^proceso|^pasos|^metodo|^estructur|^encaj/))&&contains(segment,/^soluci|^resolv|^construi|^aprend|^encaj|^organiza/))results.push('structured-process');
 if(contains(segment,/^evoluci|^crecimient|^progres|^aument|^mejor/)&&contains(segment,/^dato|^resultado|^porcentaje|^cifra|^\d/))results.push('data-trend');
 if(token(segment,'no')&&token(segment,'sino'))results.push('contrast');
 if(contains(segment,/^objetivo|^meta|^diana|^proposito/)&&contains(segment,/^alcanz|^consegu|^logr|^dirigi/))results.push('measurable-goal');
 return results;
}
function selectorOptions(words,prior){
 return words.map((w,i)=>({wordId:w.id,text:w.text,start:w.start,end:w.end,
  context:sentence(words.slice(Math.max(0,i-3),Math.min(words.length,i+4)).map(v=>v.text).join(' ')),
  checked:prior.has(w.id)}));
}
/**
 * Build the selector FIRST. No motion suggestions until selectedWordIds is
 * explicitly given (possibly []). They are NOT inferred from speech.
 */
export function prepareNarrativeMotionReview(transcript,{selectedWordIds=null,previousSelectedWordIds=[],profile='DOPAMIN',sourceSha256=null,timelineFingerprint=null}={}){
 const words=evidenceWords(transcript);
 as(['DOPAMIN','CALMA','ELEMENTS'].includes(profile),'Unknown profile');
 as(Array.isArray(previousSelectedWordIds),'Previous selection must be a list');
 if(sourceSha256!==null)as(typeof sourceSha256==='string'&&/^[a-f0-9]{64}$/i.test(sourceSha256),'Invalid source fingerprint');
 if(timelineFingerprint!==null)as(typeof timelineFingerprint==='string'&&timelineFingerprint.trim(),'Invalid timeline fingerprint');
 const known=new Set(words.map(w=>w.id));
 as(previousSelectedWordIds.every(id=>known.has(id)),'Previous selection contains missing word ids; review conflicts');
 const prior=new Set(previousSelectedWordIds);
 const isSelectionPresent=selectedWordIds!==null;
 if(isSelectionPresent){
  as(Array.isArray(selectedWordIds)&&new Set(selectedWordIds).size===selectedWordIds.length,'Selection must be an array of unique ids');
  as(selectedWordIds.every(id=>known.has(id)),'Selection contains unknown word id');
 }
 const selector={schema:'sues-word-occurrence-selector/v1',requiresExplicitConfirmation:true,
  selectionSubmitted:isSelectionPresent,preselectedIds:[...prior],options:selectorOptions(words,prior)};
 const base={schema:'sues-narrative-motion-review/v1',status:!isSelectionPresent?'AWAITING_WORD_SELECTION':'REVIEW_ONLY',
  source:{language:transcript.language,sourceDuration:transcript.sourceDuration,sourceSha256,timeSpace:'original-seconds',timelineFingerprint},
  profile,selector,autoEditAuthorized:false,creativeApproved:false,published:false,
  captionRule:'Full-screen motion may hide standard captions ONLY with full token coverage; otherwise preserve all words and neutralize duplicated highlights only during overlap',
  candidates:[],notImportableReasons:['No approved Reel A/V plan','No source-to-edit timeline map','No verified renderer mapping for every effect','No human creative approval']};
 if(!isSelectionPresent)return base;
 const selected=new Set(selectedWordIds);
 const found=[];
 for(const group of phrases(words)){
  const selectedInGroup=group.filter(w=>selected.has(w.id));
  if(!selectedInGroup.length)continue;
  for(const intent of matchIntents(group)){
   const item=MOTION_GRAMMAR_LIBRARY.find(x=>x.intent===intent);
   const first=group[0],last=group.at(-1);
   found.push({id:'motion-review-'+intent+'-'+first.id,
    templateId:item.id,intent:item.intent,implementation:item.status,
    reason:item.purpose,visualMechanism:item.mechanism,method:'transcript-based-rule / review only',
    sourceSpeech:{quote:group.map(w=>w.text).join(' '),start:first.start,end:last.end,
     wordIds:group.map(w=>w.id),selectedWordIds:selectedInGroup.map(w=>w.id),
     anchorWordId:selectedInGroup[0].id,sourceStartIndex:first.index,sourceEndIndex:last.index},
    proposedLayerRoles:['BACKGROUND','GRAPHICS'],
    timing:'not scheduled on edited timeline',
    placement:'pending inspection of actual frame and subject',
    assets:'existing masters first; verify source rights and quality',
    factualGate:['quantified-fact','data-trend'].includes(intent)?'must verify numerical claim and underlying data before depicting':'not-applicable',
    captionAction:'pending verified full-coverage and selected keyword overlap',
    editingEffect:'NONE',approval:'human review required',
    blockReasons:item.status==='specification-only'?
      ['Template not implemented or verified in active renderer','Needs exact visual plan, word anchors and resources']:
      ['Prototype only; native FableCut/HyperFrames mapping not verified','Needs actual word timing/review and approved project']});
  }
 }
 // A typed evidence packet is not an executable Master Story contract.
 return {...base,selectedWordIds:[...selectedWordIds],
  candidates:found.slice(0,24),status:found.length?'MOTION_CANDIDATES_FOR_REVIEW':'NO_SEMANTIC_MOTION_MATCH'};
}
