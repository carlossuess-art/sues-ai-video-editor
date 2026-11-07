import test from 'node:test';import assert from 'node:assert/strict';
import {ProgramFrameRenderer,ProgramFrameBusy} from '../../src/engine-next/program-frame.js';
const client={baseUrl:'http://127.0.0.1:7780',async getProject(){return {projectId:'p158404',data:{revision:3,width:1080,height:1920,fps:30,clips:[{start:0,duration:10}]}}}};
let launched=0;
const puppeteer={async launch(){launched++;return {async newPage(){return {goto:async()=>{},waitForFunction:async()=>{},evaluate:async()=>{},async $(id){return id==='#preview'?{evaluate:async()=>({width:1080,height:1920,data:'data:image/png;base64,'+Buffer.alloc(7000,1).toString('base64')})}:null;}}},close:async()=>{}}}};
test('rejects invalid requests without launching a browser',async()=>{
 const r=new ProgramFrameRenderer({client,puppeteer,executablePath:'/chrome'});
 await assert.rejects(r.capture({time:2,expectedRevision:2}));
 await assert.rejects(r.capture({time:-1,expectedRevision:3}));
 await assert.rejects(r.capture({time:999,expectedRevision:3}));
 assert.equal(launched,0);
});
test('real same-program interface is cached per exact frame and revision',async()=>{
 const r=new ProgramFrameRenderer({client,puppeteer,executablePath:'/chrome'});
 const a=await r.capture({time:4.5,expectedRevision:3});assert.equal(a.png.length,7000);assert.equal(a.cached,false);
 const b=await r.capture({time:4.5,expectedRevision:3});assert.equal(b.cached,true);assert.equal(launched,1);
});
test('refuses competing captures instead of launching multiple Chromium workers',async()=>{
 const r=new ProgramFrameRenderer({client,puppeteer,executablePath:'/chrome'});r.busy=true;
 await assert.rejects(r.capture({time:5,expectedRevision:3}),ProgramFrameBusy);
});
test('accepts a harmless native browser-startup revision bump but caches under final revision',async()=>{
 let revision=3;
 const changeClient={...client,async getProject(){const p=await client.getProject();p.data.revision=revision;return p;}};
 const changingPuppeteer={...puppeteer,async launch(){revision=4;return puppeteer.launch();}};
 const r=new ProgramFrameRenderer({client:changeClient,puppeteer:changingPuppeteer,executablePath:'/chrome'});
 const proof=await r.capture({time:4.5,expectedRevision:3});
 assert.equal(proof.revision,4);
 const again=await r.capture({time:4.5,expectedRevision:4});assert.equal(again.cached,true);
});
test('refuses a visual/timeline change that occurs while a browser captures',async()=>{
 let moved=false;
 const changedClient={...client,async getProject(){const p=await client.getProject();if(moved)p.data.clips[0].start=0.5;return p;}};
 const changedPuppeteer={...puppeteer,async launch(){moved=true;return puppeteer.launch();}};
 const r=new ProgramFrameRenderer({client:changedClient,puppeteer:changedPuppeteer,executablePath:'/chrome'});
 await assert.rejects(r.capture({time:4.5,expectedRevision:3}),/contents changed/);
});
test('waits for decoded source before accepting a native program frame',async()=>{
 const original=await client.getProject();
 original.data.tracks=[{id:'V1',kind:'video',hidden:false}];
 original.data.clips=[{id:'source',kind:'video',track:'V1',start:0,duration:10,disabled:false}];
 let waited=false;
 const readyPuppeteer={...puppeteer,async launch(){
  const browser=await puppeteer.launch();const newPage=browser.newPage;
  browser.newPage=async()=>{const page=await newPage();page.waitForFunction=async(_predicate,_opts,ids)=>{if(ids){waited=true;assert.deepEqual(ids,['source']);}};return page;};return browser;
 }};
 const renderer=new ProgramFrameRenderer({client:{...client,async getProject(){return structuredClone(original);}},puppeteer:readyPuppeteer,executablePath:'/chrome'});
 await renderer.capture({time:2.5,expectedRevision:3});assert.equal(waited,true);
});
test('refuses a blank program when the source never decodes',async()=>{
 const original=await client.getProject();original.data.tracks=[{id:'V1',kind:'video',hidden:false}];
 original.data.clips=[{id:'source',kind:'video',track:'V1',start:0,duration:10,disabled:false}];
 const broken={...puppeteer,async launch(){const b=await puppeteer.launch();const create=b.newPage;b.newPage=async()=>{const p=await create();p.waitForFunction=async(_fn,_opts,ids)=>{if(ids)throw Error('source not decoded');};return p;};return b;}};
 const renderer=new ProgramFrameRenderer({client:{...client,async getProject(){return structuredClone(original);}},puppeteer:broken,executablePath:'/chrome'});
 await assert.rejects(renderer.capture({time:2.5,expectedRevision:3}),/source not decoded/);
});
