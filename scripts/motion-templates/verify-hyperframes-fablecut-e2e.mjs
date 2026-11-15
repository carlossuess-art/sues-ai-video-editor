#!/usr/bin/env node
/**
 * Revalidate a real, private HyperFrames -> FableCut roundtrip.  Read-only
 * except a NEW immutable technical receipt. This does not import/render/edit
 * any video, set creative approvals, or upload to production.
 *
 * node verify-hyperframes-fablecut-e2e.mjs \
 *  PRIVATE_FABLECUT_DATA_DIR EXISTING_HF_NATIVE_PROOF.json NEW_E2E_RECEIPT.json
 */
import {readFileSync,statSync,existsSync,writeFileSync,realpathSync} from 'node:fs';
import {resolve,join,sep} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const hash=data=>createHash('sha256').update(data).digest('hex');
const requireTrue=(v,msg)=>{if(!v)throw Error(msg)};
const sha=v=>typeof v==='string'&&/^[0-9a-f]{64}$/i.test(v);
const read=file=>JSON.parse(readFileSync(file,'utf8'));
const times=[0,.267,.467,.9,1.2,1.7,2.2,2.7,3.1,3.5,4.1,4.8];
const under=(path,root)=>path.startsWith(root+sep);
function ffprobe(file){
 const call=spawnSync('ffprobe',['-v','error','-show_entries',
  'stream=codec_type,codec_name,profile,width,height,pix_fmt,r_frame_rate,avg_frame_rate,nb_frames:format=duration,size',
  '-of','json',file],{encoding:'utf8',timeout:15000,maxBuffer:500000});
 requireTrue(call.status===0,'ffprobe could not read private FableCut export');
 return JSON.parse(call.stdout);
}
export function validatePrivateE2EReports({hf,intake,render,comparison,doc,metadata}){
 requireTrue(hf?.schema==='sues-hyperframes-native-media-proof/v1'&&
  hf.status==='TECHNICAL_RENDER_AND_FRAME_ALIGNMENT_VERIFIED','HyperFrames proof is not an accredited native export');
 requireTrue(intake?.schema==='sues-fablecut-hyperframes-private-intake/v1'&&
  intake.state==='ISOLATED_NATIVE_MEDIA_IMPORTED_IN_QA_ONLY','FableCut intake receipt missing');
 requireTrue(render?.schema==='sues-hyperframes-to-fablecut-private-export/v1'&&
  render.status==='PRIVATE_HYPERFRAMES_FABLECUT_EXPORT_TECHNICALLY_RENDERED','FableCut private export not completed');
 requireTrue(comparison?.schema==='sues-hf-fablecut-private-frame-comparison/v1'&&
  Array.isArray(comparison.results)&&comparison.results.length===12,'12 independent comparison frames required');
 const source=hf.sourceFingerprint;
 requireTrue(sha(source)&&[intake.sourceFingerprint,render.sourceFingerprint].every(x=>x===source),
  'HF source fingerprint changed across the bridge');
 requireTrue(sha(hf.renderedFile?.sha256)&&intake.nativeMp4Sha256===hf.renderedFile.sha256&&
  render.hyperframesNativeSha256===hf.renderedFile.sha256,'Native HF media SHA changed');
 requireTrue(sha(render.fablecutExportSha256)&&render.fablecutExportSha256!==hf.renderedFile.sha256,
  'FableCut export SHA missing (two independent encodes expected)');
 requireTrue(hf.renderedFile.width===1080&&hf.renderedFile.height===1920&&
  hf.renderedFile.frames===151&&hf.renderedFile.fps===30&&hf.renderedFile.audioStreams===0,
  'Native HF dimensions/FPS/frame count/audio drift');
 requireTrue(doc?.clips?.length===1&&doc.media?.length===1&&doc.revision===intake.projectRevision&&
  doc.width===1080&&doc.height===1920&&doc.fps===30,'Private editorial project revision changed');
 requireTrue(doc.clips[0].id===intake.clipId&&doc.clips[0].mediaId===intake.mediaId&&
  doc.media[0].id===intake.mediaId&&doc.clips[0].kind==='video','Private video clip/media identity changed');
 requireTrue(metadata&&metadata.streams&&metadata.format,'FableCut media probe missing');
 const videos=metadata.streams.filter(x=>x.codec_type==='video'),
  audios=metadata.streams.filter(x=>x.codec_type==='audio');
 requireTrue(videos.length===1&&audios.length===0,'Silent QA export must contain exactly one video, no audio');
 const v=videos[0];
 requireTrue(v.codec_name==='h264'&&v.pix_fmt==='yuv420p'&&
  v.width===1080&&v.height===1920&&v.nb_frames==='151'&&
  v.r_frame_rate==='30/1'&&v.avg_frame_rate==='30/1',
  'FableCut native export codec, FPS or frame count drift');
 const duration=Number(metadata.format.duration);
 requireTrue(Math.abs(duration-151/30)<.015,'FableCut output duration drift');
 let sum=0,min=Infinity;
 for(let i=0;i<times.length;i++){
  const p=comparison.results[i];
  requireTrue(Math.abs(p.timeSec-times[i])<.0005,'Comparison timestamps do not cover the 12 specified frames');
  requireTrue(Number.isFinite(p.psnrDb)&&p.psnrDb>=35,'FableCut visual frame comparison below required threshold at '+p.timeSec);
  requireTrue(Number.isFinite(p.highDeltaFraction)&&p.highDeltaFraction>=0&&p.highDeltaFraction<=1,
   'Invalid high-delta pixel fraction');
  min=Math.min(min,p.psnrDb);sum+=p.psnrDb;
 }
 requireTrue(!hf.productionChanged&&!intake.productionChanged&&!render.productionChanged&&
  !hf.publishAuthorized&&!intake.publicationAuthorized&&!render.publicationAuthorized,
  'QA project must not be production-modifying or publish-authorized');
 return {sourceFingerprint:source,nativeHyperFramesSha256:hf.renderedFile.sha256,
  fablecutExportSha256:render.fablecutExportSha256,frames:151,fps:30,
  resolution:'1080x1920',silent:true,minPsnrDb:Number(min.toFixed(2)),
  meanPsnrDb:Number((sum/times.length).toFixed(2))};
}
export function verifyPrivateE2E(dataDir,proofPath){
 const root=realpathSync(resolve(dataDir));
 requireTrue(root.includes('/fablecut-private-qa/')&&
  existsSync(join(root,'ISOLATED_HF_QA_NOT_PRODUCTION.txt')),'Private QA sentinel missing');
 const hf=read(proofPath),intake=read(join(root,'hf-intake-qa-receipt.json')),
  render=read(join(root,'hf-private-export-qa-receipt.json')),
  comparison=read(join(root,'fablecut-private-export-frame-qa.json')),
  doc=read(join(root,'project.json'));
 const file=realpathSync(resolve(render.exportFile));
 requireTrue(under(file,join(root,'exports')),'FableCut output escapes private QA exports');
 requireTrue(statSync(file).size>5000&&statSync(file).size<128e6,'Unexpected private MP4 size');
 const mediaFile=realpathSync(join(root,'media',decodeURIComponent(doc.media[0].src.split('/').at(-1))));
 requireTrue(under(mediaFile,join(root,'media')),'Imported native HF media escapes private media');
 const exportBytes=readFileSync(file),nativeBytes=readFileSync(mediaFile);
 requireTrue(hash(exportBytes)===render.fablecutExportSha256&&hash(nativeBytes)===hf.renderedFile.sha256,
  'Actual media SHA differs from receipt');
 const metrics=validatePrivateE2EReports({hf,intake,render,comparison,doc,metadata:ffprobe(file)});
 return {schema:'sues-hyperframes-fablecut-e2e-verification/v1',
  status:'ISOLATED_NATIVE_HF_TO_FABLECUT_EXPORT_TECHNICALLY_VERIFIED',
  createdAt:new Date().toISOString(),...metrics,
  sourceAnimationOwner:'HyperFrames',editorialOwner:'FableCut',
  exportedVideoInternalMotionEditable:false,
  fullReelArollChecked:false,actualNarrationChecked:false,
  fullPlaybackAndAudioQACompleted:false,twoPassQACompleted:false,
  creativeApproval:false,publicationAuthorized:false,productionChanged:false,
  outstanding:['Reel source and actual word IDs/time mapping','Editor mapping ledger/CAS for real project',
   'Full A/V layered plan and separate approval','Two true audiovisual reviews','Public production untouched']
 };
}
if(process.argv[1]&&new URL(import.meta.url).pathname===resolve(process.argv[1])){
 const args=process.argv.slice(2);requireTrue(args.length===3,'Use QA_DATA_DIR HF_NATIVE_PROOF NEW_E2E_PROOF');
 const [dir,proof,outFile]=args.map(p=>resolve(p));
 requireTrue(!existsSync(outFile),'Never overwrite existing E2E receipt');
 const result=verifyPrivateE2E(dir,proof);
 requireTrue(under(outFile,realpathSync(dir)),'Proof must be saved inside its isolated QA folder');
 writeFileSync(outFile,JSON.stringify(result,null,2)+'\n',{flag:'wx',mode:0o600});
 console.log(JSON.stringify({status:result.status,frames:result.frames,fps:result.fps,
  minPsnrDb:result.minPsnrDb,source:result.sourceFingerprint,
  hfSha256:result.nativeHyperFramesSha256,fablecutSha256:result.fablecutExportSha256,
  productionChanged:result.productionChanged}));
}
