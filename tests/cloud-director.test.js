import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,rmSync,chmodSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {CloudDirector,buildDirectorInstructions} from '../src/cloud-director.js';
import {createEditorServer} from '../src/editor-server.js';
import {fixture} from './helpers/editor-fixture.js';
const key='test-only-secret-not-a-live-key';
const response=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json',...headers}});
function sample(){
 const dir=mkdtempSync(join(tmpdir(),'sues-cloud-')),sourcePath=join(dir,'source.mp4');writeFileSync(sourcePath,'fixture-original');
 const sourceSha256=createHash('sha256').update('fixture-original').digest('hex');
 const catalog={schema:'sues-edit-plan/v1',sourceSha256,duration:24,actions:{transition:{type:'transition'}},captions:[],assets:[]};
 const plan={schema:catalog.schema,sourceSha256,operations:[{type:'transition',resourceId:'warm',start:2,duration:.4}]};
 return {dir,sourcePath,catalog,plan,args:{provider:'openai',catalog,sourcePath,requestId:randomUUID(),directory:dir}};
}
test('no credential means no media extraction, upload, provider call or automatic fallback',async()=>{
 const f=sample();let calls=0;const c=new CloudDirector({env:{},fetcher:()=>{calls++;},runner:()=>{calls++;}});
 try{assert.ok(c.providers().every(p=>!p.configured&&!p.automaticFallback));await assert.rejects(c.generate(f.args),/Falta configurar/);assert.equal(calls,0);}
 finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('OpenAI gets source-bound timed samples and medium reasoning; successful retry reuses result without charge',async()=>{
 const f=sample();let calls=0,extractions=0;
 const c=new CloudDirector({env:{OPENAI_API_KEY:key},runner:async(_cmd,args)=>{extractions++;writeFileSync(args.at(-1),'jpg fixture');},fetcher:async(url,options)=>{
  calls++;assert.equal(url,'https://api.openai.com/v1/responses');assert.equal(options.redirect,'error');const b=JSON.parse(options.body);
  assert.equal(b.model,'gpt-6.1-sol');assert.equal(b.reasoning.effort,'medium');assert.equal(b.store,false);assert.equal(b.max_output_tokens,12000);
  assert.equal(b.input[0].content.filter(c=>c.type==='input_image').length,8);
  return response({status:'completed',output:[{type:'reasoning',content:[{type:'output_text',text:'not-a-plan'}]},{type:'message',content:[{type:'output_text',text:JSON.stringify(f.plan)}]}],usage:{input_tokens:20,output_tokens:10}});
 }});
 try{
  const result=await c.generate(f.args);assert.deepEqual(result.plan,f.plan);assert.equal(result.sampledFrames.length,8);
  assert.equal((await c.generate(f.args)).reused,true);assert.equal(calls,1);assert.equal(extractions,8);
  await assert.rejects(c.generate({...f.args,prompt:'different request'}),/reutilizada/);
  assert.ok(!readFileSync(join(f.dir,'cloud-director-'+f.args.requestId+'.json'),'utf8').includes(key));
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('Gemini streams uploaded video, waits until ACTIVE, uses documented steps and deletes its remote file',async()=>{
 const f=sample(),calls=[];let uploaded=false;
 const c=new CloudDirector({env:{GEMINI_API_KEY:key},wait:async()=>{},fetcher:async(url,options)=>{
  calls.push({url,method:options.method});assert.equal(options.redirect,'error');
  if(url.endsWith('/upload/v1beta/files'))return response({},200,{'x-goog-upload-url':'https://generativelanguage.googleapis.com/upload/private-upload'});
  if(url.endsWith('/upload/private-upload')){let text='';for await(const chunk of options.body)text+=chunk.toString();assert.equal(text,'fixture-original');uploaded=true;return response({file:{name:'files/abc',state:'PROCESSING'}});}
  if(url.endsWith('/files/abc')&&options.method==='DELETE')return new Response(null,{status:200});
  if(url.endsWith('/files/abc'))return response({name:'files/abc',state:'ACTIVE',uri:'https://generativelanguage.googleapis.com/v1beta/files/abc'});
  if(url.endsWith('/interactions')){assert.equal(uploaded,true);const b=JSON.parse(options.body);assert.equal(b.store,false);assert.equal(b.input[0].type,'video');assert.equal(b.input[0].processing.fps,1);assert.equal(b.generation_config.thinking_level,'medium');return response({status:'completed',steps:[{type:'thought',content:[{type:'text',text:'ignore'}]},{type:'model_output',content:[{type:'text',text:JSON.stringify(f.plan)}]}],usage:{total_input_tokens:20}});}
  throw Error('Unexpected URL');
 }});
 try{const r=await c.generate({...f.args,provider:'gemini'});assert.equal(r.remoteFileDeleted,true);assert.equal(r.inputMode,'video-and-audio');assert.deepEqual(r.plan,f.plan);assert.equal(calls.at(-1).method,'DELETE');}
 finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('quota errors never call another provider, expose its raw error, or repeat a failed request',async()=>{
 const f=sample();let calls=0;const c=new CloudDirector({env:{OPENAI_API_KEY:key,GEMINI_API_KEY:key},runner:async(_c,args)=>writeFileSync(args.at(-1),'jpg'),fetcher:async()=>{calls++;return response({error:{message:key}},429);}});
 try{
  await assert.rejects(c.generate(f.args),/cuota/);await assert.rejects(c.generate(f.args),/ya se intentó/);assert.equal(calls,1);
  const saved=readFileSync(join(f.dir,'cloud-director-'+f.args.requestId+'.json'),'utf8');assert.ok(!saved.includes(key));assert.equal(JSON.parse(saved).state,'FAILED');
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('foreign upload destinations are rejected before sending video or credentials',async()=>{
 const f=sample();let calls=0;const c=new CloudDirector({env:{GEMINI_API_KEY:key},fetcher:async()=>{calls++;return response({},200,{'x-goog-upload-url':'https://example.invalid/steal'});}});
 try{await assert.rejects(c.generate({...f.args,provider:'gemini'}),/no autorizado/);assert.equal(calls,1);}
 finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('wrong-source, truncated and oversized plans are rejected instead of reaching render',async()=>{
 for(const mode of ['source','incomplete','large']){
  const f=sample();const c=new CloudDirector({env:{OPENAI_API_KEY:key},runner:async(_c,args)=>writeFileSync(args.at(-1),'jpg'),fetcher:async()=>response({status:mode==='incomplete'?'incomplete':'completed',output:[{type:'message',content:[{type:'output_text',text:mode==='large'?'x'.repeat(30001):JSON.stringify({...f.plan,sourceSha256:'0'.repeat(64)})}]}]})});
  try{await assert.rejects(c.generate(f.args));assert.equal(c.busy,false);}
  finally{rmSync(f.dir,{recursive:true,force:true});}
 }
});
test('private key file is read only with restrictive permissions and never returned in provider status',()=>{
 const f=sample(),file=join(f.dir,'keys.json');writeFileSync(file,JSON.stringify({openai:key}),{mode:0o600});const c=new CloudDirector({env:{},credentialsFile:file});
 try{assert.equal(c.providers().find(p=>p.id==='openai').configured,true);assert.ok(!JSON.stringify(c.providers()).includes(key));chmodSync(file,0o644);assert.throws(()=>c.providers(),/permisos seguros/);}
 finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('authenticated cloud route validates stale requests and returned operations; leaves parent job and render queue intact',async()=>{
 const f=fixture();let calls=0;const app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles,cloudDirector:{providers:()=>[{id:'gemini',configured:true}],generate:async({catalog})=>{calls++;const plan={schema:catalog.schema,sourceSha256:catalog.sourceSha256,operations:[{type:'transition',resourceId:'warm',start:3,duration:.4}]};return {text:JSON.stringify(plan),plan,provider:'gemini',model:'gemini-3.8-flash'};}}});
 try{
  const launch=await app.listen(),url=launch.split('/#')[0];assert.equal((await fetch(url+'/api/ai/providers')).status,401);
  const session=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}}),headers={Cookie:session.headers.get('set-cookie').split(';')[0],'X-Sues-Request':'editor','Content-Type':'application/json'},job=app.jobs.create('test');
  const call=b=>fetch(url+'/api/jobs/'+job.id+'/ai-plan',{method:'POST',headers,body:JSON.stringify(b)});
  assert.equal((await call({provider:'gemini',fingerprint:'old'})).status,409);assert.equal(calls,0);
  const res=await call({provider:'gemini',fingerprint:job.fingerprint,requestId:randomUUID()}),r=await res.json();
  assert.equal(res.status,200);assert.equal(r.review.canApply,true);assert.equal(r.renderStarted,false);assert.equal(calls,1);assert.equal(app.jobs.get(job.id).revision,1);assert.equal(app.jobs.children.size,0);assert.equal(app.jobs.list().length,1);
 }finally{await app.close();rmSync(f.dir,{recursive:true,force:true});}
});


test('context preview is authenticated, read-only and matches the exact prompt sent to the provider',async()=>{
 const f=fixture();let calls=0,transmitted;
 const app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles,cloudDirector:{providers:()=>[{id:'gemini',configured:true}],generate:async({catalog,prompt})=>{calls++;transmitted=buildDirectorInstructions(catalog,prompt);const plan={schema:catalog.schema,sourceSha256:catalog.sourceSha256,operations:[{type:'transition',resourceId:'warm',start:3,duration:.4}]};return {text:JSON.stringify(plan),plan,provider:'gemini',model:'gemini-3.8-flash'};}}});
 try{
  const launch=await app.listen(),url=launch.split('/#')[0],job=app.jobs.create('test'),path=url+'/api/jobs/'+job.id+'/ai-context';
  assert.equal((await fetch(path,{method:'POST'})).status,401);
  const session=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}}),headers={Cookie:session.headers.get('set-cookie').split(';')[0],'X-Sues-Request':'editor','Content-Type':'application/json'};
  const request=async(payload)=>fetch(path,{method:'POST',headers,body:JSON.stringify(payload)});
  assert.equal((await request({fingerprint:'old',prompt:'hola'})).status,409);
  const result=await (await request({fingerprint:job.fingerprint,prompt:'muestra el pago'})).json();
  assert.equal(result.sent,false);assert.equal(result.requestedFramesPerSecond,1);assert.equal(result.actualFramesVerified,false);assert.equal(calls,0);assert.match(result.instructions,/ENCARGO:muestra el pago/);
  const plan=await fetch(url+'/api/jobs/'+job.id+'/ai-plan',{method:'POST',headers,body:JSON.stringify({provider:'gemini',fingerprint:job.fingerprint,requestId:randomUUID(),prompt:'muestra el pago'})});
  assert.equal(plan.status,200);assert.equal(calls,1);assert.equal(result.instructions,transmitted);assert.equal(app.jobs.children.size,0);
 }finally{await app.close();rmSync(f.dir,{recursive:true,force:true});}
});
