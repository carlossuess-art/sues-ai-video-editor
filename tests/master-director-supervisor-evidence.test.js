import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync,readdirSync} from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {prepareMasterSupervisorEvidence,openMasterSupervisorEvidence,measureSupervisorStereoWav} from '../src/master-director-supervisor-evidence.js';
function wav(frames=4){const b=Buffer.alloc(44+frames*4);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVE',8);b.write('fmt ',12);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(2,22);b.writeUInt32LE(48000,24);b.writeUInt32LE(192000,28);b.writeUInt16LE(4,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(frames*4,40);return b;}
const sha=b=>createHash('sha256').update(b).digest('hex');
const graph=()=>({schema:'sues-layer-graph/v1',planFingerprint:'a'.repeat(64),fps:30,durationFrames:30,
 nodes:[{id:'op-1',startFrame:2,endFrame:11}]});
test('supervision stores samples bound to plan and exact output, never declares QA pass',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'master-supervisor-'));
 try{
  const media=Buffer.from('preview'),previewPath=join(dir,'video.mp4');writeFileSync(previewPath,media);
  const runner=async(_exe,args)=>{const out=args.at(-1);if(out.endsWith('audio.wav'))writeFileSync(out,wav());
   else for(let i=1;i<=Number(args[args.indexOf('-frames:v')+1]);i++)writeFileSync(out.replace('%04d',String(i).padStart(4,'0')),'png-'+i);};
  const root=join(dir,'evidence'),g=graph(),result=await prepareMasterSupervisorEvidence({graph:g,previewPath,root,outputSha256:sha(media),approvalCheck:async()=>true,runner});
  assert.equal(result.status,'SAMPLES_REQUIRE_REVIEW');assert.equal(result.final,false);
  assert.deepEqual(result.report.audioEvidence,{encoding:'pcm-s16le',sampleRate:48000,channels:2,sourceDownmixPossible:true,notOriginalBytes:true});
  assert.deepEqual(result.report.samples.map(x=>x.frame),[0,2,6,10,29]);assert.ok(result.report.limitations.includes('not-qa-pass'));
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
  assert.equal(result.status,'SAMPLES_REQUIRE_REVIEW',JSON.stringify(result.issues));assert.equal(result.report.samples.length,5);assert.equal(result.report.files.length,6);
  assert.equal(openMasterSupervisorEvidence({root:join(dir,'evidence'),inspectionId:result.inspectionId,file:'audio.wav',planFingerprint:g.planFingerprint,outputSha256:digest}).mime,'audio/wav');
 }finally{rmSync(dir,{recursive:true,force:true});}
});


test('supervisor audio retains opposing stereo channels instead of cancelling them',{skip:spawnSync('ffmpeg',['-version'],{stdio:'ignore'}).status!==0,timeout:60000},async()=>{
 const dir=mkdtempSync(join(tmpdir(),'master-stereo-'));try{
  const previewPath=join(dir,'video.mp4');
  execFileSync('ffmpeg',['-y','-v','error','-f','lavfi','-i','testsrc2=size=100x100:rate=30:duration=1',
   '-f','lavfi','-i','aevalsrc=0.4*sin(2*PI*440*t)|-0.4*sin(2*PI*440*t):s=48000:d=1',
   '-c:v','libx264','-threads','1','-pix_fmt','yuv420p','-c:a','aac','-shortest',previewPath]);
  const {readFileSync}=await import('node:fs'),digest=sha(readFileSync(previewPath)),g=graph(),root=join(dir,'evidence');
  const result=await prepareMasterSupervisorEvidence({graph:g,previewPath,root,outputSha256:digest,approvalCheck:async()=>true});
  assert.equal(result.status,'SAMPLES_REQUIRE_REVIEW');
  const wav=openMasterSupervisorEvidence({root,inspectionId:result.inspectionId,file:'audio.wav',planFingerprint:g.planFingerprint,outputSha256:digest});
  const raw=execFileSync('ffmpeg',['-v','error','-i',wav.path,'-f','s16le','-acodec','pcm_s16le','-']);
  let l=0,r=0,cross=0;for(let i=0;i+3<raw.length;i+=4){const a=raw.readInt16LE(i),b=raw.readInt16LE(i+2);l+=a*a;r+=b*b;cross+=a*b;}
  assert.ok(l>1e9&&r>1e9);assert.ok(cross/Math.sqrt(l*r)<-.95);
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('stereo evidence accommodates the full 120-second bound without a silent size regression',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'master-supervisor-limit-'));try{
  const media=Buffer.from('preview'),previewPath=join(dir,'video.mp4');writeFileSync(previewPath,media);
  const g=graph();g.durationFrames=3600;
  const runner=async(_exe,args)=>{const out=args.at(-1);if(out.endsWith('audio.wav'))writeFileSync(out,wav(48000*120));
   else for(let i=1;i<=Number(args[args.indexOf('-frames:v')+1]);i++)writeFileSync(out.replace('%04d',String(i).padStart(4,'0')),'png-'+i);};
  const result=await prepareMasterSupervisorEvidence({graph:g,previewPath,root:join(dir,'evidence'),outputSha256:sha(media),approvalCheck:async()=>true,runner});
  assert.equal(result.status,'SAMPLES_REQUIRE_REVIEW');assert.ok(result.report.files.find(x=>x.name==='audio.wav').bytes>12*1024*1024);
 }finally{rmSync(dir,{recursive:true,force:true});}
});


test('stereo measurements preserve channel peaks and reject truncated or unsupported audio',()=>{
 const b=wav(2);b.writeInt16LE(32767,44);b.writeInt16LE(-32768,46);b.writeInt16LE(0,48);b.writeInt16LE(16384,50);
 const m=measureSupervisorStereoWav(b);assert.equal(m.frames,2);assert.deepEqual(m.clippingSamples,[1,1]);assert.equal(m.notQualityJudgment,true);
 assert.ok(m.seconds[0].rms[1]>m.seconds[0].rms[0]);assert.throws(()=>measureSupervisorStereoWav(b.subarray(0,47)),/WAV/);
 const mono=Buffer.from(b);mono.writeUInt16LE(1,22);assert.throws(()=>measureSupervisorStereoWav(mono),/WAV/);
});