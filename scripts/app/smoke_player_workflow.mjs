// Developer E2E test of the local editor, not a login to the user's VPS.
import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve,join,basename} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createEditorServer} from '../../src/editor-server.js';
import {fileSha256} from '../../src/local-pipeline.js';
const [config,source,destination]=process.argv.slice(2);
if(!destination||!process.env.SUES_PLAYWRIGHT_MODULE||!process.env.SUES_CHROMIUM_PATH)throw Error('PROJECT SOURCE NEW_OUTPUT and browser environment required');
const {chromium}=await import(pathToFileURL(resolve(process.env.SUES_PLAYWRIGHT_MODULE)).href),out=resolve(destination);mkdirSync(out,{mode:0o700});
const unknown=join(out,'new-unanalysed.mp4');writeFileSync(unknown,Buffer.concat([readFileSync(source),Buffer.from('qa-source-binding')]));
const checks=[],errors=[];let browser;
try{
 browser=await chromium.launch({executablePath:resolve(process.env.SUES_CHROMIUM_PATH),args:['--no-sandbox']});
 for(const [device,viewport] of [['desktop',{width:1440,height:1000}],['mobile',{width:393,height:852}]]){
  const app=createEditorServer({directory:join(out,device+'-jobs'),profiles:{'Vídeo preparado':resolve(config)}}),context=await browser.newContext({viewport,locale:'es-ES',acceptDownloads:true}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/Content Security Policy|Refused to load media/.test(m.text()))errors.push(m.text());});
  const idle=async()=>{await page.waitForFunction(()=>!working);assert.equal(await page.locator('#error').isVisible(),false,await page.locator('#error').textContent());};
  const playable=async selector=>{await page.waitForFunction(id=>{const v=document.querySelector(id);return v.readyState>=2&&Number.isFinite(v.duration)&&v.duration>0&&!v.error;},selector);await page.locator(selector).evaluate(async e=>{e.currentTime=0;await e.play();});await page.waitForFunction(id=>document.querySelector(id).currentTime>.15,selector);await page.locator(selector).evaluate(e=>e.pause());};
  try{
   await page.goto(await app.listen());await page.waitForFunction(()=>document.querySelector('#queue-summary').textContent.includes('en proceso'));await page.click('#create');await page.waitForFunction(()=>current?.state==='PREVIEW_READY'&&!working);assert.ok(await page.locator('#captions textarea').count()>0);await page.getByRole('button',{name:'Vídeo',exact:true}).click();
   await page.locator('#upload-video').setInputFiles(unknown);await playable('#source-video');assert.match(await page.locator('#selected-video-status').textContent(),/new-unanalysed.mp4/);
   await page.click('#upload');await idle();await playable('#source-video');assert.equal(await page.evaluate(()=>current),null);assert.equal(await page.locator('#captions textarea').count(),0);assert.equal(await page.locator('#create').isDisabled(),true);assert.equal(await page.locator('#render').isDisabled(),true);assert.equal(await page.locator('#export-video').isDisabled(),true);
   await page.reload();await page.waitForFunction(()=>document.querySelector('#uploads .upload-card')&&document.querySelector('#queue-summary').textContent.includes('en proceso'));assert.equal(await page.evaluate(()=>current),null);assert.equal(await page.locator('#captions textarea').count(),0);await page.locator('#uploads').getByRole('button',{name:'Ver original',exact:true}).click();await playable('#source-video');
   await page.locator('#upload-video').setInputFiles(resolve(source));await playable('#source-video');await page.click('#upload');await page.waitForFunction(()=>current?.state==='PREVIEW_READY'&&!working);await idle();await playable('#source-video');
   assert.equal(await page.locator('#export-video').isDisabled(),true);assert.equal(await page.locator('#video-panel').isVisible(),true);if(process.env.SUES_UPLOAD_ONLY){checks.push({device,sourceChangeClearsExistingTranscript:true,reloadKeepsNewUnanalysedSource:true,localAndServerOriginalPlayback:true,knownUploadReady:true});continue;}
   await page.getByRole('button',{name:'Estilo',exact:true}).click();await page.selectOption('#style-id','SUES_DOPAMIN');await idle();assert.equal(await page.locator('#source-video').isVisible(),true);
   await page.getByRole('button',{name:'Sonido',exact:true}).click();assert.equal(await page.locator('#source-video').isVisible(),true);await page.getByRole('button',{name:'Estilo',exact:true}).click();
   await page.click('#render');await page.waitForFunction(()=>!working&&(current?.state==='DONE'||current?.state==='FAILED'),null,{timeout:900000});await idle();assert.equal(await page.evaluate(()=>current.state),'DONE');await playable('#video');assert.equal(await page.locator('#export-video').isDisabled(),false);assert.equal(await page.locator('#view-preview').getAttribute('aria-pressed'),'true');
   const first=await page.evaluate(()=>({id:current.id,attempt:current.attempt}));const previewHash=fileSha256(await app.jobs.media(first.id));
   const downloadEvent=page.waitForEvent('download');await page.click('#export-video');const download=await downloadEvent,downloadPath=join(out,device+'-export.mp4');await download.saveAs(downloadPath);assert.equal(fileSha256(downloadPath),previewHash);assert.deepEqual(await page.evaluate(()=>({id:current.id,attempt:current.attempt})),first);
   await page.locator('#motion-settings > summary').click();await page.locator('#zoom').fill('0');assert.equal(await page.locator('#export-video').isDisabled(),true);assert.match(await page.locator('#player-label').textContent(),/cambios sin aplicar/);
   await page.screenshot({path:join(out,device+'-pending-changes.png'),fullPage:true});
   if(device==='desktop'){
    await page.click('#render');await page.waitForFunction(id=>current?.id!==id,first.id);await page.waitForFunction(()=>!working&&(current?.state==='DONE'||current?.state==='FAILED'),null,{timeout:900000});await idle();assert.equal(await page.evaluate(()=>current.state),'DONE');assert.notEqual(await page.evaluate(()=>current.id),first.id);await playable('#video');assert.equal(await page.locator('#export-video').isDisabled(),false);assert.equal(app.jobs.get(first.id).state,'DONE');
   }
   const audit=await page.evaluate(()=>api('jobs/'+current.id+'/audit'));assert.equal(audit.fullDecode,'pass');assert.equal(audit.sourcePreserved,true);
   await page.screenshot({path:join(out,device+'-player.png'),fullPage:true});
   const box=await page.locator('#video-panel').boundingBox(),rail=await page.locator('#editor-shortcuts').boundingBox();assert.ok(box.height>200&&box.y+box.height<=viewport.height+50,JSON.stringify(box));assert.ok(rail.y<viewport.height);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   checks.push({device,localSelectionPlays:true,uploadPlays:true,uploadSurvivesReload:true,unknownUploadDoesNotInheritTranscript:true,toolsKeepPlayerVisible:true,previewActuallyPlays:true,exportBlockedBeforePreviewAndAfterChanges:true,exportMatchesPreviewSha256:previewHash,exportDoesNotRenderAgain:true,updatedPreviewCreatesNewVersion:device==='desktop',fullDecode:'pass',sourcePreserved:true,noHorizontalOverflow:true});console.log(JSON.stringify({device,status:'PASS'}));
  }catch(error){await page.screenshot({path:join(out,device+'-failure.png'),fullPage:true}).catch(()=>{});throw error;}finally{await context.close();await app.close();}
 }
 assert.deepEqual(errors,[]);const result={version:'1.0',browser:await browser.version(),checks,pageErrors:errors,externalCostUSD:0,kind:'local-video-playback-preview-and-export-test',sourceSha256:fileSha256(source)};writeFileSync(join(out,'result.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
}finally{await browser?.close();}
