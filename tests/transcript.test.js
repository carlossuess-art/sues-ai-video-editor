import test from 'node:test';
import assert from 'node:assert/strict';
import {validateTranscript,mapWordsToTimeline,segmentWords,applySegmentEdits,transcriptToCaptionTexts,withTranscriptCaptions} from '../src/transcript.js';

const transcript=()=>({
  version:'1.0',language:'es',sourceDuration:20,text:'Hola mundo. Esto es una prueba sencilla.',
  words:[
    {text:'Hola',start:0,end:0.4,confidence:.99},
    {text:'mundo.',start:.45,end:1,confidence:.98},
    {text:'Esto',start:1.8,end:2.1,confidence:.97},
    {text:'es',start:2.15,end:2.35,confidence:.97},
    {text:'una',start:2.4,end:2.6,confidence:.96},
    {text:'prueba',start:10.2,end:10.7,confidence:.95},
    {text:'sencilla.',start:10.75,end:11.4,confidence:.95}
  ]
});
const plan=()=>({source:{duration:20},segments:[{in:0,out:5},{in:10,out:20}],texts:[{role:'title',text:'SUES',start:0,length:2}]});

test('transcript contract validates ordering, bounds and confidence',()=>{
 assert.equal(validateTranscript(transcript()),true);
 const t=transcript();t.words[1].start=-1;assert.throws(()=>validateTranscript(t));
 const u=transcript();u.words[1].confidence=2;assert.throws(()=>validateTranscript(u));
});

test('mapping removes cut interval and shifts later words to output timeline',()=>{
 const m=mapWordsToTimeline(transcript(),plan().segments);
 assert.equal(m.duration,15);
 assert.ok(Math.abs(m.words.find(w=>w.text==='prueba').start-5.2)<1e-9);
 assert.ok(!m.words.some(w=>w.sourceStart>=5&&w.sourceStart<10));
});

test('segmentation breaks on punctuation, gaps and limits',()=>{
 const m=mapWordsToTimeline(transcript(),plan().segments);
 const s=segmentWords(m.words,{gapBreak:.5,maxWords:4,maxChars:30,maxDuration:3});
 assert.equal(s[0].text,'Hola mundo.');
 assert.ok(s.length>=3);
 assert.ok(s.every(x=>x.end>x.start));
});

test('manual edits change text/timing or delete a segment',()=>{
 const base=[{id:'seg-001',text:'Hola',start:0,end:1,source:'auto'},{id:'seg-002',text:'Adiós',start:1,end:2,source:'auto'}];
 const out=applySegmentEdits(base,[{id:'seg-001',text:'Hola Carlos',end:1.2},{id:'seg-002',delete:true}]);
 assert.equal(out.length,1);assert.equal(out[0].text,'Hola Carlos');assert.equal(out[0].source,'manual');
});

test('caption compiler produces editable plan texts on output timeline',()=>{
 const r=transcriptToCaptionTexts(transcript(),plan());
 assert.ok(r.captions.length>=2);assert.ok(r.captions.every(c=>c.role==='caption'&&c.start+c.length<=15+1e-6));
 const merged=withTranscriptCaptions(plan(),transcript());
 assert.equal(merged.plan.texts.filter(t=>t.role==='title').length,1);
 assert.equal(merged.plan.texts.filter(t=>t.role==='caption').length,r.captions.length);
});

test('transcript must match plan source duration',()=>{
 const p=plan();p.source.duration=19;assert.throws(()=>transcriptToCaptionTexts(transcript(),p));
});
