#!/usr/bin/env node
/**
 * SUES HyperFrames / native MP4 evidence verifier (read-only until writing its
 * NEW, immutable QA receipt). Not a Reel plan, import action or publish action.
 *
 * node verify-hyperframes-native-render.mjs \
 *   PROJECT_DIR SOURCE_MANIFEST.json NATIVE_HF_RENDER.mp4 NEW_PRIVATE_RECEIPT.json \
 *   PIXEL_COMPARISON.json RENDER_STDERR.log
 *
 * All supplied paths must already exist except NEW_PRIVATE_RECEIPT.json.
 * A native render still requires human full playback and creative approval.
 */
import {readFileSync,writeFileSync,realpathSync,statSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {buildHyperFramesMotionHandoff,inspectNativeRenderEvidence,REQUIRED_SOURCE_FILES} from '../../src/motion-templates/hyperframes-motion-handoff.js';

const sha=buffer=>createHash('sha256').update(buffer).digest('hex');
const fail=(condition,message)=>{if(!condition)throw new Error(message);};
const fpsOf=v=>{
 if(typeof v!=='string'||!/^([1-9]\d*)(?:\/([1-9]\d*))?$/.test(v))return NaN;
 const [n,d='1']=v.split('/');return Number(n)/Number(d);
};
const readJson=file=>JSON.parse(readFileSync(file,'utf8'));
const maxMediaBytes=128*1024*1024;
const requiredVendor=[
 'vendor/gsap.min.js',
 'vendor/Montserrat-Bold.ttf',
 'vendor/Montserrat-ExtraBold.ttf'
];
const compareTimes=[0,.267,.467,.9,1.2,1.7,2.2,2.7,3.1,3.5,4.1,4.8];

export function validateNativeProbe(probe,expected){
 fail(probe&&Array.isArray(probe.streams)&&probe.format,'Malformed ffprobe output');
 const video=probe.streams.filter(s=>s.codec_type==='video');
 const audio=probe.streams.filter(s=>s.codec_type==='audio');
 fail(video.length===1&&audio.length===0,'Expected one H264 video track and NO synthetic audio');
 const v=video[0];
 fail(v.codec_name==='h264'&&v.pix_fmt==='yuv420p','Unexpected native video codec/pixel format');
 fail(v.width===expected.width&&v.height===expected.height,'Native dimensions do not match HyperFrames source');
 fail(fpsOf(v.r_frame_rate)===expected.fps&&fpsOf(v.avg_frame_rate)===expected.fps,'Native frame rate mismatch');
 fail(Number(v.nb_frames)===expected.frames,'Native frame count mismatch');
 const duration=Number(probe.format.duration);
 fail(Number.isFinite(duration)&&Math.abs(duration-expected.durationSec)<.012,'Native duration drift');
 fail(Number(probe.format.size)>5000,'Native media unexpectedly empty');
 return {codec:v.codec_name,profile:v.profile,pixelFormat:v.pix_fmt,width:v.width,height:v.height,
  fps:expected.fps,frames:Number(v.nb_frames),durationSec:duration,audioStreams:0,sizeBytes:Number(probe.format.size)};
}
export function validatePixelEvidence(report){
 fail(report&&Array.isArray(report.results)&&report.results.length===compareTimes.length,'Expected all 12 independently sampled frames');
 for(let i=0;i<compareTimes.length;i++){
  const r=report.results[i];
  fail(Math.abs(Number(r.time)-compareTimes[i])<.0005,'Unexpected frame timestamp in comparison');
  fail(Number.isFinite(r.psnrDb)&&r.psnrDb>=30,'Source snapshot/render divergence at '+r.time);
  fail(Number.isFinite(r.highDeltaFraction)&&r.highDeltaFraction>=0&&r.highDeltaFraction<=1,'Invalid pixel delta fraction');
 }
 const min=Math.min(...report.results.map(x=>x.psnrDb)),mean=report.results.reduce((n,x)=>n+x.psnrDb,0)/compareTimes.length;
 return {method:'PSNR 12 Browser PNG snapshots vs decoded H264 JPEG QA frames',
  timesSec:[...compareTimes],minPsnrDb:Number(min.toFixed(2)),meanPsnrDb:Number(mean.toFixed(2)),
  disclaimer:'Technical seek/render consistency only. Not a full playback, creative/typographic or audio approval.'};
}
export function validateSourceManifest(projectDir,manifest){
 fail(manifest?.schema==='sues-hyperframes-motion-handoff/v1'&&
  manifest.validation==='SOURCE_ONLY_NO_RENDER','Expected actual review-only HyperFrames source manifest');
 const hashes={};
 for(const path of REQUIRED_SOURCE_FILES){
  const descriptor=manifest.source.files?.find(f=>f.path===path);
  fail(descriptor&&/^[a-f0-9]{64}$/.test(descriptor.sha256),'Missing verified source descriptor '+path);
  const actual=sha(readFileSync(join(projectDir,path)));
  fail(actual===descriptor.sha256,'Source changed after review: '+path);
  hashes[path]=actual;
 }
 const rebuilt=buildHyperFramesMotionHandoff({
  sourceHashes:hashes,mode:manifest.identity.mode,profile:manifest.identity.profile,
  transcriptSha256:manifest.identity.transcriptSha256,
  selectedWordIds:manifest.identity.selectedWordIds,
  approvedPlanFingerprint:manifest.identity.approvedPlanFingerprint
 });
 fail(rebuilt.source.fingerprint===manifest.source.fingerprint,'Project fingerprint changed');
 return rebuilt;
}
function probe(path){
 const process=spawnSync('ffprobe',['-v','error','-show_entries',
  'stream=codec_type,codec_name,profile,pix_fmt,width,height,r_frame_rate,avg_frame_rate,nb_frames:format=duration,size',
  '-of','json',path],{encoding:'utf8',timeout:25000,maxBuffer:200000});
 fail(process.status===0,'ffprobe failed: '+String(process.stderr).slice(0,180));
 return JSON.parse(process.stdout);
}
export function createVerifiedNativeProof(projectDir,manifest,mediaPath,pixelReport,stderrLog,proofPath){
 fail(typeof proofPath==='string'&&proofPath.trim(),'New native proof path required');
 const checked=validateSourceManifest(projectDir,manifest);
 fail(statSync(mediaPath).size>5000&&statSync(mediaPath).size<=maxMediaBytes,'Unexpected native media size');
 const raw=readFileSync(mediaPath),hash=sha(raw);
 const media=validateNativeProbe(probe(mediaPath),checked.timeline);
 fail(sha(readFileSync(mediaPath))===hash,'Media changed while hashing');
 const pixel=validatePixelEvidence(pixelReport);
 const deps=requiredVendor.map(name=>{
  const data=readFileSync(join(projectDir,name));
  fail(data.length>0&&data.length<3e6,'Missing/unreasonable vendor dependency '+name);
  return {path:name,sha256:sha(data),sizeBytes:data.length};
 });
 fail(typeof stderrLog==='string'&&stderrLog.includes('BrowserManager')&&stderrLog.includes('HyperFrames'),
  'No HyperFrames runtime evidence in render log');
 const receipt=inspectNativeRenderEvidence(checked,{
  kind:'NATIVE_HYPERFRAMES_RENDER',renderer:'HyperFrames',
  sourceFingerprint:checked.source.fingerprint,outputSha256:hash,
  width:media.width,height:media.height,fps:media.fps,frames:media.frames,
  filePath:mediaPath,proofPath
 });
 return {schema:'sues-hyperframes-native-media-proof/v1',
  status:'TECHNICAL_RENDER_AND_FRAME_ALIGNMENT_VERIFIED',
  evidenceKind:'native HyperFrames + Chrome render, not SVG/FFmpeg proxy',
  createdAt:new Date().toISOString(),
  sourceFingerprint:checked.source.fingerprint,sourceManifestStatus:manifest.validation,
  renderedFile:{sha256:hash,...media},vendorDependencies:deps,
  frameConsistency:pixel,renderLogSha256:sha(Buffer.from(stderrLog)),
  inspectedNativeReceipt:receipt,
  editorial:{assetSourceEditableIn:'HyperFrames HTML/SVG/GSAP',fablecutCanEditInternalMotion:false,
   fablecutIngestStatus:'NOT_IMPORTED',opacityAndAlphaChannel:'NO_TRANSPARENCY_IN_H264_YUV420P',
   intendedUse:'Full-frame graphic only until separately verified alpha-composite workflow',
   originalAudio:'NO_SYNTHETIC_AUDIO'},
  creativeApproval:false,productionChanged:false,publishAuthorized:false,
  pending:['Complete visual playback review','Word-level voice sync with real source',
   'Approved A/V plan and native FableCut ingest tests','Two audiovisual QA passes','Carlos creative approval']
 };
}
if(resolve(process.argv[1]??'')===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);
 fail(args.length===6,'Usage: PROJECT_DIR SOURCE_MANIFEST MP4 NEW_RECEIPT PIXEL_QA RENDER_LOG');
 const [projectDir,sourceFile,mediaFile,outFile,pixelFile,stderrFile]=args.map(resolve);
 fail(!existsSync(outFile),'Refuse to overwrite prior native receipt');
 const p=createVerifiedNativeProof(realpathSync(projectDir),readJson(sourceFile),
  realpathSync(mediaFile),readJson(pixelFile),readFileSync(stderrFile,'utf8'),outFile);
 writeFileSync(outFile,JSON.stringify(p,null,2)+'\n',{flag:'wx',mode:0o600});
 console.log(JSON.stringify({status:p.status,sha256:p.renderedFile.sha256,
  frames:p.renderedFile.frames,resolution:[p.renderedFile.width,p.renderedFile.height],
  fps:p.renderedFile.fps,minPsnrDb:p.frameConsistency.minPsnrDb,sourceFingerprint:p.sourceFingerprint,
  fablecutIngest:p.editorial.fablecutIngestStatus,creativeApproval:p.creativeApproval}));
}
