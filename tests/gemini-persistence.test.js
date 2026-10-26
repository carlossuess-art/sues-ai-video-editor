import test from 'node:test';import assert from 'node:assert/strict';import {join} from 'node:path';import {rmSync,mkdirSync,writeFileSync} from 'node:fs';import {randomUUID} from 'node:crypto';import {fixture} from './helpers/editor-fixture.js';import {createEditorServer} from '../src/editor-server.js';import {directorAssets} from '../src/director-context.js';
test('Gemini background plan survives reload, saves draft, never starts render and rejects another provider',async()=>{
 const f=fixture();let release,calls=0;const pending=new Promise(r=>release=r);const directory=join(f.dir,'jobs');const cloudDirector={providers:()=>[{id:'gemini',configured:true}],generate:async({catalog})=>{calls++;await pending;const plan={schema:catalog.schema,sourceSha256:catalog.sourceSha256,operations:[{type:'transition',resourceId:'warm',start:3,duration:.4}]};return {text:JSON.stringify(plan),plan,provider:'gemini'};}};
 let app=createEditorServer({directory,profiles:f.profiles,cloudDirector});
 const login=async()=>{const launch=await app.listen(),url=launch.split('/#')[0];const r=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}});return {url,headers:{Cookie:r.headers.get('set-cookie').split(';')[0],'X-Sues-Request':'editor','Content-Type':'application/json'}};};
 try{
  let {url,headers}=await login();const job=app.jobs.create('test'),requestId=randomUUID();const endpoint='/api/jobs/'+job.id+'/ai-plan';
  assert.equal((await fetch(url+endpoint)).status,401);
  const payload={provider:'gemini',requestId,fingerprint:job.fingerprint,prompt:''};
  assert.equal((await fetch(url+endpoint+'?async=1',{method:'POST',headers,body:JSON.stringify(payload)})).status,202);
  assert.equal((await (await fetch(url+endpoint,{headers})).json()).state,'RUNNING');
  assert.equal((await fetch(url+endpoint+'?async=1',{method:'POST',headers,body:JSON.stringify(payload)})).status,202);assert.equal(calls,1);
  release();let result;for(let i=0;i<30;i++){result=await (await fetch(url+endpoint,{headers})).json();if(result.state==='COMPLETE')break;await new Promise(r=>setTimeout(r,10));}
  assert.equal(result.state,'COMPLETE');assert.equal(result.review.canApply,true);assert.equal(app.jobs.list().length,1);assert.equal(app.jobs.children.size,0);
  assert.equal((await (await fetch(url+'/api/jobs/'+job.id+'/external-draft',{headers})).json()).text,result.text);
  await app.close();app=createEditorServer({directory,profiles:f.profiles,cloudDirector});({url,headers}=await login());
  assert.equal((await (await fetch(url+endpoint,{headers})).json()).state,'COMPLETE');assert.equal(calls,1);
  assert.equal((await fetch(url+endpoint,{method:'POST',headers,body:JSON.stringify({...payload,provider:'openai'})})).status,409);
 }finally{release();await app.close();rmSync(f.dir,{recursive:true,force:true});}
});
test('AI catalogue merges visual risk flags and excludes QA and branded demonstration media',()=>{const f=fixture();try{mkdirSync(join(f.dir,'library'));writeFileSync(join(f.dir,'library','asset-visual-review-v1.json'),JSON.stringify({items:[{assetId:'risk',riskFlags:['unrelated-on-screen-text']}]}));const library={semanticCatalog:()=>({assets:[]}),list:()=>[{id:'risk',title:'Clip',kind:'video'},{id:'qa',title:'QA vídeo de comprobación',kind:'video'},{id:'ok',title:'Persona caminando',kind:'video'}]};assert.deepEqual(directorAssets(library,f.dir).map(a=>a.id),['ok']);}finally{rmSync(f.dir,{recursive:true,force:true});}});
