import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {fixture} from './helpers/editor-fixture.js';
import {createEditorServer} from '../src/editor-server.js';

test('authentically signed HTTP selection stages ONE HF motion as a new master revision; explicit approval follows',async()=>{
 const f=fixture(),tpath=join(f.dir,'transcript.json'),t=JSON.parse(readFileSync(tpath,'utf8'));
 const texts=['¿Y','si','te','escucharas?','Haz','espacio','para','escucharte.'];
 const frames=[8,16,24,30,86,99,108,120];
 t.words=texts.map((text,i)=>({text,start:2+frames[i]/30,end:2+frames[i]/30+.13}));
 writeFileSync(tpath,JSON.stringify(t));
 const master='b'.repeat(64);
 const context={registry:{brandId:'sues',profileId:'DOPAMIN',projectId:'qa-p1',
  approvedRuleVersion:'rule-v1',approvedRuleIds:['r1'],requiredRuleKeys:['brand.background'],
  approvedReferenceIds:[],masterHashes:{tapiz:master},
  lockedMastersByMode:{'brand-sues':[{id:'tapiz',sha256:master}]},
  rendererCapabilities:{},licensedAssets:{},canvas:{width:1080,height:1920}},
  rulebook:[{id:'r1',key:'brand.background',scope:'global',
   authority:'explicit-user-approval',status:'approved',value:'anthracite',supersedes:[]}]};
 const server=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles,
  masterDirectorContext:async()=>context});
 try{
  const url0=await server.listen(),url=url0.split('/#')[0],token=url0.split('#')[1];
  const session=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+token}});
  assert.equal(session.status,200);
  const cookie=session.headers.get('set-cookie').split(';')[0];
  const headers={Cookie:cookie,'Content-Type':'application/json','X-Sues-Request':'editor'};
  const job=await (await fetch(url+'/api/jobs',{method:'POST',headers,body:JSON.stringify({profileId:'test'})})).json();
  const base=url+'/api/jobs/'+job.id;
  const post=(path,body,head=headers)=>fetch(base+'/'+path,{method:'POST',headers:head,body:JSON.stringify(body)});
  const catalog=await (await fetch(base+'/external-catalog',{headers})).json();
  const draft={schema:'sues-master-story/v1',sourceSha256:catalog.sourceSha256,
   timeline:{fingerprint:catalog.timelineFingerprint,timeSpace:'edit-timeline',fps:30,duration:catalog.duration},
   visual:{mode:'brand-sues'},resources:[],
   narrative:{centralMessage:'Pregunta sobre escucharse',intendedExperience:'Comprender y abrir espacio',
    scenes:[{id:'scene_hf',start:0,end:catalog.duration,purpose:'Reflexionar sobre la escucha y el espacio interior'}],
    motifs:[]},
   operations:[]};
  const stored=await (await post('master-draft',{story:draft})).json();
  assert.match(stored.revision,/^[a-f0-9]{64}$/);
  const promoted=await (await post('master-current',{revision:stored.revision,expectedRevision:null})).json();
  assert.equal(promoted.status,'CURRENT');
  const captions=server.jobs.plan(job.id).manifest.captions;
  const word=index=>{
   const cap=captions.find(x=>x.wordIndexes?.includes(index));assert.ok(cap);
   return {captionId:cap.id,displayWordIndex:cap.wordIndexes.indexOf(index),
    sourceWordIndex:index,captionText:cap.text};
  };
  const payload={fingerprint:server.jobs.get(job.id).fingerprint,
   selections:[word(3),word(5)],expectedStoryRevision:stored.revision};
  assert.equal((await post('motion-hyperframes-stage',payload,{'Content-Type':'application/json'})).status,401);
  const csrf=await post('motion-hyperframes-stage',payload,{Cookie:cookie,'Content-Type':'application/json'});
  assert.equal(csrf.status,403);
  const forged=await post('motion-hyperframes-stage',{...payload,approve:true});
  assert.equal(forged.status,400);
  const resp=await post('motion-hyperframes-stage',payload);
  const stage=await resp.json();
  assert.equal(resp.status,201,JSON.stringify(stage));
  assert.equal(stage.status,'NEW_MASTER_DRAFT_REQUIRES_CREATIVE_APPROVAL');
  assert.equal(stage.creativeApproved,false);
  assert.equal(stage.rendered,false);
  assert.equal(stage.fablecutEdited,false);
  assert.equal(stage.canExecute,false);
  assert.notEqual(stage.storyRevision,stored.revision);
  const current=await (await fetch(base+'/master-current',{headers})).json();
  assert.equal(current.revision,stage.storyRevision);
  assert.equal(current.story.operations.length,1);
  const op=current.story.operations[0];
  assert.equal(op.renderer,'hyperframes');
  assert.equal(op.effect,'hyperframes-word-motion-v1');
  assert.equal(op.track,'graphics');
  assert.equal(op.sceneId,'scene_hf');
  assert.equal(op.start,2);
  assert.equal(op.end,2+151/30);
  assert.equal(op.parameters.preflightFingerprint,stage.preflightFingerprint);
  assert.deepEqual(JSON.parse(op.parameters.variables.wordScheduleJson).wordStartFrames,[8,16,24,30]);
  assert.deepEqual(JSON.parse(op.parameters.variables.wordScheduleJson).followWordStartFrames,[86,99,108,120]);
  assert.equal((await post('motion-hyperframes-stage',payload)).status,409,'Stale head must fail');
  const review=await (await post('master-review',{revision:stage.storyRevision})).json();
  assert.equal(review.status,'READY_FOR_CHOICE',JSON.stringify(review));
  const decision=await (await post('master-decision',{
   revision:stage.storyRevision,fingerprint:review.fingerprint,mode:'approve'})).json();
  assert.equal(decision.status,'DECISION_RECORDED',JSON.stringify(decision));
  assert.equal(decision.canExecute,false,'Creative review is separate from backend execution');
  const layers=await (await post('master-layers',{revision:stage.storyRevision,decisionId:decision.decisionId})).json();
  assert.equal(layers.status,'STRUCTURE_READY_NOT_RENDERED',JSON.stringify(layers));
  assert.equal(layers.graph.nodes[0].renderer,'hyperframes');
  assert.equal(layers.canExecute,false);
  assert.equal(layers.graph.editableInWebEditor,false);
  // A new job/source change invalidates approval evidence. Direct edits in a
  // copied data store are outside production and must not be treated as trusted.
  const stale=server.jobs.get(job.id);
  const savedFp=stale.fingerprint;
  stale.fingerprint='a'.repeat(64);
  const invalid=await (await post('master-review',{revision:stage.storyRevision})).json();
  assert.equal(invalid.status,'BLOCKED');
  assert.ok(invalid.issues.some(x=>x.code==='HYPERFRAMES_PREFLIGHT_EVIDENCE_UNAVAILABLE'));
  stale.fingerprint=savedFp;
 }finally{await server.close();rmSync(f.dir,{recursive:true,force:true});}
});
