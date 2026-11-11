import test from 'node:test';
import assert from 'node:assert/strict';
import {rmSync,readFileSync} from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {fixture} from './helpers/editor-fixture.js';
import {createEditorServer} from '../src/editor-server.js';
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const canRun=!!process.env.SUES_MASK_PYTHON&&!!process.env.SUES_MASK_MODEL&&spawnSync('ffmpeg',['-version'],{stdio:'ignore'}).status===0;

test('authenticated editor creates source-bound unverified masks using real local model',{skip:!canRun,timeout:180000},async()=>{
 const f=fixture(),source=join(f.dir,'source.mp4'),scriptPath=fileURLToPath(new URL('../scripts/master-director/generate-mask-candidates.py',import.meta.url));
 let app;
 try{
  execFileSync('ffmpeg',['-y','-v','error','-f','lavfi','-i','color=c=red:s=1080x1920:r=30:d=24',
   '-f','lavfi','-i','sine=frequency=440:sample_rate=16000:duration=24','-c:v','libx264','-preset','ultrafast',
   '-threads','1','-pix_fmt','yuv420p','-c:a','aac','-shortest',source],{timeout:120000});
  const master='b'.repeat(64),font='e'.repeat(64),policy={registry:{brandId:'sues',profileId:'DOPAMIN',projectId:'p1',
   approvedRuleVersion:'rules-v1',approvedRuleIds:['r1'],requiredRuleKeys:['brand.background'],approvedReferenceIds:[],
   masterHashes:{tapiz:master},lockedMastersByMode:{'brand-sues':[{id:'tapiz',sha256:master}]},
   rendererCapabilities:{remotion:['text']},licensedAssets:{},canvas:{width:1080,height:1920},
   verifiedFonts:{'Montserrat:700':{sha256:font}}},
   rulebook:[{id:'r1',key:'brand.background',scope:'global',authority:'explicit-user-approval',status:'approved',value:'anthracite',supersedes:[]}]};
  const pythonPath=process.env.SUES_MASK_PYTHON;
  app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles,masterDirectorContext:async()=>policy,
   masterMaskConfig:{verifiedLocal:true,pythonPath,pythonSha256:hash(pythonPath),scriptPath,scriptSha256:hash(scriptPath),modelSha256:hash(process.env.SUES_MASK_MODEL)},
   masterSourceProbe:async project=>({status:'SOURCE_CFR30_VERIFIED',sourceTiming:'cfr30-verified',sourceHasAudio:true,sourceDuration:24,width:1080,height:1920,sourceSha256:project.boundHashes.source})});
  const launch=await app.listen(),base=launch.split('/#')[0],job=app.jobs.create('test');
  const session=await fetch(base+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}});
  const headers={Cookie:session.headers.get('set-cookie').split(';')[0],'X-Sues-Request':'editor','Content-Type':'application/json'};
  const root=base+'/api/jobs/'+job.id,post=(path,data)=>fetch(root+path,{method:'POST',headers,body:JSON.stringify(data)});
  const c=await (await fetch(root+'/external-catalog',{headers})).json(),visual={rect:{x:0,y:0,width:1080,height:1920},zIndex:1,opacity:1,typography:{family:'Montserrat',sizePx:80,weight:700,color:'#ffffff'},keyframes:[]};
  const story={schema:'sues-master-story/v1',sourceSha256:c.sourceSha256,timeline:{fingerprint:c.timelineFingerprint,timeSpace:'edit-timeline',fps:30,duration:c.duration},visual:{mode:'brand-sues'},
   narrative:{centralMessage:'Prueba local real',intendedExperience:'Probar la máscara',scenes:[{id:'s1',start:0,end:c.duration,purpose:'Revisar generación local'}],motifs:[]},resources:[],
   operations:[{id:'layer',sceneId:'s1',start:2,end:2.1,track:'graphics',effect:'text',renderer:'remotion',reason:'Texto de prueba',parameters:{text:'Ejemplo',visual},dependsOn:[],requiredQA:['rendered-frame','motion-playback','narrative-review']}]};
  const {revision}=await (await post('/master-draft',{story})).json(),review=await (await post('/master-review',{revision})).json();
  assert.equal(review.status,'READY_FOR_CHOICE',JSON.stringify(review));
  const decision=await (await post('/master-decision',{revision,fingerprint:review.fingerprint,mode:'approve'})).json();
  const result=await (await post('/master-mask-candidate',{revision,decisionId:decision.decisionId,operationId:'layer',mode:'keep-background'})).json();
  assert.equal(result.status,'CANDIDATE_NOT_VERIFIED',JSON.stringify(result));assert.equal(result.manifest.frames.length,3);assert.equal(result.verified,false);
  const q=new URLSearchParams({revision,decisionId:decision.decisionId,candidateId:result.candidateId,file:result.manifest.frames[0].file});
  assert.equal((await fetch(root+'/master-mask-frame?'+q,{headers})).status,200);
  assert.equal((await fetch(root+'/master-mask-frame?'+q)).status,401);
 }finally{if(app?.server.listening)await app.close();rmSync(f.dir,{recursive:true,force:true});}
});
