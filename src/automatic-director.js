import {validateReviewedFraming,validateZoomEvents} from './reviewed-framing.js';
import {validateSfxEvents} from './custom-sfx.js';
import {validateVoiceEvents} from './voice-effects.js';
import {validateElements} from './elements.js';
import {validateKeyframes} from './timeline-keyframes.js';
import {STYLE_VARIANTS,visualProfile} from './style-variants.js';
import {validateMotionChoices} from './motion-overlays.js';
import {validateGraphicSettings} from './graphic-blocks.js';
import {validateKeywordOverrides} from './text-presets.js';
import {validateTranscript,mapWordsToTimeline} from './transcript.js';
import {normalizeSourceCuts,keptSegments} from './source-cuts.js';
import {compileTemplatePolicy} from './template.js';
const assert=(ok,msg)=>{if(!ok)throw new Error(`Automatic director: ${msg}`);};
const normalize=s=>s.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const LEXICON=new Map([
 ['reconocer','revelation'],['descubrir','revelation'],['comprender','revelation'],['revelar','revelation'],
 ['detenerte','emphasis'],['sentir','emphasis'],['respira','emphasis'],['escucha','emphasis'],['recuerda','emphasis'],
 ['miedo','emotional-turn'],['temores','emotional-turn'],['dolor','emotional-turn'],['culpa','emotional-turn']
]);
export function validateEditorSettings(settings={}){
 assert(settings&&typeof settings==='object'&&!Array.isArray(settings),'settings object');
 assert(Object.keys(settings).every(k=>['reviewedForeground','automaticPreviewBroll','reviewedDepthText','voiceGain','levelResources','voiceNormalization','reviewedFraming','zoomEvents','autoRecipe','sfxEvents','sfxEnabled','sfxGain','motionChoices','motionLayerOverrides','zoomIntensity','motions','montageCuts','montageSplits','sourceCuts','captionOverrides','captionTimingOverrides','captionTransforms','captionScaleKeyframes','hiddenVisualEventIds','hiddenCaptionIds','highlightCaptions','captionWords','keywordOverrides','musicEnabled','musicGain','duckMusic','musicTracks','graphicCards','transitions','musicAssetId','imageEvents','videoEvents','overlayEvents','voiceEvents','masteringEnabled','profileImages','styleId','elements'].includes(k)),'unknown setting');
 validateElements(settings.elements);
 const value={reviewedForeground:null,automaticPreviewBroll:false,reviewedDepthText:null,voiceGain:1,levelResources:false,voiceNormalization:false,reviewedFraming:null,zoomEvents:[],autoRecipe:false,sfxEvents:[],sfxEnabled:false,sfxGain:.35,motionChoices:[],motionLayerOverrides:{},styleId:'SUES_CALMA',musicAssetId:null,imageEvents:[],videoEvents:[],overlayEvents:[],voiceEvents:[],masteringEnabled:false,profileImages:true,graphicCards:[],transitions:[],keywordOverrides:{},musicEnabled:true,musicGain:null,duckMusic:true,musicTracks:[],captionWords:3,zoomIntensity:1,motions:true,montageCuts:[],montageSplits:[],sourceCuts:[],captionOverrides:{},captionTimingOverrides:{},captionTransforms:{},captionScaleKeyframes:{},hiddenVisualEventIds:[],hiddenCaptionIds:[],highlightCaptions:[],...settings};
 assert(value.reviewedForeground===null||value.reviewedForeground&&typeof value.reviewedForeground==='object'&&!Array.isArray(value.reviewedForeground),'reviewed foreground object');
 assert(typeof value.automaticPreviewBroll==='boolean','automatic preview B-roll boolean');
 assert(value.reviewedDepthText===null||value.reviewedDepthText&&typeof value.reviewedDepthText==='object'&&!Array.isArray(value.reviewedDepthText),'reviewed depth object');
 value.reviewedFraming=validateReviewedFraming(value.reviewedFraming);value.zoomEvents=validateZoomEvents(value.zoomEvents);
 assert(typeof value.autoRecipe==='boolean','autoRecipe boolean');
 value.sfxEvents=validateSfxEvents(value.sfxEvents);
 value.voiceEvents=validateVoiceEvents(value.voiceEvents);
 assert(typeof value.voiceNormalization==='boolean','voiceNormalization boolean');
 assert(Number.isFinite(value.voiceGain)&&value.voiceGain>=0&&value.voiceGain<=2,'voiceGain 0..2');
 assert(typeof value.levelResources==='boolean','levelResources boolean');
 assert(typeof value.masteringEnabled==='boolean','masteringEnabled boolean');
 assert(typeof value.sfxEnabled==='boolean'&&Number.isFinite(value.sfxGain)&&value.sfxGain>=0&&value.sfxGain<=.7,'sfx settings');
 assert(Number.isFinite(value.zoomIntensity)&&value.zoomIntensity>=0&&value.zoomIntensity<=1,'zoomIntensity 0..1');
 assert([1,2,3].includes(value.captionWords),'captionWords 1, 2 or 3');
 assert(Object.hasOwn(STYLE_VARIANTS,value.styleId),'style id');
 assert(value.musicAssetId===null||typeof value.musicAssetId==='string'&&/^[a-f0-9]{64}$/.test(value.musicAssetId),'music asset id');
 assert(typeof value.profileImages==='boolean'&&Array.isArray(value.imageEvents)&&value.imageEvents.length<=50,'image settings');
 for(const e of value.imageEvents){
  assert(e&&Object.keys(e).every(k=>['assetId','start','end','box'].includes(k))&&typeof e.assetId==='string'&&/^[a-f0-9]{64}$/.test(e.assetId)&&Number.isFinite(e.start)&&Number.isFinite(e.end)&&e.start>=0&&e.end-e.start>=.6&&e.end-e.start<=8,'image event invalid');
  if(e.box){const b=e.box;assert(Object.keys(b).length===4&&['left','right','top','bottom'].every(k=>Number.isInteger(b[k]))&&b.left>=-1080&&b.right<=2160&&b.top>=-1920&&b.bottom<=3840&&b.right-b.left>=64&&b.bottom-b.top>=64&&b.right-b.left<=2400&&b.bottom-b.top<=3000,'image box outside supported canvas');}
 }
 assert(Array.isArray(value.videoEvents)&&value.videoEvents.length<=50,'maximum 50 B-roll clips');
 let lastEnd=-Infinity;const videoIds=new Set();
 for(const e of value.videoEvents){
  assert(e&&Object.keys(e).every(k=>['assetId','start','end','sourceIn','reason'].includes(k))&&
   typeof e.assetId==='string'&&/^[a-f0-9]{64}$/.test(e.assetId)&&!videoIds.has(e.assetId)&&
   Number.isFinite(e.start)&&Number.isFinite(e.end)&&e.end>e.start&&e.start>=lastEnd&&
   (e.sourceIn===undefined||Number.isFinite(e.sourceIn)&&e.sourceIn>=0)&&
   typeof e.reason==='string'&&e.reason.trim().length>=5&&e.reason.length<=160,
   'B-roll event invalid or overlapping');
  lastEnd=e.end;videoIds.add(e.assetId);
 }
 assert(Array.isArray(value.overlayEvents)&&value.overlayEvents.length<=50,'máximo 50 capas ambientales');
 let previousOverlayEnd=-Infinity;
 for(const e of value.overlayEvents){
  assert(e&&Object.keys(e).every(k=>['assetId','start','end','sourceIn','intensity','reason'].includes(k))&&
    typeof e.assetId==='string'&&/^[a-f0-9]{64}$/.test(e.assetId)&&
    Number.isFinite(e.start)&&Number.isFinite(e.end)&&e.start>=0&&
    e.end-e.start>=.4&&e.end-e.start<=2.5&&
    Number.isFinite(e.intensity)&&e.intensity>=.05&&e.intensity<=.35&&
    (e.sourceIn===undefined||Number.isFinite(e.sourceIn)&&e.sourceIn>=0)&&
    typeof e.reason==='string'&&e.reason.trim().length>=5&&e.reason.length<=160&&
    e.start>=previousOverlayEnd+.2,'capa ambiental inválida o superpuesta');
  previousOverlayEnd=e.end;
 }
 validateGraphicSettings(value.graphicCards,value.transitions);
 validateMotionChoices(value.motionChoices);
 assert(value.motionLayerOverrides&&typeof value.motionLayerOverrides==='object'&&!Array.isArray(value.motionLayerOverrides)&&Object.keys(value.motionLayerOverrides).length<=50,'motion layer overrides');
 for(const [id,settings] of Object.entries(value.motionLayerOverrides)){
  assert(/^decision-\d+$/.test(id)&&settings&&Object.keys(settings).every(k=>['offset','layers'].includes(k)),'motion parent id');
  assert(Number.isFinite(settings.offset??0)&&Math.abs(settings.offset??0)<=4,'motion parent offset');
  assert(settings.layers&&typeof settings.layers==='object'&&!Array.isArray(settings.layers)&&Object.keys(settings.layers).length<=12,'motion layers');
  for(const [layer,change] of Object.entries(settings.layers))assert(/^[a-z][a-z0-9-]{0,30}$/.test(layer)&&change&&Object.keys(change).every(k=>['offset','text'].includes(k))&&Number.isFinite(change.offset??0)&&Math.abs(change.offset??0)<=2.5&&(change.text===undefined||typeof change.text==='string'&&change.text.trim()&&change.text.length<=52&&!/[\x00-\x1f\x7f]/.test(change.text)),'motion layer invalid');
 }
 validateMotionChoices(value.motionChoices);
 assert(!value.graphicCards.length||!value.highlightCaptions.length,'Elige citas destacadas o tarjetas gráficas en esta versión, no ambas.');
 value.keywordOverrides=validateKeywordOverrides(value.keywordOverrides);
 assert(typeof value.musicEnabled==='boolean'&&typeof value.duckMusic==='boolean'&&(value.musicGain===null||Number.isFinite(value.musicGain)&&value.musicGain>=0&&value.musicGain<=.18),'music settings invalid');
 assert(Array.isArray(value.musicTracks)&&value.musicTracks.length<=8,'music tracks 0..8');
 for(const t of value.musicTracks){
  assert(t&&Object.keys(t).every(k=>['assetId','start','end','sourceIn','gain','keyframes'].includes(k))&&typeof t.assetId==='string'&&/^[a-f0-9]{64}$/.test(t.assetId)&&
   Number.isFinite(t.start)&&Number.isFinite(t.end)&&t.start>=0&&t.end-t.start>=1/30&&
   Number.isFinite(t.sourceIn??0)&&(t.sourceIn??0)>=0&&Number.isFinite(t.gain)&&t.gain>=0&&t.gain<=1,'music track invalid');
  t.keyframes=validateKeyframes(t.keyframes??[],{duration:t.end-t.start,min:0,max:1});
 }
 assert(typeof value.motions==='boolean','motions boolean');
 assert(Array.isArray(value.montageCuts)&&value.montageCuts.length<=60&&Array.isArray(value.montageSplits)&&value.montageSplits.length<=120,'montage cuts/splits invalid');
 assert(Array.isArray(value.sourceCuts)&&value.sourceCuts.length<=60&&value.sourceCuts.every(c=>c&&Object.keys(c).length===2&&Object.keys(c).every(k=>k==='start'||k==='end')&&Number.isFinite(c.start)&&Number.isFinite(c.end)&&c.start>=0&&c.end>c.start),'sourceCuts must be ordered time ranges');
 assert(Array.isArray(value.hiddenCaptionIds)&&value.hiddenCaptionIds.length<=500&&value.hiddenCaptionIds.every(id=>typeof id==='string'&&/^seg-\d{3,}$/.test(id))&&new Set(value.hiddenCaptionIds).size===value.hiddenCaptionIds.length,'hiddenCaptionIds must be unique caption ids');
 value.hiddenCaptionIds=[...value.hiddenCaptionIds].sort();
 assert(Array.isArray(value.hiddenVisualEventIds)&&value.hiddenVisualEventIds.length<=500&&value.hiddenVisualEventIds.every(id=>typeof id==='string'&&/^[a-f0-9]{64}$/.test(id))&&new Set(value.hiddenVisualEventIds).size===value.hiddenVisualEventIds.length,'hidden visual event IDs invalid');
 value.hiddenVisualEventIds=[...value.hiddenVisualEventIds].sort();
 assert(value.captionTransforms&&typeof value.captionTransforms==='object'&&!Array.isArray(value.captionTransforms)&&Object.keys(value.captionTransforms).length<=500,'captionTransforms object');
 for(const [id,t] of Object.entries(value.captionTransforms))assert(/^seg-\d{3,}$/.test(id)&&t&&Object.keys(t).length===3&&Object.keys(t).every(k=>['dx','dy','scale'].includes(k))&&[t.dx,t.dy,t.scale].every(Number.isFinite)&&Math.abs(t.dx)<=420&&Math.abs(t.dy)<=1300&&t.scale>=.05&&t.scale<=12,'caption transform invalid');
 assert(value.captionScaleKeyframes&&typeof value.captionScaleKeyframes==='object'&&!Array.isArray(value.captionScaleKeyframes)&&Object.keys(value.captionScaleKeyframes).length<=500,'caption keyframes object');
 for(const [id,keys] of Object.entries(value.captionScaleKeyframes)){
  assert(/^seg-\d{3,}$/.test(id),'caption keyframe segment');
  value.captionScaleKeyframes[id]=validateKeyframes(keys,{duration:3600,min:.05,max:12,limit:32});
 }
 assert(value.captionTimingOverrides&&typeof value.captionTimingOverrides==='object'&&!Array.isArray(value.captionTimingOverrides)&&Object.keys(value.captionTimingOverrides).length<=500,'captionTimingOverrides object');
 for(const [id,t]of Object.entries(value.captionTimingOverrides))assert(/^seg-\d{3,}$/.test(id)&&t&&Object.keys(t).length===2&&Object.keys(t).every(k=>['start','end'].includes(k))&&Number.isFinite(t.start)&&Number.isFinite(t.end)&&t.start>=0&&t.end-t.start>=1/30,'caption timing invalid');
 assert(value.captionOverrides&&typeof value.captionOverrides==='object'&&!Array.isArray(value.captionOverrides),'captionOverrides object');
 assert(Object.keys(value.captionOverrides).length<=500,'too many overrides');
 for(const [id,text]of Object.entries(value.captionOverrides)){
  assert(/^seg-\d{3,}$/.test(id),'caption id');
  assert(typeof text==='string'&&text.trim().length>0&&text.length<=52&&!/[\x00-\x1f\x7f]/.test(text),'caption override text');
 }
 assert(Array.isArray(value.highlightCaptions)&&value.highlightCaptions.length<=50&&value.highlightCaptions.every(id=>typeof id==='string'&&/^seg-\d{3,}$/.test(id))&&new Set(value.highlightCaptions).size===value.highlightCaptions.length,'highlightCaptions: up to 50 unique caption ids');
 value.highlightCaptions=[...value.highlightCaptions].sort();
 return structuredClone(value);
}
// Offline, deterministic Spanish lexical baseline. Transcript content is data,
// never instructions. No model calls, factual rewriting, periodic effects or cuts.
export function buildAutomaticDirector({transcript,template,brand,camera,settings={}}){
 validateTranscript(transcript);const policy=compileTemplatePolicy(template,brand),options=validateEditorSettings(settings);
 assert(Object.hasOwn(STYLE_VARIANTS,template.id),'style renderer unavailable');
 const cuts=normalizeSourceCuts(transcript,options.sourceCuts,{preserveSpeech:false});
 const segments=keptSegments(transcript.sourceDuration,cuts);
 const mapped=mapWordsToTimeline(transcript,segments);
 if(!cuts.length)assert(mapped.words.length===transcript.words.length,'speech preservation');
 const cutoff=mapped.duration-Math.max(3,policy.outro.duration),candidates=[];
 const maxBase=Math.max(...camera.keyframes.map(k=>k.zoom));
 assert(Number.isFinite(maxBase)&&maxBase>=1&&maxBase<=1.6,'camera zoom');
 const target=policy.camera.targetZoom??Math.max(policy.camera.baseZoom,1.08);
 const scale=Math.min(options.zoomIntensity===0?1:policy.camera.baseZoom+(target-policy.camera.baseZoom)*options.zoomIntensity,policy.camera.maxZoom,1.6/maxBase);
 const permitted=policy.camera.zoomReasons;
 for(let i=0;i<mapped.words.length;i++){
  for(let count=3;count<=6&&i+count<=mapped.words.length;count++){
   const words=mapped.words.slice(i,i+count),text=words.map(w=>w.text.trim()).join(' '),hits=words.flatMap((w,k)=>{
    const kind=LEXICON.get(normalize(w.text));return kind&&permitted.includes(kind)?[{wordIndex:w.sourceWordIndex??i+k,kind,token:w.text}]:[];
   });
   if(words.slice(0,-1).some(w=>/[.!?…]$/.test(w.text)))continue;
   if(!hits.length||text.length>52||words[0].start<2||words.at(-1).end>cutoff)continue;
   const start=words[0].start,end=words.at(-1).end;
   if(end-start<.6||end-start>6)continue;
   candidates.push({text,start,end,sourceWordIndexes:words.map((w,k)=>w.sourceWordIndex??i+k),hits,score:hits.length*10+(/[.!?…]$/.test(text)?3:0)-count*.1,uncertainWordIndexes:words.flatMap((w,k)=>w.timingUncertain?[i+k]:[])});
  }
 }
 candidates.sort((a,b)=>b.score-a.score||a.start-b.start||a.sourceWordIndexes[0]-b.sourceWordIndexes[0]);
 const profile=visualProfile(template.id),decisions=[],chosen=[],limit=Math.min(profile.maxZoomEvents,Math.floor(mapped.duration/profile.secondsPerZoom));
 if(limit>0&&options.zoomIntensity>0&&scale>=policy.camera.baseZoom){
  for(const c of candidates){
   const start=c.start,end=Math.min(cutoff,Math.max(c.end,start+2.4));
   if(end-start<2.4-1e-6||chosen.some(e=>start<e.end+profile.zoomGap&&end>e.start-profile.zoomGap))continue;
   chosen.push({start,end});
   decisions.push({type:'zoom',start,end,reason:`Coincidencia léxica en locución: ${c.hits.map(h=>h.token).join(', ')}`,rule:'calma-lexical-v1',params:{scale,ramp:Math.min(1,(end-start)/2),reason:c.hits[0].kind},evidence:{...c,method:'spanish-lexicon-not-llm',timing:'existing-word-timestamps'}});
   if(chosen.length>=limit)break;
  }
 }
 if(options.motions){
  const quote=candidates.find(c=>c.text.length<=48&&c.sourceWordIndexes.length<=5&&/[.!?…]$/.test(c.text)&&c.end-c.start>=.6&&Math.min(cutoff,Math.max(c.end,c.start+2.2))-c.start>=1.5);
  if(quote)decisions.push({type:'motion',start:quote.start,end:Math.min(cutoff,Math.max(quote.end,quote.start+2.2)),reason:`Cita literal de palabras ${quote.sourceWordIndexes[0]}–${quote.sourceWordIndexes.at(-1)}`,rule:'calma-literal-quote-v1',params:{motionId:'QUOTE_CARD_01',bindings:{quote:quote.text},semanticReason:'reflection'},evidence:{...quote,displayEnd:Math.min(cutoff,Math.max(quote.end,quote.start+2.2)),displayHoldExtendsASRTimestamps:false,method:'exact-transcript-quote-not-llm',timing:'existing-word-timestamps'}});
 }
 decisions.sort((a,b)=>a.start-b.start||a.end-b.end);
 // Full-frame uploads have no face analysis. Do not invent subjects or eye anchors.
 if(camera.mode==='full-frame-fit')decisions.length=0;
 return {version:'1.0',templateId:template.id,timeSpace:'edit-timeline',selection:'offline-lexical-baseline-v1',decisions,segments,
  audit:{method:'deterministic Spanish lexical baseline; not LLM semantic understanding',framing:camera.mode??'existing-camera',faceAnalysis:camera.mode==='full-frame-fit'?'unavailable; full image preserved':'existing',sourceWords:transcript.words.length,mappedWords:mapped.words.length,omittedWords:transcript.words.length-mapped.words.length,cutsRemoved:cuts.length,externalCostUSD:0,visualProfile:profile,candidates:candidates.length,uncertainWordIndexes:transcript.words.flatMap((w,i)=>w.timingUncertain?[i]:[]),settings:options}};
}
