// Review an approved mixed native/Remotion layer graph without losing operations.
// Never marks a hybrid project renderable: an actual two-engine compositor, verified
// handoff media and audiovisual reconciliation are mandatory for execution.
import {compileMasterDirectorRemotion} from './master-director-remotion-compiler.js';

const VISUAL=new Set(['camera','subject','broll','graphics','captions','transition']);
const AUDIO=new Set(['voice','music','sfx']);
const HASH=/^[a-f0-9]{64}$/;
const validId=x=>typeof x==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/.test(x);
const overlaps=(a,b)=>a.startFrame<b.endFrame&&b.startFrame<a.endFrame;
const failure=(code,operationId='graph')=>({code,operationId});

export function reviewMasterDirectorHybridGraph(graph, evidence={}){
 const nodes=graph?.nodes;
 if(graph?.schema!=='sues-layer-graph/v1'||!Array.isArray(nodes)||
    !HASH.test(graph.sourceSha256??'')||!HASH.test(graph.planFingerprint??'')||
    typeof graph.timelineFingerprint!=='string'||!graph.timelineFingerprint||
    !Number.isInteger(graph.durationFrames)||graph.durationFrames<=0||graph.fps!==30)
  return {status:'BLOCKED',canExecute:false,issues:[failure('HYBRID_GRAPH_INVALID')]};
 const ids=new Set(),issues=[];
 for(const n of nodes){
  if(!validId(n?.id)||ids.has(n.id))issues.push(failure('HYBRID_OPERATION_ID_INVALID',n?.id));
  ids.add(n?.id);
  if(!['native','remotion'].includes(n?.renderer))issues.push(failure('HYBRID_ENGINE_UNKNOWN',n?.id));
  if(!Number.isInteger(n?.startFrame)||!Number.isInteger(n?.endFrame)||
     n.startFrame<0||n.endFrame<=n.startFrame||n.endFrame>graph.durationFrames)
   issues.push(failure('HYBRID_FRAMES_INVALID',n?.id));
  if(!Array.isArray(n?.dependencies)||n.dependencies.some(dep=>!validId(dep)))
   issues.push(failure('HYBRID_DEPENDENCIES_INVALID',n?.id));
 }
 const byId=new Map(nodes.map(n=>[n?.id,n]));
 for(const n of nodes)for(const dep of (Array.isArray(n?.dependencies)?n.dependencies:[])){
  if(!byId.has(dep))issues.push(failure('HYBRID_DEPENDENCY_MISSING',n.id));
 }
 if(issues.length)return {status:'BLOCKED',canExecute:false,issues};
 const native=nodes.filter(n=>n.renderer==='native'),remotion=nodes.filter(n=>n.renderer==='remotion');
 if(!native.length||!remotion.length)return {status:'NOT_MIXED',canExecute:false,issues:[]};
 const remotionGraph={...graph,nodes:remotion};
 const compiled=compileMasterDirectorRemotion(remotionGraph,evidence);
 if(compiled.status!=='READY_FOR_REMOTION_STAGING'||compiled.composition?.layers.length!==remotion.length)
  return {status:'BLOCKED',canExecute:false,issues:compiled.issues?.length?compiled.issues:[failure('HYBRID_REMOTION_COMPILATION_INCOMPLETE')]};
 const crossEngineDependencies=[];
 for(const n of nodes)for(const dep of n.dependencies){
  const parent=byId.get(dep);
  if(n.renderer!==parent.renderer)crossEngineDependencies.push({from:dep,to:n.id,fromEngine:parent.renderer,toEngine:n.renderer});
 }
 const crossEngineOverlaps=[];
 for(const n of native)for(const r of remotion)if(overlaps(n,r)){
  const classification=AUDIO.has(n.track)&&AUDIO.has(r.track)?'audio-mix':
   VISUAL.has(n.track)&&VISUAL.has(r.track)?
    (['transition','graphics','captions'].includes(n.track)?'visual-order-unresolved':'visual-stack'):'cross-track';
  if(classification!=='cross-track')crossEngineOverlaps.push({nativeId:n.id,remotionId:r.id,classification});
 }
 return {
  schema:'sues-master-hybrid-review/v1',
  status:'MIXED_COMPONENTS_STAGED_NOT_RENDERABLE',
  canExecute:false,canRender:false,
  issues:[failure('HYBRID_COMPOSITOR_NOT_IMPLEMENTED')],
  sourceSha256:graph.sourceSha256,planFingerprint:graph.planFingerprint,
  timelineFingerprint:graph.timelineFingerprint,durationFrames:graph.durationFrames,
  // These are review-only identities, not unapproved executable subplans.
  nativeOperationIds:native.map(n=>n.id),remotionOperationIds:remotion.map(n=>n.id),
  operationCount:nodes.length,reviewedCount:native.length+compiled.composition.layers.length,
  nativeReviewRequired:true,remotionReviewReady:true,
  crossEngineDependencies,crossEngineOverlaps,
  remotionComponent:compiled.composition,
  remaining:['native-plan-review','native-child-preservation','verified-source-handoff',
   'remotion-overlays-on-approved-child','editable-mixed-version','two-audiovisual-audits']
 };
}