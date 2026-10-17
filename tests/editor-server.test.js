import {fixture} from './helpers/editor-fixture.js';
import test from 'node:test';
import http from 'node:http';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,mkdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {createEditorServer,parseRange} from '../src/editor-server.js';
import {loadProject,prepareProject} from '../src/local-pipeline.js';
import {EditorJobs} from '../src/editor-jobs.js';
test('range parser handles full, suffix and bounded requests; rejects multi-range and invalid numbers',()=>{
 assert.deepEqual(parseRange('bytes=2-8',10),{start:2,end:8,partial:true});assert.equal(parseRange('bytes=-4',10).start,6);assert.equal(parseRange('bytes=8-99',10).end,9);
 for(const v of ['bytes=10-','bytes=3-2','bytes=0-1,4-5','bytes=-0','bytes=','bytes=9007199254740993-'])assert.throws(()=>parseRange(v,10));
});
test('HTTP app protects sessions, origins and paths; persists edits and forbids unsupported settings',async()=>{
 const f=fixture(),directory=join(f.dir,'jobs'),app=createEditorServer({directory,profiles:f.profiles});
 try{
  const launch=await app.listen(),url=launch.split('/#')[0],token=launch.split('#')[1];
  assert.equal((await fetch(url+'/api/jobs')).status,401);
  assert.equal((await fetch(url+'/',{headers:{Origin:'https://evil.example'}})).status,403);
  assert.equal(await new Promise((r,j)=>http.get(url+'/',{headers:{Host:'evil.example'}},res=>{res.resume();r(res.statusCode);}).on('error',j)),403);
  assert.equal((await fetch(url+'/%2e%2e/package.json')).status,404);
  assert.equal((await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer wrong'}})).status,401);
  const session=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+token}});assert.equal(session.status,200);
  const cookie=session.headers.get('set-cookie').split(';')[0],headers={Cookie:cookie,'Content-Type':'application/json','X-Sues-Request':'editor'};
  assert.equal((await fetch(url+'/api/jobs',{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json'},body:'{}'})).status,403);
  const create=await fetch(url+'/api/jobs',{method:'POST',headers,body:JSON.stringify({profileId:'test'})});assert.equal(create.status,201);
  const design=await (await fetch(url+'/api/design?profileId=test',{headers})).json();assert.equal(design.styles.filter(s=>s.available).length,1);assert.equal(design.motions.filter(m=>m.rendered).length,3);assert.equal(design.brand.fonts.primary,'Open Sans');
  const manifest=await (await fetch(url+'/manifest.webmanifest')).json();assert.equal(manifest.display,'standalone');
  const worker=await (await fetch(url+'/sw.js')).text();assert.ok(!worker.includes("cache.add('/api/"));
  const job=await create.json();assert.equal(job.state,'PREVIEW_READY');
  assert.throws(()=>new EditorJobs({directory,profiles:f.profiles}),/busy/);
  const bad=await fetch(url+'/api/jobs/'+job.id,{method:'PATCH',headers,body:JSON.stringify({settings:{zoomIntensity:2}})});assert.equal(bad.status,400);
  const good=await fetch(url+'/api/jobs/'+job.id,{method:'PATCH',headers,body:JSON.stringify({settings:{zoomIntensity:0,motions:false,captionOverrides:{'seg-001':'Puedes sentir.'}}})});assert.equal(good.status,200);
  const plan=await (await fetch(url+'/api/jobs/'+job.id+'/plan',{headers})).json();assert.equal(plan.manifest.captions[0].text,'Puedes sentir.');assert.equal(plan.director.decisions.length,0);
  assert.equal((await fetch(url+'/api/jobs/'+job.id+'/media',{headers})).status,409);
  const cancelled=await (await fetch(url+'/api/jobs/'+job.id+'/cancel',{method:'POST',headers,body:'{}'})).json();assert.equal(cancelled.state,'CANCELLED');
  await app.close();const restarted=new EditorJobs({directory,profiles:f.profiles});assert.equal(restarted.get(job.id).state,'CANCELLED');await restarted.close();
 }finally{if(app.server.listening)await app.close();rmSync(f.dir,{recursive:true,force:true});}
});
test('worker exports once, serves byte ranges, and records render cancellation and restart',async()=>{
 const f=fixture(),renderer=join(f.dir,'fake-worker.py');
 writeFileSync(renderer,"import pathlib,sys,time,json,hashlib\np=pathlib.Path(sys.argv[sys.argv.index('--out')+1]);s=pathlib.Path(sys.argv[sys.argv.index('--source')+1]);time.sleep(.3);p.write_bytes(b'0000ftyp89');p.with_suffix('.audit.json').write_text(json.dumps({'version':'1.0','sourcePreserved':True,'fullDecode':'pass','sourceSha256':hashlib.sha256(s.read_bytes()).hexdigest(),'outputSha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':10,'video':{'codec':'h264','width':1080,'height':1920,'fps':'30/1'},'durationEncoded':24,'audioPresent':True}))\n");
 const directory=join(f.dir,'jobs'),app=createEditorServer({directory,profiles:f.profiles,renderer});
 try{
  const launch=await app.listen(),url=launch.split('/#')[0],session=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}}),headers={Cookie:session.headers.get('set-cookie').split(';')[0],'X-Sues-Request':'editor'};
  const job=app.jobs.create('test');assert.equal(app.jobs.render(job.id).attempt,1);assert.equal(app.jobs.render(job.id).attempt,1);
  const second=app.jobs.create('test');assert.equal(app.jobs.render(second.id).state,'QUEUED');assert.equal(app.jobs.render(second.id).queuePosition,1);
  await new Promise((r,j)=>{const child=app.jobs.children.get(job.id);child.once('close',code=>code===0?r():j(new Error('fixture worker failed')));});while(app.jobs.get(job.id).state==='PUBLISHING')await new Promise(r=>setTimeout(r,10));assert.equal(app.jobs.get(job.id).state,'DONE');assert.equal(app.jobs.render(job.id).attempt,1);
  let response=await fetch(url+'/api/jobs/'+job.id+'/media',{headers:{...headers,Range:'bytes=2-5'}});assert.equal(response.status,206);assert.equal(await response.text(),'00ft');
  response=await fetch(url+'/api/jobs/'+job.id+'/media',{headers:{...headers,Range:'bytes=99-'}});assert.equal(response.status,416);
  app.jobs.render(second.id);const child=app.jobs.children.get(second.id);app.jobs.cancel(second.id);if(child)await new Promise(r=>child.once('close',r));assert.equal(app.jobs.get(second.id).state,'CANCELLED');
  // Simulate a persisted interruption after a dead worker, then reopen.
  const raw=app.jobs.get(second.id);raw.state='RENDERING';app.jobs.save(raw);await app.close();const restarted=new EditorJobs({directory,profiles:f.profiles,renderer});assert.equal(restarted.get(second.id).state,'FAILED');await restarted.close();
 }finally{if(app.server.listening)await app.close();rmSync(f.dir,{recursive:true,force:true});}
});

test('changing source bytes invalidates a prepared fingerprint, and configured source SHA is enforced',()=>{
 const f=fixture();try{const before=prepareProject(loadProject(f.profiles.test)).fingerprint;writeFileSync(join(f.dir,'source.mp4'),'different source bytes');const after=prepareProject(loadProject(f.profiles.test)).fingerprint;assert.notEqual(after,before);const config=JSON.parse(readFileSync(f.profiles.test));config.source.sha256='0'.repeat(64);writeFileSync(f.profiles.test,JSON.stringify(config));assert.throws(()=>loadProject(f.profiles.test),/SHA256 mismatch/);}finally{rmSync(f.dir,{recursive:true,force:true});}
});
