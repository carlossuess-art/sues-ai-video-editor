import {createHash} from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {rmSync,writeFileSync,readFileSync,symlinkSync,unlinkSync} from 'node:fs';
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
test('backup verification rejects unlisted files and a symlinked manifest',async()=>{
 const f=fixture();try{const project=loadProject(f.profiles.test),out=join(f.dir,'portable');await createProjectBackup(project,prepareProject(project),out);
 writeFileSync(join(out,'unlisted.json'),'{}');assert.throws(()=>verifyProjectBackup(out),/unlisted/);unlinkSync(join(out,'unlisted.json'));
 const manifest=readFileSync(join(out,'backup-manifest.json'));unlinkSync(join(out,'backup-manifest.json'));writeFileSync(join(f.dir,'external.json'),manifest);symlinkSync(join(f.dir,'external.json'),join(out,'backup-manifest.json'));assert.throws(()=>verifyProjectBackup(out),/regular manifest/);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});

test('a valid outer backup manifest cannot authorize a foreground mask outside the package',async()=>{
 const f=fixture();try{const project=loadProject(f.profiles.test),out=join(f.dir,'portable');await createProjectBackup(project,prepareProject(project),out);
  const config=JSON.parse(readFileSync(join(out,'project.json')));config.foregroundEffectsPath='analysis/foreground-effects.json';writeFileSync(join(out,'project.json'),JSON.stringify(config));
  writeFileSync(join(out,config.foregroundEffectsPath),JSON.stringify({matte:{localFile:'../../outside.mkv'}}));
  const hash=v=>createHash('sha256').update(v).digest('hex'),manifest=JSON.parse(readFileSync(join(out,'backup-manifest.json')));
  for(const name of ['project.json',config.foregroundEffectsPath]){const bytes=readFileSync(join(out,name)),entry={path:name,bytes:bytes.length,sha256:hash(bytes)},i=manifest.files.findIndex(e=>e.path===name);if(i<0)manifest.files.push(entry);else manifest.files[i]=entry;}
  manifest.files.sort((a,b)=>a.path.localeCompare(b.path));manifest.filesDigest=hash(JSON.stringify(manifest.files));writeFileSync(join(out,'backup-manifest.json'),JSON.stringify(manifest));
  assert.throws(()=>verifyProjectBackup(out),/foreground matte points outside/);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
