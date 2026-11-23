// Local-only source evidence. Probe every video timestamp; average frame rate
// alone is not evidence of CFR. A failure does not authorize a render.
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileSha256} from './local-pipeline.js';
const run=promisify(execFile),HASH=/^[a-f0-9]{64}$/;
export function classifyMasterSource({frames,streams}={}){
 if(!Array.isArray(frames)||!frames.length||frames.length>108000||!Array.isArray(streams))
  return {status:'BLOCKED',issues:[{code:'SOURCE_PROBE_INCOMPLETE'}]};
 const video=streams.filter(s=>s.codec_type==='video'),audio=streams.filter(s=>s.codec_type==='audio');
 if(video.length!==1||audio.length!==1)return {status:'BLOCKED',issues:[{code:'SOURCE_STREAMS_UNSUPPORTED'}]};
 const v=video[0],rotationValues=[v.tags?.rotate,...(v.side_data_list??[]).map(x=>x.rotation)].filter(x=>x!==undefined&&x!==null);
 if(!Number.isInteger(v.width)||!Number.isInteger(v.height)||v.width<1||v.height<1||v.sample_aspect_ratio!=='1:1'||
    rotationValues.some(x=>!Number.isFinite(Number(x))||Number(x)%360!==0))
  return {status:'BLOCKED',issues:[{code:'SOURCE_GEOMETRY_UNVERIFIED'}]};

 for(let i=0;i<frames.length;i++){
  const raw=frames[i]?.best_effort_timestamp_time;const t=typeof raw==='string'&&raw.trim()?Number(raw):NaN;
  if(!Number.isFinite(t)||Math.abs(t-i/30)>.0015)
   return {status:'BLOCKED',issues:[{code:'SOURCE_NOT_FRAME_ALIGNED_CFR30',frame:i}]};
 }
 const audioStart=Number(audio[0].start_time),audioDuration=Number(audio[0].duration);
 if(!Number.isFinite(audioStart)||Math.abs(audioStart)>.0015||!Number.isFinite(audioDuration)||audioDuration<frames.length/30-1/30)
  return {status:'BLOCKED',issues:[{code:'SOURCE_AUDIO_TIMING_UNVERIFIED'}]};
 return {status:'SOURCE_CFR30_VERIFIED',sourceTiming:'cfr30-verified',sourceHasAudio:true,
  sourceDuration:frames.length/30,frameCount:frames.length,width:v.width,height:v.height};
}
export async function probeMasterDirectorSource(project,{runner=run}={}){
 const path=project?.sourcePath,expected=project?.boundHashes?.source;
 if(typeof path!=='string'||!HASH.test(expected??'')||fileSha256(path)!==expected)
  return {status:'BLOCKED',issues:[{code:'SOURCE_IDENTITY_UNVERIFIED'}]};
 try{
  const common=['-v','error','-protocol_whitelist','file,pipe'];
  const [f,s]=await Promise.all([
   runner('ffprobe',[...common,'-select_streams','v:0','-show_frames','-show_entries','frame=best_effort_timestamp_time','-of','json',path],{timeout:180000,maxBuffer:16*1024*1024}),
   runner('ffprobe',[...common,'-show_streams','-show_entries','stream=codec_type,start_time,duration,width,height,sample_aspect_ratio:stream_tags=rotate:stream_side_data=rotation','-of','json',path],{timeout:180000,maxBuffer:1024*1024})
  ]);
  if(fileSha256(path)!==expected)return {status:'BLOCKED',issues:[{code:'SOURCE_CHANGED_DURING_PROBE'}]};
  return {...classifyMasterSource({frames:JSON.parse(f.stdout).frames,streams:JSON.parse(s.stdout).streams}),sourceSha256:expected};
 }catch{return {status:'BLOCKED',issues:[{code:'SOURCE_PROBE_FAILED'}]};}
}
