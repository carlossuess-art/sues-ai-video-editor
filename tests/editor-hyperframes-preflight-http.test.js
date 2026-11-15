import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {fixture} from './helpers/editor-fixture.js';
import {createEditorServer} from '../src/editor-server.js';

test('authenticated edit-head HTTP preflight creates actual word-bound HF variables but never edits project',async()=>{
 const f=fixture(),root=join(f.dir,'jobs');
 const file=join(f.dir,'transcript.json'),t=JSON.parse(readFileSync(file,'utf8'));
 const words=['¿Y','si','te','escucharas?','Haz','espacio','para','escucharte.'];
 const frames=[8,14,20,26,81,89,104,112];
 t.words=words.map((text,i)=>({text,start:frames[i]/30,end:frames[i]/30+.13}));
 writeFileSync(file,JSON.stringify(t));
 const server=createEditorServer({directory:root,profiles:f.profiles});
 try{
  const sessionUrl=await server.listen(),base=sessionUrl.split('/#')[0],token=sessionUrl.split('#')[1];
  const handshake=await fetch(base+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+token}});
  assert.equal(handshake.status,200);
  const cookie=handshake.headers.get('set-cookie').split(';')[0];
  const headers={Cookie:cookie,'Content-Type':'application/json','X-Sues-Request':'editor'};
  const created=await fetch(base+'/api/jobs',{method:'POST',headers,body:JSON.stringify({profileId:'test'})});
  assert.equal(created.status,201);
  const job=await created.json(),before=server.jobs.get(job.id);
  const captions=server.jobs.plan(job.id).manifest.captions;
  const select=index=>{
   const c=captions.find(c=>c.wordIndexes?.includes(index));
   assert.ok(c,'Expected caption source mapping to include '+index);
   return {captionId:c.id,displayWordIndex:c.wordIndexes.indexOf(index),
    sourceWordIndex:index,captionText:c.text};
  };
  const payload={fingerprint:before.fingerprint,selections:[select(3),select(5)]};
  const path=base+'/api/jobs/'+job.id+'/motion-hyperframes-preflight';
  const unauthorized=await fetch(path,{method:'POST',body:JSON.stringify(payload)});
  assert.equal(unauthorized.status,401);
  const csrf=await fetch(path,{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify(payload)});
  assert.equal(csrf.status,403);
  const blockedOrigin=await fetch(path,{method:'POST',headers:{...headers,Origin:'https://example.org'},body:JSON.stringify(payload)});
  assert.equal(blockedOrigin.status,403);
  const reply=await fetch(path,{method:'POST',headers,body:JSON.stringify(payload)});
  const body=await reply.json();
  assert.equal(reply.status,200,JSON.stringify(body));
  assert.equal(body.schema,'sues-editor-hyperframes-preflight/v1');
  assert.equal(body.status,'READY_FOR_CREATIVE_REVIEW');
  assert.equal(body.scene.frames,151);
  assert.deepEqual(body.words.card.map(w=>w.editedFrame),[8,14,20,26]);
  assert.deepEqual(body.words.follow.map(w=>w.editedFrame),[81,89,104,112]);
  assert.equal(body.canExecute,false);
  assert.equal(body.approvalIssued,false);
  assert.equal(body.assetImported,false);
  assert.equal(body.creativeApproved,false);
  assert.equal(body.fablecut.operationStatus,'NOT_PREPARED');
  assert.match(body.avMarkdown,/NO IMPORTABLE/);
  assert.equal(server.jobs.get(job.id).revision,before.revision);
  assert.equal(server.jobs.get(job.id).fingerprint,before.fingerprint);
  const stale=await fetch(path,{method:'POST',headers,body:JSON.stringify({...payload,fingerprint:'old'})});
  assert.equal(stale.status,409);
  const invalid=await fetch(path,{method:'POST',headers,body:JSON.stringify({...payload,selections:payload.selections.slice(0,1)})});
  assert.equal(invalid.status,422);
  assert.equal((await invalid.json()).issues[0].code,'PAIRED_NARRATIVE_CUES_REQUIRED');
  const malicious=await fetch(path,{method:'POST',headers,body:JSON.stringify({...payload,execute:true})});
  assert.equal(malicious.status,400);
 }finally{await server.close();rmSync(f.dir,{recursive:true,force:true});}
});
