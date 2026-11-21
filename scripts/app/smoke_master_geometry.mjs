import {pathToFileURL} from 'node:url';
if(!process.env.SUES_PLAYWRIGHT_MODULE||!process.env.SUES_CHROMIUM_PATH)throw Error('Set SUES_PLAYWRIGHT_MODULE and SUES_CHROMIUM_PATH');
const {chromium}=await import(pathToFileURL(process.env.SUES_PLAYWRIGHT_MODULE).href);
import assert from 'node:assert/strict';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {fixture} from '../../tests/helpers/editor-fixture.js';
import {createEditorServer} from '../../src/editor-server.js';
const f=fixture(),app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles});
let browser;
try{
 const launch=await app.listen(),base=launch.split('/#')[0],job=app.jobs.create('test');
 const login=await fetch(base+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}});
 const cookie=login.headers.get('set-cookie').split(';')[0];
 const headers={'Content-Type':'application/json',Cookie:cookie,'X-Sues-Request':'editor'};
 const catalog=await (await fetch(base+'/api/jobs/'+job.id+'/external-catalog',{headers})).json();
 const text='# Film Director\n> NO APROBADO / NO EJECUTAR '+catalog.sourceSha256+
 '\n### Escena 01 · GANCHO · 00:00–00:24\n- `0–24 s`: base **CARLOS**; texto editorial **PRUEBA**.\n**Posición de título/motion:** columnas x=110–500 y x=580–980, y=740–1150.\n';
 const saved=await fetch(base+'/api/jobs/'+job.id+'/master-source-brief',{method:'POST',headers,
 body:JSON.stringify({text,expectedRevision:null,expectedSourceSha256:catalog.sourceSha256,expectedTimelineFingerprint:catalog.timelineFingerprint})});
 assert.equal(saved.status,201,await saved.text());
 browser=await chromium.launch({executablePath:process.env.SUES_CHROMIUM_PATH,headless:true,args:['--no-sandbox']});
 for(const viewport of [{width:1440,height:900},{width:393,height:852}]){
  const page=await browser.newPage({viewport}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(launch);
  await page.waitForFunction(()=>document.querySelector('#profile')?.options.length>0,{timeout:15000});
  await page.evaluate(async id=>{await select(id);showView('editor');showTool('director');$('external-plan-panel').hidden=false;$('external-plan-panel').open=true;},job.id);
  await page.evaluate(()=>{ document.querySelector('#master-original-brief').open=true; document.querySelector('#external-plan-panel').hidden=false; document.querySelector('#external-plan-panel').open=true; });
  await page.locator('#master-brief-geometry').click();
  await page.waitForFunction(()=>document.querySelector('#master-brief-analysis').textContent.includes('2 rectángulos propuestos'),{timeout:15000});
  assert.match(await page.locator('#master-brief-analysis').textContent(),/x=110, y=740, 390×410/);
  assert.equal(errors.length,0,JSON.stringify(errors));
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'horizontal overflow');
  console.log('BROWSER_GEOMETRY_PASS',viewport.width);
  await page.close();
 }
}finally{if(browser)await browser.close();await app.close();rmSync(f.dir,{recursive:true,force:true});}