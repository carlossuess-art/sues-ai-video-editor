#!/usr/bin/env node
/** Add the already sourced B01 video to a separate native QA copy. Not final. */
import {readFile,open,unlink,lstat,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,join,dirname} from 'node:path';
import {execFileSync} from 'node:child_process';
import {stageReel158404B01Candidate,B01_NATIVE_CANDIDATE} from '../../src/engine-next/reel-158404-b01-native-candidate.js';
const [projectPath,crosswalkPath,gapPath,b01Path,outputProject,outputCrosswalk,outputAsset]=process.argv.slice(2);
const args=[projectPath,crosswalkPath,gapPath,b01Path,outputProject,outputCrosswalk,outputAsset];
if(args.some(x=>typeof x!=='string'||!x.startsWith('/')||resolve(x)!==x)||new Set(args).size!==args.length)
 throw Error('Requires 7 different absolute paths: existing native project, crosswalk, gap ledger, original verified B01, NEW project, NEW crosswalk, NEW copied B01 asset');
if(outputAsset!==join(dirname(outputProject),'media',B01_NATIVE_CANDIDATE.mediaFilename))
 throw Error('B01 media must be a unique file inside the isolated native project media folder');
const stat=await lstat(b01Path);
if(!stat.isFile()||stat.isSymbolicLink()||stat.size!==1312406)throw Error('Unexpected downloaded source asset, no replacement is permitted');
const bytes=await readFile(b01Path),sha=createHash('sha256').update(bytes).digest('hex');
if(sha!==B01_NATIVE_CANDIDATE.assetSha256)throw Error('B01 source fingerprint mismatch');
const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-count_frames','-select_streams','v:0','-show_entries','stream=codec_name,width,height,avg_frame_rate,nb_read_frames,duration','-of','json',b01Path],{timeout:20000}).toString());
const s=probe.streams?.[0];
const ev={codec:s?.codec_name,width:s?.width,height:s?.height,fps:s?.avg_frame_rate==='30/1'?30:NaN,duration:Number(s?.duration),frames:Number(s?.nb_read_frames)};
const p=JSON.parse(await readFile(projectPath,'utf8')),c=JSON.parse(await readFile(crosswalkPath,'utf8')),g=JSON.parse(await readFile(gapPath,'utf8'));
const result=stageReel158404B01Candidate(p,c,g,{fileSha256:sha,fileBytes:stat.size,videoEvidence:ev});
const created=[];
try{
 for(const [out,text] of [[outputProject,JSON.stringify(result.nativeProject,null,2)+'\n'],
                         [outputCrosswalk,JSON.stringify(result.crosswalk,null,2)+'\n']]){
   const fh=await open(out,'wx',0o600);created.push(out);
   try{await fh.writeFile(text,'utf8')}finally{await fh.close()}
 }
 await copyFile(b01Path,outputAsset,1);created.push(outputAsset);
 if(createHash('sha256').update(await readFile(outputAsset)).digest('hex')!==sha)throw Error('B01 copy is not byte identical');
 console.log(JSON.stringify({schema:'sues-native-b01-private-stage/v1',project:outputProject,crosswalk:outputCrosswalk,
  b01Asset:outputAsset,sha256:sha,frameCount:72,clipCount:result.nativeProject.clips.length,
  operationCount:result.crosswalk.operations.length,pendingUninstantiated:result.crosswalk.pendingUninstantiatedOperations,
  transitionInFrames:6,transitionOutFrames:6,creativeApproved:false,publicUsePermitted:false,productionChanged:false}));
}catch(e){for(const out of created)await unlink(out).catch(()=>{});throw e}
