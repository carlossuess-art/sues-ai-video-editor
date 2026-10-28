import test from 'node:test';
import assert from 'node:assert/strict';
import {rmSync} from 'node:fs';
import {fixture} from './helpers/editor-fixture.js';
import {loadProject,prepareProject} from '../src/local-pipeline.js';
import {buildPreviewASS,buildAudioPassFilter} from '../src/local-preview.js';
import {validateEditorSettings} from '../src/automatic-director.js';
test('automatic motions can be hidden and restored individually without changing original voice or captions',()=>{
 const f=fixture();try{
  const project=loadProject(f.profiles.test),settings={motionChoices:[{captionId:'seg-002',type:'check'}],sfxEnabled:false};
  const base=prepareProject(project,settings),event=base.plan.manualVisuals.events.find(e=>e.category==='motions');
  assert.ok(event);assert.ok(base.plan.semantic.motions.length>0);
  const hidden=prepareProject(project,{...settings,hiddenVisualEventIds:[event.id]});
  assert.equal(hidden.plan.semantic.motions.length,0);
  assert.equal(hidden.plan.manualVisuals.events.find(e=>e.id===event.id).hidden,true);
  assert.deepEqual(hidden.plan.captions,base.plan.captions);
  assert.equal(buildAudioPassFilter(hidden.plan),buildAudioPassFilter(base.plan));
  assert.notEqual(buildPreviewASS(hidden.plan),buildPreviewASS(base.plan));
  const restored=prepareProject(project,{...settings,hiddenVisualEventIds:[]});
  assert.deepEqual(restored.plan.semantic.motions,base.plan.semantic.motions);
  assert.throws(()=>validateEditorSettings({hiddenVisualEventIds:['../../file']}),/hidden visual/);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('a manual hidden decision never migrates to a different automatic event by index',()=>{
 const f=fixture();try{
  const project=loadProject(f.profiles.test),a=prepareProject(project,{motionChoices:[{captionId:'seg-002',type:'check'}]}),id=a.plan.manualVisuals.events.find(e=>e.category==='motions').id;
  const b=prepareProject(project,{motionChoices:[{captionId:'seg-003',type:'check'}],hiddenVisualEventIds:[id]});
  assert.equal(b.plan.semantic.motions.length,1);
  assert.ok(b.plan.manualVisuals.unmatchedHiddenIds.includes(id));
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
