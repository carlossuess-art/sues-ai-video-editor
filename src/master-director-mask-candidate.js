// Local, opt-in mask candidate preparation. Never marks segmentation verified,
// changes the approved plan, edits the policy, publishes, or calls paid APIs.
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdirSync,mkdtempSync,rmSync,readdirSync,lstatSync,readFileSync,writeFileSync} from 'node:fs';
import {join,isAbsolute,basename} from 'node:path';
import {fileSha256} from './local-pipeline.js';
const run=promisify(execFile),HASH=/^[a-f0-9]{64}$/,ID=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/;
const blocked=code=>({status:'BLOCKED',issues:[{code}],verified:false});
export async function prepareMasterMaskCandidate({graph,composition,project,operationId,mode,root,pythonPath,pythonSha256,scriptPath,scriptSha256,modelSha256,approvalCheck,runner=run}={}){
 const node=Array.isArray(graph?.nodes)?graph.nodes.find(n=>n.id===operationId):null,rect=node?.visual?.rect;
 const source=composition?.source,canvas=composition?.canvas,sourcePath=project?.sourcePath;
 if(graph?.schema!=='sues-layer-graph/v1'||!HASH.test(graph.sourceSha256??'')||!HASH.test(graph.planFingerprint??'')||
    !ID.test(graph.timelineFingerprint??'')||graph.fps!==30||!ID.test(operationId??'')||
    !node||node.renderer!=='remotion'||!rect||!['x','y','width','height'].every(k=>Number.isInteger(rect[k]))||
    !canvas||canvas.width!==1080||canvas.height!==1920||project?.inputs?.source?.width!==canvas.width||
    project?.inputs?.source?.height!==canvas.height||rect.x<0||rect.y<0||rect.width<1||rect.height<1||
    rect.x+rect.width>canvas.width||rect.y+rect.height>canvas.height||
    !Number.isInteger(node.startFrame)||!Number.isInteger(node.endFrame)||node.startFrame<0||
    node.endFrame<=node.startFrame||node.endFrame-node.startFrame>120||
    composition?.schema!=='sues-remotion-layers/v1'||composition.fps!==30||composition.durationFrames!==graph.durationFrames||
    composition.sourceSha256!==graph.sourceSha256||project?.boundHashes?.source!==graph.sourceSha256||
    source?.assetId!==graph.sourceSha256||!Array.isArray(source.spans)||!['keep-subject','keep-background'].includes(mode)||
    typeof sourcePath!=='string'||!isAbsolute(sourcePath)||typeof root!=='string'||!isAbsolute(root)||
    typeof pythonPath!=='string'||!isAbsolute(pythonPath)||!HASH.test(pythonSha256??'')||
    typeof scriptPath!=='string'||!isAbsolute(scriptPath)||!HASH.test(scriptSha256??'')||!HASH.test(modelSha256??'')||
    typeof approvalCheck!=='function'||typeof runner!=='function')return blocked('MASK_CANDIDATE_INPUT_UNSUPPORTED');
 const sourceFrames=[];
 for(let frame=node.startFrame;frame<node.endFrame;frame++){
  const matching=source.spans.filter(s=>Number.isInteger(s?.startFrame)&&Number.isInteger(s?.endFrame)&&
    Number.isInteger(s?.sourceInFrame)&&frame>=s.startFrame&&frame<s.endFrame);
  if(matching.length!==1)return blocked('MASK_CANDIDATE_TIMEMAP_INVALID');
  const span=matching[0],original=span.sourceInFrame+frame-span.startFrame;
  if(original<0||(sourceFrames.length&&original<=sourceFrames.at(-1)))return blocked('MASK_CANDIDATE_TIMEMAP_UNSUPPORTED');
  sourceFrames.push(original);
 }
 const groups=[];for(const frame of sourceFrames){
  const prev=groups.at(-1);if(prev&&frame===prev.end+1)prev.end=frame;else groups.push({start:frame,end:frame});
 }
 let dir=null;
 try{
  if(!await approvalCheck()||fileSha256(sourcePath)!==graph.sourceSha256||fileSha256(pythonPath)!==pythonSha256||fileSha256(scriptPath)!==scriptSha256)
   return blocked('MASK_CANDIDATE_SOURCE_OR_RUNTIME_CHANGED');
  mkdirSync(root,{recursive:true,mode:0o700});dir=mkdtempSync(join(root,'candidate-'));
  const input=join(dir,'input'),output=join(dir,'masks');mkdirSync(input,{mode:0o700});
  const select=groups.map(g=>'between(n\\,'+g.start+'\\,'+g.end+')').join('+');
  await runner('ffmpeg',['-v','error','-xerror','-protocol_whitelist','file,pipe','-i',sourcePath,'-vf','select='+select,
   '-vsync','0','-frames:v',String(sourceFrames.length),'-start_number','0',join(input,'frame-%06d.png')],
   {timeout:600000,maxBuffer:1048576});
  const files=readdirSync(input).sort();
  if(files.length!==sourceFrames.length||files.some((name,i)=>name!=='frame-'+String(i).padStart(6,'0')+'.png'))
   throw Error('Frame extraction incomplete');
  let bytes=0;for(const name of files){const st=lstatSync(join(input,name));if(!st.isFile()||st.isSymbolicLink())throw Error('Invalid frame');bytes+=st.size;}
  if(bytes>512*1024*1024||fileSha256(sourcePath)!==graph.sourceSha256||!await approvalCheck())throw Error('Source or approval changed');
  await runner(pythonPath,[scriptPath,'--input-dir',input,'--output-dir',output,'--source-sha256',graph.sourceSha256,
   '--timeline-fingerprint',graph.timelineFingerprint,'--start-frame',String(node.startFrame),'--rect',
   String(rect.x),String(rect.y),String(rect.width),String(rect.height),'--mode',mode],{timeout:600000,maxBuffer:1048576});
  const reportPath=join(output,'candidate.json'),st=lstatSync(reportPath);
  if(!st.isFile()||st.isSymbolicLink()||st.size>262144)throw Error('Invalid candidate report');
  const report=JSON.parse(readFileSync(reportPath,'utf8'));
  if(report.schema!=='sues-mask-candidate/v1'||report.status!=='CANDIDATE_NOT_VERIFIED'||
     report.sourceSha256Claim!==graph.sourceSha256||report.timelineFingerprintClaim!==graph.timelineFingerprint||
     report.mode!==mode||report.fps!==30||report.coordinateSpace!=='layer'||
     JSON.stringify(report.rect)!==JSON.stringify([rect.x,rect.y,rect.width,rect.height])||
     typeof report.model!=='string'||report.modelSha256!==modelSha256||!Array.isArray(report.frames)||report.frames.length!==sourceFrames.length)
   throw Error('Candidate report does not match request');
  for(let i=0;i<report.frames.length;i++){
   const frame=report.frames[i],name='mask-'+String(i).padStart(6,'0')+'.png',path=join(output,name),asset=lstatSync(path);
   if(frame.file!==name||frame.editFrame!==node.startFrame+i||!asset.isFile()||asset.isSymbolicLink()||asset.size<1||asset.size>20*1024*1024||
      frame.inputSha256!==fileSha256(join(input,files[i]))||frame.sha256!==fileSha256(path))throw Error('Candidate integrity failed');
  }
  const expectedOutputs=['candidate.json',...report.frames.map(frame=>frame.file)].sort();
  if(JSON.stringify(readdirSync(output).sort())!==JSON.stringify(expectedOutputs)||fileSha256(sourcePath)!==graph.sourceSha256||fileSha256(pythonPath)!==pythonSha256||fileSha256(scriptPath)!==scriptSha256||!await approvalCheck())throw Error('Candidate contents, runtime, source or approval changed');
  rmSync(input,{recursive:true,force:true});
  const manifest={schema:'sues-master-mask-candidate/v1',status:'CANDIDATE_NOT_VERIFIED',verified:false,
   planFingerprint:graph.planFingerprint,sourceSha256:graph.sourceSha256,timelineFingerprint:graph.timelineFingerprint,
   operationId,mode,frames:report.frames,model:report.model,modelSha256:report.modelSha256,
   limitations:['candidate-requires-human-review','not-policy-evidence','not-applied-to-plan']};
  writeFileSync(join(dir,'manifest.json'),JSON.stringify(manifest),{mode:0o600,flag:'wx'});
  return {status:manifest.status,candidateId:basename(dir),manifest,verified:false};
 }catch{if(dir)rmSync(dir,{recursive:true,force:true});return blocked('MASK_CANDIDATE_GENERATION_FAILED');}
}

export function openMasterMaskCandidate({root,candidateId,file,planFingerprint,sourceSha256}={}){
 if(typeof root!=='string'||!isAbsolute(root)||!/^candidate-[A-Za-z0-9]{6}$/.test(candidateId??'')||
    !/^mask-[0-9]{6}\.png$/.test(file??'')||!HASH.test(planFingerprint??'')||!HASH.test(sourceSha256??''))
  throw Error('Invalid mask candidate request');
 const dir=join(root,candidateId),d=lstatSync(dir),masks=join(dir,'masks'),md=lstatSync(masks);
 if(!d.isDirectory()||d.isSymbolicLink()||!md.isDirectory()||md.isSymbolicLink())throw Error('Invalid candidate directory');
 const meta=join(dir,'manifest.json'),st=lstatSync(meta);
 if(!st.isFile()||st.isSymbolicLink()||st.size>262144)throw Error('Invalid candidate manifest');
 const report=JSON.parse(readFileSync(meta,'utf8'));
 if(report.schema!=='sues-master-mask-candidate/v1'||report.planFingerprint!==planFingerprint||
    report.sourceSha256!==sourceSha256||!Array.isArray(report.frames))throw Error('Candidate belongs to another plan');
 const entries=report.frames.filter(frame=>frame?.file===file);if(entries.length!==1||!HASH.test(entries[0].sha256??''))throw Error('Candidate frame not found');
 const path=join(masks,file),image=lstatSync(path);
 if(!image.isFile()||image.isSymbolicLink()||fileSha256(path)!==entries[0].sha256)throw Error('Candidate frame integrity failure');
 return {path,mime:'image/png',sha256:entries[0].sha256};
}
