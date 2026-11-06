import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {reviewMasterVfrDerivationEvidence} from '../src/master-director-vfr-lineage.js';
const hash=x=>createHash('sha256').update(x).digest('hex');
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;
function setup(){
 const dir=mkdtempSync(join(tmpdir(),'sues-vfr-lineage-test-'));
 const paths={originalPath:join(dir,'original.video'),derivedPath:join(dir,'derived.mp4'),visualPath:join(dir,'visual.json'),audioPath:join(dir,'audio.json'),cfrPath:join(dir,'cfr.json')};
 writeFileSync(paths.originalPath,'read-only-origin-fixture');writeFileSync(paths.derivedPath,'separate-derived-fixture');
 const originalSha256=hash(readFileSync(paths.originalPath)),derivedSha256=hash(readFileSync(paths.derivedPath));
 const visual={schema:'sues-vfr-derived-evidence/v1',approved:false,creativeAccepted:false,originalSha256,derivedSha256,
  status:'FRAME_CORRESPONDENCE_PASS_LOW_RES_NOT_APPROVAL',sourceFrames:5,targetFrames:6,
  mapping:[0,0,1,2,3,4],meanSampledPixelError:.2,maxSampledPixelError:.3,
  maxTemporalOffsetMs:42,monotone:true,downscaledWidth:54,downscaledHeight:96,pixelStride:16};
 visual.evidenceFingerprint=hash(JSON.stringify(stable(visual)));
 const audio={status:'SIGNAL_TIMING_PASS_NOT_LISTENING',sampleRate:8000,sourceSamples:589995,derivedSamples:589995,
  windows:[5,34,65].map(atSecond=>({atSecond,correlation:.999,lagMs:0}))};
 const cfr={schema:'sues-vfr-derived-cfr-probe/v1',status:'SOURCE_CFR30_VERIFIED',sourceTiming:'cfr30-verified',
  sourceHasAudio:true,humanReview:false,derivedSha256,frameCount:6,sourceDuration:.2,width:1080,height:1920};
 for(const [n,obj] of [['visual',visual],['audio',audio],['cfr',cfr]])writeFileSync(paths[n+'Path'],JSON.stringify(obj));
 return {dir,paths,visual,audio,cfr};
}
test('VFR provenance evidence is review-only, not permission to execute',()=>{
 const f=setup();try{const v=reviewMasterVfrDerivationEvidence(f.paths);
  assert.equal(v.status,'DERIVATION_EVIDENCE_READY_REVIEW_REQUIRED');assert.equal(v.canExecute,false);
  assert.ok(v.requires.includes('EXTERNAL_PLAN_REVIEW_AND_NEW_APPROVAL'));
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('VFR provenance blocks changed derivative and tampered manifest',()=>{
 const f=setup();try{
  writeFileSync(f.paths.derivedPath,'other bytes');
  assert.equal(reviewMasterVfrDerivationEvidence(f.paths).status,'BLOCKED');
  writeFileSync(f.paths.derivedPath,'separate-derived-fixture');
  const altered={...f.visual,mapping:[0,4,1,2,3,4]};
  writeFileSync(f.paths.visualPath,JSON.stringify(altered));
  assert.equal(reviewMasterVfrDerivationEvidence(f.paths).status,'BLOCKED');
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('VFR provenance blocks inconsistent audio evidence and CFR count',()=>{
 const f=setup();try{
  writeFileSync(f.paths.audioPath,JSON.stringify({...f.audio,windows:[5,34,65].map(atSecond=>({atSecond,correlation:.1,lagMs:0}))}));
  assert.equal(reviewMasterVfrDerivationEvidence(f.paths).status,'BLOCKED');
  writeFileSync(f.paths.audioPath,JSON.stringify(f.audio));
  writeFileSync(f.paths.cfrPath,JSON.stringify({...f.cfr,frameCount:5}));
  assert.equal(reviewMasterVfrDerivationEvidence(f.paths).status,'BLOCKED');
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
