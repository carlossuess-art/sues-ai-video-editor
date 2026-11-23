// Render-independent editable layer graph: exact layers, frames, parameters and provenance.
// NOT a renderer or a guarantee that the current web editor can edit Remotion layers.
import {reviewMasterDirectorPlan} from './master-director-gate.js';
export const LAYER_GRAPH_SCHEMA='sues-layer-graph/v1';
const VISUAL=new Set(['camera','subject','broll','graphics','captions','transition']);
const AUDIO=new Set(['music','sfx','voice']);
const ID=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/;
const finite=Number.isFinite;
const obj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const validId=v=>typeof v==='string'&&ID.test(v);
const failure=(issues,code,operationId='graph')=>issues.push({code,operationId});
const rgba=/^#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?$/;
function keyframeCheck(keyframes,span){
 if(!Array.isArray(keyframes)||keyframes.length>120)return false;
 let prev=-1;
 for(const k of keyframes){
  if(!obj(k)||!Number.isInteger(k.atFrame)||k.atFrame<0||k.atFrame>span||k.atFrame<=prev||
     !['linear','ease-in','ease-out','ease-in-out','spring'].includes(k.easing??'linear')||
     (k.opacity!==undefined&&(!finite(k.opacity)||k.opacity<0||k.opacity>1))||
     (k.scale!==undefined&&(!finite(k.scale)||k.scale<=0||k.scale>10))||
     (k.x!==undefined&&!finite(k.x))||(k.y!==undefined&&!finite(k.y))||
     (k.rotation!==undefined&&!finite(k.rotation)))return false;
  prev=k.atFrame;
 }
 return true;
}
function visualCheck(o,registry,start,end,issues){
 const p=o.parameters,v=p.visual;
 if(o.renderer==='native'){
  // The native editor may auto-position elements. Preserve its decisions but do
  // NOT present them as freely editable or spatially identical to Remotion.
  return {status:'native-controls-only',visual:null};
 }
 if(!obj(v)||!obj(v.rect)||!Number.isInteger(v.zIndex)||v.zIndex<0||v.zIndex>500||
    !finite(v.opacity)||v.opacity<0||v.opacity>1)
   {failure(issues,'EXACT_LAYER_GEOMETRY_MISSING',o.id);return null;}
 const {x,y,width,height}=v.rect;
 const c=registry.canvas;
 if(!obj(c)||![c.width,c.height].every(finite)||c.width<=0||c.height<=0||
    ![x,y,width,height].every(finite)||width<=0||height<=0||
    x<0||y<0||x+width>c.width+.000001||y+height>c.height+.000001){
   failure(issues,'LAYER_RECT_OUT_OF_CANVAS',o.id);return null;
 }
 if(!keyframeCheck(v.keyframes??[],end-start))
   failure(issues,'LAYER_KEYFRAMES_INVALID',o.id);
 if((o.track==='captions'||typeof p.text==='string')&&
    (!obj(v.typography)||typeof v.typography.family!=='string'||!v.typography.family.trim()||
      !finite(v.typography.sizePx)||v.typography.sizePx<=0||v.typography.sizePx>500||
      !finite(v.typography.weight)||v.typography.weight<100||v.typography.weight>1000||
      !rgba.test(v.typography.color??'')))
   failure(issues,'TYPOGRAPHY_PARAMETERS_MISSING',o.id);
 if(o.effect==='subject-occlusion'||v.stack==='behind-subject'){
   const m=v.mask,proof=registry.maskEvidence?.[m?.proofId];
   if(!obj(m)||!validId(m.proofId)||!proof||proof.verified!==true||
      proof.sourceSha256!==registry.sourceSha256||
      !finite(proof.start)||!finite(proof.end)||proof.start>o.start||proof.end<o.end)
     failure(issues,'SUBJECT_MASK_NOT_VERIFIED',o.id);
 }
 return {status:'parameterized-layer',visual:structuredClone(v)};
}
export function buildMasterDirectorLayerGraph(plan,registry={}){
 const preflight=reviewMasterDirectorPlan(plan,registry);
 if(preflight.status!=='READY_TO_EXECUTE')
  return {status:preflight.status,issues:preflight.issues,graph:null};
 const issues=[],nodes=[],fps=plan.timeline.fps;
 for(const o of plan.operations){
  const start=Math.round(o.start*fps),end=Math.round(o.end*fps);
  // Exact composition boundaries must never be silently rounded to another frame.
  if(o.renderer==='remotion'&&(Math.abs(start/fps-o.start)>1e-6||Math.abs(end/fps-o.end)>1e-6)){
   failure(issues,'OPERATION_NOT_FRAME_ALIGNED',o.id);continue;
  }
  if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||end<=start||
     Math.abs(start/fps-o.start)>1/(fps*2)+.000001||
     Math.abs(end/fps-o.end)>1/(fps*2)+.000001){
   failure(issues,'OPERATION_FRAME_ALIGNMENT_INVALID',o.id);continue;
  }
  const base={id:o.id,sceneId:o.sceneId,track:o.track,renderer:o.renderer,effect:o.effect,
    startFrame:start,endFrame:end,startTime:o.start,endTime:o.end,reason:o.reason,dependencies:[...(o.dependsOn??[])],
    requiredQA:[...(o.requiredQA??[])],
    resource:o.resourceId?{id:o.resourceId,sha256:o.resourceSha256??null}:null,
    motifId:o.motifId??null,speechAnchor:o.speechAnchor?structuredClone(o.speechAnchor):null,
    sourceParameters:structuredClone(o.parameters)};
  if(VISUAL.has(o.track)){
   const v=visualCheck(o,registry,start,end,issues);
   if(v)nodes.push({...base,editability:v.status,visual:v.visual});
  }else if(AUDIO.has(o.track)){
   if(!obj(o.parameters)||o.parameters.gain!==undefined&&
      (!finite(o.parameters.gain)||o.parameters.gain<0||o.parameters.gain>2))
    failure(issues,'AUDIO_LAYER_PARAMETERS_INVALID',o.id);
   nodes.push({...base,editability:'independent-audio-track',visual:null});
  }else failure(issues,'UNKNOWN_LAYER_TRACK',o.id);
 }
 const visual=nodes.filter(n=>n.editability==='parameterized-layer').sort((a,b)=>a.startFrame-b.startFrame);
 for(let i=0;i<visual.length;i++)for(let j=i+1;j<visual.length;j++){
  const a=visual[i],b=visual[j];
  if(b.startFrame>=a.endFrame)break;
  if(a.visual.zIndex===b.visual.zIndex&&a.sceneId===b.sceneId)
   failure(issues,'LAYER_ORDER_AMBIGUOUS',a.id+':'+b.id);
 }
 if(issues.length||nodes.length!==plan.operations.length)
  return {status:'BLOCKED',issues,graph:null};
 return {status:'STRUCTURE_READY_NOT_RENDERED',issues:[],
  graph:{schema:LAYER_GRAPH_SCHEMA,sourceSha256:plan.source.sha256,
   planFingerprint:preflight.fingerprint,storyRevision:plan.storyRevision??null,
   timelineFingerprint:plan.timeline.fingerprint,
   canvas:structuredClone(registry.canvas??null),fps,durationFrames:Math.round(plan.timeline.duration*fps),
   nodes,editableInWebEditor:false,rendered:false,
   note:'Exact editable source schema only: native web/Remotion integration and real QA remain required.'}};
}