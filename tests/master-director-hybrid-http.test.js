import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {fixture} from './helpers/editor-fixture.js';
import {createEditorServer} from '../src/editor-server.js';
import {MasterHybridRequests} from '../src/master-director-hybrid-requests.js';
const master='b'.repeat(64),font='e'.repeat(64);
test('hybrid HTTP start is authenticated, idempotent and cannot reveal a partial video',{timeout:30000},async()=>{
 const f=fixture(),policy={registry:{brandId:'sues',profileId:'DOPAMIN',projectId:'p1',
  approvedRuleVersion:'rules-v1',approvedRuleIds:['r1'],requiredRuleKeys:['brand.background'],approvedReferenceIds:[],
  masterHashes:{tapiz:master},lockedMastersByMode:{'brand-sues':[{id:'tapiz',sha256:master}]},
  rendererCapabilities:{native:['transition-native'],remotion:['text']},licensedAssets:{},
  canvas:{width:1080,height:1920},verifiedFonts:{'Montserrat:700':{sha256:font}}},
  rulebook:[{id:'r1',key:'brand.background',scope:'global',authority:'explicit-user-approval',
   status:'approved',value:'anthracite',supersedes:[]}]};
 const app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles,
  masterDirectorContext:async()=>policy,masterPreviewConfig:{entryFile:'/trusted/entry',
   remotionCli:'/trusted/cli',browserExecutable:'/trusted/browser'}});
 let stopped=false;
 try{
  app.jobs.autoStart=false;const launch=await app.listen(),url=launch.split('/#')[0];
  const job=app.jobs.create('test',{musicEnabled:false,sfxEnabled:false});
  const session=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}});
  assert.equal(session.status,200);
  const headers={Cookie:session.headers.get('set-cookie').split(';')[0],
   'X-Sues-Request':'editor','Content-Type':'application/json'};
  const root=url+'/api/jobs/'+job.id;
  const post=(path,value,h=headers)=>fetch(root+path,{method:'POST',headers:h,body:JSON.stringify(value)});
  const catalog=await (await fetch(root+'/external-catalog',{headers})).json();
  const visual={rect:{x:100,y:300,width:500,height:300},zIndex:4,opacity:1,
   typography:{family:'Montserrat',sizePx:80,weight:700,color:'#ffffff'},keyframes:[]};
  const story={schema:'sues-master-story/v1',sourceSha256:catalog.sourceSha256,
   timeline:{fingerprint:catalog.timelineFingerprint,timeSpace:'edit-timeline',fps:30,duration:catalog.duration},
   visual:{mode:'brand-sues'},narrative:{centralMessage:'Prueba híbrida',intendedExperience:'Transición',
    scenes:[{id:'s1',start:0,end:catalog.duration,purpose:'Explicar'}],motifs:[]},resources:[],
   operations:[
    {id:'native',sceneId:'s1',renderer:'native',track:'transition',effect:'transition-native',
     start:2,end:2.4,reason:'Cambio medido',parameters:{kind:'warm'},dependsOn:[],
     requiredQA:['rendered-frame','motion-playback']},
    {id:'remotion',sceneId:'s1',renderer:'remotion',track:'graphics',effect:'text',
     start:3,end:4,reason:'Texto medido',parameters:{text:'CAMBIO',visual},dependsOn:['native'],
     requiredQA:['rendered-frame','motion-playback','narrative-review']}]};
  const draft=await (await post('/master-draft',{story})).json();
  const review=await (await post('/master-review',{revision:draft.revision})).json();
  assert.equal(review.status,'READY_FOR_CHOICE',JSON.stringify(review));
  const decision=await (await post('/master-decision',{revision:draft.revision,
   fingerprint:review.fingerprint,mode:'approve'})).json();
  const requestId=randomUUID(),payload={revision:draft.revision,decisionId:decision.decisionId,requestId};
  assert.equal((await post('/master-hybrid-start',payload,{'Content-Type':'application/json'})).status,401);
  assert.equal((await post('/master-hybrid-start',{...payload,registry:{approved:true}})).status,400);
  assert.equal((await fetch(root+'/master-hybrid-status?requestId='+requestId)).status,401);
  const start=await post('/master-hybrid-start',payload);
  assert.equal(start.status,202,await start.text());
  const duplicate=await post('/master-hybrid-start',payload);
  assert.equal(duplicate.status,202);
  assert.equal((await post('/master-hybrid-start',{...payload,requestId:randomUUID()})).status,409);
  let status;
  for(let i=0;i<60;i++){
   status=await (await fetch(root+'/master-hybrid-status?requestId='+requestId,{headers})).json();
   if(status.childId)break;
   await new Promise(r=>setTimeout(r,50));
  }
  assert.equal(status.status,'RUNNING',JSON.stringify(status));
  assert.equal(typeof status.childId,'string');
  assert.equal(status.final,false);
  const child=app.jobs.get(status.childId);
  assert.equal(child.instructions.at(-1).intermediate,true);
  assert.equal(child.state,'QUEUED');
  const childView=await (await fetch(url+'/api/jobs/'+child.id,{headers})).json();
  assert.equal(childView.intermediate,true);assert.equal(childView.final,false);
  assert.equal((await fetch(url+'/api/jobs/'+child.id+'/media',{headers})).status,409);
  assert.equal((await fetch(url+'/api/jobs/'+child.id+'/preview',{headers})).status,409);
  assert.equal((await fetch(url+'/api/jobs/'+child.id+'/render',{method:'POST',headers,body:'{}'})).status,409);
  assert.equal(app.jobs.jobs.size,2,'duplicate request did not create a second native child');
  await app.close();stopped=true;
  await new Promise(r=>setTimeout(r,400));
  const journal=new MasterHybridRequests(app.jobs.dir(job.id));
  const recovered=journal.get(requestId);
  assert.equal(recovered.status,'INTERRUPTED',JSON.stringify(recovered));
  assert.equal(journal.hasInterrupted(),true);
 }finally{
  if(!stopped)try{await app.close()}catch{}
  rmSync(f.dir,{recursive:true,force:true});
 }
});
