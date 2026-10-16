const assert = (ok, msg) => { if (!ok) throw new Error(msg); };
const num = x => typeof x === 'number' && Number.isFinite(x);
const clamp = (v,min,max) => Math.min(max,Math.max(min,v));
const lerp = (a,b,t) => a + (b-a)*t;

export const PORTRAIT_SAFE_ZONES = Object.freeze({
  width: 1080,
  height: 1920,
  content: { left: 72, right: 1008, top: 180, bottom: 1540 },
  captions: { left: 96, right: 984, top: 960, bottom: 1510 },
  avoid: {
    top: { left: 0, right: 1080, top: 0, bottom: 180 },
    bottom: { left: 0, right: 1080, top: 1540, bottom: 1920 },
    right: { left: 930, right: 1080, top: 180, bottom: 1540 }
  }
});

export function validateVisionFrame(frame) {
  assert(frame && num(frame.time) && frame.time >= 0, 'Vision frame: time inválido');
  assert(Number.isInteger(frame.frameWidth) && frame.frameWidth > 0, 'Vision frame: frameWidth inválido');
  assert(Number.isInteger(frame.frameHeight) && frame.frameHeight > 0, 'Vision frame: frameHeight inválido');
  assert(Array.isArray(frame.faces), 'Vision frame: faces debe ser una lista');
  for (const face of frame.faces) {
    assert(face && num(face.x) && num(face.y) && num(face.width) && num(face.height), 'Cara: bbox inválido');
    assert(face.width > 0 && face.height > 0 && face.x >= 0 && face.y >= 0, 'Cara: bbox fuera de rango');
    assert(face.x + face.width <= frame.frameWidth + 1e-6 && face.y + face.height <= frame.frameHeight + 1e-6, 'Cara fuera del frame');
    assert(num(face.score) && face.score >= 0 && face.score <= 1, 'Cara: score inválido');
    for (const key of ['leftEye','rightEye']) {
      if (face[key]) {
        assert(num(face[key].x) && num(face[key].y), `Cara: ${key} inválido`);
        assert(face[key].x >= 0 && face[key].x <= frame.frameWidth && face[key].y >= 0 && face[key].y <= frame.frameHeight, `Cara: ${key} fuera del frame`);
      }
    }
  }
  return true;
}

const faceCenter = face => ({x: face.x + face.width/2, y: face.y + face.height/2});
const faceArea = face => face.width * face.height;
const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);

export function selectPrimaryFace(frame, previous=null) {
  validateVisionFrame(frame);
  if (!frame.faces.length) return null;
  const diag = Math.hypot(frame.frameWidth, frame.frameHeight);
  let best=null, bestScore=-Infinity;
  for (const face of frame.faces) {
    const c=faceCenter(face);
    const areaRatio=faceArea(face)/(frame.frameWidth*frame.frameHeight);
    const continuity = previous ? 1-clamp(distance(c,previous.center)/diag,0,1) : 0.5;
    const score = face.score*0.45 + clamp(areaRatio*8,0,1)*0.25 + continuity*0.30;
    if(score>bestScore){bestScore=score;best={face,center:c,selectionScore:score};}
  }
  return best;
}

export function eyeAnchor(face) {
  if (face.leftEye && face.rightEye) {
    return {x:(face.leftEye.x+face.rightEye.x)/2,y:(face.leftEye.y+face.rightEye.y)/2,source:'eyes'};
  }
  return {x:face.x+face.width/2,y:face.y+face.height*0.38,source:'estimated'};
}

export function buildFaceTrack(frames,{maxGap=0.75}={}) {
  assert(Array.isArray(frames) && frames.length>0, 'Vision track: frames vacío');
  const ordered=[...frames].sort((a,b)=>a.time-b.time);
  const points=[];
  let prev=null, lastSeenTime=null;
  for(const frame of ordered){
    validateVisionFrame(frame);
    const selected=selectPrimaryFace(frame,prev);
    if(!selected){
      if(lastSeenTime!==null && frame.time-lastSeenTime>maxGap) prev=null;
      continue;
    }
    const anchor=eyeAnchor(selected.face);
    const point={time:frame.time,frameWidth:frame.frameWidth,frameHeight:frame.frameHeight,face:selected.face,center:selected.center,eye:anchor,selectionScore:selected.selectionScore};
    points.push(point); prev=point; lastSeenTime=frame.time;
  }
  assert(points.length>0,'Vision track: no se detectó ninguna cara');
  return points;
}

export function smoothFaceTrack(points,{alphaPosition=0.22,alphaScale=0.18}={}) {
  assert(Array.isArray(points) && points.length>0,'Smooth: track vacío');
  assert(alphaPosition>0&&alphaPosition<=1&&alphaScale>0&&alphaScale<=1,'Smooth: alpha inválido');
  let sx=points[0].eye.x, sy=points[0].eye.y, sw=points[0].face.width, sh=points[0].face.height;
  return points.map((p,i)=>{
    if(i){sx=lerp(sx,p.eye.x,alphaPosition);sy=lerp(sy,p.eye.y,alphaPosition);sw=lerp(sw,p.face.width,alphaScale);sh=lerp(sh,p.face.height,alphaScale);}
    return {...p,smoothed:{eyeX:sx,eyeY:sy,faceWidth:sw,faceHeight:sh}};
  });
}

export function computePortraitCrop(point,{
  outputWidth=1080,outputHeight=1920,baseZoom=1.08,maxZoom=1.35,eyeLine=0.34,headroom=0.12
}={}) {
  assert(point?.smoothed,'Crop: punto suavizado obligatorio');
  assert(baseZoom>=1 && maxZoom>=baseZoom && maxZoom<=2,'Crop: zoom inválido');
  const srcW=point.frameWidth, srcH=point.frameHeight;
  const outAspect=outputWidth/outputHeight;
  const faceCoverage=point.smoothed.faceHeight/srcH;
  const semanticZoom=clamp(baseZoom + Math.max(0,0.28-faceCoverage)*0.55,baseZoom,maxZoom);

  let cropH=srcH/semanticZoom;
  let cropW=cropH*outAspect;
  if(cropW>srcW){cropW=srcW/semanticZoom;cropH=cropW/outAspect;}

  const desiredEyeY=cropH*(eyeLine+headroom*0.15);
  let x=point.smoothed.eyeX-cropW/2;
  let y=point.smoothed.eyeY-desiredEyeY;
  x=clamp(x,0,Math.max(0,srcW-cropW));
  y=clamp(y,0,Math.max(0,srcH-cropH));

  return {time:point.time,x,y,width:cropW,height:cropH,zoom:semanticZoom,anchor:'eyes',outputWidth,outputHeight};
}

export function buildReframePlan(frames,options={}) {
  const raw=buildFaceTrack(frames,options.tracking);
  const smooth=smoothFaceTrack(raw,options.smoothing);
  const keyframes=smooth.map(p=>computePortraitCrop(p,options.crop));
  return {version:'1.0',mode:'face-eye-reframe',keyframes,safeZones:PORTRAIT_SAFE_ZONES};
}

export function validateSafePlacement(box, zone=PORTRAIT_SAFE_ZONES.content) {
  assert(box && [box.left,box.right,box.top,box.bottom].every(num),'Safe placement: box inválido');
  return box.left>=zone.left && box.right<=zone.right && box.top>=zone.top && box.bottom<=zone.bottom;
}
