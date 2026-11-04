// Private low-resolution preview runner. Inputs are assembled by trusted server
// code after authentication, approval and source preflight; never pass request JSON.
// It performs no publication or API calls and does not mark the output final.
import {mkdtempSync,mkdirSync,writeFileSync,rmSync,statSync,readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {execFile} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {fileSha256} from './local-pipeline.js';
import {stageMasterDirectorImages,stageMasterDirectorFonts,stageMasterDirectorSource} from './master-director-remotion-stage.js';
const HASH=/^[a-f0-9]{64}$/,MIN_FREE=512*1024*1024;
// Consider host availability and, when configured, the current cgroup limit.
// An unobservable budget fails closed rather than risking the live editor.
export function hasPreviewMemoryHeadroom(){
 try{
  const text=readFileSync('/proc/meminfo','utf8'),available=/^MemAvailable:\s+(\d+)\s+kB/m.exec(text);
  if(!available||Number(available[1])*1024<MIN_FREE)return false;
  const membership=readFileSync('/proc/self/cgroup','utf8').match(/^0::(.*)$/m)?.[1];
  if(membership!==undefined){
   const root=join('/sys/fs/cgroup',membership),max=readFileSync(join(root,'memory.max'),'utf8').trim();
   if(max!=='max'){const limit=Number(max),used=Number(readFileSync(join(root,'memory.current'),'utf8').trim());
    if(!Number.isFinite(limit)||!Number.isFinite(used)||limit-used<MIN_FREE)return false;}
  }
  return true;
 }catch{return false;}
}
function boundedRun(executable,args,options,memoryCheck){
 return new Promise((resolveRun,rejectRun)=>{
  let low=false,forceTimer=null;
  const child=execFile(executable,args,options,(error,stdout,stderr)=>{
   clearInterval(timer);if(forceTimer)clearTimeout(forceTimer);
   if(low){const e=new Error('Preview stopped for memory headroom');e.code='PREVIEW_MEMORY_LIMIT';return rejectRun(e);}
   if(error){if(error.killed){error.code='PREVIEW_RENDER_TIMEOUT';}return rejectRun(error);}resolveRun({stdout,stderr});
  });
  const timer=setInterval(()=>{if(!low&&!memoryCheck()){low=true;child.kill('SIGTERM');forceTimer=setTimeout(()=>child.kill('SIGKILL'),5000);}},1000);
 });
}

export async function renderMasterDirectorPreview({composition,project,assets,workRoot,entryFile,remotionCli,browserExecutable,approvalCheck,runner,memoryCheck=hasPreviewMemoryHeadroom}={}){
 if(composition?.schema!=='sues-remotion-layers/v1'||!HASH.test(composition.planFingerprint??'')||
    !HASH.test(composition.sourceSha256??'')||composition.source?.assetId!==composition.sourceSha256||
    !Array.isArray(composition.layers)||!Number.isInteger(composition.durationFrames)||composition.durationFrames<1||
    composition.durationFrames>3600||composition.fps!==30||composition.canvas?.width!==1080||composition.canvas?.height!==1920||
    typeof approvalCheck!=='function'||![workRoot,entryFile,remotionCli,browserExecutable].every(p=>typeof p==='string'&&p.startsWith('/')))
  return {status:'BLOCKED',issues:[{code:'PREVIEW_CONTEXT_INVALID'}]};
 if(typeof memoryCheck!=='function'||!memoryCheck())return {status:'BLOCKED',issues:[{code:'PREVIEW_MEMORY_LIMIT'}]};
 try{if(!await approvalCheck())return {status:'BLOCKED',issues:[{code:'APPROVAL_OR_EVIDENCE_CHANGED'}]};}
 catch{return {status:'BLOCKED',issues:[{code:'APPROVAL_OR_EVIDENCE_CHANGED'}]};}
 const root=resolve(workRoot);mkdirSync(root,{recursive:true,mode:0o700});
 const dir=mkdtempSync(join(root,'master-preview-')),pub=join(dir,'public'),output=join(dir,'preview.mp4');let keep=false;
 try{
  mkdirSync(pub,{mode:0o700});stageMasterDirectorSource(composition,{project,publicDirectory:pub});
  stageMasterDirectorImages(composition,{assets,publicDirectory:pub});stageMasterDirectorFonts(composition,{project,publicDirectory:pub});
  if(!await approvalCheck())return {status:'BLOCKED',issues:[{code:'APPROVAL_OR_EVIDENCE_CHANGED'}]};
  const props=join(dir,'props.json');writeFileSync(props,JSON.stringify({layers:composition.layers,source:composition.source,
   durationFrames:composition.durationFrames,canvasWidth:1080,canvasHeight:1920,fps:30}),{mode:0o600,flag:'wx'});
  const args=[remotionCli,'render',entryFile,'SUES-MASTER-TEXT-TEST',output,
   '--frames=0-'+(composition.durationFrames-1),'--props='+props,'--public-dir='+pub,'--scale=0.25',
   '--concurrency=1','--offthreadvideo-cache-size-in-bytes=67108864','--offthreadvideo-video-threads=1',
   '--media-cache-size-in-bytes=67108864','--disable-shared-memory-capture','--codec=h264','--browser-executable='+browserExecutable];
  const options={cwd:resolve(entryFile,'../..'),timeout:1800000,maxBuffer:2*1024*1024,env:{...process.env,NODE_OPTIONS:'--max-old-space-size=384'}};
  if(runner)await runner(process.execPath,args,options);else await boundedRun(process.execPath,args,options,memoryCheck);
  if(!await approvalCheck()||fileSha256(project.sourcePath)!==composition.sourceSha256)
   return {status:'BLOCKED',issues:[{code:'APPROVAL_OR_SOURCE_CHANGED_DURING_RENDER'}]};
  const size=statSync(output).size;if(!size)throw Error('Empty preview');
  const outputSha256=fileSha256(output),record={schema:'sues-master-preview/v1',id:randomUUID(),
   planFingerprint:composition.planFingerprint,sourceSha256:composition.sourceSha256,outputSha256,bytes:size,createdAt:new Date().toISOString(),
   durationFrames:composition.durationFrames,fps:30,width:270,height:480,final:false,technicalAudit:'pending'};
  // Delete staged source and intermediate props before exposing a preview.
  rmSync(pub,{recursive:true,force:true});rmSync(props,{force:true});
  writeFileSync(join(dir,'preview.json'),JSON.stringify(record)+'\n',{mode:0o600,flag:'wx'});keep=true;
  return {status:'PREVIEW_RENDERED_UNVERIFIED',issues:[],record,outputPath:output};
 }catch(error){return {status:'BLOCKED',issues:[{code:['PREVIEW_MEMORY_LIMIT','PREVIEW_RENDER_TIMEOUT'].includes(error?.code)?error.code:'PREVIEW_RENDER_FAILED'}]};}
 finally{if(!keep)rmSync(dir,{recursive:true,force:true});}
}
