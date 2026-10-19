// Real Chromium assertions, called by smoke_player_workflow after a full render.
import assert from 'node:assert/strict';
export async function verifyReferenceTimeline(page, viewport) {
 const video=page.locator('#video');
 await video.evaluate(v=>{v.pause();v.currentTime=7;});
 await page.locator('#timeline-forward').click();
 assert.ok(Math.abs(await video.evaluate(v=>v.currentTime)-12)<.2);
 await page.locator('#timeline-back').click();
 assert.ok(Math.abs(await video.evaluate(v=>v.currentTime)-7)<.2);
 await page.locator('#timeline-scrub').fill('500');
 const half=await video.evaluate(v=>v.duration/2);
 assert.ok(Math.abs(await video.evaluate(v=>v.currentTime)-half)<.2);
 await page.locator('#timeline-play').click();
 await page.waitForFunction(t=>document.querySelector('#video').currentTime>t+.1,half);
 await page.locator('#timeline-play').click();
 assert.equal(await video.evaluate(v=>v.paused),true);
 // Body shortcuts work, but focused inputs and native transport retain their keys.
 await page.locator('body').click({position:{x:1,y:1}});
 await page.keyboard.press('ArrowLeft');
 assert.ok(Math.abs(await video.evaluate(v=>v.currentTime)-(half-5))<.5);
 await page.keyboard.press('Space');
 await page.waitForFunction(()=>!document.querySelector('#video').paused);
 await page.keyboard.press('Space');
 await page.waitForFunction(()=>document.querySelector('#video').paused);
 await page.click('#view-original');
 assert.equal(await page.locator('#timeline-segments').isVisible(),false);
 await page.click('#view-preview');
 await page.waitForFunction(()=>!document.querySelector('#timeline-segments').hidden);
 const segment=page.locator('.timeline-segment').first();
 const start=Number(await segment.getAttribute('data-start'));
 await segment.click();
 assert.ok(Math.abs(await video.evaluate(v=>v.currentTime)-start)<.2);
 assert.equal(await page.locator('#captions textarea').first().evaluate(e=>e===document.activeElement),true);
 const original=await page.locator('#captions textarea').first().inputValue();
 const time=await video.evaluate(v=>v.currentTime);
 await page.keyboard.press('End');await page.keyboard.press('Space');await page.keyboard.press('ArrowLeft');
 assert.equal(await video.evaluate(v=>v.paused),true);
 assert.ok(Math.abs(await video.evaluate(v=>v.currentTime)-time)<.2);
 assert.equal(await page.locator('#captions textarea').first().inputValue(),original+' ');
 assert.equal(await page.locator('#export-video').isDisabled(),true);
 assert.equal(await page.locator('#timeline-segments').isVisible(),false);
 await page.click('#undo');await page.waitForFunction(()=>!working&&!previewDirty);
 await page.waitForFunction(()=>!document.querySelector('#timeline-segments').hidden);
 const bounds=await page.locator('#video-panel').boundingBox();
 assert.ok(bounds.y>=0&&bounds.y+bounds.height<=viewport.height+50,JSON.stringify(bounds));
 if(viewport.width<700){
  const frame=await page.locator('.preview-wrap').boundingBox();
  assert.ok(frame.height>=200,JSON.stringify(frame));
 }
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 return {transport:true,scrub:true,keyboardPlayback:true,typingDoesNotControlPlayback:true,captionSeekAndFocus:true,undo:true,dirtyTimelineHidden:true,videoRemainsVisible:true};
}
