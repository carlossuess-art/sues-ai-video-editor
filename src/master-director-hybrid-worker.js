// Trusted two-phase hybrid worker. Both functions are server-only; never expose
// native changes or full media paths directly to a web client. Rendered native
// children are INTERMEDIATE private jobs, never a completed Master video.
import {prepareMasterHybridNativeStage} from './master-director-hybrid-native-stage.js';
import {prepareMasterHybridNativeHandoff} from './master-director-hybrid-handoff.js';
import {externalCatalog} from './external-edit-plan.js';
import {auditMasterDirectorMedia} from './master-director-technical-audit.js';
import {fileSha256} from './local-pipeline.js';
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const HASH=/^[a-f0-9]{64}$/;
const block=code=>({status:'BLOCKED',canExecute:false,final:false,issues:[{code}]});
const last=job=>job?.instructions?.at(-1);

export async function prepareTrustedHybridWork({store,jobs,jobId,revision,decisionId,requestId,assets,commandPlanner}={}){
 if(!UUID.test(requestId??'')||!HASH.test(revision??'')||!HASH.test(decisionId??'')||
    !jobs||!assets||typeof commandPlanner!=='function')return block('HYBRID_WORK_INPUT_INVALID');
 const parent=jobs.get(jobId);
 if(!['PREVIEW_READY','DONE'].includes(parent.state)||jobs.children.size||jobs.previewBusy||
    jobs.publishing.size||jobs.queued().length)return block('HYBRID_EDITOR_BUSY');
 const approved=await store.approved(revision,decisionId);
 if(!approved)return block('APPROVAL_OR_PROJECT_CHANGED');
 const layers=await store.layers(revision,decisionId);
 if(layers.status!=='STRUCTURE_READY_NOT_RENDERED'||
    layers.hybrid?.status!=='MIXED_COMPONENTS_STAGED_NOT_RENDERABLE')
  return block('HYBRID_LAYERS_UNAVAILABLE');
 const hybrid=layers.hybrid;
 if(hybrid.crossEngineDependencies.some(d=>d.fromEngine==='remotion'&&d.toEngine==='native')||
    hybrid.crossEngineOverlaps.some(d=>d.classification==='audio-mix')||
    hybrid.remotionComponent.layers.some(l=>l.maskAssetId||l.maskFrameAssetIds?.length))
  return block('HYBRID_HANDOFF_NEEDS_ENGINE_WORK');
 const project=jobs.loadProfile(parent.profileId),catalog=externalCatalog(project,parent.settings,assets.list());
 if(catalog.timelineFingerprint!==layers.graph.timelineFingerprint||
    catalog.sourceSha256!==hybrid.sourceSha256||!HASH.test(project.boundHashes?.source??''))
  return block('HYBRID_PROJECT_CHANGED');
 const prepared=prepareMasterHybridNativeStage({plan:approved.plan,registry:approved.registry,catalog,
  project,settings:parent.settings,assets:assets.list(),commandPlanner});
 if(prepared.status!=='NATIVE_STAGE_PREPARED'||prepared.planFingerprint!==hybrid.planFingerprint||
    prepared.originalSourceSha256!==hybrid.sourceSha256)
  return block(prepared.issues?.[0]?.code??'HYBRID_NATIVE_STAGE_REJECTED');
 if([...jobs.jobs.values()].some(j=>j.parentId===jobId&&j.requestId===requestId))
  return block('HYBRID_REQUEST_ID_ALREADY_USED');
 return {schema:'sues-master-hybrid-work/v1',status:'READY_TO_START_NATIVE_STAGE',canExecute:false,
  canPublish:false,final:false,jobId,requestId,revision,decisionId,
  planFingerprint:hybrid.planFingerprint,projectFingerprint:catalog.timelineFingerprint,
  sourceSha256:hybrid.sourceSha256,hybrid,prepared,parentProfileId:parent.profileId};
}

export async function startTrustedHybridNativeJob({work,jobs,store,assets,commandPlanner}={}){
 if(work?.schema!=='sues-master-hybrid-work/v1'||work.status!=='READY_TO_START_NATIVE_STAGE'||
    !UUID.test(work.requestId??'')||!HASH.test(work.planFingerprint??'')||!jobs||!store||!assets||
    typeof commandPlanner!=='function')
  return block('HYBRID_WORK_NOT_PREPARED');
 const parent=jobs.get(work.jobId);
 if(parent.profileId!==work.parentProfileId||!['PREVIEW_READY','DONE'].includes(parent.state)||
    jobs.children.size||jobs.previewBusy||jobs.publishing.size||jobs.queued().length)
  return block('HYBRID_PARENT_CHANGED_OR_BUSY');
 // Trust no preflight snapshot beyond this boundary. Regenerate it from the
 // currently approved full plan and compare the exact approved native changes.
 const approved=await store.approved(work.revision,work.decisionId),layers=await store.layers(work.revision,work.decisionId);
 if(!approved||layers.hybrid?.status!=='MIXED_COMPONENTS_STAGED_NOT_RENDERABLE'||
    layers.hybrid.planFingerprint!==work.planFingerprint)return block('HYBRID_APPROVAL_CHANGED');
 const project=jobs.loadProfile(parent.profileId),catalog=externalCatalog(project,parent.settings,assets.list());
 if(catalog.sourceSha256!==work.sourceSha256||catalog.timelineFingerprint!==work.projectFingerprint||
    layers.graph?.timelineFingerprint!==work.projectFingerprint)return block('HYBRID_PROJECT_CHANGED');
 const fresh=prepareMasterHybridNativeStage({plan:approved.plan,registry:approved.registry,catalog,project,
    settings:parent.settings,assets:assets.list(),commandPlanner});
 if(fresh.status!=='NATIVE_STAGE_PREPARED'||fresh.reviewId!==work.prepared.reviewId||
    JSON.stringify(fresh.changes)!==JSON.stringify(work.prepared.changes)||
    JSON.stringify(fresh.actions)!==JSON.stringify(work.prepared.actions))
   return block('HYBRID_NATIVE_PLAN_CHANGED');
 const existing=[...jobs.jobs.values()].find(j=>j.parentId===work.jobId&&j.requestId===work.requestId);
 if(existing)return block('HYBRID_REQUEST_ID_ALREADY_USED');
 const instruction={kind:'master-hybrid-native-stage',revision:work.revision,decisionId:work.decisionId,
  planFingerprint:work.planFingerprint,reviewId:work.prepared.reviewId,
  sourceSha256:work.sourceSha256,operations:[...work.prepared.nativeOperationIds],
  at:new Date().toISOString(),intermediate:true,final:false};
 const child=jobs.create(work.parentProfileId,work.prepared.changes,
  {parentId:work.jobId,requestId:work.requestId,instruction});
 if(child?.parentId!==work.jobId)return block('HYBRID_CHILD_IDENTITY_INVALID');
 const queued=jobs.render(child.id);
 return {status:'NATIVE_STAGE_QUEUED',canExecute:false,final:false,requestId:work.requestId,
  childId:child.id,parentId:work.jobId,state:queued.state,planFingerprint:work.planFingerprint};
}

export async function verifyTrustedHybridNativeChild({store,jobs,parentId,childId,revision,decisionId,assets,
  auditor=auditMasterDirectorMedia}={}){
 if(!UUID.test(parentId??'')||!UUID.test(childId??'')||!HASH.test(revision??'')||
    !HASH.test(decisionId??'')||parentId===childId)return block('HYBRID_VERIFY_INPUT_INVALID');
 const child=jobs.get(childId),parent=jobs.get(parentId),instruction=last(child);
 if(child.parentId!==parentId||parent.profileId!==child.profileId||child.state!=='DONE'||
    instruction?.kind!=='master-hybrid-native-stage'||instruction.intermediate!==true||
    instruction.revision!==revision||instruction.decisionId!==decisionId||
    !UUID.test(child.requestId??''))return block('HYBRID_NATIVE_CHILD_NOT_READY');
 const approved=await store.approved(revision,decisionId),layers=await store.layers(revision,decisionId);
 if(!approved||layers.hybrid?.status!=='MIXED_COMPONENTS_STAGED_NOT_RENDERABLE'||
    layers.hybrid.planFingerprint!==instruction.planFingerprint)return block('APPROVAL_OR_PLAN_CHANGED');
 const project=jobs.loadProfile(parent.profileId),catalog=externalCatalog(project,parent.settings,assets.list());
 if(catalog.timelineFingerprint!==layers.graph.timelineFingerprint||catalog.sourceSha256!==instruction.sourceSha256||
    project.boundHashes?.source!==instruction.sourceSha256)return block('HYBRID_PROJECT_CHANGED');
 const output=await jobs.media(childId);
 if(typeof output!=='string'||!output.startsWith('/')||fileSha256(project.sourcePath)!==instruction.sourceSha256)
  return block('HYBRID_NATIVE_SOURCE_IDENTITY_CHANGED');
 const frames=layers.hybrid.durationFrames;
 const audit=await auditor({sourcePath:project.sourcePath,sourceSha256:instruction.sourceSha256,outputPath:output,
  expected:{width:1080,height:1920,duration:frames/30,fps:30}});
 if(audit.status!=='TECHNICAL_PASS_HUMAN_QA_PENDING'||!HASH.test(audit.outputSha256??''))
  return block('HYBRID_NATIVE_OUTPUT_AUDIT_FAILED');
 const nativeChild={jobId:childId,parentJobId:parentId,planFingerprint:instruction.planFingerprint,
  originalSourceSha256:instruction.sourceSha256,outputSha256:audit.outputSha256,
  editableVersion:true,nativeRenderCompleted:true,durationFrames:frames,fps:30,
  width:audit.video?.width,height:audit.video?.height,audioPresent:audit.audioPresent};
 const handoff=prepareMasterHybridNativeHandoff({hybrid:layers.hybrid,nativeChild,mediaAudit:audit});
 if(handoff.status!=='HANDOFF_STAGED_NOT_RENDERED')return block(handoff.issues?.[0]?.code??'HYBRID_HANDOFF_REJECTED');
 // Verify again after a long decode: owner policy may have been edited meanwhile.
 const fresh=await store.layers(revision,decisionId);
 if(fresh.status!=='STRUCTURE_READY_NOT_RENDERED'||fresh.graph?.planFingerprint!==handoff.sourceLineage.approvedPlanFingerprint||
    fileSha256(output)!==audit.outputSha256)return block('HYBRID_HANDOFF_STALE');
 return {status:'HANDOFF_READY_FOR_PRIVATE_PREVIEW',canExecute:false,final:false,
  revision,decisionId,requestId:child.requestId,childId,parentId,mediaAudit:audit,
  outputPath:output,handoff};
}
