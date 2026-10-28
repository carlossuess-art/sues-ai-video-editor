import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/editor-fixture.js';
import {loadProject,prepareProject} from '../src/local-pipeline.js';
import {proposedSourceReview,normalizeSourceCuts,keptSegments} from '../src/source-cuts.js';
import {validateEditorSettings} from '../src/automatic-director.js';
import {rmSync} from 'node:fs';

const sample={version:'1.0',language:'es',sourceDuration:10,words:[
 {text:'Hola',start:.3,end:.75},{text:'tenemos',start:.8,end:1.25},
 {text:'un',start:2.2,end:2.5},{text:'vídeo',start:2.6,end:2.95},
 {text:'de',start:3.1,end:3.3},{text:'prueba',start:3.35,end:3.9},
 {text:'y',start:5.5,end:5.8},{text:'terminamos',start:5.9,end:6.6},
]};

test('proposal preserves half-second audible pauses and never auto-deletes',()=>{
 const p=proposedSourceReview(sample);
 assert.equal(p.automaticDeletion,false);
 assert.equal(p.requiresConfirmation,true);
 assert.ok(p.silences.length>=2);
 assert.ok(p.silences.every(s=>!s.selected));
 for(const s of p.silences){
  const adjacent=sample.words.findIndex(w=>w.start>=s.end-.001);
  if(adjacent>0){const before=sample.words[adjacent-1];const after=sample.words[adjacent];
   const retained=(s.start-before.end)+(after.start-s.end);
   assert.ok(retained>=.5-1e-6,`${retained} secs retained`);
  }
 }
});
test('source cuts boundaries are frame aligned and validated non-destructively',()=>{
 const result=normalizeSourceCuts(sample,[{start:1.1,end:1.5}],{preserveSpeech:false});
 assert.ok(Math.abs(result[0].start*30-Math.round(result[0].start*30))<1e-6);
 assert.throws(()=>normalizeSourceCuts(sample,[{start:1.1,end:1.5}]),/invade una palabra/);
 assert.throws(()=>normalizeSourceCuts(sample,[{start:0,end:10}],{preserveSpeech:false}),/vídeo entero/);
 assert.ok(keptSegments(10,result).length===2);
});
test('source cuts enter the plan and shorten the video without changing the source',()=>{
 const f=fixture();
 try{
  const p=loadProject(f.profiles.test),baseline=prepareProject(p);
  const original=p.inputs.source.duration;
  const words=p.inputs.transcript.words;
  let pause=null;
  for(let i=1;i<words.length;i++)if(words[i].start-words[i-1].end>=.25){
   const a=Math.ceil((words[i-1].end+.03)*30)/30,b=Math.floor((words[i].start-.03)*30)/30;
   if(b-a>=1/30){pause={start:a,end:b};break;}
  }
  if(!pause){pause={start:Math.round((original-.4)*30)/30,end:Math.round((original-.2)*30)/30};}
  const changed=prepareProject(p,{sourceCuts:[pause]});
  assert.equal(changed.plan.timeMap.spans.length,2);
  assert.ok(changed.plan.duration<baseline.plan.duration);
  assert.equal(changed.plan.source.sha256,baseline.plan.source.sha256);
  assert.equal(changed.director.audit.cutsRemoved,1);
  assert.deepEqual(changed.settings.sourceCuts,[pause]);
  assert.notEqual(changed.fingerprint,baseline.fingerprint);
  assert.equal(prepareProject(p,{sourceCuts:[]}).plan.duration,baseline.plan.duration);
  const dopamine=prepareProject(p,{styleId:'SUES_DOPAMIN',sourceCuts:[pause]});
  assert.equal(dopamine.plan.timeMap.spans.length,2);
  assert.equal(dopamine.plan.duration,changed.plan.duration);
  assert.equal(dopamine.settings.styleId,'SUES_DOPAMIN');
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('repeated spoken phrases are optional review suggestions',()=>{
 const words=['hola','quiero','contarte','una','cosa','quiero','contarte','una','cosa','hoy'];
 const t={version:'1.0',language:'es',sourceDuration:12,words:words.map((text,i)=>({text,start:i*.7,end:i*.7+.35}))};
 const p=proposedSourceReview(t);
 assert.ok(p.spoken.some(x=>x.reason.includes('repetida')));
 assert.ok(p.spoken.every(x=>x.selected===false));
});
test('sourceCuts setting validates structures',()=>{
 assert.throws(()=>validateEditorSettings({sourceCuts:[{start:2,end:1}]}),/sourceCuts/);
 assert.throws(()=>validateEditorSettings({sourceCuts:[{start:1,end:2,token:'x'}]}),/sourceCuts/);
});

test('a tail cut may end at a fractional source duration without overshooting',()=>{
 const t={...sample,sourceDuration:10.891};
 const cuts=normalizeSourceCuts(t,[{start:8,end:t.sourceDuration}],{preserveSpeech:false});
 assert.equal(cuts[0].end,t.sourceDuration);assert.equal(keptSegments(t.sourceDuration,cuts).at(-1).out,8);
 assert.throws(()=>normalizeSourceCuts(t,[{start:8,end:10.9}],{preserveSpeech:false}),/Corte/);
});
