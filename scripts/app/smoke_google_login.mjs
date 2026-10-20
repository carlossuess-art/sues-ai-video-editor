// Real Chromium + real app HTTP; Google authorization/token/JWKS are LOCAL substitutes.
// This proves UI and security contracts, never proves a production Google login.
import assert from 'node:assert/strict';
import http from 'node:http';
import https from 'node:https';
import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {fixture} from '../../tests/helpers/editor-fixture.js';
import {googleFixture,googleConfig} from '../../tests/helpers/google-fixture.js';
import {createEditorServer} from '../../src/editor-server.js';
import {createPasswordRecord} from '../../src/editor-password-auth.js';
const [output]=process.argv.slice(2);if(!output||!process.env.SUES_PLAYWRIGHT_MODULE||!process.env.SUES_CHROMIUM_PATH)throw Error('Output and browser environment required');
const {chromium}=await import(pathToFileURL(resolve(process.env.SUES_PLAYWRIGHT_MODULE)).href);
const out=resolve(output);mkdirSync(out,{recursive:true,mode:0o700});
const f=fixture(),g=googleFixture(),password='Synthetic-OAuth-QA-2026',passwordFile=join(f.dir,'admin-password-hash'),googleOAuthFile=join(f.dir,'google-oauth.json');
writeFileSync(passwordFile,createPasswordRecord(password),{mode:0o600});writeFileSync(googleOAuthFile,JSON.stringify(googleConfig),{mode:0o600});
const original=readFileSync(join(f.dir,'source.mp4')),project=readFileSync(f.profiles.test),errors=[],checks=[];
const tlsDirectory=join(f.dir,'tls');mkdirSync(tlsDirectory,{mode:0o700});
const cert=join(tlsDirectory,'cert.pem'),key=join(tlsDirectory,'key.pem');
if(spawnSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-keyout',key,'-out',cert,'-days','1','-subj','/CN=localhost'],{stdio:'ignore'}).status!==0)throw Error('Local TLS certificate generation failed');
let app,browser;
const tls=https.createServer({key:readFileSync(key),cert:readFileSync(cert)},(req,res)=>{
 const upstream=http.request({host:'127.0.0.1',port:app.server.address().port,path:req.url,method:req.method,headers:req.headers},reply=>{res.writeHead(reply.statusCode,reply.headers);reply.pipe(res);});upstream.on('error',()=>{res.writeHead(502);res.end();});req.pipe(upstream);
});
await new Promise(r=>tls.listen(0,'127.0.0.1',r));
const origin='https://127.0.0.1:'+tls.address().port;
const options={directory:join(f.dir,'jobs'),profiles:f.profiles,passwordFile,googleOAuthFile,googleOAuthFetch:g.fetcher,publicOrigin:origin,token:'b'.repeat(64)};
app=createEditorServer(options);
const launch=()=>chromium.launch({executablePath:process.env.SUES_CHROMIUM_PATH,args:['--no-sandbox']});
async function routeApp(context){
 // Only the Google consent page is substituted. App and callback use real local HTTPS.
 await context.route('https://accounts.google.com/**',async route=>{
  const url=new URL(route.request().url());g.setNonce(url.searchParams.get('nonce'));
  const callback=origin+'/api/auth/google/callback?'+new URLSearchParams({state:url.searchParams.get('state'),code:'local-qa-code'});
  await route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Local Google substitute</title><script>location.replace('+JSON.stringify(callback)+')</script>'});
 });
}
try{
 await app.listen();options.port=app.server.address().port;browser=await launch();
 for(const [device,viewport] of [['desktop',{width:1440,height:1000}],['mobile',{width:393,height:852}]]){
  let context=await browser.newContext({viewport,serviceWorkers:'block',ignoreHTTPSErrors:true});context.setDefaultTimeout(15000);context.setDefaultNavigationTimeout(15000);await routeApp(context);let page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin);await page.waitForFunction(()=>!document.getElementById('google-login').disabled);assert.equal(await page.locator('#login-form').isVisible(),true);
  await page.screenshot({path:join(out,device+'-login.png'),fullPage:true});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.locator('#google-login').click();await page.waitForFunction(()=>document.getElementById('editor-view')?.hidden===false);assert.equal(new URL(page.url()).search,'');
  const cookie=(await context.cookies()).find(c=>c.name==='sues_session');assert.equal(cookie.secure,true);assert.equal(cookie.httpOnly,true);assert.equal(cookie.sameSite,'Strict');assert.ok(cookie.expires>Date.now()/1000+29*86400);
  assert.equal((await context.cookies()).some(c=>c.name==='sues_google'),false);
  await page.locator('[data-editor-tool="material"]').click();await page.locator('#create').click();await page.waitForFunction(()=>current?.state==='PREVIEW_READY'&&!working);const job=await page.evaluate(()=>current.id),state=await context.storageState();
  await context.close();await browser.close();await app.close();app=createEditorServer(options);await app.listen();browser=await launch();
  context=await browser.newContext({viewport,serviceWorkers:'block',storageState:state,ignoreHTTPSErrors:true});context.setDefaultTimeout(15000);await routeApp(context);page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(origin);await page.waitForFunction(()=>current!==null&&!working);assert.equal(await page.evaluate(()=>current.id),job);
  await page.locator('#logout').click();await page.waitForFunction(()=>document.getElementById('login-screen')?.hidden===false);
  // An otherwise correctly signed Google identity for a different user must be rejected.
  g.claims({email:'other@gmail.com'});await page.locator('#google-login').click();await page.waitForFunction(()=>document.getElementById('login-message')?.textContent.includes('No se pudo acceder con Google'));assert.equal(await page.locator('#editor-view').isVisible(),false);g.claims({});
  await page.locator('#login-password').fill(password);await page.locator('[data-password-toggle="login-password"]').click();assert.equal(await page.locator('#login-password').getAttribute('type'),'text');await page.locator('#login-password').press('Enter');await page.waitForFunction(()=>document.getElementById('editor-view')?.hidden===false&&current!==null&&!working);assert.equal(await page.evaluate(()=>current.id),job);
  checks.push({device,googleProvider:'LOCAL RSA SIGNED SUBSTITUTE',passwordLogin:true,passwordEye:true,googleCallback:true,otherAccountDenied:true,securePersistentCookie:true,browserAndServerRestart:true,logout:true,projectsPreserved:true,noOverflow:true});await context.close();
 }
 assert.deepEqual(readFileSync(join(f.dir,'source.mp4')),original);assert.deepEqual(readFileSync(f.profiles.test),project);assert.deepEqual(errors,[]);
 const result={kind:'real-local-chromium-google-flow',googleProvider:'MOCKED: NOT A LIVE GOOGLE LOGIN',browser:await browser.version(),checks,pageErrors:errors,production:false,externalCostUSD:0};writeFileSync(join(out,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser?.close();await app.close();await new Promise(r=>tls.close(r));rmSync(f.dir,{recursive:true,force:true});}
