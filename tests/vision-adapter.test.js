import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateVisionFrame} from '../src/vision.js';

test('real MediaPipe fixture maps to vision contract with ordered source timestamps',()=>{
 const d=JSON.parse(readFileSync(new URL('../examples/vision/poc001.mediapipe.json',import.meta.url)));
 assert.ok(d.frames.length>=60);let previous=-1,seen=0;
 for(const frame of d.frames){assert.equal(validateVisionFrame(frame),true);assert.ok(frame.time>previous);previous=frame.time;
  for(const face of frame.faces){seen++;assert.equal(face.scoreKind,'presence-proxy-not-confidence');assert.ok(face.leftEye&&face.rightEye);}
 }
 assert.ok(seen/d.frames.length>.9);assert.equal(d.timestampFallbacks,0);
});
