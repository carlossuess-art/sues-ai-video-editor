import test from 'node:test';
import assert from 'node:assert/strict';
import {buildEditorNarrativeMotionReview} from '../src/motion-templates/editor-motion-bridge.js';
const sourceSha256='a'.repeat(64);
const text=['¿Y','si','te','escucharas?','Haz','espacio','para','escucharte.'];
const transcript={version:'1.0',language:'es',sourceDuration:8,words:text.map((w,i)=>({text:w,start:i*.5,end:i*.5+.3}))};
const captions=[
 {id:'seg-001',start:0,end:1.8,text:'¿Y si te escucharas?',wordIndexes:[0,1,2,3],source:'auto'},
 {id:'seg-002',start:2,end:4,text:'Haz espacio para escucharte.',wordIndexes:[4,5,6,7],source:'auto'}
];
const args={transcript,sourceSha256,planSourceSha256:sourceSha256,jobFingerprint:'rev-active',requestedFingerprint:'rev-active',captions,
 selections:[{captionId:'seg-001',displayWordIndex:3,sourceWordIndex:3,captionText:captions[0].text},
  {captionId:'seg-002',displayWordIndex:1,sourceWordIndex:5,captionText:captions[1].text}]};
test('uses real source index from the existing caption selector, not an invented timestamp',()=>{
 const out=buildEditorNarrativeMotionReview(args);
 assert.equal(out.readOnly,true);
 assert.equal(out.nativeImportable,false);
 assert.equal(out.review.candidates.length,2);
 assert.deepEqual(out.selectedSourceWordIndexes,[3,5]);
 assert.equal(out.review.candidates[0].sourceSpeech.anchorWordId,'source-'+sourceSha256.slice(0,16)+'-w3');
 assert.ok(out.avMarkdown.includes('A-roll / cámara'));
});
test('requires selected existing caption and matching source text',()=>{
 assert.throws(()=>buildEditorNarrativeMotionReview({...args,selections:[{...args.selections[0],sourceWordIndex:2}]}),/mapping changed/);
 assert.throws(()=>buildEditorNarrativeMotionReview({...args,selections:[{...args.selections[0],captionText:'Alterado'}]}),/Unsaved caption/);
 assert.throws(()=>buildEditorNarrativeMotionReview({...args,captions:[{...captions[0],text:'¿Y nunca te escucharas?'},captions[1]],selections:[{...args.selections[0],captionText:'¿Y nunca te escucharas?',displayWordIndex:1,sourceWordIndex:1}]}),/Caption word context changed/);
});
test('blocks stale project/source identity and uncertain timing',()=>{
 assert.throws(()=>buildEditorNarrativeMotionReview({...args,requestedFingerprint:'old'}),/revision changed/);
 assert.throws(()=>buildEditorNarrativeMotionReview({...args,planSourceSha256:'b'.repeat(64)}),/Source identity/);
 const words=transcript.words.map((w,i)=>i===3?{...w,timingUncertain:true}:w);
 assert.throws(()=>buildEditorNarrativeMotionReview({...args,transcript:{...transcript,words}}),/Uncertain timing/);
});
test('no keyword selection does not propose an automatic edit',()=>{
 const out=buildEditorNarrativeMotionReview({...args,selections:[]});
 assert.equal(out.review.candidates.length,0);
 assert.equal(out.review.status,'NO_SEMANTIC_MOTION_MATCH');
});
test('manual rewritten captions and duplicates fail closed',()=>{
 assert.throws(()=>buildEditorNarrativeMotionReview({...args,captions:[{...captions[0],source:'manual'},captions[1]]}),/manually rewritten/);
 assert.throws(()=>buildEditorNarrativeMotionReview({...args,selections:[args.selections[0],args.selections[0]]}),/Duplicate source word/);
});
