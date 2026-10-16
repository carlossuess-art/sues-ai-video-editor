import {buildFaceTrack,computePortraitCrop,PORTRAIT_SAFE_ZONES} from './vision.js';

const assert=(ok,msg)=>{if(!ok)throw new Error(msg);};
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const lerp=(a,b,t)=>a+(b-a)*t;

export const DEFAULT_STABILIZATION=Object.freeze({
  positionTimeConstant:1.2,
  positionDeadZone:0.006,
  maxPositionSpeed:0.04,
  scaleTimeConstant:1.5,
  maxScaleRate:0.12
});

export function stabilizeFaceTrack(points,options={}){
  assert(Array.isArray(points)&&points.length>0,'Stabilize: track vacío');
  const cfg={...DEFAULT_STABILIZATION,...options};
  assert(cfg.positionTimeConstant>0&&cfg.scaleTimeConstant>0,'Stabilize: constantes inválidas');
  assert(cfg.positionDeadZone>=0&&cfg.positionDeadZone<=0.1,'Stabilize: dead zone inválida');
  assert(cfg.maxPositionSpeed>0&&cfg.maxPositionSpeed<=1,'Stabilize: velocidad inválida');
  assert(cfg.maxScaleRate>0&&cfg.maxScaleRate<=1,'Stabilize: escala inválida');

  let sx=points[0].eye.x,sy=points[0].eye.y;
  let sw=points[0].face.width,sh=points[0].face.height;
  let previousTime=points[0].time;

  return points.map((p,i)=>{
    if(i){
      const dt=Math.max(1e-3,p.time-previousTime);
      const diag=Math.hypot(p.frameWidth,p.frameHeight);
      const a=1-Math.exp(-dt/cfg.positionTimeConstant);
      let tx=lerp(sx,p.eye.x,a),ty=lerp(sy,p.eye.y,a);
      let dx=tx-sx,dy=ty-sy,d=Math.hypot(dx,dy);
      const dead=diag*cfg.positionDeadZone;
      if(d<=dead){tx=sx;ty=sy;}
      else{
        const fraction=(d-dead)/d;
        tx=sx+dx*fraction;ty=sy+dy*fraction;
      }

      dx=tx-sx;dy=ty-sy;d=Math.hypot(dx,dy);
      const maxMove=diag*cfg.maxPositionSpeed*dt;
      if(d>maxMove){
        tx=sx+dx/d*maxMove;
        ty=sy+dy/d*maxMove;
      }

      const sa=1-Math.exp(-dt/cfg.scaleTimeConstant);
      let nw=lerp(sw,p.face.width,sa),nh=lerp(sh,p.face.height,sa);
      const maxFraction=cfg.maxScaleRate*dt;
      nw=clamp(nw,sw*(1-maxFraction),sw*(1+maxFraction));
      nh=clamp(nh,sh*(1-maxFraction),sh*(1+maxFraction));

      sx=tx;sy=ty;sw=nw;sh=nh;previousTime=p.time;
    }
    return {...p,smoothed:{eyeX:sx,eyeY:sy,faceWidth:sw,faceHeight:sh}};
  });
}

export function buildStableReframePlan(frames,options={}){
  const raw=buildFaceTrack(frames,options.tracking);
  const stable=stabilizeFaceTrack(raw,options.stabilization);
  const keyframes=stable.map(p=>computePortraitCrop(p,options.crop));
  return {
    version:'1.0',
    mode:'face-eye-reframe-stable',
    stabilization:{...DEFAULT_STABILIZATION,...options.stabilization},
    keyframes,
    safeZones:PORTRAIT_SAFE_ZONES
  };
}

export function summarizeReframePlan(plan){
  assert(plan?.keyframes?.length>0,'Reframe summary: keyframes vacíos');
  const k=plan.keyframes;
  let maxStep=0,maxSpeed=0,maxZoomRate=0;
  for(let i=1;i<k.length;i++){
    const dt=Math.max(1e-6,k[i].time-k[i-1].time);
    const move=Math.hypot(k[i].x-k[i-1].x,k[i].y-k[i-1].y);
    maxStep=Math.max(maxStep,move);
    maxSpeed=Math.max(maxSpeed,move/dt);
    maxZoomRate=Math.max(maxZoomRate,Math.abs(k[i].zoom-k[i-1].zoom)/dt);
  }
  return {
    keyframes:k.length,
    start:k[0].time,
    end:k.at(-1).time,
    zoomMin:Math.min(...k.map(x=>x.zoom)),
    zoomMax:Math.max(...k.map(x=>x.zoom)),
    maxCropStepPx:maxStep,
    maxCropSpeedPxPerSec:maxSpeed,
    maxZoomRatePerSec:maxZoomRate
  };
}

// Fixed shot framing is separate from semantic zoom events (future Director).
export const CAMERA_PROFILES=Object.freeze({
  conservative:Object.freeze({zoom:1.12,maxZoom:1.2,eyeLine:.40,headroom:.06}),
  composition:Object.freeze({zoom:1.40,maxZoom:1.45,eyeLine:.40,headroom:.06})
});

export function buildCameraProfilePlan(frames,{profile='composition',crop={},stabilization={},tracking={}}={}){
  assert(Object.hasOwn(CAMERA_PROFILES,profile),'Camera: perfil desconocido');
  const cfg={...CAMERA_PROFILES[profile],...crop};
  assert(Object.values(cfg).every(Number.isFinite),'Camera: parámetros no finitos');
  assert(cfg.zoom>=1&&cfg.maxZoom>=cfg.zoom&&cfg.maxZoom<=2,'Camera: zoom inválido');
  assert(cfg.eyeLine>=.2&&cfg.eyeLine<=.65&&cfg.headroom>=0&&cfg.headroom<=.2,'Camera: composición inválida');
  const points=stabilizeFaceTrack(buildFaceTrack(frames,tracking),stabilization);
  const keyframes=points.map(p=>{
    const w=p.frameWidth,h=p.frameHeight,aspect=9/16;
    const height=Math.min(h,w/aspect)/cfg.zoom,width=height*aspect;
    const x=clamp(p.smoothed.eyeX-width/2,0,w-width);
    const desiredY=Math.min(p.smoothed.eyeY-height*cfg.eyeLine,p.face.y-height*cfg.headroom);
    const y=clamp(desiredY,0,h-height);
    return {time:p.time,x,y,width,height,zoom:cfg.zoom,anchor:'eyes',outputWidth:1080,outputHeight:1920};
  });
  return {version:'1.0',mode:'face-eye-reframe-stable',profile,framing:cfg,
    interpolation:'linear-source-time-hold-ends',stabilization:{...DEFAULT_STABILIZATION,...stabilization},
    keyframes,safeZones:PORTRAIT_SAFE_ZONES};
}

export function sampleReframeAt(plan,time){
  assert(Number.isFinite(time)&&time>=0,'Camera: tiempo inválido');
  const k=plan?.keyframes;assert(k?.length,'Camera: keyframes vacíos');
  if(time<=k[0].time)return {...k[0],time};
  if(time>=k.at(-1).time)return {...k.at(-1),time};
  const i=k.findIndex(p=>p.time>=time),a=k[i-1],b=k[i];
  assert(b.time>a.time,'Camera: timestamps desordenados');
  const f=(time-a.time)/(b.time-a.time),out={...a,time};
  for(const field of ['x','y','width','height','zoom'])out[field]=lerp(a[field],b[field],f);
  return out;
}
