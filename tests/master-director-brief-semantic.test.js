import test from 'node:test';
import assert from 'node:assert/strict';
import {checkFilmBriefIntentMapping} from '../src/master-director-brief-semantic.js';
const story={resources:[{id:'B01',source:'generate',kind:'video',creationBrief:'An authentic applause scene'}]};
test('a creative title cannot be rewritten or represented as an unrelated effect',()=>{
 const i={id:'scene-01-shot-01-editorial-title',track:'graphics',detail:{text:'PERDERTE A TI MISMO'}};
 const op={id:'title',track:'graphics',effect:'text',parameters:{text:'PERDERTE A TI MISMO'}};
 assert.equal(checkFilmBriefIntentMapping(i,op,story),null);
 assert.equal(checkFilmBriefIntentMapping(i,{...op,parameters:{text:'SER TÚ MISMO'}},story),'EDITORIAL_TITLE_TEXT_CHANGED');
 assert.equal(checkFilmBriefIntentMapping(i,{...op,effect:'image-exact'},story),'EDITORIAL_TITLE_TEXT_CHANGED');
});
test('B-roll cannot be silently swapped with another resource, still or placeholder',()=>{
 const i={id:'scene-01-shot-02-base',track:'broll',detail:{resourceHint:'B01'}};
 const op={id:'broll',track:'broll',effect:'video-exact',resourceRef:'B01'};
 assert.equal(checkFilmBriefIntentMapping(i,op,story),null);
 assert.equal(checkFilmBriefIntentMapping(i,{...op,resourceRef:'B02'},story),'BROLL_RESOURCE_ID_NOT_PRESERVED');
 assert.equal(checkFilmBriefIntentMapping(i,{...op,effect:'image-exact'},story),'BROLL_REPLACED_WITH_OTHER_EFFECT');
 assert.equal(checkFilmBriefIntentMapping(i,op,{resources:[]}), 'BROLL_RESOURCE_ID_NOT_PRESERVED');
});
test('cinematic motion cannot be silently certified by one text object',()=>{
 const i={id:'scene-04-shot-03-base',track:'graphics',detail:{base:'M02'}};
 assert.equal(checkFilmBriefIntentMapping(i,{track:'graphics',effect:'text'},story),'MOTION_COMPOSITION_REQUIRES_ADDITIONAL_LAYERS');
 assert.equal(checkFilmBriefIntentMapping(i,{track:'graphics',effect:'video-exact'},story),null);
 const overlay={id:'scene-03-shot-01-overlay-M01',track:'graphics',detail:{resourceHint:'M01'}};
 assert.equal(checkFilmBriefIntentMapping(overlay,{track:'graphics',effect:'text'},story),'MOTION_OVERLAY_COMPOSITION_UNVERIFIED');
});
test('transition, camera and captions keep their distinct purpose',()=>{
 assert.equal(checkFilmBriefIntentMapping({track:'transition'},{track:'graphics'},story),'BROLL_TRANSITION_NOT_REPRESENTED');
 assert.equal(checkFilmBriefIntentMapping({track:'camera'},{track:'broll'},story),'CAMERA_REPLACED_OR_LOST');
 assert.equal(checkFilmBriefIntentMapping({track:'captions'},{track:'graphics',effect:'text'},story),'CAPTION_NOT_REPRESENTED_AS_TEXT');
});
