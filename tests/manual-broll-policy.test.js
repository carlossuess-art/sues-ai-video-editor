import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../web/manual-adjust.js',import.meta.url),'utf8');
const start=source.indexOf(' function validateBrollDraft(){');
const end=source.indexOf('\n function change(',start);
assert.ok(start>=0&&end>start);
function validate(events){
 return vm.runInNewContext(source.slice(start,end)+'\nvalidateBrollDraft()',{
  duration:()=>14,assetLibrary:[{id:'aurora',duration:10}],
  draft:{videoEvents:events},
  plan:{manifest:{policy:{outro:{duration:3},visualStyle:{broll:{
   minShot:2.5,maxShot:6,maxCoverage:.4,minPresenterGap:3,
   openingPresenterSeconds:2,closingPresenterSeconds:3
  }}}}}
 });
}
test('manual B-roll rejects bookends, excessive duration and source overflow before saving',()=>{
 const event={assetId:'aurora',start:2,end:6,sourceIn:0};
 assert.doesNotThrow(()=>validate([event]));
 assert.throws(()=>validate([{...event,start:0,end:4}]),/apertura/);
 assert.throws(()=>validate([{...event,end:8.1}]),/entre 2.5 y 6/);
 assert.throws(()=>validate([{...event,sourceIn:9}]),/archivo original/);
});
