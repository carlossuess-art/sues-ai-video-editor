import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareNarrativeMotionReview,MOTION_GRAMMAR_LIBRARY} from '../src/motion-templates/narrative-motion-review.js';
const original=(text)=>{
 let t=0;const words=text.split(/\s+/).map((v,i)=>{const w={id:'real-'+i,text:v,start:t,end:t+0.2};t+=0.23;return w;});
 return {version:'1.0',language:'es',sourceDuration:Math.max(4,t+1),words};
};
test('no selection gives interactive occurrence selector; no proposed graphics',()=>{
 const t=original('¿Y si te escucharas? Haz espacio para escucharte.');
 const r=prepareNarrativeMotionReview(t);
 assert.equal(r.status,'AWAITING_WORD_SELECTION');
 assert.equal(r.candidates.length,0);assert.equal(r.selector.options.length,8);
 assert.ok(r.selector.options[0].context.includes('¿Y'));
 assert.equal(r.autoEditAuthorized,false);
});
test('question hook and creating space appear only for explicit word IDs',()=>{
 const t=original('¿Y si te escucharas? Haz espacio para escucharte.');
 const r=prepareNarrativeMotionReview(t,{selectedWordIds:['real-3','real-6']});
 assert.equal(r.status,'MOTION_CANDIDATES_FOR_REVIEW');
 assert.deepEqual(r.candidates.map(x=>x.templateId),['TPL_HOOK_DROP_CARD','SUES_CARD_TO_SPACE_DEMO']);
 assert.equal(r.candidates[0].sourceSpeech.quote,'¿Y si te escucharas?');
 assert.equal(r.candidates[1].sourceSpeech.anchorWordId,'real-6');
 assert.equal(r.candidates[0].editingEffect,'NONE');
 assert.equal(r.candidates[1].placement,'pending inspection of actual frame and subject');
});
test('generic words and negated irrelevant text create zero motions',()=>{
 for(const line of ['Me gusta pasear por el parque.', 'No tienes que hacer nada ahora.', 'Es un bonito día de verano.']){
  const t=original(line);
  const r=prepareNarrativeMotionReview(t,{selectedWordIds:['real-0']});
  assert.equal(r.candidates.length,0,line);
 }
});
test('numerical data and measurable objective remain specification-only',()=>{
 const t=original('Son 35000 decisiones cada día. Nuestra meta es lograr un objetivo.');
 const r=prepareNarrativeMotionReview(t,{selectedWordIds:['real-1','real-7']});
 assert.ok(r.candidates.some(x=>x.templateId==='TPL_METAPHOR_COUNTER_GLOW'));
 assert.ok(r.candidates.every(x=>x.implementation==='specification-only'));
 assert.ok(r.candidates.every(x=>x.blockReasons.length));
});
test('no silent word id construction, duplicates or uncertain timing',()=>{
 const t=original('¿Y si te escucharas?');
 assert.throws(()=>prepareNarrativeMotionReview({...t,words:t.words.map(({id,...w})=>w)}),/stable unique id/);
 assert.throws(()=>prepareNarrativeMotionReview(t,{selectedWordIds:['real-4']}),/unknown word/);
 assert.throws(()=>prepareNarrativeMotionReview(t,{selectedWordIds:['real-0','real-0']}),/unique ids/);
 assert.throws(()=>prepareNarrativeMotionReview({...t,words:t.words.map((w,i)=>i===0?{...w,timingUncertain:true}:w)}),/Uncertain/);
});
test('prior IDs are reused only if they still exist; selection does not imply approval',()=>{
 const t=original('¿Y si te escucharas?');
 const r=prepareNarrativeMotionReview(t,{previousSelectedWordIds:['real-1']});
 assert.equal(r.selector.options[1].checked,true);
 assert.equal(r.selector.selectionSubmitted,false);
 assert.equal(r.creativeApproved,false);
 assert.throws(()=>prepareNarrativeMotionReview(t,{previousSelectedWordIds:['unknown']}),/conflicts/);
});
test('other grammar families stay described but never claimed as implemented',()=>{
 assert.equal(MOTION_GRAMMAR_LIBRARY.length,7);
 assert.equal(MOTION_GRAMMAR_LIBRARY.filter(x=>x.status==='standalone-svg-prototype').length,2);
 assert.equal(MOTION_GRAMMAR_LIBRARY.filter(x=>x.status==='specification-only').length,5);
});
