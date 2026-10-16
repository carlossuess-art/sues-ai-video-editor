import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeOpenAIWhisperVerbose} from '../src/asr.js';
import {mapWordsToTimeline,segmentWords,validateTranscript} from '../src/transcript.js';
import {buildEdit,defaultPlan} from '../src/plan.js';

test('real provider point timestamps survive normalization without invented word duration',()=>{
 const t=normalizeOpenAIWhisperVerbose({language:'spanish',duration:20,text:'Un mundo.',words:[{word:'Un',start:1,end:2},{word:'mundo',start:2,end:2}]});
 assert.equal(t.language,'es');assert.equal(t.words[1].text,'mundo.');
 assert.equal(t.words[1].start,2);assert.equal(t.words[1].end,2);assert.equal(t.words[1].timingUncertain,true);
 const m=mapWordsToTimeline(t,[{in:0,out:20}]);
 assert.equal(m.words.length,2);assert.equal(segmentWords(m.words)[0].text,'Un mundo.');
 const bad=structuredClone(t);delete bad.words[1].timingUncertain;assert.throws(()=>validateTranscript(bad));
});

test('punctuation restoration cannot substitute reference words',()=>{
 const t=normalizeOpenAIWhisperVerbose({duration:5,text:'Otra frase.',words:[{word:'Hola',start:1,end:2},{word:'mundo',start:2,end:3}]});
 assert.deepEqual(t.words.map(w=>w.text),['Hola','mundo']);
});

test('captions split at edit boundaries and point words inside cut are omitted',()=>{
 const t=normalizeOpenAIWhisperVerbose({duration:20,words:[{word:'antes',start:11.5,end:11.9},{word:'corte',start:12.5,end:12.5},{word:'después',start:13.1,end:13.4}]});
 const m=mapWordsToTimeline(t,[{in:0,out:12},{in:13,out:20}]);
 assert.deepEqual(m.words.map(w=>w.text),['antes','después']);
 assert.equal(segmentWords(m.words).length,2);
 assert.ok(Math.abs(m.words[1].start-12.1)<1e-6);
});

test('outro and caption text boxes do not overlap vertically',()=>{
 const p=defaultPlan('https://example.com/video.mp4',38.31);
 p.texts.push({role:'caption',text:'Última frase',start:35,length:2});
 const edit=buildEdit(p);const outro=edit.timeline.tracks[1].clips[0],caption=edit.timeline.tracks[2].clips[0];
 const cy=c=>960-c.offset.y*1920;
 assert.ok(cy(caption)+caption.height/2 < cy(outro)-outro.height/2);
});
