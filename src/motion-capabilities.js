import {indexMotionLibrary} from './motion-library.js';

const assert=(ok,message)=>{if(!ok)throw new Error(`Motion capabilities: ${message}`);};
const uniqueStrings=value=>Array.isArray(value)&&value.every(x=>typeof x==='string'&&x.length>0)&&new Set(value).size===value.length;

// An inventory, not a renderer or a semantic Director. The caller must supply
// the renderer's actual supported IDs (RENDERED_MOTIONS), never catalogue IDs.
export function auditMotionCapabilities(catalog,renderedIds){
  indexMotionLibrary(catalog); // Reuse the existing schema and duplicate-ID checks.
  assert(uniqueStrings(renderedIds),'unique renderer IDs required');
  const known=new Set(catalog.map(m=>m.id));
  assert(renderedIds.every(id=>known.has(id)),'renderer ID missing from catalogue');
  const supported=new Set(renderedIds);
  return catalog.map(asset=>{
    const audioLayerIds=asset.layers.filter(layer=>layer.kind==='audio').map(layer=>layer.id);
    return {
      id:asset.id,
      renderStatus:supported.has(asset.id)?'implemented':'contract-only',
      audioStatus:audioLayerIds.length?'unbound-catalog-audio':'no-catalog-audio',
      audioLayerIds,
      requiredBindings:asset.layers.filter(layer=>layer.replaceable===true).map(layer=>layer.id),
      semanticReasons:[...(asset.trigger?.semanticReasons??[])],
      minDuration:asset.trigger?.minDuration??null,
      tags:[...asset.tags]
    };
  });
}

// Returns eligible catalogue IDs only. Never schedules events, guesses meaning,
// downloads assets or silently supplies missing dynamic bindings.
export function listEligibleMotionAssets(report,{allowedIds,semanticReason,duration,bindings={}}){
  assert(Array.isArray(report)&&report.every(x=>x&&typeof x.id==='string'),'audited report required');
  assert(uniqueStrings(allowedIds),'unique allowed motion IDs required');
  assert(typeof semanticReason==='string'&&semanticReason.length>0,'semantic reason required');
  assert(Number.isFinite(duration)&&duration>0,'positive duration required');
  assert(bindings&&typeof bindings==='object'&&!Array.isArray(bindings),'bindings object required');
  const allowed=new Set(allowedIds);
  return report.filter(asset=>asset.renderStatus==='implemented'&&allowed.has(asset.id)&&
    asset.semanticReasons.includes(semanticReason)&&asset.minDuration!==null&&duration>=asset.minDuration&&
    asset.requiredBindings.every(key=>Object.hasOwn(bindings[asset.id]??{},key))).map(asset=>asset.id);
}
