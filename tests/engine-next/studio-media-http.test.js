import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {fixture} from '../helpers/editor-fixture.js';
import {createEditorServer} from '../../src/editor-server.js';
import {rmSync,mkdtempSync,readdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const firstProject={name:'SUES 158404 private study',revision:2,width:1080,height:1920,
 tracks:[{id:'V1',kind:'video'},{id:'V4',kind:'video'}],
 clips:[{id:'source',mediaId:'m1',kind:'video',track:'V1',start:0,duration:15,locked:true,props:{}},
        {id:'graphic',mediaId:'m3d',kind:'video',track:'V4',start:4,duration:1,disabled:true,props:{x:200,y:-300,scale:0.5}},
        {id:'title',kind:'text',track:'V4',start:2,duration:1,props:{fontSize:84}}],
 media:[{id:'m1',kind:'video',src:'/media/original.mp4',name:'Original'},{id:'m3d',kind:'video',src:'/media/alpha.webm',name:'3D'}]};
async function startFakeFableCut(){
 let project=structuredClone(firstProject);
 const source=Buffer.from('fablecut-real-byte-range-proof');
 const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/api/project'){
   res.setHeader('Content-Type','application/json');res.setHeader('X-FableCut-Project','p_158404');
   if(req.method==='GET')return res.end(JSON.stringify(project));
   const chunks=[];for await(const c of req)chunks.push(c);
   const changed=JSON.parse(Buffer.concat(chunks).toString());
   if(req.headers['x-fablecut-project']!=='p_158404'||changed.revision<=project.revision){res.writeHead(409);return res.end(JSON.stringify({error:'stale revision'}));}
   project=changed;return res.end(JSON.stringify({ok:true,revision:project.revision}));
  }
  if(url.pathname==='/api/versions'){
   res.setHeader('Content-Type','application/json');
   return res.end(JSON.stringify({project:'p_158404',versions:[{v:3,name:'Auto-save',kind:'auto',created:'2026-11-08T11:30:00.000Z',revision:project.revision,final:false},{v:2,name:'Manual review',kind:'manual',created:'2026-11-08T10:30:00.000Z',revision:1,final:false}]}));
  }
  if(url.pathname==='/media/original.mp4'||url.pathname==='/media/alpha.webm'){
   const range=/^bytes=(\d+)-(\d+)$/.exec(req.headers.range||'');
   res.setHeader('Content-Type','video/mp4');res.setHeader('Accept-Ranges','bytes');
   if(range){const start=Number(range[1]),end=Number(range[2]);res.writeHead(206,{'Content-Range':`bytes ${start}-${end}/${source.length}`});return res.end(source.subarray(start,end+1));}
   return res.end(source);
  }
  res.writeHead(404);res.end();
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 return {origin:`http://127.0.0.1:${server.address().port}`,close:()=>new Promise(resolve=>server.close(resolve)),read:()=>project};
}
test('authenticated source proxy and revisioned transform preserve disabled clip and protect source',async()=>{
 const f=fixture(),fake=await startFakeFableCut(),prev=process.env.SUES_ENGINE_NEXT_FABLECUT_URL,approvalPrev=process.env.SUES_ENGINE_NEXT_DIRECTOR_APPROVALS_DIR,approvalDir=mkdtempSync(join(tmpdir(),'sues-nle-mcp-approvals-'));
 process.env.SUES_ENGINE_NEXT_FABLECUT_URL=fake.origin;
 process.env.SUES_ENGINE_NEXT_DIRECTOR_APPROVALS_DIR=approvalDir;
 let app;
 try{
  const proofIds={storyRevision:'a'.repeat(64),decisionId:'b'.repeat(64),operationId:'move-graphic'};
  const nativePlanVerifier=async ({storyRevision,decisionId,operationId,request})=>({
   ok:storyRevision===proofIds.storyRevision&&decisionId===proofIds.decisionId&&operationId===proofIds.operationId&&request.clipId==='graphic',
   ...proofIds,planFingerprint:'c'.repeat(64),projectFingerprint:'d'.repeat(64)});
  app=createEditorServer({directory:join(f.dir,'nle-jobs'),profiles:f.profiles,nativePlanVerifier,engineNextFrameRenderer:{async capture({time,expectedRevision}){if(expectedRevision!==fake.read().revision)throw Error('stale');return {revision:expectedRevision,time,png:Buffer.from([137,80,78,71,4,5,6])};}}});
  const base=(await app.listen()).split('/#')[0];
  assert.equal((await fetch(base+'/api/engine-next/media/m1')).status,401);
  assert.equal((await fetch(base+'/api/engine-next/project')).status,401);
  assert.equal((await fetch(base+'/api/engine-next/history')).status,401);
  assert.equal((await fetch(base+'/api/engine-next/director/approve-transform',{method:'POST'})).status,401);
  assert.equal((await fetch(base+'/api/engine-next/program-frame?time=4.5&revision=2')).status,401);
  const sess=await fetch(base+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}});
  const headers={cookie:sess.headers.get('set-cookie').split(';')[0], 'content-type':'application/json','x-sues-request':'editor'};
  const approvalUrl=base+'/api/engine-next/director/approve-transform';
  const approveData={projectId:'p_158404',revision:2,clipId:'graphic',x:311,y:-300,scale:.5,...proofIds};
  assert.equal((await fetch(approvalUrl,{method:'POST',headers:{cookie:headers.cookie,'content-type':'application/json'},body:JSON.stringify(approveData)})).status,403);
  assert.equal((await fetch(approvalUrl,{method:'POST',headers,body:JSON.stringify({...approveData,force:true})})).status,400);
  assert.equal((await fetch(approvalUrl,{method:'POST',headers,body:JSON.stringify({...approveData,clipId:'source'})})).status,409);
  assert.equal((await fetch(approvalUrl,{method:'POST',headers,body:JSON.stringify({...approveData,revision:1})})).status,409);
  const approvalResponse=await fetch(approvalUrl,{method:'POST',headers,body:JSON.stringify(approveData)});
  assert.equal(approvalResponse.status,200);const issuedApproval=await approvalResponse.json();
  assert.match(issuedApproval.approvalId,/^a_[a-f0-9]{32}$/);
  assert.equal(issuedApproval.executionStarted,false);assert.equal(issuedApproval.revision,2);
  assert.equal(fake.read().revision,2);assert.equal(readdirSync(approvalDir).filter(x=>x.endsWith('.json')).length,1);
  const proj=await fetch(base+'/api/engine-next/project',{headers});assert.equal(proj.status,200);
  const initial=await proj.json();assert.equal(initial.clips.length,3);assert.equal(initial.revision,2);
  const histResponse=await fetch(base+'/api/engine-next/history',{headers});assert.equal(histResponse.status,200);
  const history=await histResponse.json();assert.equal(history.currentRevision,2);assert.equal(history.versionCount,2);
  assert.equal(history.canRestore,false);assert.equal(history.readOnly,true);
  assert.deepEqual(history.versions.map(v=>v.version),[3,2]);
  assert.equal((await fetch(base+'/api/engine-next/history',{method:'POST',headers,body:'{}'})).status,404);
  const native=await fetch(base+'/api/engine-next/program-frame?time=4.5&revision=2',{headers});
  assert.equal(native.status,200);assert.equal(native.headers.get('content-type'),'image/png');
  assert.equal(native.headers.get('x-sues-cinematic-qa'),'not-approved');
  assert.equal((await native.arrayBuffer()).byteLength,7);
  assert.equal((await fetch(base+'/api/engine-next/program-frame?time=-1&revision=2',{headers})).status,400);
  assert.equal((await fetch(base+'/api/engine-next/program-frame?time=4.5&revision=22',{headers})).status,503);
  const part=await fetch(base+'/api/engine-next/media/m1',{headers:{...headers,range:'bytes=0-7'}});
  assert.equal(part.status,206);assert.equal((await part.arrayBuffer()).byteLength,8);
  assert.equal((await fetch(base+'/api/engine-next/media/unknown',{headers})).status,404);
  assert.equal((await fetch(base+'/api/engine-next/media/m1',{headers:{...headers,range:'bytes=abc'}})).status,404);
  const write=(path,body,override={})=>fetch(base+path,{method:'POST',headers:{...headers,...override},body:JSON.stringify(body)});
  assert.equal((await write('/api/engine-next/clip-transform',{expectedRevision:2,clipId:'source',x:0,y:0,scale:1})).status,422);
  assert.equal(fake.read().revision,2);
  const changed=await write('/api/engine-next/clip-transform',{expectedRevision:2,clipId:'graphic',x:340,y:-400,scale:0.65});
  assert.equal(changed.status,200);assert.equal(fake.read().revision,3);
  assert.equal(fake.read().clips.find(c=>c.id==='graphic').disabled,true);
  assert.equal(fake.read().clips.find(c=>c.id==='graphic').props.x,340);
  assert.equal((await write('/api/engine-next/clip-transform',{expectedRevision:2,clipId:'graphic',x:360,y:0,scale:1})).status,409);
  assert.equal((await write('/api/engine-next/clip-transform',{expectedRevision:3,clipId:'graphic',x:0,y:0,scale:0})).status,400);
  const title=await write('/api/engine-next/title-size',{expectedRevision:3,clipId:'title',fontSize:92});
  assert.equal(title.status,200);assert.equal(fake.read().clips.find(c=>c.id==='title').props.fontSize,92);
  assert.equal((await write('/api/engine-next/clip-transform',{expectedRevision:4,clipId:'graphic',x:5,y:5,scale:1},{'x-sues-request':'none'})).status,403);
 }finally{await app?.close();await fake.close();rmSync(f.dir,{recursive:true,force:true});if(prev===undefined)delete process.env.SUES_ENGINE_NEXT_FABLECUT_URL;else process.env.SUES_ENGINE_NEXT_FABLECUT_URL=prev;if(approvalPrev===undefined)delete process.env.SUES_ENGINE_NEXT_DIRECTOR_APPROVALS_DIR;else process.env.SUES_ENGINE_NEXT_DIRECTOR_APPROVALS_DIR=approvalPrev;rmSync(approvalDir,{recursive:true,force:true});}
});
