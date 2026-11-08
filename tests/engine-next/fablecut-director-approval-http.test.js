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
  app=createEditorServer({directory,profiles:{},nativeDirectorInvoker:invoker});
  const url=(await app.listen()).split('/#')[0],approvalPath='/api/engine-next/director/approve-transform',executePath='/api/engine-next/director/execute-transform';
  const request={projectId:'p_3c0550a1dd',revision:54,clipId:'child',x:319,y:0,scale:.65};
  const post=(path,data,headers={})=>fetch(url+path,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(data)});
  assert.equal((await post(approvalPath,request)).status,401);
  const session=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}});
  const cookie=session.headers.get('set-cookie').split(';')[0],h={Cookie:cookie,'X-Sues-Request':'editor'};
  assert.equal((await post(approvalPath,request,{Cookie:cookie})).status,403);
  assert.equal((await post(approvalPath,request,{...h,Origin:'https://evil.example'})).status,403);
  assert.equal((await post(approvalPath,{...request,force:true},h)).status,400);
  const approved=await post(approvalPath,request,h);assert.equal(approved.status,200);
  const issued=await approved.json(),receipt={...request,approvalId:issued.approvalId};assert.match(receipt.approvalId,/^a_/);
  assert.equal(project.revision,54);assert.equal(invoked,0);
  assert.equal((await post(executePath,{...receipt,x:320},h)).status,403);
  const executed=await post(executePath,receipt,h);assert.equal(executed.status,200);
  assert.equal((await executed.json()).revision,55);assert.equal(project.revision,55);
  assert.equal(project.clips.find(c=>c.id==='child').props.x,319);
  assert.equal(invoked,1);
  assert.equal((await post(executePath,receipt,h)).status,403);assert.equal(invoked,1);
  const log=readFileSync(join(directory,'approvals','dispatch-audit.jsonl'),'utf8');
  assert.match(log,/approved-before-dispatch/);assert.match(log,/committed-verified/);
 }finally{await app?.close();await new Promise(resolve=>native.close(resolve));rmSync(directory,{recursive:true,force:true});
  if(prev===undefined)delete process.env.SUES_ENGINE_NEXT_FABLECUT_URL;else process.env.SUES_ENGINE_NEXT_FABLECUT_URL=prev;
  if(oldStore===undefined)delete process.env.SUES_ENGINE_NEXT_DIRECTOR_APPROVALS_DIR;else process.env.SUES_ENGINE_NEXT_DIRECTOR_APPROVALS_DIR=oldStore;}
});
