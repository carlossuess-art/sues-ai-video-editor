import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync,execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,rmSync,copyFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {fixture} from './helpers/editor-fixture.js';
import {createEditorServer} from '../src/editor-server.js';
const ffmpeg=spawnSync('ffmpeg',['-version'],{stdio:'ignore'}).status===0;
test('approved master structured list updates the single project and renders a real decoded MP4',{skip:!ffmpeg,timeout:240000},async()=>{
 const f=fixture(),source=join(f.dir,'source.mp4'),read=p=>JSON.parse(readFileSync(p,'utf8'));
 const config=read(f.profiles.test);rmSync(source);
 execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','testsrc2=size=108x192:rate=30:duration=12','-f','lavfi','-i','sine=frequency=440:sample_rate=48000:duration=12','-c:v','libx264','-threads','1','-preset','ultrafast','-c:a','aac','-shortest',source]);
 config.source={duration:12,width:108,height:192};config.fontDirectory=resolve('assets/fonts');writeFileSync(f.profiles.test,JSON.stringify(config));
 writeFileSync(join(f.dir,'camera.json'),JSON.stringify({mode:'full-frame-fit',keyframes:[0,12].map(time=>({time,x:0,y:0,width:108,height:192,zoom:1}))}));
 writeFileSync(join(f.dir,'vision.json'),JSON.stringify({frames:[0,12].map(time=>({time,frameWidth:108,frameHeight:192,faces:[]}))}));
 const transcript=read(join(f.dir,'transcript.json'));transcript.sourceDuration=12;writeFileSync(join(f.dir,'transcript.json'),JSON.stringify(transcript));
 const master='b'.repeat(64),policy={registry:{brandId:'sues',profileId:'CALMA',projectId:'p1',approvedRuleVersion:'rules-v1',approvedRuleIds:['r1'],requiredRuleKeys:['brand.background'],approvedReferenceIds:[],masterHashes:{tapiz:master},lockedMastersByMode:{'brand-sues':[{id:'tapiz',sha256:master}]},rendererCapabilities:{native:['transition-native','elements-native']},licensedAssets:{}},rulebook:[{id:'r1',key:'brand.background',scope:'global',authority:'explicit-user-approval',status:'approved',value:'anthracite',supersedes:[]}]};
 const app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles,masterDirectorContext:async()=>policy});
 try{
  const launch=await app.listen(),base=launch.split('/#')[0],job=app.jobs.create('test',{musicEnabled:false,sfxEnabled:false,profileImages:false});
  const auth=await fetch(base+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}}),headers={Cookie:auth.headers.get('set-cookie').split(';')[0],'X-Sues-Request':'editor','Content-Type':'application/json'};
  const root=base+'/api/jobs/'+job.id,post=async(path,value)=>{const r=await fetch(root+path,{method:'POST',headers,body:JSON.stringify(value)});const body=await r.json();assert.ok(r.ok,JSON.stringify(body));return body;};
  const c=await (await fetch(root+'/external-catalog',{headers})).json();
  const caption=c.captions.find(x=>x.start>=0&&x.end-x.start>=1&&x.end<c.duration-3);assert.ok(caption);
  const story={schema:'sues-master-story/v1',sourceSha256:c.sourceSha256,timeline:{fingerprint:c.timelineFingerprint,timeSpace:'edit-timeline',fps:30,duration:c.duration},visual:{mode:'brand-sues'},narrative:{centralMessage:'Una historia real',intendedExperience:'Ritmo y calma',scenes:[{id:'s1',start:0,end:c.duration,purpose:'Desarrollar el mensaje'}],motifs:[]},resources:[],operations:[{id:'o1',sceneId:'s1',start:caption.start,end:caption.end,track:'graphics',effect:'elements-native',renderer:'native',reason:'Ordenar las ideas expresadas',parameters:{format:'LIST',items:[{captionId:caption.id,label:'Una idea real'}],coversPresenter:true,replace:false},dependsOn:[],requiredQA:['rendered-frame','motion-playback','narrative-review']}]};
  const {revision}=await post('/master-draft',{story}),review=await post('/master-review',{revision});assert.equal(review.status,'READY_FOR_CHOICE');
  const decision=await post('/master-decision',{revision,fingerprint:review.fingerprint,mode:'autonomous'}),nr=await post('/master-native-review',{revision,decisionId:decision.decisionId});assert.equal(nr.status,'READY_FOR_EDITOR_PREVIEW',JSON.stringify(nr));
  const payload={revision,decisionId:decision.decisionId,reviewId:nr.preview.reviewId,requestId:randomUUID()},created=await post('/master-native-apply',payload);assert.equal(created.id,job.id);
  let child;for(let i=0;i<1200;i++){child=app.jobs.get(created.id);if(['DONE','FAILED','PUBLISH_FAILED'].includes(child.state))break;await new Promise(r=>setTimeout(r,100));}
  assert.equal(child.state,'DONE',JSON.stringify(child));assert.equal(child.parentId,null);assert.equal(app.jobs.get(job.id).state,'DONE');assert.equal(app.jobs.list().length,1);
  const output=await app.jobs.media(child.id);if(process.env.SUES_QA_OUTPUT)copyFileSync(output,process.env.SUES_QA_OUTPUT);execFileSync('ffmpeg',['-v','error','-xerror','-i',output,'-f','null','-'],{timeout:120000});
  const info=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',output],{encoding:'utf8'}));assert.ok(info.streams.some(s=>s.codec_type==='audio'));assert.ok(info.streams.some(s=>s.codec_type==='video'));assert.ok(Math.abs(Number(info.format.duration)-12)<.12);
  assert.equal((await post('/master-native-apply',payload)).id,child.id);
 }finally{await app.close();rmSync(f.dir,{recursive:true,force:true});}
});
