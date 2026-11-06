// Isolated browser integration: real master story, one editable job, no render/production.
import assert from 'node:assert/strict';
import {mkdirSync,rmSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {fixture} from '../../tests/helpers/editor-fixture.js';
import {createEditorServer} from '../../src/editor-server.js';
const {chromium}=await import(pathToFileURL(resolve(process.env.SUES_PLAYWRIGHT_MODULE)).href);
const out=resolve(process.argv[2]);mkdirSync(out,{recursive:true,mode:0o700});
const f=fixture(),master='b'.repeat(64),policy={registry:{brandId:'sues',profileId:'CALMA',projectId:'p1',
 approvedRuleVersion:'rules-v1',approvedRuleIds:['r1'],requiredRuleKeys:['brand.background'],approvedReferenceIds:[],
 masterHashes:{tapiz:master},lockedMastersByMode:{'brand-sues':[{id:'tapiz',sha256:master}]},
 rendererCapabilities:{native:['caption-edit','transition-native']},licensedAssets:{}},
 rulebook:[{id:'r1',key:'brand.background',scope:'global',authority:'explicit-user-approval',status:'approved',value:'anthracite',supersedes:[]}]};
let browser,app;
try{
 app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles,masterDirectorContext:async()=>policy});
 const job=app.jobs.create('test'),root=await app.listen(),catalog=await (async()=>{
  const login=await fetch(root.split('/#')[0]+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}});
  const headers={Cookie:login.headers.get('set-cookie').split(';')[0]};
  return (await (await fetch(root.split('/#')[0]+'/api/jobs/'+job.id+'/external-catalog',{headers})).json());
 })();
 const caption=catalog.captions.find(x=>x.start>=0&&x.end>x.start&&x.end<catalog.duration-1);
 assert.ok(caption,'source-bound caption');
 const story={schema:'sues-master-story/v1',sourceSha256:catalog.sourceSha256,
 timeline:{fingerprint:catalog.timelineFingerprint,timeSpace:'edit-timeline',fps:30,duration:catalog.duration},
 visual:{mode:'brand-sues'},narrative:{centralMessage:'Cambio puntual',intendedExperience:'Claridad',
 scenes:[{id:'s1',start:0,end:catalog.duration,purpose:'Mantener el discurso'}],motifs:[]},resources:[],
 operations:[
  {id:'native-caption-edit',sceneId:'s1',start:caption.start,end:caption.end,track:'captions',effect:'caption-edit',renderer:'native',reason:'Corregir el subtítulo',parameters:{captionId:caption.id,text:'Antes'},dependsOn:[],requiredQA:['rendered-frame','time-sync']},
  {id:'native-transition',sceneId:'s1',start:2,end:2.4,track:'transition',effect:'transition-native',renderer:'native',reason:'Transición suave',parameters:{kind:'warm'},dependsOn:[],requiredQA:['rendered-frame','motion-playback']}
 ]};
 browser=await chromium.launch({executablePath:process.env.SUES_CHROMIUM_PATH,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1360,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(root);await page.locator('.project-card').first().waitFor();await page.locator('.project-card').first().click();
 await page.waitForFunction(()=>!!current&&!working);assert.equal(await page.evaluate(()=>current.id),job.id);
 await page.click('#open-director-plan');await page.locator('#external-plan-text').fill(JSON.stringify(story));
 await page.click('#master-review-button');await page.waitForFunction(()=>!working);await page.locator('#master-approve').waitFor({state:'visible'});
 await page.click('#master-approve');await page.waitForFunction(()=>!working);
 const text=page.locator('#master-layer-controls fieldset:has-text("Modificar en este proyecto") input[type="text"]').first();
 await text.waitFor({state:'visible'});assert.equal(await text.inputValue(),'Antes');
 const before=await page.evaluate(()=>masterWorkingRevision);
 await text.fill('Después');await page.locator('#master-layer-controls fieldset:has-text("Modificar en este proyecto") button').first().click();
 await page.waitForFunction(()=>!working);const after=await page.evaluate(()=>masterWorkingRevision);
 assert.notEqual(after,before);assert.equal(app.jobs.list().length,1);
 const updated=await page.evaluate(()=>api('jobs/'+current.id+'/master-current'));
 assert.equal(updated.revision,after);assert.equal(updated.story.operations[0].parameters.text,'Después');
 assert.deepEqual(updated.story.operations[1],story.operations[1]);
 await page.goto(root.split('/#')[0]+'?project='+job.id);await page.waitForFunction(()=>current?.id&& !working);
 const saved=JSON.parse(await page.locator('#external-plan-text').inputValue());assert.equal(saved.operations[0].parameters.text,'Después');
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({status:'PASS',browser:await browser.version(),activeProjectId:job.id,
   sameProject:true,captionEdited:true,otherLayersPreserved:true,reopenedLatest:true,pageErrors:errors}));
}finally{await browser?.close();await app?.close();rmSync(f.dir,{recursive:true,force:true});}
