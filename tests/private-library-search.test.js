import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {searchPrivateLibrary} from '../src/private-library-search.js';
test('search is ranked, authenticated-route compatible, and never automatically approved',()=>{
 const jobs=mkdtempSync(join(tmpdir(),'sues-private-library-')),lib=join(jobs,'library');
 try{
  mkdirSync(lib);
  writeFileSync(join(lib,'official-library-v1.json'),JSON.stringify({runtimeItems:[
   {id:'111',kind:'video',titleEs:'Cadena industrial · bloqueo',keywords:['cadena','presión'],storedInEditor:true,approvedForProduction:false},
   {id:'222',kind:'overlay',titleEs:'Chispas doradas',keywords:['revelación','luz'],storedInEditor:true,approvedForProduction:true}
  ]}));
  writeFileSync(join(lib,'purchased-source-index-309-v1.json'),JSON.stringify({items:[
   {id:'remote-1',originalName:'Cadena comprada.mp4',categoryHint:['cadena'],installedInEditor:false,sourceUrl:'https://secret.example/video'},
   {id:'remote-2',originalName:'Video remoto.mov',categoryHint:[],installedInEditor:true}
  ]}));
  const x=searchPrivateLibrary(jobs,'opresión',{limit:8});
  assert.equal(x.sourceIndexOnly,true);assert.equal(x.approvedToAutoPublish,false);
  assert.equal(x.results[0].id,'111');assert.equal(x.results[0].creativeApproval,'review-required');
  const remote=searchPrivateLibrary(jobs,'cadena');
  assert.equal(remote.results.at(-1).availability,'remote-drive-only');assert.ok(!JSON.stringify(remote).includes('secret.example'));
  const y=searchPrivateLibrary(jobs,'revelación');assert.equal(y.results[0].creativeApproval,'approved');
  assert.throws(()=>searchPrivateLibrary(jobs,'x',{limit:21}));
  assert.throws(()=>searchPrivateLibrary(jobs,'x'.repeat(251)));
 }finally{rmSync(jobs,{recursive:true,force:true});}
});
test('refuses symlinked private index to avoid arbitrary-file reads',()=>{
 const jobs=mkdtempSync(join(tmpdir(),'sues-index-sec-')),lib=join(jobs,'library');
 try{
  mkdirSync(lib);writeFileSync(join(jobs,'payload'),JSON.stringify({runtimeItems:[]}));
  symlinkSync(join(jobs,'payload'),join(lib,'official-library-v1.json'));
  assert.throws(()=>searchPrivateLibrary(jobs,'camino'));
 }finally{rmSync(jobs,{recursive:true,force:true});}
});
