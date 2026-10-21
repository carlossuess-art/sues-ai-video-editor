import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {fixture} from './helpers/editor-fixture.js';
import {loadProject,prepareProject} from '../src/local-pipeline.js';
import {buildPreviewASS} from '../src/local-preview.js';
import {planInstructions} from '../src/instruction-director.js';

test('dynamic and calm recipes choose speech cues at different density while preserving the legacy default',()=>{
 const f=fixture();try{
  const phrases=['Recuerda estar presente.','Sentir sin miedo.','Respira con calma.','Reconocer tus patrones.','Avanzar con libertad.','Silencio para sentir.','Recuerda tu libertad.','Respira y siente.'];
  const t=JSON.parse(readFileSync(join(f.dir,'transcript.json')));t.sourceDuration=48;t.words=phrases.flatMap((p,j)=>p.split(' ').map((text,i)=>({text,start:3+j*5+i*.55,end:3+j*5+(i+1)*.55})));writeFileSync(join(f.dir,'transcript.json'),JSON.stringify(t));
  const cfg=JSON.parse(readFileSync(f.profiles.test));cfg.source.duration=48;writeFileSync(f.profiles.test,JSON.stringify(cfg));
  for(const name of ['camera','vision']){const p=join(f.dir,name+'.json'),v=JSON.parse(readFileSync(p));(v.keyframes??v.frames)[1].time=48;writeFileSync(p,JSON.stringify(v));}
  const project=loadProject(f.profiles.test),snapshot=JSON.stringify(project.inputs);
  const legacy=prepareProject(project,{}),off=prepareProject(project,{autoRecipe:false});assert.equal(buildPreviewASS(legacy.plan),buildPreviewASS(off.plan));
  const variants=['SUES_CALMA','SUES_DOPAMIN'].map(styleId=>prepareProject(project,{styleId,autoRecipe:true,sfxEnabled:true}));
  assert.ok(variants[1].plan.editionCounts.cards>variants[0].plan.editionCounts.cards);
  assert.ok(variants[1].plan.editionCounts.transitions>variants[0].plan.editionCounts.transitions);
  assert.ok(variants[1].plan.editionCounts.soundEffects>variants[0].plan.editionCounts.soundEffects);
  for(const p of variants){assert.equal(p.director.audit.omittedWords,0);assert.equal(p.plan.duration,48);assert.ok(p.plan.graphics.length);assert.equal(p.plan.editionCounts.zoomIns,p.plan.editionCounts.zoomOuts);assert.ok(p.plan.templateRecipe.selected.every(c=>c.reason.startsWith('spoken-')));}
  const quiet=prepareProject(project,{autoRecipe:true,styleId:'SUES_DOPAMIN',sfxEnabled:false});assert.equal(quiet.plan.editionCounts.soundEffects,0);
  const hidden=prepareProject(project,{autoRecipe:true,motions:false});assert.equal(hidden.plan.editionCounts.cards,0);
  const manual=prepareProject(project,{autoRecipe:true,motionChoices:[{captionId:'seg-001',type:'number',number:2}]});assert.equal(manual.plan.templateRecipe.cards.length,0);assert.equal(manual.plan.templateRecipe.rejected[0].reason,'manual-composition-preserved');
  assert.equal(JSON.stringify(project.inputs),snapshot);
  assert.equal(planInstructions('plantilla dinámica',{}).changes.styleId,'SUES_DOPAMIN');
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
