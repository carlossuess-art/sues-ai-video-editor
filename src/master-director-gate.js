// SUES MASTER DIRECTOR · initial deterministic safety gate.
// Independent of the current renderer: it never changes projects, media or settings.
import {createHash} from 'node:crypto';

export const MASTER_RULE_PRECEDENCE=Object.freeze([
  'safety-and-rights','explicit-user-approval','locked-masters','project','profile','scene'
]);
export const MASTER_QA_KINDS=Object.freeze([
  'rendered-frame','motion-playback','audio-playback','time-sync','narrative-review'
]);
const SHA=/^[a-f0-9]{64}$/;
const validId=x=>typeof x==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,79}$/.test(x);
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const issue=(issues,code,subject='plan')=>issues.push({code,subject});
const sortedUnique=x=>Array.isArray(x)&&x.every(validId)&&new Set(x).size===x.length;

export function masterDirectorFingerprint(plan){
  if(!obj(plan)||plan.schema!=='sues-master-director/v1')throw Error('Invalid master director schema');
  // Conservatively invalidate evidence even when key order or any plan field changes.
  return createHash('sha256').update(JSON.stringify(plan)).digest('hex');
}

export function reviewMasterDirectorPlan(plan,registry={}){
  const issues=[];
  if(!obj(plan)||plan.schema!=='sues-master-director/v1'){
    issue(issues,'INVALID_SCHEMA');
    return {status:'BLOCKED',fingerprint:null,issues};
  }
  const fingerprint=masterDirectorFingerprint(plan);
  const source=plan.source??{},timeline=plan.timeline??{},rules=plan.rules??{};
  if(!SHA.test(source.sha256??'')||source.type!=='original'||source.editable!==true||source.flattened!==false)
    issue(issues,'EDITABLE_ORIGINAL_REQUIRED');
  if(!SHA.test(registry.sourceSha256??'')||registry.sourceSha256!==source.sha256)
    issue(issues,'SOURCE_VERSION_MISMATCH');
  if(!validId(timeline.fingerprint)||timeline.fingerprint!==registry.timelineFingerprint||
     timeline.timeSpace!=='edit-timeline'||timeline.fps!==30||
     !finite(timeline.duration)||timeline.duration<=0||timeline.duration>3600)
    issue(issues,'TIMELINE_CONTRACT_MISMATCH');
  if(!Array.isArray(rules.precedence)||JSON.stringify(rules.precedence)!==JSON.stringify(MASTER_RULE_PRECEDENCE)||
     !validId(rules.version)||rules.version!==registry.approvedRuleVersion)
    issue(issues,'RULE_AUTHORITY_MISMATCH');
  if(!Array.isArray(rules.unresolvedConflicts)||rules.unresolvedConflicts.length)
    issue(issues,'UNRESOLVED_RULE_CONFLICTS');
  if(!Array.isArray(rules.lockedMasters)||rules.lockedMasters.length===0){
    issue(issues,'LOCKED_MASTERS_REQUIRED');
  }else for(const master of rules.lockedMasters){
    if(!validId(master?.id)||!SHA.test(master?.sha256??'')||
       !obj(registry.masterHashes)||registry.masterHashes[master.id]!==master.sha256)
      issue(issues,'MASTER_MISMATCH',master?.id??'unknown');
  }
  const scenes=Array.isArray(plan.scenes)?plan.scenes:[];
  if(!scenes.length||scenes.length>300)issue(issues,'SCENES_REQUIRED');
  const sceneIds=new Set();
  let cursor=0;
  for(const scene of scenes){
    if(!validId(scene?.id)||sceneIds.has(scene.id))issue(issues,'SCENE_ID_INVALID',scene?.id??'unknown');
    else sceneIds.add(scene.id);
    if(!finite(scene?.start)||!finite(scene?.end)||scene.start<0||scene.end<=scene.start||
       !finite(timeline.duration)||scene.end>timeline.duration+1e-6||
       Math.abs(scene.start-cursor)>1e-6||
       typeof scene.purpose!=='string'||scene.purpose.trim().length<5)
      issue(issues,'SCENE_TIMELINE_OR_PURPOSE_INVALID',scene?.id??'unknown');
    if(finite(scene?.end))cursor=scene.end;
  }
  if(!finite(timeline.duration)||Math.abs(cursor-timeline.duration)>1e-6)
    issue(issues,'SCENE_COVERAGE_INCOMPLETE');
  const operations=Array.isArray(plan.operations)?plan.operations:[];
  if(!operations.length||operations.length>1500)issue(issues,'OPERATIONS_REQUIRED');
  const ids=new Set(),byId=new Map(),sceneById=new Map(scenes.filter(s=>validId(s?.id)).map(s=>[s.id,s]));
  for(const op of operations){
    if(!validId(op?.id)||ids.has(op.id))issue(issues,'OPERATION_ID_INVALID',op?.id??'unknown');
    else{ids.add(op.id);byId.set(op.id,op);}
    const scene=sceneById.get(op?.sceneId);
    if(!scene||!finite(op?.start)||!finite(op?.end)||op.end<=op.start||
       op.start<scene.start-1e-6||op.end>scene.end+1e-6)
      issue(issues,'OPERATION_OUTSIDE_SCENE',op?.id??'unknown');
    if(!validId(op?.effect)||!validId(op?.renderer)||
       !Array.isArray(registry.rendererCapabilities?.[op?.renderer])||
       !registry.rendererCapabilities[op.renderer].includes(op.effect))
      issue(issues,'RENDERER_CAPABILITY_UNVERIFIED',op?.id??'unknown');
    if(typeof op?.reason!=='string'||op.reason.trim().length<5)
      issue(issues,'NARRATIVE_REASON_REQUIRED',op?.id??'unknown');
    if(!sortedUnique(op?.dependsOn??[]))issue(issues,'INVALID_DEPENDENCIES',op?.id??'unknown');
    if(!Array.isArray(op?.requiredQA)||op.requiredQA.length===0||
       new Set(op.requiredQA).size!==op.requiredQA.length||
       !op.requiredQA.every(k=>MASTER_QA_KINDS.includes(k)))
      issue(issues,'QA_REQUIREMENTS_MISSING',op?.id??'unknown');
    if(op?.resourceId!==undefined){
      const asset=registry.licensedAssets?.[op?.resourceId];
      if(!validId(op.resourceId)||!asset||asset.rightsVerified!==true||
         asset.commercialUseAllowed!==true||!SHA.test(asset.sha256??'')||
         !SHA.test(op.resourceSha256??'')||asset.sha256!==op.resourceSha256)
        issue(issues,'ASSET_RIGHTS_OR_VERSION_UNVERIFIED',op?.id??'unknown');
    }
  }
  const visiting=new Set(),visited=new Set();
  function walk(id){
    if(visited.has(id))return;
    if(visiting.has(id)){issue(issues,'DEPENDENCY_CYCLE',id);return;}
    visiting.add(id);
    for(const dependency of byId.get(id)?.dependsOn??[]){
      if(!byId.has(dependency))issue(issues,'MISSING_DEPENDENCY',id);
      else walk(dependency);
    }
    visiting.delete(id);visited.add(id);
  }
  for(const id of byId.keys())walk(id);
  if(issues.length)return {status:'BLOCKED',fingerprint,issues};
  return {status:registry.approvedPlanFingerprint===fingerprint?'READY_TO_EXECUTE':'AWAITING_PLAN_APPROVAL',fingerprint,issues:[]};
}

// A renderer's "done" flag is not QA. Actual evidence must arrive from a
// separately authenticated QA service through the trusted registry.
export function auditMasterDirectorExecution(plan,registry={},execution={}){
  const preflight=reviewMasterDirectorPlan(plan,registry);
  if(preflight.status!=='READY_TO_EXECUTE')return preflight;
  const issues=[],fingerprint=preflight.fingerprint,ops=plan.operations;
  if(execution.fingerprint!==fingerprint||!Array.isArray(execution.operations)||
     execution.operations.length!==ops.length)
    issue(issues,'EXECUTION_MANIFEST_MISMATCH');
  else{
    const actual=new Map(execution.operations.map(o=>[o?.id,o]));
    if(actual.size!==ops.length)issue(issues,'EXECUTION_MANIFEST_MISMATCH');
    for(const op of ops){
      const result=actual.get(op.id);
      if(!result||result.renderer!==op.renderer||result.effect!==op.effect||
         result.start!==op.start||result.end!==op.end||
         !SHA.test(result.outputSha256??''))
        issue(issues,'EXECUTED_OPERATION_MISMATCH',op.id);
    }
  }
  // Every substantive change invalidates both passes. The final creative
  // acceptance is separate from the technical audit.
  const passes=registry.qaPasses;
  if(!Array.isArray(passes)||passes.length!==2||
     !passes.every(p=>p?.fingerprint===fingerprint&&p?.completed===true&&
       validId(p?.verifierId)&&registry.trustedVerifierIds?.includes(p.verifierId)&&validId(p?.runId))||
     (Array.isArray(passes)&&passes.length===2&&passes[0]?.runId===passes[1]?.runId))
    issue(issues,'TWO_INDEPENDENT_QA_PASSES_REQUIRED');
  else for(let i=0;i<2;i++){
    const evidence=new Map((Array.isArray(passes[i].evidence)?passes[i].evidence:[]).filter(obj).map(e=>[e.operationId,e]));
    if(!Array.isArray(passes[i].evidence)||passes[i].evidence.length!==ops.length||evidence.size!==ops.length)
      issue(issues,'QA_EVIDENCE_INCOMPLETE','pass-'+(i+1));
    for(const op of ops){
      const entry=evidence.get(op.id);
      for(const kind of op.requiredQA){
        const proof=entry?.proofs?.find(p=>p.kind===kind);
        if(!proof||proof.passed!==true||!SHA.test(proof.artifactSha256??''))
          issue(issues,'QA_PROOF_MISSING_OR_FAILED',op.id+':'+kind+':pass-'+(i+1));
      }
    }
  }
  if(issues.length)return {status:'QA_REJECTED',fingerprint,issues};
  return {status:registry.creativeAcceptedFingerprint===fingerprint?'READY_FOR_RELEASE':'AWAITING_CREATIVE_ACCEPTANCE',fingerprint,issues:[]};
}
