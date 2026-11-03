import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync(new URL('../src/FullVideo.tsx',import.meta.url),'utf8');
const captions=JSON.parse(fs.readFileSync(new URL('../src/full-captions.json',import.meta.url),'utf8'));

test('source retains master CTA and original voice',()=>{
 assert.match(source,/END_ORIGINAL = 1950/);
 assert.match(source,/CTA_FRAMES = 339/);
 assert.match(source,/SUES-158404/);
 assert.match(source,/<OffthreadVideo src=\{base\} volume=\{1\}/);
 assert.match(source,/<OffthreadVideo src=\{cta\} volume=\{1\}/);
});
test('no social video B-roll remains in edit plan',()=>{
 const block=source.match(/const S=\[([\s\S]*?)\];/);
 assert.ok(block);
 for(const invalid of ['r2-alone','r5-mirror','r6-pier'])assert.doesNotMatch(block[1],new RegExp(invalid));
 for(const licensed of ['r1-chain','r3-sun','r4-path'])assert.match(block[1],new RegExp(licensed));
 assert.equal((block[1].match(/inPoint:/g)||[]).length,3);
});
test('new motion graphics replace each excluded shot',()=>{
 for(const name of ['RejectionScene','RecognitionScene','FitScene'])assert.match(source,new RegExp('const '+name+':React'));
 assert.match(source,/26\.70\*FPS/);
 assert.match(source,/47\.80\*FPS/);
 assert.match(source,/53\.10\*FPS/);
 assert.match(source,/ellipse 56% 47% at 58% 52%/);
});
test('captions are ordered, cover original only and have positive duration',()=>{
 assert.equal(captions.length,40);
 for(let i=0;i<captions.length;i++){
  const x=captions[i];
  assert.ok(x.start>=0 && x.end>x.start && x.end<=65.01,'invalid timestamp '+i);
  assert.ok(typeof x.text==='string' && x.text.trim(),'empty caption '+i);
  if(i>0)assert.ok(x.start>=captions[i-1].start,'unordered caption '+i);
 }
});
