import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {proposeMasterVfrSourceVersion} from '../src/master-director-vfr-version.js';
const hash=x=>createHash('sha256').update(x).digest('hex');
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;
function fixture(){
 const dir=mkdtempSync(join(tmpdir(),'sues-vfr-version-'));
 const paths={originalPath:join(dir,'original.video'),derivedPath:join(dir,'derived.mp4'),
  visualPath:join(dir,'visual.json'),audioPath:join(dir,'audio.json'),cfrPath:join(dir,'cfr.json')};
 writeFileSync(paths.originalPath,'original-data');writeFileSync(paths.derivedPath,'derived-data');
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
 for(const [k,value] of [['visual',visual],['audio',audio],['cfr',cfr]])
  writeFileSync(paths[k+'Path'],JSON.stringify(value));
 const projectConfig={title:'Reel de prueba',sourcePath:paths.originalPath,
  transcriptPath:'/other/transcript.json',
  source:{sha256:originalSha256,duration:.18,width:1080,height:1920}};
 return {dir,paths,projectConfig,visual};
}
test('phase 2: derivative proposes a separate version without inheriting plan approval',()=>{
 const f=fixture();
 try{
  const old=structuredClone(f.projectConfig);
  const proposed=proposeMasterVfrSourceVersion({...f.paths,projectConfig:f.projectConfig});
  assert.equal(proposed.status,'SOURCE_VERSION_PROPOSED_NEW_APPROVAL_REQUIRED',JSON.stringify(proposed));
  assert.equal(proposed.canExecute,false);assert.equal(proposed.approvalsInvalidated,true);
  assert.equal(proposed.projectConfig.source.sha256,hash(readFileSync(f.paths.derivedPath)));
  assert.equal(proposed.projectConfig.source.duration,.2);
  assert.equal(proposed.projectConfig.sourceLineage.approvalInherited,false);
  assert.equal(proposed.projectConfig.transcriptPath,old.transcriptPath);
  assert.deepEqual(f.projectConfig,old);
  assert.equal(proposed.proposalFingerprint.length,64);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('phase 2: mismatch, evidence mutation and significant retiming fail closed',()=>{
 const f=fixture();
 try{
  assert.equal(proposeMasterVfrSourceVersion({...f.paths,projectConfig:{...f.projectConfig,source:{...f.projectConfig.source,sha256:'0'.repeat(64)}}}).status,'BLOCKED');
  assert.equal(proposeMasterVfrSourceVersion({...f.paths,projectConfig:{...f.projectConfig,source:{...f.projectConfig.source,duration:.08}}}).issues[0].code,'VFR_VERSION_RETIME_REQUIRED');
  writeFileSync(f.paths.derivedPath,'forged bytes');
  assert.equal(proposeMasterVfrSourceVersion({...f.paths,projectConfig:f.projectConfig}).status,'BLOCKED');
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
