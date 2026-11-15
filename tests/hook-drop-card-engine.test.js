import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleHookDropCard,renderHookDropCardSvg,FRAME_COUNT,EVENTS} from '../src/motion-templates/hook-drop-card-engine.js';

test('51 deterministic frames at 30fps with stable object IDs',()=>{
 assert.equal(FRAME_COUNT,51);
 const a=sampleHookDropCard(18);
 assert.deepEqual(a,sampleHookDropCard(18));
 assert.equal(a.id,'TPL_HOOK_DROP_CARD');
 assert.equal(a.width,1080);
 assert.equal(a.height,1920);
 assert.throws(()=>sampleHookDropCard(-1),RangeError);
 assert.throws(()=>sampleHookDropCard(51),RangeError);
 assert.throws(()=>sampleHookDropCard(8.2),RangeError);
});
test('card opens and remains static for legibility',()=>{
 assert.equal(sampleHookDropCard(0).card.h,8);
 assert.equal(sampleHookDropCard(EVENTS.openEnd).card.h,488);
 assert.equal(sampleHookDropCard(30).phase,'hold');
 assert.equal(sampleHookDropCard(30).card.rx,62);
 assert.equal(sampleHookDropCard(30).text.opacity,1);
});
test('sphere drops, impacts, rebounds and settles',()=>{
 assert.equal(sampleHookDropCard(6).orb.y,160);
 assert.equal(sampleHookDropCard(14).orb.y,590);
 assert.ok(sampleHookDropCard(18).orb.y<590);
 assert.equal(sampleHookDropCard(23).orb.y,590);
 assert.equal(sampleHookDropCard(23).orb.r,86);
});
test('one camera exits only after the hold',()=>{
 assert.equal(sampleHookDropCard(33).camera.scale,1);
 assert.ok(sampleHookDropCard(42).camera.scale>1);
 assert.equal(sampleHookDropCard(50).camera.scale,2.2);
 assert.equal(sampleHookDropCard(50).camera.dy,-830);
});
test('all frames are SVG, customizable and escape literal text',()=>{
 for(let frame=0;frame<FRAME_COUNT;frame++){
  const svg=renderHookDropCardSvg(frame,{line1:'CUIDA TU',line2:'ATENCIÓN'});
  assert.match(svg,/^<svg /);
  assert.match(svg,/id="orb"/);
  assert.ok(!svg.includes('NaN'));
 }
 const html=renderHookDropCardSvg(25,{line1:'<script>&',line2:'CUIDADO'});
 assert.ok(html.includes('&lt;script&gt;&amp;'));
 assert.ok(!html.includes('<script>'));
 assert.throws(()=>sampleHookDropCard(3,{palette:{edge:'red'}}),/invalid color/);
});
test('does not alter captions and does not claim native support',()=>{
 assert.equal(sampleHookDropCard(20).captions,'delegate-to-existing-editor');
 assert.equal(sampleHookDropCard(20).executableInFableCut,false);
});
