#!/usr/bin/env node
/** Construct an unapproved, editable native FableCut review timeline from an
 * already verified native clone plus the authoritative 49-operation gap ledger.
 * No files in the existing project or production are mutated.
 */
import {readFile,open,unlink,lstat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,join,basename,dirname} from 'node:path';
import {stageReel158404NativeAssembly} from '../../src/engine-next/reel-158404-native-assembly.js';
const [projectArg,gapArg,mediaArg,nativeArg,crosswalkArg]=process.argv.slice(2);
if([projectArg,gapArg,mediaArg,nativeArg,crosswalkArg].some(x=>typeof x!=='string'||!x.startsWith('/')||resolve(x)!==x))
  throw Error('Usage: stage-reel-158404-native-assembly.mjs <absolute-existing-project.json> <absolute-gap-ledger.json> <absolute-media-dir> <new-absolute-project.json> <new-absolute-crosswalk.json>');
const inputs=[projectArg,gapArg],outputs=[nativeArg,crosswalkArg];
if(new Set([...inputs,...outputs]).size!==4||outputs.some(p=>dirname(p)===mediaArg))throw Error('Outputs cannot replace inputs or live media');
const qaFiles=await Promise.all(['sues-158404-original.mp4','sues-158404-voice.m4a'].map(async name=>{
 const file=join(mediaArg,name),stat=await lstat(file);
 if(!stat.isFile()||stat.isSymbolicLink()||stat.size<500000)throw Error('Missing or symlinked authentic '+name);
 const hash=createHash('sha256'),f=await open(file,'r');
 try{for await(const bytes of f.createReadStream({autoClose:false}))hash.update(bytes);}finally{await f.close()}
 return {name,sha256:hash.digest('hex'),bytes:stat.size};
}));
const source=qaFiles.find(x=>x.name==='sues-158404-original.mp4'),voice=qaFiles.find(x=>x.name==='sues-158404-voice.m4a');
const base=JSON.parse(await readFile(projectArg,'utf8')),gap=JSON.parse(await readFile(gapArg,'utf8'));
const {nativeProject,coverage}=stageReel158404NativeAssembly(base,gap,{actualSourceSha256:source.sha256,actualVoiceSha256:voice.sha256});
const native=JSON.stringify(nativeProject,null,2)+'\n',audit=JSON.stringify({...coverage,sourceBytes:source.bytes,voiceBytes:voice.bytes},null,2)+'\n';
const created=[];
try{
 for(const [file,text] of [[nativeArg,native],[crosswalkArg,audit]]){
  const f=await open(file,'wx',0o600);
  created.push(file);try{await f.writeFile(text,'utf8');}finally{await f.close()}
 }
 const one=await readFile(nativeArg),two=await readFile(crosswalkArg);
 if(one.toString()!==native||two.toString()!==audit)throw Error('Native project or sidecar failed roundtrip verification');
 console.log(JSON.stringify({schema:coverage.schema,nativeProject:nativeArg,crosswalk:crosswalkArg,
  sourceSha256:source.sha256,voiceSha256:voice.sha256,scenes:coverage.sceneCount,operations:coverage.operationCount,
  nativeClips:coverage.nativeClipCount,uninstantiated:coverage.pendingUninstantiatedOperations,
  sourceContinuousCameraOps:coverage.cameraOperationsCoveredByContinuousSource,
  sourceAndVoicePreserved:true,creativeApproved:false,productionChanged:false,
  projectSha256:createHash('sha256').update(one).digest('hex'),crosswalkSha256:createHash('sha256').update(two).digest('hex')}));
}catch(e){for(const p of created)await unlink(p).catch(()=>{});throw e;}
