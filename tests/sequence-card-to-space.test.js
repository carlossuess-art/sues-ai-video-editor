import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleCardToSpace,renderCardToSpaceSvg,SEQUENCE_FRAMES,SPACE_EVENTS} from '../src/motion-templates/sequence-card-to-space.js';

test('one continuous 30fps canvas and deterministic states',()=>{
 assert.equal(SEQUENCE_FRAMES,151);
 assert.deepEqual(sampleCardToSpace(76),sampleCardToSpace(76));
 assert.throws(()=>sampleCardToSpace(-1),RangeError);
 assert.throws(()=>sampleCardToSpace(151),RangeError);
});
test('rails absent before bridge, then part to create room for words',()=>{
 const first=sampleCardToSpace(50),middle=sampleCardToSpace(82),end=sampleCardToSpace(100);
 assert.equal(first.rails.opacity,0);
 assert.ok(middle.rails.opacity>0);
 assert.ok(middle.rails.leftX<middle.rails.rightX);
 assert.equal(end.rails.leftX,114);
 assert.equal(end.rails.rightX,966);
});
test('follow-up words emerge individually, never as a single phrase',()=>{
 const words=sampleCardToSpace(100).words;
 assert.equal(words[0].opacity,1);
 assert.equal(words[1].opacity,0);
 assert.equal(words[2].opacity,0);
 assert.equal(words[3].opacity,0);
 assert.ok(sampleCardToSpace(126).words.every(w=>w.opacity===1));
});
test('zoom exits first frame group before second scene is settled',()=>{
 assert.equal(SPACE_EVENTS.cardGone,69);
 assert.equal(sampleCardToSpace(69).stage,'opening-space');
 assert.equal(sampleCardToSpace(150).endsReadyForNextScene,true);
});
test('SVG has individually positioned text with no orb or synthetic sound',()=>{
 for(let f=0;f<SEQUENCE_FRAMES;f++){
  const svg=renderCardToSpaceSvg(f);
  assert.equal((svg.match(/<svg\b/g)||[]).length,1);
  assert.ok(svg.includes('id="follow-scene"'));
  assert.ok(svg.includes('id="camera"'));
  assert.ok(svg.includes('textLength='));
  assert.ok(!svg.includes('id="orb"'));
  assert.ok(!svg.includes('NaN'));
 }
 assert.ok(renderCardToSpaceSvg(120,{followLine1:'<ESCUCHA>',followLine2:'Y RESPIRA'}).includes('&lt;ESCUCHA&gt;'));
});
test('no assumed speech timestamps or native support',()=>{
 const s=sampleCardToSpace(115);
 assert.equal(s.speechSync,'demo-no-transcript');
 assert.equal(s.captionPolicy,'use-existing-editor');
 assert.equal(s.executableInFableCut,false);
});