import {externalCatalog} from './external-edit-plan.js';
import {compileMasterDirectorSource} from './master-director-source-timeline.js';
const blocked=(code,statusCode=200)=>({status:'BLOCKED',issues:[{code}],canExecute:false,statusCode});
// Invoked only by authenticated server routes using the currently stored decision.
export async function prepareMasterDirectorRender({store,revision,decisionId,jobs,jobId,assets,probe}){
 const prepared=await store.layers(revision,decisionId);
 if(prepared.status!=='STRUCTURE_READY_NOT_RENDERED'||prepared.remotion?.status!=='READY_FOR_REMOTION_STAGING')
  return {status:'BLOCKED',issues:prepared.issues?.length?prepared.issues:prepared.remotion?.issues??[{code:'LAYER_PREPARATION_FAILED'}],canExecute:false,statusCode:200};
 const before=jobs.get(jobId),project=jobs.loadProfile(before.profileId),catalog=externalCatalog(project,before.settings,assets.list());
 const width=project.inputs.source.width,height=project.inputs.source.height,canvas=prepared.remotion.composition.canvas;
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0||Math.abs(width/height-canvas.width/canvas.height)>0.000001)
  return blocked('SOURCE_ASPECT_CHANGE_UNSUPPORTED');
 const evidence=await probe(project),current=jobs.get(jobId),fresh=externalCatalog(jobs.loadProfile(current.profileId),current.settings,assets.list());
 if(fresh.timelineFingerprint!==catalog.timelineFingerprint||prepared.graph.timelineFingerprint!==fresh.timelineFingerprint)return blocked('PROJECT_VERSION_CHANGED',409);
 if(evidence.status!=='SOURCE_CFR30_VERIFIED')return {...evidence,canExecute:false,statusCode:200};
 if(evidence.width!==width||evidence.height!==height)return blocked('SOURCE_GEOMETRY_CHANGED');
 if(evidence.sourceSha256!==fresh.sourceSha256)return blocked('SOURCE_IDENTITY_UNVERIFIED');
 const rechecked=await store.layers(revision,decisionId);
 if(rechecked.status!=='STRUCTURE_READY_NOT_RENDERED'||rechecked.remotion?.status!=='READY_FOR_REMOTION_STAGING'||
    rechecked.graph.planFingerprint!==prepared.graph.planFingerprint)return blocked('APPROVAL_OR_EVIDENCE_CHANGED',409);
 const result=compileMasterDirectorSource({composition:rechecked.remotion.composition,sourceSha256:fresh.sourceSha256,
  sourceDuration:evidence.sourceDuration,sourceTiming:evidence.sourceTiming,sourceHasAudio:evidence.sourceHasAudio,sourceFit:'fill',timeMap:fresh.sourceTimeMap});
 return {...result,canExecute:false,statusCode:200,...(result.composition?{project,projectFingerprint:fresh.timelineFingerprint}:{})};
}
