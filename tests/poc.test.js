import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {defaultPlan,buildEdit,validatePlan,validatePayload,httpsURL} from '../src/plan.js';
import {ShotstackStage,poll} from '../src/provider.js';
import {Jobs} from '../src/jobs.js';
import {run,continueJob,downloadOutput,main} from '../src/cli.js';
const dir=()=>mkdtempSync(join(tmpdir(),'sues-poc-'));
const plan=()=>defaultPlan('https://example.com/video.mp4',45);
const done={response:{status:'done',url:'https://shotstack-api-stage-output.s3.amazonaws.com/test.mp4',renderTime:123}};
const noWait={intervalMs:0};
test('compiler satisfies current official OpenAPI; contiguous cuts and top text tracks',()=>{
 const p=plan(),e=buildEdit(p);assert.equal(e.output.size.height,1920);
 const video=e.timeline.tracks.find(t=>t.clips[0].asset.type==='video').clips;
 assert.equal(video[1].start,12);assert.equal(video[1].asset.trim,13);assert.equal(video[1].length,32);
 assert.equal(e.timeline.tracks[0].clips[0].asset.type,'rich-text');
 assert.equal(video[0].fit,'contain');
});
test('invalid duration, NaN, source bounds and unsupported template rejected',()=>{
 for(const duration of [29,61,NaN,Infinity]){const p=plan();p.source.duration=duration;assert.throws(()=>buildEdit(p));}
 const p=plan();p.segments[0].out=100;assert.throws(()=>validatePlan(p));
 p.template='unknown';assert.throws(()=>buildEdit(p));
});
test('invalid URLs and captions outside timeline rejected',()=>{
 for(const url of ['file:///tmp/v.mp4','http://example.com/v.mp4','https://user:pass@host/v.mp4','https://localhost/v.mp4'])assert.throws(()=>httpsURL(url));
 const p=plan();p.texts.push({role:'caption',text:'x',start:44,length:2});assert.throws(()=>buildEdit(p));
});
test('no overlap even for parallel captions; same-track overlap rejected',()=>{
 const p=plan();p.texts.push({role:'caption',text:'Cerca de ti',start:0,length:2});assert.doesNotThrow(()=>buildEdit(p));
 const e=buildEdit(plan());e.timeline.tracks[0].clips.push(structuredClone(e.timeline.tracks[0].clips[0]));assert.throws(()=>validatePayload(e));
});
test('generative fields and unsupported asset types blocked, regardless of sandbox',()=>{
 for(const field of ['prompt','model','options','enhance','transcription']){
 const e=buildEdit(plan());e.timeline.tracks.at(-1).clips[0].asset[field]='x';assert.throws(()=>validatePayload(e));}
 const e=buildEdit(plan());e.timeline.tracks[0].clips[0].asset.type='text-to-speech';assert.throws(()=>validatePayload(e));
});
test('official schema detects incorrect text field and invalid output size',()=>{
 const e=buildEdit(plan());e.timeline.tracks[0].clips[0].asset.alignment={vertical:'center'};assert.throws(()=>validatePayload(e));
 const f=buildEdit(plan());f.output.size.height=1921;assert.throws(()=>validatePayload(f));
});
test('optional music must span timeline, be HTTPS and low volume',()=>{
 const p=plan();p.music={url:'https://example.com/music.mp3',duration:60,volume:0.1};assert.equal(buildEdit(p).timeline.tracks.at(-1).clips[0].asset.type,'audio');
 p.music.duration=2;assert.throws(()=>buildEdit(p));p.music.duration=60;p.music.volume=0.9;assert.throws(()=>buildEdit(p));
});
test('only stage and missing key fail before network',()=>{
 assert.throws(()=>new ShotstackStage({key:'test',env:'v1'}));assert.throws(()=>new ShotstackStage({key:''}));
});
test('API endpoints and auth stay in stage; HTTP error has no key/body leakage',async()=>{
 const calls=[];const c=new ShotstackStage({key:'secret-key',fetchImpl:async(u,o)=>{calls.push([u,o]);return {ok:true,status:200,json:async()=>({success:true,response:{id:'render-1'}})};}});
 await c.submit(buildEdit(plan()));await c.source('source-1');await c.deleteSource('source-1');
 assert.ok(calls.every(([u])=>u.includes('/stage/')));assert.equal(calls[0][1].headers['x-api-key'],'secret-key');
 const bad=new ShotstackStage({key:'secret-key',fetchImpl:async()=>({ok:false,status:403})});await assert.rejects(()=>bad.status('r'),e=>!e.message.includes('secret-key'));
});
test('poll handles queued/done, failed, unknown and timeout without resubmission',async()=>{
 let n=0;await poll(async()=>({status:++n===1?'queued':'done'}),r=>r.status,noWait);assert.equal(n,2);
 await assert.rejects(()=>poll(async()=>({status:'failed'}),r=>r.status,noWait));
 await assert.rejects(()=>poll(async()=>({status:'mystery'}),r=>r.status,noWait));
 await assert.rejects(()=>poll(async()=>({status:'queued'}),r=>r.status,{timeoutMs:0}));
});
test('job transition rules, locks and overwrite protection',()=>{
 const s=new Jobs(dir());const j=s.create();assert.throws(()=>s.create());assert.throws(()=>s.transition(j,'DONE'));
 const unlock=s.lock();assert.throws(()=>s.lock());unlock();const release=s.lock();release();
});
function mockClient(){let submits=0;return {get submits(){return submits;},initUpload:async()=>({data:{id:'source-1',attributes:{url:'https://unused.example/upload'}}}),upload:async()=>{},source:async()=>({data:{attributes:{status:'ready',source:'https://example.com/video.mp4',duration:45,width:1080,height:1920}}}),submit:async()=>{submits++;return {success:true,response:{id:'render-1'}};},status:async()=>done};}
test('end-to-end mocked upload to DONE; resume never duplicates render',async()=>{
 const d=dir(),file=join(d,'input.mp4');writeFileSync(file,'fake');const c=mockClient();let downloads=0;
 const download=async()=>{downloads++;};const j=await run(file,join(d,'job'),{client:c,download,pollOptions:noWait});
 assert.equal(j.state,'DONE');assert.equal(c.submits,1);assert.equal(downloads,1);
 await continueJob(new Jobs(join(d,'job')),c,{download});assert.equal(c.submits,1);assert.equal(downloads,1);
});
test('ambiguous POST is persisted and cannot auto-submit again',async()=>{
 const d=dir(),file=join(d,'in.mp4');writeFileSync(file,'fake');const c=mockClient();c.submit=async()=>{throw new Error('timeout');};
 await assert.rejects(()=>run(file,join(d,'job'),{client:c,pollOptions:noWait}));
 const s=new Jobs(join(d,'job'));assert.equal(s.load().state,'SUBMISSION_UNKNOWN');
 await assert.rejects(()=>continueJob(s,c));
});
test('download failure retains render ID for resume without another POST',async()=>{
 const d=dir(),file=join(d,'in.mp4');writeFileSync(file,'fake');const c=mockClient();
 await assert.rejects(()=>run(file,join(d,'job'),{client:c,pollOptions:noWait,download:async()=>{throw Error('network');}}));
 const s=new Jobs(join(d,'job'));assert.equal(s.load().state,'RENDERING');
 await continueJob(s,c,{pollOptions:noWait,download:async()=>{}});assert.equal(c.submits,1);assert.equal(s.load().state,'DONE');
});
test('download verifies MP4 and writes player; rejects unsafe output',async()=>{
 const d=dir();const bytes=Buffer.from([0,0,0,20,...Buffer.from('ftypisom'),0,0,0,0]);
 await downloadOutput(done.response.url,d,{fetchImpl:async()=>new Response(bytes,{headers:{'Content-Type':'video/mp4'}})});
 assert.ok(existsSync(join(d,'result.mp4')));assert.match(readFileSync(join(d,'preview.html'),'utf8'),/video src="result.mp4"/);
 await assert.rejects(()=>downloadOutput('https://evil.example/a.mp4',dir()));
 await assert.rejects(()=>downloadOutput(done.response.url,dir(),{fetchImpl:async()=>new Response('html',{headers:{'Content-Type':'text/html'}})}));
});
test('remote CLI actions require explicit stage flag',async()=>{
 for(const cmd of ['run','resume','recover','cleanup'])await assert.rejects(()=>main([cmd,'x']),/execute-stage/);
});
test('provider preprocessing state accepted; hosting opt-out required',async()=>{
 let n=0;await poll(async()=>({status:++n===1?'preprocessing':'done'}),r=>r.status,noWait);
 const e=buildEdit(plan());assert.deepEqual(e.output.destinations,[{provider:'shotstack',exclude:true}]);
 delete e.output.destinations;assert.throws(()=>validatePayload(e));
});
test('provider failure and invalid real duration leave job cleanable',async()=>{
 for(const mode of ['failed','bad-duration']) {
 const d=dir(),file=join(d,'in.mp4');writeFileSync(file,'fake');const c=mockClient();
 c.source=async()=>({data:{attributes:{status:mode==='failed'?'failed':'ready',source:'https://example.com/a.mp4',duration:75}}});
 await assert.rejects(()=>run(file,join(d,'job'),{client:c,pollOptions:noWait}));
 assert.equal(new Jobs(join(d,'job')).load().state,'FAILED');assert.equal(c.submits,0);
 }
});
test('signed S3 upload streams with explicit Content-Length instead of chunked encoding',async()=>{
 const d=dir(),file=join(d,'video.mp4');writeFileSync(file,'fake');let observed;
 const client=new ShotstackStage({key:'test',fetchImpl:async(url,options)=>{observed=options;for await(const chunk of options.body){}return {ok:true,status:200};}});
 await client.upload('https://shotstack-ingest-api-stage-sources.s3.amazonaws.com/id/source',file);
 assert.equal(observed.headers['Content-Length'],'4');assert.equal(observed.method,'PUT');
});
