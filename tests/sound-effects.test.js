import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {rmSync} from 'node:fs';
import {prepareSoundEffects,renderAudioFilters,soundEffectsFilter} from '../src/sound-effects.js';
import {backgroundAudioFilter} from '../src/audio-mix.js';
import {validateEditorSettings} from '../src/automatic-director.js';
import {fixture} from './helpers/editor-fixture.js';
import {loadProject,prepareProject} from '../src/local-pipeline.js';

test('SFX are opt-in, bounded, reproducible and follow graph/arrow/transition timing',()=>{
 const plan={duration:8,graphics:[{type:'compare',start:2,end:5,voiceCues:{left:2.1,right:3.5}}],globalTransitions:[{start:4.8}],semantic:{motions:[]}};
 assert.deepEqual(prepareSoundEffects(plan).events,[]);const active=prepareSoundEffects(plan,{sfxEnabled:true});
 assert.deepEqual(active.events.map(e=>[e.preset,e.start]),[['whoosh',1.94],['draw',2.5],['draw',3.9],['whoosh',4.8]]);assert.deepEqual(active,prepareSoundEffects(plan,{sfxEnabled:true}));
 assert.throws(()=>validateEditorSettings({sfxGain:.71}),/sfx/);assert.throws(()=>validateEditorSettings({sfxEnabled:'true'}),/sfx/);
 assert.throws(()=>soundEffectsFilter({...active,events:[{preset:'not-a-filter',start:0,duration:.1}]},8,'audio'),/event bounds/);
 assert.deepEqual(renderAudioFilters({audioMix:null,soundEffects:prepareSoundEffects(plan)},1),backgroundAudioFilter(null,1));
});
test('SFX settings change the render fingerprint, remain independent of music, and disable with motions',()=>{
 const f=fixture();try{const project=loadProject(f.profiles.test),base=prepareProject(project),id=base.plan.captions[0].id,settings={graphicCards:[{captionId:id,type:'grid'}],musicEnabled:false};
 const off=prepareProject(project,settings),on=prepareProject(project,{...settings,sfxEnabled:true});assert.equal(on.plan.audioMix,null);assert.ok(on.plan.soundEffects.events.length);assert.notEqual(on.fingerprint,off.fingerprint);assert.equal(on.settings.sfxGain,.35);
 assert.deepEqual(prepareProject(project,{...settings,sfxEnabled:true,motions:false}).plan.soundEffects.events,[]);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('real FFmpeg synthesizes all presets, preserves samples outside events, and ducks effects under voice',()=>{
 const make=(source,effects)=>{const graph=`[0:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo[audio];\n`+soundEffectsFilter(effects,3,'audio').join(';\n');const bytes=execFileSync('ffmpeg',['-v','error','-f','lavfi','-i',source,'-filter_complex_threads','1','-filter_complex',graph,'-map','[mixed-audio]','-f','f32le','-acodec','pcm_f32le','-'],{maxBuffer:4e6});return new Float32Array(bytes.buffer,bytes.byteOffset,bytes.byteLength/4);};
 const events=['whoosh','impact','draw','neon'].map((preset,i)=>({preset,start:.5+i*.5,duration:.15})),effects={gain:.35,events};
 const voiced=make('sine=frequency=180:sample_rate=48000:duration=3,volume=3',effects),dry=make('sine=frequency=180:sample_rate=48000:duration=3,volume=3',{gain:0,events}),silent=make('anullsrc=r=48000:cl=stereo:d=3',effects);
 assert.equal(silent.length,voiced.length,'silent length');assert.equal(dry.length,voiced.length,'dry length');assert.ok(silent.every(Number.isFinite),'silent finite');assert.equal(voiced.length,3*48000*2);let outside=0,delta=0,quiet=0;
 for(let i=0;i<voiced.length;i++){assert.ok(Number.isFinite(voiced[i])&&Math.abs(voiced[i])<=.951);const t=i/96000,d=voiced[i]-dry[i];if(!events.some(e=>t>=e.start-.002&&t<e.start+e.duration+.002))outside=Math.max(outside,Math.abs(d));delta+=d*d;quiet+=silent[i]*silent[i];}
 assert.ok(outside<1e-5,`voice changed outside events: ${outside}`);assert.ok(delta>0&&delta<quiet*.8,`effects should duck under speech: energy ratio ${delta/quiet}`);
});
