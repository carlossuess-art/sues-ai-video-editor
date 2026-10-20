import {listEligibleMotionAssets} from './motion-capabilities.js';

// Candidate checks mirror the renderer text rules; placement remains unverified.
const TEXT_KEYS={QUOTE_CARD_01:'quote',NUMBER_BADGE_GOLD_01:'label',STRIKE_TEXT_01:'text'};
function bindingReasons(asset,values){
  const reasons=[];
  if(asset.id==='NUMBER_BADGE_GOLD_01'&&Object.hasOwn(values,'number')&&values.number!=null){
    const number=String(values.number);
    if(!/^[1-9][0-9]?$/.test(number))reasons.push('invalid-badge-number');
  }
  const key=TEXT_KEYS[asset.id];
  if(!key||!Object.hasOwn(values,key)||values[key]==null)return reasons;
  const value=values[key];
  if(typeof value!=='string'||!value.trim()||value.length>52||
    [...value].some(ch=>ch.charCodeAt(0)<32||ch.charCodeAt(0)===127)){
    reasons.push('invalid-renderer-text:'+key);
    return reasons;
  }
  const words=value.trim().split(/\s+/);
  const wraps=value.length<=26||words.slice(1).some((_,i)=>
    words.slice(0,i+1).join(' ').length<=26&&words.slice(i+1).join(' ').length<=26);
  if(words.some(word=>word.length>26)||!wraps)reasons.push('unwrappable-renderer-text:'+key);
  return reasons;
}

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
    reasons.push(...bindingReasons(asset,values));
    return {id:asset.id,eligible:reasons.length===0,reasons,
      warnings:asset.audioStatus==='unbound-catalog-audio'?['catalog-audio-unbound']:[]};
  });
}

export function listRenderSafeMotionAssets(report,options){
  return inspectMotionEligibility(report,options).filter(item=>item.eligible).map(item=>item.id);
}
