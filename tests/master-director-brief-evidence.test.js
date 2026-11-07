import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {saveMasterSourceBrief,listMasterSourceBriefs} from '../src/master-director-brief-evidence.js';
import {fixture} from './helpers/editor-fixture.js';
import {createEditorServer} from '../src/editor-server.js';
const H='a'.repeat(64),O='b'.repeat(64),T='timeline-alpha';
test('immutable Markdown is preserved byte for byte, no approval and no executable plan',()=>{
 const dir=mkdtempSync(join(tmpdir(),'sues-brief-'));
 try{
  const text='# Plan original\n\nNO APROBADO / NO EJECUTAR\n'+O+'\n## Escena 1\nB01 sin licencia\n';
  const a=saveMasterSourceBrief(dir,{text,sourceSha256:H,originalSha256:O,timelineFingerprint:T});
  assert.equal(a.status,'STORED_REVIEW_ONLY');assert.equal(a.canExecute,false);
  assert.deepEqual(saveMasterSourceBrief(dir,{text,sourceSha256:H,originalSha256:O,timelineFingerprint:T}),a);
  const rows=listMasterSourceBriefs(dir);assert.equal(rows.length,1);assert.equal(rows[0].text,text);
  assert.equal(rows[0].approved,false);assert.equal(rows[0].canExecute,false);
  assert.equal(saveMasterSourceBrief(dir,{text:'Another file',sourceSha256:H,originalSha256:O,timelineFingerprint:T}).code,'ORIGINAL_SOURCE_NOT_DECLARED_IN_BRIEF');
  const file=join(dir,'master-director','source-briefs',a.revision+'.json');
  writeFileSync(file,readFileSync(file,'utf8').replace('B01 sin licencia','B01 autorizado'));
  assert.throws(()=>listMasterSourceBriefs(dir),/integrity/i);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('private HTTP source brief survives without changing active revision, rights or export readiness',async()=>{
 const f=fixture(),configFile=join(f.dir,'project.json'),original='9'.repeat(64);
 const cfg=JSON.parse(readFileSync(configFile,'utf8'));
 const hash=createHash('sha256').update(readFileSync(join(f.dir,'source.mp4'))).digest('hex');
 cfg.source.sha256=hash;
 cfg.sourceLineage={schema:'sues-master-source-lineage/v1',type:'cfr30-derived-from-vfr',
  originalSha256:original,derivedSha256:hash,originalPreserved:true,approvalInherited:false};
 writeFileSync(configFile,JSON.stringify(cfg));
 const app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles});
 try{
  const url=(await app.listen()).split('/#')[0],job=app.jobs.create('test'),endpoint=url+'/api/jobs/'+job.id+'/master-source-brief';
  assert.equal((await fetch(endpoint)).status,401);
  const a=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}});
  const headers={Cookie:a.headers.get('set-cookie').split(';')[0],'X-Sues-Request':'editor','Content-Type':'application/json'};
  const head=(await(await fetch(url+'/api/jobs/'+job.id+'/master-current',{headers})).json());
  const c=(await(await fetch(url+'/api/jobs/'+job.id+'/external-catalog',{headers})).json());
  const text='# Original VFR '+original+'\n\nNO APROBADO / NO EJECUTAR\nB01 B02 B03 B04 B05';
  const payload={text,expectedRevision:head.revision,expectedSourceSha256:c.sourceSha256,
   expectedTimelineFingerprint:c.timelineFingerprint};
  const request=p=>fetch(endpoint,{method:'POST',headers,body:JSON.stringify(p)});
  const originalJob=JSON.stringify(app.jobs.get(job.id));
  const result=await request(payload);assert.equal(result.status,201);
  const receipt=await result.json();assert.equal(receipt.status,'STORED_REVIEW_ONLY');
  assert.equal(receipt.originalSha256,original);assert.equal(receipt.sourceSha256,hash);
  const list=await(await fetch(endpoint,{headers})).json();assert.equal(list.briefs.length,1);
  assert.equal(list.briefs[0].text,text);assert.equal(list.briefs[0].stale,false);
  assert.equal(list.canExecute,false);
  assert.equal((await request({...payload,approved:true})).status,400);
  assert.equal((await request({...payload,expectedRevision:'a'.repeat(64)})).status,409);
  assert.equal((await request({...payload,expectedSourceSha256:original})).status,409);
  assert.equal((await request({...payload,expectedTimelineFingerprint:'other'})).status,409);
  assert.equal((await request({...payload,text:'wrong original'})).status,422);
  assert.equal(JSON.stringify(app.jobs.get(job.id)),originalJob);
  const current=(await(await fetch(url+'/api/jobs/'+job.id+'/master-current',{headers})).json());
  assert.equal(current.revision,null);
  const preflight=await request(payload);assert.equal(preflight.status,201);
  assert.equal((await(await fetch(endpoint,{headers})).json()).briefs.length,1);
 }finally{await app.close();rmSync(f.dir,{recursive:true,force:true});}
});
