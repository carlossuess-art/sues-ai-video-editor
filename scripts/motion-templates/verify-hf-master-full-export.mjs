#!/usr/bin/env node
/**
 * Immutable, read-only closing verifier for the full SYNTHETIC approved
 * Master story -> HyperFrames -> FableCut 10-second private QA.
 * Requires pixel PSNR logs for ALL 151 HF + 149 original frames.
 * Does not claim two independent audiovisual/creative reviews.
 *
 * node verify-hf-master-full-export.mjs PRIVATE_FABLECUT_DIR PRIVATE_HF_DIR
 */
import {createHash} from 'node:crypto';
import {readFileSync,existsSync,lstatSync,writeFileSync,realpathSync} from 'node:fs';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
const check=(ok,message)=>{if(!ok)throw Error(message)};
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=file=>JSON.parse(readFileSync(file,'utf8'));
export function verifyPsnrLog(data,{frames,minDb,summaryKey}){
 check(typeof data==='string'&&data.trim(),'PSNR frames missing');
 const lines=data.trim().split(/\r?\n/);
 check(lines.length===frames,'PSNR frame count mismatch '+summaryKey);
 const values=lines.map((line,i)=>{
  const n=/(?:^|\s)n:(\d+)(?=\s)/.exec(line),p=/psnr_avg:([0-9.]+|inf)/.exec(line);
  check(n&&Number(n[1])===i+1&&p,'PSNR frame index or fidelity missing: '+summaryKey+' '+i);
  const score=p[1]==='inf'?Infinity:Number(p[1]);
  check(!Number.isNaN(score)&&score>=minDb,'Insufficient fidelity '+summaryKey+' frame '+i);
  return score;
 });
 const finite=values.filter(Number.isFinite),mean=finite.length?
  finite.reduce((a,b)=>a+b,0)/finite.length:Infinity;
 return {frames:values.length,minPsnrDb:Math.min(...values),
  meanFinitePsnrDb:Math.round(mean*100)/100,rawLogSha256:sha(Buffer.from(data))};
}
export function verifyPrivateMasterExport(dir0,hf0){
 const dir=realpathSync(dir0),hf=realpathSync(hf0);
 check(dir.includes('/fablecut-private-qa/hf-master-stage-')&&
  hf.includes('/sues-motion-narrative-20261115/qa-master-approved-')&&
  existsSync(join(dir,'ISOLATED_HF_QA_NOT_PRODUCTION.txt')),
  'SYNTHETIC_PRIVATE_ONLY');
 const handoff=read(join(dir,'qa-hf-master-roundtrip-result.json')),
  exported=read(join(dir,'qa-hf-master-fablecut-export-proof.json')),
  project=read(join(dir,'project.json'));
 const source=realpathSync(join(dir,'media','synthetic-original.mp4')),
  native=realpathSync(join(hf,'hf-approved-motion-synthetic.mp4')),
  output=realpathSync(exported.outputFile);
 check(output.startsWith(realpathSync(join(dir,'exports'))+'/'),
  'Full MP4 not under private export root');
 check(lstatSync(source).isFile()&&lstatSync(native).isFile()&&
  lstatSync(output).isFile(),'Media file missing or symlinked');
 check(handoff.schema==='sues-master-hyperframes-fablecut-qa/v1'&&
  handoff.status==='PRIVATE_MASTER_APPROVED_HF_NATIVE_FABLECUT_CAS_STAGED'&&
  handoff.strictlySynthetic===true&&
  handoff.simulatedHumanApprovalInTestHarness===true&&
  handoff.creativeUserApproved===false&&handoff.productionChanged===false&&
  exported.schema==='sues-master-hf-fablecut-full-private-export/v1'&&
  exported.status==='FULL_PRIVATE_SYNTHETIC_MASTER_FABLECUT_RENDER_VERIFIED'&&
  exported.creativeApprovedByUser===false&&exported.productionChanged===false&&
  exported.publicationAuthorized===false,'False or missing isolated Master approvals');
 check(handoff.sourceSha256===sha(readFileSync(source))&&
  handoff.nativeHyperFramesSha256===sha(readFileSync(native))&&
  exported.fablecutVideoSha256===sha(readFileSync(output))&&
  exported.sourceSha256===handoff.sourceSha256&&
  exported.hyperframesRenderSha256===handoff.nativeHyperFramesSha256,
  'Source/HyperFrames/FableCut media SHA changed');
 check(project.revision===2&&project.media?.length===2&&project.clips?.length===2&&
  project.clips[0].id==='c_synthetic_original'&&project.clips[0].track==='V1'&&
  project.clips[1].id===handoff.importedGraphicsClipId&&
  project.clips[1].track==='V2'&&project.clips[1].start===0&&
  Math.abs(project.clips[1].duration-151/30)<.002,
  'Original layer preservation or HF V2 clip changed');
 const mediaId=project.clips[1].mediaId,m=project.media.find(x=>x.id===mediaId);
 check(m&&m.kind==='video'&&m.src.startsWith('/media/')&&
  sha(readFileSync(join(dir,m.src.slice(1))))===handoff.nativeHyperFramesSha256,
  'Imported FableCut motion media bytes changed');
 const ff=spawnSync('ffprobe',['-v','error','-show_entries',
  'stream=codec_type,codec_name,width,height,r_frame_rate,nb_frames:format=duration,size',
  '-of','json',output],{encoding:'utf8',timeout:20000});
 check(ff.status===0,'FableCut full MP4 ffprobe failed');
 const video=JSON.parse(ff.stdout);
 check(video.streams?.length===1&&video.streams[0].codec_name==='h264'&&
  video.streams[0].width===1080&&video.streams[0].height===1920&&
  video.streams[0].r_frame_rate==='30/1'&&
  Number(video.streams[0].nb_frames)===300&&
  Math.abs(Number(video.format.duration)-10)<.04,
  'Full 300 frame MP4 does not preserve expected 10-second video');
 const motion=verifyPsnrLog(readFileSync(join(dir,'psnr-hf-first151.log'),'utf8'),
  {frames:151,minDb:40,summaryKey:'hyperframes'});
 const original=verifyPsnrLog(readFileSync(join(dir,'psnr-source-last149.log'),'utf8'),
  {frames:149,minDb:40,summaryKey:'original'});
 return {schema:'sues-hf-master-full-private-300frame-verification/v1',
  status:'PRIVATE_SYNTHETIC_300_FRAMES_TECHNICALLY_VERIFIED',
  sourceSha256:handoff.sourceSha256,
  nativeHyperFramesSha256:handoff.nativeHyperFramesSha256,
  finalFableCutSha256:exported.fablecutVideoSha256,
  storyRevision:handoff.storyRevision,operationId:handoff.operationId,
  fablecutProjectRevision:project.revision,
  canvas:{width:1080,height:1920,fps:30,frames:300,durationSec:10},
  hyperframesMotionInterval:{startFrame:0,endFrameExclusive:151,...motion},
  untouchedOriginalInterval:{startFrame:151,endFrameExclusive:300,...original},
  originalSourcePreserved:true,
  sourceEditableInHyperFrames:true,internalHyperFramesAnimationEditableInFableCut:false,
  simulatedApprovalOnly:true,realVoiceReviewed:false,twoHumanAVQAPassesCompleted:false,
  creativeUserApproved:false,fullProductionIntegration:false,
  publicationAuthorized:false,productionChanged:false};
}
if(process.argv[1]&&realpathSync(process.argv[1])===realpathSync(new URL(import.meta.url).pathname)){
 check(process.argv.length===4,'Usage: PRIVATE_FABLECUT_DIR PRIVATE_HF_DIR');
 const output=verifyPrivateMasterExport(process.argv[2],process.argv[3]);
 const file=join(realpathSync(process.argv[2]),'qa-hf-master-300frames-verified.json');
 check(!existsSync(file),'Never overwrite private QA proof');
 writeFileSync(file,JSON.stringify(output,null,2)+'\n',{flag:'wx',mode:0o600});
 console.log(JSON.stringify({status:output.status,
  frames:output.canvas.frames,motionMinDb:output.hyperframesMotionInterval.minPsnrDb,
  originalMinDb:output.untouchedOriginalInterval.minPsnrDb,
  finalSha256:output.finalFableCutSha256,productionChanged:false}));
}
