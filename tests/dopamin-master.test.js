import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {rmSync} from 'node:fs';
import {fixture} from './helpers/editor-fixture.js';
import {loadProject,prepareProject} from '../src/local-pipeline.js';
import {applyDopaminMaster,finishDopaminAudio,musicAccentFilter,selectAutomaticPreviewBrolls} from '../src/dopamin-master.js';
import {prepareDepthText} from '../src/depth-text.js';

test('CALMA remains byte-for-byte unmodified by DOPAMIN composition',()=>{
 const f=fixture();try{const p=prepareProject(loadProject(f.profiles.test),{zoomIntensity:0}).plan,before=JSON.stringify(p);
 assert.equal(applyDopaminMaster(p,{styleId:'SUES_CALMA',autoRecipe:true,motions:true}),null);assert.equal(JSON.stringify(p),before);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('spoken reveal drives visible graphics, differentiated captions and coordinated sound',()=>{
 const f=fixture();try{
 const p=prepareProject(loadProject(f.profiles.test),{zoomIntensity:0}).plan;
 p.duration=20;p.graphics=[];p.selectedMedia=[];p.globalTransitions=[];p.policy.outro.duration=2;
 p.captions=[{id:'seg-001',start:3,end:4.5,text:'totalmente gratuita',wordIndexes:[0,1],source:'manual'}];
 const options={styleId:'SUES_DOPAMIN',autoRecipe:true,motions:true,keywordOverrides:{}};
 applyDopaminMaster(p,options);assert.equal(p.masterGraphics[0].label,'SIN COSTE');assert.equal(p.captions[0].keyword.displayWordIndex,1);assert.ok(p.captions[0].keyword.scale>=1.6);
 p.soundEffects={enabled:true,gain:.3,events:[]};p.audioMix={};finishDopaminAudio(p,options);
 assert.ok(p.soundEffects.events.some(e=>e.preset==='impact'));assert.equal(p.audioMix.accents.length,1);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('manual keyword and full-frame B-roll take precedence over automatic decoration',()=>{
 const f=fixture();try{
 const p=prepareProject(loadProject(f.profiles.test),{zoomIntensity:0}).plan;p.duration=20;p.policy.outro.duration=2;p.graphics=[];p.selectedMedia=[{start:2,end:5}];p.globalTransitions=[];
 p.captions=[{id:'seg-001',start:3,end:4.5,text:'totalmente gratuita',wordIndexes:[0,1],keyword:null}];
 applyDopaminMaster(p,{styleId:'SUES_DOPAMIN',autoRecipe:true,motions:true,keywordOverrides:{'seg-001':{level:'none'}}});
 assert.equal(p.captions[0].keyword,null);assert.equal(p.masterGraphics.length,0);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('music pauses affect decoded audio, preserving the audible surrounding bed',()=>{
 const filter=musicAccentFilter([{start:.9,end:1.2}]);
 const data=execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','sine=frequency=440:sample_rate=48000:duration=2','-af',filter.slice(0,-1),'-f','f32le','-'],{maxBuffer:1000000});
 const rms=(a,b)=>{let s=0,n=0;for(let k=Math.floor(a*48000);k<Math.floor(b*48000);k++){const x=data.readFloatLE(k*4);s+=x*x;n++;}return Math.sqrt(s/n);};
 assert.ok(rms(.3,.5)>.05);assert.equal(rms(1,1.1),0);assert.ok(rms(1.5,1.7)>.05);
 assert.throws(()=>musicAccentFilter([{start:0,end:3}]),/Invalid/);
});
test('output-space rotoscope binds the exact static camera and rejects a changed crop',()=>{
 const f=fixture();try{
 const p=prepareProject(loadProject(f.profiles.test),{zoomIntensity:0}).plan;
 p.source.width=1072;p.camera.keyframes=p.camera.keyframes.map(k=>({...k,width:1072}));p.semantic.zooms=[];p.graphics=[];
 const points=Array.from({length:32},(_,i)=>[540+170*Math.cos(i*Math.PI/16),450+170*Math.sin(i*Math.PI/16)]);
 const d={version:'1.0',sourceSha256:p.source.sha256,coordinateSpace:'output-1080x1920',cameraKeyframes:structuredClone(p.camera.keyframes),events:[{text:'DEPTH',start:.25,end:1.25,x:510,y:450,size:160,color:'#FFFFFF',mask:{method:'manual-rotoscope',scope:'head-and-neck',reviewedRegion:{top:200,bottom:700},keyframes:[{time:.25,points},{time:1.25,points}]}}]};
 assert.equal(prepareDepthText(d,p).length,1);p.camera.keyframes[0].x=2;assert.throws(()=>prepareDepthText(d,p),/static camera/);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});

test('automatic preview rejects unreviewed lexical stock and branded or temporally invalid scenes',()=>{
 const safe={assetId:'a'.repeat(64),kind:'video',evidence:{type:'narrative-plus-human-sampled-scene',visualSample:{sampleCount:4,riskFlags:[]},temporalReview:{complete:true},suggestedSourceRange:{source:'full-timeline-cut-black-analysis',startSec:1,endSec:4}}};
 const cue={decision:'contextual-review-only',narrative:{intent:'growth',label:'Crecimiento'},start:5,end:8,candidates:[safe]};
 const proposal={schema:'sues-director-library-cues/v1',cues:[cue]};
 assert.equal(selectAutomaticPreviewBrolls(proposal,{},20).length,1);
 assert.equal(selectAutomaticPreviewBrolls({...proposal,cues:[{...cue,decision:'suggestion-only'}]}, {},20).length,0);
 const branded=structuredClone(proposal);branded.cues[0].candidates[0].evidence.visualSample.riskFlags=['visible-third-party-marking'];assert.equal(selectAutomaticPreviewBrolls(branded,{},20).length,0);
 assert.equal(selectAutomaticPreviewBrolls(proposal,{zoomEvents:[{start:6,end:9}]},20).length,0);
 const short=structuredClone(proposal);short.cues[0].candidates[0].evidence.suggestedSourceRange.endSec=2;assert.equal(selectAutomaticPreviewBrolls(short,{},20).length,0);
});


test('reviewed depth text owns its matching concept without a duplicate foreground label',()=>{
 const f=fixture();try{
  const p=prepareProject(loadProject(f.profiles.test),{zoomIntensity:0}).plan;
  p.duration=20;p.graphics=[];p.selectedMedia=[];p.globalTransitions=[];p.policy.outro.duration=2;
  p.captions=[{id:'seg-001',start:3,end:4.5,text:'volveremos',wordIndexes:[0]}];
  applyDopaminMaster(p,{styleId:'SUES_DOPAMIN',autoRecipe:true,motions:true,keywordOverrides:{},reviewedDepthText:{events:[{text:'VOLVEMOS',start:3,end:5}]}});
  assert.equal(p.masterGraphics.length,0);assert.ok(p.captions[0].keyword);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('fear and blockage keep their actual spoken meaning rather than becoming ego',()=>{
 const f=fixture();try{
  for(const [text,label] of [['miedo','MIEDO'],['bloqueo','BLOQUEO'],['ego','EGO']]){
   const p=prepareProject(loadProject(f.profiles.test),{zoomIntensity:0}).plan;
   p.duration=20;p.graphics=[];p.selectedMedia=[];p.globalTransitions=[];p.policy.outro.duration=2;
   p.captions=[{id:'seg-001',start:3,end:4.5,text,wordIndexes:[0]}];
   applyDopaminMaster(p,{styleId:'SUES_DOPAMIN',autoRecipe:true,motions:true,keywordOverrides:{}});
   assert.equal(p.masterGraphics[0].label,label);
  }
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});

test('attention in the plural keeps its graphic on a different source transcript',()=>{
 const f=fixture();try{
  const p=prepareProject(loadProject(f.profiles.test),{zoomIntensity:0}).plan;
  p.duration=13.4;p.graphics=[];p.selectedMedia=[];p.globalTransitions=[];p.policy.outro.duration=2;
  p.captions=[{id:'seg-001',start:3.08,end:3.54,text:'atentos,',wordIndexes:[0]}];
  applyDopaminMaster(p,{styleId:'SUES_DOPAMIN',autoRecipe:true,motions:true,keywordOverrides:{}});
  assert.equal(p.masterGraphics[0].label,'PRESENTE');
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
