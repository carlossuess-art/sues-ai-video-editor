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
