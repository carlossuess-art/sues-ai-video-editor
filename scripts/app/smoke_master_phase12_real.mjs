import {readFileSync,rmSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {createEditorServer} from '../../src/editor-server.js';
import {compileMasterDirectorSource} from '../../src/master-director-source-timeline.js';
const stage='/tmp/sues-master-vfr-version-20261106',
 profile=join(stage,'rebased-review-only.project.json'),
 sandbox=join(stage,'phase12-api-smoke');
rmSync(sandbox,{recursive:true,force:true});mkdirSync(sandbox,{recursive:true});
const sha='b'.repeat(64);
const policy={registry:{brandId:'sues',profileId:'CALMA',projectId:'p1',
 approvedRuleVersion:'rules-v1',approvedRuleIds:['r1'],requiredRuleKeys:['brand.background'],
 approvedReferenceIds:[],masterHashes:{tapiz:sha},
 lockedMastersByMode:{'brand-sues':[{id:'tapiz',sha256:sha}]},
 rendererCapabilities:{remotion:['text']},licensedAssets:{},canvas:{width:1080,height:1920},
 verifiedFonts:{'Montserrat:700':{sha256:'e'.repeat(64)}}},
 rulebook:[{id:'r1',key:'brand.background',scope:'global',
 authority:'explicit-user-approval',status:'approved',value:'anthracite',supersedes:[]}]};
const app=createEditorServer({directory:sandbox,profiles:{'real-derived-review':profile},masterDirectorContext:async()=>policy});
try{
 const url=(await app.listen()).split('/#')[0],job=app.jobs.create('real-derived-review');
 const session=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}});
 const headers={Cookie:session.headers.get('set-cookie').split(';')[0],
  'X-Sues-Request':'editor','Content-Type':'application/json'};
 const root=url+'/api/jobs/'+job.id;
 const post=async(p,v)=>{const r=await fetch(root+p,{method:'POST',headers,body:JSON.stringify(v)});return {status:r.status,data:await r.json()}};
 const c=await (await fetch(root+'/external-catalog',{headers})).json();
 const visual={rect:{x:100,y:400,width:700,height:250},zIndex:1,opacity:1,
  typography:{family:'Montserrat',sizePx:80,weight:700,color:'#ffffff'},keyframes:[]};
 const sourceStage=compileMasterDirectorSource({composition:{schema:'sues-remotion-layers/v1',sourceSha256:c.sourceSha256,fps:30,durationFrames:2213},sourceSha256:c.sourceSha256,timeMap:c.sourceTimeMap,sourceTiming:'cfr30-verified',sourceHasAudio:true,sourceFit:'fill',sourceDuration:2213/30});
 const story={schema:'sues-master-story/v1',sourceSha256:c.sourceSha256,
  timeline:{fingerprint:c.timelineFingerprint,timeSpace:'edit-timeline',fps:30,duration:c.duration},
  visual:{mode:'brand-sues'},narrative:{centralMessage:'Conectar con tu presencia',
   intendedExperience:'Entender la respiracion',scenes:[{id:'main',start:0,end:c.duration,purpose:'Desarrollar conciencia'}],motifs:[]},
  resources:[],operations:[{id:'title',sceneId:'main',start:2,end:4,
   track:'graphics',renderer:'remotion',effect:'text',reason:'Enfatizar mensaje real',
   parameters:{text:'Presencia',visual},dependsOn:[],
   requiredQA:['rendered-frame','motion-playback','narrative-review']}]};
 const imported=await post('/master-draft',{story});
 const reviewed=await post('/master-review',{revision:imported.data.revision});
 const decision=reviewed.data.fingerprint?await post('/master-decision',{revision:imported.data.revision,
  fingerprint:reviewed.data.fingerprint,mode:'approve'}):{};
 const layers=decision.data?.decisionId?await post('/master-layers',{revision:imported.data.revision,
  decisionId:decision.data.decisionId}):{};
 console.log(JSON.stringify({smokeFixtureNotRealSkill:true,actualSourceHash:c.sourceSha256,
  sourceStage:sourceStage.status,sourceStages:sourceStage.composition?.source?.spans,originalSourceChanged:c.sourceSha256!=='9e06f49c30731d8a57aed312cfb46281bcffb7b3d5d62bf5a2164333944ccaad',
  derivedDuration:c.duration,frames:c.duration*30,
  catalogFingerprint:c.timelineFingerprint,imported:imported.status,review:reviewed.data.status,
  issues:reviewed.data.issues,decision:decision.data?.status,layers:layers.data?.status,
  layersIssues:layers.data?.issues,canExecute:layers.data?.canExecute},null,2));
 if(sourceStage.status!=='READY_FOR_SOURCE_STAGING'||imported.status!==201||reviewed.data.status!=='READY_FOR_CHOICE'||decision.data.status!=='DECISION_RECORDED'||layers.data.status!=='STRUCTURE_READY_NOT_RENDERED')process.exitCode=2;
}finally{await app.close();rmSync(sandbox,{recursive:true,force:true});}
