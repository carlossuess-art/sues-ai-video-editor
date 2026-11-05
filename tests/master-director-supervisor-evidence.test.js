import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync,readdirSync} from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {prepareMasterSupervisorEvidence,openMasterSupervisorEvidence} from '../src/master-director-supervisor-evidence.js';
const sha=b=>createHash('sha256').update(b).digest('hex');
const graph=()=>({schema:'sues-layer-graph/v1',planFingerprint:'a'.repeat(64),fps:30,durationFrames:30,
 nodes:[{id:'op-1',startFrame:2,endFrame:11}]});
test('supervision stores samples bound to plan and exact output, never declares QA pass',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'master-supervisor-'));
 try{
  const media=Buffer.from('preview'),previewPath=join(dir,'video.mp4');writeFileSync(previewPath,media);
  const runner=async(_exe,args)=>{const out=args.at(-1);if(out.endsWith('audio.wav'))writeFileSync(out,'wav');
   else for(let i=1;i<=3;i++)writeFileSync(out.replace('%04d',String(i).padStart(4,'0')),'png-'+i);};
  const root=join(dir,'evidence'),g=graph(),result=await prepareMasterSupervisorEvidence({graph:g,previewPath,root,outputSha256:sha(media),approvalCheck:async()=>true,runner});
  assert.equal(result.status,'SAMPLES_REQUIRE_REVIEW');assert.equal(result.final,false);
  assert.deepEqual(result.report.samples.map(x=>x.frame),[2,6,10]);assert.ok(result.report.limitations.includes('not-qa-pass'));
  const request={root,inspectionId:result.inspectionId,file:'frame-0001.png',planFingerprint:g.planFingerprint,outputSha256:sha(media)};
  assert.equal(openMasterSupervisorEvidence(request).mime,'image/png');
  assert.throws(()=>openMasterSupervisorEvidence({...request,outputSha256:'b'.repeat(64)}),/another output/);
  writeFileSync(join(root,result.inspectionId,'frame-0001.png'),'altered');
  assert.throws(()=>openMasterSupervisorEvidence(request),/integrity/);
  const denied=await prepareMasterSupervisorEvidence({graph:g,previewPath,root,outputSha256:sha(media),approvalCheck:async()=>false,runner});
  assert.equal(denied.status,'BLOCKED');assert.equal(readdirSync(root).length,1);
  let checks=0;const stale=await prepareMasterSupervisorEvidence({graph:g,previewPath,root,outputSha256:sha(media),approvalCheck:async()=>++checks===1,runner});
  assert.equal(stale.status,'BLOCKED');assert.equal(readdirSync(root).length,1);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('actual FFmpeg extracts source-bound evidence from a synthetic video',{skip:spawnSync('ffmpeg',['-version'],{stdio:'ignore'}).status!==0,timeout:60000},async()=>{
 const dir=mkdtempSync(join(tmpdir(),'master-supervisor-real-'));
 try{
  const previewPath=join(dir,'video.mp4');
  execFileSync('ffmpeg',['-y','-v','error','-f','lavfi','-i','testsrc2=size=100x100:rate=30:duration=1',
   '-f','lavfi','-i','sine=frequency=440:sample_rate=16000:duration=1','-c:v','libx264','-threads','1','-pix_fmt','yuv420p','-c:a','aac','-shortest',previewPath]);
  const {readFileSync}=await import('node:fs'),digest=sha(readFileSync(previewPath)),g=graph();
  const result=await prepareMasterSupervisorEvidence({graph:g,previewPath,root:join(dir,'evidence'),outputSha256:digest,approvalCheck:async()=>true});
  assert.equal(result.status,'SAMPLES_REQUIRE_REVIEW',JSON.stringify(result.issues));assert.equal(result.report.samples.length,3);assert.equal(result.report.files.length,4);
  assert.equal(openMasterSupervisorEvidence({root:join(dir,'evidence'),inspectionId:result.inspectionId,file:'audio.wav',planFingerprint:g.planFingerprint,outputSha256:digest}).mime,'audio/wav');
 }finally{rmSync(dir,{recursive:true,force:true});}
});
