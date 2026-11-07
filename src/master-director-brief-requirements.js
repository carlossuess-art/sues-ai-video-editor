// Read-only resource and operation readiness ledger for an unapproved Film
// Director brief. Slot names are logical identifiers, NEVER licensed asset IDs.
// Only server-owned evidence can clear a blocker; no role is inferred as approved.
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const validSha=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
export function buildMasterBriefRequirements(annex,{assetEvidence={},operationEvidence={}}={}){
 if(!obj(annex)||annex.schema!=='sues-master-film-brief-translation/v1'||
  annex.canExecute!==false||annex.approved!==false||
  annex.translationCoverage?.lostLines!==0||
  annex.instructionCoverage?.unaccountedNonemptyLines?.length!==0||
  !Array.isArray(annex.operationIntents)||!Array.isArray(annex.resourceReferences)||
  !obj(assetEvidence)||!obj(operationEvidence))
  return {status:'BLOCKED',code:'UNTRUSTED_BRIEF_EVIDENCE',approved:false,canExecute:false};
 const grouped=new Map();
 for(const ref of annex.resourceReferences){
  if(!/^([BM]0\d+)$/.test(ref?.resourceHint??''))
   return {status:'BLOCKED',code:'INVALID_BRIEF_RESOURCE_SLOT',approved:false,canExecute:false};
  const slot=ref.resourceHint;
  if(!grouped.has(slot))grouped.set(slot,{slot,kind:slot[0]==='B'?'video':'motion',
   references:[],status:'RESOURCE_EVIDENCE_REQUIRED',issues:[]});
  grouped.get(slot).references.push({operationId:ref.operationId,role:ref.role,sourceLine:ref.sourceLine});
 }
 const resources=[];
 for(const entry of grouped.values()){
  const evidence=assetEvidence[entry.slot];
  // A caller-provided claim never authorizes a resource without a second
  // trusted lookup; the checklist is not the rights verification registry.
  if(evidence!==undefined){
   if(!obj(evidence)||typeof evidence.assetId!=='string'||!validSha(evidence.sha256))
    entry.issues.push('INVALID_ASSET_CANDIDATE');
   else entry.candidate={assetId:evidence.assetId,sha256:evidence.sha256,source:'untrusted-proposal'};
  }
  entry.issues.push('ASSET_ID_AND_SHA_REQUIRE_SERVER_VERIFICATION');
  entry.issues.push('RIGHTS_AND_COMMERCIAL_USE_NOT_VERIFIED');
  entry.issues.push('SOURCE_ORIENTATION_DURATION_AND_PREVIEW_NOT_VERIFIED');
  if(entry.kind==='video')entry.issues.push('BROLL_ENTRY_AND_EXIT_TRANSITIONS_REQUIRE_FRAME_VALIDATION');
  else entry.issues.push('MOTION_COMPOSITION_AND_RENDER_CAPABILITY_NOT_VERIFIED');
  resources.push(entry);
 }
 const intents=annex.operationIntents.map(intent=>{
  const evidence=operationEvidence[intent.id];
  return {id:intent.id,sceneId:intent.sceneId??null,sourceLine:intent.sourceLine,
   track:intent.track,sourceText:intent.detail?.verbatim??intent.detail?.originalInstruction??null,
   status:'REQUIRES_VERIFICATION',issues:[...intent.blockingReasons],
   ...((evidence!==undefined)?{proposedEvidence:evidence}:{}),approved:false,canExecute:false};
 });
 const byTrack={};for(const i of intents)byTrack[i.track]=(byTrack[i.track]??0)+1;
 return {schema:'sues-master-brief-requirements/v1',status:'EVIDENCE_REQUIRED',
  sourceBriefSha256:annex.sourceBriefSha256,sourceSha256:annex.sourceSha256,
  timelineFingerprint:annex.timelineFingerprint,sceneCount:annex.scenes.length,
  shotCount:annex.shotCount,resourceCount:resources.length,intentCount:intents.length,
  sourceLines:annex.allSourceLines.length,unaccountedSourceLines:0,
  byTrack,resources,intents,approved:false,canExecute:false};
}
