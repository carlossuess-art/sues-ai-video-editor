import test from 'node:test';
import assert from 'node:assert/strict';
import {join} from 'node:path';
import {readFileSync,rmSync} from 'node:fs';
import {fixture} from './helpers/editor-fixture.js';
import {createEditorServer} from '../src/editor-server.js';

test('private upload brief is bounded, source-bound and durable without creating an analysis or render',async()=>{
 const f=fixture(),directory=join(f.dir,'jobs');
 // Probe is substituted here: this test covers metadata/HTTP, not video decoding.
 const options={directory,profiles:f.profiles,intakeProbe:async()=>({streams:[{codec_type:'video',width:1080,height:1920},{codec_type:'audio'}],format:{duration:24}})};
 let app=createEditorServer(options);
 const session=async()=>{const url=(await app.listen()).split('/#')[0],r=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}});return {url,headers:{Cookie:r.headers.get('set-cookie').split(';')[0],'X-Sues-Request':'editor'}};};
 try{
  let {url,headers}=await session();const source=readFileSync(join(f.dir,'source.mp4'));
  const upload=await (await fetch(url+'/api/uploads?name=mi-video.mp4',{method:'POST',headers:{...headers,'Content-Type':'video/mp4'},body:source})).json();assert.equal(upload.state,'NEEDS_ANALYSIS');
  const path='/api/uploads/'+upload.id+'/brief',jsonHeaders={...headers,'Content-Type':'application/json'};
  assert.equal((await fetch(url+path,{method:'POST',headers:{'Content-Type':'application/json'},body:'{"prompt":"private"}'})).status,401);
  const result=await fetch(url+path,{method:'POST',headers:jsonHeaders,body:JSON.stringify({prompt:'  Quiero conservar esta idea.  '})});assert.equal(result.status,200);const saved=await result.json();assert.equal(saved.brief.prompt,'Quiero conservar esta idea.');assert.equal(saved.requiresAnalysis,true);
  assert.equal((await fetch(url+path,{method:'POST',headers:jsonHeaders,body:JSON.stringify({prompt:'x'.repeat(4001)})})).status,400);
  assert.equal(app.jobs.list().length,0);assert.deepEqual(readFileSync(join(f.dir,'source.mp4')),source);
  await app.close();app=createEditorServer(options);({url,headers}=await session());
  const uploads=await (await fetch(url+'/api/uploads',{headers})).json();assert.equal(uploads[0].brief.prompt,'Quiero conservar esta idea.');assert.equal(uploads[0].state,'NEEDS_ANALYSIS');assert.equal(app.jobs.list().length,0);
 }finally{await app.close();rmSync(f.dir,{recursive:true,force:true});}
});
