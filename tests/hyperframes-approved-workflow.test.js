import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,existsSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {buildEditorNarrativeMotionReview} from '../src/motion-templates/editor-motion-bridge.js';
import {prepareEditorHyperFramesPreflight} from '../src/motion-templates/editor-hyperframes-preflight.js';
import {makeHyperFramesMasterOperation} from '../src/motion-templates/hyperframes-master-binding.js';
import {createApprovedHyperFramesWorkflow} from '../src/motion-templates/hyperframes-approved-workflow.js';
import {DirectorApprovalLedger} from '../src/engine-next/fablecut-director-approval-ledger.js';
import {projectFingerprint} from '../src/engine-next/fablecut-command-batch.js';

function fixture(){
 const sourceSha256='a'.repeat(64),jobFingerprint='b'.repeat(64),
  timelineFingerprint=jobFingerprint;
 const txt=['¿Y','si','te','escucharas?','Haz','espacio','para','escucharte.'];
 const frames=[8,16,24,30,86,99,108,120];
 const transcript={version:'1.0',language:'es',sourceDuration:10,words:txt.map((text,i)=>({
  text,start:frames[i]/30,end:frames[i]/30+.12}))};
 const captions=[{id:'c1',source:'auto',text:txt.slice(0,4).join(' '),wordIndexes:[0,1,2,3]},
  {id:'c2',source:'auto',text:txt.slice(4).join(' '),wordIndexes:[4,5,6,7]}];
 const selections=[{captionId:'c1',displayWordIndex:3,sourceWordIndex:3,captionText:captions[0].text},
  {captionId:'c2',displayWordIndex:1,sourceWordIndex:5,captionText:captions[1].text}];
 const review=buildEditorNarrativeMotionReview({transcript,sourceSha256,
  planSourceSha256:sourceSha256,jobFingerprint,requestedFingerprint:jobFingerprint,
  captions,selections});
 const preflight=prepareEditorHyperFramesPreflight({editorReview:review,transcript,
  sourceSha256,jobFingerprint,timelineFingerprint,
  sourceTimeMap:{version:'1.0',sourceDuration:10,duration:10,
   spans:[{sourceIn:0,sourceOut:10,editIn:0,editOut:10}]},editedDuration:10});
 assert.equal(preflight.status,'READY_FOR_CREATIVE_REVIEW');
 const op=makeHyperFramesMasterOperation(preflight,{sceneId:'intro',operationId:'hf-word-motion'});
 return {sourceSha256,timelineFingerprint,preflight,op};
}
function rig(){
 const scratch=mkdtempSync(join(tmpdir(),'sues-hf-ledger-'));
 const ledger=new DirectorApprovalLedger({directory:join(scratch,'ledger')});
 const {preflight,op}=fixture();
 const projectId='p_private_a1';
 const input={actor:'Carlos',projectId,storyRevision:'3'.repeat(64),
  decisionId:'4'.repeat(64),operationId:op.id};
 const masterFingerprint='5'.repeat(64);
 const native={revision:1,width:1080,height:1920,fps:30,
  name:'Private QA',media:[],clips:[],tracks:[]};
 const approval={mode:'approve',view:{status:'READY_FOR_CHOICE',
  fingerprint:masterFingerprint,projectFingerprint:preflight.timelineFingerprint},
  registry:{sourceSha256:preflight.sourceSha256,timelineFingerprint:preflight.timelineFingerprint,
   rendererCapabilities:{hyperframes:['hyperframes-word-motion-v1']},canvas:{width:1080,height:1920}}};
 const state={native,masterRev:input.storyRevision,approval,
  renders:0,imports:0,probeChanges:false};
 const store={current:()=>({revision:state.masterRev}),
  approved:async(rev,decision)=>rev===input.storyRevision&&decision===input.decisionId?state.approval:null,
  readDraft:()=>({sourceSha256:preflight.sourceSha256,timeline:{fingerprint:preflight.timelineFingerprint},
   operations:[op]})};
 const resolveContext=async()=>({privateClone:true,nativeProjectId:projectId,store,
  loadPreflight:()=>preflight,hfSource:{verified:true,renderable:true,
   fingerprint:'6'.repeat(64)},nativeFingerprint:projectFingerprint(state.native)});
 const readProject=async()=>({privateClone:true,projectId,data:structuredClone(state.native)});
 const renderHyperFrames=async v=>{
  state.renders++;
  assert.equal(v.operation.parameters.variablesSha256,preflight.hyperframes.variablesSha256);
  return {status:'NATIVE_HYPERFRAMES_RENDER_VERIFIED',
   sourceFingerprint:'6'.repeat(64),variablesSha256:preflight.hyperframes.variablesSha256,
   outputSha256:'7'.repeat(64),frames:151,fps:30,width:1080,height:1920,audioStreams:0};
 };
 const importFableCutMotion=async v=>{
  state.imports++;
  assert.equal(v.scope,'PRIVATE_CLONE_QA_ONLY');
  assert.equal(v.baselineProject.revision,state.native.revision);
  state.native={...state.native,revision:state.native.revision+1,
   media:[{id:'m1',sha256:'7'.repeat(64)}],
   clips:[{id:'c1',mediaId:'m1',track:'V2'}]};
  return {status:'PRIVATE_NATIVE_HF_MEDIA_COMMITTED',revision:state.native.revision,
   operationId:op.id,renderSha256:'7'.repeat(64),sourceFingerprint:'6'.repeat(64),
   projectFingerprintAfter:projectFingerprint(state.native),productionChanged:false,
   publicationAuthorized:false,undo:{sourceProjectRevision:1},receipts:[{operationId:op.id}]};
 };
 const service=createApprovedHyperFramesWorkflow({ledger,resolveContext,
  readProject,renderHyperFrames,importFableCutMotion});
 return {scratch,ledger,state,input,service,op,preflight};
}
test('exact Master Director approval and human session grant a private one-use motion token',async()=>{
 const r=rig();
 try{
  const inspection=await r.service.inspect(r.input);
  assert.equal(inspection.status,'PRIVATE_HF_MOTION_READY_FOR_ONE_USE_APPROVAL');
  assert.equal(inspection.mayPublish,false);
  assert.equal(r.state.renders,0);assert.equal(r.state.imports,0);
  await assert.rejects(r.service.issue(r.input),/Verified exact batch approval required/);
  const granted=await r.service.issue(r.input,{verifiedHumanSession:true});
  assert.equal(granted.status,'HF_PRIVATE_ONE_USE_APPROVAL_ISSUED_NOT_EXECUTED');
  assert.match(granted.approvalId,/^a_[a-f0-9]{32}$/);
  const result=await r.service.execute({...r.input,approvalId:granted.approvalId});
  assert.equal(result.status,'PRIVATE_HF_FABLECUT_MEDIA_STAGED_AWAITING_AV_QA');
  assert.equal(result.publicationAuthorized,false);
  assert.equal(result.fullAVReviewed,false);
  assert.equal(result.fullReelRendered,false);
  assert.equal(r.state.renders,1);
  assert.equal(r.state.imports,1);
  assert.equal(existsSync(join(r.scratch,'ledger',granted.approvalId+'.claimed')),true);
  const rec=JSON.parse(readFileSync(join(r.scratch,'ledger',granted.approvalId+'.result.json')));
  assert.equal(rec.schema,'sues-director-batch-result/v1');
  assert.equal(rec.result.receipts[0].operationId,r.op.id);
  await assert.rejects(r.service.execute({...r.input,approvalId:granted.approvalId}),
   /FABLECUT_PROJECT_FINGERPRINT_CHANGED|HF_APPROVAL_EXPIRED_USED_OR_CHANGED/);
 }finally{rmSync(r.scratch,{recursive:true,force:true});}
});
test('two successful grants cannot double-apply after first alters native revision',async()=>{
 const r=rig();
 try{
  const a=await r.service.issue(r.input,{verifiedHumanSession:true});
  const b=await r.service.issue(r.input,{verifiedHumanSession:true});
  await r.service.execute({...r.input,approvalId:a.approvalId});
  await assert.rejects(r.service.execute({...r.input,approvalId:b.approvalId}),/FABLECUT_PROJECT_FINGERPRINT_CHANGED|HF_APPROVAL_EXPIRED_USED_OR_CHANGED/);
  assert.equal(r.state.imports,1);
 }finally{rmSync(r.scratch,{recursive:true,force:true});}
});
test('a stale or autonomous master decision cannot authorize HyperFrames',async()=>{
 const r=rig();
 try{
  r.state.masterRev='9'.repeat(64);
  await assert.rejects(r.service.inspect(r.input),/MASTER_CURRENT_HEAD_CHANGED/);
  r.state.masterRev=r.input.storyRevision;
  r.state.approval={...r.state.approval,mode:'autonomous'};
  await assert.rejects(r.service.inspect(r.input),/MASTER_CREATIVE_APPROVAL_REQUIRED/);
  assert.equal(r.state.renders,0);
 }finally{rmSync(r.scratch,{recursive:true,force:true});}
});
test('a mismatched render proof consumes authorization but never imports video',async()=>{
 const r=rig();
 try{
  const grant=await r.service.issue(r.input,{verifiedHumanSession:true});
  const evil=createApprovedHyperFramesWorkflow({ledger:r.ledger,
   resolveContext:async()=>({privateClone:true,nativeProjectId:r.input.projectId,
    store:{current:()=>({revision:r.input.storyRevision}),
     approved:async()=>r.state.approval,
     readDraft:()=>({sourceSha256:r.preflight.sourceSha256,timeline:{fingerprint:r.preflight.timelineFingerprint},operations:[r.op]})},
    loadPreflight:()=>r.preflight,hfSource:{verified:true,renderable:true,fingerprint:'6'.repeat(64)},
    nativeFingerprint:projectFingerprint(r.state.native)}),
   readProject:async()=>({privateClone:true,projectId:r.input.projectId,data:r.state.native}),
   renderHyperFrames:async()=>({status:'NATIVE_HYPERFRAMES_RENDER_VERIFIED',
    sourceFingerprint:'6'.repeat(64),variablesSha256:'0'.repeat(64),
    outputSha256:'7'.repeat(64),frames:151,fps:30,width:1080,height:1920,audioStreams:0}),
   importFableCutMotion:async()=>{throw Error('SHOULD_NOT_IMPORT')}});
  await assert.rejects(evil.execute({...r.input,approvalId:grant.approvalId}),/VARIABLE_PROOF_INVALID/);
  assert.equal(r.state.imports,0);
  // A failure after claiming the token never retries the operation.
  await assert.rejects(evil.execute({...r.input,approvalId:grant.approvalId}),/APPROVAL_EXPIRED_USED/);
 }finally{rmSync(r.scratch,{recursive:true,force:true});}
});
