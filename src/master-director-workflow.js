// SUES Master Director / trusted workflow boundary.
// Pure decision logic. Never calls providers, imports files or publishes.
import {reviewMasterDirectorPlan,auditMasterDirectorExecution} from './master-director-gate.js';

const SHA=/^[a-f0-9]{64}$/;
const ID=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/;
const validId=x=>typeof x==='string'&&ID.test(x);
const nonneg=x=>typeof x==='number'&&Number.isFinite(x)&&x>=0;
const issue=(code,subject='workflow')=>({code,subject});
const allowedLink=x=>{
 if(typeof x!=='string'||x.length>2048)return false;
 try {const u=new URL(x);return u.protocol==='https:'&&!u.username&&!u.password;}
 catch{return false;}
};
const trustedChoice=(choice,fp)=>choice?.userVerified===true&&
 validId(choice.decisionId)&&choice.fingerprint===fp&&
 ['review','approve','autonomous'].includes(choice.mode);

export function buildMasterDirectorReview(plan,registry={}){
 const preflight=reviewMasterDirectorPlan(plan,registry);
 if(preflight.status==='BLOCKED')return {status:'BLOCKED',issues:preflight.issues};
 const sceneById=new Map(plan.scenes.map(s=>[s.id,s]));
 const timeline=plan.scenes.map(s=>({
  sceneId:s.id,start:s.start,end:s.end,title:s.title??s.purpose,
  phase:s.phase??'unlabelled',objective:s.purpose,
  operations:plan.operations.filter(o=>o.sceneId===s.id).map(o=>({
   id:o.id,start:o.start,end:o.end,track:o.track??'unspecified',
   effect:o.effect,renderer:o.renderer,reason:o.reason,
   resourceId:o.resourceId??null,resourceRef:o.creativeResourceRef??null,
   parameters:structuredClone(o.parameters),dependsOn:[...(o.dependsOn??[])],
   requiredQA:[...o.requiredQA],motifId:o.motifId??null,
   speechAnchor:o.speechAnchor?structuredClone(o.speechAnchor):null
  }))
 }));
 const arc=Array.isArray(plan.creativeContext?.arc)?plan.creativeContext.arc:[];
 const narrativeTimeline=arc.map(beat=>({
  beatId:beat.id,phase:beat.phase,start:beat.start,end:beat.end,
  purpose:beat.purpose,
  operations:plan.operations.filter(op=>op.start<beat.end&&op.end>beat.start).map(op=>({
   id:op.id,effect:op.effect,track:op.track,start:op.start,end:op.end
  }))
 }));
 const grouped=new Map();
 for(const op of plan.operations){
  if(op.resourceId===undefined)continue;
  if(!grouped.has(op.resourceId))grouped.set(op.resourceId,[]);
  grouped.get(op.resourceId).push(op.id);
 }
 const resources=[...grouped.entries()].map(([id,operationIds],i)=>{
  const a=registry.licensedAssets?.[id];
  return {number:i+1,id,operationIds,
   title:typeof a?.title==='string'&&a.title?a.title:id,
   kind:a?.kind??'unknown',origin:a?.origin??'unrecorded',
   version:a?.version??null,
   previewUrl:allowedLink(a?.previewUrl)?a.previewUrl:null,
   previewAvailable:allowedLink(a?.previewUrl),
   rightsVerified:a?.rightsVerified===true
  };
 });
 return {status:'READY_FOR_CHOICE',fingerprint:preflight.fingerprint,
  centralMessage:plan.creativeContext?.centralMessage??'',
  intendedExperience:plan.creativeContext?.intendedExperience??'',
  timeline,narrativeTimeline,resources,
  phasesNotDocumented:Array.isArray(plan.creativeContext?.phasesNotDocumented)?plan.creativeContext.phasesNotDocumented:[],
  choices:['approve','review','autonomous'],issueCount:0};
}

// The caller MUST load the choice and budgets from authenticated server-side
// records. A client cannot self-certify approval by adding fields to its plan.
export function decideMasterDirectorWork(plan,registry={},cost={}){
 const preflight=reviewMasterDirectorPlan(plan,registry);
 if(preflight.status==='BLOCKED')return {status:'BLOCKED',issues:preflight.issues};
 const fp=preflight.fingerprint,choice=registry.planChoice;
 if(!trustedChoice(choice,fp))
  return {status:'AWAITING_PLAN_CHOICE',fingerprint:fp,issues:[]};
 if(choice.mode==='review')
  return {status:'REVIEW_REQUESTED',fingerprint:fp,issues:[]};
 if(!nonneg(cost.estimatedUSD)||typeof cost.provider!=='string'||!validId(cost.provider))
  return {status:'COST_ESTIMATE_REQUIRED',fingerprint:fp,issues:[issue('UNVERIFIED_COST_ESTIMATE')]};
 const isFree=cost.estimatedUSD===0;
 const cap=registry.approvedBalances?.[cost.provider]??0;
 const reserved=registry.reservedBalances?.[cost.provider]??0;
 const available=nonneg(cap)&&nonneg(reserved)?Math.max(0,cap-reserved):0;
 // Prior user-approved prepaid capacity is usable, not new authority to recharge.
 const authorized=isFree||(available>=cost.estimatedUSD&&
   registry.approvedProviders?.includes(cost.provider));
 if(!authorized)return {status:'NEEDS_COST_APPROVAL',fingerprint:fp,
  estimatedUSD:cost.estimatedUSD,availableUSD:available,
  issues:[issue('NEW_SPEND_NOT_APPROVED',cost.provider)],
  proposal:'Try an available zero-cost option or request explicit approval.'};
 // Autonomous authorizes routine preparation for THIS fingerprint only,
 // not publishing, third-party generation charges, or deploying code.
 const approved=registry.approvedPlanFingerprint===fp;
 if(!approved)return {status:'AWAITING_PLAN_APPROVAL_RECORD',fingerprint:fp,issues:[]};
 return {status:'READY_TO_EXECUTE',mode:choice.mode,fingerprint:fp,
  spendPermission:isFree?'FREE': 'PREAPPROVED_BALANCE',
  estimatedUSD:cost.estimatedUSD,issues:[],mayPublish:false};
}

export function assessMasterDirectorDelivery(plan,registry={},render={},fault={}){
 const preflight=reviewMasterDirectorPlan(plan,registry);
 if(preflight.status==='BLOCKED')
  return {status:'BLOCKED',issues:preflight.issues,options:['repair-plan']};
 const failures=Array.isArray(fault.failedOperationIds)?fault.failedOperationIds:[];
 const operationIds=new Set(plan.operations.map(o=>o.id));
 if(!failures.every(x=>operationIds.has(x))||new Set(failures).size!==failures.length)
  return {status:'BLOCKED',issues:[issue('UNKNOWN_FAILED_OPERATION')],options:[]};
 const validFile=render.status==='complete'&&render.fingerprint===preflight.fingerprint&&
  SHA.test(render.outputSha256??'')&&render.playable===true&&
  render.projectEditable===true&&
  typeof render.duration==='number'&&Number.isFinite(render.duration)&&
  Math.abs(render.duration-plan.timeline.duration)<=1/plan.timeline.fps;
 if(!validFile)return {status:'REPAIR_REQUIRED',issues:[issue('NO_VERIFIED_EXPORTABLE_RENDER')],
  failedOperationIds:failures,options:['repair-render','retry-after-revalidation']};
 // Completion doesn't imply good QA, acceptance, or publication authorization.
 const isFaultless=failures.length===0&&fault.kind==='none';
 const audit=isFaultless?auditMasterDirectorExecution(plan,registry,render.executionManifest??{}):null;
 const mayDeliverFinal=isFaultless&&audit?.status==='READY_FOR_RELEASE'&&
   registry.finalQAAcceptedFingerprint===preflight.fingerprint;
 if(mayDeliverFinal)return {status:'FINAL_FILE_REVIEW',issues:[],options:['download'],mayPublish:false};
 return {status:'PROVISIONAL_EXPORT_OPTION',issues:failures.map(x=>issue('UNFINISHED_OPERATION',x)),
  failedOperationIds:failures,options:['repair','export-provisional','finish-manually-in-capcut'],
  mayPublish:false,requiresUserExportDecision:true,
  label:'Provisional: not fully quality-approved'};
}
