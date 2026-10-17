import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {parseRenderProgress,renderProgress} from '../src/render-progress.js';
test('FFmpeg time/frame reports update progress without calling the encode end complete',()=>{
 const p=parseRenderProgress('frame=60\nout_time_us=2000000\nspeed=0.75x\nprogress=continue\n',12);assert.equal(p.percent,16);assert.equal(p.frame,60);assert.equal(p.speed,.75);
 const done=parseRenderProgress('out_time_us=12000000\nprogress=end\n',12);assert.equal(done.percent,99);assert.equal(done.stage,'verifying');
});
test('malformed values cannot produce negative, NaN or above-100 progress',()=>{
 assert.equal(parseRenderProgress('out_time_us=-1000\nspeed=Infinityx\nframe=NaN\n',12).percent,0);assert.equal(parseRenderProgress('out_time=99:99:99\n',12).percent,0);assert.equal(parseRenderProgress('out_time_us=9007199254740992\n',12).percent,0);assert.equal(parseRenderProgress('out_time_us=999999999\n',12).percent,99);
});
test('read bounded tail, reject symlink and tolerate missing in-progress report',()=>{
 const dir=mkdtempSync(join(tmpdir(),'sues-progress-'));try{const path=join(dir,'progress.txt');assert.equal(renderProgress(path,12,'RENDERING').percent,0);writeFileSync(path,'x'.repeat(100000)+'\nframe=180\nout_time=00:00:06.000000\nprogress=continue\n');assert.equal(renderProgress(path,12,'RENDERING').percent,50);symlinkSync(path,join(dir,'link'));assert.equal(renderProgress(join(dir,'link'),12,'RENDERING').percent,0);}finally{rmSync(dir,{recursive:true,force:true});}
});
test('only authoritative DONE reports 100 and saving/retry have their own stages',()=>{
 assert.equal(renderProgress('',12,'DONE').percent,100);assert.equal(renderProgress('',12,'PUBLISHING').stage,'saving');assert.equal(renderProgress('',12,'PUBLISH_FAILED').percent,99);assert.equal(renderProgress('',12,'QUEUED').percent,0);assert.equal(renderProgress('',12,'FAILED').percent,null);
});
