import {pathToFileURL} from 'node:url';
if(!process.env.SUES_PLAYWRIGHT_MODULE||!process.env.SUES_CHROMIUM_PATH)throw Error('Set SUES_PLAYWRIGHT_MODULE and SUES_CHROMIUM_PATH');
const {chromium}=await import(pathToFileURL(process.env.SUES_PLAYWRIGHT_MODULE).href);
import assert from 'node:assert/strict';
import {join} from 'node:path';import {rmSync} from 'node:fs';
import {fixture} from '../../tests/helpers/editor-fixture.js';import {createEditorServer} from '../../src/editor-server.js';
const f=fixture(),master='b'.repeat(64),context={registry:{brandId:'sues',profileId:'DOPAMIN',projectId:'p1',approvedRuleVersion:'rules-v1',
 approvedRuleIds:['r1'],requiredRuleKeys:['brand.background'],approvedReferenceIds:[],masterHashes:{tapiz:master},
 lockedMastersByMode:{'brand-sues':[{id:'tapiz',sha256:master}]},rendererCapabilities:{remotion:['text']},licensedAssets:{},canvas:{width:1080,height:1920}},
 rulebook:[{id:'r1',key:'brand.background',scope:'global',authority:'explicit-user-approval',status:'approved',value:'anthracite',supersedes:[]}]};
const app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles,masterDirectorContext:async()=>context});let browser;
try{
 const launch=await app.listen(),job=app.jobs.create('test'),base=launch.split('/#')[0];
 browser=await chromium.launch({executablePath:process.env.SUES_CHROMIUM_PATH,headless:true,args:['--no-sandbox']});
 for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
  const page=await browser.newPage({viewport});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(launch);await page.waitForFunction(()=>document.querySelector('#profile').options.length>0&&design!==null,{timeout:30000});
  await page.evaluate(async id=>{await select(id);showView('editor');showTool('director');$('external-plan-panel').hidden=false;$('external-plan-panel').open=true;},job.id);
  const cat=await (await fetch(base+'/api/jobs/'+job.id+'/external-catalog',{headers:{Cookie:'sues_session='+app.token}})).json();
  const visual={rect:{x:100,y:300,width:500,height:300},zIndex:1,opacity:1,typography:{family:'Montserrat',sizePx:80,weight:700,color:'#ffffff'},keyframes:[]};
  const story={schema:'sues-master-story/v1',sourceSha256:cat.sourceSha256,timeline:{fingerprint:cat.timelineFingerprint,timeSpace:'edit-timeline',fps:30,duration:cat.duration},visual:{mode:'brand-sues'},
   narrative:{centralMessage:'Una historia real',intendedExperience:'Recorrido visual',scenes:[{id:'intro',start:0,end:cat.duration,purpose:'Explicar la historia'}],motifs:[]},resources:[],
   operations:[{id:'texto',sceneId:'intro',start:2,end:4,track:'graphics',effect:'text',renderer:'remotion',reason:'Reforzar el mensaje',parameters:{text:'Hola',visual},dependsOn:[],requiredQA:['rendered-frame','motion-playback','narrative-review']}]};
  await page.evaluate(value=>{const t=document.querySelector('#external-plan-text');t.value=JSON.stringify(value);t.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#master-review-button').click();},story);
  await page.waitForFunction(()=>!document.querySelector('#master-review-actions').hidden,{timeout:30000});
  assert.match(await page.locator('#master-review-result').textContent(),/Una historia real/);
  const originalRevision=await page.evaluate(()=>masterReview.revision);
  await page.evaluate(()=>document.querySelector('#master-approve').click());
  await page.waitForSelector('#master-layer-controls fieldset',{state:'attached',timeout:30000});
  const dimensions=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));assert.ok(dimensions.scroll<=dimensions.width,JSON.stringify(dimensions));
  await page.evaluate(()=>{const inp=document.querySelectorAll('#master-layer-controls input');inp[0].value='170';inp[4].value='2.5';inp[5].value='4.5';inp[6].value='Texto editado';document.querySelector('#master-layer-controls button').click();});
  await page.waitForFunction(()=>document.querySelector('#master-review-result').textContent.includes('nueva versión'),{timeout:30000});
  const edited=await page.evaluate(()=>JSON.parse(document.querySelector('#external-plan-text').value).operations[0]);
  assert.equal(edited.parameters.visual.rect.x,170);assert.equal(edited.start,2.5);assert.equal(edited.end,4.5);assert.equal(edited.parameters.text,'Texto editado');
  await page.evaluate(()=>document.querySelector('#master-versions-button').click());
  await page.waitForFunction(()=>!document.querySelector('#master-versions-label').hidden,{timeout:30000});
  await page.evaluate(id=>{document.querySelector('#master-versions-select').value=id;document.querySelector('#master-version-open').click();},originalRevision);
  await page.waitForFunction(()=>document.querySelector('#master-review-result').textContent.includes('Versión recuperada'),{timeout:30000});
  assert.equal(await page.evaluate(()=>JSON.parse(document.querySelector('#external-plan-text').value).operations[0].parameters.visual.rect.x),100);
  assert.deepEqual(errors,[]);console.log('PASS browser review, approval, layer edit',viewport.width);
  await page.close();
 }
}finally{await browser?.close();await app.close();rmSync(f.dir,{recursive:true,force:true});}
