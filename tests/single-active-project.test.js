import test from 'node:test';
import assert from 'node:assert/strict';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {fixture} from './helpers/editor-fixture.js';
import {createEditorServer} from '../src/editor-server.js';

test('native editor retains one active project, rejects stale tab and backs up current edit',async()=>{
 const f=fixture(),app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles});
 try{
  const url=(await app.listen()).split('/#')[0],session=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}});
  const headers={Cookie:session.headers.get('set-cookie').split(';')[0],'X-Sues-Request':'editor','Content-Type':'application/json'};
  const post=(path,b,method='POST')=>fetch(url+'/api/'+path,{method,headers,body:JSON.stringify(b)});
  const newProject=await (await post('jobs',{profileId:'test',newProject:true,projectTitle:'Mi único reel'})).json();
  const id=newProject.id;
  assert.equal((await (await fetch(url+'/api/projects',{headers})).json()).projects.filter(p=>p.projectId===id).length,1);
  const oldRevision=newProject.revision;
  const updated=await (await post('jobs/'+id,{expectedRevision:oldRevision,settings:{...newProject.settings,zoomIntensity:.5}},'PATCH')).json();
  assert.equal(updated.id,id);assert.equal(updated.revision,oldRevision+1);
  assert.equal((await post('jobs/'+id,{expectedRevision:oldRevision,settings:{...newProject.settings,zoomIntensity:.1}},'PATCH')).status,409);
  const current=await (await fetch(url+'/api/jobs/'+id,{headers})).json();
  assert.equal(current.revision,updated.revision);assert.equal(current.settings.zoomIntensity,.5);
  assert.equal((await (await fetch(url+'/api/projects/'+id+'/current',{headers})).json()).activeJobId,id);
  assert.equal(app.jobs.list().length,1);
  const backup=await (await post('jobs/'+id+'/backup',{})).json();assert.equal(backup.ready,true);
  assert.equal(app.jobs.list().length,1);
  assert.equal((await (await fetch(url+'/api/jobs/'+id,{headers})).json()).backupReady,true);
 }finally{await app.close();rmSync(f.dir,{recursive:true,force:true});}
});


test('CFR30 lineage is visible without paths or inherited approval, and remains one project',async()=>{
 const f=fixture();
 try{
  const {readFileSync,writeFileSync}=await import('node:fs');
  const {createHash}=await import('node:crypto');
  const original='9'.repeat(64),derived=createHash('sha256').update(readFileSync(join(f.dir,'source.mp4'))).digest('hex');
  const path=join(f.dir,'project.json'),config=JSON.parse(readFileSync(path,'utf8'));
  config.source.sha256=derived;
  config.sourceLineage={schema:'sues-master-source-lineage/v1',type:'cfr30-derived-from-vfr',
   originalSha256:original,derivedSha256:derived,originalPreserved:true,approvalInherited:false};
  writeFileSync(path,JSON.stringify(config));
  const app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles});
  try{
   const url=(await app.listen()).split('/#')[0],session=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}});
   const headers={Cookie:session.headers.get('set-cookie').split(';')[0],'X-Sues-Request':'editor','Content-Type':'application/json'};
   const created=await fetch(url+'/api/jobs',{method:'POST',headers,body:JSON.stringify({profileId:'test',newProject:true})});
   assert.equal(created.status,201);const job=await created.json();
   const response=await fetch(url+'/api/projects',{headers});assert.equal(response.status,200);
   const projects=(await response.json()).projects;assert.equal(projects.length,1);
   const project=projects[0];assert.equal(project.activeJobId,job.id);
   assert.deepEqual(project.sourceVersion,{kind:'CFR30_DERIVED',sha256:derived,
    originalSha256:original,originalPreserved:true,canInheritApproval:false,requiresFreshPlanReview:true});
   assert.ok(!JSON.stringify(project).includes(f.dir));
   const reopened=await (await fetch(url+'/api/projects/'+project.projectId+'/current',{headers})).json();
   assert.deepEqual(reopened.sourceVersion,project.sourceVersion);
   // Forged inheritance or mismatched hashes must never be shown as verified.
   config.sourceLineage.approvalInherited=true;writeFileSync(path,JSON.stringify(config));
   const forged=(await (await fetch(url+'/api/projects',{headers})).json()).projects[0];
   assert.equal(forged.sourceVersion.kind,'UNVERIFIED');assert.equal(forged.sourceVersion.canInheritApproval,false);
   config.sourceLineage.approvalInherited=false;config.sourceLineage.derivedSha256='f'.repeat(64);
   writeFileSync(path,JSON.stringify(config));
   const mismatched=(await (await fetch(url+'/api/projects',{headers})).json()).projects[0];
   assert.equal(mismatched.sourceVersion.kind,'UNVERIFIED');assert.equal(mismatched.sourceVersion.requiresFreshPlanReview,true);
   assert.equal((await fetch(url+'/api/projects')).status,401);
  }finally{await app.close();}
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
