import test from 'node:test';
import assert from 'node:assert/strict';
import {validateEditorSettings} from '../src/automatic-director.js';
import {buildPreviewASS} from '../src/local-preview.js';
import {fixture} from './helpers/editor-fixture.js';
import {loadProject,prepareProject} from '../src/local-pipeline.js';
import {rmSync} from 'node:fs';

test('manual caption hiding is stable and its original is preserved',()=>{
 const f=fixture();
 try{
  const project=loadProject(f.profiles.test);
  const baseline=prepareProject(project);
  const caption=baseline.plan.captions[0];
  const settings=validateEditorSettings({hiddenCaptionIds:[caption.id]});
  const prepared=prepareProject(project,settings);
  assert.equal(prepared.plan.captions.length,baseline.plan.captions.length);
  assert.deepEqual(prepared.plan.hiddenCaptionIds,[caption.id]);
  assert.notEqual(prepared.fingerprint,baseline.fingerprint);
  const source=buildPreviewASS(baseline.plan),hidden=buildPreviewASS(prepared.plan);
  assert.ok(source.includes(caption.text));
  assert.equal(hidden.includes(',,,'+caption.text+'\n'),false);
  assert.equal(prepared.plan.captions[0].text,caption.text);
  assert.equal(prepareProject(project,{hiddenCaptionIds:[]}).plan.hiddenCaptionIds.length,0);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('manual caption visibility rejects duplicates and malformed ids',()=>{
 assert.throws(()=>validateEditorSettings({hiddenCaptionIds:['seg-001','seg-001']}),/hiddenCaptionIds/);
 assert.throws(()=>validateEditorSettings({hiddenCaptionIds:['../../config']}),/hiddenCaptionIds/);
});
