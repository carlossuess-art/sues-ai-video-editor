import test from 'node:test';
import assert from 'node:assert/strict';
import {rmSync,writeFileSync,readFileSync} from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {join} from 'node:path';
import {fixture} from './helpers/editor-fixture.js';
import {createEditorServer} from '../src/editor-server.js';
import {MasterDirectorProjectStore} from '../src/master-director-project-store.js';
import {externalCatalog} from '../src/external-edit-plan.js';
import {planInstructions} from '../src/instruction-director.js';
import {prepareTrustedHybridWork,startTrustedHybridNativeJob,verifyTrustedHybridNativeChild} from '../src/master-director-hybrid-worker.js';
const master='b'.repeat(64),font='e'.repeat(64);
const policy=()=>({registry:{brandId:'sues',profileId:'DOPAMIN',projectId:'p1',
 approvedRuleVersion:'rules-v1',approvedRuleIds:['r1'],requiredRuleKeys:['brand.background'],
 approvedReferenceIds:[],masterHashes:{tapiz:master},lockedMastersByMode:{'brand-sues':[{id:'tapiz',sha256:master}]},
 rendererCapabilities:{native:['transition-native'],remotion:['text']},licensedAssets:{},
 canvas:{width:1080,height:1920},verifiedFonts:{'Montserrat:700':{sha256:font}}},
 rulebook:[{id:'r1',key:'brand.background',scope:'global',authority:'explicit-user-approval',
  status:'approved',value:'anthracite',supersedes:[]}]});
const make=async()=>{
 const f=fixture(),p=policy(),app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles,masterDirectorContext:async()=>p});
 app.jobs.autoStart=false;
 const job=app.jobs.create('test',{musicEnabled:false,sfxEnabled:false});
 const project=app.jobs.loadProfile(job.profileId),c=externalCatalog(project,job.settings,[]);
 const store=new MasterDirectorProjectStore(app.jobs.dir(job.id),async()=>({...p,sourceSha256:c.sourceSha256,
  timelineFingerprint:c.timelineFingerprint,duration:c.duration}));
 const visual={rect:{x:100,y:300,width:500,height:300},zIndex:3,opacity:1,
  typography:{family:'Montserrat',sizePx:80,weight:700,color:'#ffffff'},keyframes:[]};
 const story={schema:'sues-master-story/v1',sourceSha256:c.sourceSha256,
  timeline:{fingerprint:c.timelineFingerprint,timeSpace:'edit-timeline',fps:30,duration:c.duration},
  visual:{mode:'brand-sues'},narrative:{centralMessage:'Plan de ejemplo',intendedExperience:'Ritmo',
   scenes:[{id:'s1',start:0,end:c.duration,purpose:'Transformación'}],motifs:[]},resources:[],
  operations:[
   {id:'native',sceneId:'s1',renderer:'native',effect:'transition-native',track:'transition',
    start:2,end:2.4,reason:'Transición real',parameters:{kind:'warm'},dependsOn:[],
    requiredQA:['rendered-frame','motion-playback']},
   {id:'remotion',sceneId:'s1',renderer:'remotion',effect:'text',track:'graphics',
    start:3,end:4,reason:'Texto preciso',parameters:{text:'CORAZÓN',visual},
    dependsOn:['native'],requiredQA:['rendered-frame','motion-playback','narrative-review']}]
 };
 const {revision}=store.saveDraft(story),view=await store.review(revision);
 assert.equal(view.status,'READY_FOR_CHOICE',JSON.stringify(view));
 const decision=await store.decide(revision,view.fingerprint,'approve');
 assert.equal(decision.status,'DECISION_RECORDED');
 return {f,p,app,job,store,revision,decisionId:decision.decisionId,assets:{list:()=>[]}};
};
test('approved mixed stage creates only a queued intermediate child and preserves full plan provenance',async()=>{
 const x=await make();
 try{
  const requestId=randomUUID();
  const args={store:x.store,jobs:x.app.jobs,jobId:x.job.id,revision:x.revision,
   decisionId:x.decisionId,requestId,assets:x.assets,commandPlanner:planInstructions};
  const prepared=await prepareTrustedHybridWork(args);
  assert.equal(prepared.status,'READY_TO_START_NATIVE_STAGE',JSON.stringify(prepared));
  assert.equal(prepared.canPublish,false);
  assert.deepEqual(prepared.prepared.nativeOperationIds,['native']);
  assert.deepEqual(prepared.prepared.remotionOperationIds,['remotion']);
  assert.ok(prepared.prepared.changes);
  const started=await startTrustedHybridNativeJob({work:prepared,jobs:x.app.jobs,store:x.store,assets:x.assets,commandPlanner:planInstructions});
  assert.equal(started.status,'NATIVE_STAGE_QUEUED',JSON.stringify(started));
  const child=x.app.jobs.get(started.childId);
  assert.equal(child.parentId,x.job.id);assert.equal(child.requestId,requestId);
  assert.equal(child.state,'QUEUED');assert.equal(child.instructions.at(-1).intermediate,true);
  assert.equal(child.instructions.at(-1).planFingerprint,prepared.planFingerprint);
  assert.equal((await startTrustedHybridNativeJob({work:prepared,jobs:x.app.jobs,store:x.store,assets:x.assets,commandPlanner:planInstructions})).status,'BLOCKED');
  assert.equal((await verifyTrustedHybridNativeChild({store:x.store,jobs:x.app.jobs,parentId:x.job.id,
   childId:child.id,revision:x.revision,decisionId:x.decisionId,assets:x.assets})).status,'BLOCKED');
  assert.equal(x.app.jobs.get(x.job.id).state,'PREVIEW_READY');
 }finally{await x.app.close();rmSync(x.f.dir,{recursive:true,force:true})}
});
test('stale full-plan approval blocks trusted hybrid preparation before creation',async()=>{
 const x=await make();
 try{
  x.p.registry.approvedReferenceIds.push('changed');
  const prepared=await prepareTrustedHybridWork({store:x.store,jobs:x.app.jobs,jobId:x.job.id,
   revision:x.revision,decisionId:x.decisionId,requestId:randomUUID(),assets:x.assets,commandPlanner:planInstructions});
  assert.equal(prepared.status,'BLOCKED');
  assert.equal(x.app.jobs.jobs.size,1);
 }finally{await x.app.close();rmSync(x.f.dir,{recursive:true,force:true})}
});

test('REAL native child output: authenticated full-plan lineage produces verified Remotion handoff',{skip:spawnSync('ffmpeg',['-version'],{stdio:'ignore'}).status!==0,timeout:240000},async()=>{
 const f=fixture(),read=path=>JSON.parse(readFileSync(path,'utf8'));
 const source=join(f.dir,'source.mp4');
 execFileSync('ffmpeg',['-y','-v','error','-f','lavfi','-i','testsrc2=size=108x192:rate=30:duration=12',
  '-f','lavfi','-i','sine=frequency=440:sample_rate=48000:duration=12',
  '-c:v','libx264','-threads','1','-preset','ultrafast','-c:a','aac','-shortest',source]);
 const config=read(f.profiles.test);config.source={duration:12,width:108,height:192};
 writeFileSync(f.profiles.test,JSON.stringify(config));
 for(const [name,field,make] of [
  ['camera.json','keyframes',time=>({time,x:0,y:0,width:108,height:192,zoom:1})],
  ['vision.json','frames',time=>({time,frameWidth:108,frameHeight:192,faces:[]})]]){
  const file=join(f.dir,name),data=read(file);data[field]=[0,12].map(make);writeFileSync(file,JSON.stringify(data));
 }
 const transcriptFile=join(f.dir,'transcript.json'),transcript=read(transcriptFile);
 transcript.sourceDuration=12;writeFileSync(transcriptFile,JSON.stringify(transcript));
 const p=policy();
 const app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles,masterDirectorContext:async()=>p});
 try{
  const parent=app.jobs.create('test',{musicEnabled:false,sfxEnabled:false,profileImages:false});
  const project=app.jobs.loadProfile(parent.profileId),catalog=externalCatalog(project,parent.settings,[]);
  const store=new MasterDirectorProjectStore(app.jobs.dir(parent.id),async()=>({...p,
   sourceSha256:catalog.sourceSha256,timelineFingerprint:catalog.timelineFingerprint,duration:catalog.duration}));
  const visual={rect:{x:100,y:300,width:500,height:300},zIndex:4,opacity:1,
   typography:{family:'Montserrat',sizePx:80,weight:700,color:'#ffffff'},keyframes:[]};
  const story={schema:'sues-master-story/v1',sourceSha256:catalog.sourceSha256,
   timeline:{fingerprint:catalog.timelineFingerprint,timeSpace:'edit-timeline',fps:30,duration:catalog.duration},
   visual:{mode:'brand-sues'},narrative:{centralMessage:'Prueba real',intendedExperience:'Ritmo',
    scenes:[{id:'s1',start:0,end:catalog.duration,purpose:'Comprender'}],motifs:[]},resources:[],
   operations:[
    {id:'transition',sceneId:'s1',renderer:'native',effect:'transition-native',track:'transition',
     start:2,end:2.4,reason:'Transición visual',parameters:{kind:'warm'},dependsOn:[],
     requiredQA:['rendered-frame','motion-playback']},
    {id:'text',sceneId:'s1',renderer:'remotion',effect:'text',track:'graphics',
     start:3,end:4,reason:'Texto puntual',parameters:{text:'DESPUÉS',visual},dependsOn:['transition'],
     requiredQA:['rendered-frame','motion-playback','narrative-review']}]};
  const {revision}=store.saveDraft(story),review=await store.review(revision);
  assert.equal(review.status,'READY_FOR_CHOICE',JSON.stringify(review));
  const decision=await store.decide(revision,review.fingerprint,'approve');
  const assets={list:()=>[]},requestId=randomUUID();
  const work=await prepareTrustedHybridWork({store,jobs:app.jobs,jobId:parent.id,revision,
   decisionId:decision.decisionId,requestId,assets,commandPlanner:planInstructions});
  assert.equal(work.status,'READY_TO_START_NATIVE_STAGE',JSON.stringify(work));
  const queued=await startTrustedHybridNativeJob({work,jobs:app.jobs,store,assets,commandPlanner:planInstructions});
  assert.equal(queued.status,'NATIVE_STAGE_QUEUED',JSON.stringify(queued));
  let child;for(let i=0;i<1200;i++){
   child=app.jobs.get(queued.childId);if(['DONE','FAILED','PUBLISH_FAILED','CANCELLED'].includes(child.state))break;
   await new Promise(resolve=>setTimeout(resolve,100));
  }
  assert.equal(child.state,'DONE',JSON.stringify(child));
  const ready=await verifyTrustedHybridNativeChild({store,jobs:app.jobs,parentId:parent.id,childId:child.id,
   revision,decisionId:decision.decisionId,assets});
  assert.equal(ready.status,'HANDOFF_READY_FOR_PRIVATE_PREVIEW',JSON.stringify(ready.issues));
  assert.equal(ready.final,false);
  assert.equal(ready.handoff.composition.source.assetId,ready.mediaAudit.outputSha256);
  assert.equal(ready.handoff.sourceLineage.nativeChildJobId,child.id);
  assert.equal(ready.handoff.sourceLineage.nativeParentJobId,parent.id);
  assert.equal(ready.handoff.sourceLineage.originalSourceSha256,catalog.sourceSha256);
  assert.equal(ready.handoff.composition.layers[0].text,'DESPUÉS');
  assert.equal(ready.mediaAudit.video.width,1080);
  assert.equal(ready.mediaAudit.audioPresent,true);
  assert.equal(app.jobs.get(parent.id).state,'PREVIEW_READY');
 }finally{await app.close();rmSync(f.dir,{recursive:true,force:true})}
});
