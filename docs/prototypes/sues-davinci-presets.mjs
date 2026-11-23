/** Original SUES approximations of DaVinci Fusion effects; NOT production integrated. */
export const PRESETS=Object.freeze({
'sues-camera-zoom-in':{frames:84,source:'Camera Zoom In',keys:[{frame:0,scale:1},{frame:84,scale:1.15}]},
'sues-slide-text-up':{frames:43,source:'Deslizar hacia arriba (texto)',keys:[{frame:0,yNormalized:-0.092},{frame:43,yNormalized:0}]},
'sues-slide-text-down':{frames:43,source:'SUES adaptation of Deslizar hacia abajo (texto)',keys:[{frame:0,yNormalized:0.092},{frame:43,yNormalized:0}]},
'sues-intro-blur':{frames:21,source:'Intro Blur',keys:[{frame:0,blurNormalized:0.323},{frame:21,blurNormalized:0}]},
'sues-posterize-time':{frames:null,source:'SSC_PosterizeTime'}
});
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function samplePreset(id,frame,{height=1920,blurMaxPx=30,stepsPerSecond=12,fps=30}={}){
 const p=PRESETS[id];if(!p)throw Error('Unknown preset');
 if(!Number.isFinite(frame)||frame<0)throw RangeError('Invalid frame');
 if(id==='sues-posterize-time')return {sampleFrame:Math.floor(frame/(fps/stepsPerSecond))*(fps/stepsPerSecond)};
 const a=p.keys[0],b=p.keys[1],t=clamp((frame-a.frame)/(b.frame-a.frame),0,1),e=t*t*(3-2*t);
 const interpolate=k=>(a[k]??0)+((b[k]??0)-(a[k]??0))*e;
 if(id==='sues-camera-zoom-in')return {scale:interpolate('scale')};
 if(id==='sues-slide-text-up'||id==='sues-slide-text-down')return {translateYPx:interpolate('yNormalized')*height};
 return {blurPx:interpolate('blurNormalized')/0.323*blurMaxPx};
}
