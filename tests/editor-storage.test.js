import test from 'node:test';
import assert from 'node:assert/strict';
import {rmSync} from 'node:fs';
import {join} from 'node:path';
import {fixture} from './helpers/editor-fixture.js';
import {worker} from './helpers/render-fixture.js';
import {EditorJobs} from '../src/editor-jobs.js';
import {LocalPrivateStorage} from '../src/private-storage.js';
async function until(check){const end=Date.now()+6000;while(!check()){if(Date.now()>end)throw new Error('Storage lifecycle timeout');await new Promise(r=>setTimeout(r,20));}}
test('failed archival retries storage without a second render, then serves after runtime removal and restart',async()=>{
 const f=fixture(),directory=join(f.dir,'jobs');class FailOnce extends LocalPrivateStorage{async put(...args){if(!this.failed){this.failed=true;throw new Error('simulated storage outage');}return super.put(...args);}}
 let jobs=new EditorJobs({directory,profiles:f.profiles,renderer:worker(f),storage:new FailOnce({directory:join(directory,'private-objects')})});
 try{
  const job=jobs.create('test');jobs.render(job.id);await until(()=>jobs.get(job.id).state==='PUBLISH_FAILED');assert.equal(jobs.get(job.id).attempt,1);assert.equal(jobs.render(job.id).state,'PUBLISHING');await until(()=>jobs.get(job.id).state==='DONE');assert.equal(jobs.get(job.id).attempt,1);assert.equal(jobs.get(job.id).history.filter(h=>h.state==='RENDERING').length,1);assert.ok(jobs.view(jobs.get(job.id)).storageReady);
  rmSync(join(jobs.dir(job.id),'render-1'),{recursive:true});await jobs.close();jobs=new EditorJobs({directory,profiles:f.profiles,renderer:worker(f)});assert.ok((await jobs.media(job.id)).includes('private-objects'));assert.equal((await jobs.audit(job.id)).fullDecode,'pass');
 }finally{await jobs.close();rmSync(f.dir,{recursive:true,force:true});}
});
test('restart recovers a valid completed render before publication without launching a new worker',async()=>{
 const f=fixture(),directory=join(f.dir,'jobs'),renderer=worker(f);let jobs=new EditorJobs({directory,profiles:f.profiles,renderer});
 try{
  const created=jobs.create('test');jobs.render(created.id);await until(()=>jobs.get(created.id).state==='DONE');const job=jobs.get(created.id);job.state='RENDERING';delete job.artifact;delete job.auditArtifact;job.history=job.history.slice(0,job.history.findIndex(h=>h.state==='PUBLISHING'));jobs.save(job);await jobs.close();
  jobs=new EditorJobs({directory,profiles:f.profiles,renderer});await until(()=>jobs.get(job.id).state==='DONE');assert.equal(jobs.get(job.id).attempt,1);assert.equal(jobs.get(job.id).history.filter(h=>h.state==='RENDERING').length,1);assert.equal(jobs.children.size,0);
 }finally{await jobs.close();rmSync(f.dir,{recursive:true,force:true});}
});
