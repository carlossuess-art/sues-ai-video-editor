const assert=(ok,message)=>{if(!ok)throw new Error(`Cinematic style: ${message}`);};
const finite=x=>typeof x==='number'&&Number.isFinite(x);
export const FOOTAGE_SOURCES=Object.freeze(['nature','exterior','retreat']);

export function validateCinematicStyle(style){
  assert(style?.version==='1.0'&&['provisional','functional'].includes(style.status),'version/status');
  assert(style.direction==='cinematic-nature-retreat','direction');
  assert(Array.isArray(style.sources)&&style.sources.length>0&&style.sources.every(x=>FOOTAGE_SOURCES.includes(x)),'sources');
  assert(style.colorTreatment==='natural'&&style.cameraMovement==='slow','look');
  assert(style.voice==='original'&&style.captions==='discreet'&&style.brandMode==='shared-kit','voice/captions/brand');
  if(style.resourceTreatment!==undefined){const r=style.resourceTreatment;assert(r.type==='blurred-focus'&&r.scope==='literal-text-card-only','resource treatment');assert(finite(r.sigma)&&r.sigma>=8&&r.sigma<=24&&finite(r.dim)&&r.dim>=0&&r.dim<=.2&&finite(r.fadeSeconds)&&r.fadeSeconds>=.25&&r.fadeSeconds<=.6,'resource treatment values');}
  const b=style.broll;
  assert(b&&finite(b.minShot)&&finite(b.maxShot)&&b.minShot>0&&b.maxShot>=b.minShot,'shot duration');
  assert(finite(b.maxCoverage)&&b.maxCoverage>0&&b.maxCoverage<=.5,'coverage');
  for(const key of ['minPresenterGap','openingPresenterSeconds','closingPresenterSeconds'])assert(finite(b[key])&&b[key]>=0,key);
  assert(b.layout==='full-frame'&&b.selection==='semantic-only'&&b.allowSourceAudio===false&&b.reuseAssets===false&&b.fallback==='presenter','broll rules');
  return true;
}

// Input slots already refer to EDIT timeline time, not source PTS. No AI/API runs here.
// Inventory is caller-supplied metadata; this function does not verify media bytes.
export function buildCinematicBrollPlan({policy,duration,slots=[],assets=[]}){
  validateCinematicStyle(policy?.visualStyle);
  assert(finite(duration)&&duration>0,'duration');
  assert(Array.isArray(slots)&&Array.isArray(assets),'slots/assets');
  const style=policy.visualStyle,b=style.broll;
  const closingSeconds=Math.max(b.closingPresenterSeconds,policy.outro?.duration??0);
  const ids=new Set();
  for(const asset of assets){
    assert(typeof asset.id==='string'&&asset.id.length>0&&!ids.has(asset.id),'asset id');ids.add(asset.id);
    assert(typeof asset.sourceRef==='string'&&asset.sourceRef.length>0,'sourceRef');
    assert(FOOTAGE_SOURCES.includes(asset.kind),'asset kind');
    assert(finite(asset.duration)&&asset.duration>0&&finite(asset.inPoint??0)&&(asset.inPoint??0)>=0&&(asset.inPoint??0)<asset.duration,'asset duration/inPoint');
    assert(Array.isArray(asset.tags)&&asset.tags.every(t=>typeof t==='string'&&t.length>0),'asset tags');
    assert(typeof asset.available==='boolean','asset availability');
  }
  let previousEnd=0,covered=0,lastBrollEnd=-Infinity;
  const used=new Set(),decisions=[];
  for(const slot of slots){
    assert(finite(slot.start)&&finite(slot.end)&&slot.start>=previousEnd&&slot.end>slot.start&&slot.end<=duration,'slot order/bounds');
    assert(typeof slot.reason==='string'&&slot.reason.trim().length>=3,'semantic reason');
    assert(Array.isArray(slot.tags)&&slot.tags.length>0&&slot.tags.every(t=>typeof t==='string'&&t.length>0),'semantic tags');
    previousEnd=slot.end;
    const length=slot.end-slot.start;
    let fallback=null;
    if(length<b.minShot||length>b.maxShot)fallback='shot-duration';
    else if(slot.start<b.openingPresenterSeconds||slot.end>duration-closingSeconds)fallback='presenter-bookends';
    else if(slot.start-lastBrollEnd<b.minPresenterGap)fallback='presenter-gap';
    else if(covered+length>duration*b.maxCoverage+1e-9)fallback='coverage-budget';
    const candidates=assets.filter(a=>a.available&&style.sources.includes(a.kind)&&!used.has(a.id)&&a.duration-(a.inPoint??0)>=length)
      .map(a=>({asset:a,score:new Set(a.tags.filter(tag=>slot.tags.includes(tag))).size}))
      .filter(a=>a.score>0).sort((a,c)=>c.score-a.score||(a.asset.id<c.asset.id?-1:a.asset.id>c.asset.id?1:0));
    if(!fallback&&!candidates.length)fallback='no-matching-footage';
    if(fallback){decisions.push({...structuredClone(slot),type:'keep-presenter',fallback});continue;}
    const a=candidates[0].asset;used.add(a.id);covered+=length;lastBrollEnd=slot.end;
    decisions.push({...structuredClone(slot),type:'broll',assetId:a.id,sourceRef:a.sourceRef,
      sourceIn:a.inPoint??0,sourceOut:(a.inPoint??0)+length,layout:b.layout,
      originalVoice:true,sourceAudio:false,captions:'preserve'});
  }
  return {version:'1.0',templateId:policy.templateId,brandKitId:policy.brandKitId,
    timeSpace:'edit-timeline',duration,decisions,coverage:covered/duration,
    defaultVisual:'presenter',originalVoice:true,renderReady:false,
    pending:['verify-media-and-portrait-fit','map-edit-time-to-source','renderer-and-safe-zones','visual-review']};
}
