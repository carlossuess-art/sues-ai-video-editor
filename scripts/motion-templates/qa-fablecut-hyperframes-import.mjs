#!/usr/bin/env node
/**
 * Real FableCut MCP *isolated* QA intake of a native HyperFrames MP4.
 * Takes only a technical render proof; NEVER a user Reel, an active data dir,
 * any production project, a published asset or an unverified SVG proxy.
 *
 * Usage: node qa-fablecut-hyperframes-import.mjs \
 *    NATIVE_PROOF.json HYPERFRAMES.mp4 NEW_FABLECUT_QA_DATA_DIR \
 *    ABSOLUTE_FABLECUT_MCP_SERVER_JS
 *
 * Creates a fresh private FABLECUT_DATA_DIR with ONE media item + ONE video
 * clip, binding a SHA-verified native HyperFrames file to an editorial asset.
 * No live FableCut instance, network server, render or production import.
 */
import {spawn} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync,existsSync,statSync} from 'node:fs';
import {resolve,dirname,join,basename} from 'node:path';
import {createHash} from 'node:crypto';
const sha=x=>createHash('sha256').update(x).digest('hex');
const check=(ok,msg)=>{if(!ok)throw Error(msg)};
const args=process.argv.slice(2);
check(args.length===4,'Expected PROOF MP4 NEW_SANDBOX FABLECUT_MCP_SERVER');
const [proofPath,mp4Path,dataDir,serverJs]=args.map(x=>resolve(x));
const proof=JSON.parse(readFileSync(proofPath,'utf8'));
check(proof.schema==='sues-hyperframes-native-media-proof/v1'&&
 proof.status==='TECHNICAL_RENDER_AND_FRAME_ALIGNMENT_VERIFIED','Not a verified native HyperFrames export');
check(proof.sourceFingerprint&&proof.productionChanged===false&&!proof.publishAuthorized,
 'Invalid or publishable media proof');
check(proof.renderedFile.frames===151&&proof.renderedFile.width===1080&&proof.renderedFile.height===1920&&
 proof.renderedFile.fps===30&&proof.renderedFile.audioStreams===0,'Incorrect native media metadata');
check(!existsSync(dataDir)&&dataDir.includes('/fablecut-private-qa/'),
 'QA requires a NEW sandbox inside fablecut-private-qa only');
check(basename(serverJs)==='mcp-server.js'&&existsSync(serverJs),'FableCut MCP server unavailable');
const bytes=readFileSync(mp4Path);
check(bytes.length>5000&&bytes.length<128*1024*1024&&sha(bytes)===proof.renderedFile.sha256,
 'Native HyperFrames media has changed');
mkdirSync(dataDir,{mode:0o700,recursive:false});
writeFileSync(join(dataDir,'ISOLATED_HF_QA_NOT_PRODUCTION.txt'),
 'This FableCut data directory is exclusively synthetic HyperFrames integration QA.\nNever publish or copy it into an active project.\n',
 {mode:0o600,flag:'wx'});
const child=spawn(process.execPath,[serverJs],{
 env:{...process.env,FABLECUT_DATA_DIR:dataDir,FABLECUT_PORT:'17942',HOST:'127.0.0.1'},
 stdio:['pipe','pipe','pipe']});
let pending=new Map(),serial=1,buffer='',stderr='';
child.stdout.setEncoding('utf8');
child.stdout.on('data',chunk=>{
 buffer+=chunk;let n;
 while((n=buffer.indexOf('\n'))>=0){
  const line=buffer.slice(0,n);buffer=buffer.slice(n+1);if(!line.trim())continue;
  let result;try{result=JSON.parse(line)}catch{continue}
  const item=pending.get(result.id);if(!item)continue;
  pending.delete(result.id);clearTimeout(item.timeout);
  if(result.error)item.reject(Error(String(result.error.message)));
  else item.resolve(result.result);
 }
});
child.stderr.on('data',chunk=>{stderr+=chunk.toString().slice(0,3000);});
child.on('exit',code=>{
 for(const item of pending.values()){clearTimeout(item.timeout);item.reject(Error('FableCut MCP exited '+code));}
 pending.clear();
});
function rpc(method,params={}){
 const id=serial++;
 return new Promise((resolve,reject)=>{
  const timeout=setTimeout(()=>{pending.delete(id);reject(Error('FableCut MCP timeout for '+method));},20000);
  pending.set(id,{resolve,reject,timeout});
  child.stdin.write(JSON.stringify({jsonrpc:'2.0',id,method,params})+'\n');
 });
}
async function tool(name,arguments0={}){
 const result=await rpc('tools/call',{name,arguments:arguments0});
 const text=result.content?.find(item=>item.type==='text')?.text;
 check(typeof text==='string','FableCut MCP returned no text '+name);
 if(result.isError)throw Error(name+': '+text.slice(0,240));
 return text;
}
let out;
try{
 const initialized=await rpc('initialize',{protocolVersion:'2025-11-25',
  capabilities:{},clientInfo:{name:'sues-hyperframes-synthetic-qa',version:'1.0'}});
 check(initialized.serverInfo?.name==='fablecut','Not the verified FableCut MCP');
 child.stdin.write(JSON.stringify({jsonrpc:'2.0',method:'notifications/initialized'})+'\n');
 const importResult=await tool('fablecut_import_media',{path:mp4Path});
 const match=importResult.split('\n')[0].match(/^Imported → (\{.+\})$/);
 check(match,'FableCut import failed');
 const media=JSON.parse(match[1]);
 check(media.kind==='video'&&media.src.startsWith('/media/')&&media.id,'Import returned invalid media reference');
 const first=JSON.parse(await tool('fablecut_get_project',{}));
 check(first.media?.length===1&&first.clips?.length===0&&first.media[0].id===media.id,
  'Private FableCut project is not empty after initial media import');
 const duration=proof.renderedFile.durationSec;
 const patch=await tool('fablecut_patch_project',{
  baseRevision:first.revision??0,
  ops:[
   {op:'setProject',set:{name:'SUES HyperFrames · QA AISLADA · NO PUBLICAR',
    width:1080,height:1920,fps:30,background:'#111215'}},
   {op:'addClip',clip:{id:'qa-hyperframes-native-fullframe',kind:'video',mediaId:media.id,
    track:'V1',start:0,in:0,duration:duration,props:{fit:'fill',opacity:1,x:0,y:0,scale:1}}}
  ]
 });
 check(patch.startsWith('Patched'),'FableCut patch not accepted');
 const finalDoc=JSON.parse(await tool('fablecut_get_project',{}));
 check(finalDoc.width===1080&&finalDoc.height===1920&&finalDoc.fps===30,'Incorrect private project dimensions');
 check(finalDoc.media.length===1&&finalDoc.clips.length===1,'Unexpected private project content');
 const clip=finalDoc.clips[0];
 check(clip.mediaId===media.id&&clip.kind==='video'&&clip.track==='V1'&&
  Math.abs(clip.duration-duration)<.002,'FableCut clip metadata mismatched');
 const importedPath=join(dataDir,'media',basename(decodeURIComponent(media.src)));
 check(existsSync(importedPath)&&sha(readFileSync(importedPath))===proof.renderedFile.sha256,
  'FableCut media bytes differ from HyperFrames native output');
 out={schema:'sues-fablecut-hyperframes-private-intake/v1',
  state:'ISOLATED_NATIVE_MEDIA_IMPORTED_IN_QA_ONLY',
  dataDir,sourceFingerprint:proof.sourceFingerprint,nativeMp4Sha256:proof.renderedFile.sha256,
  projectRevision:finalDoc.revision,projectSize:[finalDoc.width,finalDoc.height],fps:finalDoc.fps,
  mediaId:media.id,clipId:clip.id,trackId:clip.track,durationSec:clip.duration,
  importedBytes:statSync(importedPath).size,
  editableSource:'HYPERFRAMES_SOURCE',internalMotionEditableInFableCut:false,
  syntheticNoVoice:true,renderedByFableCut:false,
  productionChanged:false,publicationAuthorized:false,creativeApproved:false,
  pending:['FableCut private export plus visual comparison','Real speech and sourceTimeMap',
   'Full reviewed A/V plan and two-pass QA']};
 writeFileSync(join(dataDir,'hf-intake-qa-receipt.json'),JSON.stringify(out,null,2)+'\n',
  {mode:0o600,flag:'wx'});
 console.log(JSON.stringify({state:out.state,source:out.sourceFingerprint,
  importedMedia:out.mediaId,clips:finalDoc.clips.length,revision:out.projectRevision,
  editableSource:out.editableSource,productionChanged:false}));
}finally{
 child.stdin.end();
 setTimeout(()=>{if(!child.killed)child.kill('SIGTERM');},500).unref();
}
