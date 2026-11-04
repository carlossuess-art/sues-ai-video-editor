import {pathToFileURL} from 'node:url';
if(!process.env.SUES_PLAYWRIGHT_MODULE||!process.env.SUES_CHROMIUM_PATH)throw Error('Set SUES_PLAYWRIGHT_MODULE and SUES_CHROMIUM_PATH');
const {chromium}=await import(pathToFileURL(process.env.SUES_PLAYWRIGHT_MODULE).href);
import assert from 'node:assert/strict';
import {join} from 'node:path';import {rmSync,mkdirSync,writeFileSync,readFileSync} from 'node:fs';import {createHash,randomUUID} from 'node:crypto';
import {fixture} from '../../tests/helpers/editor-fixture.js';import {createEditorServer} from '../../src/editor-server.js';
const f=fixture(),master='b'.repeat(64),context={registry:{brandId:'sues',profileId:'DOPAMIN',projectId:'p1',approvedRuleVersion:'rules-v1',
 approvedRuleIds:['r1'],requiredRuleKeys:['brand.background'],approvedReferenceIds:[],masterHashes:{tapiz:master},
 lockedMastersByMode:{'brand-sues':[{id:'tapiz',sha256:master}]},rendererCapabilities:{remotion:['text']},licensedAssets:{},canvas:{width:1080,height:1920},verifiedFonts:{'Montserrat:700':{sha256:'e'.repeat(64)}}},
 rulebook:[{id:'r1',key:'brand.background',scope:'global',authority:'explicit-user-approval',status:'approved',value:'anthracite',supersedes:[]}]};
let renders=0,probeBlocked=false;
const renderer=async({composition,workRoot,approvalCheck})=>{assert.equal(await approvalCheck(),true);await new Promise(resolve=>setTimeout(resolve,1200));const dir=join(workRoot,'master-preview-'+String(++renders).padStart(6,'0'));mkdirSync(dir,{recursive:true});const outputPath=join(dir,'preview.mp4');writeFileSync(outputPath,'fixture-preview');const outputSha256=createHash('sha256').update(readFileSync(outputPath)).digest('hex');return {status:'PREVIEW_RENDERED_UNVERIFIED',record:{id:randomUUID(),planFingerprint:composition.planFingerprint,sourceSha256:composition.sourceSha256,outputSha256,bytes:15,final:false},outputPath}};
const auditor=async({outputPath})=>({status:'TECHNICAL_PASS_HUMAN_QA_PENDING',outputSha256:createHash('sha256').update(readFileSync(outputPath)).digest('hex')});
const app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles,masterDirectorContext:async()=>context,masterSourceProbe:async project=>probeBlocked?({status:'BLOCKED',issues:[{code:'SOURCE_GEOMETRY_UNVERIFIED'}]}):({status:'SOURCE_CFR30_VERIFIED',sourceTiming:'cfr30-verified',sourceHasAudio:true,sourceDuration:24,width:1080,height:1920,sourceSha256:project.boundHashes.source}),masterPreviewConfig:{entryFile:'/tmp/a',remotionCli:'/tmp/b',browserExecutable:'/tmp/c'},masterPreviewRenderer:renderer,masterPreviewAuditor:auditor});let browser;
try{
 const launch=await app.listen(),job=app.jobs.create('test'),base=launch.split('/#')[0];
 browser=await chromium.launch({executablePath:process.env.SUES_CHROMIUM_PATH,headless:true,args:['--no-sandbox']});
 for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
  const page=await browser.newPage({viewport});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(launch);await page.waitForFunction(()=>document.querySelector('#profile').options.length>0&&design!==null,{timeout:30000});
  await page.evaluate(async id=>{await select(id);showView('editor');showTool('director');$('external-plan-panel').hidden=false;$('external-plan-panel').open=true;},job.id);
  const cat=await (await fetch(base+'/api/jobs/'+job.id+'/external-catalog',{headers:{Cookie:'sues_session='+app.token}})).json();
  const visual={rect:{x:100,y:300,width:500,height:300},zIndex:1,opacity:1,typography:{family:'Montserrat',sizePx:80,weight:700,color:'#ffffff'},keyframes:[{atFrame:0,x:0},{atFrame:30,x:100,easing:'linear'}]};
  const story={schema:'sues-master-story/v1',sourceSha256:cat.sourceSha256,timeline:{fingerprint:cat.timelineFingerprint,timeSpace:'edit-timeline',fps:30,duration:cat.duration},visual:{mode:'brand-sues'},
   narrative:{centralMessage:'Una historia real',intendedExperience:'Recorrido visual',scenes:[{id:'intro',start:0,end:cat.duration,purpose:'Explicar la historia'}],motifs:[]},resources:[],
   operations:[{id:'texto',sceneId:'intro',start:2,end:4,track:'graphics',effect:'text',renderer:'remotion',reason:'Reforzar el mensaje',parameters:{text:'Hola',visual},dependsOn:[],requiredQA:['rendered-frame','motion-playback','narrative-review']}]};
  await page.evaluate(value=>{const t=document.querySelector('#external-plan-text');t.value=JSON.stringify(value);t.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#master-review-button').click();},story);
  await page.waitForFunction(()=>!document.querySelector('#master-review-actions').hidden,{timeout:30000});
  assert.match(await page.locator('#master-review-result').textContent(),/Una historia real/);
  const originalRevision=await page.evaluate(()=>masterReview.revision);
  await page.evaluate(()=>document.querySelector('#master-approve').click());
  await page.waitForSelector('#master-layer-controls fieldset',{state:'attached',timeout:30000});
  await page.evaluate(()=>document.querySelector('#master-preflight').click());
  await page.waitForFunction(()=>document.querySelector('#master-preflight-result').textContent.includes('Preparación comprobada'),{timeout:30000});
  probeBlocked=true;
  await page.evaluate(()=>document.querySelector('#master-generate-preview').click());
  await page.waitForFunction(()=>document.querySelector('#master-preview-status').textContent.includes('proporción o la orientación'),{timeout:30000});
  assert.equal(await page.evaluate(()=>masterPreviewRequest),null);probeBlocked=false;
  await page.evaluate(()=>document.querySelector('#master-generate-preview').click());
  await page.waitForFunction(()=>document.querySelector('#master-preview-status').textContent.includes('Puedes seguir trabajando'),{timeout:30000});
  await page.waitForFunction(()=>!working,{timeout:30000});assert.equal(app.jobs.previewBusy,true);
  await page.waitForFunction(()=>document.querySelector('#master-preview-status').textContent.includes('preparada'),{timeout:30000});
  assert.match(await page.locator('#master-layer-controls video').getAttribute('src'),/master-preview-media/);
  await page.evaluate(()=>document.querySelector('#master-preview-history').click());
  await page.waitForFunction(()=>!document.querySelector('#master-preview-history-label').hidden,{timeout:30000});
  await page.evaluate(()=>document.querySelector('#master-preview-history-open').click());
  assert.match(await page.locator('#master-preview-history-player').getAttribute('src'),/master-preview-media/);
  const dimensions=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));assert.ok(dimensions.scroll<=dimensions.width,JSON.stringify(dimensions));
  await page.evaluate(()=>{const inp=document.querySelectorAll('#master-layer-controls input');inp[0].value='170';inp[4].value='2.5';inp[5].value='4.5';inp[6].value='Texto editado';document.querySelector('[data-master-keyframe="1:x"]').value='125';document.querySelector('[data-master-easing="1"]').value='ease-in';document.querySelector('#master-layer-controls fieldset button').click();});
  await page.waitForFunction(()=>document.querySelector('#master-review-result').textContent.includes('nueva versión'),{timeout:30000});
  const edited=await page.evaluate(()=>JSON.parse(document.querySelector('#external-plan-text').value).operations[0]);
  assert.equal(edited.parameters.visual.rect.x,170);assert.equal(edited.start,2.5);assert.equal(edited.end,4.5);assert.equal(edited.parameters.text,'Texto editado');assert.equal(edited.parameters.visual.keyframes[1].easing,'ease-in');assert.equal(edited.parameters.visual.keyframes[1].x,125);
  await page.evaluate(()=>document.querySelector('#master-review-button').click());
  await page.waitForFunction(()=>!document.querySelector('#master-review-actions').hidden,{timeout:30000});
  await page.evaluate(()=>document.querySelector('#master-approve').click());
  await page.waitForSelector('#master-layer-controls [data-master-easing=\"1\"]',{state:'attached',timeout:30000});
  assert.equal(await page.locator('[data-master-easing=\"1\"]').inputValue(),'ease-in');
  assert.equal(await page.locator('[data-master-keyframe=\"1:x\"]').inputValue(),'125');
  await page.evaluate(()=>document.querySelector('#master-versions-button').click());
  await page.waitForFunction(()=>!document.querySelector('#master-versions-label').hidden,{timeout:30000});
  await page.evaluate(id=>{document.querySelector('#master-versions-select').value=id;document.querySelector('#master-version-open').click();},originalRevision);
  await page.waitForFunction(()=>document.querySelector('#master-review-result').textContent.includes('Versión recuperada'),{timeout:30000});
  assert.equal(await page.evaluate(()=>JSON.parse(document.querySelector('#external-plan-text').value).operations[0].parameters.visual.rect.x),100);
  assert.deepEqual(errors,[]);console.log('PASS browser review, approval, layer edit',viewport.width);
  await page.close();
 }
}finally{await browser?.close();await app.close();rmSync(f.dir,{recursive:true,force:true});}
