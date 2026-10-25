import {readFileSync,existsSync,lstatSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {foregroundSpaceHash,foregroundEffectFilters} from './foreground-effects.js';
import {fitCaptionSize} from './font-kits.js';
export const MODNET_SHA='07c308cf0fc7e6e8b2065a12ed7fc07e1de8febb7dc7839d7b7f15dd66584df9';
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const regular=p=>{try{const s=lstatSync(p);return s.isFile()&&!s.isSymbolicLink();}catch{return false;}};
const norm=s=>s.normalize('NFC').replace(/[^\p{L}]/gu,'').toLocaleUpperCase('es');
const weights=new Map([['MIEDO',6],['BLOQUEO',6],['BLOQUEOS',6],['LIBERTAD',5],['MUNDO',5],['INTERIOR',5],['OJOS',5],['CADENAS',5],['CULPA',4],['RECONOCER',4],['MIRAR',3],['CRECIMIENTO',4]]);
const overlap=(a,b)=>a.start<b.end&&a.end>b.start;
export function automaticTitleTop(plan,start,end){const points=(plan.semantic?.anchors??[]).flatMap(a=>a.points??[]).filter(p=>p.time>=start&&p.time<=end&&Number.isFinite(p.y));if(!points.length)throw Error('Automatic foreground: missing eye placement');const ys=points.map(p=>p.y).sort((a,b)=>a-b);return Math.round(Math.max(380,Math.min(1100,ys[Math.floor(ys.length/2)]*1920-320)));}
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
 const fail=m=>{throw Error('Automatic foreground: '+m);};
 const keys=['schema','sourceSha256','cameraSpaceSha256','runtime','startFrame','activeFrames','frames','events','evidence'];
 if(!data||Object.keys(data).some(k=>!keys.includes(k))||data.schema!=='sues-automatic-foreground/v1'||data.sourceSha256!==plan.source.sha256||data.cameraSpaceSha256!==foregroundSpaceHash(plan))fail('source/camera/timeline binding');
 const r=data.runtime,verified=r&&foregroundRuntime(dirname(dirname(r.modelFile??'')));
 if(!verified||JSON.stringify(r)!==JSON.stringify(verified))fail('approved local model/runtime unavailable');
 const {startFrame,activeFrames,frames}=data;
 if(![startFrame,activeFrames,frames].every(Number.isInteger)||startFrame<0||activeFrames<30||activeFrames>90||startFrame+activeFrames>frames||frames!==Math.ceil(plan.duration*30-1e-7)||frames>3600)fail('bounded inference window');
 const a=startFrame/30,b=(startFrame+activeFrames)/30;
 const es=data.events;
 if(!Array.isArray(es)||es.length!==2||es[0].type!=='background-blur'||es[0].sigma!==12||es[0].start!==a||es[0].end!==b||es[1].type!=='behind-text'||Math.abs(es[1].start-(a+.2))>1e-8||es[1].end!==b||!Array.isArray(es[1].lines)||es[1].lines.length!==1)fail('supported composition contract');
 if(es[1].top!==automaticTitleTop(plan,a,b))fail('eye-derived text placement changed');
 if(Object.keys(es[0]).some(k=>!['type','sigma','start','end'].includes(k))||Object.keys(es[1]).some(k=>!['type','start','end','lines','top'].includes(k)))fail('unknown event parameter');
 const e=data.evidence,c=plan.captions.find(c=>c.id===e?.captionId),i=e?.displayWordIndex;
 if(!c||c.source!=='auto'||!Number.isInteger(i)||norm(c.text.split(/\s+/)[i]??'')!==es[1].lines[0]||!weights.has(es[1].lines[0])||e.method!=='explicit-lexical-baseline-not-creative-model')fail('literal spoken evidence');
 const cue=c.wordCues.find(q=>q.wordIndexes.includes(c.wordIndexes[i]));
 if(!cue||cue.timingUncertain||startFrame!==Math.round((cue.start-.1)*30))fail('spoken timing changed');
 const hidden=[...(plan.selectedMedia??[]),...(plan.subjectLayers??[]),...(plan.illustrations??[]),...(plan.semantic?.motions??[]),...(plan.graphics??[]),...(plan.elements??[]),...(plan.depthText??[])];
 if(hidden.some(o=>overlap({start:a,end:b},o)))fail('incompatible resource overlap');
 foregroundEffectFilters(data,'base',1); // native font metrics and fixed filters, no supplied code
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
