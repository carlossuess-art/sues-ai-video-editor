import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,rmSync,statSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {timelineFrames} from '../src/timeline-frames.js';
test('filmstrip contains different actual video moments and releases worker on completion',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'sues-filmstrip-'));try{
  const source=join(dir,'two-scenes.mp4');
  execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','color=red:s=90x160:r=30:d=1','-f','lavfi','-i','color=blue:s=90x160:r=30:d=1','-filter_complex','[0:v][1:v]concat=n=2:v=1:a=0[v]','-map','[v]','-threads','1',source]);
  const jobs={get:()=>({state:'DONE',summary:{duration:2},fingerprint:'a'.repeat(64)}),dir:()=>dir,children:new Set(),previewBusy:false,queued:()=>[],publishing:new Set(),media:async()=>source,drain(){}};
  const data=await timelineFrames(jobs,'fixture');assert.equal(data.count,2);assert.equal(data.width,90);assert.equal(jobs.previewBusy,false);assert.ok(statSync(data.file).size<2*1024*1024);
  const rgb=execFileSync('ffmpeg',['-v','error','-i',data.file,'-frames:v','1','-pix_fmt','rgb24','-f','rawvideo','-']);
  const at=x=>[...rgb.subarray((80*1080+x)*3,(80*1080+x)*3+3)];
  assert.ok(at(45)[0]>200&&at(45)[2]<30);assert.ok(at(135)[2]>200&&at(135)[0]<30);
  assert.equal((await timelineFrames(jobs,'fixture')).file,data.file);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('filmstrip failures release the queue and do not accept an unfinished job',async()=>{
 const jobs={get:()=>({state:'DONE',summary:{duration:2},fingerprint:'b'.repeat(64)}),dir:()=>tmpdir(),children:new Set(),previewBusy:false,queued:()=>[],publishing:new Set(),media:async()=>{throw Error('Source unavailable');},drain(){}};
 await assert.rejects(timelineFrames(jobs,'absent'),/Source unavailable/);assert.equal(jobs.previewBusy,false);
 jobs.get=()=>({state:'RENDERING'});await assert.rejects(timelineFrames(jobs,'absent'),/todavía/);
});
