import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,readdirSync} from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {prepareMasterMaskCandidate,openMasterMaskCandidate} from '../src/master-director-mask-candidate.js';
const sha=b=>createHash('sha256').update(b).digest('hex');
const fixture=(dir,bytes)=>{
 const source=join(dir,'source.mp4');writeFileSync(source,bytes);const hash=sha(bytes),visual={rect:{x:0,y:0,width:1080,height:1920}};
 const graph={schema:'sues-layer-graph/v1',sourceSha256:hash,planFingerprint:'b'.repeat(64),timelineFingerprint:'timeline-1',fps:30,durationFrames:3,nodes:[{id:'layer-1',renderer:'remotion',startFrame:0,endFrame:3,visual}]};
 return {graph,project:{sourcePath:source,boundHashes:{source:hash},inputs:{source:{width:1080,height:1920}}},
  composition:{schema:'sues-remotion-layers/v1',sourceSha256:hash,fps:30,durationFrames:3,canvas:{width:1080,height:1920},source:{assetId:hash,spans:[{sourceInFrame:0,startFrame:0,endFrame:3}]}}};
};
const fakeRunner=async(exe,args)=>{
 if(exe==='ffmpeg'){const pattern=args.at(-1);for(let i=0;i<3;i++)writeFileSync(pattern.replace('%06d',String(i).padStart(6,'0')),'input-'+i);return;}
 const val=k=>args[args.indexOf(k)+1],input=val('--input-dir'),out=val('--output-dir');mkdirSync(out);
 const frames=[];for(let i=0;i<3;i++){const name='mask-'+String(i).padStart(6,'0')+'.png',bytes=Buffer.from('mask-'+i);writeFileSync(join(out,name),bytes);
  frames.push({editFrame:i,file:name,sha256:sha(bytes),inputSha256:sha(readFileSync(join(input,'frame-'+String(i).padStart(6,'0')+'.png')))});}
 writeFileSync(join(out,'candidate.json'),JSON.stringify({schema:'sues-mask-candidate/v1',status:'CANDIDATE_NOT_VERIFIED',
  sourceSha256Claim:val('--source-sha256'),timelineFingerprintClaim:val('--timeline-fingerprint'),mode:val('--mode'),
  fps:30,coordinateSpace:'layer',rect:[0,0,1080,1920],model:'fixture',modelSha256:'c'.repeat(64),frames}));
};
test('candidate generation maps source frames and never approves the mask',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'master-mask-candidate-'));
 try{const f=fixture(dir,Buffer.from('source')),root=join(dir,'candidates');
  const pythonPath=join(dir,'python'),scriptPath=join(dir,'worker');writeFileSync(pythonPath,'python');writeFileSync(scriptPath,'script');
  const args={...f,operationId:'layer-1',mode:'keep-background',root,pythonPath,pythonSha256:sha(readFileSync(pythonPath)),scriptPath,scriptSha256:sha(readFileSync(scriptPath)),modelSha256:'c'.repeat(64),approvalCheck:async()=>true,runner:fakeRunner};
  const result=await prepareMasterMaskCandidate(args);assert.equal(result.status,'CANDIDATE_NOT_VERIFIED');assert.equal(result.verified,false);assert.equal(result.manifest.frames.length,3);
  const request={root,candidateId:result.candidateId,file:'mask-000000.png',planFingerprint:f.graph.planFingerprint,sourceSha256:f.graph.sourceSha256};
  assert.equal(openMasterMaskCandidate(request).mime,'image/png');assert.throws(()=>openMasterMaskCandidate({...request,planFingerprint:'d'.repeat(64)}),/another plan/);
  writeFileSync(join(root,result.candidateId,'masks','mask-000000.png'),'modified');assert.throws(()=>openMasterMaskCandidate(request),/integrity/);
  assert.equal((await prepareMasterMaskCandidate({...args,pythonSha256:'0'.repeat(64)})).status,'BLOCKED');
  assert.equal((await prepareMasterMaskCandidate({...args,modelSha256:'0'.repeat(64)})).status,'BLOCKED');
  let calls=0;const blocked=await prepareMasterMaskCandidate({...args,approvalCheck:async()=>++calls===1});assert.equal(blocked.status,'BLOCKED');assert.equal(readdirSync(root).length,1);
  f.composition.source.spans=[{sourceInFrame:0,startFrame:0,endFrame:1},{sourceInFrame:0,startFrame:1,endFrame:3}];
  assert.equal((await prepareMasterMaskCandidate(args)).issues[0].code,'MASK_CANDIDATE_TIMEMAP_UNSUPPORTED');
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('real local model and FFmpeg generate an unverified synthetic candidate',{skip:!process.env.SUES_MASK_PYTHON||!process.env.SUES_MASK_MODEL||spawnSync('ffmpeg',['-version'],{stdio:'ignore'}).status!==0,timeout:90000},async()=>{
 const dir=mkdtempSync(join(tmpdir(),'master-mask-real-'));
 try{
  const video=join(dir,'video.mp4');execFileSync('ffmpeg',['-y','-v','error','-f','lavfi','-i','color=c=red:s=1080x1920:r=30:d=0.1','-frames:v','3','-c:v','libx264','-threads','1','-pix_fmt','yuv420p',video]);
  const f=fixture(dir,readFileSync(video));
  const scriptPath=fileURLToPath(new URL('../scripts/master-director/generate-mask-candidates.py',import.meta.url));
  const result=await prepareMasterMaskCandidate({...f,operationId:'layer-1',mode:'keep-background',root:join(dir,'candidates'),
   pythonPath:process.env.SUES_MASK_PYTHON,pythonSha256:sha(readFileSync(process.env.SUES_MASK_PYTHON)),scriptPath,scriptSha256:sha(readFileSync(scriptPath)),modelSha256:sha(readFileSync(process.env.SUES_MASK_MODEL)),approvalCheck:async()=>true});
  assert.equal(result.status,'CANDIDATE_NOT_VERIFIED',JSON.stringify(result.issues));assert.equal(result.manifest.frames.length,3);assert.equal(result.verified,false);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
