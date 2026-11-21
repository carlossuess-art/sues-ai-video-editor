/**
 * Single-CAS private FableCut media+clip commit for an approved HyperFrames
 * render. Never uses fablecut_import_media (non-atomic extra revision), set_project
 * or force. The source Reel remains in V1; full-frame motion goes in V2.
 * Host MUST supply a clone with sentinel, exact real source file and MCP.
 */
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,existsSync,lstatSync,realpathSync,
 mkdirSync,copyFileSync,constants,chmodSync,statSync} from 'node:fs';
import {join,resolve,sep,basename} from 'node:path';
import {spawnSync} from 'node:child_process';
import {projectFingerprint} from '../engine-next/fablecut-command-batch.js';

const SHA=/^[a-f0-9]{64}$/;
const check=(v,msg)=>{if(!v)throw Error(msg)};
const sha=v=>createHash('sha256').update(v).digest('hex');
const safeMediaPath=(dir,src)=>{
 check(typeof src==='string'&&/^\/media\/[a-zA-Z0-9_.-]+$/.test(src),
  'UNTRUSTED_FABLECUT_MEDIA_SOURCE');
 const file=realpathSync(join(dir,src.slice(1)));
 check(file.startsWith(realpathSync(join(dir,'media'))+sep),
  'MEDIA_SOURCE_OUTSIDE_ISOLATED_CLONE');
 return file;
};
function probe(file){
 const p=spawnSync('ffprobe',['-v','error','-show_entries',
  'stream=codec_type,codec_name,width,height,r_frame_rate,nb_frames:format=duration,size',
  '-of','json',file],{encoding:'utf8',timeout:18000,maxBuffer:300000});
 check(p.status===0,'CANNOT_PROBE_TRUSTED_HYPERFRAMES_RENDER');
 const v=JSON.parse(p.stdout),video=v.streams.filter(s=>s.codec_type==='video'),
  audio=v.streams.filter(s=>s.codec_type==='audio');
 check(video.length===1&&audio.length===0&&video[0].codec_name==='h264'&&
  video[0].width===1080&&video[0].height===1920&&
  video[0].r_frame_rate==='30/1'&&video[0].nb_frames==='151'&&
  Math.abs(Number(v.format.duration)-151/30)<.02,
  'NATIVE_HYPERFRAMES_RENDER_CODEC_OR_TIMING_INVALID');
 return {duration:151/30,size:Number(v.format.size)};
}
const containsVideo=(doc,mediaId,start,end)=>doc.clips.some(c=>
 c.kind==='video'&&c.mediaId===mediaId&&c.start<=start+.001&&
 c.start+c.duration>=end-.001);

export async function commitPrivateHyperFramesMedia({
 privateDataDir,approvedRenderRoot,baselineProject,preflight,operation,
 rendered,expectedNativeFingerprint,sourceMediaId,
 invokeMcp,readProject,approvalId
}={}){
 check(typeof privateDataDir==='string'&&privateDataDir.startsWith('/')&&
  typeof approvedRenderRoot==='string'&&approvedRenderRoot.startsWith('/')&&
  typeof invokeMcp==='function'&&typeof readProject==='function',
  'TRUSTED_PRIVATE_HF_MEDIA_HOST_REQUIRED');
 const root=realpathSync(resolve(privateDataDir)),renderRoot=realpathSync(resolve(approvedRenderRoot));
 check(root.includes('/fablecut-private-qa/')&&
  existsSync(join(root,'ISOLATED_HF_QA_NOT_PRODUCTION.txt'))&&
  lstatSync(join(root,'ISOLATED_HF_QA_NOT_PRODUCTION.txt')).isFile()&&
  renderRoot!==root,
  'PRIVATE_FABLECUT_CLONE_SENTINEL_REQUIRED');
 check(/^a_[a-f0-9]{32}$/.test(approvalId??'')&&
  SHA.test(expectedNativeFingerprint??'')&&
  preflight?.status==='READY_FOR_CREATIVE_REVIEW'&&
  operation?.renderer==='hyperframes'&&
  operation?.effect==='hyperframes-word-motion-v1'&&
  operation?.parameters?.variablesSha256===preflight.hyperframes?.variablesSha256&&
  rendered?.sourceFingerprint&&SHA.test(rendered.sourceFingerprint)&&
  rendered?.status==='NATIVE_HYPERFRAMES_RENDER_VERIFIED'&&
  SHA.test(rendered?.outputSha256??''),
  'APPROVED_HF_MEDIA_INPUT_INCOMPLETE');
 const before=baselineProject;
 check(before&&projectFingerprint(before)===expectedNativeFingerprint&&
  Number.isInteger(before.revision)&&before.fps===30&&
  before.width===1080&&before.height===1920&&
  Array.isArray(before.clips)&&Array.isArray(before.media),
  'FABLECUT_PRIVATE_CAS_INPUT_STALE');
 check(typeof sourceMediaId==='string'&&sourceMediaId.length>0&&
  before.media.some(m=>m.id===sourceMediaId&&m.kind==='video')&&
  containsVideo(before,sourceMediaId,0,preflight.scene.endSec),
  'FABLECUT_ORIGINAL_REEL_MEDIA_NOT_BOUND_TO_FULL_INTERVAL');
 const original=before.media.find(m=>m.id===sourceMediaId);
 check(sha(readFileSync(safeMediaPath(root,original.src)))===preflight.sourceSha256,
  'REAL_ORIGINAL_SOURCE_SHA_CHANGED');
 const output=realpathSync(resolve(rendered.filePath));
 check(output.startsWith(renderRoot+sep)&&lstatSync(output).isFile()&&
  statSync(output).size>5000&&statSync(output).size<128e6&&
  sha(readFileSync(output))===rendered.outputSha256,
  'REAL_HYPERFRAMES_RENDER_BYTES_CHANGED');
 const mediaInfo=probe(output);
 const mediaId='m_sueshf_'+rendered.outputSha256.slice(0,20);
 const filename='sues_hf_'+rendered.outputSha256.slice(0,24)+'.mp4';
 const clipId='c_sueshf_'+operation.id;
 check(clipId.length<=100&&/^[A-Za-z0-9_.-]+$/.test(clipId)&&
  !before.media.some(m=>m.id===mediaId||m.src==='/media/'+filename)&&
  !before.clips.some(c=>c.id===clipId)&&
  operation.start===preflight.scene.startFrame/30&&
  operation.end===preflight.scene.endFrameExclusive/30,
  'NATIVE_HF_DUPLICATE_OR_TIME_DRIFT');
 const mediaDir=realpathSync(join(root,'media'));
 const staged=join(mediaDir,filename);
 if(existsSync(staged)){
  check(lstatSync(staged).isFile()&&sha(readFileSync(staged))===rendered.outputSha256,
   'HF_STAGED_FILE_COLLISION');
 }else{
  // Stage media before CAS, never mutate an existing media clip. Failed CAS
  // may leave a harmless orphan file, NOT a partially registered project.
  copyFileSync(output,staged,constants.COPYFILE_EXCL);
  chmodSync(staged,0o600);
 }
 const undoRoot=join(root,'hf-motion-undo');
 mkdirSync(undoRoot,{recursive:true,mode:0o700});
 const previous=join(undoRoot,approvalId+'.before.json');
 check(!existsSync(previous),'PRIVATE_APPROVAL_BEFORE_SNAPSHOT_ALREADY_EXISTS');
 writeFileSync(previous,JSON.stringify(before,null,2)+'\n',{mode:0o600,flag:'wx'});
 const opts={baseRevision:before.revision,ops:[
  {op:'addMedia',media:{id:mediaId,name:'SUES HyperFrames · '+operation.id,
   kind:'video',src:'/media/'+filename,duration:mediaInfo.duration,
   width:1080,height:1920,fps:30,size:mediaInfo.size}},
  {op:'addClip',clip:{id:clipId,mediaId,kind:'video',track:'V2',
   start:preflight.scene.startFrame/30,in:0,duration:151/30,
   name:operation.id,props:{fit:'fill',opacity:1,x:0,y:0,scale:1}}}
 ]};
 // Never send a generic force/write request, even if FableCut responds with
 // a conflict. A consumed approval cannot be reused.
 const response=await invokeMcp('fablecut_patch_project',opts);
 check(typeof response==='string'&&response.startsWith('Patched'),
  'FABLECUT_PATCH_RESPONSE_UNCERTAIN_DO_NOT_RETRY');
 const after=await readProject();
 check(after?.revision===before.revision+1&&after.clips?.length===before.clips.length+1&&
  after.media?.length===before.media.length+1&&
  after.clips.some(c=>c.id===clipId&&c.mediaId===mediaId&&
   c.track==='V2'&&Math.abs(c.start-operation.start)<.001&&
   Math.abs(c.duration-151/30)<.001)&&
  after.media.some(m=>m.id===mediaId&&m.src==='/media/'+filename)&&
  before.clips.every(c=>after.clips.some(a=>a.id===c.id&&JSON.stringify(a)===JSON.stringify(c)))&&
  before.media.every(m=>after.media.some(a=>a.id===m.id&&JSON.stringify(a)===JSON.stringify(m)))&&
  sha(readFileSync(staged))===rendered.outputSha256,
  'FABLECUT_POST_COMMIT_READBACK_UNCERTAIN_DO_NOT_RETRY');
 const afterFp=projectFingerprint(after),record={
  status:'PRIVATE_NATIVE_HF_MEDIA_COMMITTED',
  revision:after.revision,operationId:operation.id,
  sourceFingerprint:rendered.sourceFingerprint,renderSha256:rendered.outputSha256,
  projectFingerprintBefore:expectedNativeFingerprint,
  projectFingerprintAfter:afterFp,
  mediaId,clipId,track:'V2',stagedMedia:'/media/'+filename,
  sourceEditableIn:'HyperFrames',internalAnimationEditableInFableCut:false,
  receipts:[{operationId:operation.id,mediaId,clipId,startFrame:preflight.scene.startFrame,
   durationFrames:151,renderSha256:rendered.outputSha256}],
  undo:{beforePath:previous,previousFingerprint:expectedNativeFingerprint},
  productionChanged:false,publicationAuthorized:false,
  creativeQAComplete:false,final:false
 };
 const receiptPath=join(undoRoot,approvalId+'.result.json');
 writeFileSync(receiptPath,JSON.stringify(record,null,2)+'\n',{mode:0o600,flag:'wx'});
 return record;
}
