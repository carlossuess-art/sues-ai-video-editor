// Offline browser integration: provider responses are deliberately simulated.
// No cloud credentials, uploads, charges or render requests.
import {createEditorServer} from '../../src/editor-server.js';
import {mkdirSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const [project,destination]=process.argv.slice(2),out=resolve(destination);
mkdirSync(out,{recursive:true,mode:0o700});
const {chromium}=await import(pathToFileURL(process.env.SUES_PLAYWRIGHT_MODULE).href);
let configured=false;const calls=[];
const app=createEditorServer({directory:join(out,'jobs'),profiles:{test:resolve(project)},cloudDirector:{
 providers:()=>['gemini','openai'].map(id=>({id,label:id==='gemini'?'Gemini 3.8 Flash':'GPT-6.1 Sol',configured,automaticFallback:false})),
 generate:async({provider,catalog})=>{calls.push(provider);const plan={schema:catalog.schema,sourceSha256:catalog.sourceSha256,operations:[{type:'transition',resourceId:'warm',start:3,duration:.4}]};return {provider,plan,text:JSON.stringify(plan),usage:{simulated:true}};}
}});
let browser;const errors=[],checks=[];
try{
 const launch=await app.listen(),base=launch.split('/#')[0];
 browser=await chromium.launch({executablePath:process.env.SUES_CHROMIUM_PATH,headless:true,args:['--no-sandbox']});
 for(const [device,viewport] of [['desktop',{width:1440,height:1000}],['mobile',{width:393,height:852}]]){
  configured=false;const job=app.jobs.create('test'),context=await browser.newContext({viewport}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/?project='+job.id+'#'+app.token);
  await page.waitForFunction(()=>current&&!working);
  await page.evaluate(()=>{editingRoute='external';showTool('director');syncEditRoute();document.querySelector('#external-plan-panel').open=true;});
  await page.click('#cloud-check');await page.waitForFunction(()=>!working);
  assert.equal(await page.locator('#cloud-plan').isDisabled(),true);
  assert.match(await page.locator('#cloud-status').textContent(),/Falta configurar/);
  configured=true;
  for(const provider of ['gemini','openai']){
   await page.selectOption('#cloud-provider',provider);await page.click('#cloud-check');await page.waitForFunction(()=>!working);
   await page.click('#cloud-plan');await page.waitForFunction(()=>!working);
   assert.equal(await page.locator('#external-execute').isDisabled(),false);
   assert.match(await page.locator('#cloud-status').textContent(),/No se ha iniciado un render/);
   const text=await page.locator('#external-plan-text').inputValue();assert.equal(JSON.parse(text).operations[0].type,'transition');
   assert.equal(app.jobs.get(job.id).revision,1);assert.equal(app.jobs.children.size,0);
   checks.push({device,provider,missingCredentialBlocked:true,simulatedPlanReviewedAndSaved:true,parentUnchanged:true,renderStarted:false});
  }
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:join(out,device+'.png'),fullPage:true});
  const expected=await page.locator('#external-plan-text').inputValue();
  await page.reload();await page.waitForFunction(()=>current&&!working);
  assert.equal(await page.locator('#external-plan-text').inputValue(),expected);
  await context.close();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(calls,['gemini','openai','gemini','openai']);
 const result={checks,pageErrors:errors,cloudResponsesSimulated:true,externalCostUSD:0,liveProviderValidation:false,browser:await browser.version()};
 writeFileSync(join(out,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser?.close();await app.close();}
