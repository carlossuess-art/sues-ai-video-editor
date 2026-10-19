import {listEligibleMotionAssets} from './motion-capabilities.js';

// Read-only visual preflight. Does not schedule events or bind catalogue audio.
export function inspectMotionEligibility(report,options){
  const baseline=new Set(listEligibleMotionAssets(report,options));
  return report.map(asset=>{
    const reasons=[];
    if(!baseline.has(asset.id))reasons.push('base-policy-ineligible');
    if(options.duration>6)reasons.push('duration-above-renderer-limit');
    const supplied=options.bindings?.[asset.id];
    const values=supplied&&typeof supplied==='object'&&!Array.isArray(supplied)?supplied:{};
    for(const key of asset.requiredBindings){
      const value=values[key];
      if(!Object.hasOwn(values,key)||value==null||
         (typeof value==='string'&&!value.trim()))reasons.push('missing-or-empty-binding:'+key);
    }
    return {id:asset.id,eligible:reasons.length===0,reasons,
      warnings:asset.audioStatus==='unbound-catalog-audio'?['catalog-audio-unbound']:[]};
  });
}

export function listRenderSafeMotionAssets(report,options){
  return inspectMotionEligibility(report,options).filter(item=>item.eligible).map(item=>item.id);
}
