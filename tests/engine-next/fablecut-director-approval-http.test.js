import test from 'node:test';import assert from 'node:assert/strict';import http from 'node:http';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {createEditorServer} from '../../src/editor-server.js';
const initial={name:'isolated FableCut QA',revision:54,tracks:[{id:'V1'},{id:'V2'}],lockedTracks:[],
 clips:[{id:'source',kind:'video',track:'V1',locked:true,props:{x:0,y:0,scale:1}},
 {id:'child',kind:'image',track:'V2',disabled:true,props:{x:300,y:0,scale:.65}}],media:[]};
test('SUES HTTP session+CSRF allow one exact native approval, dispatch once and audit to disk',async()=>{
 let project=structuredClone(initial),invoked=0;const native=http.createServer((req,res)=>{
  if(req.url!=='/api/project'){res.writeHead(404);return res.end();}
  res.setHeader('content-type','application/json');res.setHeader('x-fablecut-project','p_3c0550a1dd');res.end(JSON.stringify(project));
 });
 await new Promise(resolve=>native.listen(0,'127.0.0.1',resolve));
 const prev=process.env.SUES_ENGINE_NEXT_FABLECUT_URL,oldStore=process.env.SUES_ENGINE_NEXT_DIRECTOR_APPROVALS_DIR;process.env.SUES_ENGINE_NEXT_FABLECUT_URL='http://127.0.0.1:'+native.address().port;
 const directory=mkdtempSync(join(tmpdir(),'sues-native-http-'));process.env.SUES_ENGINE_NEXT_DIRECTOR_APPROVALS_DIR=join(directory,'approvals');
 let app;
 try{
  const invoker=async(name,args)=>{invoked++;assert.equal(name,'fablecut_patch_project');assert.equal(args.baseRevision,54);
   const c=project.clips.find(c=>c.id==='child');Object.assign(c.props,args.ops[0].set.props);project.revision++;return 'Patched (revision 55): updated child';};
  const proofIds={storyRevision:'a'.repeat(64),decisionId:'b'.repeat(64),operationId:'move-child'};
  const nativePlanVerifier=async({storyRevision,decisionId,operationId,request})=>({
   ok:storyRevision===proofIds.storyRevision&&decisionId===proofIds.decisionId&&operationId===proofIds.operationId&&request.clipId==='child',
   ...proofIds,planFingerprint:'c'.repeat(64),projectFingerprint:'d'.repeat(64)});
  app=createEditorServer({directory,profiles:{},nativeDirectorInvoker:invoker,nativePlanVerifier});
  const url=(await app.listen()).split('/#')[0],approvalPath='/api/engine-next/director/approve-transform',executePath='/api/engine-next/director/execute-transform';
  const request={projectId:'p_3c0550a1dd',revision:54,clipId:'child',x:319,y:0,scale:.65,...proofIds};
  const post=(path,data,headers={})=>fetch(url+path,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(data)});
  assert.equal((await post(approvalPath,request)).status,401);
  const session=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}});
  const cookie=session.headers.get('set-cookie').split(';')[0],h={Cookie:cookie,'X-Sues-Request':'editor'};
  assert.equal((await post(approvalPath,request,{Cookie:cookie})).status,403);
  assert.equal((await post(approvalPath,request,{...h,Origin:'https://evil.example'})).status,403);
  assert.equal((await post(approvalPath,{...request,force:true},h)).status,400);
  assert.equal((await post(approvalPath,{...request,decisionId:'f'.repeat(64)},h)).status,409);
  const approved=await post(approvalPath,request,h);assert.equal(approved.status,200);
  const issued=await approved.json(),receipt={...request,approvalId:issued.approvalId};assert.match(receipt.approvalId,/^a_/);
  assert.equal(project.revision,54);assert.equal(invoked,0);
  assert.equal((await post(executePath,{...receipt,x:320},h)).status,403);
  assert.equal((await post(executePath,{...receipt,operationId:'altered'},h)).status,403);
  const executed=await post(executePath,receipt,h);assert.equal(executed.status,200);
  assert.equal((await executed.json()).revision,55);assert.equal(project.revision,55);
  assert.equal(project.clips.find(c=>c.id==='child').props.x,319);
  assert.equal(invoked,1);
  assert.equal((await post(executePath,receipt,h)).status,403);assert.equal(invoked,1);
  const log=readFileSync(join(directory,'approvals','dispatch-audit.jsonl'),'utf8');
  assert.match(log,/approved-before-dispatch/);assert.match(log,/committed-verified/);
  assert.match(log,/planFingerprint/);assert.match(log,/decisionId/);
 }finally{await app?.close();await new Promise(resolve=>native.close(resolve));rmSync(directory,{recursive:true,force:true});
  if(prev===undefined)delete process.env.SUES_ENGINE_NEXT_FABLECUT_URL;else process.env.SUES_ENGINE_NEXT_FABLECUT_URL=prev;
  if(oldStore===undefined)delete process.env.SUES_ENGINE_NEXT_DIRECTOR_APPROVALS_DIR;else process.env.SUES_ENGINE_NEXT_DIRECTOR_APPROVALS_DIR=oldStore;}
});
test('HTTP native file binding path fails closed without a trusted provisioned registry',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'sues-registry-http-disabled-'));
 let app;
 try{
  app=createEditorServer({directory:dir,profiles:{},nativeProjectBindingsFile:join(dir,'no-such-binding.json')});
  const url=(await app.listen()).split('/#')[0];
  const session=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}});
  const response=await fetch(url+'/api/engine-next/director/approve-transform',{
   method:'POST',headers:{'Content-Type':'application/json','X-Sues-Request':'editor',Cookie:session.headers.get('set-cookie').split(';')[0]},
   body:JSON.stringify({projectId:'p_3c0550a1dd',revision:54,clipId:'child',x:311,y:0,scale:.65,
    storyRevision:'a'.repeat(64),decisionId:'b'.repeat(64),operationId:'move-child'})});
  assert.equal(response.status,503);
 }finally{await app?.close();rmSync(dir,{recursive:true,force:true});}
});
test('HTTP refuses creative approvals when authoritative native-to-job binding is absent',async()=>{
 let invoked=0;
 const native=http.createServer((req,res)=>{
  if(req.url!=='/api/project'){res.writeHead(404);return res.end();}
  res.setHeader('content-type','application/json');res.setHeader('x-fablecut-project','p_3c0550a1dd');
  res.end(JSON.stringify(initial));
 });
 await new Promise(resolve=>native.listen(0,'127.0.0.1',resolve));
 const oldUrl=process.env.SUES_ENGINE_NEXT_FABLECUT_URL,oldLedger=process.env.SUES_ENGINE_NEXT_DIRECTOR_APPROVALS_DIR;
 const directory=mkdtempSync(join(tmpdir(),'sues-bound-http-'));
 process.env.SUES_ENGINE_NEXT_FABLECUT_URL='http://127.0.0.1:'+native.address().port;
 process.env.SUES_ENGINE_NEXT_DIRECTOR_APPROVALS_DIR=join(directory,'approvals');
 let app;
 try{
  app=createEditorServer({directory,profiles:{},
   nativeProjectBindingResolver:async()=>null,
   nativePlanVerifier:async()=>({ok:true,storyRevision:'a'.repeat(64),decisionId:'b'.repeat(64),operationId:'move-child',planFingerprint:'c'.repeat(64),projectFingerprint:'d'.repeat(64)}),
   nativeDirectorInvoker:async()=>{invoked++;throw Error('Unexpected write');}});
  const base=(await app.listen()).split('/#')[0],session=await fetch(base+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}});
  const response=await fetch(base+'/api/engine-next/director/approve-transform',{
   method:'POST',headers:{'Content-Type':'application/json','X-Sues-Request':'editor',Cookie:session.headers.get('set-cookie').split(';')[0]},
   body:JSON.stringify({projectId:'p_3c0550a1dd',revision:54,clipId:'child',x:311,y:0,scale:.65,
     storyRevision:'a'.repeat(64),decisionId:'b'.repeat(64),operationId:'move-child'})});
  assert.equal(response.status,409);assert.equal(invoked,0);
  assert.equal(initial.revision,54);
 }finally{await app?.close();await new Promise(resolve=>native.close(resolve));rmSync(directory,{recursive:true,force:true});
  if(oldUrl===undefined)delete process.env.SUES_ENGINE_NEXT_FABLECUT_URL;else process.env.SUES_ENGINE_NEXT_FABLECUT_URL=oldUrl;
  if(oldLedger===undefined)delete process.env.SUES_ENGINE_NEXT_DIRECTOR_APPROVALS_DIR;else process.env.SUES_ENGINE_NEXT_DIRECTOR_APPROVALS_DIR=oldLedger;}
});
