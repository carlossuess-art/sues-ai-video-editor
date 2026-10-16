import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {compileCaptions} from '../src/captions-cli.js';
const d=()=>mkdtempSync(join(tmpdir(),'sues-caption-cli-'));
test('offline compiler writes editable captions and captioned plan',()=>{
  const root=d(),plan=join(root,'plan.json'),tr=join(root,'tr.json'),out=join(root,'out');
  writeFileSync(plan,JSON.stringify({source:{duration:5},segments:[{in:0,out:5}],texts:[{role:'title',text:'SUES',start:0,length:1}]}));
  writeFileSync(tr,JSON.stringify({version:'1.0',language:'es',sourceDuration:5,words:[{text:'Hola',start:.2,end:.6},{text:'mundo.',start:.7,end:1.2}]}));
  const r=compileCaptions(plan,tr,out);assert.equal(r.count,1);assert.ok(existsSync(r.planPath));
  const p=JSON.parse(readFileSync(r.planPath));assert.equal(p.texts.filter(x=>x.role==='caption').length,1);assert.equal(p.texts.filter(x=>x.role==='title').length,1);
});
test('edits file can correct text before plan compilation',()=>{
  const root=d(),plan=join(root,'p.json'),tr=join(root,'t.json'),ed=join(root,'e.json'),out=join(root,'o');
  writeFileSync(plan,JSON.stringify({source:{duration:5},segments:[{in:0,out:5}],texts:[]}));
  writeFileSync(tr,JSON.stringify({version:'1.0',language:'es',sourceDuration:5,words:[{text:'Ola.',start:.2,end:.8}]}));
  writeFileSync(ed,JSON.stringify([{id:'seg-001',text:'Hola.'}]));
  compileCaptions(plan,tr,out,{editsFile:ed});
  const c=JSON.parse(readFileSync(join(out,'captions.json')));assert.equal(c.segments[0].text,'Hola.');assert.equal(c.segments[0].source,'manual');
});
