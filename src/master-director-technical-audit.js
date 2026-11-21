// Independent objective media audit. This checks decodability and identity only;
// it never certifies subjective visuals, masks, timing, mixing or publication.
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {statSync} from 'node:fs';
import {fileSha256} from './local-pipeline.js';
const run=promisify(execFile),HASH=/^[a-f0-9]{64}$/;
export async function auditMasterDirectorMedia({sourcePath,sourceSha256,outputPath,expected,runner=run}={}){
 if(typeof sourcePath!=='string'||typeof outputPath!=='string'||sourcePath===outputPath||!HASH.test(sourceSha256??'')||
    !expected||!Number.isInteger(expected.width)||!Number.isInteger(expected.height)||
    !Number.isFinite(expected.duration)||expected.duration<=0||expected.fps!==30)
  return {status:'BLOCKED',issues:[{code:'AUDIT_INPUT_INVALID'}]};
 try{
  if(fileSha256(sourcePath)!==sourceSha256)return {status:'BLOCKED',issues:[{code:'SOURCE_CHANGED'}]};
  const outputSha256=fileSha256(outputPath),bytes=statSync(outputPath).size;
  if(!bytes||outputSha256===sourceSha256)return {status:'BLOCKED',issues:[{code:'OUTPUT_IDENTITY_INVALID'}]};
  const base=['-v','error','-protocol_whitelist','file,pipe'];
  const probe=await runner('ffprobe',[...base,'-show_streams','-show_format','-of','json',outputPath],{timeout:180000,maxBuffer:1024*1024});
  const data=JSON.parse(probe.stdout),video=data.streams?.filter(s=>s.codec_type==='video')??[],audio=data.streams?.filter(s=>s.codec_type==='audio')??[];
  const dur=Number(data.format?.duration),fps=video[0]?.avg_frame_rate;
  if(video.length!==1||audio.length!==1||video[0].codec_name!=='h264'||audio[0].codec_name!=='aac'||video[0].width!==expected.width||video[0].height!==expected.height||
     !['30/1','30'].includes(fps)||!Number.isFinite(dur)||Math.abs(dur-expected.duration)>1/30+0.001)
   return {status:'BLOCKED',issues:[{code:'OUTPUT_MEDIA_SPEC_MISMATCH'}],outputSha256};
  await runner('ffmpeg',[...base,'-xerror','-i',outputPath,'-map','0:v:0','-map','0:a:0','-f','null','-'],{timeout:600000,maxBuffer:1024*1024});
  if(fileSha256(sourcePath)!==sourceSha256||fileSha256(outputPath)!==outputSha256)
   return {status:'BLOCKED',issues:[{code:'MEDIA_CHANGED_DURING_AUDIT'}]};
  return {status:'TECHNICAL_PASS_HUMAN_QA_PENDING',issues:[],sourceSha256,outputSha256,bytes,
   video:{width:video[0].width,height:video[0].height,fps},duration:dur,audioPresent:true,fullDecode:true,
   notVerified:['visual-quality','motion','mask-occlusion','audio-listening','semantic-sync','narrative','creative-acceptance']};
 }catch{return {status:'BLOCKED',issues:[{code:'MEDIA_AUDIT_FAILED'}]};}
}
