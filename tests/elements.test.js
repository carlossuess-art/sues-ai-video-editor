import test from 'node:test';
import assert from 'node:assert/strict';
import {rmSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {fixture} from './helpers/editor-fixture.js';
import {loadProject,prepareProject} from '../src/local-pipeline.js';
import {buildPreviewASS,buildPreviewFilter} from '../src/local-preview.js';
import {validateElements,ELEMENT_FORMATS} from '../src/elements.js';
import {createProjectBackup,verifyProjectBackup} from '../src/project-backup.js';
import {EditorJobs} from '../src/editor-jobs.js';
import {visualProfile,applyStyleVariant} from '../src/style-variants.js';
import {editorReview} from '../src/editor-review.js';

const config=(format,captions)=>({format,items:[{captionId:captions[0].id,endCaptionId:captions[1].id,label:'Primera idea',...(['COMPARE','Q&A'].includes(format)?{secondary:'Segunda idea'}:{}),...(format==='RANKING'?{number:5}:{})}]});

test('ELEMENTS six formats combine with both visual profiles without rewriting voice/timestamps',()=>{
 const f=fixture();try{
  const project=loadProject(f.profiles.test),original=structuredClone(project.inputs);
  for(const styleId of ['SUES_CALMA','SUES_DOPAMIN']){
   const base=prepareProject(project,{styleId});
   for(const format of ELEMENT_FORMATS){
    const elements=config(format,base.plan.captions),p=prepareProject(project,{styleId,elements,sfxEnabled:true}),event=p.plan.elements[0];
    assert.deepEqual(p.plan.captions.map(c=>[c.id,c.text,c.start,c.end]),base.plan.captions.map(c=>[c.id,c.text,c.start,c.end]));
    assert.equal(p.director.audit.omittedWords,0);assert.equal(p.plan.originalVoice,true);
    assert.equal(event.start,base.plan.captions[0].start);assert.equal(event.end,base.plan.captions[1].end);
    assert.equal(event.copyOrigin,'explicit-editor-choice');assert.equal(event.timing,'existing-caption-range');
    assert.ok(buildPreviewASS(p.plan).includes('Primera idea'));assert.ok(!buildPreviewASS(p.plan).includes('}'+format+'\n'));assert.ok(buildPreviewFilter(p.plan).includes('concat='));
    assert.ok(p.plan.soundEffects.events.some(e=>e.reason==='elements-entry'));
    assert.ok(editorReview(p.plan,p.director,p.settings).events.some(e=>e.type==='elements-'+format));
   }
  }
  assert.deepEqual(project.inputs,original);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});

test('ELEMENTS validates semantic fields, ranks, time ranges and collisions before rendering',()=>{
 const f=fixture();try{
  const project=loadProject(f.profiles.test),base=prepareProject(project),c=base.plan.captions,valid=config('LIST',c);
  for(const invalid of [{format:'TOP',items:valid.items},{format:'LIST',items:[]},{format:'LIST',items:Array(11).fill(valid.items[0])},{format:'COMPARE',items:valid.items},{format:'RANKING',items:valid.items},{format:'LIST',items:[{...valid.items[0],label:'x\nunsafe'}]},{...valid,items:[...valid.items,...valid.items]}])assert.throws(()=>validateElements(invalid),/ELEMENTS/);
  assert.throws(()=>prepareProject(project,{elements:{...valid,items:[{...valid.items[0],captionId:'seg-999'}]}}),/desconocido/);
  assert.throws(()=>prepareProject(project,{elements:{...valid,items:[{...valid.items[0],endCaptionId:c[0].id},{...valid.items[0],captionId:c[1].id,endCaptionId:c[0].id}]}}),/rango/);
  assert.throws(()=>prepareProject(project,{elements:{...valid,items:[{...valid.items[0],endCaptionId:c[2].id},{...valid.items[0],captionId:c[1].id,endCaptionId:c[2].id}]}}),/solapan/);
  assert.throws(()=>prepareProject(project,{elements:valid,graphicCards:[{captionId:c[0].id,type:'grid'}]}),/otro recurso/);
  const hidden=prepareProject(project,{elements:valid,motions:false,sfxEnabled:true});assert.deepEqual(hidden.plan.elements,[]);assert.equal(hidden.plan.soundEffects.events.length,0);
  const nofx=prepareProject(project,{elements:valid});assert.equal(nofx.plan.soundEffects.events.length,0);
  const duplicateRanks={format:'RANKING',items:[{...valid.items[0],number:2},{captionId:c[2].id,label:'Otra',number:2}]};assert.throws(()=>validateElements(duplicateRanks),/ranking/);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});

test('DOPAMIN inherits CALMA identity/constraints and doubles only candidate budgets',()=>{
 const f=fixture();try{
  const p=loadProject(f.profiles.test),original=structuredClone(p.inputs.template),calma=applyStyleVariant(original,'SUES_CALMA'),dopamin=applyStyleVariant(original,'SUES_DOPAMIN');
  assert.deepEqual(calma,original);for(const key of ['constraints','motion','audio','look','referencePriority'])assert.deepEqual(dopamin[key],original[key]);
  assert.deepEqual(dopamin.captions.hierarchy,original.captions.hierarchy);assert.equal(dopamin.captions.font,original.captions.font);
  assert.equal(visualProfile('SUES_CALMA').frequency,visualProfile('SUES_DOPAMIN').frequency/2);
  const q=loadProject(f.profiles.test);q.inputs.source.duration=q.inputs.transcript.sourceDuration=90;q.inputs.camera.keyframes.at(-1).time=90;q.inputs.visionFrames.at(-1).time=90;
  q.inputs.transcript.words=Array.from({length:8},(_,i)=>['Ahora','puedes','sentir.'].map((text,j)=>({text,start:3+i*9+j*.8,end:3+i*9+(j+1)*.8}))).flat();
  const a=prepareProject(q),b=prepareProject(q,{styleId:'SUES_DOPAMIN'});assert.ok(b.plan.semantic.zooms.length>a.plan.semantic.zooms.length);
  assert.deepEqual(a.plan.timeMap,b.plan.timeMap);assert.equal(a.director.audit.omittedWords,b.director.audit.omittedWords);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});

test('ELEMENTS persists through jobs, undo, backup and rejects stale regroup anchors',async()=>{
 const f=fixture(),jobs=new EditorJobs({directory:join(f.dir,'jobs'),profiles:f.profiles,autoStart:false});try{
  let job=jobs.create('test'),elements=config('FLOW',jobs.plan(job.id).manifest.captions);
  job=jobs.adjust(job.id,{elements});assert.equal(job.summary.motions,1);
  const ass=buildPreviewASS(jobs.plan(job.id).manifest);
  assert.throws(()=>jobs.adjust(job.id,{styleId:'SUES_DOPAMIN',elements}),/resetting/);
  job=jobs.adjust(job.id,{});job=jobs.undo(job.id);assert.deepEqual(job.settings.elements,elements);assert.equal(buildPreviewASS(jobs.plan(job.id).manifest),ass);
  const backup=await jobs.backup(job.id);assert.ok(backup);
  const project=loadProject(f.profiles.test),prepared=prepareProject(project,job.settings),out=join(f.dir,'portable');
  await createProjectBackup(project,prepared,out);assert.equal(verifyProjectBackup(out).valid,true);
  const restored=prepareProject(loadProject(join(out,'project.json')),JSON.parse(readFileSync(join(out,'settings.json'))));
  assert.equal(buildPreviewASS(restored.plan),ass);assert.equal(buildPreviewFilter(restored.plan),buildPreviewFilter(prepared.plan));
 }finally{await jobs.close();rmSync(f.dir,{recursive:true,force:true});}
});
