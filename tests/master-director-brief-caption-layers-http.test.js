import test from 'node:test';
import assert from 'node:assert/strict';
import {rmSync} from 'node:fs';import {join} from 'node:path';
import {fixture} from './helpers/editor-fixture.js';
import {createEditorServer} from '../src/editor-server.js';
test('private word-by-word caption layer endpoint preserves source and requires authenticated exact revision',async()=>{
 const f=fixture(),app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles});
 try{
  const base=(await app.listen()).split('/#')[0],job=app.jobs.create('test');
  const root=base+'/api/jobs/'+job.id;
  const login=await fetch(base+'/api/session',{method:'POST',
   headers:{Authorization:'Bearer '+app.token}});
  const headers={Cookie:login.headers.get('set-cookie').split(';')[0],
   'X-Sues-Request':'editor','Content-Type':'application/json'};
  const cat=await (await fetch(root+'/external-catalog',{headers})).json();
  const brief='# Director\n> NO APROBADO / NO EJECUTAR '+cat.sourceSha256+
   '\nSubtítulos S x=90–990 y=1470–1660\n### Escena 01 · INICIO · 00:00–00:24\n'+
   '- \`0–24 s\`: base **CARLOS**; S en zona inferior.';
  const saved=await fetch(root+'/master-source-brief',{method:'POST',headers,body:JSON.stringify({
   text:brief,expectedRevision:null,expectedSourceSha256:cat.sourceSha256,
   expectedTimelineFingerprint:cat.timelineFingerprint})});
  assert.equal(saved.status,201,await saved.clone().text());
  const {revision}=await saved.json(),url=root+'/master-brief-caption-layers?briefRevision='+revision;
  assert.equal((await fetch(url)).status,401);
  const before=JSON.stringify(app.jobs.get(job.id));
  const result=await fetch(url,{headers});
  assert.equal(result.status,200,await result.clone().text().then(x=>x.slice(0,450)));
  const report=await result.json();
  assert.equal(report.status,'PREPARED_NOT_EXECUTABLE_NEEDS_HUMAN_ASR_AND_FRAME_QA');
  assert.ok(report.candidateCount>5);assert.equal(report.wordCount,report.candidateCount);
  assert.equal(report.safeZoneProposed.x,90);assert.equal(report.safeZoneProposed.y,1470);
  assert.equal(report.canExecute,false);assert.equal(report.approved,false);
  assert.ok(report.candidates.every(x=>x.renderer==='remotion'&&x.effect==='text'&&x.approved===false));
  assert.equal(JSON.stringify(app.jobs.get(job.id)),before,'no edits to active project');
  assert.equal((await fetch(root+'/master-brief-caption-layers?briefRevision=bad',{headers})).status,400);
  assert.equal((await fetch(root+'/master-brief-caption-layers?briefRevision='+'f'.repeat(64),{headers})).status,404);
 }finally{await app.close();rmSync(f.dir,{recursive:true,force:true});}
});
