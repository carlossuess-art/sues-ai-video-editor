import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {MasterDirectorProjectStore} from '../src/master-director-project-store.js';

test('phase 1 receipt: immutable plan, editable revision and decision invalidation',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'sues-phase1-'));
 const sha='b'.repeat(64),font='e'.repeat(64);
 let projectFingerprint='timeline-1';
 const contextProvider=async story=>({
  sourceSha256:sha,timelineFingerprint:projectFingerprint,duration:12,
  registry:{brandId:'sues',profileId:'DOPAMIN',projectId:'p1',
   approvedRuleVersion:'rules-1',approvedRuleIds:['r1'],
   requiredRuleKeys:['brand.background'],approvedReferenceIds:[],
   masterHashes:{tapiz:sha},lockedMastersByMode:{'brand-sues':[{id:'tapiz',sha256:sha}]},
   rendererCapabilities:{remotion:['text']},licensedAssets:{},
   canvas:{width:1080,height:1920},
   verifiedFonts:{'Montserrat:700':{sha256:font}}},
  rulebook:[{id:'r1',key:'brand.background',scope:'global',
   authority:'explicit-user-approval',status:'approved',value:'anthracite',supersedes:[]}]
 });
 try{
 const store=new MasterDirectorProjectStore(dir,contextProvider);
 const visual={rect:{x:20,y:40,width:600,height:300},zIndex:1,opacity:1,
  typography:{family:'Montserrat',sizePx:80,weight:700,color:'#ffffff'},keyframes:[]};
 const story={schema:'sues-master-story/v1',sourceSha256:sha,
  timeline:{fingerprint:'timeline-1',timeSpace:'edit-timeline',fps:30,duration:12},
  visual:{mode:'brand-sues'},narrative:{centralMessage:'Presencia y respiracion',
   intendedExperience:'Claridad progresiva',
   scenes:[{id:'intro',start:0,end:12,purpose:'Explicar la historia'}],motifs:[]},
  resources:[],operations:[{id:'texto',sceneId:'intro',start:2,end:4,track:'graphics',
   renderer:'remotion',effect:'text',reason:'Subrayar el mensaje',
   parameters:{text:'Respira',visual},dependsOn:[],
   requiredQA:['rendered-frame','motion-playback','narrative-review']}]};
 const {revision}=store.saveDraft(story);
 assert.deepEqual(store.readDraft(revision),story);
 const review=await store.review(revision);
 assert.equal(review.status,'READY_FOR_CHOICE',JSON.stringify(review));
 assert.equal(review.canExecute,false);
 assert.equal(review.timeline[0].operations[0].parameters.text,'Respira');
 const decision=await store.decide(revision,review.fingerprint,'approve');
 assert.equal(decision.status,'DECISION_RECORDED');
 assert.equal((await store.layers(revision,decision.decisionId)).status,'STRUCTURE_READY_NOT_RENDERED');
 const edit=store.editOperation(revision,'texto',{parameters:{text:'Presencia',visual}});
 assert.equal(edit.requiresNewReview,true);assert.notEqual(edit.revision,revision);
 assert.equal(store.readDraft(revision).operations[0].parameters.text,'Respira');
 assert.equal(store.readDraft(edit.revision).operations[0].parameters.text,'Presencia');
 assert.equal((await store.layers(edit.revision,decision.decisionId)).status,'BLOCKED');
 const nextReview=await store.review(edit.revision);
 assert.equal(nextReview.status,'READY_FOR_CHOICE',JSON.stringify(nextReview));
 assert.notEqual(nextReview.fingerprint,review.fingerprint);
 const nextDecision=await store.decide(edit.revision,nextReview.fingerprint,'approve');
 assert.equal(nextDecision.status,'DECISION_RECORDED');
 projectFingerprint='timeline-2';
 assert.equal((await store.review(edit.revision)).issues[0].code,'PROJECT_VERSION_CHANGED');
 assert.equal((await store.layers(edit.revision,nextDecision.decisionId)).status,'BLOCKED');
 assert.equal(store.listDrafts().length,2);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
