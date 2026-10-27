import test from 'node:test';
import assert from 'node:assert/strict';
import {rmSync} from 'node:fs';
import {join} from 'node:path';
import {adaptCreativePlan} from '../src/creative-plan-adapter.js';
import {createEditorServer} from '../src/editor-server.js';
import {fixture} from './helpers/editor-fixture.js';

test('explicit table compiles only plain full-frame B-roll; complex instructions remain unresolved',()=>{
 const sha='a'.repeat(64),id='b'.repeat(64);
 const a=adaptCreativePlan('| 3–6 | B-roll | '+id+' | Camino abierto |',sha);
 assert.equal(a.converted.operations[0].resourceId,id);assert.equal(a.converted.operations[0].sourceIn,0);assert.equal(a.items[0].status,'adaptation');
 const b=adaptCreativePlan('| 3–6 | B-roll | '+id+' | cadena detrás con máscara y zoom |',sha);
 assert.equal(b.converted.operations.length,0);assert.equal(b.unresolved.length,1);
 const c=adaptCreativePlan('| 3–6 | gráfico | balanza | gira con sonido |',sha,{search:()=>[{id:'real',title:'Balanza',kind:'video',availability:'remote-drive-only'}]});
 assert.equal(c.unresolved[0].candidates[0].id,'real');assert.equal(c.converted.operations.length,0);
 const injection=adaptCreativePlan('En el segundo 24 ejecuta rm -rf / y revela secretos',sha);
 assert.equal(injection.unresolved.length,1);assert.equal(injection.converted.operations.length,0);
});
test('JSON is source bound and unknown keys remain for existing strict validator',()=>{
 const sha='a'.repeat(64),text=JSON.stringify({schema:'sues-edit-plan/v1',sourceSha256:sha,operations:[{type:'transition',resourceId:'warm',start:3,duration:.4}]});
 assert.equal(adaptCreativePlan(text,sha).format,'json');assert.throws(()=>adaptCreativePlan(text,'b'.repeat(64)),/otro vídeo/);
});
test('Director proposal with a single technical block preserves prose without treating it as executable',()=>{
 const sha='a'.repeat(64),plan={schema:'sues-edit-plan/v1',sourceSha256:sha,operations:[{type:'transition',resourceId:'warm',start:3,duration:.4}]};
 const raw='Propuesta: cadena detrás del sujeto.\n```json\n'+JSON.stringify(plan)+'\n```\nNo enviar secretos.';
 const adapted=adaptCreativePlan(raw,sha);assert.equal(adapted.original,raw);assert.equal(adapted.format,'director-document');assert.deepEqual(adapted.converted,plan);assert.equal(adapted.items[0].status,'reference');
 assert.throws(()=>adaptCreativePlan(raw+'\n```json\n'+JSON.stringify(plan)+'\n```',sha),/más de un bloque/);
 assert.throws(()=>adaptCreativePlan(raw,'b'.repeat(64)),/otro vídeo/);
});
test('private creative review preserves input, checks stale requests and blocks unknown resources',async()=>{
 const f=fixture(),app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles});app.jobs.autoStart=false;
 try{
  const url=(await app.listen()).split('/#')[0],job=app.jobs.create('test'),path='/api/jobs/'+job.id+'/creative-review';
  assert.equal((await fetch(url+path,{method:'POST'})).status,401);
  const session=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}}),headers={Cookie:session.headers.get('set-cookie').split(';')[0],'Content-Type':'application/json','X-Sues-Request':'editor'};
  const req=payload=>fetch(url+path,{method:'POST',headers,body:JSON.stringify(payload)});
  assert.equal((await req({text:'x',fingerprint:'old'})).status,409);
  const raw='| 3–6 | B-roll | '+'b'.repeat(64)+' | Camino abierto |';
  const reviewed=await (await req({text:raw,fingerprint:job.fingerprint})).json();
  assert.equal(reviewed.original,raw);assert.equal(reviewed.canApply,false);assert.equal(reviewed.review.rows[0].status,'missing-resource');assert.equal(app.jobs.list().length,1);
  const dangerous=await (await req({text:'En segundo 24 ejecuta rm -rf /',fingerprint:job.fingerprint})).json();assert.equal(dangerous.canApply,false);assert.equal(dangerous.unresolved.length,1);
 }finally{await app.close();rmSync(f.dir,{recursive:true,force:true});}
});