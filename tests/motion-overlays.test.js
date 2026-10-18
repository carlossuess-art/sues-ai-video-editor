import test from 'node:test';
import assert from 'node:assert/strict';
import {rmSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {fixture} from './helpers/editor-fixture.js';
import {loadProject,prepareProject} from '../src/local-pipeline.js';
import {buildPreviewASS,buildPreviewFilter} from '../src/local-preview.js';
import {validateEditorSettings} from '../src/automatic-director.js';
import {createEditorServer} from '../src/editor-server.js';
import {editorReview} from '../src/editor-review.js';
test('five explicit overlays render without changing voice, words or asserting semantic understanding',()=>{
 const f=fixture();try{
  const project=loadProject(f.profiles.test),base=prepareProject(project),captionId=base.plan.captions[0].id;
  for(const type of ['check','cross','strike','number','divider']){
   const p=prepareProject(project,{motionChoices:[{captionId,type,...(type==='number'?{number:12}:{})}],captionOverrides:{[captionId]:'Mi propia voz.'}}),m=p.plan.semantic.motions[0],ass=buildPreviewASS(p.plan);
   assert.equal(p.plan.semantic.motions.length,1);assert.equal(m.evidence.textOrigin,'user-edited-caption');assert.equal(m.evidence.method,'explicit-editor-choice-not-semantic-inference');assert.equal(m.audio.rendered,false);
   assert.equal(p.director.audit.omittedWords,0);assert.deepEqual(p.plan.timeMap,base.plan.timeMap);assert.equal(buildPreviewFilter(p.plan),buildPreviewFilter({...p.plan,semantic:{...p.plan.semantic,motions:[]}}));
   assert.ok(ass.includes('Dialogue: 3,'));if(['strike','number'].includes(type))assert.ok(ass.includes('Mi propia voz.'));
   const review=editorReview(p.plan,p.director,p.settings);assert.equal(review.events.filter(e=>e.type===m.params.motionId).length,1);
  }
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('invalid or stale motion choices fail and disabling effects preserves saved choices',()=>{
 const f=fixture();try{const project=loadProject(f.profiles.test),captionId=prepareProject(project).plan.captions[0].id;
  for(const c of [{captionId,type:'number',number:0},{captionId,type:'number',number:100},{captionId,type:'check',number:1},{captionId,type:'unknown'},{captionId,type:'strike',text:'injected'}])assert.throws(()=>validateEditorSettings({motionChoices:[c]}));
  assert.throws(()=>validateEditorSettings({motionChoices:[{captionId,type:'check'},{captionId,type:'cross'}]}),/duplicate/);
  assert.throws(()=>prepareProject(project,{motionChoices:[{captionId:'seg-999',type:'check'}]}),/Unknown motion caption/);
  const p=prepareProject(project,{motions:false,motionChoices:[{captionId,type:'check'}]});assert.equal(p.plan.semantic.motions.length,0);assert.equal(p.settings.motionChoices.length,1);
  assert.throws(()=>prepareProject(project,{motionChoices:[{captionId,type:'check'}],graphicCards:[{captionId,type:'grid'}]}),/overlaps motion/);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('stable overlays adapt to a high face and reject a track occupying every candidate region',()=>{
 const f=fixture();try{const project=loadProject(f.profiles.test),captionId=prepareProject(project).plan.captions[0].id;
  project.inputs.visionFrames.forEach(frame=>{const face=frame.faces[0];face.y=160;face.height=260;face.leftEye.y=face.rightEye.y=250;});
  let p=prepareProject(project,{zoomIntensity:0,motionChoices:[{captionId,type:'check'}]});assert.ok(p.plan.semantic.motions[0].box.top>=480);
  for(const frame of project.inputs.visionFrames){const face=frame.faces[0];face.y=120;face.height=1020;face.leftEye.y=face.rightEye.y=450;}
  assert.throws(()=>prepareProject(project,{zoomIntensity:0,motionChoices:[{captionId,type:'check'}]}),/no safe motion placement/);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('HTTP adjustment persists choices, rejects regrouping with stale ids and undo restores the exact overlay',async()=>{
 const f=fixture(),app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles});try{
  const url=(await app.listen()).split('/#')[0],session=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}}),headers={Cookie:session.headers.get('set-cookie').split(';')[0],'Content-Type':'application/json','X-Sues-Request':'editor'};
  const api=async(path,method='GET',body)=>{const r=await fetch(url+'/api/'+path,{method,headers,...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,value:await r.json()};};
  const job=(await api('jobs','POST',{profileId:'test'})).value,id=app.jobs.plan(job.id).manifest.captions[0].id,settings={motionChoices:[{captionId:id,type:'check'}]};
  assert.equal((await api('jobs/'+job.id,'PATCH',{settings})).status,200);const before=buildPreviewASS(app.jobs.plan(job.id).manifest);
  assert.equal((await api('jobs/'+job.id,'PATCH',{settings:{...settings,captionWords:1}})).status,400);
  assert.equal((await api('jobs/'+job.id,'PATCH',{settings:{motionChoices:[{captionId:id,type:'cross'}]}})).status,200);
  assert.equal((await api('jobs/'+job.id+'/undo','POST',{})).status,200);assert.equal(buildPreviewASS(app.jobs.plan(job.id).manifest),before);
  assert.equal(JSON.parse(readFileSync(join(f.dir,'jobs',job.id,'job.json'))).settings.motionChoices[0].type,'check');
 }finally{await app.close();rmSync(f.dir,{recursive:true,force:true});}
});
