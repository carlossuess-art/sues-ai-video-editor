/** Fail-closed bridge between a Master Director creative decision and one native
 * FableCut transform. Never treats a logged-in admin as a creative approval.
 * A native transform must be explicitly, losslessly represented in the plan.
 * No current renderer or editor is enabled by importing this module.
 */
const SHA=/^[a-f0-9]{64}$/;
const ID=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/;
export async function verifyDirectorPlanTransform({store,storyRevision,decisionId,operationId,request}={}){
 if(typeof store?.approved!=='function'||typeof store?.current!=='function'||
    !SHA.test(storyRevision??'')||!SHA.test(decisionId??'')||!ID.test(operationId??'')||
    !request||typeof request!=='object')return {ok:false,reason:'INVALID_PLAN_PROOF'};
 try{
  const head=store.current();
  if(head.revision!==storyRevision)return {ok:false,reason:'STALE_STORY_HEAD'};
  const approved=await store.approved(storyRevision,decisionId);
  // The human decision can be read asynchronously. The story may advance
  // while approval storage is being consulted: never authorize stale edits.
  if(store.current()?.revision!==storyRevision)return {ok:false,reason:'STALE_STORY_HEAD'};
  if(!approved||approved.mode!=='approve'||approved.view?.status!=='READY_FOR_CHOICE'||
     !SHA.test(approved.view.fingerprint??''))return {ok:false,reason:'PLAN_NOT_EXPLICITLY_APPROVED'};
  const ops=approved.plan?.operations;
  if(!Array.isArray(ops))return {ok:false,reason:'PLAN_OPERATIONS_UNAVAILABLE'};
  const matches=ops.filter(op=>op?.id===operationId);
  if(matches.length!==1)return {ok:false,reason:'AMBIGUOUS_OR_MISSING_PLAN_OPERATION'};
  const op=matches[0];
  // Transform manifests have not yet been added to the creative compiler;
  // existing native effects must NOT be interpreted as a position/scale edit.
  if(op.renderer!=='native'||op.effect!=='fablecut-transform-exact/v1')
   return {ok:false,reason:'OPERATION_NOT_NATIVE_TRANSFORM'};
  const p=op.parameters;
  if(!p||typeof p!=='object'||Array.isArray(p))return {ok:false,reason:'MISSING_EXACT_TRANSFORM'};
  const keys=['projectId','revision','clipId','x','y','scale'];
  // Validate the plan's numerical bounds *before* comparing its values:
  // NaN !== NaN, so a plan with NaN should be identified as invalid.
  if(p.revision<0||!Number.isInteger(p.revision)||!Number.isFinite(p.x)||!Number.isFinite(p.y)||
     !Number.isFinite(p.scale)||Math.abs(p.x)>3000||Math.abs(p.y)>3000||p.scale<.05||p.scale>8)
   return {ok:false,reason:'INVALID_TRANSFORM_VALUES'};
  if(Object.keys(p).length!==keys.length||keys.some(key=>!Object.hasOwn(p,key)||p[key]!==request[key]))
   return {ok:false,reason:'TRANSFORM_DIFFERS_FROM_PLAN'};
  return {ok:true,storyRevision,decisionId,operationId,planFingerprint:approved.view.fingerprint,
   projectFingerprint:approved.view.projectFingerprint};
 }catch{return {ok:false,reason:'PLAN_PROOF_UNVERIFIABLE'};}
}
