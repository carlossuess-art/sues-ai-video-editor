import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,cpSync,rmSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
const cli=new URL('../scripts/motion-templates/prepare-hyperframes-handoff.mjs',import.meta.url);
const sourceDir=new URL('../src/motion-templates/',import.meta.url);
function synthetic(){
 const root=mkdtempSync(join(tmpdir(),'sues-hf-source-sync-'));
 const hf=join(root,'hf'),runtime=join(hf,'runtime'),canonical=join(root,'canonical');
 mkdirSync(runtime,{recursive:true});mkdirSync(canonical,{recursive:true});
 for(const file of ['hook-drop-card-engine.js','sequence-card-to-space.js']){
  const data=readFileSync(new URL(file,sourceDir));
  writeFileSync(join(runtime,file),data);writeFileSync(join(canonical,file),data);
 }
 writeFileSync(join(hf,'index.html'),[
  '<div id="root" data-width="1080" data-height="1920" data-fps="30" data-duration="5.033333333333333"',
  ' data-composition-variables="[]"></div>',
  '<script>window.__timelines.main=gsap.timeline({paused:true});</script>',
  '<script>const renderer=renderCardToSpaceSvg; window.addEventListener("hf-seek",()=>renderer);</script>'
 ].join('\n'));
 return {root,hf,canonical,output:join(root,'review.json')};
}
const run=x=>spawnSync(process.execPath,[cli.pathname,x.hf,x.output,x.canonical],{encoding:'utf8'});
test('source handoff succeeds for exact canonical code and writes a private review-only manifest',()=>{
 const x=synthetic();
 try{
  const r=run(x);
  assert.equal(r.status,0,r.stderr);
  const result=JSON.parse(readFileSync(x.output,'utf8'));
  assert.equal(result.validation,'SOURCE_ONLY_NO_RENDER');
  assert.equal(result.gates.canImportToProduction,false);
  assert.equal(result.render.nativeHyperFramesVideo,null);
  assert.equal(result.source.files.length,3);
  assert.equal(result.source.htmlRuntimeChecks.directSourceFileHashesVerified,true);
 }finally{rmSync(x.root,{recursive:true,force:true});}
});
test('fails closed if the HyperFrames runtime is stale, and writes no handoff',()=>{
 const x=synthetic();
 try{
  writeFileSync(join(x.hf,'runtime','sequence-card-to-space.js'),'// stale motion runtime');
  const r=run(x);
  assert.notEqual(r.status,0);
  assert.match(r.stderr,/out of sync/);
  assert.equal(existsSync(x.output),false);
 }finally{rmSync(x.root,{recursive:true,force:true});}
});
test('fails closed if authored fps or duration has changed',()=>{
 const x=synthetic();
 try{
  const file=join(x.hf,'index.html');
  writeFileSync(file,readFileSync(file,'utf8').replace('data-fps="30"','data-fps="24"'));
  const r=run(x);
  assert.notEqual(r.status,0);
  assert.match(r.stderr,/drifted/);
  assert.equal(existsSync(x.output),false);
 }finally{rmSync(x.root,{recursive:true,force:true});}
});
test('never overwrites existing handoff evidence',()=>{
 const x=synthetic();
 try{
  const r=run(x);assert.equal(r.status,0);
  const original=readFileSync(x.output);
  const second=run(x);
  assert.notEqual(second.status,0);
  assert.deepEqual(readFileSync(x.output),original);
 }finally{rmSync(x.root,{recursive:true,force:true});}
});
