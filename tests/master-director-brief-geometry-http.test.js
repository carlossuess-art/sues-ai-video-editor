import test from 'node:test';
import assert from 'node:assert/strict';
import {rmSync} from 'node:fs';
import {join} from 'node:path';
import {fixture} from './helpers/editor-fixture.js';
import {createEditorServer} from '../src/editor-server.js';
test('authenticated geometry audit preserves a saved Film Director brief without changing the edit',async()=>{
 const f=fixture(),app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles});
 try{
  const url=(await app.listen()).split('/#')[0],job=app.jobs.create('test'),path=url+'/api/jobs/'+job.id;
  const login=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}});
  const headers={Cookie:login.headers.get('set-cookie').split(';')[0],'X-Sues-Request':'editor','Content-Type':'application/json'};
  const cat=await (await fetch(path+'/external-catalog',{headers})).json();
  const text=`# Film Director
> NO APROBADO / NO EJECUTAR ${cat.sourceSha256}
### Escena 01 · GANCHO · 00:00–00:24
- \`0–24 s\`: base **CARLOS**; texto editorial **PRUEBA**.
**Posición de título/motion:** columnas x=110–500 y x=580–980, y=740–1150.
`;
  const saved=await fetch(path+'/master-source-brief',{method:'POST',headers,
   body:JSON.stringify({text,expectedRevision:null,expectedSourceSha256:cat.sourceSha256,expectedTimelineFingerprint:cat.timelineFingerprint})});
  assert.equal(saved.status,201);
  const receipt=await saved.json(),endpoint=path+'/master-brief-geometry?briefRevision='+receipt.revision;
  assert.equal((await fetch(endpoint)).status,401);
  const before=JSON.stringify(app.jobs.get(job.id));
  const reply=await fetch(endpoint,{headers});assert.equal(reply.status,200);
  const data=await reply.json();
  assert.equal(data.canExecute,false);assert.equal(data.approved,false);
  assert.equal(data.proposedRectangles,2);assert.equal(data.ambiguous,0);
  assert.equal(data.placements[0].sourceLine,4);
  assert.equal(JSON.stringify(app.jobs.get(job.id)),before);
  assert.equal((await fetch(path+'/master-brief-geometry?briefRevision=bad',{headers})).status,400);
  assert.equal((await fetch(path+'/master-brief-geometry?briefRevision='+'a'.repeat(64),{headers})).status,404);
 }finally{await app.close();rmSync(f.dir,{recursive:true,force:true});}
});
