import test from 'node:test';import assert from 'node:assert/strict';
import http from 'node:http';import {rmSync,readFileSync} from 'node:fs';import {join} from 'node:path';import {createRequire} from 'node:module';
import {fixture} from '../helpers/editor-fixture.js';
import {createEditorServer} from '../../src/editor-server.js';
import {projectFingerprint} from '../../src/engine-next/fablecut-command-batch.js';
const nativePath=process.env.FABLECUT_NATIVE_OPS;
test('private approved batch HTTP, actual native project-ops, one-use receipt and binding', {skip:!nativePath},async()=>{
 const ops=createRequire(import.meta.url)(nativePath),f=fixture(),directory=join(f.dir,'jobs'),ledger=join(directory,'approvals');
 const projectId='p_private_http_qa';let job,project,fp,invoked=0;
 const server=http.createServer((req,res)=>{res.setHeader('content-type','application/json');res.setHeader('x-fablecut-project',projectId);res.end(JSON.stringify(project));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const oldUrl=process.env.SUES_ENGINE_NEXT_FABLECUT_URL,oldLedger=process.env.SUES_ENGINE_NEXT_DIRECTOR_APPROVALS_DIR;
 process.env.SUES_ENGINE_NEXT_FABLECUT_URL='http://127.0.0.1:'+server.address().port;process.env.SUES_ENGINE_NEXT_DIRECTOR_APPROVALS_DIR=ledger;
 let app;
 try{
 const master='b'.repeat(64),policy={registry:{brandId:'sues',profileId:'test',projectId:'qa',approvedRuleVersion:'rules-v1',approvedRuleIds:['r1'],requiredRuleKeys:['brand.background'],approvedReferenceIds:[],masterHashes:{tapiz:master},lockedMastersByMode:{'brand-sues':[{id:'tapiz',sha256:master}]},rendererCapabilities:{native:[]},licensedAssets:{}},rulebook:[{id:'r1',key:'brand.background',scope:'global',authority:'explicit-user-approval',status:'approved',value:'anthracite',supersedes:[]}]};
 app=createEditorServer({directory,profiles:f.profiles,masterDirectorContext:async()=>policy,
 nativeProjectBindingResolver:async id=>job&&id===projectId?{nativeProjectId:projectId,jobId:job.id,suesProjectId:job.projectId,verified:true}:null,
 nativeDirectorInvoker:async(name,args)=>{assert.equal(name,'fablecut_patch_project');assert.equal(args.baseRevision,project.revision);invoked++;ops.applyPatch(project,args.ops,{});ops.checkProject(project);project.revision++;return 'Patched (revision '+project.revision+')';},
 nativeBatchRuntime:{resolveJobContext:async id=>id===job?.id?{nativeProjectId:projectId,privateClone:true,nativeFingerprint:fp,nativeTrackRoles:{V2:'graphics'}}:null,native:ops,resolveAsset:()=>null,stageAssets:async a=>assert.equal(a.length,0)}});
 const url=(await app.listen()).split('/#')[0];job=app.jobs.create('test');const root='/api/jobs/'+job.id;
 const login=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}});
 const h={Cookie:login.headers.get('set-cookie').split(';')[0],'X-Sues-Request':'editor','Content-Type':'application/json'};
 const cat=await (await fetch(url+root+'/external-catalog',{headers:h})).json();
 project={name:'private HTTP QA',revision:7,width:1080,height:1920,fps:30,tracks:[{id:'V2',kind:'video'},{id:'V1',kind:'video'}],media:[{id:'base_media',kind:'video',src:'/media/base.mp4',duration:cat.duration},{id:'image_media',kind:'image',src:'/media/image.png'}],clips:[{id:'base',kind:'video',mediaId:'base_media',track:'V1',start:0,in:0,duration:cat.duration,props:{scale:1}},{id:'overlay',kind:'image',mediaId:'image_media',track:'V2',start:1,in:0,duration:2,props:{scale:1}}]};
 fp=projectFingerprint(project);
 const story={schema:'sues-master-story/v1',sourceSha256:cat.sourceSha256,timeline:{fingerprint:cat.timelineFingerprint,timeSpace:'edit-timeline',fps:30,duration:cat.duration},visual:{mode:'brand-sues'},narrative:{centralMessage:'Prueba técnica privada',intendedExperience:'Prueba de lote exacto',scenes:[{id:'s1',start:0,end:cat.duration,purpose:'Verificar lote'}]},resources:[],operations:[{id:'move',sceneId:'s1',start:1,end:3,track:'graphics',renderer:'native',effect:'fablecut-command-exact-v1',reason:'Verificar posición',parameters:{command:{action:'set_transform',clipId:'overlay',x:12}},dependsOn:[],requiredQA:['rendered-frame','motion-playback','narrative-review']},{id:'fade',sceneId:'s1',start:2.8,end:3,track:'graphics',renderer:'native',effect:'fablecut-command-exact-v1',reason:'Verificar salida',parameters:{command:{action:'transition',clipId:'overlay',side:'out',type:'fade',duration:.2}},dependsOn:['move'],requiredQA:['rendered-frame','motion-playback','narrative-review']}]};
 const post=(path,b,headers=h)=>fetch(url+path,{method:'POST',headers,body:JSON.stringify(b)});
 const saved=await post(root+'/master-draft',{story});assert.equal(saved.status,201,await saved.clone().text());const {revision}=await saved.json();
 assert.equal((await post(root+'/master-current',{revision,expectedRevision:null})).status,200);
 const review=await (await post(root+'/master-review',{revision})).json();assert.equal(review.status,'READY_FOR_CHOICE',JSON.stringify(review));
 const decision=await (await post(root+'/master-decision',{revision,fingerprint:review.fingerprint,mode:'approve'})).json();assert.ok(decision.decisionId,JSON.stringify(decision));
 const request={projectId,storyRevision:revision,decisionId:decision.decisionId},approve='/api/engine-next/director/approve-batch',execute='/api/engine-next/director/execute-batch';
 assert.equal((await post(approve,request,{'Content-Type':'application/json'})).status,401);
 assert.equal((await post(approve,request,{Cookie:h.Cookie,'Content-Type':'application/json'})).status,403);
 assert.equal((await post(approve,{...request,commands:[]})).status,400);
 assert.equal((await post(approve,{...request,decisionId:'f'.repeat(64)})).status,409);
 const a=await post(approve,request);assert.equal(a.status,200,await a.clone().text());const grant=await a.json();assert.equal(invoked,0);
 const result=await post(execute,{...request,approvalId:grant.approvalId});assert.equal(result.status,200,await result.clone().text());const receipt=await result.json();
 assert.equal(receipt.receipts.length,2);assert.equal(receipt.receiptPersisted,true);assert.equal(project.revision,8);assert.equal(project.clips[1].props.x,12);assert.equal(project.clips[1].transitionOut.duration,.2);assert.equal(invoked,1);
 const disk=JSON.parse(readFileSync(join(ledger,grant.approvalId+'.result.json'),'utf8'));assert.equal(disk.result.receipts.length,2);assert.equal(disk.result.undo.project.revision,7);
 assert.equal((await post(execute,{...request,approvalId:grant.approvalId})).status,409);assert.equal(invoked,1);
 }finally{await app?.close();await new Promise(r=>server.close(r));rmSync(f.dir,{recursive:true,force:true});if(oldUrl===undefined)delete process.env.SUES_ENGINE_NEXT_FABLECUT_URL;else process.env.SUES_ENGINE_NEXT_FABLECUT_URL=oldUrl;if(oldLedger===undefined)delete process.env.SUES_ENGINE_NEXT_DIRECTOR_APPROVALS_DIR;else process.env.SUES_ENGINE_NEXT_DIRECTOR_APPROVALS_DIR=oldLedger;}
});
