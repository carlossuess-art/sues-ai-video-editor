#!/usr/bin/env node
/**
 * REAL MCP / native HyperFrames QA with synthetic-only content. Runs a true
 * MasterDirectorProjectStore -> reviewed approval -> single-use ledger ->
 * hash-checked HyperFrames MP4 -> one-CAS FableCut private import. This CLI
 * uses a TEST approval issued by a local QA harness, never by/for Carlos.
 *
 * node qa-hf-master-private-roundtrip.mjs PRIVATE_FABLECUT_QA_ROOT HF_QA_ROOT FABLECUT_MCP_JS
 *
 * Requires pre-created private synthetic 10-second V1 source, source-bound
 * preflight and a strict-variables HF native render. Does not change
 * production, publish, launch a render or claim creative/audio QA.
 */
import {readFileSync,writeFileSync,statSync,existsSync,realpathSync} from 'node:fs';
import {resolve,join,basename} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {MasterDirectorProjectStore} from '../../src/master-director-project-store.js';
import {DirectorApprovalLedger} from '../../src/engine-next/fablecut-director-approval-ledger.js';
import {createApprovedHyperFramesWorkflow} from '../../src/motion-templates/hyperframes-approved-workflow.js';
import {makeHyperFramesMasterOperation,verifyMasterHyperFramesOperation}
 from '../../src/motion-templates/hyperframes-master-binding.js';
import {commitPrivateHyperFramesMedia} from '../../src/motion-templates/private-fablecut-hf-import.js';
import {projectFingerprint} from '../../src/engine-next/fablecut-command-batch.js';

const [dir0,hf0,server0]=process.argv.slice(2);
const check=(x,msg)=>{if(!x)throw Error(msg)};
check([dir0,hf0,server0].every(x=>typeof x==='string'&&x.startsWith('/')),'Explicit absolute private paths required');
const dir=realpathSync(dir0),hf=realpathSync(hf0),server=realpathSync(server0);
check(dir.includes('/fablecut-private-qa/hf-master-stage-')&&
 existsSync(join(dir,'ISOLATED_HF_QA_NOT_PRODUCTION.txt'))&&
 hf.includes('/sues-motion-narrative-20261115/qa-master-approved-')&&
 basename(server)==='mcp-server.js'&&
 !existsSync(join(dir,'qa-hf-master-roundtrip-result.json')),'Untrusted/repeated QA operation');
const read=f=>JSON.parse(readFileSync(f,'utf8'));
const hashData=x=>createHash('sha256').update(x).digest('hex');
const hash=f=>hashData(readFileSync(f));
const sourceFile=join(dir,'media','synthetic-original.mp4');
const sourceSha256=hash(sourceFile);
const p=read(join(dir,'hf-master-qa-preflight.json'));
const vars=read(join(hf,'variables.json'));
const renderedFile=join(hf,'hf-approved-motion-synthetic.mp4');
check(p.sourceSha256===sourceSha256&&
 hashData(JSON.stringify(vars))===p.hyperframes.variablesSha256&&
 JSON.stringify(vars)===JSON.stringify(p.hyperframes.variables)&&
 readFileSync(join(hf,'render.exit'),'utf8').trim()==='0'&&
 existsSync(renderedFile)&&statSync(renderedFile).size>5000,
 'Synthetic source, HyperFrames variables or native render is not verified');
const files=['index.html','runtime/hook-drop-card-engine.js','runtime/sequence-card-to-space.js'];
const sourceHashes=files.map(path=>({path,hash:hash(join(hf,path))}));
const hfSourceFingerprint=hashData(sourceHashes.map(x=>x.path+':'+x.hash).join('\n'));
const op=makeHyperFramesMasterOperation(p,{sceneId:'scene_hf',operationId:'qa_hf_master_motion'});
const master='b'.repeat(64);
const registry={sourceSha256,timelineFingerprint:p.timelineFingerprint,
 brandId:'sues',profileId:'DOPAMIN',projectId:'qa_hf_private',
 approvedRuleVersion:'rules-v1',approvedRuleIds:['r1'],
 requiredRuleKeys:['brand.background'],approvedReferenceIds:[],
 masterHashes:{tapiz:master},
 lockedMastersByMode:{'brand-sues':[{id:'tapiz',sha256:master}]},
 rendererCapabilities:{hyperframes:['hyperframes-word-motion-v1']},
 licensedAssets:{},canvas:{width:1080,height:1920}};
const rulebook=[{id:'r1',key:'brand.background',scope:'global',
 authority:'explicit-user-approval',status:'approved',value:'anthracite',supersedes:[]}];
const store=new MasterDirectorProjectStore(dir,async()=>({
 sourceSha256,timelineFingerprint:p.timelineFingerprint,duration:10,
 registry,rulebook,hyperframesPreflight:async plan=>{
  const hfOps=plan.operations.filter(o=>o.renderer==='hyperframes');
  try{
   check(hfOps.length===1,'Expected only one HF QA op');
   verifyMasterHyperFramesOperation(hfOps[0],p,registry);
   return {status:'READY_FOR_EDITOR_PREVIEW',checkedOperationIds:[op.id]};
  }catch(error){return {status:'BLOCKED',issues:[{code:'QA_HF_PROOF_CHANGED',message:error.message}]};}
 }
}));
const story={schema:'sues-master-story/v1',sourceSha256,
 timeline:{fingerprint:p.timelineFingerprint,timeSpace:'edit-timeline',fps:30,duration:10},
 visual:{mode:'brand-sues'},
 narrative:{centralMessage:'QA sintética: pregunta y espacio',intendedExperience:'Probar sincronía entre motores',
  scenes:[{id:'scene_hf',start:0,end:10,purpose:'Representar la pregunta y la apertura espacial'}],motifs:[],arc:[]},
 resources:[],operations:[op]};
const snapshot=store.saveDraft(story);
check(store.current().revision===null,'Never reuse an already-applied private master story');
check(store.setCurrent(snapshot.revision,null).status==='CURRENT','Private master CAS failed');
const review=await store.review(snapshot.revision);
check(review.status==='READY_FOR_CHOICE','Private synthetic creative review blocked: '+JSON.stringify(review.issues));
const decision=await store.decide(snapshot.revision,review.fingerprint,'approve');
check(decision.status==='DECISION_RECORDED','Private synthetic test decision failed');
const ledger=new DirectorApprovalLedger({directory:join(dir,'master-hf-private-approvals')});
const projectId='p_'+hashData(dir).slice(0,24);
function mcp(name,args={}){
 const req={jsonrpc:'2.0',id:1,method:'tools/call',params:{name,arguments:args}};
 const result=spawnSync(process.execPath,[server],{encoding:'utf8',timeout:35000,
  maxBuffer:1024*1024,env:{...process.env,FABLECUT_DATA_DIR:dir,FABLECUT_PORT:'17942',
   PORT:'17942',HOST:'127.0.0.1'},input:JSON.stringify(req)+'\n'});
 check(result.status===0,'FableCut private MCP subprocess failed: '+result.stderr.slice(0,500));
 const response=result.stdout.split('\n').filter(s=>s.startsWith('{')).map(s=>JSON.parse(s)).find(x=>x.id===1);
 const text=response?.result?.content?.find(x=>x.type==='text')?.text;
 check(!response?.result?.isError&&typeof text==='string','FableCut private MCP error: '+String(text).slice(0,600));
 return text;
}
const getProject=()=>JSON.parse(mcp('fablecut_get_project',{}));
const initial=getProject();
check(initial.revision===1&&initial.clips.length===1&&initial.media.length===1&&
 initial.clips[0].id==='c_synthetic_original'&&
 initial.media[0].id==='m_synthetic_reel','Synthetic QA original was not preserved');
const renderHash=hash(renderedFile);
const service=createApprovedHyperFramesWorkflow({
 ledger,
 resolveContext:async()=>({
  privateClone:true,nativeProjectId:projectId,store,
  loadPreflight:f=>{check(f===op.parameters.preflightFingerprint,'Trusted proof changed');return p;},
  hfSource:{verified:true,renderable:true,fingerprint:hfSourceFingerprint},
  nativeFingerprint:projectFingerprint(initial)
 }),
 readProject:async()=>({projectId,privateClone:true,data:getProject()}),
 renderHyperFrames:async({operation,preflight,source})=>{
  check(source.fingerprint===hfSourceFingerprint&&
   operation.parameters.variablesSha256===p.hyperframes.variablesSha256&&
   preflight.proposedPlanFingerprint===p.proposedPlanFingerprint&&
   hash(renderedFile)===renderHash,'Approved variables, native HF files or render SHA changed');
  // This pre-rendered file is technical QA only; production's injected render
  // runner must generate the exact approved variables AFTER token consumption.
  return {status:'NATIVE_HYPERFRAMES_RENDER_VERIFIED',
   sourceFingerprint:hfSourceFingerprint,variablesSha256:p.hyperframes.variablesSha256,
   outputSha256:renderHash,filePath:renderedFile,frames:151,fps:30,
   width:1080,height:1920,audioStreams:0};
 },
 importFableCutMotion:async params=>
  commitPrivateHyperFramesMedia({
   ...params,privateDataDir:dir,approvedRenderRoot:hf,sourceMediaId:'m_synthetic_reel',
   invokeMcp:async(name,args)=>mcp(name,args),
   readProject:async()=>getProject()
  })
});
const input={actor:'Synthetic_QA',projectId,storyRevision:snapshot.revision,
 decisionId:decision.decisionId,operationId:op.id};
const examined=await service.inspect(input);
check(examined.status==='PRIVATE_HF_MOTION_READY_FOR_ONE_USE_APPROVAL',
 'Master approved HF native workflow not ready');
const granted=await service.issue(input,{verifiedHumanSession:true});
const result=await service.execute({...input,approvalId:granted.approvalId});
check(result.status==='PRIVATE_HF_FABLECUT_MEDIA_STAGED_AWAITING_AV_QA','Private handoff failed');
const after=getProject();
check(after.revision===2&&after.media.length===2&&after.clips.length===2&&
 after.clips[0].id==='c_synthetic_original'&&
 after.clips[1].track==='V2'&&
 after.clips[1].start===op.start&&
 after.clips[1].duration===op.end-op.start,
 'Post-CAS FableCut source/track readback mismatch');
const report={schema:'sues-master-hyperframes-fablecut-qa/v1',
 status:'PRIVATE_MASTER_APPROVED_HF_NATIVE_FABLECUT_CAS_STAGED',
 strictlySynthetic:true,realCarlosVideo:false,realCarlosConsent:false,
 simulatedHumanApprovalInTestHarness:true,creativeUserApproved:false,
 sourceSha256,sourceFingerprint:hfSourceFingerprint,sourceHashes,
 storyRevision:snapshot.revision,decisionId:decision.decisionId,
 operationId:op.id,preflightFingerprint:op.parameters.preflightFingerprint,
 planFingerprint:review.fingerprint,varsSha256:p.hyperframes.variablesSha256,
 nativeHyperFramesSha256:renderHash,baseNativeRevision:1,importedNativeRevision:after.revision,
 firstOriginalClipId:after.clips[0].id,
 importedGraphicsClipId:after.clips[1].id,
 stageStatus:result.status,
 fullAVQA:false,publicationAuthorized:false,productionChanged:false};
writeFileSync(join(dir,'qa-hf-master-roundtrip-result.json'),JSON.stringify(report,null,2)+'\n',
 {flag:'wx',mode:0o600});
console.log(JSON.stringify({status:report.status,renderSha256:renderHash,
 storyRevision:report.storyRevision,sourceOriginalPreserved:true,
 fablecutRevision:after.revision,clipId:after.clips[1].id,productionChanged:false}));
