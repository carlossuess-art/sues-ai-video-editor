import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildFaceTrack} from '../src/vision.js';
import {stabilizeFaceTrack,buildStableReframePlan,summarizeReframePlan,DEFAULT_STABILIZATION,buildCameraProfilePlan,sampleReframeAt} from '../src/reframe.js';

const fixture=()=>JSON.parse(readFileSync(new URL('../examples/vision/poc001.mediapipe.json',import.meta.url)));

test('stable tracker limits the initial MediaPipe discontinuity',()=>{
  const d=fixture();
  const raw=buildFaceTrack(d.frames);
  const stable=stabilizeFaceTrack(raw);
  const diag=Math.hypot(d.frames[0].frameWidth,d.frames[0].frameHeight);
  let maxRate=0;
  for(let i=1;i<stable.length;i++){
    const a=stable[i-1].smoothed,b=stable[i].smoothed;
    const dt=stable[i].time-stable[i-1].time;
    maxRate=Math.max(maxRate,Math.hypot(b.eyeX-a.eyeX,b.eyeY-a.eyeY)/diag/dt);
  }
  assert.ok(maxRate<=DEFAULT_STABILIZATION.maxPositionSpeed+1e-9);
});

test('dead zone holds camera through micro movement',()=>{
  const points=[
    {time:0,frameWidth:1080,frameHeight:1920,eye:{x:500,y:600},face:{width:220,height:300}},
    {time:.5,frameWidth:1080,frameHeight:1920,eye:{x:504,y:604},face:{width:220,height:300}},
    {time:1,frameWidth:1080,frameHeight:1920,eye:{x:507,y:605},face:{width:220,height:300}}
  ];
  const out=stabilizeFaceTrack(points);
  assert.equal(out[0].smoothed.eyeX,out[1].smoothed.eyeX);
  assert.equal(out[1].smoothed.eyeX,out[2].smoothed.eyeX);
});

test('real fixture produces bounded stable reframe plan',()=>{
  const d=fixture();
  const plan=buildStableReframePlan(d.frames);
  const s=summarizeReframePlan(plan);
  assert.equal(s.keyframes,73);
  assert.ok(s.zoomMin>=1.08&&s.zoomMax<=1.35);
  assert.ok(s.maxCropSpeedPxPerSec<30);
  assert.ok(s.maxZoomRatePerSec<.02);
  for(const k of plan.keyframes){
    assert.ok(k.x>=0&&k.y>=0);
    assert.ok(k.x+k.width<=1080+1e-6);
    assert.ok(k.y+k.height<=1920+1e-6);
  }
});

test('scale rate limiter prevents bbox-size spikes from breathing the zoom',()=>{
  const points=[
    {time:0,frameWidth:1080,frameHeight:1920,eye:{x:540,y:900},face:{width:300,height:450}},
    {time:.5,frameWidth:1080,frameHeight:1920,eye:{x:540,y:900},face:{width:170,height:250}}
  ];
  const out=stabilizeFaceTrack(points,{maxScaleRate:.12});
  assert.ok(out[1].smoothed.faceHeight>400);
});


test('both camera profiles stay bounded and retain eyes/head on the real fixture',()=>{
 const frames=fixture().frames;
 for(const profile of ['conservative','composition']){
  const p=buildCameraProfilePlan(frames,{profile});
  assert.equal(p.keyframes.length,73);
  assert.equal(summarizeReframePlan(p).maxZoomRatePerSec,0);
  for(const f of frames.filter(f=>f.faces.length)){
   const k=sampleReframeAt(p,f.time),face=f.faces[0];
   assert.ok(k.x>=0&&k.y>=0&&k.x+k.width<=f.frameWidth+1e-6&&k.y+k.height<=f.frameHeight+1e-6);
   assert.ok(face.y>=k.y&&face.y+face.height<=k.y+k.height);
   for(const eye of [face.leftEye,face.rightEye])assert.ok(eye.x>=k.x&&eye.x<=k.x+k.width&&eye.y>=k.y&&eye.y<=k.y+k.height);
  }
 }
 const a=buildCameraProfilePlan(frames,{profile:'conservative'}),b=buildCameraProfilePlan(frames,{profile:'composition'});
 const error=p=>frames.filter(f=>f.faces.length).reduce((sum,f)=>{const k=sampleReframeAt(p,f.time);const eye=(f.faces[0].leftEye.y+f.faces[0].rightEye.y)/2;return sum+Math.abs((eye-k.y)/k.height-.4);},0);
 assert.ok(error(b)<error(a));
});

test('profile interpolation preserves bounds at intermediate times and holds endpoints',()=>{
 const p=buildCameraProfilePlan(fixture().frames,{profile:'composition'});
 for(let time=0;time<38.31;time+=1/30){const k=sampleReframeAt(p,time);assert.ok(k.x>=0&&k.y>=0&&k.x+k.width<=1080+1e-6&&k.y+k.height<=1920+1e-6);}
 assert.equal(sampleReframeAt(p,100).x,p.keyframes.at(-1).x);
 assert.throws(()=>buildCameraProfilePlan(fixture().frames,{profile:'missing'}));
 assert.throws(()=>buildCameraProfilePlan(fixture().frames,{crop:{zoom:NaN}}));
});
