// Explicit visual annotation, bound to one original. This is not face inference.
import {validateVisionFrame} from './vision.js';
export function validateReviewedFraming(value){
 if(value===null||value===undefined)return null;
 const fail=()=>{throw Error('Encuadre revisado: región, ancla o fuente inválida');};
 if(!value||Object.keys(value).some(k=>!['sourceSha256','method','face','anchor'].includes(k))||
  !/^[a-f0-9]{64}$/.test(value.sourceSha256)||value.method!=='manual-region-review')fail();
 const f=value.face,a=value.anchor;
 if(!f||Object.keys(f).some(k=>!['x','y','width','height'].includes(k))||
  !a||Object.keys(a).some(k=>!['x','y'].includes(k))||
  ![f.x,f.y,f.width,f.height,a.x,a.y].every(Number.isFinite)||
  f.x<0||f.y<0||f.width<=0||f.height<=0||a.x<f.x||a.x>f.x+f.width||a.y<f.y||a.y>f.y+f.height)fail();
 return structuredClone(value);
}
export function applyReviewedFraming(inputs,value){
 const r=validateReviewedFraming(value);if(!r)return inputs;
 const s=inputs.source;if(r.sourceSha256!==s.sha256)throw Error('El encuadre revisado pertenece a otro original');
 const frame=time=>({time,frameWidth:s.width,frameHeight:s.height,faces:[{...r.face,score:1,
  leftEye:{...r.anchor},rightEye:{...r.anchor}}]});
 const visionFrames=[frame(0),frame(s.duration)];visionFrames.forEach(validateVisionFrame);
 const height=Math.min(s.height,s.width*16/9),width=height*9/16;
 const camera={mode:'reviewed-region',review:r,keyframes:[0,s.duration].map(time=>({time,x:(s.width-width)/2,y:0,width,height,zoom:1}))};
 // The existing compositor still projects/checks the protected region at every
 // output frame. A fixed reviewed anchor never claims automatic eye tracking.
 return {...inputs,camera,visionFrames,previewLayout:{
  title:{left:120,right:900,top:200,bottom:330},
  caption:{left:120,right:900,top:190,bottom:390},
  outro:{left:120,right:900,top:1430,bottom:1530}},
  template:{...inputs.template,captions:{...inputs.template.captions,inlineGroups:true,fontSize:104}}};
}
export function validateZoomEvents(events=[]){
 if(!Array.isArray(events)||events.length>8)throw Error('Hasta ocho acercamientos explícitos');
 let previous=-Infinity;
 for(const e of events){
  if(!e||Object.keys(e).some(k=>!['start','end','scale','reason'].includes(k))||
   ![e.start,e.end,e.scale].every(Number.isFinite)||e.start<2||e.end-e.start<2||e.end-e.start>6||
   e.start<previous+1||e.scale<1.04||e.scale>1.22||typeof e.reason!=='string'||e.reason.trim().length<5||e.reason.length>160)
   throw Error('Acercamiento inválido: 2–6 s, escala 1.04–1.22, separación 1 s y motivo narrativo');
  previous=e.end;
 }
 return structuredClone(events);
}
export function explicitZoomDecisions(events,plan){
 return validateZoomEvents(events).map(e=>{
  if(plan.camera.mode==='full-frame-fit')throw Error('El acercamiento requiere análisis o encuadre revisado');
  if(e.end>plan.duration-plan.policy.outro.duration)throw Error('El acercamiento invade el cierre');
  return {type:'zoom',start:e.start,end:e.end,reason:e.reason,rule:'user-zoom-choice-v1',
   params:{scale:e.scale,ramp:Math.min(1,(e.end-e.start)/2),reason:'emphasis'},
   evidence:{method:'explicit-editor-direction',sourceSha256:plan.source.sha256}};
 });
}
