// Optional browser QA. Requires an existing local Playwright installation and browser.
// Media, cookies and screenshots stay in the private output directory, never Git.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createEditorServer} from '../../src/editor-server.js';
import {fileSha256} from '../../src/local-pipeline.js';
const [config,destination]=process.argv.slice(2);
if(!destination||!process.env.SUES_PLAYWRIGHT_MODULE||!process.env.SUES_CHROMIUM_PATH)throw Error('Usage: PROJECT NEW_OUTPUT; set SUES_PLAYWRIGHT_MODULE and SUES_CHROMIUM_PATH');
const {chromium}=await import(pathToFileURL(resolve(process.env.SUES_PLAYWRIGHT_MODULE)).href);
const out=resolve(destination);mkdirSync(out,{mode:0o700});
const app=createEditorServer({directory:join(out,'jobs'),profiles:{'Material de prueba':resolve(config)}});
let browser;const checks=[],pageErrors=[];
try{
 browser=await chromium.launch({executablePath:resolve(process.env.SUES_CHROMIUM_PATH),headless:true,args:['--no-sandbox']});
 const launch=await app.listen();
 for(const [device,viewport] of [['desktop',{width:1440,height:1000}],['mobile',{width:393,height:852}]]){
  const context=await browser.newContext({viewport,locale:'es-ES',acceptDownloads:true}),page=await context.newPage();page.on('pageerror',e=>pageErrors.push(e.message));
  const idle=async()=>{await page.waitForFunction(()=>!working);const err=await page.locator('#error').evaluate(e=>e.hidden?'':e.textContent);assert.equal(err,'');};
  const reveal=async selector=>{await page.locator(selector).first().evaluate(e=>{for(let p=e.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;});};
  const click=async selector=>{await reveal(selector);await page.click(selector);await idle();};
  await page.goto(launch);await page.waitForFunction(()=>document.querySelector('#queue-summary').textContent.includes('en proceso'));await page.waitForFunction(()=>document.querySelector('#profile').options.length>0&&design!==null);await idle();
  assert.equal(await page.evaluate(()=>location.hash),'');
  if(await page.locator('#style-id').isDisabled())await click('#duplicate');
  for(const styleId of ['SUES_CALMA','SUES_DOPAMIN']){
   await page.selectOption('#style-id',styleId);await click('#create');
   await reveal('#zoom');await page.locator('#zoom').fill('0');await reveal('#profile-images');await page.uncheck('#profile-images');await click('#save');
   const range=await page.evaluate(()=>{const first=plan.manifest.captions.find(c=>c.start>=2&&c.end<=plan.manifest.duration-5);const last=plan.manifest.captions.find(c=>c.start>=first.start&&c.end-first.start>=2&&c.end-first.start<=4);return {first:first.id,last:last.id};});
   for(const format of ['LIST','RANKING','COMPARE','REVEAL','Q&A','FLOW']){
    await page.selectOption('#elements-format',format);
    const row=page.locator('[data-element-row="'+range.first+'"]');await row.evaluate(e=>{for(let p=e;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;});
    await row.locator('[data-element-use]').check();await row.locator('[data-element-label]').fill('Idea principal');await row.locator('[data-element-secondary]').fill('Otra perspectiva');await row.locator('[data-element-number]').fill('5');await row.locator('[data-element-end]').selectOption(range.last);
    await click('#save');
    const saved=await page.evaluate(()=>({settings:current.settings,plan:plan.manifest}));assert.equal(saved.settings.styleId,styleId);assert.equal(saved.settings.elements.format,format);assert.equal(saved.plan.elements.length,1);assert.equal(saved.plan.elements[0].format,format);
    await page.reload();await page.waitForFunction(()=>current!==null&&!working&&document.querySelector('#captions textarea'));await idle();assert.equal(await page.locator('#elements-format').inputValue(),format);
    const width=await page.evaluate(()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth}));assert.ok(width.scroll<=width.viewport,JSON.stringify(width));
    checks.push({device,styleId,format,savedAndReloaded:true,noHorizontalOverflow:true});console.log(JSON.stringify({device,styleId,format,status:'PASS'}));
   }
  }
  const saved=await page.evaluate(()=>current.fingerprint);await reveal('#sfx-enabled');await page.check('#sfx-enabled');await click('#save');await click('#undo');assert.equal(await page.evaluate(()=>current.fingerprint),saved);
  const original=await page.evaluate(()=>current.id);await click('#duplicate');assert.notEqual(await page.evaluate(()=>current.id),original);assert.equal(await page.locator('#elements-format').inputValue(),'FLOW');
  await page.screenshot({path:join(out,device+'-elements.png'),fullPage:true});
  if(device==='desktop'){
   await click('#backup');assert.equal(await page.locator('#backup-download').isVisible(),true);
   const downloadEvent=page.waitForEvent('download');await page.click('#backup-download');const download=await downloadEvent,tar=join(out,'browser-project.tar');await download.saveAs(tar);
   await page.locator('.project-recovery').evaluate(e=>e.open=true);await page.locator('#recovery-file').setInputFiles(tar);await click('#recover-project');assert.match(await page.locator('#recovery-status').textContent(),/recuperado/);assert.equal(await page.locator('#elements-format').inputValue(),'FLOW');
   if(!process.env.SUES_BROWSER_SKIP_RENDER){await click('#render');await page.waitForFunction(()=>current?.state==='DONE'||current?.state==='FAILED',{},{timeout:900000});await idle();assert.equal(await page.evaluate(()=>current.state),'DONE');assert.equal(await page.locator('#elements-format').isDisabled(),true);
   const audit=await page.evaluate(()=>api('jobs/'+current.id+'/audit'));assert.equal(audit.fullDecode,'pass');assert.equal(audit.sourcePreserved,true);
   const rangeStatus=await page.evaluate(async()=>{const r=await fetch('/api/jobs/'+current.id+'/media',{headers:{Range:'bytes=0-1023'}});return {status:r.status,bytes:(await r.arrayBuffer()).byteLength};});assert.deepEqual(rangeStatus,{status:206,bytes:1024});
   const media=await app.jobs.media(await page.evaluate(()=>current.id));checks.push({device,backupDownloaded:true,recoveryThroughFileInput:true,settingsPreserved:true,realRender:'DONE',fullDecode:'pass',sourcePreserved:true,range:206,videoSha256:fileSha256(media)});}
  }
  // Measure the compact view after folding optional controls; folding must not alter settings.
  const folding=await page.evaluate(()=>{const before=JSON.stringify(current.settings);for(const e of document.querySelectorAll('details'))e.open=false;return {unchanged:before===JSON.stringify(current.settings),height:document.querySelector('#adjustments-panel').getBoundingClientRect().height,openDetails:document.querySelectorAll('details[open]').length};});
  assert.equal(folding.unchanged,true);assert.equal(folding.openDetails,0);assert.ok(folding.height<1100,JSON.stringify(folding));
  if(device==='mobile')await page.click('[data-editor-section="adjustments-panel"]');
  if(device==='mobile'){await page.waitForFunction(()=>document.querySelector('#adjustments-panel').getBoundingClientRect().top>=0&&document.querySelector('#adjustments-panel').getBoundingClientRect().top<180);assert.equal(await page.locator('#style-id').isVisible(),true);}
  await page.screenshot({path:join(out,device+'-compact.png'),fullPage:true});checks.push({device,compactPanelHeight:Math.round(folding.height),foldingPreservesSettings:true});
  await context.close();
 }
 assert.deepEqual(pageErrors,[]);
 const result={version:'1.0',browser:await browser.version(),checks,pageErrors,renderSkipped:!!process.env.SUES_BROWSER_SKIP_RENDER,externalCostUSD:0,humanAcceptance:false};writeFileSync(join(out,'result.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
}finally{await browser?.close();await app.close();}
