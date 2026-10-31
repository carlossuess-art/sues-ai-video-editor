import test from 'node:test';
import assert from 'node:assert/strict';
import {rmSync} from 'node:fs';
import {join} from 'node:path';
import {fixture} from './helpers/editor-fixture.js';
import {EditorJobs} from '../src/editor-jobs.js';
test('a render submitted during a fragment stays queued without starting a competing worker',async()=>{
 const f=fixture();const jobs=new EditorJobs({directory:join(f.dir,'jobs'),profiles:f.profiles,autoStart:false});
 try{
  const created=jobs.create('test',{motions:false,profileImages:false});
  jobs.previewBusy=true;jobs.autoStart=true;
  const queued=jobs.render(created.id);
  assert.equal(queued.state,'QUEUED');assert.equal(jobs.children.size,0);assert.equal(jobs.queued().length,1);
  assert.equal(jobs.render(created.id).id,queued.id);assert.equal(jobs.queued().length,1);
  assert.equal(jobs.get(created.id).parentId,null);
 }finally{jobs.autoStart=false;jobs.previewBusy=false;await jobs.close();rmSync(f.dir,{recursive:true,force:true});}
});
