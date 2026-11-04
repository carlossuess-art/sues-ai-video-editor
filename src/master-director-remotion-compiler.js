// Strict first Remotion adapter: explicit positioned text only. Anything else is
// reported, never silently discarded or substituted. No media paths from clients.
const plain=x=>x&&typeof x==='object'&&!Array.isArray(x);
const only=(o,keys)=>plain(o)&&Object.keys(o).every(k=>keys.includes(k));
const fail=(issues,node,code)=>issues.push({operationId:node?.id??'graph',code});
export function compileMasterDirectorRemotion(graph,{verifiedFontFamilies=[]}={}){
 const issues=[],layers=[];
 if(graph?.schema!=='sues-layer-graph/v1'||!Array.isArray(graph.nodes)||!graph.canvas||
    !Number.isInteger(graph.durationFrames)||graph.durationFrames<1||graph.fps!==30)
  return {status:'BLOCKED',issues:[{operationId:'graph',code:'INVALID_LAYER_GRAPH'}],composition:null};
 for(const node of graph.nodes){
  const v=node?.visual,p=node?.sourceParameters;
  if(node.renderer!=='remotion'||!['captions','graphics'].includes(node.track)||node.effect!=='text')
   {fail(issues,node,'REMOTION_OPERATION_UNSUPPORTED');continue;}
  if(!only(p,['text','visual'])||JSON.stringify(p.visual)!==JSON.stringify(v)||typeof p.text!=='string'||!p.text.length||p.text.length>500||
     !only(v,['rect','zIndex','opacity','typography','keyframes'])||
     !only(v.rect,['x','y','width','height'])||!only(v.typography,['family','sizePx','weight','color']))
   {fail(issues,node,'TEXT_PARAMETERS_UNSUPPORTED');continue;}
  if(!verifiedFontFamilies.includes(v.typography.family))
   {fail(issues,node,'FONT_NOT_VERIFIED');continue;}
  if(!Array.isArray(v.keyframes)||v.keyframes.some(k=>!only(k,['atFrame','easing','x','y','opacity','scale','rotation'])||
      (k.easing??'linear')!=='linear'))
   {fail(issues,node,'ANIMATION_UNSUPPORTED');continue;}
  // Must be built by the layer graph validator; still check the basic bounds.
  if(!Number.isInteger(node.startFrame)||!Number.isInteger(node.endFrame)||node.startFrame<0||
     node.endFrame<=node.startFrame||node.endFrame>graph.durationFrames)
   {fail(issues,node,'TIMELINE_INVALID');continue;}
  layers.push({id:node.id,startFrame:node.startFrame,endFrame:node.endFrame,text:p.text,visual:structuredClone(v)});
 }
 if(issues.length)return {status:'BLOCKED',issues,composition:null};
 return {status:'READY_FOR_REMOTION_RENDER',issues:[],composition:{schema:'sues-remotion-text/v1',
  planFingerprint:graph.planFingerprint,sourceSha256:graph.sourceSha256,canvas:graph.canvas,
  fps:graph.fps,durationFrames:graph.durationFrames,layers}};
}
