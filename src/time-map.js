import {sampleReframeAt} from './reframe.js';
const assert=(ok,msg)=>{if(!ok)throw new Error(`Time map: ${msg}`);};
const finite=Number.isFinite;

// Segments may repeat or reorder source ranges. Edit intervals are half-open.
export function buildTimeMap(segments,sourceDuration){
  assert(finite(sourceDuration)&&sourceDuration>0,'source duration');
  assert(Array.isArray(segments)&&segments.length>0,'segments');
  let cursor=0;
  const spans=segments.map((s,index)=>{
    assert(finite(s.in)&&finite(s.out)&&s.in>=0&&s.out>s.in&&s.out<=sourceDuration+1e-6,'source bounds');
    const span={index,sourceIn:s.in,sourceOut:s.out,editIn:cursor,editOut:cursor+s.out-s.in};
    cursor=span.editOut;return span;
  });
  return {version:'1.0',sourceDuration,duration:cursor,spans};
}

export function editToSource(map,time){
  assert(finite(time)&&time>=0&&time<=map.duration,'edit time bounds');
  const span=time===map.duration?map.spans.at(-1):map.spans.find(s=>time>=s.editIn&&time<s.editOut);
  assert(span,'edit span');
  return {sourceTime:span.sourceIn+time-span.editIn,segmentIndex:span.index};
}

export function sourceIntervalToEdit(map,start,end){
  assert(finite(start)&&finite(end)&&start>=0&&end>start&&end<=map.sourceDuration+1e-6,'interval bounds');
  return map.spans.flatMap(s=>{
    const a=Math.max(start,s.sourceIn),b=Math.min(end,s.sourceOut);
    return b>a?[{start:s.editIn+a-s.sourceIn,end:s.editIn+b-s.sourceIn,sourceStart:a,sourceEnd:b,segmentIndex:s.index}]:[];
  });
}

// Keep per-cut camera spans. Flattening would interpolate across an edit jump.
export function mapCameraToEdit(camera,map){
  assert(camera?.keyframes?.length>0,'camera');
  return map.spans.map(s=>{
    const times=[s.sourceIn,...camera.keyframes.filter(k=>k.time>s.sourceIn&&k.time<s.sourceOut).map(k=>k.time),s.sourceOut];
    return {...s,keyframes:times.map(t=>({...sampleReframeAt(camera,t),sourceTime:t,time:s.editIn+t-s.sourceIn}))};
  });
}

export function sampleEditedCamera(camera,map,time){
  const {sourceTime,segmentIndex}=editToSource(map,time);
  return {...sampleReframeAt(camera,sourceTime),time,sourceTime,segmentIndex};
}
