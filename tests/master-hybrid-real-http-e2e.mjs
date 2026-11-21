// Manual, expensive TEST ONLY. Run inside a network-disabled 1900 MiB Docker
// container with pinned Remotion runtime and a trusted local font. Never production.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {readFileSync,writeFileSync,copyFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {fixture} from './helpers/editor-fixture.js';
import {createEditorServer} from '../src/editor-server.js';
import {loadMasterPreviewConfig} from '../src/master-director-runtime-config.js';
const f=fixture(),read=path=>JSON.parse(readFileSync(path,'utf8'));
let app=null;
try{
 const source=join(f.dir,'source.mp4');
 execFileSync('ffmpeg',['-y','-v','error','-f','lavfi','-i','testsrc2=size=108x192:rate=30:duration=12',
  '-f','lavfi','-i','sine=frequency=440:sample_rate=48000:duration=12',
  '-c:v','libx264','-threads','1','-preset','ultrafast','-c:a','aac','-shortest',source]);
 copyFileSync('/qa/Montserrat-Bold.ttf',join(f.dir,'fonts','Montserrat-Bold.ttf'));
 const config=read(f.profiles.test);config.source={duration:12,width:108,height:192};
 writeFileSync(f.profiles.test,JSON.stringify(config));
 for(const [file,field,map] of [
  ['camera.json','keyframes',time=>({time,x:0,y:0,width:108,height:192,zoom:1})],
  ['vision.json','frames',time=>({time,frameWidth:108,frameHeight:192,faces:[]})]]){
  const path=join(f.dir,file),data=read(path);data[field]=[0,12].map(map);writeFileSync(path,JSON.stringify(data));
 }
 const transcriptFile=join(f.dir,'transcript.json'),transcript=read(transcriptFile);
 transcript.sourceDuration=12;writeFileSync(transcriptFile,JSON.stringify(transcript));
 const master='b'.repeat(64),policy=({project})=>({registry:{brandId:'sues',profileId:'DOPAMIN',
  projectId:'p1',approvedRuleVersion:'rules-v1',approvedRuleIds:['r1'],
  requiredRuleKeys:['brand.background'],approvedReferenceIds:[],masterHashes:{tapiz:master},
  lockedMastersByMode:{'brand-sues':[{id:'tapiz',sha256:master}]},
  rendererCapabilities:{native:['transition-native'],remotion:['text']},licensedAssets:{},
  canvas:{width:1080,height:1920},verifiedFonts:{'Montserrat:700':{sha256:project.fontHashes['Montserrat-Bold.ttf']}}},
  rulebook:[{id:'r1',key:'brand.background',scope:'global',authority:'explicit-user-approval',
   status:'approved',value:'anthracite',supersedes:[]}]}),
  runtime=loadMasterPreviewConfig('/tmp/sues-master-preview-v2-staging.json');
 app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles,
  masterDirectorContext:async x=>policy(x),masterPreviewConfig:runtime});
 const launch=await app.listen(),url=launch.split('/#')[0];
 const parent=app.jobs.create('test',{musicEnabled:false,sfxEnabled:false,profileImages:false});
 const session=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}});
 const headers={Cookie:session.headers.get('set-cookie').split(';')[0],
  'X-Sues-Request':'editor','Content-Type':'application/json'};
 const root=url+'/api/jobs/'+parent.id;
 const post=async(path,value)=>{const response=await fetch(root+path,{method:'POST',headers,body:JSON.stringify(value)});
  const payload=await response.json();assert.ok(response.ok,JSON.stringify({path,http:response.status,payload}));return payload;};
 const c=await (await fetch(root+'/external-catalog',{headers})).json();
 const visual={rect:{x:100,y:300,width:500,height:300},zIndex:5,opacity:1,
  typography:{family:'Montserrat',sizePx:80,weight:700,color:'#ffffff'},
  keyframes:[{atFrame:0,opacity:0},{atFrame:15,opacity:1,easing:'ease-in-out'}]};
 const story={schema:'sues-master-story/v1',sourceSha256:c.sourceSha256,
  timeline:{fingerprint:c.timelineFingerprint,timeSpace:'edit-timeline',fps:30,duration:c.duration},
  visual:{mode:'brand-sues'},narrative:{centralMessage:'Real two-stage hybrid',
   intendedExperience:'Physical and emotional progression',
   scenes:[{id:'s1',start:0,end:c.duration,purpose:'Explain an idea'}],motifs:[]},resources:[],
  operations:[
   {id:'native-transition',sceneId:'s1',renderer:'native',effect:'transition-native',track:'transition',
    start:2,end:2.4,reason:'Visual progression',parameters:{kind:'warm'},dependsOn:[],
    requiredQA:['rendered-frame','motion-playback']},
   {id:'remotion-title',sceneId:'s1',renderer:'remotion',effect:'text',track:'graphics',
    start:3,end:5,reason:'Show explicit semantic message',parameters:{text:'SEGUNDA ETAPA',visual},
    dependsOn:['native-transition'],requiredQA:['rendered-frame','motion-playback','narrative-review']}]};
 const draft=await post('/master-draft',{story});
 const review=await post('/master-review',{revision:draft.revision});
 assert.equal(review.status,'READY_FOR_CHOICE',JSON.stringify(review));
 const decision=await post('/master-decision',{revision:draft.revision,fingerprint:review.fingerprint,mode:'approve'});
 assert.equal(decision.status,'DECISION_RECORDED');
 const requestId=randomUUID(),input={revision:draft.revision,decisionId:decision.decisionId,requestId};
 const start=await post('/master-hybrid-start',input);assert.equal(start.status,'RUNNING');
 console.log('HYBRID_AUTHENTICATED_START',requestId);
 let state=null,lastStep='',lastStatus='';
 for(let i=0;i<1600;i++){
  const response=await fetch(root+'/master-hybrid-status?requestId='+requestId,{headers});
  assert.equal(response.status,200);state=await response.json();
  if(state.step!==lastStep||state.status!==lastStatus){
   console.log('HYBRID_PHASE',state.status,state.step,state.issues?.[0]?.code??'');
   lastStep=state.step;lastStatus=state.status;
  }
  if(state.status!=='RUNNING')break;
  await new Promise(resolve=>setTimeout(resolve,400));
 }
 assert.equal(state.status,'READY',JSON.stringify(state));
 assert.equal(state.step,'HUMAN_QA_PENDING');
 assert.equal(state.result?.status,'PREVIEW_READY_FOR_REVIEW');
 assert.equal(state.result?.audit?.fullDecode,true);
 assert.equal(state.result?.audit?.audioPresent,true);
 assert.equal(state.final,false);
 const child=app.jobs.get(state.childId);assert.equal(child.parentId,parent.id);
 assert.equal(child.instructions.at(-1).kind,'master-hybrid-native-stage');
 const sourceResponse=await fetch(url+'/api/jobs/'+child.id+'/media',{headers});
 assert.equal(sourceResponse.status,409,'no partial native export to user');
 const preview=await fetch(root+'/master-preview-media?previewId='+state.previewId,
  {headers:{...headers,Range:'bytes=0-11'}});
 assert.equal(preview.status,206);
 assert.equal(Buffer.from(await preview.arrayBuffer()).subarray(4,8).toString(),'ftyp');
 const again=await post('/master-hybrid-start',input);
 assert.equal(again.status,'READY');
 assert.equal(app.jobs.jobs.size,2);
 console.log('PASS AUTHENTICATED_NATIVE_TO_REMOTION_E2E',JSON.stringify({
  nativeChildId:child.id,previewSha256:state.result.audit.outputSha256,
  nativeSha256:state.nativeOutputSha256,frames:360,audioPresent:true,
  technicalAudit:'PASS',visualReview:'PENDING',productionDeployed:false}));
}finally{
 if(app)await app.close();
 rmSync(f.dir,{recursive:true,force:true});
}
