import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyPsnrLog,verifyPrivateMasterExport} from '../scripts/motion-templates/verify-hf-master-full-export.mjs';

function log(n,score=46.75){
 return Array.from({length:n},(_,i)=>
  'n:'+(i+1)+' mse_avg:12 psnr_avg:'+score.toFixed(2)).join('\n')+'\n';
}
test('realistic full contiguous frame PSNR evidence proves all requested frames',()=>{
 const first=verifyPsnrLog(log(151),{frames:151,minDb:40,summaryKey:'motion'});
 assert.equal(first.frames,151);
 assert.equal(first.minPsnrDb,46.75);
 assert.match(first.rawLogSha256,/^[0-9a-f]{64}$/);
 const final=verifyPsnrLog(log(149,49.7),{frames:149,minDb:40,summaryKey:'source'});
 assert.equal(final.frames,149);
});
test('does not accept sampled frames, shuffled frames or nonfinite metrics',()=>{
 assert.throws(()=>verifyPsnrLog(log(12),{frames:151,minDb:40,summaryKey:'partial'}),/frame count/);
 const bad=log(151).replace('n:27 ','n:28 ');
 assert.throws(()=>verifyPsnrLog(bad,{frames:151,minDb:40,summaryKey:'shuffled'}),/frame index/);
 const low=log(151).replace('n:120 mse_avg:12 psnr_avg:46.75','n:120 mse_avg:12 psnr_avg:19.00');
 assert.throws(()=>verifyPsnrLog(low,{frames:151,minDb:40,summaryKey:'fidelity'}),/Insufficient fidelity/);
 const corrupt=log(151).replace('n:85 mse_avg:12 psnr_avg:46.75','n:85 mse_avg:12 psnr_avg:NaN');
 assert.throws(()=>verifyPsnrLog(corrupt,{frames:151,minDb:40,summaryKey:'corrupt'}),/missing/);
});
test('full private video proof remains synthetic and does not claim creative approval', {skip:!process.env.SUES_HF_MASTER_QA_DIR},()=>{
 const receipt=verifyPrivateMasterExport(
  process.env.SUES_HF_MASTER_QA_DIR,
  process.env.SUES_HF_MASTER_QA_RENDER_ROOT
 );
 assert.equal(receipt.status,'PRIVATE_SYNTHETIC_300_FRAMES_TECHNICALLY_VERIFIED');
 assert.equal(receipt.canvas.frames,300);
 assert.equal(receipt.hyperframesMotionInterval.frames,151);
 assert.equal(receipt.untouchedOriginalInterval.frames,149);
 assert.equal(receipt.originalSourcePreserved,true);
 assert.equal(receipt.creativeUserApproved,false);
 assert.equal(receipt.realVoiceReviewed,false);
 assert.equal(receipt.publicationAuthorized,false);
 assert.equal(receipt.productionChanged,false);
});
