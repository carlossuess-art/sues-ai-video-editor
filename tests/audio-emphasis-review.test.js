import test from 'node:test';
import assert from 'node:assert/strict';
import {rmSync} from 'node:fs';
import {fixture} from './helpers/editor-fixture.js';
import {loadProject,prepareProject} from '../src/local-pipeline.js';
import {reviewExternalPlan} from '../src/external-edit-plan.js';
import {planInstructions} from '../src/instruction-director.js';
import {hierarchyLayout} from '../src/caption-hierarchy.js';
import {buildPreviewASS,buildAudioPassFilter} from '../src/local-preview.js';

test('explicit orange/metal emphasis survives corrected words without changing source intervals or CALMA defaults',()=>{
 const f=fixture();try{
  const project=loadProject(f.profiles.test),base=prepareProject(project),c=base.plan.captions[0];
  const settings={captionOverrides:{[c.id]:'Ahora puedes sentir.'},keywordOverrides:{[c.id]:{word:2,level:'exceptional',style:'fireMetal',scale:1.45}}};
  const p=prepareProject(project,settings).plan,edited=p.captions[0];
  assert.equal(edited.start,c.start);assert.equal(edited.end,c.end);assert.equal(edited.keyword.style,'fireMetal');
  const rows=hierarchyLayout(edited,p.policy.captions,p.layout.caption),hero=rows.find(r=>r.role==='keyword'),companion=rows.find(r=>r.role!=='keyword');
  assert.ok(Math.abs(hero.size/companion.size-1.45)<.001);assert.match(buildPreviewASS(p),/\\clip\(/);
  const review=operations=>reviewExternalPlan(JSON.stringify({schema:'sues-edit-plan/v1',sourceSha256:project.inputs.source.sha256,operations}),{project,settings:base.settings,commandPlanner:planInstructions});
  assert.equal(review([{type:'emphasis',captionId:c.id,word:0,level:'exceptional',style:'fire',scale:1.45}]).canApply,true);
  assert.equal(review([{type:'emphasis',captionId:c.id,word:99,level:'exceptional',style:'fire',scale:1.45}]).canApply,false);
  assert.equal(review([{type:'emphasis',captionId:c.id,word:0,level:'exceptional',style:'fire',scale:9}]).canApply,false);
  assert.equal(base.settings.voiceGain,1);assert.equal(base.settings.levelResources,false);
  assert.equal(JSON.stringify(prepareProject(project).plan),JSON.stringify(base.plan));
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});

test('audio percentages validate before execution; gain works even without music/SFX',()=>{
 const f=fixture();try{
  const project=loadProject(f.profiles.test),base=prepareProject(project),review=op=>reviewExternalPlan(JSON.stringify({schema:'sues-edit-plan/v1',sourceSha256:project.inputs.source.sha256,operations:[op]}),{project,settings:base.settings,commandPlanner:planInstructions});
  const op={type:'audio-levels',voiceGain:1.5,sfxGain:.3,musicGain:.18,levelResources:true},r=review(op);assert.equal(r.canApply,true,JSON.stringify(r));assert.equal(r.changes.voiceGain,1.5);
  for(const invalid of [{...op,voiceGain:20},{...op,sfxGain:30},{...op,musicGain:18}])assert.equal(review(invalid).canApply,false);
  const p=prepareProject(project,{motions:false,voiceGain:1.5,masteringEnabled:true}).plan;
  assert.match(buildAudioPassFilter(p),/volume=1.5\[voice-gained\]/);assert.match(buildAudioPassFilter(p),/\[voice-gained\]anull/);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});

test('reviewed transition replacement reuses blur compositor and rejects unsupported or overlapping effects',()=>{
 const f=fixture();try{
  const project=loadProject(f.profiles.test),settings=prepareProject(project,{transitions:[{type:'warm',start:12}]}).settings;
  const review=op=>reviewExternalPlan(JSON.stringify({schema:'sues-edit-plan/v1',sourceSha256:project.inputs.source.sha256,operations:[op]}),{project,settings,commandPlanner:planInstructions});
  const op={type:'transition',resourceId:'blur',start:12,duration:.4,replace:true};const r=review(op);assert.equal(r.canApply,true,JSON.stringify(r));assert.deepEqual(r.changes.transitions,[{type:'blur',start:12}]);
  assert.equal(review({...op,resourceId:'invented'}).canApply,false);assert.equal(review({...op,start:12.1}).canApply,false);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
