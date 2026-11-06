import test from 'node:test';
import assert from 'node:assert/strict';
import {rmSync} from 'node:fs';
import {join} from 'node:path';
import {fixture} from './helpers/editor-fixture.js';
import {createEditorServer} from '../src/editor-server.js';

test('authenticated pause audit uses verified source, current revision and NEVER modifies the Reel',async()=>{
 const f=fixture(),app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles});
 try{
  const url=(await app.listen()).split('/#')[0],job=app.jobs.create('test');
  const endpoint=url+'/api/jobs/'+job.id+'/master-pause-audit';
  const unauthed=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
  assert.equal(unauthed.status,401);
  const login=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}});
  const headers={Cookie:login.headers.get('set-cookie').split(';')[0],'X-Sues-Request':'editor','Content-Type':'application/json'};
  const current=await (await fetch(url+'/api/jobs/'+job.id+'/master-current',{headers})).json();
  assert.equal(current.revision,null);
  const catalog=await (await fetch(url+'/api/jobs/'+job.id+'/external-catalog',{headers})).json();
  const payload={expectedRevision:current.revision,expectedSourceSha256:catalog.sourceSha256,
   expectedTimelineFingerprint:catalog.timelineFingerprint,candidates:[{start:0.8,end:1.1},{start:3,end:3.25}]};
  const request=b=>fetch(endpoint,{method:'POST',headers,body:JSON.stringify(b)});
  const suggested=await request({...payload,candidates:undefined,suggest:true});
  assert.equal(suggested.status,200);
  const suggestion=await suggested.json();
  assert.equal(suggestion.proposedAutomatically,true);assert.equal(suggestion.applied,false);
  assert.equal(suggestion.canExecute,false);
  const before=JSON.stringify(app.jobs.get(job.id));
  const response=await request(payload);assert.equal(response.status,200);
  const report=await response.json();
  assert.equal(report.schema,'sues-master-pause-candidates-qa/v1');
  assert.equal(report.canExecute,false);assert.equal(report.approved,false);assert.equal(report.applied,false);
  assert.equal(report.sourceSha256,catalog.sourceSha256);assert.equal(report.timelineFingerprint,catalog.timelineFingerprint);
  assert.equal(report.candidates.length,2);
  assert.equal(JSON.stringify(app.jobs.get(job.id)),before);
  assert.equal((await request({...payload,expectedSourceSha256:'f'.repeat(64)})).status,409);
  assert.equal((await request({...payload,expectedTimelineFingerprint:'stale'})).status,409);
  assert.equal((await request({...payload,expectedRevision:'a'.repeat(64)})).status,409);
  assert.equal((await request({...payload,creativeApproval:true})).status,400);
  assert.equal((await request({...payload,candidates:[{start:1,end:2,approved:true}]})).status,200);
  const malicious=await(await request({...payload,candidates:[{start:1,end:2,approved:true}]})).json();
  assert.equal(malicious.candidates[0].status,'BLOCKED');assert.equal(malicious.candidates[0].code,'INVALID_CUT');
  assert.equal(malicious.approved,false);assert.equal(malicious.canExecute,false);
  const saved=await fetch(url+'/api/jobs/'+job.id+'/master-draft',{method:'POST',headers,body:JSON.stringify({story:{schema:'sues-master-story/v1',title:'current'}})});
  assert.equal(saved.status,201);
  const {revision}=await saved.json();
  const set=await request(payload);assert.equal(set.status,200);
  const assigned=await fetch(url+'/api/jobs/'+job.id+'/master-current',{method:'POST',headers,body:JSON.stringify({expectedRevision:null,revision})});
  assert.equal(assigned.status,200);
  assert.equal((await request(payload)).status,409);
  assert.equal((await request({...payload,expectedRevision:revision})).status,200);
  assert.equal(app.jobs.list().length,1);
 }finally{await app.close();rmSync(f.dir,{recursive:true,force:true});}
});
