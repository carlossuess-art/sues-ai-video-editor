import test from 'node:test';
import assert from 'node:assert/strict';
import {validateVisionFrame,selectPrimaryFace,eyeAnchor,buildFaceTrack,smoothFaceTrack,computePortraitCrop,buildReframePlan,validateSafePlacement,PORTRAIT_SAFE_ZONES} from '../src/vision.js';

const frame=(time,x=700,y=220)=>({time,frameWidth:1920,frameHeight:1080,faces:[
  {x,y,width:360,height:520,score:.98,leftEye:{x:x+120,y:y+165},rightEye:{x:x+240,y:y+160}}
]});

test('vision frame contract validates bbox, confidence and eyes',()=>{
  assert.equal(validateVisionFrame(frame(0)),true);
  const bad=frame(0);bad.faces[0].score=2;assert.throws(()=>validateVisionFrame(bad));
});

test('primary face tracking prefers continuity over a distant similarly-sized face',()=>{
  const f=frame(1);f.faces.push({x:20,y:200,width:370,height:520,score:.99,leftEye:{x:140,y:360},rightEye:{x:260,y:360}});
  const selected=selectPrimaryFace(f,{center:{x:880,y:480}});
  assert.ok(selected.center.x>700);
});

test('eye anchor uses real eyes and falls back to stable face proportion',()=>{
  assert.equal(eyeAnchor(frame(0).faces[0]).source,'eyes');
  const f={...frame(0).faces[0]};delete f.leftEye;delete f.rightEye;
  assert.equal(eyeAnchor(f).source,'estimated');
});

test('track and smoothing damp sudden eye movement',()=>{
  const track=buildFaceTrack([frame(0,700),frame(.1,710),frame(.2,1000)]);
  const smooth=smoothFaceTrack(track,{alphaPosition:.2,alphaScale:.2});
  const rawJump=track[2].eye.x-track[1].eye.x;
  const smoothJump=smooth[2].smoothed.eyeX-smooth[1].smoothed.eyeX;
  assert.ok(Math.abs(smoothJump)<Math.abs(rawJump));
});

test('portrait crop keeps bounds and anchors eye line instead of frame center',()=>{
  const p=smoothFaceTrack(buildFaceTrack([frame(0)]))[0];
  const c=computePortraitCrop(p);
  assert.ok(c.x>=0&&c.y>=0&&c.x+c.width<=1920+1e-6&&c.y+c.height<=1080+1e-6);
  assert.equal(c.anchor,'eyes');
  assert.ok(c.zoom>=1.08&&c.zoom<=1.35);
});

test('reframe plan emits safe zones and keyframes',()=>{
  const r=buildReframePlan([frame(0),frame(.2,720),frame(.4,735)]);
  assert.equal(r.version,'1.0');
  assert.equal(r.keyframes.length,3);
  assert.deepEqual(r.safeZones,PORTRAIT_SAFE_ZONES);
});

test('safe placement accepts central content and rejects UI collision',()=>{
  assert.equal(validateSafePlacement({left:100,right:900,top:300,bottom:900}),true);
  assert.equal(validateSafePlacement({left:100,right:1050,top:300,bottom:900}),false);
});
