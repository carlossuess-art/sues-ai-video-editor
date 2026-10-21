import test from 'node:test';
import assert from 'node:assert/strict';
import {rmSync} from 'node:fs';
import {fixture} from './helpers/editor-fixture.js';
import {loadProject,prepareProject} from '../src/local-pipeline.js';
import {externalCatalog,reviewExternalPlan} from '../src/external-edit-plan.js';
import {planInstructions} from '../src/instruction-director.js';

test('four native motions compile from external plans with literal corrected caption bindings and original timing',()=>{
 const f=fixture();try{
  const project=loadProject(f.profiles.test),settings=prepareProject(project,{}).settings,catalog=externalCatalog(project,settings),caption=catalog.captions[1],snapshot=JSON.stringify(settings);
  assert.equal(catalog.motionResources.length,4);
  for(const resource of catalog.motionResources){
   const op={type:'motion',resourceId:resource.id,captionId:caption.id,...(resource.number?{number:4}:{})};
   for(const operations of [[op,{type:'caption',captionId:caption.id,text:'Una pausa'}],[{type:'caption',captionId:caption.id,text:'Una pausa'},op]]){
    const review=reviewExternalPlan(JSON.stringify({...catalog.example,operations}),{project,settings,commandPlanner:planInstructions});
    assert.equal(review.canApply,true,JSON.stringify(review));
    const prepared=prepareProject(project,review.changes),motion=prepared.plan.semantic.motions[0];
    assert.equal(prepared.plan.semantic.motions.length,1);assert.equal(motion.params.motionId,resource.id);assert.equal(motion.start,caption.start);
    const binding=resource.id==='QUOTE_CARD_01'?'quote':resource.id==='STRIKE_TEXT_01'?'text':resource.number?'label':null;
    if(binding)assert.equal(motion.params.bindings[binding],'Una pausa');
    if(resource.number)assert.equal(motion.params.bindings.number,'4');
    assert.equal(prepared.plan.captions.find(c=>c.id===caption.id).text,'Una pausa');
   }
  }
  assert.equal(JSON.stringify(settings),snapshot);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});

test('motion review rejects unsupported recipes, missing faces, hidden effects, duplicate targets and unsafe bounds atomically',()=>{
 const f=fixture();try{
  const project=loadProject(f.profiles.test),settings=prepareProject(project,{}).settings,catalog=externalCatalog(project,settings),op={type:'motion',resourceId:'NUMBER_BADGE_GOLD_01',captionId:catalog.captions[1].id,number:4};
  const review=(operations,p=project,s=settings)=>reviewExternalPlan(JSON.stringify({...catalog.example,operations}),{project:p,settings:s,commandPlanner:planInstructions});
  for(const operations of [[{...op,number:0}],[{...op,number:100}],[{...op,number:1.5}],[{...op,captionId:'missing'}],[{...op,start:5}],[{...op,text:'Inventado'}],[{...op,path:'/tmp/test'}],[{...op,resourceId:'STRIKE_TEXT_01'}],[op,{...op,number:5}],[op,{type:'command',text:'sin motions'}],[{type:'command',text:'sin motions'},op]]){
   const r=review(operations);assert.equal(r.canApply,false,JSON.stringify(operations));assert.equal(r.changes,null);
  }
  assert.equal(review([{...op,resourceId:'MOGRT'}]).rows[0].status,'unsupported');
  const faceless={...project,inputs:{...project.inputs,camera:{...project.inputs.camera,mode:'full-frame-fit'},visionFrames:project.inputs.visionFrames.map(f=>({...f,faces:[]}))}};
  assert.ok(externalCatalog(faceless,settings).motionResources.every(r=>!r.available));
  assert.equal(review([op],faceless).rows[0].status,'unsupported');assert.equal(review([op],faceless).canApply,false);
  assert.equal(review([op],project,{...settings,motions:false}).canApply,false);
  assert.equal(review([op],project,{...settings,highlightCaptions:[op.captionId]}).canApply,false);
  assert.equal(review([op],project,{...settings,motionChoices:[{captionId:op.captionId,type:'strike'}]}).canApply,false);
  // A caption exists, but its timestamp would intrude into the outro.
  const late=structuredClone(project);late.inputs.transcript.words=late.inputs.transcript.words.map(w=>({...w,start:w.start+12,end:w.end+12}));
  assert.equal(review([{...op,captionId:'seg-005'}],late).canApply,false);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
