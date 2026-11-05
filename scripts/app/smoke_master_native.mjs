// Isolated UI smoke: synthetic source, policy fixtures and queued worker; no render or network provider.
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {fixture} from '../../tests/helpers/editor-fixture.js';
import {createEditorServer} from '../../src/editor-server.js';
if(!process.env.SUES_PLAYWRIGHT_MODULE||!process.env.SUES_CHROMIUM_PATH)throw Error('Browser paths required');
const {chromium}=await import(pathToFileURL(process.env.SUES_PLAYWRIGHT_MODULE).href),f=fixture(),master='b'.repeat(64);
const context={registry:{brandId:'sues',profileId:'CALMA',projectId:'p1',approvedRuleVersion:'rules-v1',approvedRuleIds:['r1'],requiredRuleKeys:['brand.background'],approvedReferenceIds:[],masterHashes:{tapiz:master},lockedMastersByMode:{'brand-sues':[{id:'tapiz',sha256:master}]},rendererCapabilities:{native:['transition-native']},licensedAssets:{}},rulebook:[{id:'r1',key:'brand.background',scope:'global',authority:'explicit-user-approval',status:'approved',value:'anthracite',supersedes:[]}]};
const app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles,masterDirectorContext:async()=>context});let browser;
try{
 const launch=await app.listen(),base=launch.split('/#')[0];app.jobs.autoStart=false;
 browser=await chromium.launch({executablePath:process.env.SUES_CHROMIUM_PATH,headless:true,args:['--no-sandbox']});
 for(const [viewport,mode] of [[{width:1440,height:1000},'approve'],[{width:390,height:844},'autonomous']]){
  const job=app.jobs.create('test'),page=await browser.newPage({viewport}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(launch);await page.waitForFunction(()=>document.querySelector('#profile').options.length>0&&design!==null,{timeout:30000});
  await page.evaluate(async id=>{await select(id);showView('editor');showTool('director');$('external-plan-panel').hidden=false;$('external-plan-panel').open=true;},job.id);
  const c=await (await fetch(base+'/api/jobs/'+job.id+'/external-catalog',{headers:{Cookie:'sues_session='+app.token}})).json();
  const story={schema:'sues-master-story/v1',sourceSha256:c.sourceSha256,timeline:{fingerprint:c.timelineFingerprint,timeSpace:'edit-timeline',fps:30,duration:c.duration},visual:{mode:'brand-sues'},narrative:{centralMessage:'Una historia real',intendedExperience:'Ritmo y calma',scenes:[{id:'s1',start:0,end:c.duration,purpose:'Desarrollar el mensaje'}],motifs:[]},resources:[],operations:[{id:'o1',sceneId:'s1',start:2,end:2.4,track:'transition',effect:'transition-native',renderer:'native',reason:'Expresar un cambio real',parameters:{kind:'warm'},dependsOn:[],requiredQA:['rendered-frame','motion-playback']}]};
  await page.evaluate(value=>{const t=document.querySelector('#external-plan-text');t.value=JSON.stringify(value);t.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#master-review-button').click();},story);
  await page.waitForFunction(()=>!document.querySelector('#master-review-actions').hidden,{timeout:30000});
  await page.evaluate(selector=>document.querySelector(selector).click(),mode==='approve'?'#master-approve':'#master-autonomous');
  if(mode==='approve'){await page.waitForFunction(()=>[...document.querySelectorAll('#master-layer-controls button')].some(x=>x.textContent==='Crear versión editable'),{timeout:30000});await page.evaluate(()=>[...document.querySelectorAll('#master-layer-controls button')].find(x=>x.textContent==='Crear versión editable').click());}
  for(let i=0;i<300&&!app.jobs.list().some(j=>j.parentId===job.id);i++)await new Promise(r=>setTimeout(r,100));
  assert.ok(app.jobs.list().some(j=>j.parentId===job.id),`no child for ${mode}`);assert.equal(app.jobs.get(job.id).state,'PREVIEW_READY');assert.deepEqual(errors,[]);
  console.log('PASS native version '+mode+' '+viewport.width);await page.close();
 }
}finally{if(browser)await browser.close();await app.close();rmSync(f.dir,{recursive:true,force:true});}
