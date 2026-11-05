import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareMasterHybridNativeHandoff} from '../src/master-director-hybrid-handoff.js';
const source='a'.repeat(64),plan='b'.repeat(64),nativeOutput='c'.repeat(64);
const hybrid=()=>({schema:'sues-master-hybrid-review/v1',
 status:'MIXED_COMPONENTS_STAGED_NOT_RENDERABLE',sourceSha256:source,
 planFingerprint:plan,timelineFingerprint:'timeline-001',durationFrames:360,operationCount:2,
 nativeOperationIds:['native-element'],remotionOperationIds:['remotion-title'],
 crossEngineDependencies:[{from:'native-element',to:'remotion-title',fromEngine:'native',toEngine:'remotion'}],
 crossEngineOverlaps:[{nativeId:'native-element',remotionId:'remotion-title',classification:'visual-stack'}],
 remotionComponent:{schema:'sues-remotion-layers/v1',sourceSha256:source,planFingerprint:plan,
  canvas:{width:1080,height:1920},fps:30,durationFrames:360,
  layers:[{id:'remotion-title',kind:'text',startFrame:40,endFrame:90,text:'Nueva etapa'}]}
});
const nativeChild=()=>({jobId:'11111111-1111-4111-8111-111111111111',
 parentJobId:'22222222-2222-4222-8222-222222222222',planFingerprint:plan,
 originalSourceSha256:source,outputSha256:nativeOutput,editableVersion:true,
 nativeRenderCompleted:true,durationFrames:360,fps:30,width:1080,height:1920,audioPresent:true});
const mediaAudit=()=>({status:'TECHNICAL_PASS_HUMAN_QA_PENDING',sourceSha256:source,
 outputSha256:nativeOutput,fullDecode:true,video:{width:1080,height:1920,fps:'30/1'},audioPresent:true});
test('native child with trusted audit becomes derived Remotion preview source, retaining parent history',()=>{
 const h=hybrid(),n=nativeChild(),a=mediaAudit();const before=JSON.stringify({h,n,a});
 const out=prepareMasterHybridNativeHandoff({hybrid:h,nativeChild:n,mediaAudit:a});
 assert.equal(out.status,'HANDOFF_STAGED_NOT_RENDERED',JSON.stringify(out));
 assert.equal(out.canExecute,false);assert.equal(out.canRender,false);assert.equal(out.final,false);
 assert.equal(out.composition.sourceSha256,nativeOutput);
 assert.equal(out.composition.source.assetId,nativeOutput);
 assert.deepEqual(out.composition.source.spans,[{sourceInFrame:0,startFrame:0,endFrame:360}]);
 assert.equal(out.composition.layers[0].id,'remotion-title');
 assert.equal(out.sourceLineage.originalSourceSha256,source);
 assert.deepEqual(out.sourceLineage.nativeOperationIds,['native-element']);
 assert.deepEqual(out.sourceLineage.remotionOperationIds,['remotion-title']);
 assert.equal(JSON.stringify({h,n,a}),before);
});
test('a failed child audit is never accepted as a hybrid source',()=>{
 const audit=mediaAudit();audit.fullDecode=false;
 assert.equal(prepareMasterHybridNativeHandoff({hybrid:hybrid(),nativeChild:nativeChild(),mediaAudit:audit}).issues[0].code,'HYBRID_NATIVE_MEDIA_AUDIT_REQUIRED');
});
test('parent identity, source binding and version-editability must not be forged',()=>{
 for(const change of [
  n=>n.editableVersion=false,n=>n.originalSourceSha256='f'.repeat(64),
  n=>n.planFingerprint='f'.repeat(64),n=>n.parentJobId=n.jobId,
  n=>n.durationFrames=359,n=>n.audioPresent=false,n=>n.outputSha256=source]){
  const n=nativeChild();change(n);
  assert.equal(prepareMasterHybridNativeHandoff({hybrid:hybrid(),nativeChild:n,mediaAudit:mediaAudit()}).status,'BLOCKED');
 }
});
test('reverse dependency forbids natively composing a future Remotion effect',()=>{
 const h=hybrid();h.crossEngineDependencies=[{from:'remotion-title',to:'native-element',fromEngine:'remotion',toEngine:'native'}];
 assert.equal(prepareMasterHybridNativeHandoff({hybrid:h,nativeChild:nativeChild(),mediaAudit:mediaAudit()}).issues[0].code,'HYBRID_EXECUTION_ORDER_UNSUPPORTED');
});
test('a mask bound to original frames needs new verified source evidence before handoff',()=>{
 const h=hybrid();h.remotionComponent.layers[0].maskAssetId='d'.repeat(64);
 assert.equal(prepareMasterHybridNativeHandoff({hybrid:h,nativeChild:nativeChild(),mediaAudit:mediaAudit()}).issues[0].code,'HYBRID_MASK_NEEDS_DERIVED_SOURCE_PROOF');
});
test('unverified audio cross-engine mixing cannot be labelled preview ready',()=>{
 const h=hybrid();h.crossEngineOverlaps=[{nativeId:'music',remotionId:'sfx',classification:'audio-mix'}];
 assert.equal(prepareMasterHybridNativeHandoff({hybrid:h,nativeChild:nativeChild(),mediaAudit:mediaAudit()}).issues[0].code,'HYBRID_AUDIO_MIX_NOT_VERIFIED');
});
