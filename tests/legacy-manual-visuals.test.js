import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {fixture} from './helpers/editor-fixture.js';
import {EditorJobs} from '../src/editor-jobs.js';
test('historic compiled versions expose reversible layers without rewriting their bundle or media',async()=>{
 const f=fixture(),jobs=new EditorJobs({directory:join(f.dir,'jobs'),profiles:f.profiles,autoStart:false});
 try{
  const job=jobs.create('test',{motionChoices:[{captionId:'seg-002',type:'check'}]});
  const bundle=join(jobs.dir(job.id),jobs.get(job.id).bundle,'manifest.json'),compiled=JSON.parse(readFileSync(bundle));
  const expected=compiled.manualVisuals.events.map(e=>e.id);delete compiled.manualVisuals;
  const legacy=JSON.stringify(compiled);writeFileSync(bundle,legacy);
  const viewed=jobs.plan(job.id);
  assert.deepEqual(viewed.manifest.manualVisuals.events.map(e=>e.id),expected);
  assert.equal(viewed.manifest.semantic.motions.length,compiled.semantic.motions.length);
  assert.equal(readFileSync(bundle,'utf8'),legacy);
 }finally{await jobs.close();rmSync(f.dir,{recursive:true,force:true});}
});
