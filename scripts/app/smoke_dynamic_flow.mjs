// Generated video and fixture spatial analysis. This is technical QA, not Keanu fidelity.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,rmSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {fixture} from '../../tests/helpers/editor-fixture.js';
import {createEditorServer} from '../../src/editor-server.js';
const out=resolve(process.argv[2]);mkdirSync(out,{recursive:true,mode:0o700});
const {chromium}=await import(pathToFileURL(resolve(process.env.SUES_PLAYWRIGHT_MODULE)).href),browser=await chromium.launch({executablePath:process.env.SUES_CHROMIUM_PATH,args:['--no-sandbox']}),checks=[],errors=[];
const digest=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
try{for(const [device,viewport]of [['desktop',{width:1440,height:1000}],['mobile',{width:393,height:852}]]){
 const f=fixture(),source=join(f.dir,'source.mp4');
 execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','color=c=0x173c4a:s=1080x1920:r=30:d=24','-f','lavfi','-i','sine=frequency=440:duration=24','-c:v','libx264','-preset','ultrafast','-crf','34','-pix_fmt','yuv420p','-c:a','aac','-shortest','-y',source]);
 const tp=join(f.dir,'transcript.json'),t=JSON.parse(readFileSync(tp));t.words='Recuerda estar presente. Sentir sin miedo. Respira con calma. Avanzar con libertad.'.split(' ').map((text,i)=>({text,start:3+Math.floor(i/3)*5+(i%3)*.55,end:3+Math.floor(i/3)*5+(i%3+1)*.55}));writeFileSync(tp,JSON.stringify(t));
 const original=digest(source),app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles}),parent=app.jobs.create('test'),snapshot=JSON.stringify(app.jobs.get(parent.id)),context=await browser.newContext({viewport,acceptDownloads:true}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 const idle=async()=>{await page.waitForFunction(()=>!working);assert.equal(await page.locator('#error').isVisible(),false,await page.locator('#error').textContent());};
 try{
  await page.goto(await app.listen());await page.waitForFunction(()=>!working&&allJobs.length===1);await page.locator('.project-card').click();await idle();
  assert.equal(await page.locator('#automatic-edit-panel').isVisible(),false);assert.equal(await page.locator('#external-plan-panel').isVisible(),false);
  await page.click('#edit-video');await page.click('#choose-external');assert.equal(await page.locator('#external-plan-panel').isVisible(),true);assert.equal(await page.locator('#automatic-edit-panel').isVisible(),false);
  await page.click('#external-catalog');await idle();assert.match(await page.inputValue('#external-catalog-text'),/motionResources/);
  await page.click('#edit-video');await page.click('#choose-automatic');assert.equal(await page.locator('#new-style-label').isVisible(),true);assert.equal(await page.locator('#external-plan-panel').isVisible(),false);
  await page.selectOption('#new-project-style','SUES_DOPAMIN');await page.fill('#director-prompt','');await page.click('#review-instructions');await idle();assert.match(await page.textContent('#director-response'),/tarjetas/);
  if(process.env.SUES_UI_ONLY==='1'){assert.equal(await page.isEnabled('#render'),true);await page.uncheck('#recipe-sounds');assert.equal(await page.isDisabled('#render'),true);await page.click('#review-instructions');await idle();assert.equal(await page.isEnabled('#render'),true);await page.selectOption('#new-project-style','SUES_CALMA');assert.equal(await page.isDisabled('#render'),true);await page.click('#review-instructions');await idle();assert.equal(await page.isEnabled('#render'),true);await page.click('#edit-video');await page.click('#choose-external');assert.equal(await page.locator('#external-plan-panel').isVisible(),true);assert.equal(await page.locator('#automatic-edit-panel').isVisible(),false);checks.push({device,twoRoutes:true,templateBeforeAnalysis:true,soundChangeInvalidatesReview:true,templateChangeInvalidatesReview:true,recheckRequired:true,noRender:true});continue;}
  const countBefore=app.jobs.list().length;assert.equal(countBefore,1);await page.screenshot({path:join(out,device+'-proposal.png'),fullPage:true});
  await page.click('#compare-styles');await idle();assert.equal(app.jobs.list().length,3);assert.equal(JSON.stringify(app.jobs.get(parent.id)),snapshot);
  const childIds=app.jobs.list().filter(j=>j.parentId===parent.id).map(j=>j.id);assert.equal(childIds.length,2);const deadline=Date.now()+240000;while(childIds.some(id=>!['DONE','FAILED'].includes(app.jobs.get(id).state))){if(Date.now()>deadline)throw Error('Comparison render timeout');await new Promise(r=>setTimeout(r,300));}
  const variants=app.jobs.list().filter(j=>j.parentId===parent.id);assert.ok(variants.every(j=>j.state==='DONE'),JSON.stringify(variants.map(j=>({state:j.state,error:j.error}))));
  const counts={};for(const job of variants){const p=app.jobs.plan(job.id).manifest;counts[job.settings.styleId]=p.editionCounts;assert.equal(p.duration,24);assert.equal(p.originalVoice,true);assert.equal(job.settings.autoRecipe,true);const file=join(out,device+'-'+job.settings.styleId+'.mp4');const response=await page.request.get(new URL('/api/jobs/'+job.id+'/media',page.url()).href);assert.equal(response.status(),200);writeFileSync(file,await response.body());execFileSync('ffmpeg',['-v','error','-i',file,'-f','null','-']);}
  assert.ok(counts.SUES_DOPAMIN.cards>counts.SUES_CALMA.cards);assert.ok(counts.SUES_DOPAMIN.transitions>counts.SUES_CALMA.transitions);assert.ok(counts.SUES_DOPAMIN.soundEffects>counts.SUES_CALMA.soundEffects);
  const dynamic=variants.find(j=>j.settings.styleId==='SUES_DOPAMIN');await page.getByRole('button',{name:'Ver DINÁMICA',exact:true}).click();await idle();assert.equal(await page.inputValue('#new-project-style'),'SUES_DOPAMIN');assert.equal(await page.evaluate(()=>settings().autoRecipe),true);
  const downloadPromise=page.waitForEvent('download');await page.click('#export-video');const download=await downloadPromise,file=join(out,device+'-download.mp4');await download.saveAs(file);assert.equal(digest(file),digest(join(out,device+'-SUES_DOPAMIN.mp4')));
  assert.equal(digest(source),original);assert.equal(JSON.stringify(app.jobs.get(parent.id)),snapshot);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:join(out,device+'-done.png'),fullPage:true});
  checks.push({device,templateBeforeAnalysis:true,twoRoutes:true,externalCatalog:true,comparisonVersions:2,counts,realRenders:true,fullDecode:true,exportIdentical:true,parentIntact:true,originalIntact:true,noOverflow:true});
 }catch(e){await page.screenshot({path:join(out,device+'-failure.png'),fullPage:true}).catch(()=>{});throw e;}finally{await context.close();await app.close();rmSync(f.dir,{recursive:true,force:true});}
}assert.deepEqual(errors,[]);const result={kind:'synthetic-dynamic-vs-calm-ui-and-render',browser:await browser.version(),checks,errors,costUSD:0};writeFileSync(join(out,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));}finally{await browser.close();}
