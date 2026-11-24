// Planning-only helper: no approval, execution, staging, render or project mutations.
// Native fablecut-command-batch.js and the single-use approval ledger stay authoritative.
import {createHash} from 'node:crypto';
const H=/^[a-f0-9]{64}$/,I=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/,P=/^p_[A-Za-z0-9_-]{2,96}$/;
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const fail=x=>{throw Error(x)};
export const MAX_AUTONOMOUS_BATCH_COMMANDS=100;
export function planAutonomousBatches({projectId,storyRevision,operations,commands,limit=100}={}){
 if(!P.test(projectId??'')||!H.test(storyRevision??''))fail('TRUSTED_IDENTITY_REQUIRED');
 if(!Number.isInteger(limit)||limit<1||limit>100)fail('BATCH_LIMIT_UNSUPPORTED');
 if(!Array.isArray(operations)||operations.length<1||operations.length>1500||!Array.isArray(commands)||operations.length!==commands.length)fail('COVERAGE_INVALID');
 const byId=new Map(),byCommand=new Map(),visit=new Set(),seen=new Set(),order=[];
 for(const op of operations){
  if(!I.test(op?.id??'')||byId.has(op.id)||!Array.isArray(op.dependsOn)||op.dependsOn.some(x=>!I.test(x))||new Set(op.dependsOn).size!==op.dependsOn.length)fail('OPERATION_GRAPH_INVALID');
  byId.set(op.id,op);
 }
 for(const c of commands){if(!I.test(c?.id??'')||!I.test(c?.action??'')||byCommand.has(c.id)||!byId.has(c.id))fail('COMMAND_MAPPING_INVALID');byCommand.set(c.id,c)}
 if(byCommand.size!==byId.size)fail('COMMAND_MAPPING_INVALID');
 function walk(id){
  if(seen.has(id))return;
  if(visit.has(id))fail('DEPENDENCY_CYCLE');
  visit.add(id);
  for(const dep of byId.get(id).dependsOn){if(!byId.has(dep))fail('DEPENDENCY_MISSING');walk(dep)}
  visit.delete(id);seen.add(id);order.push(id);
 }
 for(const op of operations)walk(op.id);
 const planFingerprint=hash({projectId,storyRevision,order,commands:order.map(id=>byCommand.get(id))});
 const batches=[];
 for(let i=0;i<order.length;i+=limit){
  const ids=order.slice(i,i+limit),subset=ids.map(id=>structuredClone(byCommand.get(id))),ordinal=batches.length+1;
  batches.push({batchId:'ab_'+String(ordinal).padStart(4,'0')+'_'+hash({planFingerprint,ids}).slice(0,16),ordinal,
   operationIds:ids,commands:subset,commandFingerprint:hash(subset),previousBatchId:batches.at(-1)?.batchId??null,
   authorization:'REQUIRES_TRUSTED_LEDGER_AND_CAS'});
 }
 return {status:'PLAN_ONLY_NOT_AUTHORIZED',projectId,storyRevision,planFingerprint,batchCount:batches.length,
  totalOperations:order.length,limit,batches};
}
export function bindBatchForCAS(batch,project,{trustedProjectId}={}){
 if(!P.test(trustedProjectId??'')||project?.projectId!==trustedProjectId||
    !Number.isInteger(project.revision)||!Array.isArray(project.clips)||
    !Array.isArray(project.tracks)||!Array.isArray(project.media)||
    !Array.isArray(batch?.commands)||batch.commands.length<1||batch.commands.length>100)fail('NATIVE_BINDING_UNVERIFIED');
 return {baseRevision:project.revision,baseFingerprint:hash(project),commands:structuredClone(batch.commands)};
}
export function verifyBatchReadback(batch,receipts,{beforeRevision,afterRevision,persisted}={}){
 const a=new Set(batch?.operationIds??[]),b=new Set((Array.isArray(receipts)?receipts:[]).map(x=>x?.operationId));
 const ok=a.size>0&&a.size===batch.operationIds.length&&b.size===receipts.length&&b.size===a.size&&[...a].every(id=>b.has(id))&&
  Number.isInteger(beforeRevision)&&Number.isInteger(afterRevision)&&afterRevision>beforeRevision&&persisted===true;
 return ok?{status:'READBACK_AND_RECEIPTS_VERIFIED',afterRevision,batchId:batch.batchId}:
  {status:'RECONCILE_BEFORE_RETRY',code:'RECEIPTS_OR_REVISION_UNVERIFIED'};
}
