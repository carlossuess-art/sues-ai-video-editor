import {readFileSync,existsSync,lstatSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {foregroundSpaceHash,foregroundEffectFilters} from './foreground-effects.js';
import {fitCaptionSize} from './font-kits.js';
import {MODNET_SHA,FOREGROUND_WEIGHTS as weights,automaticTitleTop,validateAutomaticForegroundPolicy} from './foreground-policy.js';
export {MODNET_SHA,automaticTitleTop};
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const regular=p=>{try{const s=lstatSync(p);return s.isFile()&&!s.isSymbolicLink();}catch{return false;}};
const norm=s=>s.normalize('NFC').replace(/[^\p{L}]/gu,'').toLocaleUpperCase('es');
export function foregroundRuntime(directory){
 const root=join(resolve(directory),'models');
 try{
  if(lstatSync(root).isSymbolicLink())return null;
  const meta=JSON.parse(readFileSync(join(root,'runtime.json'),'utf8'));
  if(meta.schema!=='sues-visual-runtime/v1'||meta.enabled!==true||meta.modnetSha256!==MODNET_SHA||meta.onnxruntime!=='1.31.0'||meta.numpy!=='2.4.6')return null;
  const value={modelFile:join(root,'modnet.onnx'),runtimeDirectory:join(root,'python311'),cacheDirectory:join(root,'cache'),modelSha256:MODNET_SHA};
  if(!regular(value.modelFile)||hash(value.modelFile)!==MODNET_SHA||!regular(join(value.runtimeDirectory,'onnxruntime','__init__.py'))||!regular(join(value.runtimeDirectory,'numpy','__init__.py'))||!lstatSync(value.cacheDirectory).isDirectory()||lstatSync(value.cacheDirectory).isSymbolicLink())return null;
  return value;
 }catch{return null;}
}
export function validateAutomaticForeground(data,plan){
 validateAutomaticForegroundPolicy(data,plan,foregroundSpaceHash(plan));
 const r=data.runtime,verified=r&&foregroundRuntime(dirname(dirname(r.modelFile??'')));
 if(!verified||JSON.stringify(r)!==JSON.stringify(verified))throw Error('Automatic foreground: approved local model/runtime unavailable');
 foregroundEffectFilters(data,'base',1);
 return structuredClone(data);
}
export function prepareAutomaticForeground(plan,settings,runtime){
 if(!runtime||settings.motions===false||settings.depthEnabled===false||settings.styleId!=='SUES_DOPAMIN'||!settings.autoRecipe||!plan.camera.mode.startsWith('face-eye')||plan.duration>120)return null;
 const candidates=[];
 for(const c of plan.captions){
  if(c.source!=='auto')continue;
  for(const [i,text]of c.text.split(/\s+/).entries()){
   const word=norm(text),weight=weights.get(word);if(!weight||word.length>12)continue;
   const cue=c.wordCues.find(q=>q.wordIndexes.includes(c.wordIndexes[i]));
   if(!cue||cue.timingUncertain||cue.start<3.5||cue.start>14)continue;
   try{fitCaptionSize([word],{font:'Montserrat',fontRole:'keyword',fontSize:140},780);}catch{continue;}
   candidates.push({c,i,word,weight,time:cue.start});
  }
 }
 for(const item of candidates.sort((a,b)=>b.weight-a.weight||a.time-b.time)){
  const startFrame=Math.round((item.time-.1)*30),end=Math.min(Math.floor((plan.duration-plan.policy.outro.duration-.1)*30),startFrame+84),a=startFrame/30,b=end/30;
  if(end-startFrame<30)continue;
  const data={schema:'sues-automatic-foreground/v1',sourceSha256:plan.source.sha256,cameraSpaceSha256:foregroundSpaceHash(plan),runtime,startFrame,activeFrames:end-startFrame,frames:Math.ceil(plan.duration*30-1e-7),
   events:[{type:'background-blur',start:a,end:b,sigma:12},{type:'behind-text',start:a+.2,end:b,lines:[item.word],top:automaticTitleTop(plan,a,b)}],
   evidence:{method:'explicit-lexical-baseline-not-creative-model',captionId:item.c.id,displayWordIndex:item.i,word:item.word}};
  try{return validateAutomaticForeground(data,plan);}catch{} // rejected placements stay absent, never weaken a guard
 }
 return null;
}

export function cachedAutomaticMatte(request){
 const r=request.runtime,verified=r&&foregroundRuntime(dirname(dirname(r.modelFile??'')));
 if(!verified||JSON.stringify(r)!==JSON.stringify(verified))throw Error('Renderiza la versión antes de copiar: runtime de máscara no disponible');
 const binding=Object.fromEntries(['sourceSha256','cameraSpaceSha256','startFrame','activeFrames','frames'].map(k=>[k,request[k]]));
 Object.assign(binding,{modelSha256:MODNET_SHA,onnxruntime:'1.31.0',numpy:'2.4.6'});
 const stable=o=>JSON.stringify(Object.fromEntries(Object.entries(o).sort(([a],[b])=>a<b?-1:a>b?1:0)));
 const key=createHash('sha256').update(stable(binding)).digest('hex'),dir=join(r.cacheDirectory,key),manifest=join(dir,'manifest.json'),path=join(dir,'mask.mkv');
 try{if(lstatSync(dir).isSymbolicLink()||!regular(manifest)||lstatSync(manifest).size>65536||!regular(path))throw Error();
  const meta=JSON.parse(readFileSync(manifest,'utf8'));
  if(meta.schema!=='sues-derived-matte/v1'||stable(meta.binding)!==stable(binding)||meta.reviewStatus!=='predicted-unreviewed'||meta.inferredFrames!==request.activeFrames||hash(path)!==meta.matteSha256)throw Error();
  return {path,meta};
 }catch{throw Error('Renderiza la versión antes de copiar: la máscara derivada falta o ha cambiado');}
}
