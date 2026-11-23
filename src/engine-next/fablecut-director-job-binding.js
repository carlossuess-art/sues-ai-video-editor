/** Trusted server-side binding for FableCut native project → SUES Master Director
 * job. Never infer the match from titles, source paths or a user-supplied jobId.
 * A verified binding is necessary, but not sufficient, for human authorization.
 */
import {verifyDirectorPlanTransform} from './fablecut-director-plan-proof.js';
const NATIVE=/^p_[A-Za-z0-9_-]{2,96}$/;
const JOB=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const SHA=/^[a-f0-9]{64}$/;
export function createBoundDirectorPlanVerifier({resolveBinding,getJob,getStore}={}){
 if(typeof resolveBinding!=='function'||typeof getJob!=='function'||typeof getStore!=='function')
  throw Error('Trusted project binding, job lookup and store builder required');
 return async({storyRevision,decisionId,operationId,request}={})=>{
  if(!request||!NATIVE.test(request.projectId??'')||!SHA.test(storyRevision??'')||!SHA.test(decisionId??''))
   return {ok:false,reason:'INVALID_PROJECT_BINDING_REQUEST'};
  try{
   // resolveBinding must read administrator-owned, verified server-side state.
   // The caller must not send a mapping or control which job is returned.
   const binding=await resolveBinding(request.projectId);
   if(!binding||binding.nativeProjectId!==request.projectId||!JOB.test(binding.jobId??'')||
      binding.verified!==true)return {ok:false,reason:'NATIVE_PROJECT_UNBOUND'};
   const job=await getJob(binding.jobId);
   if(!job||job.id!==binding.jobId||job.intermediate===true||
      typeof job.projectId!=='string'||!job.projectId||
      typeof binding.suesProjectId!=='string'||!binding.suesProjectId||
      job.projectId!==binding.suesProjectId)return {ok:false,reason:'SUES_JOB_NOT_CURRENT_BINDING'};
   const store=await getStore(binding.jobId);
   const proof=await verifyDirectorPlanTransform({store,storyRevision,decisionId,operationId,request});
   if(!proof.ok)return proof;
   return {...proof,jobId:binding.jobId,suesProjectId:binding.suesProjectId,nativeProjectId:binding.nativeProjectId};
  }catch{return {ok:false,reason:'PROJECT_BINDING_UNVERIFIABLE'};}
 };
}
