// Immutable, server-side only handoff contract: native editable child -> Remotion preview.
// This is NOT a publication, final export, automatic activation or user approval.
// The caller must obtain nativeChild and mediaAudit from authenticated server code,
// never from a browser request. Evidence must be rechecked before/after rendering.
const SHA=/^[a-f0-9]{64}$/, ID=/^[a-f0-9-]{36}$/;
const denied=(code)=>({status:'BLOCKED',canRender:false,canExecute:false,issues:[{code}],composition:null});

export function prepareMasterHybridNativeHandoff({hybrid,nativeChild,mediaAudit}={}){
 if(hybrid?.schema!=='sues-master-hybrid-review/v1'||hybrid.status!=='MIXED_COMPONENTS_STAGED_NOT_RENDERABLE'||
    !Array.isArray(hybrid.nativeOperationIds)||!hybrid.nativeOperationIds.length||
    !Array.isArray(hybrid.remotionOperationIds)||!hybrid.remotionOperationIds.length||
    hybrid.nativeOperationIds.length+hybrid.remotionOperationIds.length!==hybrid.operationCount||
    !Array.isArray(hybrid.remotionComponent?.layers)||
    hybrid.remotionComponent.layers.length!==hybrid.remotionOperationIds.length||
    hybrid.remotionComponent.planFingerprint!==hybrid.planFingerprint||
    hybrid.remotionComponent.sourceSha256!==hybrid.sourceSha256)
  return denied('HYBRID_REVIEW_INVALID');
 if(hybrid.crossEngineDependencies?.some(d=>d.fromEngine==='remotion'&&d.toEngine==='native'))
  return denied('HYBRID_EXECUTION_ORDER_UNSUPPORTED');
 if(hybrid.crossEngineOverlaps?.some(x=>x.classification==='visual-order-unresolved'))
  return denied('HYBRID_VISUAL_ORDER_UNVERIFIED');
 if(hybrid.crossEngineOverlaps?.some(x=>x.classification==='audio-mix'))
  return denied('HYBRID_AUDIO_MIX_NOT_VERIFIED');
 if(hybrid.remotionComponent.layers.some(l=>l.maskAssetId||l.maskFrameAssetIds?.length))
  return denied('HYBRID_MASK_NEEDS_DERIVED_SOURCE_PROOF');
 if(!nativeChild||!ID.test(nativeChild.jobId??'')||!ID.test(nativeChild.parentJobId??'')||
    nativeChild.jobId===nativeChild.parentJobId||
    nativeChild.planFingerprint!==hybrid.planFingerprint||
    nativeChild.originalSourceSha256!==hybrid.sourceSha256||
    !SHA.test(nativeChild.outputSha256??'')||nativeChild.outputSha256===hybrid.sourceSha256||
    nativeChild.editableVersion!==true||nativeChild.nativeRenderCompleted!==true||
    nativeChild.durationFrames!==hybrid.durationFrames||nativeChild.fps!==30||
    nativeChild.width!==1080||nativeChild.height!==1920||nativeChild.audioPresent!==true)
  return denied('HYBRID_NATIVE_CHILD_UNVERIFIED');
 if(mediaAudit?.status!=='TECHNICAL_PASS_HUMAN_QA_PENDING'||mediaAudit.outputSha256!==nativeChild.outputSha256||
    mediaAudit.sourceSha256!==hybrid.sourceSha256||mediaAudit.fullDecode!==true||
    mediaAudit.video?.width!==1080||mediaAudit.video?.height!==1920||
    mediaAudit.video?.fps!=='30/1'||mediaAudit.audioPresent!==true)
  return denied('HYBRID_NATIVE_MEDIA_AUDIT_REQUIRED');
 const derived=nativeChild.outputSha256,composition={...structuredClone(hybrid.remotionComponent),
  sourceSha256:derived,
  source:{assetId:derived,fit:'fill',audio:true,spans:[{sourceInFrame:0,startFrame:0,endFrame:hybrid.durationFrames}]}};
 return {schema:'sues-master-hybrid-handoff/v1',status:'HANDOFF_STAGED_NOT_RENDERED',
  canExecute:false,canRender:false,final:false,issues:[],
  sourceLineage:{approvedPlanFingerprint:hybrid.planFingerprint,
   originalSourceSha256:hybrid.sourceSha256,nativeChildJobId:nativeChild.jobId,
   nativeParentJobId:nativeChild.parentJobId,nativeOutputSha256:derived,
   remotionOperationIds:structuredClone(hybrid.remotionOperationIds),
   nativeOperationIds:structuredClone(hybrid.nativeOperationIds)},
  composition,
  requiredChecks:['revalidate-parent-approval','revalidate-native-child-hash','revalidate-media-audit',
   'verify-browser-runtime','render-private-preview','independent-technical-audit',
   'validate-both-editable-versions','two-audiovisual-audits','user-creative-approval']};
}