import test from 'node:test';
import assert from 'node:assert/strict';
import {rmSync} from 'node:fs';
import {fixture} from './helpers/editor-fixture.js';
import {VOICE_PRESETS,validateVoiceEvents,prepareVoiceEffects,voiceEffectsFilter} from '../src/voice-effects.js';
import {prepareProject,loadProject} from '../src/local-pipeline.js';
import {buildPreviewFilter} from '../src/local-preview.js';
import {externalCatalog,reviewExternalPlan} from '../src/external-edit-plan.js';
import {renderAudioFilters} from '../src/sound-effects.js';

const e=(preset='cinematic-echo',more={})=>({preset,start:3,end:5,intensity:.35,...more});
test('only two controlled cinematic voice presets exist; invalid events fail safely',()=>{
 assert.deepEqual(Object.keys(VOICE_PRESETS),['cinematic-echo','vintage-tv']);
 assert.equal(validateVoiceEvents([e()]).length,1);
 for(const events of [
  [e('unknown')], [e('vintage-tv',{intensity:1})],[e('vintage-tv',{intensity:0})],
  [e('vintage-tv',{start:-1})],[e('vintage-tv',{start:1,end:1.4})],
  [e('vintage-tv',{start:0,end:8})],[e('vintage-tv',{debug:'secret'})],
  [e(),e('vintage-tv',{start:5,end:7})],Array.from({length:5},(_,i)=>e('cinematic-echo',{start:2+i*7,end:4+i*7}))]
 )assert.throws(()=>validateVoiceEvents(events));
 assert.throws(()=>prepareVoiceEffects([e()],4));
 assert.throws(()=>prepareVoiceEffects([e('vintage-tv',{start:0,end:2})],10));
});

test('voice processing filter is local deterministic, bounded and does not need third-party files',()=>{
 const config=prepareVoiceEffects([e(),e('vintage-tv',{start:6,end:8.4,intensity:.5})],12);
 assert.equal(config.originalVoice,true);
 assert.equal(config.stockFiles,0);
 const audio=voiceEffectsFilter(config,12).join(';\n');
 assert.match(audio,/aecho=0.8:0.6/);
 assert.match(audio,/acrusher=bits=10/);
 assert.match(audio,/anoisesrc=color=pink/);
 assert.match(audio,/seed=511/);
 assert.match(audio,/alimiter=limit=0.93/);
 assert.match(audio,/\[voice-styled\]/);
 assert.doesNotMatch(audio,/https?:|\/etc\/|filename=/);
 assert.deepEqual(voiceEffectsFilter(prepareVoiceEffects([],12),12),[]);
 const mix=renderAudioFilters({duration:12,voiceEffects:config,audioMix:null,
    soundEffects:{events:[]},customSfx:{events:[]}},1);
 assert.match(mix.at(-1),/\[voice-styled\]anull\[mixed-audio\]/);
});

test('two localized voice effects preserve original source, captions and editable timing',()=>{
 const f=fixture();
 try{
  const project=loadProject(f.profiles.test);
  const orig=prepareProject(project,{sfxEnabled:false,motions:false});
  const adjusted=prepareProject(project,{sfxEnabled:false,motions:false,
    voiceEvents:[e(),e('vintage-tv',{start:7,end:9,intensity:.5})]});
  assert.equal(adjusted.plan.source.sha256,orig.plan.source.sha256);
  assert.deepEqual(adjusted.plan.captions,orig.plan.captions);
  assert.equal(adjusted.plan.duration,orig.plan.duration);
  assert.equal(adjusted.plan.voiceEffects.events.length,2);
  assert.equal(adjusted.plan.voiceEffects.humanListeningAccepted,false);
  const filter=buildPreviewFilter(adjusted.plan);
  assert.match(filter,/\[audio\].*asplit=3\[voice-dry-base\]/);
  assert.match(filter,/\[mixed-audio\]/);
  assert.notEqual(adjusted.fingerprint,orig.fingerprint);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});

test('Gemini accepts safe voice timing and rejects unsupported presets and oversized intensity',()=>{
 const f=fixture();
 try{
  const project=loadProject(f.profiles.test),catalog=externalCatalog(project,{});
  assert.equal(catalog.actions.voice.preset,'cinematic-echo');
  const plan=operations=>JSON.stringify({schema:'sues-edit-plan/v1',sourceSha256:catalog.sourceSha256,operations});
  const valid=reviewExternalPlan(plan([{type:'voice',preset:'vintage-tv',start:7,end:9,intensity:.4}]),{project,settings:{}});
  assert.equal(valid.canApply,true,JSON.stringify(valid.notes));
  assert.equal(valid.changes.voiceEvents.length,1);
  for(const invalid of [
   [{type:'voice',preset:'loudspeaker',start:7,end:9,intensity:.4}],
   [{type:'voice',preset:'vintage-tv',start:7,end:9,intensity:1}],
   [{type:'voice',preset:'vintage-tv',start:7,end:9,intensity:.4,filter:'volume=200'}],
   [{type:'voice',preset:'vintage-tv',start:7,end:9,intensity:.4},
    {type:'voice',preset:'cinematic-echo',start:8,end:10,intensity:.4}],
  ])assert.equal(reviewExternalPlan(plan(invalid),{project,settings:{}}).canApply,false);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
