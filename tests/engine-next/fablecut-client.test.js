import test from 'node:test';import assert from 'node:assert/strict';import {FableCutClient,FableCutConflict} from '../../src/engine-next/fablecut-client.js';
const base={revision:2,tracks:[{id:'V1'}],clips:[{id:'c1'}],media:[{id:'m1'}]};
function fake(){let doc=structuredClone(base),nextConflict=false;const fetchImpl=async(url,opts)=>{
  const headers=new Headers({'x-fablecut-project':'p158404'});
  if(url.endsWith('/api/project')&&opts.method==='PUT'){
    const d=JSON.parse(opts.body);
    if(nextConflict||d.revision<=doc.revision){nextConflict=false;return new Response(JSON.stringify({error:'stale revision'}),{status:409,headers});}
    doc=d;return new Response(JSON.stringify({ok:true,revision:d.revision}),{headers});
  }
  return new Response(JSON.stringify(doc),{headers});
 };return {client:new FableCutClient({fetchImpl}),conflict:()=>nextConflict=true,get:()=>doc};}
test('refuses external hosts, credentials and route traversal',()=>{for(const s of ['https://127.0.0.1:7779','http://example.com/','http://127.0.0.1:7779/foo','http://a@localhost:7779'])assert.throws(()=>new FableCutClient({baseUrl:s}));});
test('writes an incremented revision to the same project without losing media',async()=>{const f=fake();const r=await f.client.updateProject(p=>({...p,name:'SUES studio'}),{expectedRevision:2});assert.equal(r.revision,3);assert.equal(f.get().clips.length,1);assert.equal(r.projectId,'p158404');});
test('rejects stale local edits before sending',async()=>{const f=fake();await assert.rejects(f.client.updateProject(p=>p,{expectedRevision:1}),FableCutConflict);assert.equal(f.get().revision,2);});
test('rejects concurrent upstream edits without overwriting',async()=>{const f=fake();f.conflict();await assert.rejects(f.client.updateProject(p=>p),FableCutConflict);assert.equal(f.get().revision,2);});
test('rejects dropping tracks / clips',async()=>{const f=fake();await assert.rejects(f.client.updateProject(p=>{delete p.clips;return p;}));assert.equal(f.get().revision,2);});
test('rejects wrong open project',async()=>{const f=fake();await assert.rejects(f.client.updateProject(p=>p,{projectId:'someone-else'}),FableCutConflict);});
test('restricts uploaded media names and binary limits',async()=>{
 const f=fake();await assert.rejects(f.client.uploadMedia(new Uint8Array([1]),{name:'../evil.webm'}));
 await assert.rejects(f.client.uploadMedia(new Uint8Array(0),{name:'okay.webm'}));
});test('media lookup refuses foreign clip ids, unsafe ranges and redirects',async()=>{
 const client=new FableCutClient({fetchImpl:async(url,opts={})=>{
   if(url.endsWith('/api/project'))return new Response(JSON.stringify({...base,media:[{id:'m1',kind:'video',src:'/media/clip.mp4'}]}),{headers:{'x-fablecut-project':'a'}});
   return new Response('bytes',{status:206,headers:{'content-type':'video/mp4','content-range':'bytes 0-3/4'}});
 }});
 await assert.rejects(client.getMediaStream('wrong'));
 await assert.rejects(client.getMediaStream('m1',{range:'bytes=0-1,3-4'}));
 const r=await client.getMediaStream('m1',{range:'bytes=0-3'});assert.equal(r.response.status,206);
});
test('project cannot serve foreign media paths or URL-tricks',async()=>{
 const client=new FableCutClient({fetchImpl:async()=>new Response(JSON.stringify({...base,media:[{id:'m1',kind:'video',src:'/media/../private.txt'}]}),{headers:{'x-fablecut-project':'a'}})});
 await assert.rejects(client.getMediaStream('m1'));
});