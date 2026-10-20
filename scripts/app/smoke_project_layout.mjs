// UI layout fixture with a real previously rendered MP4; does NOT validate rendering.
import assert from 'node:assert/strict';
import {copyFileSync,readFileSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {fixture} from '../../tests/helpers/editor-fixture.js';
import {createEditorServer} from '../../src/editor-server.js';
const [sample,destination]=process.argv.slice(2),out=resolve(destination);mkdirSync(out,{recursive:true});const f=fixture();copyFileSync(sample,join(f.dir,'source.mp4'));
const app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles}),j=app.jobs.create('test',{}, {newProject:true,projectTitle:'Mi reel'}),job=app.jobs.get(j.id);job.state='DONE';job.output='fixture.mp4';copyFileSync(sample,join(app.jobs.dir(j.id),job.output));app.jobs.save(job);
const {chromium}=await import(pathToFileURL(resolve(process.env.SUES_PLAYWRIGHT_MODULE)).href);let browser;const checks=[],errors=[];
try{browser=await chromium.launch({executablePath:process.env.SUES_CHROMIUM_PATH,args:['--no-sandbox']});const launch=await app.listen();
 for(const [device,viewport] of [['desktop',{width:1440,height:1000}],['mobile',{width:393,height:852}]]){
  const context=await browser.newContext({viewport}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(launch);await page.locator('.project-card').waitFor();await page.waitForFunction(()=>[...document.querySelectorAll('.project-art img')].every(i=>i.complete&&i.naturalWidth>0));await page.screenshot({path:join(out,device+'-dashboard.png'),fullPage:true});
  await page.locator('.project-card').click();await page.waitForFunction(()=>!working&&current?.state==='DONE');
  for(const tool of ['director','style','captions','sound','sfx','media','material']){
   await page.click('[data-editor-tool="'+tool+'"]');assert.equal(await page.locator('#video-panel').isVisible(),true);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   if(tool==='director'){
    await page.locator('#director-prompt').scrollIntoViewIfNeeded();const video=await page.locator('#video-panel').boundingBox(),prompt=await page.locator('#director-prompt').boundingBox();assert.ok(video.y>=0&&video.y<viewport.height);assert.ok(prompt.y<viewport.height);if(device==='mobile')assert.ok(prompt.y>=video.y+video.height-1,JSON.stringify({video,prompt}));
    await page.screenshot({path:join(out,device+'-editor.png'),fullPage:false});
   }
  }
  checks.push({device,realJPEGPoster:true,playerRemainsVisible:true,promptVisible:true,noOverflow:true,rendering:'NOT TESTED; layout fixture only'});await context.close();
 }
 assert.deepEqual(errors,[]);const result={kind:'local-ui-layout-fixture',checks,pageErrors:errors,production:false};writeFileSync(join(out,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser?.close();await app.close();rmSync(f.dir,{recursive:true,force:true});}
