// Local synthetic E2E only; no Work credential state or production media involved.
import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fixture} from '../../tests/helpers/editor-fixture.js';
import {createEditorServer} from '../../src/editor-server.js';
const out=resolve(process.argv[2]);mkdirSync(out,{recursive:true,mode:0o700});
const {chromium}=await import(pathToFileURL(resolve(process.env.SUES_PLAYWRIGHT_MODULE)).href);
const f=fixture(),source=join(f.dir,'source.mp4');
execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','color=c=0x174956:s=1080x1920:r=30:d=8','-f','lavfi','-i','sine=frequency=440:sample_rate=48000:duration=8','-vf','drawbox=x=120:y=420:w=840:h=1080:color=0x328e9b:t=fill','-c:v','libx264','-preset','ultrafast','-crf','30','-pix_fmt','yuv420p','-c:a','aac','-shortest','-y',source]);
const cfg=JSON.parse(readFileSync(f.profiles.test));cfg.source.duration=8;writeFileSync(f.profiles.test,JSON.stringify(cfg));
const transcript=JSON.parse(readFileSync(join(f.dir,'transcript.json')));transcript.sourceDuration=8;transcript.words.forEach((w,i)=>{w.start=.5+i*.35;w.end=.5+(i+1)*.35;});writeFileSync(join(f.dir,'transcript.json'),JSON.stringify(transcript));
for(const name of ['camera','vision']){const p=join(f.dir,name+'.json'),v=JSON.parse(readFileSync(p));(v.keyframes??v.frames)[1].time=8;writeFileSync(p,JSON.stringify(v));}
const sha=b=>createHash('sha256').update(b).digest('hex'),before=sha(readFileSync(source));let browser;const checks=[],errors=[];
try{
 browser=await chromium.launch({executablePath:process.env.SUES_CHROMIUM_PATH,args:['--no-sandbox']});
 for(const [device,viewport] of [['desktop',{width:1440,height:1000}],['mobile',{width:393,height:852}]]){
  const app=createEditorServer({directory:join(f.dir,device),profiles:f.profiles}),context=await browser.newContext({viewport,acceptDownloads:true}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  const idle=async()=>{await page.waitForFunction(()=>!working);assert.equal(await page.locator('#error').isVisible(),false,await page.locator('#error').textContent());};
  const waitDone=async()=>{await page.waitForFunction(()=>!working&&current&&['DONE','FAILED','PUBLISH_FAILED'].includes(current.state),null,{timeout:240000});assert.equal(await page.evaluate(()=>current.state),'DONE',await page.locator('#error').textContent());};
  try{
   await page.goto(await app.listen());await page.locator('#dashboard-view').waitFor({state:'visible'});assert.equal(await page.locator('#editor-view').isVisible(),false);
   await page.screenshot({path:join(out,device+'-dashboard-empty.png'),fullPage:true});await page.click('#new-project');await page.locator('#project-name').fill('Reel de prueba');await page.locator('#director-prompt').fill('Música al 8 %; menos zoom');await page.click('#create');await idle();
   assert.equal(await page.locator('#director-prompt').inputValue(),'Música al 8 %; menos zoom');
   const first=await page.evaluate(()=>current.id),snapshot=JSON.stringify(app.jobs.get(first));
   await page.locator('#director-prompt').fill('menos zoom; elimina repeticiones');await page.click('#render');await page.waitForFunction(()=>!working&&document.getElementById('error').textContent.includes('no compatibles'));assert.equal(app.jobs.list().length,1);
   await page.locator('#director-prompt').fill('Música al 8 %; menos zoom');await page.click('#review-instructions');await idle();assert.match(await page.locator('#director-response').textContent(),/Música al 8/);
   await page.click('#render');await waitDone();const ready=await page.evaluate(()=>current);assert.equal(ready.settings.zoomIntensity,.75);assert.equal(ready.settings.musicGain,.08);assert.equal(JSON.stringify(app.jobs.get(first)),snapshot);
   await page.locator('#video').evaluate(async v=>{await v.play();});await page.waitForFunction(()=>document.getElementById('video').currentTime>.15);await page.locator('#video').evaluate(v=>v.pause());
   const downloadPromise=page.waitForEvent('download');await page.click('#export-video');const download=await downloadPromise,file=join(out,device+'-download.mp4');await download.saveAs(file);assert.equal(await download.failure(),null);
   const preview=await page.evaluate(async()=>{const r=await fetch('/api/jobs/'+current.id+'/media');return Array.from(new Uint8Array(await r.arrayBuffer()));});const hash=sha(readFileSync(file));assert.equal(hash,sha(Buffer.from(preview)));assert.equal(app.jobs.get(ready.id).attempt,1);
   const audit=await page.evaluate(()=>api('jobs/'+current.id+'/audit'));assert.equal(audit.fullDecode,'pass');assert.equal(audit.sourcePreserved,true);
   await page.screenshot({path:join(out,device+'-editor.png'),fullPage:true});
   if(device==='desktop'){
    await page.click('[data-editor-tool="style"]');await page.locator('#motion-settings').evaluate(e=>e.open=true);await page.locator('#zoom').fill('50');await page.locator('#zoom').dispatchEvent('input');assert.equal(await page.locator('#export-video').isDisabled(),true);
    await page.locator('#director-prompt').fill('Sin música');await page.click('#render');await waitDone();const adjusted=await page.evaluate(()=>current);assert.equal(adjusted.settings.zoomIntensity,.5);assert.equal(adjusted.settings.musicEnabled,false);assert.equal(adjusted.instructions.length,2);assert.equal(app.jobs.get(ready.id).state,'DONE');
   }
   await page.click('#back-projects');assert.equal(await page.locator('.project-card').count(),1);await page.screenshot({path:join(out,device+'-dashboard.png'),fullPage:true});await page.reload();await page.locator('#dashboard-view').waitFor({state:'visible'});assert.equal(await page.locator('.project-card').count(),1);
   await page.locator('#project-search').fill('inexistente');assert.equal(await page.locator('.project-card').count(),0);await page.locator('#project-search').fill('Reel');await page.locator('.project-card').click();await idle();assert.equal(await page.locator('#instruction-list .instruction-entry').count(),device==='desktop'?2:1);
   await page.reload();await page.locator('#video').waitFor({state:'visible'});await page.waitForFunction(()=>!working&&current?.state==='DONE');assert.equal(await page.locator('#director-title').textContent(),'¿Qué quieres cambiar?');
   for(const tool of ['director','style','captions','sound','sfx','media','material']){await page.click('[data-editor-tool="'+tool+'"]');assert.equal(await page.locator('#video-panel').isVisible(),true);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow '+device+' '+tool);}
   await page.click('[data-editor-tool="director"]');await page.screenshot({path:join(out,device+'-editor-final.png'),fullPage:true});assert.equal(sha(readFileSync(source)),before);checks.push({device,dashboardGroupsVersions:true,newProjectNamed:true,unsupportedInstructionDoesNotRender:true,promptAppliesRealSettings:true,manualAndPromptCompose:device==='desktop'?'pass':'not-run',historyAndReload:true,actualRender:true,playback:true,downloadMatchesPreviewSHA256:hash,fullDecode:'pass',sourcePreserved:true,noOverflow:true});console.log(device+' PASS');
  }catch(e){await page.screenshot({path:join(out,device+'-failure.png'),fullPage:true}).catch(()=>{});throw e;}finally{await context.close();await app.close();}
 }
 assert.deepEqual(errors,[]);const result={kind:'local-synthetic-project-director-chromium',browser:await browser.version(),checks,pageErrors:errors,externalCostUSD:0,production:false};writeFileSync(join(out,'result.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
}finally{await browser?.close();rmSync(f.dir,{recursive:true,force:true});}
