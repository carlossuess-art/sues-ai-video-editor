import test from 'node:test';
import assert from 'node:assert/strict';
import {buildHyperFramesMotionHandoff,inspectNativeRenderEvidence,REQUIRED_SOURCE_FILES} from '../src/motion-templates/hyperframes-motion-handoff.js';
const fileHashes=Object.fromEntries(REQUIRED_SOURCE_FILES.map((path,i)=>[path,String(i+1).repeat(64)]));
const packet=()=>buildHyperFramesMotionHandoff({sourceHashes:fileHashes});
test('HyperFrames owns animation; FableCut owns assembly, not the internal geometry',()=>{
 const p=packet();
 assert.equal(p.owner.animation,'HyperFrames');
 assert.equal(p.owner.editorial,'FableCut');
 assert.equal(p.timeline.frames,151);
 assert.equal(p.timeline.width,1080);
 assert.equal(p.timeline.height,1920);
 assert.equal(p.editorial.editable.geometry,'HYPERFRAMES_SOURCE');
 assert.equal(p.editorial.editable.afterExportInternalWordEffects,'NOT_EDITABLE_AS_FABLECUT_MEDIA');
 assert.equal(p.editorial.compositing,'FULL_FRAME_ONLY_UNTIL_ALPHA_AND_BACKGROUND_ARE_VERIFIED');
 assert.equal(p.gates.canImportToProduction,false);
 assert.equal(p.gates.canPublish,false);
 assert.equal(p.render.nativeHyperFramesVideo,null);
});
test('source fingerprint binds content hashes to ordered source paths',()=>{
 const a=packet(),b=buildHyperFramesMotionHandoff({sourceHashes:{...fileHashes,'runtime/sequence-card-to-space.js':'4'.repeat(64)}});
 assert.notEqual(a.source.fingerprint,b.source.fingerprint);
 assert.equal(a.source.files.length,3);
 assert.equal(a.source.files[0].path,'index.html');
 assert.deepEqual(a.render.frameChecks,[0,7,8,12,19,26,51,59,64,69,81,91,104,112,119,150]);
});
test('synthetic demonstration cannot silently acquire fake voice/approval IDs',()=>{
 assert.throws(()=>buildHyperFramesMotionHandoff({sourceHashes:fileHashes,transcriptSha256:'2'.repeat(64)}),/cannot pretend/);
 assert.throws(()=>buildHyperFramesMotionHandoff({sourceHashes:fileHashes,mode:'REVIEWED_SPEECH',selectedWordIds:['w1']}),/transcript fingerprint/);
 assert.throws(()=>buildHyperFramesMotionHandoff({sourceHashes:fileHashes,mode:'REVIEWED_SPEECH',transcriptSha256:'1'.repeat(64),selectedWordIds:['a','a'],approvedPlanFingerprint:'fingerprint-1234'}),/distinct/);
 assert.throws(()=>buildHyperFramesMotionHandoff({sourceHashes:fileHashes,'bad.js':'4'.repeat(64)}),/exactly/);
});
test('native rendered metadata can be inspected but never counts as native FableCut ingest',()=>{
 const p=packet(),e={renderer:'HyperFrames',kind:'NATIVE_HYPERFRAMES_RENDER',
  sourceFingerprint:p.source.fingerprint,outputSha256:'a'.repeat(64),
  width:1080,height:1920,fps:30,frames:151,filePath:'private/motion.mp4',proofPath:'private/render-proof.json'};
 const result=inspectNativeRenderEvidence(p,e);
 assert.equal(result.status,'METADATA_MATCH_ONLY_NOT_INTEGRATED');
 assert.equal(result.fablecutIngestApproved,false);
 assert.equal(result.exactMediaHashRecheckRequired,true);
 assert.equal(result.productionChanged,false);
});
test('SVG proxy or mismatching media is rejected, not mislabeled as HyperFrames',()=>{
 const p=packet(),e={renderer:'SVG_PROXY',kind:'SVG_PROXY_NOT_HYPERFRAMES',
  sourceFingerprint:p.source.fingerprint,outputSha256:'a'.repeat(64),
  width:540,height:960,fps:30,frames:151,filePath:'proxy.mp4',proofPath:'proxy-evidence.json'};
 assert.throws(()=>inspectNativeRenderEvidence(p,e),/must not be promoted/);
 assert.throws(()=>inspectNativeRenderEvidence(p,{...e,renderer:'HyperFrames',kind:'NATIVE_HYPERFRAMES_RENDER'}),/mismatch/);
 assert.throws(()=>inspectNativeRenderEvidence(p,{...e,renderer:'HyperFrames',kind:'NATIVE_HYPERFRAMES_RENDER',width:1080,height:1920,sourceFingerprint:'0'.repeat(64)}),/source changed/);
});
