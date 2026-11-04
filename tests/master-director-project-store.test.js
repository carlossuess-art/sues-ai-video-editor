import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,writeFileSync,mkdirSync,readFileSync} from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
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

test('render preflight requires a current approval and server-probed source; it never renders',async()=>{
 const f=fixture(),master='b'.repeat(64),font='e'.repeat(64);
 const policy={registry:{brandId:'sues',profileId:'DOPAMIN',projectId:'p1',approvedRuleVersion:'rules-v1',
  approvedRuleIds:['r1'],requiredRuleKeys:['brand.background'],approvedReferenceIds:[],masterHashes:{tapiz:master},
  lockedMastersByMode:{'brand-sues':[{id:'tapiz',sha256:master}]},rendererCapabilities:{remotion:['text']},licensedAssets:{},
  canvas:{width:1080,height:1920},verifiedFonts:{'Montserrat:700':{sha256:font}}},
  rulebook:[{id:'r1',key:'brand.background',scope:'global',authority:'explicit-user-approval',status:'approved',value:'anthracite',supersedes:[]}]};
 let changeDuringProbe=false;
 const app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles,masterDirectorContext:async()=>policy,
  masterSourceProbe:async project=>{if(changeDuringProbe)policy.registry.approvedReferenceIds.push('changed');return {status:'SOURCE_CFR30_VERIFIED',sourceTiming:'cfr30-verified',sourceHasAudio:true,sourceDuration:24,width:1080,height:1920,sourceSha256:project.boundHashes.source}}});
 try{const launch=await app.listen(),url=launch.split('/#')[0],job=app.jobs.create('test');
  const session=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}}),headers={Cookie:session.headers.get('set-cookie').split(';')[0],'X-Sues-Request':'editor','Content-Type':'application/json'};
  const root=url+'/api/jobs/'+job.id,post=(path,data)=>fetch(root+path,{method:'POST',headers,body:JSON.stringify(data)});
  const c=await (await fetch(root+'/external-catalog',{headers})).json();
  const visual={rect:{x:100,y:300,width:500,height:300},zIndex:1,opacity:1,typography:{family:'Montserrat',sizePx:80,weight:700,color:'#ffffff'},keyframes:[]};
  const story={schema:'sues-master-story/v1',sourceSha256:c.sourceSha256,timeline:{fingerprint:c.timelineFingerprint,timeSpace:'edit-timeline',fps:30,duration:c.duration},visual:{mode:'brand-sues'},
   narrative:{centralMessage:'Una historia real',intendedExperience:'Recorrido visual',scenes:[{id:'intro',start:0,end:c.duration,purpose:'Explicar la historia'}],motifs:[]},resources:[],
   operations:[{id:'texto',sceneId:'intro',start:2,end:4,track:'graphics',effect:'text',renderer:'remotion',reason:'Reforzar el mensaje',parameters:{text:'Hola',visual},dependsOn:[],requiredQA:['rendered-frame','motion-playback','narrative-review']}]};
  const {revision}=await (await post('/master-draft',{story})).json(),review=await (await post('/master-review',{revision})).json();
  const decision=await (await post('/master-decision',{revision,fingerprint:review.fingerprint,mode:'approve'})).json();
  const result=await (await post('/master-render-preflight',{revision,decisionId:decision.decisionId})).json();
  assert.equal(result.status,'READY_FOR_SOURCE_STAGING');assert.equal(result.canExecute,false);assert.equal(result.composition.source.audio,true);
  assert.equal(app.jobs.get(job.id).state,'PREVIEW_READY');assert.equal(app.jobs.children.size,0);
  changeDuringProbe=true;assert.equal((await post('/master-render-preflight',{revision,decisionId:decision.decisionId})).status,409);changeDuringProbe=false;policy.registry.approvedReferenceIds.pop();
  assert.equal((await post('/master-render-preflight',{revision,decisionId:decision.decisionId,sourceSha256:'forged'})).status,400);
 }finally{if(app.server.listening)await app.close();rmSync(f.dir,{recursive:true,force:true});}
});

test('private preview requires approval, verifies output and is idempotent for the same request',async()=>{
 const f=fixture(),master='b'.repeat(64),font='e'.repeat(64);let renders=0,outputFile='',invalidateDuringRender=false;
 const policy={registry:{brandId:'sues',profileId:'DOPAMIN',projectId:'p1',approvedRuleVersion:'rules-v1',approvedRuleIds:['r1'],requiredRuleKeys:['brand.background'],approvedReferenceIds:[],masterHashes:{tapiz:master},lockedMastersByMode:{'brand-sues':[{id:'tapiz',sha256:master}]},rendererCapabilities:{remotion:['text']},licensedAssets:{},canvas:{width:1080,height:1920},verifiedFonts:{'Montserrat:700':{sha256:font}}},rulebook:[{id:'r1',key:'brand.background',scope:'global',authority:'explicit-user-approval',status:'approved',value:'anthracite',supersedes:[]}]};
 const renderer=async({composition,workRoot,approvalCheck})=>{assert.equal(await approvalCheck(),true);renders++;const dir=join(workRoot,'master-preview-'+String(renders).padStart(6,'0'));mkdirSync(dir,{recursive:true});outputFile=join(dir,'preview.mp4');writeFileSync(outputFile,'synthetic-preview');if(invalidateDuringRender)policy.registry.approvedReferenceIds.push('changed');const outputSha256=createHash('sha256').update('synthetic-preview').digest('hex');return {status:'PREVIEW_RENDERED_UNVERIFIED',record:{id:'11111111-1111-4111-8111-111111111111',planFingerprint:composition.planFingerprint,sourceSha256:composition.sourceSha256,outputSha256,bytes:17,final:false},outputPath:outputFile}};
 const auditor=async({outputPath})=>({status:'TECHNICAL_PASS_HUMAN_QA_PENDING',outputSha256:createHash('sha256').update(readFileSync(outputPath)).digest('hex')});
 const app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles,masterDirectorContext:async()=>policy,masterSourceProbe:async project=>({status:'SOURCE_CFR30_VERIFIED',sourceTiming:'cfr30-verified',sourceHasAudio:true,sourceDuration:24,width:1080,height:1920,sourceSha256:project.boundHashes.source}),masterPreviewConfig:{entryFile:'/tmp/a',remotionCli:'/tmp/b',browserExecutable:'/tmp/c'},masterPreviewRenderer:renderer,masterPreviewAuditor:auditor});
 try{const launch=await app.listen(),url=launch.split('/#')[0],job=app.jobs.create('test');const session=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}}),headers={Cookie:session.headers.get('set-cookie').split(';')[0],'X-Sues-Request':'editor','Content-Type':'application/json'};
  const root=url+'/api/jobs/'+job.id,post=(p,b)=>fetch(root+p,{method:'POST',headers,body:JSON.stringify(b)}),c=await (await fetch(root+'/external-catalog',{headers})).json();
  const visual={rect:{x:100,y:300,width:500,height:300},zIndex:1,opacity:1,typography:{family:'Montserrat',sizePx:80,weight:700,color:'#ffffff'},keyframes:[]};
  const story={schema:'sues-master-story/v1',sourceSha256:c.sourceSha256,timeline:{fingerprint:c.timelineFingerprint,timeSpace:'edit-timeline',fps:30,duration:c.duration},visual:{mode:'brand-sues'},narrative:{centralMessage:'Una historia real',intendedExperience:'Recorrido visual',scenes:[{id:'intro',start:0,end:c.duration,purpose:'Explicar la historia'}],motifs:[]},resources:[],operations:[{id:'texto',sceneId:'intro',start:2,end:4,track:'graphics',effect:'text',renderer:'remotion',reason:'Reforzar el mensaje',parameters:{text:'Hola',visual},dependsOn:[],requiredQA:['rendered-frame','motion-playback','narrative-review']}]};
  const {revision}=await (await post('/master-draft',{story})).json(),review=await (await post('/master-review',{revision})).json(),decision=await (await post('/master-decision',{revision,fingerprint:review.fingerprint,mode:'approve'})).json(),requestId=randomUUID(),data={revision,decisionId:decision.decisionId,requestId};
  assert.equal((await post('/master-preview',{...data,sourcePath:'/tmp/fake'})).status,400);
  const result=await (await post('/master-preview',data)).json();assert.equal(result.status,'PREVIEW_READY_FOR_REVIEW');assert.equal(result.final,false);assert.equal(renders,1);assert.equal(app.jobs.previewBusy,false);
  assert.equal((await (await post('/master-preview',data)).json()).reused,true);assert.equal(renders,1);
  const savedPreviews=await (await fetch(root+'/master-previews',{headers})).json();assert.equal(savedPreviews.previews.length,1);assert.equal(savedPreviews.previews[0].previewId,result.previewId);
  const firstOutput=outputFile;invalidateDuringRender=true;
  const invalidated=await (await post('/master-preview',{...data,requestId:randomUUID()})).json();
  assert.equal(invalidated.status,'BLOCKED');assert.equal(invalidated.issues[0].code,'PREVIEW_AUDIT_OR_APPROVAL_FAILED');
  assert.equal(app.jobs.previewBusy,false);policy.registry.approvedReferenceIds.pop();invalidateDuringRender=false;
  const media=root+'/master-preview-media?previewId='+result.previewId;assert.equal((await fetch(media)).status,401);
  const range=await fetch(media,{headers:{...headers,Range:'bytes=0-3'}});assert.equal(range.status,206);assert.equal(await range.text(),'synt');
  writeFileSync(firstOutput,'different');assert.equal((await fetch(media,{headers})).status,400);
 }finally{if(app.server.listening)await app.close();rmSync(f.dir,{recursive:true,force:true});}
});
