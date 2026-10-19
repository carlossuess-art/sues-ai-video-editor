import test from 'node:test';
import assert from 'node:assert/strict';
import {rmSync} from 'node:fs';
import {join} from 'node:path';
import {fixture} from './helpers/editor-fixture.js';
import {loadProject,prepareProject} from '../src/local-pipeline.js';
import {EditorJobs} from '../src/editor-jobs.js';
import {STYLE_VARIANTS} from '../src/style-variants.js';
test('five style presets compile through the same renderer without changing speech or source templates',()=>{
 const f=fixture();try{const project=loadProject(f.profiles.test),original=structuredClone(project.inputs.template),fingerprints=new Set();for(const [id,v]of Object.entries(STYLE_VARIANTS)){const p=prepareProject(project,{styleId:id});assert.equal(p.plan.policy.templateId,id);assert.equal(p.director.audit.omittedWords,0);assert.equal(p.plan.policy.captions.fontSize,v.captions.fontSize);assert.equal(p.plan.originalVoice,true);fingerprints.add(p.fingerprint);}assert.equal(fingerprints.size,5);assert.deepEqual(project.inputs.template,original);assert.equal(Object.values(STYLE_VARIANTS).filter(v=>v.status==='experimental').length,4);}finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('changing style rejects stale caption IDs and undo restores style and editorial choices',async()=>{
 const f=fixture(),jobs=new EditorJobs({directory:join(f.dir,'jobs'),profiles:f.profiles,autoStart:false});try{let job=jobs.create('test');job=jobs.adjust(job.id,{keywordOverrides:{'seg-001':{word:0,level:'important',style:'white'}}});assert.throws(()=>jobs.adjust(job.id,{styleId:'SUES_IMPACTO',keywordOverrides:job.settings.keywordOverrides}),/resetting/);job=jobs.adjust(job.id,{styleId:'SUES_IMPACTO'});assert.equal(job.settings.styleId,'SUES_IMPACTO');job=jobs.undo(job.id);assert.equal(job.settings.styleId,'SUES_CALMA');assert.equal(job.settings.keywordOverrides['seg-001'].word,0);}finally{await jobs.close();rmSync(f.dir,{recursive:true,force:true});}
});
