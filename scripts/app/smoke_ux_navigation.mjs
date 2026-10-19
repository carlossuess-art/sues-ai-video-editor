// Task-level navigation checks against the existing editor and an existing project.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createEditorServer} from '../../src/editor-server.js';
const [config,destination]=process.argv.slice(2);
if(!destination||!process.env.SUES_PLAYWRIGHT_MODULE||!process.env.SUES_CHROMIUM_PATH)throw Error('PROJECT NEW_OUTPUT; set browser module/executable environment variables');
const {chromium}=await import(pathToFileURL(resolve(process.env.SUES_PLAYWRIGHT_MODULE)).href),out=resolve(destination);mkdirSync(out,{mode:0o700});
const app=createEditorServer({directory:join(out,'jobs'),profiles:{'Material preparado':resolve(config)}});let browser;const checks=[],errors=[];
try{
 browser=await chromium.launch({executablePath:resolve(process.env.SUES_CHROMIUM_PATH),args:['--no-sandbox']});const launch=await app.listen();
 for(const [device,viewport] of [['mobile',{width:393,height:852}],['desktop',{width:1440,height:1000}]]){
  const context=await browser.newContext({viewport,locale:'es-ES'}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(launch);await page.waitForFunction(()=>document.querySelector('#queue-summary').textContent.includes('en proceso'));
  await page.click('[data-editor-section="material-panel"]');await page.click('#create');await page.waitForFunction(()=>current?.state==='PREVIEW_READY'&&!working);
  assert.equal(await page.locator('#adjustments-panel').isVisible(),true);assert.equal(await page.locator('#material-panel').isVisible(),false);assert.equal(await page.locator('#video-panel').isVisible(),false);
  await page.locator('#caption-settings > summary').click();const first=page.locator('#captions > .caption').first();await first.locator(':scope > summary').click();const text=first.locator('textarea'),original=await text.inputValue();await text.fill('Mi texto de prueba');
  await page.click('[data-editor-section="material-panel"]');await page.click('[data-editor-section="adjustments-panel"]');assert.equal(await text.inputValue(),'Mi texto de prueba');assert.equal(await page.locator('#save-status').textContent(),'Cambios sin guardar');
  await page.locator('#caption-search').fill('Mi texto de prueba');assert.equal(await page.locator('#captions > .caption:visible').count(),1);assert.match(await page.locator('#caption-search-status').textContent(),/^1 /);
  await page.locator('#caption-search').fill('zzzzzzzzzzzzzz');assert.equal(await page.locator('#captions > .caption:visible').count(),0);assert.match(await page.locator('#caption-search-status').textContent(),/^0 /);await page.locator('#caption-search').fill('');await text.fill(original);
  await page.click('#save');await page.waitForFunction(()=>!working);assert.equal(await page.locator('#error').isVisible(),false);
  await page.locator('#caption-search').fill('Te');assert.equal(await page.locator('#save-status').textContent(),'Ajustes guardados');await page.locator('#caption-search').fill('');
  await page.locator('[data-editor-section="video-panel"]').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#video-panel').isVisible(),true);assert.equal(await page.locator('#adjustments-panel').isVisible(),false);await page.click('[data-editor-section="adjustments-panel"]');
  for(const section of await page.locator('#adjustments-panel details').all())await section.evaluate(e=>e.open=false);
  assert.equal(await page.locator('[aria-current="step"]').textContent(),'2 Edición');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:join(out,device+'-edition.png'),fullPage:true});checks.push({device,singleTaskVisible:true,unsavedTextPreservedAcrossSteps:true,searchAndEmptyState:true,searchDoesNotMarkDirty:true,keyboardNativeButtons:true,noHorizontalOverflow:true});
  if(device==='desktop'&&process.env.SUES_UX_RENDER){await page.click('#export-from-settings');await page.waitForFunction(()=>current?.state==='DONE'||current?.state==='FAILED',{},{timeout:900000});assert.equal(await page.evaluate(()=>current.state),'DONE');assert.equal(await page.locator('#video-panel').isVisible(),true);assert.equal(await page.locator('#adjustments-panel').isVisible(),false);assert.equal(await page.locator('#download').isVisible(),true);const audit=await page.evaluate(()=>api('jobs/'+current.id+'/audit'));assert.equal(audit.fullDecode,'pass');assert.equal(audit.sourcePreserved,true);checks.push({primaryGenerateButton:true,resultStepAutomatic:true,realRender:'DONE',downloadVisible:true,fullDecode:'pass',sourcePreserved:true});}
  await context.close();
 }
 assert.deepEqual(errors,[]);const result={version:'1.0',browser:await browser.version(),checks,pageErrors:errors,externalCostUSD:0};writeFileSync(join(out,'result.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
}finally{await browser?.close();await app.close();}
