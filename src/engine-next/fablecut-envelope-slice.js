// Preserve a linear clip-local envelope when a source operation spans scenes.
export function linearValueAt(keys, time) {
 if (!Array.isArray(keys)||!keys.length||!Number.isFinite(time)) throw Error('INVALID_LINEAR_ENVELOPE');
 let previous;
 for (const key of keys) {
  if (!key||!Number.isFinite(key.t)||!Number.isFinite(key.v)||key.t<0||
      previous&&key.t<=previous.t||key.ease&&key.ease!=='linear') throw Error('INVALID_LINEAR_ENVELOPE');
  previous=key;
 }
 if(time<=keys[0].t)return keys[0].v;
 for(let i=1;i<keys.length;i++)if(time<=keys[i].t){
  const a=keys[i-1],b=keys[i];return a.v+(b.v-a.v)*(time-a.t)/(b.t-a.t);
 }
 return keys.at(-1).v;
}

export function sliceLinearEnvelope(keys, offset, duration) {
 if(!Number.isFinite(offset)||offset<0||!Number.isFinite(duration)||duration<=0)throw Error('INVALID_ENVELOPE_RANGE');
 const end=offset+duration;
 return [{t:0,v:linearValueAt(keys,offset),ease:'linear'},
  ...keys.filter(k=>k.t>offset+1e-9&&k.t<end-1e-9).map(k=>({...k,t:k.t-offset,ease:'linear'})),
  {t:duration,v:linearValueAt(keys,end),ease:'linear'}];
}

export function linearFadeEnvelope(duration, fadeIn=0, fadeOut=0) {
 if(![duration,fadeIn,fadeOut].every(Number.isFinite)||duration<=0||fadeIn<0||fadeOut<0||fadeIn+fadeOut>duration+1e-9)throw Error('INVALID_FADE_RANGE');
 const keys=[{t:0,v:fadeIn?0:1,ease:'linear'}];
 if(fadeIn)keys.push({t:fadeIn,v:1,ease:'linear'});
 if(fadeOut&&duration-fadeOut>keys.at(-1).t+1e-9)keys.push({t:duration-fadeOut,v:1,ease:'linear'});
 keys.push({t:duration,v:fadeOut?0:1,ease:'linear'});
 return keys;
}
