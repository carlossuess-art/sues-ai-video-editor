import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {proposeLibraryCues} from '../src/director-library-cues.js';
import {searchPrivateLibrary} from '../src/private-library-search.js';
import {directorAssets} from '../src/director-context.js';

const transcript=(text)=>({version:'1.0',language:'es',sourceDuration:30,
 words:text.split(' ').map((w,i)=>({text:w,start:2+i*.5,end:2+(i+1)*.5}))});
const setup=()=>{
 const root=mkdtempSync(join(tmpdir(),'sues-context-')),lib=join(root,'library');
 mkdirSync(lib);
 writeFileSync(join(lib,'official-library-v1.json'),JSON.stringify({runtimeItems:[
  {id:'clock',kind:'video',titleEs:'Reloj en primer plano · presión del tiempo',
   keywords:['presión temporal'],emotionTags:['tensión','estrés'],storedInEditor:true,approvedForProduction:false},
  {id:'walking',kind:'video',titleEs:'Persona caminando hacia la luz · transformación',
   keywords:['transformación','camino','esperanza'],storedInEditor:true,approvedForProduction:false},
  {id:'sparks',kind:'overlay',titleEs:'Chispas doradas · revelación',
   keywords:['destello'],storedInEditor:true,approvedForProduction:false},
  {id:'sound',kind:'audio',titleEs:'Efecto de tiempo',storedInEditor:true}
 ]}));
 writeFileSync(join(lib,'purchased-source-index-309-v1.json'),JSON.stringify({items:[
  {id:'remote',originalName:'Recurso tiempo.mp4',categoryHint:['tiempo'],installedInEditor:false,sourceUrl:'https://private.invalid'}
 ]}));
 return root;
};
test('generic time/luz references alone do not suggest unrelated full-frame B-roll',()=>{
 const root=setup();
 try{
  const a=proposeLibraryCues(root,transcript('Tenemos tiempo para organizarnos mejor.'));
  const b=proposeLibraryCues(root,transcript('Ya veo la luz con claridad.'));
  const c=proposeLibraryCues(root,transcript('Hacía tiempo que no pasaba por aquí.'));
  assert.equal(a.cues.flatMap(c=>c.candidates).filter(c=>c.kind==='video').length,0);
  assert.equal(b.cues.flatMap(c=>c.candidates).filter(c=>c.kind==='video').length,0);
  assert.equal(c.cues.flatMap(c=>c.candidates).filter(c=>c.kind==='video').length,0);
  assert.ok(!JSON.stringify(a).includes('private.invalid'));
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('specific pressure and transformation anchors still yield review-only video proposals',()=>{
 const root=setup();
 try{
  const pressure=proposeLibraryCues(root,transcript('Siento presión del tiempo y estrés.'));
  const renewal=proposeLibraryCues(root,transcript('Estoy viviendo una transformación profunda.'));
  assert.ok(pressure.cues.some(c=>c.candidates.some(x=>x.assetId==='clock')));
  assert.ok(renewal.cues.some(c=>c.candidates.some(x=>x.assetId==='walking')));
  for(const x of [...pressure.cues.flatMap(c=>c.candidates),...renewal.cues.flatMap(c=>c.candidates)]){
   assert.equal(x.needsHumanReview,true);
   assert.equal(x.evidence.visualContentVerified,false);
  }
  assert.equal(pressure.approvedToAutoPublish,false);
  assert.deepEqual(pressure,proposeLibraryCues(root,transcript('Siento presión del tiempo y estrés.')));
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('search exposes exact-vs-synonym evidence and preserves review/remote separation',()=>{
 const root=setup();
 try{
  const broad=searchPrivateLibrary(root,'tiempo');
  const clock=broad.results.find(r=>r.id==='clock');
  assert.deepEqual(clock.lexicalEvidence.exactTerms,['tiempo']);
  const pressure=searchPrivateLibrary(root,'opresión');
  assert.ok(pressure.results.every(r=>r.creativeApproval!=='approved'));
  const sparkle=searchPrivateLibrary(root,'revelación').results.find(r=>r.id==='sparks');
  assert.deepEqual(sparkle.lexicalEvidence.exactTerms,['revelacion']);
  assert.equal(sparkle.creativeApproval,'review-required');
  assert.ok(broad.results.some(r=>r.id==='remote'&&r.availability==='remote-drive-only'));
 }finally{rmSync(root,{recursive:true,force:true});}
});


test('director includes real sampled description and filters risky review overlays',()=>{
 const root=setup();try{const assetId='a'.repeat(64),badId='b'.repeat(64);
 writeFileSync(join(root,'library','complete-visual-audit-v1.json'),JSON.stringify({items:[{assetId,descriptionEs:'Manos contando billetes',reviewScope:'sampled-frames-only',sampleSeconds:[1,2],riskFlags:[]},{assetId:badId,descriptionEs:'Marca ajena',reviewScope:'sampled-frames-only',riskFlags:['visible-third-party-marking']}]}));
 const library={list:()=>[{id:assetId,kind:'video',title:'Pago'},{id:badId,kind:'video',title:'Marca'}],semanticCatalog:()=>({assets:[]})};
 const result=directorAssets(library,root);assert.equal(result.length,1);assert.equal(result[0].visualDescription,'Manos contando billetes');assert.equal(result[0].visualReviewScope,'sampled-frames-only');assert.equal(result[0].creativeApproval,'review-required');
 }finally{rmSync(root,{recursive:true,force:true});}
});
