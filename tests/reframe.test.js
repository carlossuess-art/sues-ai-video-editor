import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildFaceTrack} from '../src/vision.js';
import {stabilizeFaceTrack,buildStableReframePlan,summarizeReframePlan} from '../src/reframe.js';

const fixture=()=>JSON.parse(readFileSync(new URL('../examples/vision/poc001.mediapipe.json',import.meta.url)));

test('stable tracker limits the initial MediaPipe discontinuity',()=>{
  const d=fixture();
  const raw=buildFaceTrack(d.frames);
  const stable=stabilizeFaceTrack(raw);
  const diag=Math.hypot(d.frames[0].frameWidth,d.frames[0].frameHeight);
  let maxPct=0;
  for(let i=1;i<stable.length;i++){
    const a=stable[i-1].smoothed,b=stable[i].smoothed;
    maxPct=Math.max(maxPct,100*Math.hypot(b.eyeX-a.eyeX,b.eyeY-a.eyeY)/diag);
  }
  assert.ok(maxPct<2.2);
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
