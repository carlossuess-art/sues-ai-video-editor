import test from 'node:test';
import assert from 'node:assert/strict';
import {rmSync} from 'node:fs';
import {fixture} from './helpers/editor-fixture.js';
import {loadProject,prepareProject} from '../src/local-pipeline.js';
import {validateEditorSettings} from '../src/automatic-director.js';
import {reviewExternalPlan,externalCatalog} from '../src/external-edit-plan.js';
import {planInstructions} from '../src/instruction-director.js';
const framing=project=>({sourceSha256:project.inputs.source.sha256,method:'manual-region-review',face:{x:250,y:420,width:580,height:940},anchor:{x:540,y:800}});
function faceless(project){project.inputs.camera.mode='full-frame-fit';project.inputs.visionFrames.forEach(f=>f.faces=[]);}
test('explicit reviewed framing compiles smooth zooms with no fabricated detection and no source mutation',()=>{
 const f=fixture();try{
  const project=loadProject(f.profiles.test);faceless(project);const before=JSON.stringify(project.inputs);
  const p=prepareProject(project,{reviewedFraming:framing(project),zoomEvents:[{start:12,end:16,scale:1.07,reason:'Cambio de argumento'}],motions:false});
  assert.equal(p.plan.semantic.zooms.length,1);assert.equal(p.plan.camera.mode,'reviewed-region');assert.match(p.plan.semantic.audit.faceMethod,/manually/);
  assert.ok(p.plan.semantic.audit.captionFaceChecks);assert.equal(p.plan.layout.caption.top,190);assert.equal(p.plan.policy.captions.inlineGroups,true);assert.equal(JSON.stringify(project.inputs),before);
  assert.throws(()=>prepareProject(project,{reviewedFraming:{...framing(project),sourceSha256:'b'.repeat(64)}}),/otro original/);
  assert.throws(()=>prepareProject(project,{zoomEvents:[{start:12,end:16,scale:1.07,reason:'Cambio de argumento'}]}),/revisado/);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('framing and explicit zoom operations are reviewed atomically, including face clipping and hidden B-roll',()=>{
 const f=fixture();try{
  const project=loadProject(f.profiles.test);faceless(project);const settings=prepareProject(project,{motions:false}).settings,catalog=externalCatalog(project,settings);
  const zoom={type:'zoom',start:12,end:16,scale:1.07,reason:'Cambio de argumento'},annotation={type:'framing',...framing(project)};
  const review=operations=>reviewExternalPlan(JSON.stringify({...catalog.example,operations}),{project,settings,commandPlanner:planInstructions});
  assert.equal(review([annotation,zoom]).canApply,true);
  assert.equal(review([zoom]).canApply,false);
  assert.equal(review([annotation,{...zoom,scale:1.8}]).canApply,false);
  const unsafe={...annotation,face:{x:0,y:0,width:1080,height:1920}};
  assert.equal(review([unsafe,zoom]).canApply,false);
  assert.equal(review([annotation,annotation,zoom]).canApply,false);
  for(const zoomEvents of [[{start:1,end:4,scale:1.07,reason:'Motivo'}],[{start:12,end:16,scale:1.07,reason:'Motivo',command:'exec'}]])assert.throws(()=>validateEditorSettings({zoomEvents}));
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
