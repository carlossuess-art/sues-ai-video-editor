import {pathToFileURL} from 'node:url';
if(!process.env.SUES_PLAYWRIGHT_MODULE||!process.env.SUES_CHROMIUM_PATH)throw Error('Set SUES_PLAYWRIGHT_MODULE and SUES_CHROMIUM_PATH');
const {chromium}=await import(pathToFileURL(process.env.SUES_PLAYWRIGHT_MODULE).href);
import assert from 'node:assert/strict';
import {join} from 'node:path';import {rmSync,mkdirSync,writeFileSync,readFileSync,readdirSync} from 'node:fs';import {createHash,randomUUID} from 'node:crypto';
import {fixture} from '../../tests/helpers/editor-fixture.js';import {createEditorServer} from '../../src/editor-server.js';
const f=fixture(),master='b'.repeat(64),context={registry:{brandId:'sues',profileId:'DOPAMIN',projectId:'p1',approvedRuleVersion:'rules-v1',
 approvedRuleIds:['r1'],requiredRuleKeys:['brand.background'],approvedReferenceIds:[],arcPolicy:'reel-observed-v2',wordAnchors:{'test-word':{time:1,text:'Hola'}},masterHashes:{tapiz:master},
 lockedMastersByMode:{'brand-sues':[{id:'tapiz',sha256:master}]},rendererCapabilities:{remotion:['text']},licensedAssets:{},canvas:{width:1080,height:1920},verifiedFonts:{'Montserrat:700':{sha256:'e'.repeat(64)}}},
 rulebook:[{id:'r1',key:'brand.background',scope:'global',authority:'explicit-user-approval',status:'approved',value:'anthracite',supersedes:[]}]};
function wav(frames=4){const b=Buffer.alloc(44+frames*4);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVE',8);b.write('fmt ',12);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(2,22);b.writeUInt32LE(48000,24);b.writeUInt32LE(192000,28);b.writeUInt16LE(4,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(frames*4,40);return b;}
let renders=0,probeBlocked=false;
const renderer=async({composition,workRoot,approvalCheck})=>{assert.equal(await approvalCheck(),true);await new Promise(resolve=>setTimeout(resolve,1200));const dir=join(workRoot,'master-preview-'+String(++renders).padStart(6,'0'));mkdirSync(dir,{recursive:true});const outputPath=join(dir,'preview.mp4');writeFileSync(outputPath,'fixture-preview');const outputSha256=createHash('sha256').update(readFileSync(outputPath)).digest('hex');return {status:'PREVIEW_RENDERED_UNVERIFIED',record:{id:randomUUID(),planFingerprint:composition.planFingerprint,sourceSha256:composition.sourceSha256,outputSha256,bytes:15,final:false},outputPath}};
const auditor=async({outputPath})=>({status:'TECHNICAL_PASS_HUMAN_QA_PENDING',outputSha256:createHash('sha256').update(readFileSync(outputPath)).digest('hex')});
const supervisorRunner=async(_executable,args)=>{
 const target=args.at(-1);if(target.endsWith('audio.wav'))writeFileSync(target,wav());
 else{const count=Number(args[args.indexOf('-frames:v')+1]);for(let i=1;i<=count;i++)writeFileSync(target.replace('%04d',String(i).padStart(4,'0')),'frame-fixture-'+i);}
};
const maskRunner=async(executable,args)=>{
 if(executable==='ffmpeg'){const target=args.at(-1),count=Number(args[args.indexOf('-frames:v')+1]);for(let i=0;i<count;i++)writeFileSync(target.replace('%06d',String(i).padStart(6,'0')),'input-'+i);return;}
 const value=name=>args[args.indexOf(name)+1],input=value('--input-dir'),output=value('--output-dir'),start=Number(value('--start-frame'));
 const rectIndex=args.indexOf('--rect'),rect=args.slice(rectIndex+1,rectIndex+5).map(Number);mkdirSync(output,{recursive:true});
 const count=readdirSync(input).length,frames=[];
 for(let i=0;i<count;i++){const suffix=String(i).padStart(6,'0'),name='mask-'+suffix+'.png',bytes=Buffer.from('mask-'+i);writeFileSync(join(output,name),bytes);
  frames.push({editFrame:start+i,file:name,sha256:createHash('sha256').update(bytes).digest('hex'),inputSha256:createHash('sha256').update(readFileSync(join(input,'frame-'+suffix+'.png'))).digest('hex')});}
 writeFileSync(join(output,'candidate.json'),JSON.stringify({schema:'sues-mask-candidate/v1',status:'CANDIDATE_NOT_VERIFIED',sourceSha256Claim:value('--source-sha256'),timelineFingerprintClaim:value('--timeline-fingerprint'),mode:value('--mode'),fps:30,coordinateSpace:'layer',rect,model:'fixture',modelSha256:'c'.repeat(64),frames}));
};
const app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles,masterSupervisorRunner:supervisorRunner,masterMaskConfig:{verifiedLocal:true,pythonPath:process.execPath,pythonSha256:createHash('sha256').update(readFileSync(process.execPath)).digest('hex'),scriptPath:join(process.cwd(),'scripts/master-director/generate-mask-candidates.py'),scriptSha256:createHash('sha256').update(readFileSync(join(process.cwd(),'scripts/master-director/generate-mask-candidates.py'))).digest('hex'),modelSha256:'c'.repeat(64)},masterMaskRunner:maskRunner,masterDirectorContext:async()=>context,masterSourceProbe:async project=>probeBlocked?({status:'BLOCKED',issues:[{code:'SOURCE_GEOMETRY_UNVERIFIED'}]}):({status:'SOURCE_CFR30_VERIFIED',sourceTiming:'cfr30-verified',sourceHasAudio:true,sourceDuration:24,width:1080,height:1920,sourceSha256:project.boundHashes.source}),masterPreviewConfig:{entryFile:'/tmp/a',remotionCli:'/tmp/b',browserExecutable:'/tmp/c'},masterPreviewRenderer:renderer,masterPreviewAuditor:auditor});let browser;
try{
 const launch=await app.listen(),job=app.jobs.create('test'),base=launch.split('/#')[0];
 browser=await chromium.launch({executablePath:process.env.SUES_CHROMIUM_PATH,headless:true,args:['--no-sandbox']});
 for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
  const page=await browser.newPage({viewport});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(launch);await page.waitForFunction(()=>document.querySelector('#profile').options.length>0&&design!==null,{timeout:30000});
  await page.evaluate(async id=>{await select(id);showView('editor');showTool('director');$('external-plan-panel').hidden=false;$('external-plan-panel').open=true;},job.id);
  await page.evaluate(()=>showMasterReview({status:'READY_FOR_CHOICE',timeline:[],resources:[{number:1,title:'Recurso local',rightsVerified:true,previewPath:'/api/assets/'+'a'.repeat(64)+'/media'}]}));
  assert.equal(await page.locator('#master-review-result a').getAttribute('href'),'/api/assets/'+'a'.repeat(64)+'/media');
  await page.evaluate(()=>showMasterReview({status:'READY_FOR_CHOICE',timeline:[],resources:[{number:1,title:'No autorizado',rightsVerified:true,previewPath:'//invalid.example/media'}]}));
  assert.equal(await page.locator('#master-review-result a').count(),0);await page.evaluate(()=>resetMasterReview());
  const cat=await (await fetch(base+'/api/jobs/'+job.id+'/external-catalog',{headers:{Cookie:'sues_session='+app.token}})).json();
  const visual={rect:{x:100,y:300,width:500,height:300},zIndex:1,opacity:1,typography:{family:'Montserrat',sizePx:80,weight:700,color:'#ffffff'},keyframes:[{atFrame:0,x:0},{atFrame:30,x:100,easing:'linear'}]};
  const story={schema:'sues-master-story/v1',sourceSha256:cat.sourceSha256,timeline:{fingerprint:cat.timelineFingerprint,timeSpace:'edit-timeline',fps:30,duration:cat.duration},visual:{mode:'brand-sues'},
   narrative:{centralMessage:'Una historia real',intendedExperience:'Recorrido visual',scenes:[{id:'intro',start:0,end:cat.duration,purpose:'Explicar la historia'}],motifs:[],arc:[{id:'momento',phase:'development',start:0,end:cat.duration,purpose:'Explicar la historia',evidence:[{kind:'transcript-word',wordId:'test-word'}]}]},resources:[],
   operations:[{id:'texto',sceneId:'intro',start:2,end:4,track:'graphics',effect:'text',renderer:'remotion',reason:'Reforzar el mensaje',parameters:{text:'Hola',visual},dependsOn:[],requiredQA:['rendered-frame','motion-playback','narrative-review']}]};
  await page.evaluate(value=>{const t=document.querySelector('#external-plan-text');t.value=JSON.stringify(value);t.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#master-review-button').click();},story);
  await page.waitForFunction(()=>!document.querySelector('#master-review-actions').hidden,{timeout:30000});
  assert.match(await page.locator('#master-review-result').textContent(),/Una historia real/);assert.match(await page.locator('#master-review-result').textContent(),/Fases no documentadas en el plan/);
  const originalRevision=await page.evaluate(()=>masterReview.revision);
  await page.evaluate(()=>document.querySelector('#master-approve').click());
  await page.waitForSelector('#master-layer-controls fieldset',{state:'attached',timeout:30000});
  await page.evaluate(()=>{const group=[...document.querySelectorAll('#master-layer-controls fieldset')].find(x=>x.querySelector('legend')?.textContent==='Generar máscara candidata');group.querySelector('button').click();});
  await page.waitForFunction(()=>[...document.querySelectorAll('#master-layer-controls [role=status]')].some(x=>x.textContent.includes('Máscara candidata preparada')),{timeout:30000});
  const maskHref=await page.locator('#master-layer-controls a[href*="master-mask-frame"]').first().getAttribute('href');
  const mask=await page.request.get(base+maskHref);assert.equal(mask.status(),200);assert.ok(mask.headers()['content-type'].startsWith('image/png'));
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
  await page.evaluate(()=>document.querySelector('[data-master-supervisor] button').click());
  await page.waitForFunction(()=>document.querySelector('[data-master-supervisor] [role=status]')?.textContent.includes('Muestras preparadas'),{timeout:30000});
  assert.match(await page.locator('[data-master-supervisor]').textContent(),/Medición orientativa del audio convertido/);
  const evidenceHref=await page.locator('[data-master-supervisor] a').first().getAttribute('href');
  const evidence=await page.request.get(base+evidenceHref);assert.equal(evidence.status(),200);assert.ok(evidence.headers()['content-type'].startsWith('audio/wav'));
  await page.evaluate(()=>document.querySelector('#master-preview-history').click());
  await page.waitForFunction(()=>!document.querySelector('#master-preview-history-label').hidden,{timeout:30000});
  await page.evaluate(()=>document.querySelector('#master-preview-history-open').click());
  assert.match(await page.locator('#master-preview-history-player').getAttribute('src'),/master-preview-media/);
  const dimensions=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));assert.ok(dimensions.scroll<=dimensions.width,JSON.stringify(dimensions));
  await page.evaluate(()=>{const inp=document.querySelectorAll('#master-layer-controls input');inp[0].value='170';inp[4].value='2.5';inp[5].value='4.5';inp[6].value='Texto editado';document.querySelector('[data-master-keyframe="1:x"]').value='125';document.querySelector('[data-master-easing="1"]').value='ease-in';
   const labels=[...document.querySelectorAll('#master-layer-controls label')];labels.find(x=>x.textContent.startsWith('Orden de capa')).querySelector('input').value='2';labels.find(x=>x.textContent.startsWith('Tamaño de fuente')).querySelector('input').value='90';labels.find(x=>x.textContent.includes('Activar sombra')).querySelector('input').checked=true;labels.find(x=>x.textContent.startsWith('Color de sombra')).querySelector('input').value='#FF8800AA';labels.find(x=>x.textContent.startsWith('Sombra horizontal')).querySelector('input').value='12';
   const groups=[...document.querySelectorAll('#master-layer-controls fieldset')],remove=groups.find(x=>x.querySelector('legend')?.textContent==='Fotograma 0');remove.querySelector('input[type=checkbox]').checked=true;
   const add=groups.find(x=>x.querySelector('legend')?.textContent==='Añadir fotograma');add.querySelectorAll('input')[0].value='15';add.querySelectorAll('input')[1].value='0.5';add.querySelectorAll('select')[0].value='opacity';
   document.querySelector('[data-master-save]').click();});
  await page.waitForFunction(()=>document.querySelector('#master-review-result').textContent.includes('nueva versión'),{timeout:30000});
  const edited=await page.evaluate(()=>JSON.parse(document.querySelector('#external-plan-text').value).operations[0]);
  assert.equal(edited.parameters.visual.rect.x,170);assert.equal(edited.start,2.5);assert.equal(edited.end,4.5);assert.equal(edited.parameters.text,'Texto editado');assert.equal(edited.parameters.visual.keyframes[1].easing,'ease-in');assert.equal(edited.parameters.visual.keyframes[1].x,125);assert.equal(edited.parameters.visual.zIndex,2);assert.equal(edited.parameters.visual.typography.sizePx,90);assert.deepEqual(edited.parameters.visual.dropShadow,{color:'#FF8800AA',offsetX:12,offsetY:8,blurPx:16});assert.deepEqual(edited.parameters.visual.keyframes[0],{atFrame:15,easing:'linear',opacity:0.5});
  await page.evaluate(()=>document.querySelector('#master-review-button').click());
  await page.waitForFunction(()=>!document.querySelector('#master-review-actions').hidden,{timeout:30000});
  await page.evaluate(()=>document.querySelector('#master-approve').click());
  await page.waitForSelector('#master-layer-controls [data-master-easing=\"1\"]',{state:'attached',timeout:30000});
  assert.equal(await page.locator('[data-master-easing=\"1\"]').inputValue(),'ease-in');
  assert.equal(await page.locator('[data-master-keyframe=\"1:x\"]').inputValue(),'125');
  await page.evaluate(()=>{const labels=[...document.querySelectorAll('#master-layer-controls label')];
   labels.find(x=>x.textContent.includes('Activar sombra')).querySelector('input').checked=false;
   labels.find(x=>x.textContent.includes('Activar resplandor')).querySelector('input').checked=true;
   labels.find(x=>x.textContent.startsWith('Color del resplandor')).querySelector('input').value='#33AAFFFF';
   labels.find(x=>x.textContent.startsWith('Radio del resplandor')).querySelector('input').value='20';document.querySelector('[data-master-save]').click();});
  await page.waitForFunction(()=>document.querySelector('#master-review-result').textContent.includes('nueva versión'),{timeout:30000});
  const glow=await page.evaluate(()=>JSON.parse(document.querySelector('#external-plan-text').value).operations[0].parameters.visual);
  assert.equal(glow.dropShadow,undefined);assert.deepEqual(glow.glow,{color:'#33AAFFFF',radiusPx:20});
  await page.evaluate(()=>document.querySelector('#master-review-button').click());await page.waitForFunction(()=>!document.querySelector('#master-review-actions').hidden,{timeout:30000});
  await page.evaluate(()=>document.querySelector('#master-versions-button').click());
  await page.waitForFunction(()=>!document.querySelector('#master-versions-label').hidden,{timeout:30000});
  await page.evaluate(id=>{document.querySelector('#master-versions-select').value=id;document.querySelector('#master-version-open').click();},originalRevision);
  await page.waitForFunction(()=>document.querySelector('#master-review-result').textContent.includes('Versión recuperada'),{timeout:30000});
  assert.equal(await page.evaluate(()=>JSON.parse(document.querySelector('#external-plan-text').value).operations[0].parameters.visual.rect.x),100);
  assert.deepEqual(errors,[]);console.log('PASS browser review, approval, layer edit',viewport.width);
  await page.close();
 }
}finally{await browser?.close();await app.close();rmSync(f.dir,{recursive:true,force:true});}