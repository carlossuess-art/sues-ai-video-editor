// Conservative native bridge: only operations represented exactly by sues-edit-plan/v1.
// Does not render, generate, publish or silently approximate a creative effect.
import {reviewMasterDirectorPlan} from './master-director-gate.js';
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const hash=/^[a-f0-9]{64}$/;
const near=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<.000001;
const keys=(p,allow,required=[])=>obj(p)&&Object.keys(p).every(k=>allow.includes(k))&&required.every(k=>Object.hasOwn(p,k));
const err=(code,detail='')=>({code,detail});
const matches=(o,track,effect)=>o.track===track&&o.effect===effect;
function translate(o,plan,registry,catalog){
 const p=o.parameters??{},r=o.resourceId,asset=registry.licensedAssets?.[r];
 if(o.renderer!=='native')return {issue:err('ENGINE_ADAPTER_REQUIRED',o.renderer)};
 if(!obj(p))return {issue:err('PARAMETERS_MISSING')};
 if(r!==undefined&&(!asset||asset.sha256!==o.resourceSha256||!hash.test(o.resourceSha256??'')||
   asset.rightsVerified!==true||asset.commercialUseAllowed!==true))
  return {issue:err('RESOURCE_VERSION_UNVERIFIED',String(r))};
 let native;
 if(matches(o,'captions','caption-edit')&&keys(p,['captionId','text'],['captionId','text'])&&
   catalog.captions?.some(c=>c.id===p.captionId)&&typeof p.text==='string'&&p.text.trim()&&p.text.length<=52)
  native={type:'caption',captionId:p.captionId,text:p.text};
 else if(matches(o,'captions','caption-hide')&&keys(p,['captionId','hidden'],['captionId','hidden'])&&
   p.hidden===true&&catalog.captions?.some(c=>c.id===p.captionId))
  native={type:'caption-visibility',captionId:p.captionId,hidden:true,reason:o.reason};
 else if(matches(o,'captions','caption-emphasis')&&keys(p,['captionId','word','level','style','scale'],
    ['captionId','word','level','style','scale'])&&catalog.captions?.some(c=>c.id===p.captionId)&&
    Number.isInteger(p.word)&&Number.isFinite(p.scale))
  native={type:'emphasis',...p};
 else if(matches(o,'camera','zoom-native')&&keys(p,['scale'],['scale'])&&
   Number.isFinite(p.scale)&&p.scale>=1.04&&p.scale<=1.22)
  native={type:'zoom',start:o.start,end:o.end,scale:p.scale,reason:o.reason};
 else if(matches(o,'broll','broll-fullframe')&&keys(p,['sourceIn','replaceExistingBrolls','replaceHiddenZooms'])&&
   hash.test(r??'')&&(p.sourceIn===undefined||(Number.isFinite(p.sourceIn)&&p.sourceIn>=0))&&
   (p.replaceExistingBrolls===undefined||typeof p.replaceExistingBrolls==='boolean')&&
   (p.replaceHiddenZooms===undefined||typeof p.replaceHiddenZooms==='boolean'))
  native={type:'broll',resourceId:r,start:o.start,end:o.end,reason:o.reason,...p};
 else if(matches(o,'sfx','sfx-one-shot')&&keys(p,['gain'],['gain'])&&hash.test(r??'')&&
   Number.isFinite(p.gain)&&p.gain>=0&&p.gain<=.7&&near(o.end-o.start,asset?.duration))
  native={type:'sfx',resourceId:r,start:o.start,gain:p.gain};
 else if(matches(o,'music','music-full-video')&&keys(p,['gain','duck'],['gain','duck'])&&
   hash.test(r??'')&&near(o.start,0)&&near(o.end,plan.timeline.duration)&&
   Number.isFinite(p.gain)&&p.gain>=0&&p.gain<=.18&&typeof p.duck==='boolean')
  native={type:'music',resourceId:r,gain:p.gain,duck:p.duck};
 else if(matches(o,'transition','transition-native')&&keys(p,['kind','replace'],['kind'])&&
   ['warm','blur','radial'].includes(p.kind)&&near(o.end-o.start,.4)&&
   (p.replace===undefined||typeof p.replace==='boolean'))
  native={type:'transition',resourceId:p.kind,start:o.start,duration:.4,
    ...(p.replace!==undefined?{replace:p.replace}:{})};
 else if(matches(o,'graphics','card-grid-native')&&
   keys(p,['captionId','endCaptionId','heading','bodyLines','coversPresenter'],
    ['captionId','heading','bodyLines','coversPresenter'])&&p.coversPresenter===true&&
   catalog.captions?.some(c=>c.id===p.captionId)&&
   (p.endCaptionId===undefined||catalog.captions.some(c=>c.id===p.endCaptionId))&&
   typeof p.heading==='string'&&Array.isArray(p.bodyLines)&&
   p.bodyLines.every(x=>typeof x==='string'))
  native={type:'card',captionId:p.captionId,layout:'grid',heading:p.heading,bodyLines:p.bodyLines,
   ...(p.endCaptionId?{endCaptionId:p.endCaptionId}:{})};
 else if(matches(o,'graphics','motion-catalog-native')&&keys(p,['motionId','captionId','number'],['motionId','captionId'])){
  const c=catalog.captions?.find(c=>c.id===p.captionId);
  if(c&&catalog.motionResources?.some(m=>m.id===p.motionId)&&near(c.start,o.start)&&near(c.end,o.end)&&
     (p.number===undefined||Number.isInteger(p.number)))
   native={type:'motion',resourceId:p.motionId,captionId:p.captionId,
    ...(p.number!==undefined?{number:p.number}:{})};
 }else if(matches(o,'graphics','overlay-native-default')&&
   keys(p,['sourceIn','intensity'],['intensity'])&&hash.test(r??'')&&
   Number.isFinite(p.intensity)&&p.intensity>=.05&&p.intensity<=.35&&
   (p.sourceIn===undefined||(Number.isFinite(p.sourceIn)&&p.sourceIn>=0)))
  native={type:'overlay',resourceId:r,start:o.start,end:o.end,intensity:p.intensity,
   reason:o.reason,...(p.sourceIn!==undefined?{sourceIn:p.sourceIn}:{})};
 else if(matches(o,'graphics','image-native-auto')&&keys(p,[])&&hash.test(r??''))
  native={type:'image',resourceId:r,start:o.start,end:o.end};
 else if(matches(o,'voice','voice-preset-native')&&keys(p,['preset','intensity'],['preset','intensity'])&&
   ['cinematic-echo','vintage-tv'].includes(p.preset)&&Number.isFinite(p.intensity)&&
   p.intensity>=.1&&p.intensity<=.85)
  native={type:'voice',preset:p.preset,start:o.start,end:o.end,intensity:p.intensity};
 else if(matches(o,'voice','voice-level-native')&&keys(p,['enabled'],['enabled'])&&
   typeof p.enabled==='boolean'&&near(o.start,0)&&near(o.end,plan.timeline.duration))
  native={type:'voice-level',enabled:p.enabled};
 else if(matches(o,'voice','audio-levels-native')&&keys(p,['voiceGain','sfxGain','musicGain','levelResources'],
   ['voiceGain','sfxGain','musicGain','levelResources'])&&
   [p.voiceGain,p.sfxGain,p.musicGain].every(Number.isFinite)&&typeof p.levelResources==='boolean'&&
   near(o.start,0)&&near(o.end,plan.timeline.duration))
  native={type:'audio-levels',...p};
 else if(matches(o,'music','mastering-native')&&keys(p,['enabled'],['enabled'])&&
   typeof p.enabled==='boolean'&&near(o.start,0)&&near(o.end,plan.timeline.duration))
  native={type:'mastering',enabled:p.enabled};
 if(!native)return {issue:err('NO_LOSSLESS_NATIVE_MAPPING',o.track+'/'+o.effect)};
 return {native};
}

export function bridgeMasterDirectorToNative(plan,registry={},catalog={}){
 const check=reviewMasterDirectorPlan(plan,registry);
 if(check.status!=='READY_TO_EXECUTE')
  return {status:check.status,canApply:false,issues:check.issues,fingerprint:check.fingerprint,plan:null};
 const issues=[],operations=[],mapping=[];
 if(catalog.schema!=='sues-edit-plan/v1'||catalog.sourceSha256!==plan.source.sha256||
    catalog.timelineFingerprint!==plan.timeline.fingerprint||catalog.timeSpace!=='edit-timeline'||
    !near(catalog.duration,plan.timeline.duration))
  issues.push({operationId:'plan',...err('NATIVE_CATALOG_STALE')});
 for(const o of plan.operations){
  const x=translate(o,plan,registry,catalog);
  if(x.issue)issues.push({operationId:o.id,...x.issue});
  else{
   operations.push(x.native);
   mapping.push({masterOperationId:o.id,nativeOperationIndex:operations.length,
    nativeType:x.native.type,masterEffect:o.effect});
  }
 }
 if(plan.operations.length>200)issues.push({operationId:'plan',...err('NATIVE_OPERATION_LIMIT')});
 if(issues.length)return {status:'NEEDS_ENGINE_OR_RESOURCE_WORK',canApply:false,issues,plan:null,
   fingerprint:check.fingerprint,operationMapping:mapping};
 const output={schema:'sues-edit-plan/v1',sourceSha256:plan.source.sha256,
  timelineFingerprint:plan.timeline.fingerprint,operations};
 if(JSON.stringify(output).length>30000)
  return {status:'BLOCKED',canApply:false,issues:[{operationId:'plan',...err('NATIVE_TEXT_LIMIT')}],
   plan:null,fingerprint:check.fingerprint};
 return {status:'READY_FOR_NATIVE_REVIEW',canApply:false,issues:[],plan:output,
  fingerprint:check.fingerprint,operationMapping:mapping};
}
