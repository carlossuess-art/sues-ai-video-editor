import test from 'node:test';
import assert from 'node:assert/strict';
import {montageMap,montageToOutput,outputToMontage,projectInterval,applyMontageFilters} from '../src/montage-cuts.js';
import {validateEditorSettings} from '../src/automatic-director.js';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,rmSync,mkdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fixture} from './helpers/editor-fixture.js';
import {loadProject,prepareProject,writePreparedBundle,fileSha256,RENDER_SCRIPT} from '../src/local-pipeline.js';
test('montage cuts project all overlapping layers and exact join boundaries without touching their canonical clocks',()=>{
 const map=montageMap(12,[{start:2,end:4},{start:6,end:7}],[1,5,8]);
 assert.equal(map.duration,9);assert.equal(montageToOutput(map,7),4);assert.equal(outputToMontage(map,4),7);
 assert.deepEqual(projectInterval(map,1,8).map(s=>[s.start,s.end]),[[1,2],[2,4],[4,5]]);
 for(let t=0;t<9;t+=1/30)assert.ok(Math.abs(montageToOutput(map,outputToMontage(map,t))-t)<1e-7);
 for(const bad of [[{start:2,end:4},{start:3,end:5}],[{start:-1,end:1}],[{start:0,end:12}],[{start:0,end:11.8}]])assert.throws(()=>montageMap(12,bad));
 assert.throws(()=>montageMap(12,[],[2,2]));assert.throws(()=>montageMap(12,[],[NaN]));assert.throws(()=>montageMap(12,[{start:2,end:3,other:true}]));
 assert.deepEqual(validateEditorSettings({montageCuts:[],montageSplits:[2]}).montageSplits,[2]);
});
test('separated and combined passes cut after the complete picture and mixed audio, never flatten editable layers',()=>{
 const postEdit=montageMap(10,[{start:2,end:4}]);
 const graph=applyMontageFilters('[0:v]null[video];\n[0:a]anull[mixed-audio]',{postEdit});
 assert.match(graph,/montage-full-video/);assert.match(graph,/setpts=N\/\(30\*TB\)/);assert.match(graph,/atrim=start=4:end=10/);
 assert.equal(applyMontageFilters('unchanged',{}),'unchanged');
});
test('real montage render and output-clock fragment keep voice and captions aligned across deletion, source unchanged',()=>{
 const f=fixture();
 try{
  const source=join(f.dir,'source.mp4');rmSync(source);
  execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','testsrc2=size=108x192:rate=30:duration=12','-f','lavfi','-i','sine=frequency=440:sample_rate=48000:duration=6','-f','lavfi','-i','sine=frequency=880:sample_rate=48000:duration=6','-filter_complex','[1:a][2:a]concat=n=2:v=0:a=1[a]','-map','0:v','-map','[a]','-c:v','libx264','-threads','1','-preset','ultrafast','-c:a','aac','-shortest',source]);
  const config=JSON.parse(readFileSync(f.profiles.test));config.source={duration:12,width:108,height:192};config.fontDirectory=resolve('assets/fonts');writeFileSync(f.profiles.test,JSON.stringify(config));
  for(const [file,value]of [['camera.json',{mode:'full-frame-fit',keyframes:[0,12].map(time=>({time,x:0,y:0,width:108,height:192,zoom:1}))}],['vision.json',{frames:[0,12].map(time=>({time,frameWidth:108,frameHeight:192,faces:[]}))}]])writeFileSync(join(f.dir,file),JSON.stringify(value));
  const transcript=JSON.parse(readFileSync(join(f.dir,'transcript.json')));transcript.sourceDuration=12;writeFileSync(join(f.dir,'transcript.json'),JSON.stringify(transcript));
  const project=loadProject(f.profiles.test),settings={motions:false,profileImages:false,musicEnabled:false,voiceGain:1},original=fileSha256(source);
  const baseline=prepareProject(project,settings),cut=prepareProject(project,{...settings,montageCuts:[{start:4,end:7}],montageSplits:[4,7]});
  assert.deepEqual(cut.plan.captions,baseline.plan.captions);assert.deepEqual(cut.plan.timeMap,baseline.plan.timeMap);assert.equal(cut.plan.outputDuration,9);assert.equal(cut.plan.duration,12);
  for(const [name,p]of [['base',baseline],['cut',cut]]){const bundle=join(f.dir,name);writePreparedBundle(project,p,bundle);execFileSync('python3',[RENDER_SCRIPT,'--source',source,'--bundle',bundle,'--out',join(f.dir,name+'.mp4')],{stdio:'pipe',timeout:180000});}
  const frame=(name,t)=>execFileSync('ffmpeg',['-v','error','-ss',String(t),'-i',join(f.dir,name+'.mp4'),'-frames:v','1','-vf','scale=108:192','-f','rawvideo','-pix_fmt','rgb24','-']);
  for(const [a,b]of [[1.2,1.2],[4.2,7.2],[6.1,9.1]]){const x=frame('cut',a),y=frame('base',b);assert.equal(x.length,y.length);let error=0;for(let i=0;i<x.length;i++)error+=Math.abs(x[i]-y[i]);assert.ok(error/x.length<3,'Picture/caption phase changed across cut: '+a+' '+error/x.length);}
  const pcm=execFileSync('ffmpeg',['-v','error','-ss','4.2','-i',join(f.dir,'cut.mp4'),'-t','0.5','-map','0:a:0','-ac','1','-ar','48000','-f','f32le','-']);const samples=new Float32Array(pcm.buffer.slice(pcm.byteOffset,pcm.byteOffset+pcm.byteLength));
  const power=f=>{let x=0,y=0;for(let i=0;i<samples.length;i++){x+=samples[i]*Math.cos(2*Math.PI*f*i/48000);y+=samples[i]*Math.sin(2*Math.PI*f*i/48000);}return Math.hypot(x,y);};assert.ok(power(880)>power(440)*10);
  execFileSync('python3',[RENDER_SCRIPT,'--source',source,'--bundle',join(f.dir,'cut'),'--out',join(f.dir,'fragment.mp4'),'--preview-start','3','--preview-duration','3'],{stdio:'pipe',timeout:180000});
  const audit=JSON.parse(readFileSync(join(f.dir,'fragment.audit.json')));assert.equal(audit.durationPlanned,3);assert.equal(audit.fullDecode,'pass');assert.equal(fileSha256(source),original);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
