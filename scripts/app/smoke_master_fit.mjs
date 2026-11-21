import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {join} from 'node:path';import {rmSync} from 'node:fs';
import {fixture} from '../../tests/helpers/editor-fixture.js';import {createEditorServer} from '../../src/editor-server.js';
if(!process.env.SUES_PLAYWRIGHT_MODULE||!process.env.SUES_CHROMIUM_PATH)throw Error('Browser paths required');
const {chromium}=await import(pathToFileURL(process.env.SUES_PLAYWRIGHT_MODULE).href);
const f=fixture(),master='b'.repeat(64),image='c'.repeat(64);
const context={registry:{brandId:'sues',profileId:'DOPAMIN',projectId:'p1',approvedRuleVersion:'rules-v1',
 approvedRuleIds:['r1'],requiredRuleKeys:['brand.background'],approvedReferenceIds:[],arcPolicy:'reel-observed-v2',
 wordAnchors:{word:{time:1,text:'Hola'}},masterHashes:{tapiz:master},lockedMastersByMode:{'brand-sues':[{id:'tapiz',sha256:master}]},
 rendererCapabilities:{remotion:['image-exact']},licensedAssets:{[image]:{sha256:image,kind:'image',rightsVerified:true,commercialUseAllowed:true}},canvas:{width:1080,height:1920},verifiedFonts:{}},
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
  const story={schema:'sues-master-story/v1',sourceSha256:cat.sourceSha256,timeline:{fingerprint:cat.timelineFingerprint,timeSpace:'edit-timeline',fps:30,duration:cat.duration},visual:{mode:'brand-sues'},
   narrative:{centralMessage:'Una historia real',intendedExperience:'Recorrido visual',scenes:[{id:'intro',start:0,end:cat.duration,purpose:'Explicar la historia'}],motifs:[],arc:[{id:'momento',phase:'development',start:0,end:cat.duration,purpose:'Explicar la historia',evidence:[{kind:'transcript-word',wordId:'word'}]}]},
   resources:[{id:'image-1',source:'library',assetId:image,expectedSha256:image}],
   operations:[{id:'imagen',sceneId:'intro',start:2,end:4,track:'graphics',effect:'image-exact',renderer:'remotion',reason:'Reforzar el mensaje',resourceRef:'image-1',parameters:{fit:'fill',visual:{rect:{x:100,y:300,width:500,height:300},zIndex:1,opacity:1,keyframes:[]}},dependsOn:[],requiredQA:['rendered-frame','motion-playback','narrative-review']}]};
  await page.evaluate(value=>{const t=document.querySelector('#external-plan-text');t.value=JSON.stringify(value);t.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#master-review-button').click();},story);
  await page.waitForFunction(()=>!document.querySelector('#master-review-actions').hidden,{timeout:30000});
  await page.evaluate(()=>document.querySelector('#master-approve').click());
  await page.waitForFunction(()=>[...document.querySelectorAll('#master-layer-controls label')].some(l=>l.textContent.startsWith('Ajuste del recurso')),{timeout:30000});
  await page.evaluate(()=>{const label=[...document.querySelectorAll('#master-layer-controls label')].find(l=>l.textContent.startsWith('Ajuste del recurso'));label.querySelector('select').value='cover';label.closest('fieldset').querySelector('[data-master-save]').click();});
  await page.waitForFunction(()=>document.querySelector('#master-review-result').textContent.includes('nueva versión'),{timeout:30000});
  assert.equal(await page.evaluate(()=>JSON.parse(document.querySelector('#external-plan-text').value).operations[0].parameters.fit),'cover');
  await page.evaluate(()=>document.querySelector('#master-review-button').click());await page.waitForFunction(()=>!document.querySelector('#master-review-actions').hidden,{timeout:30000});
  await page.evaluate(()=>document.querySelector('#master-approve').click());
  await page.waitForFunction(()=>[...document.querySelectorAll('#master-layer-controls label')].some(l=>l.textContent.startsWith('Ajuste del recurso')&&l.querySelector('select')?.value==='cover'),{timeout:30000});
  assert.deepEqual(errors,[]);await page.close();
 }
 console.log('fit controls persisted in desktop and mobile simulated browser');
}finally{if(browser)await browser.close();if(app.server.listening)await app.close();rmSync(f.dir,{recursive:true,force:true});}