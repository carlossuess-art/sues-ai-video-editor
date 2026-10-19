import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateStudyRecipe,studyFingerprint} from '../src/editorial-study.js';
const recipe=JSON.parse(readFileSync(new URL('../examples/templates/reviewed-depth.recipe.json',import.meta.url)));
test('depth recipe retains explicit DOPAMIN/CALMA schedules and rejects invalid timing',()=>{
 const d=validateStudyRecipe(recipe,12,'SUES_DOPAMIN'),c=validateStudyRecipe(recipe,12,'SUES_CALMA');
 assert.equal(d.labels[0].text,'¿QUÉ TE FRENA?');assert.equal(d.profile.transitions.length,2);assert.equal(c.profile.transitions.length,1);assert.equal(c.profile.subjectEventLimit,1);
 d.labels[0].text='changed';assert.notEqual(recipe.labels[0].text,'changed');
 for(const change of [r=>r.labels[0].start=-1,r=>r.labels[1].start=1,r=>r.labels[0].end=13,r=>r.profiles.SUES_DOPAMIN.transitions[0].type='unknown',r=>r.sfxGain=1,r=>r.profiles.SUES_DOPAMIN.subjectEventLimit=7]){
  const r=structuredClone(recipe);change(r);assert.throws(()=>validateStudyRecipe(r,12,'SUES_DOPAMIN'));
 }
 assert.throws(()=>validateStudyRecipe(recipe,12,'unknown'));
});
test('study identity binds compiled direction, source, resources, fonts, music and engine',()=>{
 const base={plan:{source:{sha256:'source'},captions:[{text:'accepted'}],subjectLayers:[{sha256:'resource',matte:{sha256:'mask'}}]},settings:{styleId:'SUES_DOPAMIN'},fontHashes:{bold:'font'},backgroundAudioHash:'music',engineHash:'engine'};
 const before=studyFingerprint(base);
 assert.equal(before,studyFingerprint({...base,plan:{subjectLayers:base.plan.subjectLayers,captions:base.plan.captions,source:base.plan.source}}));
 for(const change of [b=>b.plan.source.sha256='new',b=>b.plan.captions[0].text='new',b=>b.plan.subjectLayers[0].sha256='new',b=>b.plan.subjectLayers[0].matte.sha256='new',b=>b.settings.styleId='SUES_CALMA',b=>b.fontHashes.bold='new',b=>b.backgroundAudioHash='new',b=>b.engineHash='new']){
  const b=structuredClone(base);change(b);assert.notEqual(studyFingerprint(b),before);
 }
});
