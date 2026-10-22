import test from 'node:test';
import assert from 'node:assert/strict';
import {rmSync} from 'node:fs';
import {fixture} from './helpers/editor-fixture.js';
import {loadProject,prepareProject} from '../src/local-pipeline.js';
import {buildPreviewFilter} from '../src/local-preview.js';
import {renderAudioFilters} from '../src/sound-effects.js';
import {externalCatalog,reviewExternalPlan} from '../src/external-edit-plan.js';
import {validateEditorSettings} from '../src/automatic-director.js';

test('safe 1.8dB audio headroom is opt-in, is deterministic and does not alter video or transcript',()=>{
 assert.equal(validateEditorSettings({}).masteringEnabled,false);
 assert.throws(()=>validateEditorSettings({masteringEnabled:'yes'}));
 const f=fixture();
 try{
  const p=loadProject(f.profiles.test),orig=prepareProject(p,{motions:false});
  const safe=prepareProject(p,{motions:false,masteringEnabled:true});
  assert.equal(safe.plan.mastering.gainDb,-1.8);
  assert.equal(safe.plan.source.sha256,orig.plan.source.sha256);
  assert.deepEqual(safe.plan.captions,orig.plan.captions);
  assert.notEqual(safe.fingerprint,orig.fingerprint);
  const graph=buildPreviewFilter(safe.plan);
  assert.match(graph,/\[audio\]volume=-1\.8dB,alimiter=limit=0\.97/);
  assert.match(graph,/\[mixed-audio\]/);
  const voice=prepareProject(p,{voiceEvents:[{preset:'cinematic-echo',start:3,end:5,intensity:.35}],masteringEnabled:true});
  const filters=renderAudioFilters(voice.plan,1).join(';\n');
  assert.match(filters,/\[pre-master-audio\]/);
  assert.match(filters,/\[mixed-audio\]/);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});

test('Gemini can request explicit safe headroom but cannot inject arbitrary FFmpeg filters',()=>{
 const f=fixture();
 try{
  const p=loadProject(f.profiles.test),cat=externalCatalog(p,{});
  assert.equal(cat.actions.mastering.enabled,true);
  const plan=op=>JSON.stringify({schema:'sues-edit-plan/v1',sourceSha256:cat.sourceSha256,operations:[op]});
  assert.equal(reviewExternalPlan(plan({type:'mastering',enabled:true}),{project:p,settings:{}}).changes.masteringEnabled,true);
  assert.equal(reviewExternalPlan(plan({type:'mastering',enabled:true,filter:'volume=30dB'}),{project:p,settings:{}}).canApply,false);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
