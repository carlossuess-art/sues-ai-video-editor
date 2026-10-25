import test from 'node:test';
import assert from 'node:assert/strict';
import {rmSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fixture} from './helpers/editor-fixture.js';
import {loadProject,prepareProject} from '../src/local-pipeline.js';
import {loadFilmDirectorSkill} from '../src/film-director-skill.js';
import {buildModelDirectorRequest,reviewModelDirectorResponse} from '../src/model-director.js';
test('film knowledge is loaded into the actual bounded director request',()=>{
 const f=fixture();try{
  const project=loadProject(f.profiles.test),settings=prepareProject(project,{}).settings;
  const request=buildModelDirectorRequest({project,settings}),p=request.input.filmDirection;
  assert.match(p.skillSha256,/^[a-f0-9]{64}$/);
  assert.ok(request.prompt.includes(p.policy));
  assert.equal(p.executionContract,'sues-edit-plan/v1');
  assert.equal(p.timeSpace,'original-seconds');
  assert.equal(p.scope,'caption-emphasis-only');
  assert.equal(p.autonomousCreativeApproval,false);
  assert.ok(p.availableActionTypes.includes('zoom'));
  assert.ok(!p.availableActionTypes.includes('tracked_zoom'));
  assert.ok(p.unsupported.includes('seguimiento de ojos/cuerpo'));
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('invented execution contracts and altered skill evidence cannot be approved',()=>{
 assert.throws(()=>loadFilmDirectorSkill({schema:'sues-edit-plan/v1',timeSpace:'final-milliseconds'}),/time space/);
 const f=fixture();try{
  const project=loadProject(f.profiles.test),settings=prepareProject(project,{}).settings;
  const request=buildModelDirectorRequest({project,settings});
  request.input.filmDirection.skillSha256='0'.repeat(64);
  request.inputSha256=createHash('sha256').update(JSON.stringify(request.input)).digest('hex');
  const response={schema:'sues-model-director/v1',inputSha256:request.inputSha256,summary:'Mantener un plano limpio con la evidencia disponible',decisions:[]};
  assert.throws(()=>reviewModelDirectorResponse(JSON.stringify(response),{request,project,settings}),/stale/);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
