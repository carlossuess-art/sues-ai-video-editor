import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,chmodSync,chownSync,symlinkSync,rmSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createMasterDirectorContextProvider} from '../src/master-director-context.js';
import {buildMasterDirectorPolicy} from '../src/master-director-policy-builder.js';
const ids=['a','b','c'].map(s=>s.repeat(64));
const assets={resolve:id=>({id,sha256:id,kind:'image',title:'Tapiz'}),metadata:()=>({approvedForProduction:true,license:{rightsStatus:'verified',commercialUseAllowed:true,proofRef:'proof'},testReportRef:'test'})};
const rules=readFileSync(new URL('../docs/SUES_MASTER_DIRECTOR_REGLAS_APROBADAS_20261104.md',import.meta.url),'utf8');
const policy=()=>buildMasterDirectorPolicy({approvedRulesText:rules,masters:ids.map(assetId=>({assetId})),assets});
const request=()=>({jobId:'project-01',job:{settings:{styleId:'SUES_DOPAMIN'}},story:{resources:[]},
 project:{inputs:{transcript:{words:[{text:'primera',start:0.2,end:.5},{text:'cortada',start:1.8,end:2.2},{text:'segunda',start:4.5,end:4.8}]}}},
 catalog:{sourceTimeMap:{spans:[{sourceIn:0,sourceOut:2,editIn:0},{sourceIn:4,sourceOut:5,editIn:2}]}},assets});
test('server context checks exact rules, policy file, asset evidence and edit time mapping',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'sues-master-policy-')),path=join(dir,'master-director-policy.json');
 try{const provider=createMasterDirectorContextProvider(dir);assert.equal(await provider(request()),null);
  writeFileSync(path,JSON.stringify(policy()),{mode:0o600});const v=await provider(request());
  assert.equal(v.registry.arcPolicy,'reel-observed-v2');assert.equal(v.registry.masterHashes['sues-tapiz-1'],ids[0]);assert.equal(v.registry.licensedAssets[ids[0]].rightsVerified,true);
  assert.equal(v.registry.wordAnchors['word-0-span-0'].time,.2);assert.equal(v.registry.wordAnchors['word-2-span-1'].time,2.5);
  assert.equal(v.registry.wordAnchors['word-1-span-0'],undefined);assert.deepEqual(v.registry.maskEvidence,{});
  chmodSync(dir,0o777);assert.equal(await provider(request()),null);chmodSync(dir,0o700);
  if(typeof process.getuid==='function'&&process.getuid()===0){chownSync(path,65534,65534);assert.equal(await provider(request()),null);chownSync(path,0,0);}
  const alias=join(tmpdir(),'sues-policy-link-'+process.pid);symlinkSync(dir,alias);try{assert.equal(await createMasterDirectorContextProvider(alias)(request()),null);}finally{rmSync(alias,{force:true});}
  const other=request();other.job.settings.styleId='SUES_IMPACTO';assert.equal((await provider(other)).blockedIssues[0].code,'MASTER_PROFILE_NOT_SUPPORTED');
  const calm=request();delete calm.job.settings.styleId;assert.equal((await provider(calm)).registry.profileId,'CALMA');
  const input=request();input.assets={...assets,metadata:()=>null};assert.equal((await provider(input)).blockedIssues[0].code,'ASSET_EVIDENCE_MISSING');
  const corrupt=policy();corrupt.rulebook[0].value='different';writeFileSync(path,JSON.stringify(corrupt));assert.equal(await provider(request()),null);
  writeFileSync(path,JSON.stringify(policy()));chmodSync(path,0o666);assert.equal(await provider(request()),null);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('missing approved rules never creates an incomplete trusted context',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'sues-master-policy-'));
 try{const p=policy();p.approvedRuleIds=p.approvedRuleIds.slice(1);writeFileSync(join(dir,'master-director-policy.json'),JSON.stringify(p),{mode:0o600});
  assert.equal(await createMasterDirectorContextProvider(dir)(request()),null);
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('approved-rule registry, review and decisions bind to provider fixture evidence',async()=>{
 const {MasterDirectorProjectStore}=await import('../src/master-director-project-store.js');
 const dir=mkdtempSync(join(tmpdir(),'sues-master-integrated-'));
 try{writeFileSync(join(dir,'master-director-policy.json'),JSON.stringify(policy()),{mode:0o600});
  const input=request(),provide=createMasterDirectorContextProvider(dir),source='f'.repeat(64),fp='edit-01';
  const store=new MasterDirectorProjectStore(join(dir,'job'),async story=>{
   const context=await provide({...input,story});return context&&{...context,sourceSha256:source,timelineFingerprint:fp,duration:10,nativePreflight:async()=>({status:'READY_FOR_EDITOR_PREVIEW'})};
  });
  const story={schema:'sues-master-story/v1',sourceSha256:source,timeline:{fingerprint:fp,timeSpace:'edit-timeline',fps:30,duration:10},visual:{mode:'brand-sues'},
   narrative:{centralMessage:'Una historia real',intendedExperience:'Recorrido visual',scenes:[{id:'intro',start:0,end:10,purpose:'Explicar la historia'}],motifs:[],arc:[{id:'observado',phase:'development',start:0,end:10,purpose:'Explicar la historia',evidence:[{kind:'transcript-word',wordId:'word-0-span-0'}]}]},resources:[],
   operations:[{id:'warm',sceneId:'intro',start:2,end:2.4,track:'transition',effect:'transition-native',renderer:'native',reason:'Cambio en el mensaje',parameters:{kind:'warm'},dependsOn:[],requiredQA:['rendered-frame','motion-playback']}]};
  const undocumented=structuredClone(story);delete undocumented.narrative.arc;const blocked=await store.review(store.saveDraft(undocumented).revision);assert.ok(blocked.issues.some(i=>i.code==='REEL_ARC_MISSING'));
  const {revision}=store.saveDraft(story),review=await store.review(revision);assert.equal(review.status,'READY_FOR_CHOICE');assert.ok(review.phasesNotDocumented.includes('moral'));assert.ok(!review.phasesNotDocumented.includes('development'));
  const decision=await store.decide(revision,review.fingerprint,'approve');assert.equal(decision.status,'DECISION_RECORDED');
  assert.equal((await store.layers(revision,decision.decisionId)).status,'STRUCTURE_READY_NOT_RENDERED');
  input.assets={...assets,metadata:()=>null};assert.equal((await store.layers(revision,decision.decisionId)).status,'BLOCKED');
 }finally{rmSync(dir,{recursive:true,force:true});}
});
