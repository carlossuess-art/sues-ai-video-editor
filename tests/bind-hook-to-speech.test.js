import test from 'node:test';
import assert from 'node:assert/strict';
import {bindHookToSpeech} from '../src/motion-templates/bind-hook-to-speech.js';
import {sampleHookDropCard} from '../src/motion-templates/hook-drop-card-engine.js';
const words=[
{id:'w12',text:'¿Y',start:1.2,end:1.34},
{id:'w13',text:'si',start:1.4,end:1.53},
{id:'w14',text:'te',start:1.7,end:1.78},
{id:'w15',text:'escucharas?',start:1.9,end:2.17}
];
const data={line1:'¿Y SI TE',line2:'ESCUCHARAS?',clipStartSec:1,transcriptWords:words,selectedWordIds:['w12','w13','w14','w15']};
test('maps explicit real transcript IDs into word frames',()=>{
 const r=bindHookToSpeech(data);
 assert.deepEqual(r.params.wordStartFrames,[6,12,21,27]);
 assert.equal(sampleHookDropCard(20,r.params).text.words[2].wordId,'w14');
 assert.equal(r.readyForRealReel,false);
});
test('never invents or infers selected keywords',()=>{
 assert.throws(()=>bindHookToSpeech({...data,selectedWordIds:undefined}),/explicit/);
 assert.throws(()=>bindHookToSpeech({...data,selectedWordIds:['w12','w13','w14']}),/count/);
 assert.throws(()=>bindHookToSpeech({...data,selectedWordIds:['w12','w13','w13','w15']}),/unique/);
});
test('rejects semantic mismatch and reordering',()=>{
 assert.throws(()=>bindHookToSpeech({...data,line2:'RESPIRAR'}),/does not match/);
 assert.throws(()=>bindHookToSpeech({...data,selectedWordIds:['w13','w12','w14','w15']}),/does not match/);
 assert.throws(()=>bindHookToSpeech({...data,transcriptWords:[...words].reverse()}),/order/);
});
test('rejects incorrect time, duplicates and unsupported FPS',()=>{
 assert.throws(()=>bindHookToSpeech({...data,clipStartSec:2.1}),/outside/);
 assert.throws(()=>bindHookToSpeech({...data,transcriptWords:[...words,words[0]]}),/duplicate/);
 assert.throws(()=>bindHookToSpeech({...data,fps:29.97}),/FPS 30/);
});
