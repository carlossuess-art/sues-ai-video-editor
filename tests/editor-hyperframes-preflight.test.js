import test from 'node:test';
import assert from 'node:assert/strict';
import {buildEditorNarrativeMotionReview} from '../src/motion-templates/editor-motion-bridge.js';
import {prepareEditorHyperFramesPreflight} from '../src/motion-templates/editor-hyperframes-preflight.js';
import {sampleCardToSpace} from '../src/motion-templates/sequence-card-to-space.js';

const sourceSha256='a'.repeat(64),jobFingerprint='b'.repeat(64),timelineFingerprint='b'.repeat(64);
const phrases=['¿Y','si','te','escucharas?','Haz','espacio','para','escucharte.'];
const starts=[8,14,20,26,81,89,104,112].map(f=>f/30);
const transcript={version:'1.0',language:'es',sourceDuration:10,
 words:phrases.map((text,i)=>({text,start:starts[i],end:starts[i]+.13}))};
const captions=[
 {id:'seg-001',source:'auto',text:phrases.slice(0,4).join(' '),wordIndexes:[0,1,2,3]},
 {id:'seg-002',source:'auto',text:phrases.slice(4).join(' '),wordIndexes:[4,5,6,7]}
];
const selections=[
 {captionId:'seg-001',displayWordIndex:3,sourceWordIndex:3,captionText:captions[0].text},
 {captionId:'seg-002',displayWordIndex:1,sourceWordIndex:5,captionText:captions[1].text}
];
const sourceTimeMap={version:'1.0',sourceDuration:10,duration:10,
 spans:[{index:0,sourceIn:0,sourceOut:10,editIn:0,editOut:10}]};
function args({
  transcript0=transcript,selection0=selections,timeMap=sourceTimeMap,
  duration=10,source=sourceSha256
}={}){
 const review=buildEditorNarrativeMotionReview({
  transcript:transcript0,sourceSha256:source,planSourceSha256:source,jobFingerprint,
  requestedFingerprint:jobFingerprint,captions,selections:selection0
 });
 return {editorReview:review,transcript:transcript0,sourceSha256:source,
  jobFingerprint,timelineFingerprint,sourceTimeMap:timeMap,editedDuration:duration};
}
test('prepares native HyperFrames CLI variables using real selected original word IDs and edited frames',()=>{
 const p=prepareEditorHyperFramesPreflight(args());
 assert.equal(p.status,'READY_FOR_CREATIVE_REVIEW');
 assert.equal(p.owner.motion,'HyperFrames');
 assert.equal(p.owner.editorial,'FableCut');
 assert.equal(p.scene.startFrame,0);
 assert.equal(p.scene.endFrameExclusive,151);
 assert.deepEqual(p.words.card.map(w=>w.editedFrame),[8,14,20,26]);
 assert.deepEqual(p.words.follow.map(w=>w.editedFrame),[81,89,104,112]);
 assert.deepEqual(p.words.selectedKeywordIds,['source-'+sourceSha256.slice(0,16)+'-w3','source-'+sourceSha256.slice(0,16)+'-w5']);
 assert.equal(p.hyperframes.variables.line1,'¿Y si te');
 assert.equal(p.hyperframes.variables.line2,'escucharas?');
 assert.equal(p.hyperframes.variables.followLine1,'Haz espacio');
 assert.equal(p.hyperframes.variables.followLine2,'para escucharte.');
 const s=JSON.parse(p.hyperframes.variables.wordScheduleJson);
 assert.deepEqual(s.wordStartFrames,[8,14,20,26]);
 assert.deepEqual(s.followWordStartFrames,[81,89,104,112]);
 const sample=sampleCardToSpace(112,{...p.hyperframes.variables,...s});
 assert.equal(sample.words[3].wordId,p.words.follow[3].id);
 assert.equal(sample.speechSync,'external-word-id-anchors');
 assert.equal(p.rendered,false);
 assert.equal(p.creativeApproved,false);
 assert.equal(p.canExecute,false);
 assert.equal(p.fablecut.operationStatus,'NOT_PREPARED');
 assert.equal(p.productionChanged,false);
 assert.match(p.avMarkdown,/GUION TÉCNICO A\/V/);
 assert.match(p.avMarkdown,/H01 .*F0–F7/);
 assert.match(p.avMarkdown,/H02 .*F8–F31/);
 assert.match(p.avMarkdown,/H06 .*F81–F118/);
 assert.match(p.avMarkdown,/H07 .*F119–F150/);
 assert.match(p.avMarkdown,/bruto 0\.267 s, edit\. F8/);
 assert.match(p.avMarkdown,/NO IMPORTABLE/);
 assert.match(p.avMarkdown,/no ha escuchado|no escuchado|aún no escuchado/i);
 assert.match(p.avMarkdown,/FableCut/);
});
test('blocks cut or unverified source-to-edited time mapping',()=>{
 const cut={...sourceTimeMap,spans:[
  {sourceIn:0,sourceOut:4,editIn:0,editOut:4},
  {sourceIn:5,sourceOut:10,editIn:4,editOut:9}],duration:9};
 const x=prepareEditorHyperFramesPreflight(args({timeMap:cut,duration:9}));
 assert.equal(x.status,'BLOCKED_FOR_EVIDENCE');
 assert.equal(x.issues[0].code,'SOURCE_TO_EDIT_MAP_NOT_VERIFIED');
 assert.equal(x.canExecute,false);
});
test('does not manufacture a complete scene from keyword selection on one phrase only',()=>{
 const p=prepareEditorHyperFramesPreflight(args({selection0:selections.slice(0,1)}));
 assert.equal(p.status,'BLOCKED_FOR_EVIDENCE');
 assert.equal(p.issues[0].code,'EXPLICIT_TWO_SOURCE_WORDS_REQUIRED');
});
test('detects phrases that do not fit the four-word demo grammar',()=>{
 const extra={...transcript,words:transcript.words.map((w,i)=>i===1?{...w,text:'alguna'}:w)};
 // Correct captions would have to be rebuilt if source wording changes.
 assert.throws(()=>args({transcript0:extra}),/Caption word context changed/);
 const expanded={...transcript,words:transcript.words.map(w=>({...w}))};
 expanded.words[4]={...expanded.words[4],start:2.1,end:2.23};
 const p=prepareEditorHyperFramesPreflight(args({transcript0:expanded}));
 assert.equal(p.status,'BLOCKED_FOR_EVIDENCE');
 assert.equal(p.issues[0].code,'REAL_SPEECH_OUTSIDE_TEMPLATE_WINDOW');
});
test('refuses to plan beyond video duration and never mistakes a proposal for approval',()=>{
 const p=prepareEditorHyperFramesPreflight(args({timeMap:{...sourceTimeMap,sourceDuration:4,duration:4,
  spans:[{sourceIn:0,sourceOut:4,editIn:0,editOut:4}]},duration:4}));
 assert.equal(p.issues[0].code,'MOTION_OUTSIDE_EDITED_VIDEO');
 assert.equal(p.creativeApproved,false);
});
test('fingerprint, source or editor review must remain identical',()=>{
 assert.throws(()=>prepareEditorHyperFramesPreflight({...args(),sourceSha256:'f'.repeat(64)}),/does not match/);
 assert.throws(()=>prepareEditorHyperFramesPreflight({...args(),timelineFingerprint:'wrong'}),/Trusted source/);
});

function realDialogueFixture({uncertain=false}={}){
 const lines=['Mañana','tengo','que','hacer','Y','otra','voz','responde,'];
 const frames=[8,18,27,30,86,88,94,100],seconds=frames.map(f=>f/30);
 const source={version:'1.0',language:'es',sourceDuration:10,
  words:lines.map((text,i)=>({text,start:seconds[i],end:seconds[i]+.1,
   ...(uncertain&&i===4?{timingUncertain:true}:{}),confidence:uncertain&&i===4?.44:.99}))};
 const cues=[{id:'c1',source:'auto',text:lines.slice(0,4).join(' '),wordIndexes:[0,1,2,3]},
  {id:'c2',source:'auto',text:lines.slice(4).join(' '),wordIndexes:[4,5,6,7]}];
 const selections=[{captionId:'c1',captionText:cues[0].text,displayWordIndex:3,sourceWordIndex:3},
  {captionId:'c2',captionText:cues[1].text,displayWordIndex:2,sourceWordIndex:6}];
 const review=buildEditorNarrativeMotionReview({transcript:source,sourceSha256,planSourceSha256:sourceSha256,
  jobFingerprint,requestedFingerprint:jobFingerprint,captions:cues,selections});
 assert.equal(review.review.candidates.length,0,'Purely conversational words have no matching semantic template');
 return {editorReview:review,transcript:source,sourceSha256,jobFingerprint,timelineFingerprint,
  sourceTimeMap,editedDuration:10};
}
test('explicit two source words produce ONLY a 4+4 dialogue preflight when semantic matcher has no suggestion',()=>{
 const p=prepareEditorHyperFramesPreflight(realDialogueFixture());
 assert.equal(p.status,'READY_FOR_CREATIVE_REVIEW');
 assert.equal(p.selectionMode,'EXPLICIT_4_PLUS_4_CONTEXT_ONLY');
 assert.deepEqual(p.words.card.map(w=>w.text),['Mañana','tengo','que','hacer']);
 assert.deepEqual(p.words.follow.map(w=>w.text),['Y','otra','voz','responde,']);
 assert.deepEqual(p.words.card.map(w=>w.motionFrame),[8,18,27,30]);
 assert.deepEqual(p.words.follow.map(w=>w.motionFrame),[86,88,94,100]);
 assert.equal(p.canExecute,false);
 assert.equal(p.creativeApproved,false);
 assert.match(p.avMarkdown,/NO IMPORTABLE/);
});
test('ASR low confidence in context blocks stage but returns exact source word IDs for review',()=>{
 const p=prepareEditorHyperFramesPreflight(realDialogueFixture({uncertain:true}));
 assert.equal(p.status,'BLOCKED_FOR_EVIDENCE');
 assert.equal(p.issues[0].code,'UNCERTAIN_SPEECH_TIMES');
 assert.equal(p.selectionMode,'EXPLICIT_4_PLUS_4_CONTEXT_ONLY');
 assert.deepEqual(p.proposedText,['Mañana tengo que hacer','Y otra voz responde,']);
 assert.deepEqual(p.uncertainWordIds,['source-'+sourceSha256.slice(0,16)+'-w4']);
 assert.equal(p.canExecute,false);
});
