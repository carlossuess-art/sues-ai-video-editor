import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,rmSync,mkdtempSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {fixture} from './helpers/editor-fixture.js';
import {loadProject,prepareProject} from '../src/local-pipeline.js';
import {buildPreviewFilter} from '../src/local-preview.js';
import {externalCatalog,reviewExternalPlan} from '../src/external-edit-plan.js';
import {createProjectBackup,verifyProjectBackup} from '../src/project-backup.js';
import {validateEditorSettings} from '../src/automatic-director.js';
const fixtureEvent=(assetId='a'.repeat(64))=>({assetId,start:9,end:10.2,sourceIn:0,intensity:.22,reason:'Partículas discretas durante un cambio narrativo'});
test('overlay event is opt-in, bounded, non-overlapping and cannot be arbitrary files or commands',()=>{
 const e=fixtureEvent();
 assert.deepEqual(validateEditorSettings({overlayEvents:[e]}).overlayEvents,[e]);
 for(const bad of [
  [{...e,intensity:.9}],[{...e,start:0,end:.3}],[{...e,start:3,end:6}],[{...e,sourceIn:-1}],
  [{...e,command:'curl external'}],[e,{...e,start:10.3,end:11.2}],[e,e,e]
 ])assert.throws(()=>validateEditorSettings({overlayEvents:bad}));
});

test('Gemini binds only overlays stored in a private editor library, not video ids',()=>{
 const f=fixture();
 try{
  const p=loadProject(f.profiles.test),orig=readFileSync(join(f.dir,'source.mp4'));
  const id=createHash('sha256').update(orig).digest('hex'),e=fixtureEvent(id);
  p.resolveAsset=(assetId,kind)=>{assert.equal(assetId,id);assert.equal(kind,'overlay');return {assetId:id,kind:'overlay',rights:'licensed',sha256:id,localFile:join(f.dir,'source.mp4'),duration:12};};
  const assets=[{id,kind:'overlay',title:'Chispas doradas',duration:12}];
  const cat=externalCatalog(p,{},assets);
  assert.equal(cat.actions.overlay.type,'overlay');
  const text=JSON.stringify({schema:'sues-edit-plan/v1',sourceSha256:cat.sourceSha256,operations:[
   {type:'overlay',resourceId:id,start:e.start,end:e.end,sourceIn:0,intensity:e.intensity,reason:e.reason}
  ]});
  const proposal=reviewExternalPlan(text,{project:p,settings:{motions:false},assets});
  assert.equal(proposal.canApply,true,JSON.stringify(proposal.rows)+JSON.stringify(proposal.notes));
  const prepared=prepareProject(p,proposal.changes);
  assert.equal(prepared.plan.ambientOverlays.length,1);
  assert.equal(prepared.plan.originalVoice,true);
  const filter=buildPreviewFilter(prepared.plan);
  assert.match(filter,/colorkey=0x000000/);
  assert.match(filter,/overlay=x=0:y=960/);
  assert.equal(prepared.plan.ambientOverlays[0].assetId,id);
  assert.equal(prepared.plan.ambientOverlays[0].placement,'lower-half');
  assert.equal(reviewExternalPlan(text,{project:p,settings:{},assets:[]}).canApply,false);
  assert.equal(reviewExternalPlan(text,{project:p,settings:{},assets:[{...assets[0],kind:'video'}]}).canApply,false);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});

test('portable project backup includes approved private overlay bytes and preserves time/rights',async()=>{
 const f=fixture(),base=mkdtempSync(join(tmpdir(),'sues-layer-backup-'));
 try{
  const p=loadProject(f.profiles.test),id=createHash('sha256').update(readFileSync(join(f.dir,'source.mp4'))).digest('hex');
  p.resolveAsset=(assetId,kind)=>{assert.equal(assetId,id);assert.equal(kind,'overlay');return {assetId:id,kind:'overlay',rights:'licensed',sha256:id,localFile:join(f.dir,'source.mp4'),duration:12};};
  const settings={overlayEvents:[fixtureEvent(id)],motions:false};
  const pre=prepareProject(p,settings);
  await createProjectBackup(p,pre,join(base,'project'));
  assert.equal(verifyProjectBackup(join(base,'project')).valid,true);
  const restored=loadProject(join(base,'project/project.json'));
  const regenerated=prepareProject(restored,JSON.parse(readFileSync(join(base,'project/settings.json'),'utf8')));
  assert.deepEqual(regenerated.plan.ambientOverlays.map(x=>({assetId:x.assetId,start:x.start,end:x.end})),
   pre.plan.ambientOverlays.map(x=>({assetId:x.assetId,start:x.start,end:x.end})));
 }finally{rmSync(base,{recursive:true,force:true});rmSync(f.dir,{recursive:true,force:true});}
});
