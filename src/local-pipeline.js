import {fontFiles,resolveFontDirectory} from './font-kits.js';
import {readFileSync,writeFileSync,mkdirSync,cpSync,existsSync,realpathSync,openSync,readSync,closeSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {buildAutomaticDirector,validateEditorSettings} from './automatic-director.js';
import {prepareLocalPreview,buildPreviewASS,buildPreviewFilter,wrapCaption} from './local-preview.js';
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export const RENDER_SCRIPT=join(ROOT,'scripts/templates/render_local_preview.py');
const ENGINE_HASH=createHash('sha256').update(Buffer.concat(['font-kits.js','short-captions.js','audio-mix.js','automatic-director.js','local-pipeline.js','local-preview.js','semantic-render.js','transcript.js','template.js','cinematic-style.js','director-contract.js','motion-library.js','vision.js','reframe.js','time-map.js','brand-kit.js','foundation-integration.js'].map(f=>readFileSync(join(ROOT,'src',f))).concat(readFileSync(RENDER_SCRIPT)))).digest('hex');
export function fileSha256(path){const fd=openSync(path,'r'),hash=createHash('sha256'),buffer=Buffer.allocUnsafe(1024*1024);try{let size;while((size=readSync(fd,buffer,0,buffer.length,null))>0)hash.update(buffer.subarray(0,size));return hash.digest('hex');}finally{closeSync(fd);}}
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v;
export function loadProject(configPath){
 const path=realpathSync(configPath),config=read(path),base=dirname(path);
 const local=p=>realpathSync(resolve(base,p));
 const inputs={template:read(local(config.templatePath)),brand:read(local(config.brandKitPath)),transcript:read(local(config.transcriptPath)),camera:read(local(config.cameraPath)),visionFrames:read(local(config.visionPath)).frames,catalog:read(local(config.catalogPath)),source:config.source,...(config.backgroundAudio?{backgroundAudio:{...config.backgroundAudio,localFile:local(config.backgroundAudio.localFile)}}:{})};
 const sourcePath=local(config.sourcePath),sourceSha256=fileSha256(sourcePath);
 if(config.source?.sha256&&config.source.sha256!==sourceSha256)throw new Error('Source SHA256 mismatch');
 const boundHashes={source:sourceSha256,...(inputs.backgroundAudio?{backgroundAudio:fileSha256(inputs.backgroundAudio.localFile)}:{})};
 const family=inputs.template.captions.font??inputs.brand.fonts.primary,fontDirectory=resolveFontDirectory(resolve(base,config.fontDirectory),family);
 const fontHashes=Object.fromEntries(fontFiles(family).map(f=>[f,createHash('sha256').update(readFileSync(join(fontDirectory,f))).digest('hex')]));
 return {boundHashes,fontHashes,configPath:path,sourcePath,fontDirectory,inputs,title:config.title??'SUES · CALMA'};
}
export function prepareProject(project,settings={}){
 const options=validateEditorSettings(settings),inputs={...project.inputs,template:structuredClone(project.inputs.template)};if(inputs.template.captions.mode==='short-groups')inputs.template.captions.maxWords=options.captionWords;
 const automatic=buildAutomaticDirector({...inputs,settings:options}),rejections=[];
 const base=prepareLocalPreview({...inputs,segments:automatic.segments});
 for(const id of Object.keys(options.captionOverrides))if(!base.captions.some(c=>c.id===id))throw new Error(`Unknown caption: ${id}`);
 const editedCaptions=base.captions.map(c=>Object.hasOwn(options.captionOverrides,c.id)?{...c,text:options.captionOverrides[c.id].trim(),lines:wrapCaption(options.captionOverrides[c.id].trim(),base.policy.captions.maxCharsPerLine),source:'manual',originalText:c.text}:c);
 const manual=[];
 for(const id of options.highlightCaptions){
  const c=editedCaptions.find(c=>c.id===id);if(!c)throw new Error(`Unknown highlight caption: ${id}`);
  if(!options.motions)continue;
  const cutoff=base.duration-base.policy.outro.duration,end=Math.min(cutoff,Math.max(c.end,c.start+2.2));
  if(c.start<2||c.end>cutoff||end-c.start<1.5||end-c.start>6)throw new Error(`La frase de ${c.start.toFixed(1)} s está demasiado cerca del inicio o del cierre para destacarla.`);
  manual.push({type:'motion',start:c.start,end,reason:`Frase elegida por usuario: ${id}`,rule:'user-caption-quote-v1',params:{motionId:'QUOTE_CARD_01',bindings:{quote:c.text},semanticReason:'reflection'},evidence:{method:'user-caption-selection',captionId:id,sourceWordIndexes:c.wordIndexes,captionStart:c.start,captionEnd:c.end,displayEnd:end,textOrigin:c.source==='manual'?'user-edited-caption':'transcript-caption',originalText:c.originalText??c.text}});
 }
 const candidates=[...automatic.decisions.filter(d=>!manual.length||d.type!=='motion'),...manual].sort((a,b)=>a.start-b.start||a.end-b.end);
 let decisions=[],plan=base;
 for(const candidate of candidates){
  try{
   const next=[...decisions,candidate].sort((a,b)=>a.start-b.start||a.end-b.end);
   plan=prepareLocalPreview({...inputs,segments:automatic.segments,director:{...automatic,decisions:next}});decisions=next;
  }catch(error){
   if(candidate.rule==='user-caption-quote-v1')throw new Error(`La frase de ${candidate.start.toFixed(1)} s no cabe de forma segura con estos ajustes. Elige otra frase.`);
   rejections.push({rule:candidate.rule,start:candidate.start,end:candidate.end,reason:error.message});
  }
 }
 const emphasis=new Set(decisions.flatMap(d=>(d.evidence?.hits??[]).map(h=>h.wordIndex)));
 plan.captions=editedCaptions.map(c=>({...c,emphasisWordIndexes:c.source==='manual'?[]:c.wordIndexes.filter(i=>emphasis.has(i))}));
 const director={...automatic,...(manual.length?{selection:'offline-lexical-baseline-with-user-review-v1'}:{}),decisions,audit:{...automatic.audit,rejections,acceptedEvents:decisions.length,manualHighlights:manual.length}};
 plan.automaticDirector=director.audit;
 plan.pending=plan.pending.filter(p=>p!=='automated-director-selection');plan.pending.push('llm-semantic-director-and-human-review');
 const fingerprint=createHash('sha256').update(JSON.stringify(stable({inputs:project.inputs,boundHashes:project.boundHashes??{},fontHashes:project.fontHashes??{},settings:options,engine:ENGINE_HASH}))).digest('hex');
 return {plan,director,settings:options,fingerprint};
}
export function writePreparedBundle(project,prepared,outputDirectory){
 const out=resolve(outputDirectory);
 if(existsSync(out))throw new Error('Bundle directory must be new');
 mkdirSync(out,{recursive:true,mode:0o700});
 for(const [file,value]of [['manifest.json',prepared.plan],['director.json',prepared.director],['settings.json',prepared.settings]])writeFileSync(join(out,file),JSON.stringify(value,null,2)+'\n');
 writeFileSync(join(out,'captions.ass'),buildPreviewASS(prepared.plan));
 writeFileSync(join(out,'filter.ffscript'),buildPreviewFilter(prepared.plan));
 cpSync(project.fontDirectory,join(out,'fonts'),{recursive:true});
 writeFileSync(join(out,'preparation.json'),JSON.stringify({fingerprint:prepared.fingerprint,engine:'local-pipeline-v1',costUSD:0,productionReady:false},null,2)+'\n');
 return out;
}
