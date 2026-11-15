import test from 'node:test';
import assert from 'node:assert/strict';
import {bindCardToSpaceToSpeech} from '../src/motion-templates/bind-sequence-to-speech.js';
import {sampleCardToSpace} from '../src/motion-templates/sequence-card-to-space.js';
const transcriptWords=[
 {id:'c0',text:'¿Y',start:0.27,end:0.43},{id:'c1',text:'sí',start:.47,end:.59},
 {id:'c2',text:'te',start:.67,end:.79},{id:'c3',text:'escucharas?',start:.87,end:1.10},
 {id:'f0',text:'Haz',start:3.10,end:3.25},{id:'f1',text:'espacio',start:3.40,end:3.62},
 {id:'f2',text:'para',start:3.70,end:3.83},{id:'f3',text:'escucharte',start:4.10,end:4.30}];
const src={line1:'¿Y SI TE',line2:'ESCUCHARAS?',followLine1:'HAZ ESPACIO',followLine2:'PARA ESCUCHARTE',clipStartSec:0,
 transcriptWords,cardWordIds:['c0','c1','c2','c3'],followWordIds:['f0','f1','f2','f3']};
test('binds two selected phrases by reviewed IDs without auto-edit',()=>{
 const x=bindCardToSpaceToSpeech(src);
 assert.deepEqual(x.params.wordStartFrames,[8,14,20,26]);
 assert.deepEqual(x.params.followWordStartFrames,[93,102,111,123]);
 assert.equal(sampleCardToSpace(123,x.params).words[3].wordId,'f3');
 assert.equal(sampleCardToSpace(126,x.params).speechSync,'external-word-id-anchors');
 assert.equal(x.readyForAutomaticEdit,false);
});
test('rejects missing follow-up selection and mismatched speech',()=>{
 assert.throws(()=>bindCardToSpaceToSpeech({...src,followWordIds:undefined}),/explicit/);
 assert.throws(()=>bindCardToSpaceToSpeech({...src,followLine2:'PARA DORMIR'}),/differs/);
 assert.throws(()=>bindCardToSpaceToSpeech({...src,followWordIds:['f0','f1','f1','f3']}),/explicit/);
});
test('rejects false timing and early card reveal',()=>{
 const changed=transcriptWords.map(w=>w.id==='f3'?{...w,start:4.92,end:5.14}:w);
 assert.throws(()=>bindCardToSpaceToSpeech({...src,transcriptWords:changed}),/outside/);
 const early=transcriptWords.map(w=>w.id==='c0'?{...w,start:0.10,end:.20}:w);
 assert.throws(()=>bindCardToSpaceToSpeech({...src,transcriptWords:early}),/rectangle/);
});
test('binds reviewed real IDs while follow-up words appear during the moving rails',()=>{
 const earlier=transcriptWords.map(w=>{
  const starts={f0:2.70,f1:2.97,f2:3.47,f3:3.73};
  return Object.hasOwn(starts,w.id)?{...w,start:starts[w.id],end:starts[w.id]+.12}:w;
 });
 const result=bindCardToSpaceToSpeech({...src,transcriptWords:earlier});
 assert.deepEqual(result.params.followWordStartFrames,[81,89,104,112]);
 assert.ok(sampleCardToSpace(85,result.params).words[0].opacity>0);
 assert.equal(sampleCardToSpace(85,result.params).speechSync,'external-word-id-anchors');
 assert.equal(result.nativeMapping,'not-available');
 assert.equal(result.readyForAutomaticEdit,false);
});
test('rejects follow-up speech that would appear before the legible rail-opening window',()=>{
 const tooSoon=transcriptWords.map(w=>w.id==='f0'?{...w,start:2.60,end:2.72}:w);
 assert.throws(()=>bindCardToSpaceToSpeech({...src,transcriptWords:tooSoon}),/outside/);
});
