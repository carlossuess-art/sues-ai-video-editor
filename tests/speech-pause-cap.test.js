import test from 'node:test';
import assert from 'node:assert/strict';
import {capSpeechPauses,MAX_SPEECH_PAUSE_SECONDS,mapSourceTimeAfterPauseCuts} from '../src/speech-pause-cap.js';
import {proposeSilenceCuts,normalizeSourceCuts,keptSegments} from '../src/source-cuts.js';
const transcript=(pairs,duration=13)=>({version:'1.0',language:'es',sourceDuration:duration,words:pairs.map(([start,end,text])=>({start,end,text}))});
test('0.7 is the exact shared ceiling and pause cuts preserve words and intro/outro',()=>{
 const t=transcript([[1,1.4,'Hola'],[2.94,3.2,'amigo'],[3.6,3.9,'estoy'],[4.62,5,'aquí'],[8,8.25,'bien']],10);
 const result=capSpeechPauses(t);
 assert.equal(MAX_SPEECH_PAUSE_SECONDS,.7);
 assert.equal(result.cuts.length,3);
 assert.equal(result.warnings.length,0);
 for(const [i,detail] of result.details.entries()){
  assert.ok(detail.keptGapSeconds<=.7+1e-6);
  const cut=result.cuts[i],before=t.words[detail.wordIndex-1],after=t.words[detail.wordIndex];
  assert.ok(cut.start>before.end&&cut.end<after.start);
  assert.ok(Math.abs(cut.start*30-Math.round(cut.start*30))<1e-4);
  assert.ok(Math.abs(cut.end*30-Math.round(cut.end*30))<1e-4);
 }
 assert.equal(keptSegments(t.sourceDuration,result.cuts)[0].in,0);
 assert.equal(keptSegments(t.sourceDuration,result.cuts).at(-1).out,10);
 const normalized=normalizeSourceCuts(t,result.cuts);
 assert.equal(normalized.length,result.cuts.length);
 normalized.forEach((cut,i)=>assert.ok(Math.abs(cut.start-result.cuts[i].start)<1e-5&&Math.abs(cut.end-result.cuts[i].end)<1e-5));
});
test('sub-0.7 gaps untouched, 0.72 gets a single-frame cut',()=>{
 const t=transcript([[0,.4,'uno'],[1.12,1.5,'dos'],[2.1,2.5,'tres']],4);
 const p=capSpeechPauses(t);
 assert.equal(p.cuts.length,1);assert.equal(p.details[0].cutFrames,1);
 assert.ok(p.details[0].keptGapSeconds<=.7);
});
test('cap mapping moves graphics captions and audio together',()=>{
 const t=transcript([[1,1.4,'uno'],[2.94,3.2,'dos']],5);
 const p=capSpeechPauses(t);const seconds=p.removedSeconds;
 assert.equal(mapSourceTimeAfterPauseCuts(.7,p.cuts),.7);
 assert.ok(Math.abs(mapSourceTimeAfterPauseCuts(2.94,p.cuts)-(2.94-seconds))<1e-4);
 assert.ok(Math.abs(p.outputDuration-(5-seconds))<1e-4);
});
test('uncertain timing warns and avoids risky automatic cuts',()=>{
 const t=transcript([[1,1.4,'voz'],[3.7,4,'incierto']],5);
 t.words[1].timingUncertain=true;
 const p=capSpeechPauses(t);
 assert.equal(p.cuts.length,0);assert.equal(p.warnings.length,1);
});
test('existing editor suggestions use 0.7 instead of previous half-second',()=>{
 const t=transcript([[1,1.4,'Hola'],[3,3.5,'ahora']],5);
 const proposal=proposeSilenceCuts(t);
 const cap=capSpeechPauses(t);
 assert.deepEqual(proposal.proposals,cap.cuts);
 assert.equal(proposal.enabled,false);
});
test('bad timeline is rejected; source cut cap does not touch spoken words',()=>{
 const t=transcript([[1,1.4,'Hola'],[3,3.5,'ahora']],5);
 assert.throws(()=>capSpeechPauses({...t,words:[t.words[1],t.words[0]]}),/timed/);
 const p=capSpeechPauses(t);
 assert.ok(p.cuts.every(c=>t.words.every(w=>c.end<=w.start||c.start>=w.end)));
});
