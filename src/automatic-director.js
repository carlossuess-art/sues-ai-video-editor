import {validateSfxEvents} from './custom-sfx.js';
import {validateElements} from './elements.js';
import {STYLE_VARIANTS,visualProfile} from './style-variants.js';
import {validateMotionChoices} from './motion-overlays.js';
import {validateGraphicSettings} from './graphic-blocks.js';
import {validateKeywordOverrides} from './text-presets.js';
import {validateTranscript,mapWordsToTimeline} from './transcript.js';
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
 assert(Object.keys(settings).every(k=>['autoRecipe','sfxEvents','sfxEnabled','sfxGain','motionChoices','zoomIntensity','motions','captionOverrides','highlightCaptions','captionWords','keywordOverrides','musicEnabled','musicGain','duckMusic','graphicCards','transitions','musicAssetId','imageEvents','profileImages','styleId','elements'].includes(k)),'unknown setting');
 validateElements(settings.elements);
 const value={autoRecipe:false,sfxEvents:[],sfxEnabled:false,sfxGain:.35,motionChoices:[],styleId:'SUES_CALMA',musicAssetId:null,imageEvents:[],profileImages:true,graphicCards:[],transitions:[],keywordOverrides:{},musicEnabled:true,musicGain:null,duckMusic:true,captionWords:3,zoomIntensity:1,motions:true,captionOverrides:{},highlightCaptions:[],...settings};
 assert(typeof value.autoRecipe==='boolean','autoRecipe boolean');
 value.sfxEvents=validateSfxEvents(value.sfxEvents);
 assert(typeof value.sfxEnabled==='boolean'&&Number.isFinite(value.sfxGain)&&value.sfxGain>=0&&value.sfxGain<=.7,'sfx settings');
 assert(Number.isFinite(value.zoomIntensity)&&value.zoomIntensity>=0&&value.zoomIntensity<=1,'zoomIntensity 0..1');
 assert([1,2,3].includes(value.captionWords),'captionWords 1, 2 or 3');
 assert(Object.hasOwn(STYLE_VARIANTS,value.styleId),'style id');
 assert(value.musicAssetId===null||typeof value.musicAssetId==='string'&&/^[a-f0-9]{64}$/.test(value.musicAssetId),'music asset id');
 assert(typeof value.profileImages==='boolean'&&Array.isArray(value.imageEvents)&&value.imageEvents.length<=6,'image settings');
 for(const e of value.imageEvents)assert(e&&Object.keys(e).every(k=>['assetId','start','end'].includes(k))&&typeof e.assetId==='string'&&/^[a-f0-9]{64}$/.test(e.assetId)&&Number.isFinite(e.start)&&Number.isFinite(e.end)&&e.start>=0&&e.end-e.start>=.6&&e.end-e.start<=8,'image event invalid');
 validateGraphicSettings(value.graphicCards,value.transitions);
 validateMotionChoices(value.motionChoices);
 assert(!value.graphicCards.length||!value.highlightCaptions.length,'Elige citas destacadas o tarjetas gráficas en esta versión, no ambas.');
 value.keywordOverrides=validateKeywordOverrides(value.keywordOverrides);
 assert(typeof value.musicEnabled==='boolean'&&typeof value.duckMusic==='boolean'&&(value.musicGain===null||Number.isFinite(value.musicGain)&&value.musicGain>=0&&value.musicGain<=.18),'music settings invalid');
 assert(typeof value.motions==='boolean','motions boolean');
 assert(value.captionOverrides&&typeof value.captionOverrides==='object'&&!Array.isArray(value.captionOverrides),'captionOverrides object');
 assert(Object.keys(value.captionOverrides).length<=500,'too many overrides');
 for(const [id,text]of Object.entries(value.captionOverrides)){
  assert(/^seg-\d{3,}$/.test(id),'caption id');
  assert(typeof text==='string'&&text.trim().length>0&&text.length<=52&&!/[\x00-\x1f\x7f]/.test(text),'caption override text');
 }
 assert(Array.isArray(value.highlightCaptions)&&value.highlightCaptions.length<=3&&value.highlightCaptions.every(id=>typeof id==='string'&&/^seg-\d{3,}$/.test(id))&&new Set(value.highlightCaptions).size===value.highlightCaptions.length,'highlightCaptions: up to3 unique caption ids');
 value.highlightCaptions=[...value.highlightCaptions].sort();
 return structuredClone(value);
}
// Offline, deterministic Spanish lexical baseline. Transcript content is data,
// never instructions. No model calls, factual rewriting, periodic effects or cuts.
export function buildAutomaticDirector({transcript,template,brand,camera,settings={}}){
 validateTranscript(transcript);const policy=compileTemplatePolicy(template,brand),options=validateEditorSettings(settings);
 assert(Object.hasOwn(STYLE_VARIANTS,template.id),'style renderer unavailable');
 const segments=[{in:0,out:transcript.sourceDuration}];
 const mapped=mapWordsToTimeline(transcript,segments);
 assert(mapped.words.length===transcript.words.length,'speech preservation');
 const cutoff=transcript.sourceDuration-Math.max(3,policy.outro.duration),candidates=[];
 const maxBase=Math.max(...camera.keyframes.map(k=>k.zoom));
 assert(Number.isFinite(maxBase)&&maxBase>=1&&maxBase<=1.6,'camera zoom');
 const target=policy.camera.targetZoom??Math.max(policy.camera.baseZoom,1.08);
 const scale=Math.min(options.zoomIntensity===0?1:policy.camera.baseZoom+(target-policy.camera.baseZoom)*options.zoomIntensity,policy.camera.maxZoom,1.6/maxBase);
 const permitted=policy.camera.zoomReasons;
 for(let i=0;i<transcript.words.length;i++){
  for(let count=3;count<=6&&i+count<=transcript.words.length;count++){
   const words=transcript.words.slice(i,i+count),text=words.map(w=>w.text.trim()).join(' '),hits=words.flatMap((w,k)=>{
    const kind=LEXICON.get(normalize(w.text));return kind&&permitted.includes(kind)?[{wordIndex:i+k,kind,token:w.text}]:[];
   });
   if(words.slice(0,-1).some(w=>/[.!?…]$/.test(w.text)))continue;
   if(!hits.length||text.length>52||words[0].start<2||words.at(-1).end>cutoff)continue;
   const start=words[0].start,end=words.at(-1).end;
   if(end-start<.6||end-start>6)continue;
   candidates.push({text,start,end,sourceWordIndexes:words.map((_,k)=>i+k),hits,score:hits.length*10+(/[.!?…]$/.test(text)?3:0)-count*.1,uncertainWordIndexes:words.flatMap((w,k)=>w.timingUncertain?[i+k]:[])});
  }
 }
 candidates.sort((a,b)=>b.score-a.score||a.start-b.start||a.sourceWordIndexes[0]-b.sourceWordIndexes[0]);
 const profile=visualProfile(template.id),decisions=[],chosen=[],limit=Math.min(profile.maxZoomEvents,Math.floor(transcript.sourceDuration/profile.secondsPerZoom));
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
  audit:{method:'deterministic Spanish lexical baseline; not LLM semantic understanding',framing:camera.mode??'existing-camera',faceAnalysis:camera.mode==='full-frame-fit'?'unavailable; full image preserved':'existing',sourceWords:transcript.words.length,mappedWords:mapped.words.length,omittedWords:0,cutsRemoved:0,externalCostUSD:0,visualProfile:profile,candidates:candidates.length,uncertainWordIndexes:transcript.words.flatMap((w,i)=>w.timingUncertain?[i]:[]),settings:options}};
}
