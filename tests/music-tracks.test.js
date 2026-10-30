import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {validateEditorSettings} from '../src/automatic-director.js';
import {loadProject,prepareProject} from '../src/local-pipeline.js';
import {fixture} from './helpers/editor-fixture.js';
import {buildAudioPassFilter} from '../src/local-preview.js';
const sha='a'.repeat(64);
const keys=[{time:0,value:.8},{time:.5,value:0},{time:1.5,value:0},{time:2,value:.8}];
test('music tracks allow multiple overlapping licensed clips with bounded volume automation',()=>{
 const t={assetId:sha,start:0,end:3,sourceIn:0,gain:.8,keyframes:keys};
 const settings=validateEditorSettings({musicTracks:[t,{...t,start:1,end:3,keyframes:[]}]});
 assert.equal(settings.musicTracks.length,2);
 for(const bad of [{...t,gain:1.01},{...t,keyframes:[{time:3.5,value:0}]},{...t,sourceIn:-1},{...t,assetId:'bad'}])assert.throws(()=>validateEditorSettings({musicTracks:[bad]}));
});
test('actual FFmpeg mixes overlapping music and a keyframed silent window without changing speech duration',()=>{
 const dir=mkdtempSync(join(tmpdir(),'sues-music-'));
 try{
  const plan={timeMap:{spans:[{sourceIn:0,sourceOut:3}]},duration:3,audioMix:null,customSfx:{events:[]},soundEffects:{events:[]},voiceEffects:{events:[]},musicTracks:[{sourceIn:0,duration:3,start:0,end:3,gain:.8,keyframes:keys},{sourceIn:0,duration:1,start:1.5,end:2.5,gain:.3,keyframes:[]}]};
  const graph=buildAudioPassFilter(plan);assert.match(graph,/music-track-1/);assert.match(graph,/volume='if\(lt\(t,0\)/);
  const file=join(dir,'graph.txt');writeFileSync(file,graph);
  const audio=join(dir,'mix.wav');
  execFileSync('ffmpeg',['-v','error','-threads','1','-f','lavfi','-i','anullsrc=r=48000:cl=stereo:d=3','-f','lavfi','-i','sine=frequency=440:sample_rate=48000:duration=3','-f','lavfi','-i','sine=frequency=880:sample_rate=48000:duration=3','-filter_complex_threads','1','-filter_complex_script',file,'-map','[mixed-audio]','-ac','2','-c:a','pcm_s16le','-y',audio],{timeout:30000});
  const duration=JSON.parse(execFileSync('ffprobe',['-v','error','-show_format','-of','json',audio],{encoding:'utf8'})).format.duration;
  assert.ok(Math.abs(duration-3)<.02,'voice/video duration kept');
  const pcm=execFileSync('ffmpeg',['-v','error','-ss','1','-t','0.25','-i',audio,'-f','s16le','-ac','1','-ar','48000','-'],{timeout:30000});
  const silent=Math.sqrt(Array.from({length:pcm.length/2},(_,i)=>pcm.readInt16LE(i*2)**2).reduce((a,b)=>a+b,0)/(pcm.length/2));
  const loud=execFileSync('ffmpeg',['-v','error','-ss','2','-t','0.25','-i',audio,'-f','s16le','-ac','1','-ar','48000','-'],{timeout:30000});
  const rms=Math.sqrt(Array.from({length:loud.length/2},(_,i)=>loud.readInt16LE(i*2)**2).reduce((a,b)=>a+b,0)/(loud.length/2));
  assert.ok(rms>silent*5,'music resumes after keyframed silence');
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('editor settings produce real timed music layers and an audio-only graph, leaving video graph clean',()=>{
 const f=fixture();
 try{
  const p=loadProject(f.profiles.test);p.resolveAsset=(id,kind)=>({assetId:id,sha256:id,rights:'owned',localFile:'/test/only-music.wav',duration:24,kind});
  const layer={assetId:sha,start:4,end:7,sourceIn:2,gain:.8,keyframes:[{time:0,value:.8},{time:1,value:0},{time:2,value:0},{time:3,value:.8}]};
  const result=prepareProject(p,{profileImages:false,musicTracks:[layer]});
  assert.equal(result.plan.musicTracks.length,1);
  assert.equal(result.plan.musicTracks[0].duration,3);
  assert.equal(result.plan.musicTracks[0].localFile,'/test/only-music.wav');
  assert.match(buildAudioPassFilter(result.plan),/adelay=192000S:all=1/);
  assert.throws(()=>prepareProject(p,{musicTracks:[{...layer,sourceIn:23}]}),/más corta/);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
