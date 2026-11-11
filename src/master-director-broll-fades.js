// Structural proof only: an explicitly selected B-roll opacity fade is encoded
// by the existing verified Remotion video layer, not a phantom transition.
// Does not choose a transition, assert source rights or grant creative approval.
const EPS=1e-6;
const close=(a,b)=>Number.isFinite(a)&&Math.abs(a-b)<=EPS;
const own=(x,k)=>Object.prototype.hasOwnProperty.call(x,k);
export function inspectBrollFadeLink(intent,operation,link,annex){
 if(intent?.track!=='transition'||!['in','out'].includes(link?.transition?.edge)||
    link.transition.kind!=='opacity-fade'||Object.keys(link.transition).some(k=>!['kind','edge','durationFrames'].includes(k)))
  return 'TRANSITION_TYPE_NOT_EXPLICITLY_MAPPED';
 const edge=intent.id.endsWith('-transition-in')?'in':intent.id.endsWith('-transition-out')?'out':null;
 if(!edge||link.transition.edge!==edge)return 'TRANSITION_EDGE_MISMATCH';
 const len=Math.round((intent.editEnd-intent.editStart)*30),count=link.transition.durationFrames;
 if(!Number.isInteger(count)||count<2||count*2>=len)return 'TRANSITION_DURATION_INVALID';
 if(operation?.renderer!=='remotion'||operation.track!=='broll'||operation.effect!=='video-exact'||
    operation.resourceRef!==annex?.resourceReferences?.find(r=>r.operationId===intent.shotId&&r.role==='base')?.resourceHint)
  return 'TRANSITION_VIDEO_RESOURCE_MISMATCH';
 if(!close(operation.start,intent.editStart)||!close(operation.end,intent.editEnd))
  return 'TRANSITION_VIDEO_INTERVAL_MISMATCH';
 const visual=operation.parameters?.visual;
 if(!visual||!close(visual.opacity,1)||!Array.isArray(visual.keyframes)||
    !close(visual.rect?.x,0)||!close(visual.rect?.y,0)||
    !close(visual.rect?.width,1080)||!close(visual.rect?.height,1920))
  return 'TRANSITION_NEEDS_FULL_FRAME_VIDEO_OPACITY';
 const keys=visual.keyframes.filter(k=>k&&own(k,'opacity'));
 if(keys.length<4||keys.some(k=>!Number.isInteger(k.atFrame)||k.atFrame<0||k.atFrame>=len||
   !Number.isFinite(k.opacity)||k.opacity<0||k.opacity>1||
   !['linear','ease-in','ease-out','ease-in-out'].includes(k.easing??'linear')))
  return 'TRANSITION_OPACITY_KEYFRAMES_UNVERIFIED';
 // No implicit fade type or approximate timing. Check *both* edges in the same
 // video operation so they cannot contradict or omit each other.
 const find=(frame,opacity)=>keys.some(k=>k.atFrame===frame&&close(k.opacity,opacity));
 if(!find(0,0)||!find(count,1)||!find(len-1-count,1)||!find(len-1,0))
  return 'TRANSITION_OPACITY_EDGES_NOT_PROVEN';
 for(let i=1;i<keys.length;i++)if(keys[i].atFrame<=keys[i-1].atFrame)
  return 'TRANSITION_KEYFRAMES_NOT_STRICTLY_ORDERED';
 // Extra keyframes in the fade range may alter the requested opacity profile.
 for(const k of keys){
  if(k.atFrame<count&&k.atFrame!==0||k.atFrame>len-1-count&&k.atFrame!==len-1)
   return 'TRANSITION_INTERMEDIATE_OPACITY_UNVERIFIED';
 }
 return null;
}
