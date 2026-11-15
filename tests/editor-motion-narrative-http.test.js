import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,rmSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {fixture} from './helpers/editor-fixture.js';
import {createEditorServer} from '../src/editor-server.js';

test('existing authenticated editor reviews selected real words without changing job state',async()=>{
 const f=fixture(),root=join(f.dir,'jobs');
 // Fictitious text is ONLY a private fixture; no audio has been heard.
 const file=join(f.dir,'transcript.json'),t=JSON.parse(readFileSync(file,'utf8'));
 t.words=['¿Y','si','te','escucharas?','Haz','espacio','para','escucharte.'].map((word,i)=>({
  text:word,start:2+i*.65,end:2+(i+1)*.65
 }));
 writeFileSync(file,JSON.stringify(t));
 const app=createEditorServer({directory:root,profiles:f.profiles});
 try{
  const launch=await app.listen(),url=launch.split('/#')[0],token=launch.split('#')[1],path=id=>url+'/api/jobs/'+id+'/motion-narrative';
  const session=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+token}});
  assert.equal(session.status,200);
  const cookie=session.headers.get('set-cookie').split(';')[0],headers={Cookie:cookie,'Content-Type':'application/json','X-Sues-Request':'editor'};
  const jobResponse=await fetch(url+'/api/jobs',{method:'POST',headers,body:JSON.stringify({profileId:'test'})});
  assert.equal(jobResponse.status,201);
  const job=await jobResponse.json(),before=app.jobs.get(job.id);
  const captions=app.jobs.plan(job.id).manifest.captions;
  const chosen=captions.find(c=>c.wordIndexes?.includes(3));
  assert.ok(chosen,'Expected the authentic fourth source word to be present');
  const displayWordIndex=chosen.wordIndexes.indexOf(3);
  const payload={fingerprint:before.fingerprint,selections:[{
   captionId:chosen.id,displayWordIndex,sourceWordIndex:3,captionText:chosen.text
  }]};
  assert.equal((await fetch(path(job.id),{method:'POST',body:JSON.stringify(payload)})).status,401);
  const read=await fetch(path(job.id),{method:'POST',headers,body:JSON.stringify(payload)});
  assert.equal(read.status,200);
  const reply=await read.json();
  assert.equal(reply.readOnly,true);assert.equal(reply.editingEffect,'NONE');
  assert.equal(reply.review.candidates[0].templateId,'TPL_HOOK_DROP_CARD');
  assert.match(reply.avMarkdown,/NO IMPORTABLE/);
  assert.equal(app.jobs.get(job.id).revision,before.revision);
  assert.equal(app.jobs.get(job.id).fingerprint,before.fingerprint);
  const stale=await fetch(path(job.id),{method:'POST',headers,body:JSON.stringify({...payload,fingerprint:'stale'})});
  assert.equal(stale.status,409);
  const forged=await fetch(path(job.id),{method:'POST',headers,body:JSON.stringify({...payload,selections:[{...payload.selections[0],sourceWordIndex:2}]})});
  assert.equal(forged.status,400);
  const evil=await fetch(path(job.id),{method:'POST',headers:{...headers,Origin:'https://evil.example'},body:JSON.stringify(payload)});
  assert.equal(evil.status,403);
 }finally{await app.close();rmSync(f.dir,{recursive:true,force:true});}
});
