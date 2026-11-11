#!/usr/bin/env node
/** Register real SHA-verified resources in a separate FableCut QA project bin,
 * but never place these assets in an active timeline or approve their rights. */
import {readFile,open,unlink,lstat,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,join,dirname} from 'node:path';
import {execFileSync} from 'node:child_process';
import {stageVerifiedResourceBin,VERIFIED_BIN_CANDIDATES} from '../../src/engine-next/reel-158404-private-resource-bin.js';
const [pPath,sidePath,gapPath,sourceDir,pOut,sideOut,manifestOut,mediaDir]=process.argv.slice(2);
const inputs=[pPath,sidePath,gapPath,sourceDir],outputs=[pOut,sideOut,manifestOut];
if([...inputs,...outputs,mediaDir].some(x=>typeof x!=='string'||!x.startsWith('/')||resolve(x)!==x)||
    new Set([...inputs,...outputs,mediaDir]).size!==8||
    outputs.some(x=>dirname(x)===mediaDir)||dirname(pOut)!==dirname(sideOut)||dirname(sideOut)!==dirname(manifestOut)||
    dirname(mediaDir)!==dirname(pOut))
 throw Error('Required absolute existing source project, crosswalk, gap, source-dir, NEW project, crosswalk, manifest, and sibling media dir');
const [p,side,ledger]=await Promise.all([readFile(pPath,'utf8'),readFile(sidePath,'utf8'),readFile(gapPath,'utf8')].map(async x=>JSON.parse(await x)));
const evidence=[];
for(const candidate of VERIFIED_BIN_CANDIDATES){
 const f=join(sourceDir,candidate.sourceFilename),stat=await lstat(f);
 if(!stat.isFile()||stat.isSymbolicLink()||stat.size!==candidate.bytes)throw Error('Unexpected original resource bytes '+candidate.slot);
 const bytes=await readFile(f),sha=createHash('sha256').update(bytes).digest('hex');
 if(sha!==candidate.sha256)throw Error('Original media source SHA mismatch '+candidate.slot);
 const streams=JSON.parse(execFileSync('ffprobe',['-v','error','-count_frames','-show_entries',
     'stream=codec_type,codec_name,width,height,avg_frame_rate,nb_read_frames,sample_rate,channels,duration:format=duration',
     '-of','json',f],{timeout:30000}).toString());
 const stream=streams.streams?.[0],ev={slot:candidate.slot,filename:candidate.sourceFilename,sha256:sha,bytes:stat.size,kind:candidate.kind};
 if(candidate.kind==='image'){if(stream.codec_name!=='mjpeg')throw Error('Expected local JPEG');ev.width=stream.width;ev.height=stream.height;}
 else if(candidate.kind==='video'){if(stream.codec_name!=='h264')throw Error('Expected local H264 video');ev.width=stream.width;ev.height=stream.height;ev.fps=stream.avg_frame_rate==='30/1'?30:null;ev.duration=Number(stream.duration);ev.frames=Number(stream.nb_read_frames)}
 else {if(stream.codec_name!=='pcm_s16le')throw Error('Expected uncompressed PCM audio');ev.sampleRate=Number(stream.sample_rate);ev.channels=Number(stream.channels);ev.duration=Number(stream.duration)}
 evidence.push(ev);
}
const result=stageVerifiedResourceBin(p,side,ledger,evidence);
const written=[];
try{
 for(const [file,text] of [[pOut,JSON.stringify(result.nativeProject,null,2)+'\n'],
                          [sideOut,JSON.stringify(result.crosswalk,null,2)+'\n'],
                          [manifestOut,JSON.stringify(result.availability,null,2)+'\n']]){
  const f=await open(file,'wx',0o600);written.push(file);try{await f.writeFile(text)}finally{await f.close()}
 }
 for(const candidate of VERIFIED_BIN_CANDIDATES){
  const source=join(sourceDir,candidate.sourceFilename),dest=join(mediaDir,candidate.filename);
  await copyFile(source,dest,1);written.push(dest);
  if(createHash('sha256').update(await readFile(dest)).digest('hex')!==candidate.sha256)throw Error('Copy fingerprint mismatch '+candidate.slot);
 }
 console.log(JSON.stringify({schema:result.availability.schema,registered:result.availability.assetCount,
  mediaCount:result.nativeProject.media.length,clips:result.nativeProject.clips.length,
  preservedOperationCount:result.crosswalk.operations.length,
  uninstantiated:result.crosswalk.pendingUninstantiatedOperations,
  allAddedMediaLibraryOnly:result.availability.activeClipsAdded===0,
  outputProject:pOut,manifest:manifestOut,creativeApproved:false,productionChanged:false}));
}catch(e){for(const f of written)await unlink(f).catch(()=>{});throw e}
