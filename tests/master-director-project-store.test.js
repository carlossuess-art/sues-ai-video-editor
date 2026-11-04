import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {MasterDirectorProjectStore} from '../src/master-director-project-store.js';
import {fixture} from './helpers/editor-fixture.js';
import {createEditorServer} from '../src/editor-server.js';

test('immutable stories detect tampering and reject forged server context',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'sues-master-store-'));
 try{
  const store=new MasterDirectorProjectStore(dir,async()=>null);
  const a=store.saveDraft({schema:'sues-master-story/v1',title:'first'});
  const b=store.saveDraft({schema:'sues-master-story/v1',title:'second'});
  assert.notEqual(a.revision,b.revision);assert.equal(store.readDraft(a.revision).title,'first');
  assert.equal((await store.review(a.revision)).issues[0].code,'TRUSTED_SERVER_CONTEXT_UNAVAILABLE');
  assert.equal((await store.decide(a.revision,'a'.repeat(64),'approve')).status,'BLOCKED');
  assert.throws(()=>store.readDraft('../bad'),/Invalid revision/);
  writeFileSync(join(dir,'master-director','drafts',a.revision+'.json'),'{}');
  assert.throws(()=>store.readDraft(a.revision),/integrity/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('editor API requires authentication, rejects forged policy, preserves prior revisions and fails closed',async()=>{
 const f=fixture(),app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles});
 try{
  const launch=await app.listen(),url=launch.split('/#')[0],job=app.jobs.create('test');
  const base=url+'/api/jobs/'+job.id+'/master-';
  const request=(path,headers,body)=>fetch(base+path,{method:'POST',headers,body:JSON.stringify(body)});
  assert.equal((await request('draft',{'Content-Type':'application/json'},{story:{schema:'sues-master-story/v1'}})).status,401);
  const session=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}});
  const headers={Cookie:session.headers.get('set-cookie').split(';')[0],'X-Sues-Request':'editor','Content-Type':'application/json'};
  assert.equal((await request('draft',headers,{story:{schema:'sues-master-story/v1'},registry:{approved:true}})).status,400);
  const response=await request('draft',headers,{story:{schema:'sues-master-story/v1',title:'one'}});assert.equal(response.status,201);
  const {revision}=await response.json();
  const other=await (await request('draft',headers,{story:{schema:'sues-master-story/v1',title:'two'}})).json();assert.notEqual(revision,other.revision);
  const review=await (await request('review',headers,{revision})).json();assert.equal(review.status,'BLOCKED');assert.equal(review.canExecute,false);
  const forged=await request('decision',headers,{revision,fingerprint:'a'.repeat(64),mode:'approve',registry:{}});assert.equal(forged.status,400);
  const decision=await (await request('decision',headers,{revision,fingerprint:'a'.repeat(64),mode:'approve'})).json();assert.equal(decision.status,'BLOCKED');
 }finally{if(app.server.listening)await app.close();rmSync(f.dir,{recursive:true,force:true});}
});

test('authenticated review and explicit approval use server evidence and expire on project change',async()=>{
 const f=fixture(),master='b'.repeat(64);
 const policy={registry:{brandId:'sues',profileId:'DOPAMIN',projectId:'p1',approvedRuleVersion:'rules-v1',
  approvedRuleIds:['r1'],requiredRuleKeys:['brand.background'],approvedReferenceIds:[],masterHashes:{tapiz:master},
  lockedMastersByMode:{'brand-sues':[{id:'tapiz',sha256:master}]},rendererCapabilities:{native:['transition-native']},licensedAssets:{}},
  rulebook:[{id:'r1',key:'brand.background',scope:'global',authority:'explicit-user-approval',status:'approved',value:'anthracite',supersedes:[]}]};
 const app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles,masterDirectorContext:async()=>policy});
 try{
  const launch=await app.listen(),url=launch.split('/#')[0],job=app.jobs.create('test');
  const session=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}});
  const headers={Cookie:session.headers.get('set-cookie').split(';')[0],'X-Sues-Request':'editor','Content-Type':'application/json'};
  const root=url+'/api/jobs/'+job.id;
  const post=(path,data)=>fetch(root+path,{method:'POST',headers,body:JSON.stringify(data)});
  const c=await (await fetch(root+'/external-catalog',{headers})).json();
  const story={schema:'sues-master-story/v1',sourceSha256:c.sourceSha256,timeline:{fingerprint:c.timelineFingerprint,timeSpace:'edit-timeline',fps:30,duration:c.duration},visual:{mode:'brand-sues'},
   narrative:{centralMessage:'Una historia real',intendedExperience:'Ritmo y calma',scenes:[{id:'s1',start:0,end:c.duration,purpose:'Desarrollar el mensaje'}],motifs:[]},resources:[],
   operations:[{id:'o1',sceneId:'s1',start:2,end:2.4,track:'transition',effect:'transition-native',renderer:'native',reason:'Expresar un cambio real',parameters:{kind:'warm'},dependsOn:[],requiredQA:['rendered-frame','motion-playback']}]};
  const {revision}=await (await post('/master-draft',{story})).json();
  const review=await (await post('/master-review',{revision})).json();assert.equal(review.status,'READY_FOR_CHOICE');assert.equal(review.canExecute,false);
  const decision=await (await post('/master-decision',{revision,fingerprint:review.fingerprint,mode:'approve'})).json();
  assert.equal(decision.status,'DECISION_RECORDED');assert.equal(decision.canExecute,false);
  const layers=await (await post('/master-layers',{revision,decisionId:decision.decisionId})).json();
  assert.equal(layers.status,'STRUCTURE_READY_NOT_RENDERED');assert.equal(layers.graph.nodes[0].id,'o1');
  assert.equal(layers.graph.editableInWebEditor,false);assert.equal(layers.canExecute,false);
  assert.equal(layers.remotion.status,'BLOCKED');assert.equal(layers.remotion.composition,null);
  policy.registry.approvedReferenceIds.push('changed-reference');
  assert.equal((await (await post('/master-layers',{revision,decisionId:decision.decisionId})).json()).status,'BLOCKED');
  policy.registry.approvedReferenceIds.pop();
  const update=await fetch(root,{method:'PATCH',headers,body:JSON.stringify({settings:{zoomIntensity:0}})});assert.equal(update.status,200);
  assert.equal((await (await post('/master-review',{revision})).json()).issues[0].code,'PROJECT_VERSION_CHANGED');
  assert.equal((await (await post('/master-decision',{revision,fingerprint:review.fingerprint,mode:'approve'})).json()).status,'BLOCKED');
  assert.equal((await (await post('/master-layers',{revision,decisionId:decision.decisionId})).json()).status,'BLOCKED');
  const altered={...story,timeline:{...story.timeline,duration:c.duration-1}};
  const stale=(await (await post('/master-draft',{story:altered})).json()).revision;
  assert.equal((await (await post('/master-review',{revision:stale})).json()).issues[0].code,'PROJECT_VERSION_CHANGED');
 }finally{if(app.server.listening)await app.close();rmSync(f.dir,{recursive:true,force:true});}
});

test('visual edits create a reversible story version and never modify the original',()=>{
 const dir=mkdtempSync(join(tmpdir(),'sues-master-edit-'));
 try{const s=new MasterDirectorProjectStore(dir,async()=>null);
  const original={schema:'sues-master-story/v1',operations:[{id:'layer-1',renderer:'remotion',parameters:{text:'Hola',visual:{rect:{x:1,y:2,width:20,height:30},opacity:1}}}]};
  const a=s.saveDraft(original),updated={rect:{x:22,y:2,width:20,height:30},opacity:.8};
  const b=s.editVisual(a.revision,'layer-1',updated);
  assert.notEqual(a.revision,b.revision);assert.equal(b.requiresNewReview,true);
  assert.equal(s.readDraft(a.revision).operations[0].parameters.visual.rect.x,1);
  assert.equal(s.readDraft(b.revision).operations[0].parameters.visual.rect.x,22);
  assert.throws(()=>s.editVisual(a.revision,'unknown',updated),/not found/);
  assert.throws(()=>s.editVisual(a.revision,'layer-1',{rect:{},registry:{approved:true}}),/Invalid/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('timing and parameter edits create new versions without changing protected fields',()=>{
 const dir=mkdtempSync(join(tmpdir(),'sues-master-operation-'));
 try{const s=new MasterDirectorProjectStore(dir,async()=>null),a=s.saveDraft({schema:'sues-master-story/v1',timeline:{duration:10},operations:[{id:'layer',sceneId:'s1',renderer:'remotion',effect:'text',start:1,end:3,parameters:{text:'original'}}]});
  const b=s.editOperation(a.revision,'layer',{start:2,end:4,parameters:{text:'cambio'}});
  assert.equal(s.readDraft(a.revision).operations[0].parameters.text,'original');
  const op=s.readDraft(b.revision).operations[0];assert.equal(op.start,2);assert.equal(op.end,4);assert.equal(op.parameters.text,'cambio');assert.equal(op.effect,'text');
  assert.throws(()=>s.editOperation(a.revision,'layer',{renderer:'native'}),/Invalid operation edit/);
  assert.throws(()=>s.editOperation(a.revision,'layer',{start:9,end:11}),/timing/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('version listing retains all immutable drafts without listing unrelated files',()=>{
 const dir=mkdtempSync(join(tmpdir(),'sues-master-list-'));
 try{const s=new MasterDirectorProjectStore(dir,async()=>null);assert.deepEqual(s.listDrafts(),[]);
  const a=s.saveDraft({schema:'sues-master-story/v1',narrative:{centralMessage:'Uno'}});
  const b=s.saveDraft({schema:'sues-master-story/v1',narrative:{centralMessage:'Dos'}});
  const list=s.listDrafts();assert.equal(list.length,2);assert.deepEqual(new Set(list.map(x=>x.revision)),new Set([a.revision,b.revision]));
 }finally{rmSync(dir,{recursive:true,force:true});}
});
