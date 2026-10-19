import test from 'node:test';
import assert from 'node:assert/strict';
import {validateMusicJourney,normalizeMusicJourney,singleBedToJourney} from '../src/music-journey.js';

test('multi-segment Music Journey validates and normalizes ids',()=>{
 const plan={version:'1.0',segments:[
  {mood:'intrigue',start:0,end:3,source:'a',gain:.1,transitionIn:'fade',transitionOut:'crossfade',duckUnderVoice:true},
  {mood:'resolution',start:3,end:7,source:'b',gain:.14,transitionIn:'crossfade',transitionOut:'fade',duckUnderVoice:true}
 ]};
 assert.equal(validateMusicJourney(plan,{duration:7}),true);
 assert.equal(normalizeMusicJourney(plan,{duration:7}).segments[1].id,'music-02');
});

test('Music Journey rejects overlap and unsafe gain',()=>{
 const overlap={version:'1.0',segments:[
  {mood:'intrigue',start:0,end:4,source:'a',gain:.1,transitionIn:'fade',transitionOut:'fade',duckUnderVoice:true},
  {mood:'tension',start:3,end:5,source:'b',gain:.1,transitionIn:'fade',transitionOut:'fade',duckUnderVoice:true}
 ]};
 assert.throws(()=>validateMusicJourney(overlap));
 const loud=singleBedToJourney({source:'a',duration:4});
 loud.segments[0].gain=.8;
 assert.throws(()=>validateMusicJourney(loud));
});

test('single music bed remains a valid fallback',()=>{
 const j=singleBedToJourney({source:'owned:track',duration:14,gain:.16});
 assert.equal(j.segments.length,1);
 assert.equal(j.segments[0].mood,'neutral');
});
