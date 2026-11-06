// Independent read-only evidence preparation. This module never certifies
// semantic correctness, artistic quality, acceptance, or publication.
import {execFile} from 'node:child_process';
import {createHash} from 'node:crypto';
import {promisify} from 'node:util';
import {mkdirSync,mkdtempSync,readdirSync,lstatSync,writeFileSync,rmSync,readFileSync} from 'node:fs';
import {join,basename,isAbsolute} from 'node:path';
import {fileSha256} from './local-pipeline.js';
const run=promisify(execFile),HASH=/^[a-f0-9]{64}$/,ID=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/;
const blocked=code=>({status:'BLOCKED',issues:[{code}],final:false});

// Objective signal measurements on the converted inspection WAV. These numbers
// are observations, never a judgment of audible quality or a QA pass.
export function measureSupervisorStereoWav(bytes){
 if(!Buffer.isBuffer(bytes)||bytes.length<44||bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WAVE'||bytes.readUInt32LE(4)+8!==bytes.length)throw Error('Invalid WAV');
 let offset=12,format=null,data=null;
 while(offset+8<=bytes.length){
  const id=bytes.toString('ascii',offset,offset+4),size=bytes.readUInt32LE(offset+4),start=offset+8,end=start+size;
  if(end>bytes.length)throw Error('Truncated WAV');
  if(id==='fmt '){if(format||size<16)throw Error('Invalid WAV format');format={encoding:bytes.readUInt16LE(start),channels:bytes.readUInt16LE(start+2),sampleRate:bytes.readUInt32LE(start+4),byteRate:bytes.readUInt32LE(start+8),blockAlign:bytes.readUInt16LE(start+12),bits:bytes.readUInt16LE(start+14)};}
  if(id==='data'){if(data)throw Error('Duplicate WAV data');data={start,end};}
  offset=end+(size%2);
 }
 if(!format||!data||format.encoding!==1||format.channels!==2||format.sampleRate!==48000||format.byteRate!==192000||format.blockAlign!==4||format.bits!==16||
    (data.end-data.start)%4!==0||data.end===data.start)throw Error('Unsupported WAV format');
 const frames=(data.end-data.start)/4,seconds=[];let clippingLeft=0,clippingRight=0;
 for(let start=0;start<frames;start+=48000){
  const end=Math.min(frames,start+48000),sum=[0,0],peak=[0,0];
  for(let i=start;i<end;i++)for(let channel=0;channel<2;channel++){
   const sample=bytes.readInt16LE(data.start+i*4+channel*2),abs=Math.abs(sample);sum[channel]+=sample*sample;peak[channel]=Math.max(peak[channel],abs);
   if(abs>=32760){if(channel===0)clippingLeft++;else clippingRight++;}
  }
  seconds.push({startFrame:start,endFrame:end,rms:sum.map(x=>Math.sqrt(x/(end-start))/32768),peak:peak.map(x=>x/32768)});
 }
 return {schema:'sues-supervisor-audio-measurements/v1',sampleRate:48000,channels:2,frames,seconds,clippingSamples:[clippingLeft,clippingRight],notQualityJudgment:true};
}

export async function prepareMasterSupervisorEvidence({graph,previewPath,outputSha256,root,approvalCheck,runner=run}={}){
 if(graph?.schema!=='sues-layer-graph/v1'||!HASH.test(graph.planFingerprint??'')||
    graph.fps!==30||!Number.isInteger(graph.durationFrames)||graph.durationFrames<1||graph.durationFrames>3600||
    !Array.isArray(graph.nodes)||!graph.nodes.length||graph.nodes.length>1500||
    typeof previewPath!=='string'||!isAbsolute(previewPath)||typeof root!=='string'||!isAbsolute(root)||!HASH.test(outputSha256??'')||
    typeof approvalCheck!=='function'||typeof runner!=='function')
  return blocked('SUPERVISOR_INPUT_INVALID');
 const sampled=new Map(),ids=new Set();
 const mark=(frame,id)=>{if(!sampled.has(frame))sampled.set(frame,new Set());sampled.get(frame).add(id);};
 for(const node of graph.nodes){
  if(!ID.test(node?.id??'')||ids.has(node.id)||!Number.isInteger(node.startFrame)||!Number.isInteger(node.endFrame)||
     node.startFrame<0||node.endFrame<=node.startFrame||node.endFrame>graph.durationFrames)
   return blocked('SUPERVISOR_GRAPH_INVALID');
  ids.add(node.id);
  mark(node.startFrame,node.id);mark(Math.floor((node.startFrame+node.endFrame-1)/2),node.id);mark(node.endFrame-1,node.id);
 }
 // Include the full timeline at one-second intervals, including quiet sections
 // with no planned operation, plus every operation boundary and midpoint.
 for(let frame=0;frame<graph.durationFrames;frame+=graph.fps)if(!sampled.has(frame))sampled.set(frame,new Set());
 if(!sampled.has(graph.durationFrames-1))sampled.set(graph.durationFrames-1,new Set());
 const frames=[...sampled.keys()].sort((a,b)=>a-b);
 if(frames.length>180)return blocked('SUPERVISOR_SAMPLE_LIMIT');
 let dir=null;
 try{
  if(!await approvalCheck()||fileSha256(previewPath)!==outputSha256)return blocked('SUPERVISOR_SOURCE_CHANGED');
  mkdirSync(root,{recursive:true,mode:0o700});dir=mkdtempSync(join(root,'inspection-'));
  const selection=frames.map(n=>'eq(n\\,'+n+')').join('+');
  await runner('ffmpeg',['-v','error','-xerror','-protocol_whitelist','file,pipe','-i',previewPath,
   '-vf','select='+selection,'-vsync','0','-frames:v',String(frames.length),join(dir,'frame-%04d.png')],
   {timeout:600000,maxBuffer:1048576});
  await runner('ffmpeg',['-v','error','-xerror','-protocol_whitelist','file,pipe','-i',previewPath,
   '-map','0:a:0','-vn','-ac','2','-ar','48000','-c:a','pcm_s16le',join(dir,'audio.wav')],
   {timeout:600000,maxBuffer:1048576});
  const names=readdirSync(dir).sort(),expected=frames.map((_,i)=>'frame-'+String(i+1).padStart(4,'0')+'.png');
  if(JSON.stringify(names)!==JSON.stringify(['audio.wav',...expected].sort()))throw Error('Evidence file mismatch');
  let total=0;
  const files=names.map(name=>{
   const path=join(dir,name),st=lstatSync(path);if(!st.isFile()||st.isSymbolicLink()||st.size<1||st.size>(name==='audio.wav'?32:12)*1024*1024)throw Error('Invalid evidence file');
   total+=st.size;return {name,bytes:st.size,sha256:fileSha256(path)};
  });
  const audioPath=join(dir,'audio.wav'),audioBytes=readFileSync(audioPath),audioHash=files.find(f=>f.name==='audio.wav')?.sha256;
  if(createHash('sha256').update(audioBytes).digest('hex')!==audioHash)throw Error('Audio evidence changed');
  const audioMeasurements=measureSupervisorStereoWav(audioBytes);
  if(total>128*1024*1024||fileSha256(previewPath)!==outputSha256||!await approvalCheck()||fileSha256(audioPath)!==audioHash)throw Error('Evidence source changed');
  const report={schema:'sues-master-supervisor-evidence/v1',status:'SAMPLES_REQUIRE_REVIEW',final:false,
   planFingerprint:graph.planFingerprint,outputSha256,fps:30,durationFrames:graph.durationFrames,coverage:'one-frame-per-second-plus-boundaries',
   samples:frames.map((frame,i)=>({frame,file:expected[i],operationIds:[...sampled.get(frame)]})),files,
   audioEvidence:{encoding:'pcm-s16le',sampleRate:48000,channels:2,sourceDownmixPossible:true,notOriginalBytes:true},audioMeasurements,
   limitations:['sampled-frames-only','audio-not-listened','semantic-review-pending','not-qa-pass']};
  writeFileSync(join(dir,'manifest.json'),JSON.stringify(report),{mode:0o600,flag:'wx'});
  return {status:report.status,inspectionId:basename(dir),report,final:false};
 }catch{if(dir)rmSync(dir,{recursive:true,force:true});return blocked('SUPERVISOR_EVIDENCE_FAILED');}
}

export function openMasterSupervisorEvidence({root,inspectionId,file,planFingerprint,outputSha256}={}){
 if(typeof root!=='string'||!isAbsolute(root)||!/^inspection-[A-Za-z0-9]{6}$/.test(inspectionId??'')||
    !/^(?:audio\.wav|frame-[0-9]{4}\.png)$/.test(file??'')||!HASH.test(planFingerprint??'')||!HASH.test(outputSha256??''))
  throw Error('Invalid supervisor evidence request');
 const dir=join(root,inspectionId),d=lstatSync(dir);if(!d.isDirectory()||d.isSymbolicLink())throw Error('Invalid evidence directory');
 const manifest=join(dir,'manifest.json'),m=lstatSync(manifest);
 if(!m.isFile()||m.isSymbolicLink()||m.size>262144)throw Error('Invalid evidence manifest');
 const report=JSON.parse(readFileSync(manifest,'utf8'));
 if(report.schema!=='sues-master-supervisor-evidence/v1'||report.planFingerprint!==planFingerprint||
    report.outputSha256!==outputSha256||!Array.isArray(report.files))throw Error('Evidence belongs to another output');
 const entries=report.files.filter(entry=>entry?.name===file);if(entries.length!==1||!HASH.test(entries[0].sha256??''))throw Error('Evidence not found');
 const path=join(dir,file),st=lstatSync(path);
 if(!st.isFile()||st.isSymbolicLink()||st.size!==entries[0].bytes||fileSha256(path)!==entries[0].sha256)throw Error('Evidence integrity failure');
 return {path,mime:file==='audio.wav'?'audio/wav':'image/png',sha256:entries[0].sha256};
}