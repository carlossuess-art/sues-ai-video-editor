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
  assert.equal((await store.review(a.revision)).issues[0].code,'STORY_FIELD_NOT_REPRESENTED');
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
  assert.equal((await fetch(root+'/master-native-review',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision,decisionId:decision.decisionId})})).status,401);
  assert.equal((await post('/master-native-review',{revision,decisionId:decision.decisionId,registry:{approved:true}})).status,400);
  const native=await (await post('/master-native-review',{revision,decisionId:decision.decisionId})).json();
  assert.equal(native.status,'READY_FOR_EDITOR_PREVIEW',JSON.stringify(native));
  const layers=await (await post('/master-layers',{revision,decisionId:decision.decisionId})).json();
  assert.equal(layers.status,'STRUCTURE_READY_NOT_RENDERED');assert.equal(layers.graph.nodes[0].id,'o1');
  assert.equal(layers.graph.editableInWebEditor,false);assert.equal(layers.canExecute,false);
  assert.equal(layers.remotion.status,'BLOCKED');assert.equal(layers.remotion.composition,null);
  app.jobs.autoStart=false;
  const requestId=randomUUID(),payload={revision,decisionId:decision.decisionId,reviewId:native.preview.reviewId,requestId};
  assert.equal((await post('/master-native-apply',{...payload,reviewId:'0'.repeat(64)})).status,409);
  const applied=await post('/master-native-apply',payload);assert.equal(applied.status,202);const version=await applied.json();
  assert.equal(version.id,job.id);assert.equal(app.jobs.get(version.id).parentId,null);assert.equal(app.jobs.get(job.id).state,'QUEUED');assert.equal(app.jobs.list().length,1);
  const retry=await post('/master-native-apply',payload);assert.equal(retry.status,200);assert.equal((await retry.json()).id,version.id);
  assert.equal((await post('/master-native-apply',{...payload,decisionId:'a'.repeat(64)})).status,409);
  assert.equal((await (await post('/master-layers',{revision,decisionId:decision.decisionId})).json()).status,'BLOCKED');
  policy.registry.approvedReferenceIds.push('changed-reference');
  assert.equal((await (await post('/master-layers',{revision,decisionId:decision.decisionId})).json()).status,'BLOCKED');
  policy.registry.approvedReferenceIds.pop();
  const update=await fetch(root,{method:'PATCH',headers,body:JSON.stringify({settings:{zoomIntensity:0}})});assert.equal(update.status,409);
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
 const f=fixture(),master='b'.repeat(64),font='e'.repeat(64);let renders=0,outputFile='',invalidateDuringRender=false,lastExpected=null;
 const policy={registry:{brandId:'sues',profileId:'DOPAMIN',projectId:'p1',approvedRuleVersion:'rules-v1',approvedRuleIds:['r1'],requiredRuleKeys:['brand.background'],approvedReferenceIds:[],masterHashes:{tapiz:master},lockedMastersByMode:{'brand-sues':[{id:'tapiz',sha256:master}]},rendererCapabilities:{remotion:['text']},licensedAssets:{},canvas:{width:1080,height:1920},verifiedFonts:{'Montserrat:700':{sha256:font}}},rulebook:[{id:'r1',key:'brand.background',scope:'global',authority:'explicit-user-approval',status:'approved',value:'anthracite',supersedes:[]}]};
 const renderer=async({composition,workRoot,approvalCheck,quality})=>{assert.equal(await approvalCheck(),true);await new Promise(resolve=>setTimeout(resolve,120));renders++;const dir=join(workRoot,'master-preview-'+String(renders).padStart(6,'0'));mkdirSync(dir,{recursive:true});outputFile=join(dir,'preview.mp4');writeFileSync(outputFile,'synthetic-preview');if(invalidateDuringRender)policy.registry.approvedReferenceIds.push('changed');const outputSha256=createHash('sha256').update('synthetic-preview').digest('hex');return {status:'PREVIEW_RENDERED_UNVERIFIED',record:{id:randomUUID(),planFingerprint:composition.planFingerprint,sourceSha256:composition.sourceSha256,outputSha256,bytes:17,quality,width:quality==='full-hd'?1080:270,height:quality==='full-hd'?1920:480,final:false},outputPath:outputFile}};
 const auditor=async({outputPath,expected})=>{lastExpected=expected;return {status:'TECHNICAL_PASS_HUMAN_QA_PENDING',outputSha256:createHash('sha256').update(readFileSync(outputPath)).digest('hex')}};
 const app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles,masterDirectorContext:async()=>policy,masterSourceProbe:async project=>({status:'SOURCE_CFR30_VERIFIED',sourceTiming:'cfr30-verified',sourceHasAudio:true,sourceDuration:24,width:1080,height:1920,sourceSha256:project.boundHashes.source}),masterPreviewConfig:{entryFile:'/tmp/a',remotionCli:'/tmp/b',browserExecutable:'/tmp/c'},masterPreviewRenderer:renderer,masterPreviewAuditor:auditor});
 try{const launch=await app.listen(),url=launch.split('/#')[0],job=app.jobs.create('test');const session=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}}),headers={Cookie:session.headers.get('set-cookie').split(';')[0],'X-Sues-Request':'editor','Content-Type':'application/json'};
  const root=url+'/api/jobs/'+job.id,post=(p,b)=>fetch(root+p,{method:'POST',headers,body:JSON.stringify(b)}),c=await (await fetch(root+'/external-catalog',{headers})).json();
  const visual={rect:{x:100,y:300,width:500,height:300},zIndex:1,opacity:1,typography:{family:'Montserrat',sizePx:80,weight:700,color:'#ffffff'},keyframes:[]};
  const story={schema:'sues-master-story/v1',sourceSha256:c.sourceSha256,timeline:{fingerprint:c.timelineFingerprint,timeSpace:'edit-timeline',fps:30,duration:c.duration},visual:{mode:'brand-sues'},narrative:{centralMessage:'Una historia real',intendedExperience:'Recorrido visual',scenes:[{id:'intro',start:0,end:c.duration,purpose:'Explicar la historia'}],motifs:[]},resources:[],operations:[{id:'texto',sceneId:'intro',start:2,end:4,track:'graphics',effect:'text',renderer:'remotion',reason:'Reforzar el mensaje',parameters:{text:'Hola',visual},dependsOn:[],requiredQA:['rendered-frame','motion-playback','narrative-review']}]};
  const {revision}=await (await post('/master-draft',{story})).json(),review=await (await post('/master-review',{revision})).json(),decision=await (await post('/master-decision',{revision,fingerprint:review.fingerprint,mode:'approve'})).json(),requestId=randomUUID(),data={revision,decisionId:decision.decisionId,requestId};
  assert.equal((await post('/master-preview',{...data,sourcePath:'/tmp/fake'})).status,400);
  const started=await post('/master-preview',data);assert.equal(started.status,202);assert.equal((await started.json()).status,'RUNNING');
  assert.equal((await fetch(url+'/api/health',{headers})).status,200);
  const wait=async id=>{for(let i=0;i<200;i++){const r=await (await fetch(root+'/master-preview-status?requestId='+id,{headers})).json();if(r.status!=='RUNNING')return r;await new Promise(resolve=>setTimeout(resolve,10));}throw Error('Preview timed out');};
  const completed=await wait(requestId);assert.equal(completed.status,'READY');const result=completed.result;assert.equal(result.status,'PREVIEW_READY_FOR_REVIEW');assert.equal(result.final,false);assert.equal(renders,1);assert.equal(app.jobs.previewBusy,false);
  assert.equal((await (await post('/master-preview',data)).json()).status,'READY');assert.equal(renders,1);
  const savedPreviews=await (await fetch(root+'/master-previews',{headers})).json();assert.equal(savedPreviews.previews.length,1);assert.equal(savedPreviews.previews[0].previewId,result.previewId);
  const firstOutput=outputFile;invalidateDuringRender=true;const changedRequest=randomUUID();
  assert.equal((await post('/master-preview',{...data,requestId:changedRequest})).status,202);
  const invalidated=await wait(changedRequest);assert.equal(invalidated.status,'BLOCKED');assert.equal(invalidated.issues[0].code,'PREVIEW_AUDIT_OR_APPROVAL_FAILED');
  assert.equal(app.jobs.previewBusy,false);policy.registry.approvedReferenceIds.pop();invalidateDuringRender=false;
  const media=root+'/master-preview-media?previewId='+result.previewId;assert.equal((await fetch(media)).status,401);
  const range=await fetch(media,{headers:{...headers,Range:'bytes=0-3'}});assert.equal(range.status,206);assert.equal(await range.text(),'synt');
  assert.equal((await post('/master-preview',{...data,quality:'full-hd'})).status,409);
  assert.equal((await post('/master-preview',{...data,requestId:randomUUID(),quality:'bad'})).status,400);
  const full={...data,requestId:randomUUID(),quality:'full-hd'};assert.equal((await post('/master-preview',full)).status,202);
  const hd=await wait(full.requestId);assert.equal(hd.status,'READY');assert.equal(hd.result.final,false);
  assert.equal(hd.result.record.quality,'full-hd');assert.equal(hd.result.record.width,1080);assert.equal(hd.result.record.height,1920);
  assert.equal(lastExpected.width,1080);assert.equal(lastExpected.height,1920);assert.equal((await (await post('/master-preview',full)).json()).status,'READY');
  writeFileSync(firstOutput,'different');assert.equal((await fetch(media,{headers})).status,400);
 }finally{if(app.server.listening)await app.close();rmSync(f.dir,{recursive:true,force:true});}
});

test('server restart marks orphan preview interrupted and blocks unsafe duplicate work',async()=>{
 const {MasterPreviewRequests}=await import('../src/master-director-preview-requests.js');
 const f=fixture(),app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles,masterPreviewConfig:{entryFile:'/tmp/a',remotionCli:'/tmp/b',browserExecutable:'/tmp/c'}});
 try{const launch=await app.listen(),url=launch.split('/#')[0],job=app.jobs.create('test'),requests=new MasterPreviewRequests(app.jobs.dir(job.id)),requestId=randomUUID(),revision='a'.repeat(64),decisionId='b'.repeat(64);requests.create({requestId,revision,decisionId});
  const session=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}}),headers={Cookie:session.headers.get('set-cookie').split(';')[0],'X-Sues-Request':'editor','Content-Type':'application/json'},root=url+'/api/jobs/'+job.id;
  const status=await (await fetch(root+'/master-preview-status?requestId='+requestId,{headers})).json();assert.equal(status.status,'INTERRUPTED');
  const again=await fetch(root+'/master-preview',{method:'POST',headers,body:JSON.stringify({requestId:randomUUID(),revision,decisionId})});assert.equal(again.status,409);assert.equal(app.jobs.children.size,0);
 }finally{if(app.server.listening)await app.close();rmSync(f.dir,{recursive:true,force:true});}
});

test('authenticated mixed plan reports both engine components and blocks an incomplete preview',async()=>{
 const f=fixture(),master='b'.repeat(64),font='e'.repeat(64);
 const policy={registry:{brandId:'sues',profileId:'DOPAMIN',projectId:'p1',approvedRuleVersion:'rules-v1',
  approvedRuleIds:['r1'],requiredRuleKeys:['brand.background'],approvedReferenceIds:[],
  masterHashes:{tapiz:master},lockedMastersByMode:{'brand-sues':[{id:'tapiz',sha256:master}]},
  rendererCapabilities:{native:['transition-native'],remotion:['text']},licensedAssets:{},
  canvas:{width:1080,height:1920},verifiedFonts:{'Montserrat:700':{sha256:font}}},
  rulebook:[{id:'r1',key:'brand.background',scope:'global',authority:'explicit-user-approval',status:'approved',value:'anthracite',supersedes:[]}]};
 let probes=0;
 const app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles,masterDirectorContext:async()=>policy,
  masterSourceProbe:async()=>{probes++;throw Error('MIXED_PREVIEW_SHOULD_NEVER_PROBE');}});
 try{
  const launch=await app.listen(),url=launch.split('/#')[0],job=app.jobs.create('test');
  const session=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}});
  const headers={Cookie:session.headers.get('set-cookie').split(';')[0],'X-Sues-Request':'editor','Content-Type':'application/json'};
  const root=url+'/api/jobs/'+job.id;
  const post=async(path,body)=>{const r=await fetch(root+path,{method:'POST',headers,body:JSON.stringify(body)});return r.json();};
  const c=await (await fetch(root+'/external-catalog',{headers})).json();
  const visual={rect:{x:100,y:300,width:500,height:300},zIndex:3,opacity:1,
   typography:{family:'Montserrat',sizePx:80,weight:700,color:'#ffffff'},keyframes:[]};
  const story={schema:'sues-master-story/v1',sourceSha256:c.sourceSha256,
   timeline:{fingerprint:c.timelineFingerprint,timeSpace:'edit-timeline',fps:30,duration:c.duration},
   visual:{mode:'brand-sues'},narrative:{centralMessage:'Una historia verificable',intendedExperience:'Ritmo narrativo',
    scenes:[{id:'intro',start:0,end:c.duration,purpose:'Transformación'}],motifs:[]},resources:[],
   operations:[
    {id:'n1',sceneId:'intro',start:2,end:2.4,track:'transition',effect:'transition-native',renderer:'native',
     reason:'Transición validada',parameters:{kind:'warm'},dependsOn:[],requiredQA:['rendered-frame','motion-playback']},
    {id:'r1',sceneId:'intro',start:3,end:4,track:'graphics',effect:'text',renderer:'remotion',
     reason:'Título contrastado',parameters:{text:'LIBERTAD',visual},dependsOn:['n1'],
     requiredQA:['rendered-frame','motion-playback','narrative-review']}
   ]};
  const {revision}=await post('/master-draft',{story});
  const review=await post('/master-review',{revision});assert.equal(review.status,'READY_FOR_CHOICE',JSON.stringify(review));
  const decision=await post('/master-decision',{revision,fingerprint:review.fingerprint,mode:'approve'});
  const layers=await post('/master-layers',{revision,decisionId:decision.decisionId});
  assert.equal(layers.status,'STRUCTURE_READY_NOT_RENDERED',JSON.stringify(layers.issues));
  assert.equal(layers.graph.nodes.length,2);
  assert.equal(layers.hybrid.status,'MIXED_COMPONENTS_STAGED_NOT_RENDERABLE',JSON.stringify(layers.hybrid));
  assert.deepEqual(layers.hybrid.nativeOperationIds,['n1']);assert.deepEqual(layers.hybrid.remotionOperationIds,['r1']);
  assert.equal(layers.hybrid.remotionComponent.layers.length,1);assert.equal(layers.hybrid.canRender,false);
  assert.equal(layers.remotion.status,'BLOCKED');assert.equal(layers.canExecute,false);
  const nativeReview=await post('/master-native-review',{revision,decisionId:decision.decisionId});
  assert.equal(nativeReview.status,'HYBRID_NATIVE_PART_REVIEWED_NOT_EXECUTABLE',JSON.stringify(nativeReview));
  assert.equal(nativeReview.nativePlan,null);assert.equal(nativeReview.canExecute,false);assert.equal(nativeReview.canApply,false);
  assert.deepEqual(nativeReview.nativeOperationIds,['n1']);assert.deepEqual(nativeReview.remotionOperationIds,['r1']);
  assert.equal(typeof nativeReview.nativeReviewId,'string');
  const partialApply=await fetch(root+'/master-native-apply',{method:'POST',headers,body:JSON.stringify({revision,
   decisionId:decision.decisionId,reviewId:nativeReview.nativeReviewId,requestId:randomUUID()})});
  assert.equal(partialApply.status,409,'An editor cannot render only the native half of a mixed approved story');
  const denied=await post('/master-render-preflight',{revision,decisionId:decision.decisionId});
  assert.equal(denied.status,'BLOCKED');assert.equal(denied.canExecute,false);
  assert.equal(probes,0);assert.equal(app.jobs.children.size,0);
 }finally{if(app.server.listening)await app.close();rmSync(f.dir,{recursive:true,force:true});}
});


test('master draft API rejects duplicate keys and invalid UTF-8 without saving a partial story',async()=>{
 const f=fixture(),app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles});
 try{
  const launch=await app.listen(),url=launch.split('/#')[0],job=app.jobs.create('test');
  const session=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}});
  const headers={Cookie:session.headers.get('set-cookie').split(';')[0],'X-Sues-Request':'editor','Content-Type':'application/json'};
  const endpoint=url+'/api/jobs/'+job.id+'/master-draft';
  const repeated='{"story":{"schema":"sues-master-story/v1","narrative":{"centralMessage":"first", "centralMessage" : "second"}}}';
  assert.equal((await fetch(endpoint,{method:'POST',headers,body:repeated})).status,400);
  const invalid=Buffer.concat([Buffer.from('{"story":{"schema":"sues-master-story/v1","x":"'),Buffer.from([0xff]),Buffer.from('"}}')]);
  assert.equal((await fetch(endpoint,{method:'POST',headers,body:invalid})).status,400);
  const versions=await (await fetch(url+'/api/jobs/'+job.id+'/master-versions',{headers})).json();assert.deepEqual(versions.versions,[]);
 }finally{if(app.server.listening)await app.close();rmSync(f.dir,{recursive:true,force:true});}
});

test('master generation remains unavailable without a trusted zero-cost provider',async()=>{
 const f=fixture(),app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles});
 try{
  const launch=await app.listen(),url=launch.split('/#')[0],job=app.jobs.create('test');
  const session=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}});
  const headers={Cookie:session.headers.get('set-cookie').split(';')[0],'X-Sues-Request':'editor','Content-Type':'application/json'};
  const endpoint=url+'/api/jobs/'+job.id+'/master-generate';
  assert.equal((await (await fetch(endpoint,{headers})).json()).available,false);
  assert.equal((await fetch(endpoint,{method:'POST',headers,body:JSON.stringify({brief:'Una historia real'})})).status,503);
 }finally{if(app.server.listening)await app.close();rmSync(f.dir,{recursive:true,force:true});}
});


test('a trusted free generator saves the same master draft and cannot self-approve',async()=>{
 let calls=0,output='{"schema":"sues-master-story/v1"}';const f=fixture();
 const app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles,
  masterDirectorContext:async()=>({registry:{},rulebook:[]}),
  masterPlanGenerator:{verifiedFree:true,maxCostUSD:0,generate:async()=>{calls++;return output;}}});
 try{
  const launch=await app.listen(),url=launch.split('/#')[0],job=app.jobs.create('test');
  const session=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}});
  const headers={Cookie:session.headers.get('set-cookie').split(';')[0],'X-Sues-Request':'editor','Content-Type':'application/json'};
  const endpoint=url+'/api/jobs/'+job.id+'/master-generate',request=()=>fetch(endpoint,{method:'POST',headers,body:JSON.stringify({brief:'Una historia real'})});
  assert.equal((await (await fetch(endpoint,{headers})).json()).available,true);
  const response=await request();assert.equal(response.status,201);const generated=await response.json();
  assert.equal(generated.story.schema,'sues-master-story/v1');assert.equal(generated.review.status,'BLOCKED');assert.equal(generated.rendered,false);assert.equal(calls,1);
  const stored=await (await fetch(url+'/api/jobs/'+job.id+'/master-draft?revision='+generated.revision,{headers})).json();assert.deepEqual(stored.story,generated.story);
  output='{"schema":"sues-master-story/v1","schema":"sues-master-story/v1"}';assert.equal((await request()).status,422);
 }finally{if(app.server.listening)await app.close();rmSync(f.dir,{recursive:true,force:true});}
});


test('persisted working head survives restart, preserves untouched layers and prevents stale edits',()=>{
 const dir=mkdtempSync(join(tmpdir(),'sues-current-project-'));
 try{
  const s=new MasterDirectorProjectStore(dir,async()=>null);
  const visual={rect:{x:20,y:30,width:100,height:80},zIndex:2,opacity:1};
  const first={schema:'sues-master-story/v1',timeline:{duration:20},
   operations:[
    {id:'caption-17',sceneId:'s1',renderer:'remotion',start:17,end:18,parameters:{text:'antes',visual,keyframes:[{atFrame:0,opacity:1}]}},
    {id:'broll-1',sceneId:'s1',renderer:'remotion',start:4,end:7,parameters:{visual:{...visual,rect:{x:200,y:10,width:500,height:300}},resourceName:'manos'}}
   ]};
  const original=s.saveDraft(first);
  assert.equal(s.current().revision,null);
  assert.equal(s.setCurrent(original.revision,null).status,'CURRENT');
  const textChanged=s.editCurrentOperation(original.revision,'caption-17',{parametersPatch:{text:'después'}});
  assert.equal(textChanged.status,'CURRENT');
  assert.notEqual(textChanged.revision,original.revision);
  const changed=s.readDraft(textChanged.revision);
  assert.equal(changed.operations[0].parameters.text,'después');
  assert.deepEqual(changed.operations[0].parameters.visual,visual);
  assert.deepEqual(changed.operations[0].parameters.keyframes,[{atFrame:0,opacity:1}]);
  assert.deepEqual(changed.operations[1],first.operations[1]);
  assert.deepEqual(s.readDraft(original.revision),first);
  const stale=s.editCurrentOperation(original.revision,'caption-17',{parametersPatch:{text:'antiguo'}});
  assert.equal(stale.status,'CONFLICT');
  assert.equal(stale.currentRevision,textChanged.revision);
  const reopened=new MasterDirectorProjectStore(dir,async()=>null);
  assert.equal(reopened.current().revision,textChanged.revision);
  assert.equal(reopened.readDraft(reopened.current().revision).operations[0].parameters.text,'después');
  const repositioned=reopened.editCurrentVisual(textChanged.revision,'caption-17',
   {...visual,rect:{x:44,y:55,width:100,height:80}});
  assert.equal(repositioned.status,'CURRENT');
  assert.deepEqual(reopened.readDraft(repositioned.revision).operations[1],first.operations[1]);
  assert.equal(reopened.readDraft(repositioned.revision).operations[0].parameters.visual.rect.x,44);
  assert.equal(reopened.setCurrent(original.revision,repositioned.revision).status,'CURRENT');
  assert.equal(reopened.current().revision,original.revision);
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('authenticated project head and targeted edits are conflict-protected over HTTP',async()=>{
 const f=fixture(),app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles});
 try{
  const url=(await app.listen()).split('/#')[0],job=app.jobs.create('test'),root=url+'/api/jobs/'+job.id;
  assert.equal((await fetch(root+'/master-current')).status,401);
  const session=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}});
  const headers={Cookie:session.headers.get('set-cookie').split(';')[0],'X-Sues-Request':'editor','Content-Type':'application/json'};
  const post=(path,payload)=>fetch(root+path,{method:'POST',headers,body:JSON.stringify(payload)});
  const story={schema:'sues-master-story/v1',timeline:{duration:20},operations:[
   {id:'subtitle',renderer:'remotion',start:17,end:18,parameters:{text:'inicial',visual:{opacity:1,rect:{x:1,y:1,width:3,height:3}}}},
   {id:'graphic',renderer:'remotion',start:1,end:2,parameters:{text:'intacto'}}]};
  const initial=await (await post('/master-draft',{story})).json();
  const empty=await (await fetch(root+'/master-current',{headers})).json();
  assert.equal(empty.revision,null);
  const active=await post('/master-current',{revision:initial.revision,expectedRevision:null});
  assert.equal(active.status,200);
  const edited=await post('/master-current-operation-edit',{
   expectedRevision:initial.revision,operationId:'subtitle',patch:{parametersPatch:{text:'corregido'}}});
  assert.equal(edited.status,201);
  const updated=await edited.json();
  const stale=await post('/master-current-operation-edit',{
   expectedRevision:initial.revision,operationId:'subtitle',patch:{parametersPatch:{text:'perdido'}}});
  assert.equal(stale.status,409);
  const current=await (await fetch(root+'/master-current',{headers})).json();
  assert.equal(current.revision,updated.revision);
  assert.equal(current.story.operations[0].parameters.text,'corregido');
  assert.equal(current.story.operations[0].parameters.visual.opacity,1);
  assert.deepEqual(current.story.operations[1],story.operations[1]);
  assert.equal((await post('/master-current',{revision:initial.revision,expectedRevision:initial.revision})).status,409);
  assert.equal((await post('/master-current',{revision:initial.revision,expectedRevision:updated.revision})).status,200);
 }finally{if(app.server.listening)await app.close();rmSync(f.dir,{recursive:true,force:true});}
});

test('timestamp commands edit only the intended caption, B-roll or mask and reject ambiguity',()=>{
 const dir=mkdtempSync(join(tmpdir(),'sues-time-command-'));
 try{
  const store=new MasterDirectorProjectStore(dir,async()=>null),mask='mask-evidence-1';
  const visual={rect:{x:20,y:20,width:100,height:100},zIndex:2,opacity:1,typography:{family:'Montserrat',sizePx:24,weight:700,color:'#ffffff'},keyframes:[]};
  const story={schema:'sues-master-story/v1',timeline:{duration:25},resources:[{id:'clip-one',source:'library'},{id:'clip-two',source:'library'}],operations:[
   {id:'caption-17',renderer:'remotion',track:'captions',start:17,end:18,parameters:{text:'Original',visual}},
   {id:'caption-else',renderer:'remotion',track:'captions',start:6,end:7,parameters:{text:'Intacto',visual}},
   {id:'broll-8',renderer:'remotion',track:'broll',start:8,end:12,resourceRef:'clip-one',parameters:{visual}}
  ]};
  const initial=store.saveDraft(story);assert.equal(store.setCurrent(initial.revision,null).status,'CURRENT');
  const edited=store.editCurrentAt(initial.revision,{type:'caption-text',at:17.3,text:'Corregido'});
  assert.equal(edited.status,'CURRENT');assert.equal(edited.operationId,'caption-17');
  let active=store.readDraft(edited.revision);
  assert.equal(active.operations[0].parameters.text,'Corregido');
  assert.deepEqual(active.operations[1],story.operations[1]);
  assert.deepEqual(active.operations[2],story.operations[2]);
  assert.equal(store.editCurrentAt(initial.revision,{type:'caption-text',at:17.3,text:'Caducado'}).status,'CONFLICT');
  const swapped=store.editCurrentAt(edited.revision,{type:'broll-replace',at:9,resourceRef:'clip-two'});
  assert.equal(swapped.status,'CURRENT');active=store.readDraft(swapped.revision);
  assert.equal(active.operations[2].resourceRef,'clip-two');
  assert.deepEqual(active.operations[0].parameters.visual,visual);
  assert.equal(store.editCurrentAt(swapped.revision,{type:'broll-replace',at:9,resourceRef:'missing'}).code,'RESOURCE_NOT_IN_PROJECT');
  const masked=store.editCurrentAt(swapped.revision,{type:'mask-set',at:9,track:'broll',proofId:mask});
  assert.equal(masked.status,'CURRENT');active=store.readDraft(masked.revision);
  assert.deepEqual(active.operations[2].parameters.visual.mask,{proofId:mask,mode:'alpha-keep'});
  assert.deepEqual(active.operations[0].parameters.visual,visual);
  const clean=store.editCurrentAt(masked.revision,{type:'mask-remove',operationId:'broll-8',track:'broll'});
  assert.equal(clean.status,'CURRENT');
  assert.equal(store.readDraft(clean.revision).operations[2].parameters.visual.mask,undefined);
  assert.equal(store.editCurrentAt(clean.revision,{type:'caption-text',at:16.1,text:'ninguno'}).code,'OPERATION_NOT_FOUND');
  const overlapping=store.readDraft(clean.revision);overlapping.operations.push({id:'caption-17-b',renderer:'remotion',track:'captions',start:17,end:18,parameters:{text:'otra',visual}});
  const ambiguous=store.saveDraft(overlapping);store.setCurrent(ambiguous.revision,clean.revision);
  const outcome=store.editCurrentAt(ambiguous.revision,{type:'caption-text',at:17.5,text:'Ambiguo'});
  assert.equal(outcome.code,'AMBIGUOUS_OPERATION');assert.equal(outcome.candidates.length,2);
  assert.equal(store.current().revision,ambiguous.revision);
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('authenticated temporal commands preserve current project and reject stale or unauthenticated calls',async()=>{
 const f=fixture(),app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles});
 try{
  const url=(await app.listen()).split('/#')[0],job=app.jobs.create('test');
  const path='/api/jobs/'+job.id+'/master-current-command';
  assert.equal((await fetch(url+path,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status,401);
  const session=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}});
  const headers={Cookie:session.headers.get('set-cookie').split(';')[0],'X-Sues-Request':'editor','Content-Type':'application/json'};
  const post=(p,b)=>fetch(url+'/api/jobs/'+job.id+p,{method:'POST',headers,body:JSON.stringify(b)});
  const visual={rect:{x:1,y:1,width:300,height:400},zIndex:2,opacity:1};
  const story={schema:'sues-master-story/v1',timeline:{duration:20},operations:[{id:'caption',renderer:'remotion',track:'captions',start:17,end:18,parameters:{text:'Antes',visual}}]};
  const saved=await (await post('/master-draft',{story})).json();
  assert.equal((await post('/master-current',{expectedRevision:null,revision:saved.revision})).status,200);
  const changed=await post('/master-current-command',{expectedRevision:saved.revision,command:{type:'caption-text',at:17.3,text:'Después'}});
  assert.equal(changed.status,201);const result=await changed.json();
  assert.equal(result.operationId,'caption');
  const latest=await (await fetch(url+'/api/jobs/'+job.id+'/master-current',{headers})).json();
  assert.equal(latest.story.operations[0].parameters.text,'Después');
  const projectRows=(await (await fetch(url+'/api/projects',{headers})).json()).projects;
  const active=projectRows.find(p=>p.activeJobId===job.id);
  assert.equal(active.masterRevision,latest.revision);assert.equal(active.masterJobId,job.id);assert.equal(active.masterEditable,true);
  assert.deepEqual(latest.story.operations[0].parameters.visual,visual);
  assert.equal((await post('/master-current-command',{expectedRevision:saved.revision,command:{type:'caption-text',at:17.3,text:'No'}})).status,409);
 }finally{if(app.server.listening)await app.close();rmSync(f.dir,{recursive:true,force:true});}
});
