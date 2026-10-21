// Read-only backend review and browser edits; never executes a render or saves settings.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.SUES_PLAYWRIGHT_MODULE).href);
const [base,id,tokenPath,out]=process.argv.slice(2);if(!base||!id||!tokenPath||!out)throw Error('Usage: URL JOB_ID TOKEN_FILE OUTPUT_DIR');const token=readFileSync(tokenPath,'utf8').trim();
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.SUES_CHROMIUM_PATH,args:['--no-sandbox']}),checks=[],errors=[];
try{for(const [device,viewport]of [['desktop',{width:1440,height:1000}],['mobile',{width:393,height:852}]]){
 const context=await browser.newContext({viewport});await context.addCookies([{name:'sues_session',value:token,url:base,httpOnly:true,secure:true,sameSite:'Strict'}]);
 const page=await context.newPage();if(process.env.SUES_APP_OVERRIDE)await page.route('**/app.js',route=>route.fulfill({contentType:'application/javascript',body:readFileSync(process.env.SUES_APP_OVERRIDE,'utf8')}));
 page.on('pageerror',e=>errors.push(e.message));const before=await (await context.request.get(base+'/api/jobs')).json();
 await page.goto(base+'/?project='+id);await page.waitForFunction(id=>current?.id===id&&!working,id,{timeout:60000});
 await page.waitForSelector('#edit-video',{state:'visible'});assert.equal(await page.locator('#automatic-edit-panel').isVisible(),false);assert.ok(await page.isEnabled('#export-video'));
 await page.click('#view-preview');await page.waitForFunction(()=>document.getElementById('video').readyState>=2);
 await page.evaluate(()=>{document.getElementById('video').currentTime=6.8;});
 await page.waitForFunction(()=>Math.abs(document.getElementById('video').currentTime-6.8)<.1&&!document.getElementById('video').seeking);
 await page.screenshot({path:out+'/'+device+'-real-preview.png',fullPage:true});
 await page.click('#edit-video');await page.click('#choose-external');assert.ok(await page.locator('#external-plan-panel').isVisible());
 await page.click('#external-catalog');await page.waitForFunction(()=>!working);assert.match(await page.inputValue('#external-catalog-text'),/sues-edit-plan\/v1/);
 await page.click('#edit-video');await page.click('#choose-automatic');assert.equal(await page.inputValue('#new-project-style'),'SUES_CALMA');assert.ok(await page.locator('#new-style-label').isVisible());
 await page.selectOption('#new-project-style','SUES_DOPAMIN');assert.ok(await page.isDisabled('#render'));await page.click('#review-instructions');await page.waitForFunction(()=>!working);
 assert.equal(await page.locator('#error').isVisible(),false);assert.equal(await page.isEnabled('#render'),true);
 await page.uncheck('#recipe-sounds');assert.ok(await page.isDisabled('#render'));
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.equal(await page.isEnabled('#export-video'),false);
 await page.screenshot({path:out+'/'+device+'-edit-routes.png',fullPage:true});
 const after=await (await context.request.get(base+'/api/jobs')).json();
 assert.deepEqual(after.find(j=>j.id===id),before.find(j=>j.id===id));assert.deepEqual(after.map(j=>j.id).sort(),before.map(j=>j.id).sort());
 checks.push({device,twoRoutes:true,templateBeforeAnalysis:true,existingRealMp4Decoded:true,completedJobStyleChangeRequiresReview:true,completedJobCanGenerateAfterReview:true,soundChangeInvalidatesReview:true,noOverflow:true,exportAvailableBeforeChanges:true,finishedJobIntact:true,newJobCreated:false});
 await context.close();
}assert.deepEqual(errors,[]);const result={state:'SUCCESS',testedAppOverride:!!process.env.SUES_APP_OVERRIDE,checks,errors,humanCreativeAcceptance:false};writeFileSync(out+(process.env.SUES_APP_OVERRIDE?'/candidate-browser-result.json':'/browser-result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));}finally{await browser.close();}
