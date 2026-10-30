/** Shared time/property interpolation for timeline controls; no arbitrary expressions. */
const finite=Number.isFinite;
export function validateKeyframes(keys,{duration,min=0,max=1,limit=64}={}){
 if(!Array.isArray(keys)||keys.length>limit)throw Error('Keyframes exceden el límite de la pista');
 let prior=-Infinity;
 for(const k of keys){
  if(!k||Object.keys(k).sort().join(',')!=='time,value'||!finite(k.time)||!finite(k.value)||k.time<0||k.time>duration+1e-6||k.time<=prior+1e-6||k.value<min||k.value>max)throw Error('Keyframe inválido: tiempo o valor fuera de rango');
  prior=k.time;
 }
 return structuredClone(keys);
}
export function sampleKeyframes(keys,t,initial){
 if(!keys?.length)return initial;
 if(t<=keys[0].time)return keys[0].value;
 for(let i=1;i<keys.length;i++)if(t<=keys[i].time){const a=keys[i-1],b=keys[i],f=Math.max(0,Math.min(1,(t-a.time)/(b.time-a.time)));return a.value+(b.value-a.value)*f;}
 return keys.at(-1).value;
}
/** FFmpeg expression evaluated per audio frame; key times are local to clip. */
export function audioVolumeExpression(keys,initial){
 if(!keys?.length)return String(initial);
 let body=String(keys.at(-1).value);
 for(let i=keys.length-1;i>=1;i--){const a=keys[i-1],b=keys[i],t=`(${a.value}+(${b.value}-${a.value})*(t-${a.time})/${(b.time-a.time).toFixed(6)})`;body=`if(lt(t,${b.time}),${t},${body})`;}
 return `if(lt(t,${keys[0].time}),${keys[0].value},${body})`;
}
