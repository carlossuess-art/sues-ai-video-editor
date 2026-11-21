import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleHookDropCard,renderHookDropCardSvg,EVENTS,FRAME_COUNT,FPS} from '../src/motion-templates/hook-drop-card-engine.js';

test('deterministic 70 frames at 30fps',()=>{
 assert.equal(FRAME_COUNT,70);assert.equal(FPS,30);
 assert.deepEqual(sampleHookDropCard(17),sampleHookDropCard(17));
 assert.throws(()=>sampleHookDropCard(-1),RangeError);
 assert.throws(()=>sampleHookDropCard(70),RangeError);
});
test('starts as sharp rectangle and rounds precisely with first word',()=>{
 const start=sampleHookDropCard(0),before=sampleHookDropCard(7),during=sampleHookDropCard(13),after=sampleHookDropCard(19);
 assert.equal(start.card.h,8);assert.equal(before.card.rx,0);
 assert.ok(during.card.rx>0&&during.card.rx<62);assert.equal(after.card.rx,62);
 assert.equal(sampleHookDropCard(18).card.h,538);
});
test('four words appear sequentially, not a single phrase fade',()=>{
 const f8=sampleHookDropCard(8).text.words,f16=sampleHookDropCard(16).text.words,f27=sampleHookDropCard(27).text.words;
 assert.deepEqual(f8.map(w=>w.text),['¿Y','SI','TE','ESCUCHARAS?']);
 assert.deepEqual(f8.map(w=>w.start),[8,14,20,26]);
 assert.equal(f8[1].opacity,0);assert.equal(f8[2].opacity,0);assert.equal(f8[3].opacity,0);
 assert.equal(f16[0].opacity,1);assert.ok(f16[1].opacity>0);assert.equal(f16[2].opacity,0);
 assert.equal(f27[0].opacity,1);assert.equal(f27[2].opacity,1);assert.ok(f27[3].opacity>0&&f27[3].opacity<1);
 assert.ok(sampleHookDropCard(32).text.words.every(w=>w.opacity===1));
});
test('hold gives time to read and zoom moves whole card fully offscreen',()=>{
 assert.equal(sampleHookDropCard(50).camera.scale,1);
 assert.ok(sampleHookDropCard(59).camera.scale>1);
 const last=sampleHookDropCard(EVENTS.exitEnd);
 assert.equal(last.camera.scale,4.5);assert.equal(last.camera.dy,-1950);
 const y=960+(last.card.cy-960)*last.camera.scale+last.camera.dy;
 assert.ok(y+last.card.h*last.camera.scale/2<0);
 assert.equal(last.transition.outgoingOffscreen,true);
});
test('SVG contains individual word spans but no sphere, wave or invented audio',()=>{
 for(let f=0;f<FRAME_COUNT;f++){
  const svg=renderHookDropCardSvg(f);
  assert.match(svg,/^<svg /);assert.match(svg,/motion-word-0-0/);
  assert.match(svg,/motion-word-1-0/);
  assert.doesNotMatch(svg,/(id="orb"|id="listening-wave")/);
  assert.doesNotMatch(svg,/NaN/);
 }
 assert.ok(renderHookDropCardSvg(20,{line1:'<script>&',line2:'ESCÚCHATE'}).includes('&lt;script&gt;&amp;'));
});
test('external speech anchors validated but not invented',()=>{
 const s=sampleHookDropCard(10,{wordStartFrames:[7,12,17,23],wordIds:['w1','w2','w3','w4']});
 assert.equal(s.speechSync,'external-word-id-anchors');assert.equal(s.text.words[2].wordId,'w3');
 assert.equal(sampleHookDropCard(10).speechSync,'demo-timing-only');
 assert.throws(()=>sampleHookDropCard(10,{wordStartFrames:[3,2,11,25]}),/invalid wordStartFrames/);
 assert.throws(()=>sampleHookDropCard(10,{wordIds:['one']}),/invalid wordIds/);
});
test('captions are untouched and FableCut execution is not claimed',()=>{
 const s=sampleHookDropCard(33);
 assert.equal(s.captions,'delegate-to-existing-editor');
 assert.equal(s.executableInFableCut,false);
 assert.equal(s.transition.incomingLayer,'provided-by-next-scene');
});
