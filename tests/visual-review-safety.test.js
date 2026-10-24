import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {proposeLibraryCues} from '../src/director-library-cues.js';
import {searchPrivateLibrary} from '../src/private-library-search.js';

const clock='a'.repeat(64),chain='b'.repeat(64),walker='c'.repeat(64);
const create=()=>{
 const root=mkdtempSync(join(tmpdir(),'sues-visual-curation-')),dir=join(root,'library');
 mkdirSync(dir);
 writeFileSync(join(dir,'official-library-v1.json'),JSON.stringify({runtimeItems:[
  {id:clock,kind:'video',titleEs:'Reloj · presión del tiempo',keywords:['presión','estrés'],storedInEditor:true},
  {id:chain,kind:'video',titleEs:'Cadena bajo agua · presión',keywords:['presión','estrés','bloqueo'],storedInEditor:true},
  {id:walker,kind:'video',titleEs:'Persona caminando hacia luz · transformación',keywords:['transformación'],storedInEditor:true},
 ]}));
 writeFileSync(join(dir,'purchased-source-index-309-v1.json'),JSON.stringify({items:[]}));
 return {root,dir};
};
const transcript=(text)=>({version:'1.0',language:'es',sourceDuration:25,
 words:text.split(' ').map((x,i)=>({text:x,start:2+i*.45,end:2+(i+1)*.45}))});
const manifest=(items)=>JSON.stringify({schema:'sues-asset-visual-review/v1',items});
const sample=(id,flags=[])=>({assetId:id,scope:'sampled-frames-only',sampleSeconds:[0,1,2,3],riskFlags:flags});
test('a sampled logo warning suppresses clock B-roll but preserves unmarked alternative and manual search',()=>{
 const {root,dir}=create();
 try{
  const before=proposeLibraryCues(root,transcript('Siento presión y estrés durante esta etapa.'));
  assert.ok(before.cues.some(c=>c.candidates.some(x=>x.assetId===clock)));
  writeFileSync(join(dir,'asset-visual-review-v1.json'),manifest([
   sample(clock,['visible-third-party-marking']),sample(chain),sample(walker,['person-visible'])
  ]));
  const after=proposeLibraryCues(root,transcript('Siento presión y estrés durante esta etapa.'));
  assert.ok(after.cues.some(c=>c.candidates.some(x=>x.assetId===chain)));
  assert.ok(!after.cues.some(c=>c.candidates.some(x=>x.assetId===clock)));
  const manual=searchPrivateLibrary(root,'presión').results.find(r=>r.id===clock);
  assert.ok(manual);
  assert.deepEqual(manual.visualReview.riskFlags,['visible-third-party-marking']);
  assert.equal(after.approvedToAutoPublish,false);
  assert.ok(after.cues.every(c=>c.candidates.every(x=>x.needsHumanReview&&x.evidence.visualContentVerified===false)));
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('person in sampled frames remains a review-only candidate, never considered visually approved',()=>{
 const {root,dir}=create();
 try{
  writeFileSync(join(dir,'asset-visual-review-v1.json'),manifest([sample(walker,['person-visible'])]));
  const result=proposeLibraryCues(root,transcript('Estoy viviendo una transformación muy profunda.'));
  const candidate=result.cues.flatMap(c=>c.candidates).find(x=>x.assetId===walker);
  assert.ok(candidate);
  assert.deepEqual(candidate.evidence.visualSample.riskFlags,['person-visible']);
  assert.equal(candidate.evidence.visualSample.scope,'sampled-frames-only');
  assert.equal(candidate.evidence.visualContentVerified,false);
  assert.equal(candidate.needsHumanReview,true);
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('visual review manifest cannot be a symlink, malformed input or hidden URL metadata',()=>{
 const {root,dir}=create();
 try{
  const p=join(dir,'asset-visual-review-v1.json');
  const source=join(root,'external.json');
  writeFileSync(source,manifest([sample(clock)]));symlinkSync(source,p);
  assert.throws(()=>searchPrivateLibrary(root,'presión'),/Unsafe/);
  rmSync(p);
  writeFileSync(p,manifest([{...sample(clock),secretUrl:'https://private.invalid'}]));
  // An unknown field cannot be carried to the public result.
  const response=searchPrivateLibrary(root,'presión');
  assert.ok(!JSON.stringify(response).includes('private.invalid'));
  writeFileSync(p,manifest([{...sample(clock),riskFlags:['unsafe-arbitrary-string']}]));
  assert.throws(()=>searchPrivateLibrary(root,'presión'),/Invalid/);
  writeFileSync(p,manifest([sample(clock),sample(clock)]));
  assert.throws(()=>searchPrivateLibrary(root,'presión'),/Invalid/);
 }finally{rmSync(root,{recursive:true,force:true});}
});
