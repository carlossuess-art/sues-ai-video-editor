import {reviewExternalPlan} from '../src/external-edit-plan.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {fixture} from './helpers/editor-fixture.js';
import {loadProject,prepareProject} from '../src/local-pipeline.js';
import {foregroundSpaceHash} from '../src/foreground-effects.js';
import {createProjectBackup,verifyProjectBackup} from '../src/project-backup.js';
import {buildPreviewFilter} from '../src/local-preview.js';
test('portable project retains foreground matte/video and restores matching composition',async()=>{
 const f=fixture();try{
  const project=loadProject(f.profiles.test),base=prepareProject(project,{profileImages:false}),file=join(f.dir,'reviewed-matte.mkv');writeFileSync(file,'bound matte fixture');
  const hash=p=>createHash('sha256').update(p).digest('hex'),matteHash=hash('bound matte fixture'),assetHash=hash('fixture');
  const covered=[...(base.plan.illustrations??[]),...(base.plan.semantic.motions??[]),...(base.plan.graphics??[])];let start=.1;while(covered.some(e=>start<e.end&&start+1>e.start))start+=1;const end=start+1;
  const data={schema:'sues-foreground-effects/v1',sourceSha256:base.plan.source.sha256,cameraSpaceSha256:foregroundSpaceHash(base.plan),matte:{localFile:file,sha256:matteHash,modelSha256:'b'.repeat(64),method:'modnet-onnx-cpu',width:512,height:896,fps:30,frames:Math.ceil(base.plan.duration*30-1e-7),duration:Math.ceil(base.plan.duration*30-1e-7)/30,activeRanges:[{start,end}],reviewStatus:'sample-reviewed'},events:[{type:'behind-video',start,end,assetId:assetHash,sourceIn:0,opacity:.8,reason:'Foreground backup fixture',localFile:project.sourcePath,sha256:assetHash,rights:'owned',mediaDuration:24}]};
  const external=JSON.stringify({schema:'sues-edit-plan/v1',sourceSha256:base.plan.source.sha256,operations:[{type:'foreground-effects',data}]});
  const review=reviewExternalPlan(external,{project,settings:{profileImages:false}});assert.equal(review.canApply,true,JSON.stringify(review));
  const invalid=structuredClone(data);invalid.matte.sha256='c'.repeat(64);const bad=reviewExternalPlan(JSON.stringify({schema:'sues-edit-plan/v1',sourceSha256:base.plan.source.sha256,operations:[{type:'foreground-effects',data:invalid}]}),{project,settings:{profileImages:false}});assert.equal(bad.canApply,false);
  const prepared=prepareProject(project,{profileImages:false,reviewedForeground:data});const backup=await createProjectBackup(project,prepared,join(f.dir,'portable'));
  assert.equal(verifyProjectBackup(backup.directory).valid,true);
  const restored=loadProject(join(backup.directory,'project.json'));
  const {readFileSync}=await import('node:fs');const settings=JSON.parse(readFileSync(join(backup.directory,'settings.json'),'utf8'));assert.equal(settings.reviewedForeground,null);
  const replay=prepareProject(restored,settings);assert.equal(buildPreviewFilter(replay.plan),buildPreviewFilter(prepared.plan));
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
