import test from 'node:test';
import assert from 'node:assert/strict';
import {rmSync,writeFileSync,readFileSync,symlinkSync} from 'node:fs';
import {join} from 'node:path';
import {fixture} from './helpers/editor-fixture.js';
import {loadProject,prepareProject} from '../src/local-pipeline.js';
import {buildPreviewASS,buildPreviewFilter} from '../src/local-preview.js';
import {createProjectBackup,verifyProjectBackup} from '../src/project-backup.js';
test('portable backup restores media, analysis, font kit and editor choices without paths to the old host',async()=>{
 const f=fixture();try{
  const project=loadProject(f.profiles.test),prepared=prepareProject(project,{musicGain:.08,keywordOverrides:{'seg-001':{word:1,level:'exceptional',style:'blue'}},transitions:[{captionId:'seg-001',type:'blur'}]}),out=join(f.dir,'portable');
  await createProjectBackup(project,prepared,out);assert.equal(verifyProjectBackup(out).valid,true);const config=JSON.parse(readFileSync(join(out,'project.json')));assert.ok(!JSON.stringify(config).includes(f.dir));
  const restored=prepareProject(loadProject(join(out,'project.json')),JSON.parse(readFileSync(join(out,'settings.json'))));assert.equal(buildPreviewASS(restored.plan),buildPreviewASS(prepared.plan));assert.equal(buildPreviewFilter(restored.plan),buildPreviewFilter(prepared.plan));assert.equal(restored.plan.source.sha256,prepared.plan.source.sha256);
  await assert.rejects(createProjectBackup(project,prepared,out),/must be new/);writeFileSync(join(out,'analysis/transcript.json'),'changed');assert.throws(()=>verifyProjectBackup(out),/hash mismatch/);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('backup rejects symlinked roots instead of following another directory',async()=>{
 const f=fixture();try{const link=join(f.dir,'link');symlinkSync(f.dir,link,'dir');assert.throws(()=>verifyProjectBackup(link),/regular backup directory/);}finally{rmSync(f.dir,{recursive:true,force:true});}
});
