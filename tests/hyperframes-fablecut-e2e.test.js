import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validatePrivateE2EReports,verifyPrivateE2E} from '../scripts/motion-templates/verify-hyperframes-fablecut-e2e.mjs';
const sha1='1'.repeat(64),sha2='2'.repeat(64),source='3'.repeat(64);
const times=[0,.267,.467,.9,1.2,1.7,2.2,2.7,3.1,3.5,4.1,4.8];
function fixtures(){
 const hf={schema:'sues-hyperframes-native-media-proof/v1',status:'TECHNICAL_RENDER_AND_FRAME_ALIGNMENT_VERIFIED',
  sourceFingerprint:source,renderedFile:{sha256:sha1,width:1080,height:1920,frames:151,fps:30,audioStreams:0},
  productionChanged:false,publishAuthorized:false};
 const intake={schema:'sues-fablecut-hyperframes-private-intake/v1',state:'ISOLATED_NATIVE_MEDIA_IMPORTED_IN_QA_ONLY',
  sourceFingerprint:source,nativeMp4Sha256:sha1,projectRevision:2,clipId:'clipA',mediaId:'mA',
  productionChanged:false,publicationAuthorized:false};
 const render={schema:'sues-hyperframes-to-fablecut-private-export/v1',status:'PRIVATE_HYPERFRAMES_FABLECUT_EXPORT_TECHNICALLY_RENDERED',
  sourceFingerprint:source,hyperframesNativeSha256:sha1,fablecutExportSha256:sha2,
  productionChanged:false,publicationAuthorized:false};
 const comparison={schema:'sues-hf-fablecut-private-frame-comparison/v1',
  results:times.map(timeSec=>({timeSec,psnrDb:39.8,highDeltaFraction:.00002}))};
 const doc={clips:[{id:'clipA',mediaId:'mA',kind:'video'}],media:[{id:'mA'}],
  revision:2,width:1080,height:1920,fps:30};
 const metadata={format:{duration:'5.033333'},streams:[{
  codec_type:'video',codec_name:'h264',pix_fmt:'yuv420p',width:1080,height:1920,
  nb_frames:'151',r_frame_rate:'30/1',avg_frame_rate:'30/1'
 }]};
 return {hf,intake,render,comparison,doc,metadata};
}
test('separates native HyperFrames input and FableCut export while preserving ownership',()=>{
 const v=validatePrivateE2EReports(fixtures());
 assert.equal(v.minPsnrDb,39.8);
 assert.equal(v.frames,151);
 assert.equal(v.nativeHyperFramesSha256,sha1);
 assert.equal(v.fablecutExportSha256,sha2);
 assert.equal(v.silent,true);
});
test('source hash, original SHA or modified project revision blocks e2e acceptance',()=>{
 const p=fixtures();p.intake.sourceFingerprint='4'.repeat(64);
 assert.throws(()=>validatePrivateE2EReports(p),/fingerprint/);
 const q=fixtures();q.render.hyperframesNativeSha256='4'.repeat(64);
 assert.throws(()=>validatePrivateE2EReports(q),/SHA changed/);
 const r=fixtures();r.doc.revision=9;
 assert.throws(()=>validatePrivateE2EReports(r),/revision changed/);
});
test('rejects bad frames, encoders, sound, large changes and fake publication',()=>{
 const p=fixtures();p.metadata.streams[0].nb_frames='150';
 assert.throws(()=>validatePrivateE2EReports(p),/frame count drift/);
 const q=fixtures();q.comparison.results[2].psnrDb=29.7;
 assert.throws(()=>validatePrivateE2EReports(q),/comparison below/);
 const r=fixtures();r.metadata.streams.push({codec_type:'audio'});
 assert.throws(()=>validatePrivateE2EReports(r),/no audio/);
 const s=fixtures();s.render.publicationAuthorized=true;
 assert.throws(()=>validatePrivateE2EReports(s),/publish-authorized/);
});
test('private E2E proof cannot silently claim real Reel completion', {skip:!process.env.SUES_FABLECUT_QA_DIR},()=>{
 const result=verifyPrivateE2E(process.env.SUES_FABLECUT_QA_DIR,process.env.SUES_HF_NATIVE_PROOF);
 assert.equal(result.status,'ISOLATED_NATIVE_HF_TO_FABLECUT_EXPORT_TECHNICALLY_VERIFIED');
 assert.equal(result.frames,151);
 assert.ok(result.minPsnrDb>39);
 assert.equal(result.sourceAnimationOwner,'HyperFrames');
 assert.equal(result.editorialOwner,'FableCut');
 assert.equal(result.exportedVideoInternalMotionEditable,false);
 assert.equal(result.twoPassQACompleted,false);
 assert.equal(result.productionChanged,false);
 assert.equal(result.publicationAuthorized,false);
});
