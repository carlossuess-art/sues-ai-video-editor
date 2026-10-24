import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {proposeLibraryCues} from '../src/director-library-cues.js';
import {proposeNarrativeScenes} from '../src/director-narrative-scenes.js';
const chain='a'.repeat(64),walk='b'.repeat(64),sunrise='c'.repeat(64),clock='d'.repeat(64),remote='e'.repeat(64);
const transcript=(text)=>({version:'1.0',language:'es',sourceDuration:Math.max(30,text.split(' ').length*.55+5),
 words:text.split(' ').map((w,i)=>({text:w,start:2+i*.55,end:2+(i+1)*.55}))});
const sample=(assetId,sceneTags,riskFlags=[])=>({assetId,scope:'sampled-frames-only',sampleSeconds:[0,1,2,3],sceneTags,riskFlags});
function fixture(){
 const root=mkdtempSync(join(tmpdir(),'sues-context-multimodal-')),lib=join(root,'library'),assets=join(root,'assets','metadata-v2');
 mkdirSync(lib);mkdirSync(assets,{recursive:true});
 const items=[
  [chain,'Cadena bajo agua','industrial-chain-in-water',['opresión','pesadez'],true,true,1080,1920],
  [walk,'Caminando hacia el sol','person-walking-outdoors',['transformación','camino'],true,true,1080,1920],
  [sunrise,'Valle al amanecer','mountain-sunrise',['esperanza','nuevo comienzo'],true,true,1080,1920],
  [clock,'Reloj de marca','analog-clock',['presión temporal'],true,true,1080,1920],
  [remote,'Cadena remota sin permiso','industrial-chain-in-water',['opresión'],false,true,1080,1920]
 ];
 writeFileSync(join(lib,'official-library-v1.json'),JSON.stringify({runtimeItems:items.map(([id,title,kind])=>({id,kind:'video',titleEs:title,keywords:['secuencia'],storedInEditor:id!==remote,approvedForProduction:false}))}));
 writeFileSync(join(lib,'purchased-source-index-309-v1.json'),JSON.stringify({items:[{id:'remoteDrive',originalName:'estrés remoto',installedInEditor:false,categoryHint:['estrés'],sourceUrl:'https://private.invalid'}]}));
 writeFileSync(join(lib,'asset-visual-review-v1.json'),JSON.stringify({schema:'sues-asset-visual-review/v1',items:[
  sample(chain,['industrial-chain-in-water']),sample(walk,['person-walking-outdoors'],['person-visible']),
  sample(sunrise,['mountain-sunrise']),sample(clock,['analog-clock'],['visible-third-party-marking']),sample(remote,['industrial-chain-in-water'])
 ]}));
 for(const [id,,scene,roles,allowed,vertical,width,height] of items){
  const metadata={assetId:id,sha256:id,kind:'video',license:{rightsStatus:allowed?'verified':'unverified',commercialUseAllowed:allowed},
    technical:{durationSec:7,width,height},semantics:{profileCompatibility:['DOPAMIN'],narrativeRoles:roles},approvedForProduction:false,
    privateStorageRef:'/protected/local/file',origin:'https://private.invalid/ref'};
  writeFileSync(join(assets,id+'.json'),JSON.stringify(metadata));
 }
 return {root,lib,assets};
}
test('contextual phrase selects a visually sampled chain for overload, not branded clock',()=>{
 const {root}=fixture();
 try{
  const result=proposeLibraryCues(root,transcript('He tenido unos meses muy ajetreados de trabajo.'));
  const context=result.cues.find(x=>x.decision==='contextual-review-only');
  assert.equal(context?.narrative.intent,'overload');
  assert.ok(context.candidates.some(x=>x.assetId===chain));
  assert.ok(context.candidates.every(x=>x.assetId!==clock&&x.assetId!==remote));
  assert.equal(context.candidates[0].evidence.visualContentVerified,false);
  assert.equal(context.candidates[0].needsHumanReview,true);
  assert.equal(result.approvedToAutoPublish,false);
  assert.ok(!JSON.stringify(result).includes('private.invalid'));
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('growth theme across phrase proposes walker or sunrise with exact timed anchor',()=>{
 const {root}=fixture();
 try{
  const t=transcript('Vamos a ir un poquito más allá en nuestro crecimiento personal.');
  const result=proposeLibraryCues(root,t);
  const growth=result.cues.find(c=>c.narrative?.intent==='growth');
  assert.ok(growth);
  assert.equal(growth.narrative.anchor,'crecimiento');
  assert.equal(t.words[growth.narrative.anchorWordIndex].text,'crecimiento');
  assert.ok(growth.candidates.some(c=>c.assetId===walk));
  assert.ok(growth.candidates.some(c=>c.assetId===sunrise));
  assert.ok(growth.candidates.every(c=>c.evidence.type==='narrative-plus-human-sampled-scene'));
  assert.ok(growth.end>growth.start&&growth.end<=t.sourceDuration);
  assert.deepEqual(result,proposeLibraryCues(root,t));
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('explicit negation and no narrative evidence abstain from contextual B-roll',()=>{
 const {root}=fixture();
 try{
  for(const utterance of ['No siento presión en el trabajo.','Sin estrés y sin agobios.','Hoy vamos a saludar a nuestra comunidad.']){
   const result=proposeLibraryCues(root,transcript(utterance));
   assert.equal(result.cues.filter(c=>c.decision==='contextual-review-only').length,0,utterance);
  }
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('unverified rights, missing scene sample or landscape assets never qualify',()=>{
 const {root,lib,assets}=fixture();
 try{
  let x=proposeLibraryCues(root,transcript('Tenemos muchos bloqueos y presión.'));
  assert.ok(x.cues.some(c=>c.candidates.some(v=>v.assetId===chain)));
  const p=join(assets,chain+'.json'),d=JSON.parse(readFileSync(p,'utf8'));d.license.commercialUseAllowed=false;writeFileSync(p,JSON.stringify(d));
  x=proposeLibraryCues(root,transcript('Tenemos muchos bloqueos y presión.'));
  assert.ok(!x.cues.some(c=>c.candidates.some(v=>v.assetId===chain&&c.decision==='contextual-review-only')));
  const s=JSON.parse(readFileSync(join(lib,'asset-visual-review-v1.json'),'utf8'));
  s.items=s.items.filter(v=>v.assetId!==chain);writeFileSync(join(lib,'asset-visual-review-v1.json'),JSON.stringify(s));
  x=proposeLibraryCues(root,transcript('Tenemos muchos bloqueos y presión.'));
  assert.ok(!x.cues.some(c=>c.decision==='contextual-review-only'));
 }finally{rmSync(root,{recursive:true,force:true});}
});
