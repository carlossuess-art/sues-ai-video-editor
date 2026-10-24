import test from 'node:test';
import assert from 'node:assert/strict';
import {rmSync} from 'node:fs';
import {fixture} from './helpers/editor-fixture.js';
import {loadProject,prepareProject} from '../src/local-pipeline.js';
import {buildModelDirectorRequest,reviewModelDirectorResponse} from '../src/model-director.js';
test('model proposals are bound, executable and leave the baseline intact',()=>{
 const f=fixture();try{
 const project=loadProject(f.profiles.test),settings=prepareProject(project,{}).settings;
 const request=buildModelDirectorRequest({project,settings,visualObservations:[{time:1,description:'A seated person in the sampled frame',method:'local VLM sample'}]});
 const result={schema:'sues-model-director/v1',inputSha256:request.inputSha256,summary:'Una propuesta narrativa de prueba',
 decisions:[{wordId:request.input.candidates[0].wordId,style:'fireMetal',reason:'Concepto inicial del discurso'}]};
 const before=JSON.stringify(settings),review=reviewModelDirectorResponse(JSON.stringify(result),{request,project,settings});
 assert.equal(review.canApply,true);assert.equal(review.humanAcceptance,false);
 assert.equal(review.decisions[0].selectedWord,request.input.candidates[0].text);
 assert.equal(prepareProject(project,review.review.changes).plan.captions[0].keyword.style,'fireMetal');
 assert.equal(JSON.stringify(settings),before);assert.equal(request.input.visualObservations[0].verified,false);
 for(const patch of [{inputSha256:'0'.repeat(64)},{decisions:[{...result.decisions[0],wordId:'seg-001:99'}]},{decisions:[{...result.decisions[0],wordId:'seg-999:0'}]},{decisions:[...result.decisions,...result.decisions]},{decisions:[{...result.decisions[0],command:'rm -rf /'}]}]){
 assert.throws(()=>reviewModelDirectorResponse(JSON.stringify({...result,...patch}),{request,project,settings}));
 }
 assert.throws(()=>reviewModelDirectorResponse('{"schema":',{request,project,settings}));
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});

test('clean edits stay clean; copied examples and stale captions are rejected',()=>{
 const f=fixture();try{
 const project=loadProject(f.profiles.test),settings=prepareProject(project,{}).settings,request=buildModelDirectorRequest({project,settings});
 const result={schema:'sues-model-director/v1',inputSha256:request.inputSha256,summary:'El discurso se mantiene en un plano limpio',decisions:[]};
 assert.equal(reviewModelDirectorResponse(JSON.stringify(result),{request,project,settings}).canApply,true);
 assert.throws(()=>reviewModelDirectorResponse(JSON.stringify({...result,summary:'Resumen narrativo breve'}),{request,project,settings}),/copied example/);
 const changed={...settings,captionOverrides:{[request.input.captions[0].id]:'Contenido cambiado'}};
 assert.throws(()=>reviewModelDirectorResponse(JSON.stringify(result),{request,project,settings:changed}),/stale/);
 assert.throws(()=>buildModelDirectorRequest({project,settings,visualObservations:[{time:99999,description:'Out of source range',method:'Sampled model'}]}));
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('observation key ordering does not falsely invalidate the same source',()=>{
 const f=fixture();try{
 const project=loadProject(f.profiles.test),settings=prepareProject(project,{}).settings;
 const request=buildModelDirectorRequest({project,settings,visualObservations:[{method:'Local model sample',time:1,description:'A person in a sampled frame'}]});
 const result={schema:'sues-model-director/v1',inputSha256:request.inputSha256,summary:'Mantener un plano limpio en esta propuesta',decisions:[]};
 assert.equal(reviewModelDirectorResponse(JSON.stringify(result),{request,project,settings}).canApply,true);
 request.input.captions[0].text='Texto alterado';
 assert.throws(()=>reviewModelDirectorResponse(JSON.stringify(result),{request,project,settings}),/stale/);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});

test('model selection suppresses rule emphasis while preserving explicit choices',()=>{
 const f=fixture();try{
 const project=loadProject(f.profiles.test),settings=prepareProject(project,{}).settings;
 let request=buildModelDirectorRequest({project,settings});const chosen=request.input.candidates[0];
 const manual=request.input.captions.find(c=>c.id!==chosen.captionId);
 settings.keywordOverrides[manual.id]={word:0,level:'important',style:'fire',scale:1.4};
 request=buildModelDirectorRequest({project,settings});
 const response={schema:'sues-model-director/v1',inputSha256:request.inputSha256,summary:'Destacar un concepto conservando la edición explícita',decisions:[{wordId:chosen.wordId,style:'fireMetal',reason:'Concepto del discurso seleccionado para este ensayo'}]};
 const review=reviewModelDirectorResponse(JSON.stringify(response),{request,project,settings});
 assert.equal(review.canApply,true);assert.equal(review.readyForAutonomousRender,false);assert.equal(review.requiresCreativeReview,true);
 assert.deepEqual(review.review.changes.keywordOverrides[manual.id],settings.keywordOverrides[manual.id]);
 assert.ok(!review.suppressedAutomaticCaptionIds.includes(manual.id));assert.ok(!review.suppressedAutomaticCaptionIds.includes(chosen.captionId));
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});