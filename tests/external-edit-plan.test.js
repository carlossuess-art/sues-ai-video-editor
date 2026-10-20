import test from 'node:test';
import assert from 'node:assert/strict';
import {rmSync} from 'node:fs';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {fixture} from './helpers/editor-fixture.js';
import {loadProject,prepareProject} from '../src/local-pipeline.js';
import {externalCatalog,reviewExternalPlan} from '../src/external-edit-plan.js';
import {planInstructions} from '../src/instruction-director.js';
import {createEditorServer} from '../src/editor-server.js';

test('external plan binds source; precise flash, missing resources and unsupported capabilities stay distinct',()=>{
 const f=fixture();try{
 const project=loadProject(f.profiles.test),settings=prepareProject(project,{}).settings,catalog=externalCatalog(project,settings),pack=operations=>JSON.stringify({schema:catalog.schema,sourceSha256:catalog.sourceSha256,operations}),review=operations=>reviewExternalPlan(pack(operations),{project,settings,commandPlanner:planInstructions});
 const op={type:'transition',resourceId:'warm',start:2.27,duration:.4},ok=review([op]);assert.equal(ok.canApply,true);assert.equal(ok.changes.transitions[0].start,2.27);assert.equal(prepareProject(project,ok.changes).plan.globalTransitions[0].start,2.27);
 const bad=review([{type:'image',resourceId:'zapatos',start:2,end:4},{type:'track-eyes',description:'Seguir los ojos'},op]);assert.equal(bad.canApply,false);assert.deepEqual(bad.rows.map(r=>r.status),['missing-resource','unsupported','ready']);assert.equal(bad.changes,null);
 for(const operations of [[op,op],[{...op,start:NaN}],[{...op,start:24}],[{...op,path:'/etc/passwd'}],[{type:'caption',captionId:'missing',text:'a'}],[{type:'command',text:'DOPAMIN'}],[{type:'command',text:'música al 10 %'}],[{...op}, {type:'command',text:'sin motions'}]])assert.equal(review(operations).canApply,false);
 assert.throws(()=>reviewExternalPlan(pack([op]).replace(catalog.sourceSha256,'0'.repeat(64)),{project,settings}));
 assert.throws(()=>reviewExternalPlan('En el segundo 2 haz un flash',{project,settings}));assert.throws(()=>reviewExternalPlan(pack([]),{project,settings}));
 assert.equal(reviewExternalPlan('```json\n'+pack([op])+'\n```',{project,settings,commandPlanner:planInstructions}).canApply,true);
 const faceless={...project,inputs:{...project.inputs,camera:{...project.inputs.camera,mode:'full-frame-fit'},visionFrames:project.inputs.visionFrames.map(f=>({...f,faces:[]}))}};const unsupportedImage=reviewExternalPlan(pack([{type:'image',resourceId:'a'.repeat(64),start:3,end:5}]),{project:faceless,settings,assets:[{id:'a'.repeat(64),kind:'image',title:'QA'}],commandPlanner:planInstructions});assert.equal(unsupportedImage.rows[0].status,'unsupported');assert.equal(unsupportedImage.canApply,false);
 assert.deepEqual(settings.transitions,[]);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});

test('HTTP review is private and read-only; stale/partial plans rejected; execute creates one reversible persistent version',async()=>{
 const f=fixture(),options={directory:join(f.dir,'jobs'),profiles:f.profiles},app=createEditorServer(options);app.jobs.autoStart=false;
 try{
 const url=(await app.listen()).split('/#')[0],session=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}}),headers={Cookie:session.headers.get('set-cookie').split(';')[0],'Content-Type':'application/json','X-Sues-Request':'editor'};
 const parent=app.jobs.create('test'),path='/api/jobs/'+parent.id,call=(action,b)=>fetch(url+path+'/'+action,{method:'POST',headers,body:JSON.stringify(b)}),catalog=await (await fetch(url+path+'/external-catalog',{headers})).json(),text=JSON.stringify({...catalog.example,operations:[{type:'transition',resourceId:'warm',start:3.1,duration:.4},{type:'caption',captionId:catalog.captions[0].id,text:'Corrección'}]}),snapshot=JSON.stringify(app.jobs.get(parent.id));
 assert.equal((await fetch(url+path+'/external-catalog')).status,401);assert.equal((await fetch(url+path+'/external-review',{method:'POST',headers:{Cookie:headers.Cookie,'Content-Type':'application/json'},body:'{}'})).status,403);
 assert.equal((await call('external-draft',{text})).status,200);assert.equal((await (await fetch(url+path+'/external-draft',{headers})).json()).text,text);
 const proposal=await (await call('external-review',{text})).json();assert.equal(proposal.canApply,true,JSON.stringify(proposal));assert.equal(app.jobs.list().length,1);
 assert.equal((await call('external-execute',{text,reviewId:'old',requestId:randomUUID()})).status,409);
 const missing=JSON.stringify({...catalog.example,operations:[{type:'image',resourceId:'missing',start:3,end:4}]});assert.equal((await call('external-execute',{text:missing,requestId:randomUUID()})).status,422);assert.equal(app.jobs.list().length,1);
 const body={text,reviewId:proposal.reviewId,requestId:randomUUID()},res=await call('external-execute',body);assert.equal(res.status,202);const child=await res.json();assert.equal(child.parentId,parent.id);assert.equal(child.projectId,parent.projectId);assert.equal(child.settings.transitions[0].start,3.1);assert.equal(child.instructions.at(-1).kind,'external-plan');assert.equal((await (await call('external-execute',body)).json()).id,child.id);assert.equal(app.jobs.list().length,2);assert.equal(JSON.stringify(app.jobs.get(parent.id)),snapshot);
 await app.close();const restarted=createEditorServer(options);try{assert.equal(restarted.jobs.get(child.id).instructions.at(-1).text,text);}finally{await restarted.close();}
 }finally{if(app.server.listening)await app.close();rmSync(f.dir,{recursive:true,force:true});}
});
