import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {readFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {fixture} from './helpers/editor-fixture.js';
import {createEditorServer} from '../src/editor-server.js';

test('private project poster decodes an actual MP4, caches JPEG and preserves the version',async t=>{
 if(spawnSync('ffmpeg',['-version']).status!==0)return t.skip('FFmpeg unavailable');
 const f=fixture(),app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles});
 try{
  // DONE is a fixture here: this test validates posters, not rendering or publishing.
  const v=app.jobs.create('test'),job=app.jobs.get(v.id);job.state='DONE';job.output='fixture-preview.mp4';app.jobs.save(job);
  const file=join(app.jobs.dir(v.id),job.output);
  execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','color=c=teal:s=80x120:r=5:d=1','-c:v','libx264','-threads','1','-pix_fmt','yuv420p','-y',file]);
  const original=readFileSync(file),snapshot=JSON.stringify(job),url=(await app.listen()).split('/#')[0],path='/api/jobs/'+v.id+'/poster';
  assert.equal((await fetch(url+path)).status,401);
  const s=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}}),headers={Cookie:s.headers.get('set-cookie').split(';')[0]};
  const [a,b]=await Promise.all([fetch(url+path,{headers}),fetch(url+path,{headers})]);
  assert.equal(a.status,200);assert.equal(b.status,200);assert.equal(a.headers.get('content-type'),'image/jpeg');
  const bytes=Buffer.from(await a.arrayBuffer());assert.equal(bytes.subarray(0,2).toString('hex'),'ffd8');assert.deepEqual(Buffer.from(await b.arrayBuffer()),bytes);
  assert.deepEqual(readFileSync(file),original);assert.equal(JSON.stringify(job),snapshot);
 }finally{await app.close();rmSync(f.dir,{recursive:true,force:true});}
});
