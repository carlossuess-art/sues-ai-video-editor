// Real Chromium + HTTP/FFprobe upload checks. Renderer deliberately not started.
import assert from 'node:assert/strict';
import {mkdirSync,copyFileSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {fixture} from '../../tests/helpers/editor-fixture.js';
import {createEditorServer} from '../../src/editor-server.js';
const [sample,destination]=process.argv.slice(2),out=resolve(destination);mkdirSync(out,{recursive:true});
const {chromium}=await import(pathToFileURL(resolve(process.env.SUES_PLAYWRIGHT_MODULE)).href);let browser;const checks=[],errors=[];
const hash=b=>createHash('sha256').update(b).digest('hex');
try{
 browser=await chromium.launch({executablePath:process.env.SUES_CHROMIUM_PATH,args:['--no-sandbox']});
 for(const [device,viewport] of [['desktop',{width:1440,height:1000}],['mobile',{width:393,height:852}]]){
  const f=fixture(),source=join(f.dir,'source.mp4');copyFileSync(sample,source);const before=hash(readFileSync(source));
  const cfg=JSON.parse(readFileSync(f.profiles.test));cfg.source.duration=8;cfg.source.sha256=before;writeFileSync(f.profiles.test,JSON.stringify(cfg));
  const transcript=JSON.parse(readFileSync(join(f.dir,'transcript.json')));transcript.sourceDuration=8;transcript.words.forEach((w,i)=>{w.start=.5+i*.35;w.end=.5+(i+1)*.35;});writeFileSync(join(f.dir,'transcript.json'),JSON.stringify(transcript));
  for(const name of ['camera','vision']){const p=join(f.dir,name+'.json'),v=JSON.parse(readFileSync(p));(v.keyframes??v.frames)[1].time=8;writeFileSync(p,JSON.stringify(v));}
  const bad=join(f.dir,'invalid.mp4'),unknown=join(f.dir,'unknown.mp4');writeFileSync(bad,'not a video');writeFileSync(unknown,Buffer.concat([readFileSync(source),Buffer.from('qa-different-source')]));
  const app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles});app.jobs.autoStart=false;let responseGate=null,acceptedNotify;app.server.prependListener('request',(req,res)=>{if(responseGate&&req.url.startsWith('/api/uploads?')){const gate=responseGate,end=res.end.bind(res);res.end=(...args)=>{if(res.statusCode===201)acceptedNotify?.();void gate.then(()=>end(...args));return res;};}});
  const context=await browser.newContext({viewport}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  const choose=async file=>{const chooser=page.waitForEvent('filechooser');await page.click('#upload');await (await chooser).setFiles(file);};
  try{
   await page.goto(await app.listen());await page.locator('#new-project').click();assert.equal(await page.locator('#director-panel').isVisible(),false);assert.equal(await page.locator('#editor-shortcuts').isVisible(),false);assert.equal(await page.locator('#video-panel').isVisible(),false);
   const button=await page.locator('#upload').boundingBox();assert.ok(button.y<300);await page.screenshot({path:join(out,device+'-upload.png'),fullPage:true});
   await choose(bad);await page.waitForFunction(()=>!working&&document.getElementById('upload-step').dataset.state==='error');assert.equal(await page.locator('#director-panel').isVisible(),false);assert.notEqual(await page.locator('#upload-status').textContent(),'Subida completada');assert.equal(app.jobs.list().length,0);
   let release;responseGate=new Promise(r=>release=r);const accepted=new Promise(r=>acceptedNotify=r);
   await choose(source);await Promise.race([accepted,new Promise((_,reject)=>{const timer=setTimeout(()=>reject(Error('Validated upload response timed out')),15000);timer.unref();})]);assert.equal(await page.locator('#director-panel').isVisible(),false);assert.equal(await page.locator('#editor-shortcuts').isVisible(),false);assert.equal(await page.locator('#upload-step').getAttribute('data-state'),'uploading');release();responseGate=null;
   await page.waitForFunction(()=>!working&&current?.state==='PREVIEW_READY'&&document.getElementById('upload-step').dataset.state==='complete');
   assert.equal(await page.locator('#upload-meter').inputValue().catch(()=>page.locator('#upload-meter').evaluate(e=>e.value)),100);assert.equal(await page.locator('#upload-status').textContent(),'Subida completada');assert.equal(await page.locator('#upload-status').evaluate(e=>getComputedStyle(e).color),'rgb(121, 239, 183)');assert.equal(await page.locator('#review-instructions').textContent(),'Enviar prompt');
   assert.equal(await page.locator('#render').isVisible(),false);assert.equal(await page.locator('#editor-shortcuts').isVisible(),false);assert.equal(await page.locator('#director-panel').isVisible(),true);
   const order=await page.evaluate(()=>document.getElementById('upload-step').getBoundingClientRect().top<document.getElementById('director-panel').getBoundingClientRect().top);assert.equal(order,true);
   await page.screenshot({path:join(out,device+'-complete-prompt.png'),fullPage:true});
   await page.reload();await page.waitForFunction(()=>!working&&current?.state==='PREVIEW_READY');assert.equal(await page.locator('#review-instructions').textContent(),'Enviar prompt');assert.equal(await page.locator('#editor-shortcuts').isVisible(),false);
   await page.locator('#director-prompt').fill('menos zoom');await page.click('#review-instructions');await page.waitForFunction(()=>!working&&intakePhase==='edit');assert.equal(await page.locator('#editor-shortcuts').isVisible(),true);assert.equal(await page.locator('#render').isVisible(),true);assert.equal(app.jobs.list().length,1);assert.equal(app.jobs.get((await page.evaluate(()=>current.id))).attempt??0,0);
   await page.click('#render');await page.waitForFunction(()=>!working&&current?.state==='QUEUED');assert.equal(await page.evaluate(()=>current.settings.zoomIntensity),.75);assert.equal(app.jobs.list().length,2);
   await page.click('#back-projects');await page.click('#new-project');await choose(unknown);await page.waitForFunction(()=>!working&&document.getElementById('upload-step').dataset.state==='complete');assert.equal(await page.locator('#director-panel').isVisible(),true);assert.equal(await page.locator('#review-instructions').isEnabled(),true);assert.match(await page.locator('#director-context').textContent(),/Whisper local/);await page.locator('#director-prompt').fill('Mi encargo para este vídeo');await page.click('#review-instructions');await page.waitForFunction(()=>!working&&document.getElementById('director-response').textContent.includes('Prompt guardado'));await page.reload();await page.waitForFunction(()=>!working&&pendingUploadId);assert.equal(await page.locator('#director-prompt').inputValue(),'Mi encargo para este vídeo');await page.click('#back-projects');assert.equal(await page.locator('.project-card').count(),2);await page.getByRole('button',{name:'Abrir proyecto unknown.mp4',exact:true}).click();await page.waitForFunction(()=>!working&&pendingUploadId);assert.equal(await page.locator('#director-prompt').inputValue(),'Mi encargo para este vídeo');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.equal(hash(readFileSync(source)),before);
   checks.push({device,uploadFirst:true,buttonOpensPickerAndUploads:true,invalidVideoDoesNotComplete:true,promptHiddenUntilServerAccepts:true,completedGreenBar100:true,promptBeforeTools:true,promptSubmissionDoesNotRender:true,queuedSettingsCorrect:true,promptStepSurvivesReload:true,unknownSourceBriefSavedAndResumed:true,unknownSourceAnalysisLimitExplained:true,sourcePreserved:true,renderer:'NOT EXECUTED',production:false});
  }catch(e){await page.screenshot({path:join(out,device+'-failure.png'),fullPage:true}).catch(()=>{});throw e;}finally{await context.close();await app.close();rmSync(f.dir,{recursive:true,force:true});}
 }
 assert.deepEqual(errors,[]);const result={kind:'real-local-chromium-upload-first',checks,pageErrors:errors,externalCostUSD:0};writeFileSync(join(out,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser?.close();}
