import test from 'node:test';
import assert from 'node:assert/strict';
import {rmSync} from 'node:fs';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {planInstructions} from '../src/instruction-director.js';
import {createEditorServer} from '../src/editor-server.js';
import {EditorJobs} from '../src/editor-jobs.js';
import {fixture} from './helpers/editor-fixture.js';

test('instruction plans preserve manual settings, identify unsupported clauses and flag anchor resets',()=>{
 const base={styleId:'SUES_CALMA',musicGain:.1,zoomIntensity:.5,captionWords:3,captionOverrides:{'seg-001':'Texto propio'}};
 const p=planInstructions('Música al 8 %; menos zoom; baja la música cuando hablo',base);
 assert.equal(p.canApply,true);assert.deepEqual(p.changes,{musicGain:.08,musicEnabled:true,zoomIntensity:.25,duckMusic:true});assert.equal(base.musicGain,.1);
 assert.equal(planInstructions('DOPAMIN',base).requiresResetConfirmation,true);
 assert.equal(planInstructions('CALMA',base).requiresResetConfirmation,false);
 assert.equal(planInstructions('música suave y elimina repeticiones',base).canApply,false);
 for(const text of ['no quiero menos zoom','sin música pero añade una canción','música al 19 %','zoom al 101 %','hazlo viral','en este momento baja música'])assert.equal(planInstructions(text,base).canApply,false,text);
 const explicit={zoomIntensity:.6,zoomEvents:[{start:12,end:15,scale:1.07,reason:'Cambio de argumento'}]};
 assert.deepEqual(planInstructions('sin zoom',explicit).changes.zoomEvents,[]);
 assert.ok(planInstructions('menos zoom',explicit).changes.zoomEvents[0].scale<1.07);
 assert.equal(planInstructions('',base).canApply,true);assert.throws(()=>planInstructions('x'.repeat(4001),base));
});

test('HTTP director rejects unknown requests without mutation; project ancestry, instructions and idempotency survive restart',async()=>{
 const f=fixture(),directory=join(f.dir,'jobs'),app=createEditorServer({directory,profiles:f.profiles});let restarted;
 app.jobs.autoStart=false;
 try{
  const launch=await app.listen(),url=launch.split('/#')[0],session=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}});
  const headers={Cookie:session.headers.get('set-cookie').split(';')[0],'Content-Type':'application/json','X-Sues-Request':'editor'};
  const post=async(path,body)=>fetch(url+'/api/'+path,{method:'POST',headers,body:JSON.stringify(body)});
  const old=app.jobs.create('test'),a=await (await post('jobs',{profileId:'test',newProject:true,projectTitle:'Mi reel'})).json();
  assert.notEqual(a.projectId,old.profileId);assert.equal(a.projectTitle,'Mi reel');
  const b=app.jobs.create('test',a.settings,{parentId:a.id});assert.equal(b.projectId,a.projectId);
  const snapshot=JSON.stringify(app.jobs.get(a.id)),count=app.jobs.list().length;
  assert.equal((await post('jobs/'+a.id+'/direct',{prompt:'menos zoom y elimina repeticiones',requestId:randomUUID()})).status,422);
  assert.equal(app.jobs.list().length,count);assert.equal(JSON.stringify(app.jobs.get(a.id)),snapshot);
  const missing={prompt:'música al 12 %',requestId:randomUUID()};
  const blocked=await (await post('jobs/'+a.id+'/direct-plan',missing)).json();
  assert.equal(blocked.canApply,false);assert.equal(blocked.execution.musicPresent,false);
  assert.equal((await post('jobs/'+a.id+'/direct',missing)).status,422);
  assert.equal(app.jobs.list().length,count);assert.equal(JSON.stringify(app.jobs.get(a.id)),snapshot);
  const request={prompt:'sin música; menos zoom',requestId:randomUUID()},path='jobs/'+a.id+'/direct';
  const response=await post(path,request);assert.equal(response.status,202);const result=await response.json();
  assert.equal(result.projectId,a.projectId);assert.equal(result.parentId,a.id);assert.equal(result.settings.musicEnabled,false);assert.equal(result.settings.zoomIntensity,.75);assert.equal(result.instructions[0].text,request.prompt);
  assert.equal((await (await post(path,request)).json()).id,result.id);assert.equal(app.jobs.list().length,count+1);assert.equal(JSON.stringify(app.jobs.get(a.id)),snapshot);
  assert.equal((await fetch(url+'/api/jobs/'+a.id+'/direct-plan',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status,401);
  await app.close();restarted=new EditorJobs({directory,profiles:f.profiles,autoStart:false});assert.equal(restarted.view(restarted.get(result.id)).instructions[0].text,request.prompt);assert.equal(restarted.view(restarted.get(old.id)).projectId,'test');
 }finally{if(app.server.listening)await app.close();await restarted?.close();rmSync(f.dir,{recursive:true,force:true});}
});
