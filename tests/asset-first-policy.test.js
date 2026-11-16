import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareAssetFirstReview,ASSET_FIRST_POLICY} from '../src/motion-templates/asset-first-policy.js';
import {buildEditorNarrativeMotionReview} from '../src/motion-templates/editor-motion-bridge.js';
const hash='a'.repeat(64);
const transcript={version:'1.0',language:'es',sourceDuration:6,words:[
 {text:'¿Quieres',start:0,end:0.5},{text:'abrir',start:.5,end:1},
 {text:'espacio',start:1,end:1.5},{text:'para',start:1.5,end:2},
 {text:'escuchar',start:2,end:2.5},{text:'tu',start:2.5,end:3},
 {text:'corazón?',start:3,end:3.5}
]};
const captions=[{id:'c',source:'auto',text:transcript.words.map(x=>x.text).join(' '),
 wordIndexes:[0,1,2,3,4,5,6]}];
const opt={sourceSha256:hash,planSourceSha256:hash,transcript,
 jobFingerprint:'rev-verified',requestedFingerprint:'rev-verified',
 captions,selections:[{captionId:'c',displayWordIndex:2,
 sourceWordIndex:2,captionText:captions[0].text}]};
test('bridge reuses the one existing word selection and adds asset-first review without editing',()=>{
 const x=buildEditorNarrativeMotionReview(opt);
 assert.equal(x.readOnly,true);assert.equal(x.assetFirst.readOnly,true);
 assert.equal(x.assetFirst.canExecute,false);assert.equal(x.assetFirst.policy.generationAutomated,false);
 assert.equal(x.assetFirst.sourceSha256,hash);
 assert(x.assetFirst.proposals.every(p=>p.selectedSourceWordIds.every(id=>x.review.selectedWordIds.includes(id))));
 assert(x.assetFirst.proposals.every(p=>p.assetId===null&&p.alphaVerified===false));
});
test('procedural chart remains procedural; cinematic objects require transparent image brief',()=>{
 const d={schema:'sues-narrative-motion-review/v1',source:{sourceSha256:hash},
  selectedWordIds:['w1','w2'],candidates:[
   {id:'a',intent:'structured-process',templateId:'p',reason:'metaphor',sourceSpeech:{selectedWordIds:['w1'],anchorWordId:'w1'}},
   {id:'b',intent:'data-trend',templateId:'p',reason:'chart',sourceSpeech:{selectedWordIds:['w2'],anchorWordId:'w2'}}]};
 const x=prepareAssetFirstReview(d);
 assert.equal(x.proposals[0].method,'verified-transparent-image-first');
 assert.equal(x.proposals[1].method,'procedural-graphic');
 assert.equal(x.canExecute,false);assert.equal(ASSET_FIRST_POLICY.keepOriginalFace,true);
});
test('rejects made-up word approvals and duplicate candidate IDs',()=>{
 const d={schema:'sues-narrative-motion-review/v1',selectedWordIds:['valid'],
  source:{sourceSha256:hash},candidates:[
   {id:'a',intent:'structured-process',sourceSpeech:{anchorWordId:'forged',selectedWordIds:['forged']}}]};
 assert.throws(()=>prepareAssetFirstReview(d),/EXPLICITLY_SELECTED/);
 d.candidates[0].sourceSpeech.selectedWordIds=['valid'];
 d.candidates.push({...d.candidates[0]});
 assert.throws(()=>prepareAssetFirstReview(d),/DUPLICATE/);
});
test('no selection produces no generated asset or automatic editing',()=>{
 const x=buildEditorNarrativeMotionReview({...opt,selections:[]});
 assert.equal(x.assetFirst.proposals.length,0);
 assert.equal(x.assetFirst.canExecute,false);
});
