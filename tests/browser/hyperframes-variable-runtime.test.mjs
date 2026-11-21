/**
 * Chromium runtime QA of the EXACT HyperFrames HTML composition with two
 * different variable sets. No render, FableCut edit or user A/V input.
 * Run with SUES_HF_PROJECT_ROOT, SUES_PUPPETEER_ROOT and SUES_QA_CHROME
 * inside the same bounded synthetic QA service used for HF native checks.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync,statSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
const localRequire=createRequire(import.meta.url);
const root=process.env.SUES_HF_PROJECT_ROOT?resolve(process.env.SUES_HF_PROJECT_ROOT):null;
const browserBin=process.env.SUES_QA_CHROME??null;
const ppRoot=process.env.SUES_PUPPETEER_ROOT??null;
const enabled=!!(root&&browserBin&&ppRoot&&existsSync(join(root,'variables.json'))&&existsSync(browserBin));
const files=new Map([
 ['/index.html','text/html; charset=utf-8'],
 ['/runtime/sequence-card-to-space.js','text/javascript; charset=utf-8'],
 ['/runtime/hook-drop-card-engine.js','text/javascript; charset=utf-8'],
 ['/vendor/gsap.min.js','text/javascript; charset=utf-8'],
 ['/vendor/Montserrat-Bold.ttf','font/ttf'],
 ['/vendor/Montserrat-ExtraBold.ttf','font/ttf']
]);
test('HF real Chromium runtime applies strict external word-frame schedule, unlike demo defaults', {skip:!enabled,timeout:60000},async()=>{
 const variables=JSON.parse(readFileSync(join(root,'variables.json'),'utf8'));
 const puppeteer=localRequire(ppRoot);
 const server=createServer((req,res)=>{
  const u=new URL(req.url,'http://127.0.0.1'),p=u.pathname==='/'?'/index.html':u.pathname;
  if(!files.has(p)){res.writeHead(404);res.end();return;}
  const file=join(root,p.slice(1));
  if(!existsSync(file)||!statSync(file).isFile()){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'content-type':files.get(p),'cache-control':'no-store'});
  res.end(readFileSync(file));
 });
 let browser;
 try{
  await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
  const url='http://127.0.0.1:'+server.address().port+'/';
  browser=await puppeteer.launch({executablePath:browserBin,headless:true,
   args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--disable-background-networking']});
  const records=[];
  for(const [mode,vars] of [['DEMO',{}],['REVIEWED',variables]]){
   const page=await browser.newPage(),errors=[];
   page.on('pageerror',error=>errors.push(String(error.message)));
   await page.evaluateOnNewDocument(v=>{window.__hyperframes={getVariables:()=>v};},vars);
   await page.goto(url,{waitUntil:'networkidle0',timeout:20000});
   await page.waitForFunction(()=>window.__suesMotionReady===true,{timeout:15000});
   const state=await page.evaluate(async()=>{
    await document.fonts.ready;
    const get=f=>{
     window.dispatchEvent(new CustomEvent('hf-seek',{detail:{time:f/30}}));
     const opacity=id=>{const node=document.getElementById(id);return node?Number(node.getAttribute('opacity')):null;};
     return {frame:Number(document.getElementById('root').dataset.frame),
      secondCardWord:opacity('motion-word-0-1'),
      secondFollowWord:opacity('follow-word-0-1'),
      speechSync:window.__suesMotionTiming};
    };
    return [get(15),get(19),get(93),get(102)];
   });
   assert.equal(errors.length,0,'Unexpected HF Chromium errors in '+mode+': '+errors.join(' | '));
   records.push({mode,state});
   await page.close();
  }
  const [demo,custom]=records;
  assert.equal(demo.state[0].frame,15);
  assert.ok(demo.state[0].secondCardWord>0,'Demo second word already revealing on F15');
  assert.equal(custom.state[0].secondCardWord,0,'Custom second word should wait until F16');
  assert.ok(custom.state[1].secondCardWord>0,'Custom second word should be visible after F16');
  assert.ok(demo.state[2].secondFollowWord>0,'Demo second follow-up word should be visible on F93');
  assert.equal(custom.state[2].secondFollowWord,0,'Reviewed follow-up waits until F99');
  assert.ok(custom.state[3].secondFollowWord>0,'Reviewed follow-up appears by F102');
  assert.equal(custom.state[0].speechSync,'EXTERNAL_REVIEWED_WORD_IDS_PREVIEW_ONLY');
  assert.equal(demo.state[0].speechSync,'SYNTHETIC_DEMO_TIMING_ONLY');
  const page=await browser.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(String(error.message)));
  await page.evaluateOnNewDocument(v=>{window.__hyperframes={getVariables:()=>v};},
   {...variables,wordScheduleJson:JSON.stringify({schema:'WRONG_SCHEDULE'})});
  await page.goto(url,{waitUntil:'networkidle0',timeout:20000});
  await page.waitForFunction(()=>document.readyState==='complete');
  assert.ok(errors.some(msg=>msg.includes('Untrusted word timing schedule')),
   'Incorrect word schedule must fail closed in actual browser');
  assert.notEqual(await page.evaluate(()=>window.__suesMotionReady),true);
  await page.close();
  console.log('HF_CHROMIUM_TIMING_PROOF '+JSON.stringify(records));
 }finally{
  if(browser)await browser.close();
  await new Promise(ok=>server.close(ok));
 }
});
