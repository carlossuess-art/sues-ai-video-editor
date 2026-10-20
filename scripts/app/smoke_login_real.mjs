// Real local Chromium + HTTP auth QA. Synthetic secret and fixtures, never production.
import assert from 'node:assert/strict';
import {randomBytes,createHash} from 'node:crypto';
import {mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {fixture} from '../../tests/helpers/editor-fixture.js';
import {createEditorServer} from '../../src/editor-server.js';
import {createPasswordRecord} from '../../src/editor-password-auth.js';
const [output]=process.argv.slice(2);if(!output||!process.env.SUES_PLAYWRIGHT_MODULE||!process.env.SUES_CHROMIUM_PATH)throw Error('NEW_OUTPUT and browser environment required');
const {chromium}=await import(pathToFileURL(resolve(process.env.SUES_PLAYWRIGHT_MODULE)).href);
const out=resolve(output);mkdirSync(out,{recursive:true,mode:0o700});
const errors=[],checks=[],f=fixture(),passwordFile=join(f.dir,'password-hash'),password='Synthetic-Login-QA-2026',token='d'.repeat(64);
writeFileSync(passwordFile,createPasswordRecord(password),{mode:0o600});const source=readFileSync(join(f.dir,'source.mp4')),project=readFileSync(f.profiles.test);
const options={directory:join(f.dir,'jobs'),profiles:f.profiles,passwordFile,token};let app=createEditorServer(options),browser;
const launch=()=>chromium.launch({executablePath:process.env.SUES_CHROMIUM_PATH,args:['--no-sandbox']});
try{
 let url=(await app.listen()).split('/#')[0];options.port=app.server.address().port;browser=await launch();
 for(const [device,viewport] of [['desktop',{width:1440,height:1000}],['mobile',{width:393,height:852}]]){
  let context=await browser.newContext({viewport,locale:'es-ES'}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  const setupToken=randomBytes(32).toString('hex');writeFileSync(join(f.dir,'admin-setup.json'),JSON.stringify({version:1,tokenSha256:createHash('sha256').update(setupToken).digest('hex'),expiresAt:Math.floor(Date.now()/1000)+600}),{mode:0o600});
  await page.goto(url+'/#setup='+setupToken);await page.waitForFunction(()=>!document.getElementById('setup-screen').hidden);assert.equal(await page.evaluate(()=>location.hash),'');
  await page.locator('#setup-password').fill(password);await page.locator('[data-password-toggle="setup-password"]').click();assert.equal(await page.locator('#setup-password').getAttribute('type'),'text');await page.locator('[data-password-toggle="setup-password"]').click();assert.equal(await page.locator('#setup-password').getAttribute('type'),'password');
  await page.locator('#setup-confirmation').fill('Different-QA-Secret');await page.locator('#setup-form [type="submit"]').click();await page.waitForFunction(()=>document.getElementById('setup-message').textContent.includes('no coinciden'));
  await page.locator('#setup-confirmation').fill(password);await page.locator('[data-password-toggle="setup-confirmation"]').click();assert.equal(await page.locator('#setup-confirmation').getAttribute('type'),'text');await page.locator('[data-password-toggle="setup-confirmation"]').click();
  await page.locator('#setup-form [type="submit"]').click();await page.waitForFunction(()=>!document.getElementById('editor-view').hidden);assert.equal(await page.locator('#setup-password').inputValue(),'');
  assert.equal((await page.request.post(url+'/api/password/setup',{headers:{'X-Sues-Request':'editor'},data:{token:setupToken,password,confirmation:password}})).status(),400);
  await page.click('#logout');
  await page.waitForFunction(()=>!document.getElementById('login-screen').hidden&&document.getElementById('editor-view').hidden);
  await page.locator('.login-recovery summary').click();assert.match(await page.locator('.login-recovery').textContent(),/enlace privado de emergencia/);
  assert.equal(await page.locator('#login-email').inputValue(),'carlossuess@gmail.com');
  await page.locator('#login-password').fill('Wrong-Password-2026');await page.locator('#login-form [type="submit"]').click();await page.waitForFunction(()=>document.getElementById('login-message').textContent.includes('incorrectos'));assert.equal(await page.locator('#login-password').inputValue(),'');
  await page.locator('#login-password').fill(password);await page.locator('[data-password-toggle="login-password"]').click();assert.equal(await page.locator('#login-password').getAttribute('type'),'text');await page.locator('[data-password-toggle="login-password"]').click();await page.locator('#login-password').press('Enter');await page.waitForFunction(()=>document.getElementById('login-screen').hidden&&!document.getElementById('editor-view').hidden);
  await page.click('#create');await page.waitForFunction(()=>current?.state==='PREVIEW_READY'&&!working);const job=await page.evaluate(()=>current.id);
  const cookie=(await context.cookies()).find(c=>c.name==='sues_session');assert.equal(cookie.httpOnly,true);assert.equal(cookie.sameSite,'Strict');assert.ok(cookie.expires>Date.now()/1000+29*86400);
  await page.reload();await page.waitForFunction(()=>current!==null&&!working);assert.equal(await page.evaluate(()=>current.id),job);
  const state=await context.storageState();await context.close();await browser.close();await app.close();app=createEditorServer(options);url=(await app.listen()).split('/#')[0];browser=await launch();
  context=await browser.newContext({viewport,storageState:state});page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(url);await page.waitForFunction(()=>current!==null&&!working);assert.equal(await page.evaluate(()=>current.id),job);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:join(out,device+'-authenticated.png'),fullPage:true});
  await page.click('#logout');await page.waitForFunction(()=>!document.getElementById('login-screen').hidden);assert.equal((await page.request.get(url+'/api/jobs')).status(),401);
  await page.screenshot({path:join(out,device+'-login.png'),fullPage:true});
  await page.goto(url+'/#'+token);await page.waitForFunction(()=>document.getElementById('login-screen').hidden&&!document.getElementById('editor-view').hidden);assert.equal(await page.evaluate(()=>location.hash),'');
  checks.push({device,realForm:true,setupOneTime:true,setupConfirmation:true,passwordEyeAllFields:true,wrongPassword:true,passwordCleared:true,loginByEnter:true,reload:true,browserAndServerRestart:true,persistentCookie:true,logout:true,emergencyLink:true,projectsPreserved:true,noOverflow:true});await context.close();
 }
 assert.deepEqual(readFileSync(join(f.dir,'source.mp4')),source);assert.deepEqual(readFileSync(f.profiles.test),project);assert.deepEqual(errors,[]);
 const result={kind:'real-local-chromium-password-login',browser:await browser.version(),checks,pageErrors:errors,production:false,externalCostUSD:0};writeFileSync(join(out,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser?.close();await app.close();rmSync(f.dir,{recursive:true,force:true});}
