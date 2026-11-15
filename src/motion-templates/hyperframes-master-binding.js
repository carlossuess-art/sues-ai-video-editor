/**
 * HyperFrames <-> SUES Master Director story binding.
 *
 * A motion is represented as ONE bona-fide canonical graphics operation, not
 * an undocumented side effect of an approved native batch. The source-to-edit
 * word mapping and exact HyperFrames CLI variables live in immutable trusted
 * preflight evidence. This layer never records approval or invokes an editor.
 */
import {createHash} from 'node:crypto';
import {mkdirSync,readFileSync,writeFileSync,existsSync,lstatSync} from 'node:fs';
import {join,resolve} from 'node:path';

const SHA=/^[a-f0-9]{64}$/;
const ID=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/;
const die=(message)=>{throw Error(message);};
const must=(v,message)=>{if(!v)die(message)};
const jsonSha=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const allIds=xs=>Array.isArray(xs)&&xs.every(x=>typeof x==='string'&&ID.test(x))&&new Set(xs).size===xs.length;

export const HF_MASTER_EFFECT='hyperframes-word-motion-v1';
export const HF_MASTER_RENDERER='hyperframes';
export const HF_PREFLIGHT_DIR='hyperframes-motion-preflights';

export function validateBoundHyperFramesPreflight(preflight){
 const p=preflight;
 must(p?.schema==='sues-editor-hyperframes-preflight/v1'&&
  p.status==='READY_FOR_CREATIVE_REVIEW'&&p.canExecute===false&&
  p.creativeApproved===false&&p.rendered===false&&p.productionChanged===false,
  'HyperFrames proof must be an unapproved, exact, source-bound editor preflight');
 must(SHA.test(p.sourceSha256)&&SHA.test(p.jobFingerprint)&&SHA.test(p.timelineFingerprint)&&
  SHA.test(p.proposedPlanFingerprint)&&SHA.test(p.hyperframes?.variablesSha256),
  'Preflight identity evidence missing');
 must(p.scene?.frames===151&&p.scene?.fps===30&&
  p.scene?.width===1080&&p.scene?.height===1920&&
  Number.isInteger(p.scene.startFrame)&&p.scene.startFrame>=0&&
  p.scene.endFrameExclusive===p.scene.startFrame+151,
  'HyperFrames native timing geometry incorrect');
 must(p.templateId==='SUES_CARD_TO_SPACE_DEMO'&&
  p.hyperframes.composition==='examples/motions/hyperframes-card-to-space'&&
  p.hyperframes.runtimeScheduleSchema==='sues-hyperframes-word-schedule/v1',
  'Unverified HyperFrames composition');
 must(p.sourceTimeSpace==='original-seconds-identity-map-only',
  'Missing verified identity source/edit time map');
 const words=[...(p.words?.card??[]),...(p.words?.follow??[])];
 must(words.length===8&&allIds(words.map(x=>x.id))&&
  words.every(w=>Number.isInteger(w.editedFrame)&&
    w.editedFrame>=p.scene.startFrame&&w.editedFrame<p.scene.endFrameExclusive&&
    Number.isInteger(w.motionFrame)&&
    w.editedFrame===p.scene.startFrame+w.motionFrame&&
    typeof w.text==='string'&&w.text.trim()),
  'Eight exact, source-bound word anchors required');
 must(typeof p.avMarkdown==='string'&&p.avMarkdown.includes('NO IMPORTABLE')&&
  p.avMarkdown.includes('GUION TÉCNICO A/V'),'Editable human A/V script missing');
 const v=p.hyperframes.variables,schedule=v&&JSON.parse(v.wordScheduleJson);
 must(v&&Object.keys(v).sort().join(',')==='followLine1,followLine2,line1,line2,wordScheduleJson'&&
  schedule?.schema==='sues-hyperframes-word-schedule/v1'&&
  jsonSha(v)===p.hyperframes.variablesSha256&&
  JSON.stringify(schedule.wordIds)===JSON.stringify(words.slice(0,4).map(w=>w.id))&&
  JSON.stringify(schedule.followWordIds)===JSON.stringify(words.slice(4).map(w=>w.id))&&
  JSON.stringify(schedule.wordStartFrames)===JSON.stringify(words.slice(0,4).map(w=>w.motionFrame))&&
  JSON.stringify(schedule.followWordStartFrames)===JSON.stringify(words.slice(4).map(w=>w.motionFrame)),
  'HyperFrames variables do not match the approved speech evidence');
 return {preflightFingerprint:jsonSha(p),operationSourceSha256:p.sourceSha256,
  sourceWordIds:words.map(w=>w.id),sourceTimeFingerprint:p.timelineFingerprint};
}
export function makeHyperFramesMasterOperation(preflight,{sceneId,operationId='motion_hyperframes_card_to_space',zIndex=50}={}){
 const verified=validateBoundHyperFramesPreflight(preflight);
 must(ID.test(sceneId??'')&&ID.test(operationId)&&Number.isInteger(zIndex)&&
  zIndex>=0&&zIndex<=500,'Master motion ID, scene or layer invalid');
 const s=preflight.scene;
 return {id:operationId,sceneId,start:s.startFrame/30,end:s.endFrameExclusive/30,
  track:'graphics',renderer:HF_MASTER_RENDERER,effect:HF_MASTER_EFFECT,
  reason:'Explicar con una pregunta y abrir espacio, anclados a las palabras verificadas de la narración',
  parameters:{
   templateId:preflight.templateId,
   preflightFingerprint:verified.preflightFingerprint,
   motionFingerprint:preflight.proposedPlanFingerprint,
   variablesSha256:preflight.hyperframes.variablesSha256,
   sourceWordIds:verified.sourceWordIds,
   variables:structuredClone(preflight.hyperframes.variables),
   composition:preflight.hyperframes.composition,
   visual:{rect:{x:0,y:0,width:s.width,height:s.height},zIndex,opacity:1,
    keyframes:[],stack:'full-frame-motion'}
  },
  dependsOn:[],requiredQA:['rendered-frame','motion-playback','narrative-review','time-sync']};
}
export function proposeHyperFramesStoryRevision(story,preflight,{sceneId,operationId,zIndex}={}){
 const op=makeHyperFramesMasterOperation(preflight,{sceneId,operationId,zIndex});
 must(story?.schema==='sues-master-story/v1'&&
  story.sourceSha256===preflight.sourceSha256&&
  story.timeline?.fingerprint===preflight.timelineFingerprint&&
  story.timeline?.fps===30&&story.timeline?.timeSpace==='edit-timeline'&&
  Number.isFinite(story.timeline.duration)&&
  preflight.scene.endSec<=story.timeline.duration+1e-6,
  'Master story does not match exact source and edited timeline');
 const scenes=story.narrative?.scenes??[];
 must(Array.isArray(scenes)&&scenes.filter(s=>s.id===sceneId&&
  s.start<=op.start&&s.end>=op.end).length===1,
  'Motion interval must fit exactly inside a reviewed master scene');
 const ops=story.operations;
 must(Array.isArray(ops)&&ops.length>0&&ops.length<1500&&
  !ops.some(o=>o.id===op.id),
  'Master operation ID already exists or operations unavailable');
 const copy=structuredClone(story);
 copy.operations.push(op);
 return {story:copy,operationId:op.id,preflightFingerprint:op.parameters.preflightFingerprint,
  sourceSha256:preflight.sourceSha256,timelineFingerprint:preflight.timelineFingerprint,
  status:'DRAFT_REQUIRES_NEW_MASTER_REVIEW',canExecute:false,creativeApproved:false};
}
function rootFor(jobDirectory){
 must(typeof jobDirectory==='string'&&jobDirectory.startsWith('/'),'Private job directory required');
 return join(resolve(jobDirectory),'master-director',HF_PREFLIGHT_DIR);
}
export function persistTrustedHyperFramesPreflight(jobDirectory,preflight){
 const receipt=validateBoundHyperFramesPreflight(preflight);
 const dir=rootFor(jobDirectory),file=join(dir,receipt.preflightFingerprint+'.json');
 mkdirSync(dir,{recursive:true,mode:0o700});
 const bytes=JSON.stringify(preflight);
 if(existsSync(file)){
  must(readFileSync(file,'utf8')===bytes,'Immutable preflight content collision');
 }else writeFileSync(file,bytes,{flag:'wx',mode:0o600});
 return {...receipt,path:file};
}
export function loadTrustedHyperFramesPreflight(jobDirectory,fingerprint){
 must(SHA.test(fingerprint??''),'Invalid HyperFrames preflight ref');
 const file=join(rootFor(jobDirectory),fingerprint+'.json');
 const stat=lstatSync(file);
 must(stat.isFile()&&!stat.isSymbolicLink()&&stat.size<=42000&&
  (stat.mode&0o077)===0,'Unsafe HyperFrames preflight artifact');
 const bytes=readFileSync(file,'utf8'),p=JSON.parse(bytes);
 must(jsonSha(p)===fingerprint,'Immutable HyperFrames preflight tampered');
 validateBoundHyperFramesPreflight(p);
 return p;
}
export function verifyMasterHyperFramesOperation(operation,preflight,registry){
 const p=preflight;
 const expected=makeHyperFramesMasterOperation(p,{sceneId:operation.sceneId,
  operationId:operation.id});
 const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 must(equal(operation,expected),'Master HyperFrames motion operation differs from reviewed preflight');
 must(registry?.sourceSha256===p.sourceSha256&&
  registry?.timelineFingerprint===p.timelineFingerprint,
  'Master approval context/source has changed');
 must(registry?.rendererCapabilities?.hyperframes?.includes(HF_MASTER_EFFECT),
  'HyperFrames master effect is not server-authorized');
 must(registry?.canvas?.width===1080&&registry.canvas.height===1920,
  'HyperFrames canvas changed');
 return {status:'READY_FOR_EDITOR_PREVIEW',operationId:operation.id,
  sourceSha256:p.sourceSha256,preflightFingerprint:expected.parameters.preflightFingerprint,
  renderAuthorized:false,creativeApproved:false};
}
