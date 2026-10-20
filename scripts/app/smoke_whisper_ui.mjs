// Real HTTP/FFprobe, Chromium and MP4 render; mailbox output substituted.
// Actual Whisper inference is tested separately on the VPS, never simulated here.
import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync,rmSync,copyFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fixture} from '../../tests/helpers/editor-fixture.js';
import {createEditorServer} from '../../src/editor-server.js';
const out=resolve(process.argv[2]);mkdirSync(out,{recursive:true,mode:0o700});
const {chromium}=await import(pathToFileURL(resolve(process.env.SUES_PLAYWRIGHT_MODULE)).href);
const digest=b=>createHash('sha256').update(b).digest('hex');let browser;const checks=[],errors=[];
try{
 browser=await chromium.launch({executablePath:process.env.SUES_CHROMIUM_PATH,args:['--no-sandbox']});
 for(const [device,viewport]of [['desktop',{width:1440,height:1000}],['mobile',{width:393,height:852}]]){
  const f=fixture(),source=join(f.dir,'source.mp4');
  execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','testsrc2=s=1280x720:r=30:d=8','-f','lavfi','-i','sine=frequency=440:duration=8.05','-c:v','libx264','-preset','ultrafast','-crf','30','-pix_fmt','yuv420p','-c:a','aac','-y',source]);
  for(const n of ['OpenSans.ttf','OpenSans-Bold.ttf','OFL.txt'])copyFileSync(resolve('assets/fonts',n),join(f.dir,'fonts',n));
  const before=digest(readFileSync(source)),app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles});
  const context=await browser.newContext({viewport,acceptDownloads:true}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  const idle=()=>page.waitForFunction(()=>!working);let heartbeat;
  try{
   await page.goto(await app.listen());await page.click('#new-project');const chooser=page.waitForEvent('filechooser');await page.click('#upload');await (await chooser).setFiles(source);await page.waitForFunction(()=>!working&&pendingUploadId);
   const id=await page.evaluate(()=>pendingUploadId),mailbox=join(f.dir,'jobs','uploads','asr');
   const beat=()=>writeFileSync(join(mailbox,'worker.json'),JSON.stringify({engine:'faster-whisper-base-int8',at:Date.now()}));beat();heartbeat=setInterval(beat,3000);
   await page.fill('#project-name','Viaje QA');await page.selectOption('#new-project-style','SUES_DOPAMIN');await page.fill('#director-prompt','muchas transiciones y efectos de luz');await page.click('#review-instructions');await idle();assert.match(await page.locator('#analysis-status').textContent(),/Análisis en cola/);
   const originalRequest=readFileSync(join(mailbox,id+'.request.json'));await page.reload();await page.waitForFunction(()=>!working&&pendingUploadId);assert.equal(await page.inputValue('#project-name'),'Viaje QA');assert.equal(await page.inputValue('#new-project-style'),'SUES_DOPAMIN');assert.equal(await page.inputValue('#director-prompt'),'muchas transiciones y efectos de luz');assert.deepEqual(readFileSync(join(mailbox,id+'.request.json')),originalRequest);
   const result={sourceSha256:id,transcript:{version:'1.0',sourceDuration:8.05,language:'es',words:'Hoy viajamos juntos y disfrutamos de este momento.'.split(' ').map((text,i)=>({text,start:.4+i*.6,end:.95+i*.6}))},camera:{mode:'full-frame-fit',keyframes:[0,8.05].map(time=>({time,x:0,y:0,width:1280,height:720,zoom:1}))},vision:{method:'not-performed',frames:[0,8.05].map(time=>({time,frameWidth:1280,frameHeight:720,faces:[]}))}};
   writeFileSync(join(mailbox,id+'.result.json'),JSON.stringify(result));writeFileSync(join(mailbox,id+'.status.json'),JSON.stringify({state:'COMPLETE'}));
   await page.waitForFunction(()=>!working&&current?.state==='PREVIEW_READY'&&intakePhase==='edit');assert.equal(await page.evaluate(()=>current.settings.styleId),'SUES_DOPAMIN');assert.equal(await page.locator('#basic-edit').isVisible(),true);assert.ok(await page.locator('#basic-edit').evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;}),'template action must be on screen after analysis');assert.match(await page.locator('#director-response').textContent(),/Todavía no puedo ejecutar/);assert.equal(app.jobs.list().length,1);assert.equal(app.jobs.list()[0].attempt,0);
   await page.screenshot({path:join(out,device+'-ready.png'),fullPage:true});await page.click('#basic-edit');await page.waitForFunction(()=>current?.state==='DONE'||current?.state==='FAILED',{},{timeout:180000});assert.equal(await page.evaluate(()=>current.state),'DONE',await page.evaluate(()=>current.error));
   const job=await page.evaluate(()=>current);assert.match(job.instructions.at(-1).text,/prompt guardado no se ha aplicado/);await page.locator('#video').evaluate(v=>v.play());await page.waitForFunction(()=>document.querySelector('#video').currentTime>.1);await page.locator('#video').evaluate(v=>v.pause());
   const downloadPromise=page.waitForEvent('download');await page.click('#export-video');const downloaded=await downloadPromise;const path=join(out,device+'.mp4');await downloaded.saveAs(path);const outputHash=digest(readFileSync(path));assert.equal(outputHash,digest(await (await page.request.get(new URL('/api/jobs/'+job.id+'/media',page.url()).href)).body()));execFileSync('ffmpeg',['-v','error','-i',path,'-f','null','-']);
   assert.equal(digest(readFileSync(source)),before);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:join(out,device+'-done.png'),fullPage:true});
   checks.push({device,asr:'mailbox substituted; not real inference',httpProbe:'real',resumeAfterReload:true,projectNameAndStylePersist:true,unsupportedPromptExplicit:true,templateOnlyRequiresExplicitClick:true,actualRender:true,audioLongerThanVideoPreserved:true,fullDecode:true,downloadMatchesPreview:outputHash,originalIntact:true,noOverflow:true});
  }catch(e){await page.screenshot({path:join(out,device+'-failure.png'),fullPage:true}).catch(()=>{});throw e;}finally{clearInterval(heartbeat);await context.close();await app.close();rmSync(f.dir,{recursive:true,force:true});}
 }
 assert.deepEqual(errors,[]);writeFileSync(join(out,'result.json'),JSON.stringify({kind:'local-chromium-whisper-mailbox-ui',browser:await browser.version(),checks,errors,externalCostUSD:0},null,2));console.log(JSON.stringify(checks));
}finally{await browser?.close();}
