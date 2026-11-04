// Conservative conversion of the real editor time-map into Remotion sequences.
// Only a separately verified CFR 30 source with audio and frame-aligned cuts
// is supported. No guessed timing or implicit crop/fit.
const HASH=/^[a-f0-9]{64}$/;
const frame=(x,fps)=>Number.isFinite(x)&&Math.abs(x*fps-Math.round(x*fps))<0.00001?Math.round(x*fps):null;
export function compileMasterDirectorSource({composition,sourceSha256,timeMap,sourceTiming,sourceHasAudio,sourceFit,sourceDuration}={}){
 if(composition?.schema!=='sues-remotion-layers/v1'||!HASH.test(sourceSha256??'')||composition.sourceSha256!==sourceSha256||
    sourceTiming!=='cfr30-verified'||sourceHasAudio!==true||sourceFit!=='fill'||composition.fps!==30||
    frame(sourceDuration,30)===null||sourceDuration<=0||timeMap?.sourceDuration!==sourceDuration||
    !Array.isArray(timeMap?.spans)||!timeMap.spans.length)
  return {status:'BLOCKED',issues:[{code:'SOURCE_EVIDENCE_OR_MODE_UNSUPPORTED'}],composition:null};
 let cursor=0;const spans=[];
 for(const span of timeMap.spans){
  const a=frame(span.sourceIn,30),b=frame(span.sourceOut,30),c=frame(span.editIn,30),d=frame(span.editOut,30);
  if([a,b,c,d].some(x=>x===null)||a<0||b<=a||b>Math.round(sourceDuration*30)||c!==cursor||d-c!==b-a||d>composition.durationFrames)
   return {status:'BLOCKED',issues:[{code:'SOURCE_TIME_MAP_UNSUPPORTED'}],composition:null};
  spans.push({sourceInFrame:a,startFrame:c,endFrame:d});cursor=d;
 }
 if(cursor!==composition.durationFrames)
  return {status:'BLOCKED',issues:[{code:'SOURCE_TIMELINE_INCOMPLETE'}],composition:null};
 return {status:'READY_FOR_SOURCE_STAGING',issues:[],composition:{...composition,
  source:{assetId:sourceSha256,fit:'fill',audio:true,spans}}};
}
