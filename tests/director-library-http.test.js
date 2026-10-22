import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/editor-fixture.js';
import {join} from 'node:path';
import {mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {createEditorServer} from '../src/editor-server.js';
test('project-specific Director library cues require session and never auto-apply B-roll',async()=>{
 const f=fixture(),directory=join(f.dir,'jobs'),lib=join(directory,'library');mkdirSync(lib,{recursive:true});
 writeFileSync(join(lib,'official-library-v1.json'),JSON.stringify({runtimeItems:[{id:'111',kind:'video',titleEs:'Respira y siente',keywords:['respira','sentir'],storedInEditor:true,approvedForProduction:true}]}));
 writeFileSync(join(lib,'purchased-source-index-309-v1.json'),JSON.stringify({items:[{id:'r',originalName:'Respira remoto',categoryHint:['respira'],installedInEditor:false,sourceUrl:'https://secret.invalid'}]}));
 const app=createEditorServer({directory,profiles:f.profiles});
 try{
  const launch=await app.listen(),url=launch.split('/#')[0],job=app.jobs.create('test'),path=url+'/api/jobs/'+job.id+'/library-cues';
  assert.equal((await fetch(path)).status,401);
  const ses=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}}),headers={Cookie:ses.headers.get('set-cookie').split(';')[0]};
  assert.equal((await fetch(path+'?limit=100',{headers})).status,400);
  const r=await fetch(path,{headers});assert.equal(r.status,200);
  const body=await r.json();assert.equal(body.schema,'sues-director-library-cues/v1');assert.equal(body.approvedToAutoPublish,false);
  assert.ok(body.cues.every(c=>c.candidates.every(a=>a.needsHumanReview===true)));
  assert.equal(app.jobs.get(job.id).state,'PREVIEW_READY');assert.ok(!JSON.stringify(body).includes('secret.invalid'));
 }finally{await app.close();rmSync(f.dir,{recursive:true,force:true});}
});
