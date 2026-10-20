// Real local Chromium with an actual HEVC/AAC sample. No production credentials.
import assert from 'node:assert/strict';
import {mkdirSync,copyFileSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {fixture} from '../../tests/helpers/editor-fixture.js';
import {createEditorServer} from '../../src/editor-server.js';
const [source,output]=process.argv.slice(2);if(!source||!output)throw Error('HEVC_SAMPLE OUTPUT required');
const {chromium}=await import(pathToFileURL(resolve(process.env.SUES_PLAYWRIGHT_MODULE)).href),out=resolve(output);mkdirSync(out,{recursive:true,mode:0o700});
const f=fixture();copyFileSync(source,join(f.dir,'source.mp4'));const before=readFileSync(join(f.dir,'source.mp4'));writeFileSync(join(f.dir,'fail.py'),'raise SystemExit(1)\n');const app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles,token:'c'.repeat(64),renderer:join(f.dir,'fail.py')});let browser;const checks=[],errors=[];
try{
 const url=await app.listen();browser=await chromium.launch({executablePath:process.env.SUES_CHROMIUM_PATH,args:['--no-sandbox']});
 for(const [device,viewport] of [['desktop',{width:1440,height:1000}],['mobile',{width:393,height:852}]]){
  const context=await browser.newContext({viewport}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(url);await page.waitForFunction(()=>!document.getElementById('editor-view').hidden);
  await page.locator('[data-editor-tool="material"]').click();await page.locator('#create').click();await page.waitForFunction(()=>document.getElementById('source-video').readyState>=2);
  const media=await page.locator('#source-video').evaluate(v=>({width:v.videoWidth,height:v.videoHeight,duration:v.duration}));
  if(media.width===0)await page.waitForFunction(()=>document.getElementById('player-label').textContent.includes('audio, pero no la imagen'));
  await page.locator('#view-original').click();if(media.width===0)assert.match(await page.locator('#player-label').textContent(),/audio, pero no la imagen/);
  await page.locator('#render').click();await page.waitForFunction(()=>document.getElementById('state').textContent==='Requiere atención');
  const first=(await page.locator('#source-video').getAttribute('src')).split('/')[3],snapshot=JSON.stringify(app.jobs.get(first));
  await page.locator('#render').click();await page.waitForFunction(old=>document.getElementById('source-video').getAttribute('src')!=='/api/jobs/'+old+'/source',first);await page.waitForFunction(()=>document.getElementById('state').textContent==='Requiere atención');
  const second=(await page.locator('#source-video').getAttribute('src')).split('/')[3];assert.notEqual(first,second);assert.equal(JSON.stringify(app.jobs.get(first)),snapshot);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:join(out,device+'.png'),fullPage:true});checks.push({device,actualHEVC:true,failedPreviewRetryCreatesNewVersion:true,failedVersionUnchanged:true,renderer:'DELIBERATE LOCAL FAILURE ONLY',browserDecodesSource:media.width>0,unsupportedPictureExplained:media.width===0,previewActionAvailable:await page.locator('#render').isEnabled(),noOverflow:true});await context.close();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(readFileSync(join(f.dir,'source.mp4')),before);const result={kind:'real-local-chromium-hevc-warning',browser:await browser.version(),checks,pageErrors:errors,production:false,externalCostUSD:0};writeFileSync(join(out,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser?.close();await app.close();rmSync(f.dir,{recursive:true,force:true});}
