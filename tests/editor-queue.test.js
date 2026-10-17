import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync,readFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {fixture} from './helpers/editor-fixture.js';
import {EditorJobs} from '../src/editor-jobs.js';
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function until(test){const end=Date.now()+6000;while(!test()){if(Date.now()>end)throw new Error('Queue did not settle');await delay(20);}}
function worker(f,{badFirst=false}={}){
 const script=join(f.dir,'worker.py');writeFileSync(script,`import pathlib,sys,time,json,hashlib
p=pathlib.Path(sys.argv[sys.argv.index('--out')+1]);s=pathlib.Path(sys.argv[sys.argv.index('--source')+1]);time.sleep(.15)
marker=p.parents[2]/'first-seen'
bad=${badFirst?'True':'False'} and not marker.exists()
marker.write_text('seen')
p.write_bytes(b'0000ftyp89')
audit={'version':'1.0','sourcePreserved':True,'fullDecode':'pass','sourceSha256':hashlib.sha256(s.read_bytes()).hexdigest(),'outputSha256':('0'*64 if bad else hashlib.sha256(p.read_bytes()).hexdigest()),'bytes':10,'video':{'codec':'h264','width':1080,'height':1920,'fps':'30/1'},'durationEncoded':24,'audioPresent':True}
p.with_suffix('.audit.json').write_text(json.dumps(audit))
`);return script;
}
test('FIFO queue survives shutdown, restores order, executes once and ignores repeated submission',async()=>{
 const f=fixture(),directory=join(f.dir,'jobs'),renderer=worker(f);let jobs=new EditorJobs({directory,profiles:f.profiles,renderer,autoStart:false});
 try{
  const first=jobs.create('test'),second=jobs.create('test');jobs.render(first.id);jobs.render(second.id);
  assert.equal(jobs.view(jobs.get(first.id)).queuePosition,1);assert.equal(jobs.view(jobs.get(second.id)).queuePosition,2);jobs.render(second.id);assert.equal(jobs.queued().length,2);
  await jobs.close();jobs=new EditorJobs({directory,profiles:f.profiles,renderer});await until(()=>jobs.get(second.id).state==='DONE');
  assert.equal(jobs.get(first.id).state,'DONE');for(const id of [first.id,second.id]){assert.equal(jobs.get(id).attempt,1);assert.equal(jobs.get(id).history.filter(h=>h.state==='RENDERING').length,1);}
  const firstDone=jobs.get(first.id).history.find(h=>h.state==='DONE').at,secondStart=jobs.get(second.id).history.find(h=>h.state==='RENDERING').at;assert.ok(firstDone<=secondStart);
 }finally{await jobs.close();rmSync(f.dir,{recursive:true,force:true});}
});
test('bounded queue allows cancellation before dispatch with no worker attempt',async()=>{
 const f=fixture(),jobs=new EditorJobs({directory:join(f.dir,'jobs'),profiles:f.profiles,renderer:worker(f),maxQueued:1});
 try{
  const a=jobs.create('test'),b=jobs.create('test'),c=jobs.create('test');jobs.render(a.id);assert.equal(jobs.render(b.id).state,'QUEUED');assert.throws(()=>jobs.render(c.id),/queue full/);assert.equal(jobs.get(c.id).state,'PREVIEW_READY');
  assert.equal(jobs.cancel(b.id).state,'CANCELLED');assert.equal(jobs.get(b.id).attempt,undefined);jobs.render(c.id);await until(()=>jobs.get(c.id).state==='DONE');assert.equal(jobs.get(b.id).state,'CANCELLED');
 }finally{await jobs.close();rmSync(f.dir,{recursive:true,force:true});}
});
test('zero exit with mismatched artifact audit fails closed and queue continues without retry',async()=>{
 const f=fixture(),jobs=new EditorJobs({directory:join(f.dir,'jobs'),profiles:f.profiles,renderer:worker(f,{badFirst:true})});
 try{
  const a=jobs.create('test'),b=jobs.create('test');jobs.render(a.id);jobs.render(b.id);await until(()=>jobs.get(b.id).state==='DONE');
  assert.equal(jobs.get(a.id).state,'FAILED');assert.match(jobs.get(a.id).error,/checksum/);assert.equal(jobs.get(a.id).attempt,1);assert.throws(()=>jobs.media(a.id),/not ready/);
 }finally{await jobs.close();rmSync(f.dir,{recursive:true,force:true});}
});
test('tampered queued bundle is rejected before launch while following job proceeds',async()=>{
 const f=fixture(),jobs=new EditorJobs({directory:join(f.dir,'jobs'),profiles:f.profiles,renderer:worker(f)});
 try{
  const a=jobs.create('test'),b=jobs.create('test'),c=jobs.create('test');jobs.render(a.id);jobs.render(b.id);jobs.render(c.id);
  const path=join(jobs.dir(b.id),'bundle-1','captions.ass');writeFileSync(path,readFileSync(path,'utf8')+'\nmodified');await until(()=>jobs.get(c.id).state==='DONE');
  assert.equal(jobs.get(b.id).state,'FAILED');assert.match(jobs.get(b.id).error,/bundle changed/);assert.equal(jobs.get(b.id).attempt,undefined);assert.equal(jobs.get(a.id).state,'DONE');
 }finally{await jobs.close();rmSync(f.dir,{recursive:true,force:true});}
});
test('cancelling active export waits for its worker to stop before starting the next queued export',async()=>{
 const f=fixture(),jobs=new EditorJobs({directory:join(f.dir,'jobs'),profiles:f.profiles,renderer:worker(f)});
 try{
  const a=jobs.create('test'),b=jobs.create('test');jobs.render(a.id);jobs.render(b.id);assert.equal(jobs.get(b.id).state,'QUEUED');
  const child=jobs.children.get(a.id);jobs.cancel(a.id);assert.equal(jobs.get(a.id).state,'RENDERING');assert.equal(jobs.get(b.id).state,'QUEUED');await new Promise(r=>child.once('close',r));await until(()=>jobs.get(b.id).state==='DONE');
  assert.equal(jobs.get(a.id).state,'CANCELLED');assert.ok(jobs.get(a.id).history.find(h=>h.state==='CANCELLED').at<=jobs.get(b.id).history.find(h=>h.state==='RENDERING').at);
 }finally{await jobs.close();rmSync(f.dir,{recursive:true,force:true});}
});
