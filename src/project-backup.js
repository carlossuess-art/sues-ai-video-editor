import {mkdirSync,lstatSync,realpathSync,writeFileSync,readFileSync,existsSync,rmSync,readdirSync,chmodSync} from 'node:fs';
import {copyFile} from 'node:fs/promises';
import {join,resolve,dirname,relative,sep} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {fileSha256} from './local-pipeline.js';
import {fontFiles} from './font-kits.js';
const ROOT=fileURLToPath(new URL('../',import.meta.url));
const assert=(ok,msg)=>{if(!ok)throw new Error('Project backup: '+msg);};
const hash=value=>createHash('sha256').update(value).digest('hex');
export async function createProjectBackup(project,prepared,directory){
 const target=resolve(directory);assert(!existsSync(target),'destination must be new');mkdirSync(dirname(target),{recursive:true,mode:0o700});mkdirSync(target,{mode:0o700});let complete=false;
 try{
  const files=[],write=(path,value)=>{mkdirSync(dirname(join(target,path)),{recursive:true,mode:0o700});writeFileSync(join(target,path),JSON.stringify(value,null,2)+'\n',{mode:0o600,flag:'wx'});};
  const copy=async(source,path,expected)=>{assert(lstatSync(source).isFile()&&!lstatSync(source).isSymbolicLink(),'source must be regular');const sha=fileSha256(source);if(expected)assert(sha===expected,'source changed before backup');mkdirSync(dirname(join(target,path)),{recursive:true,mode:0o700});await copyFile(source,join(target,path));chmodSync(join(target,path),0o600);assert(fileSha256(join(target,path))===sha&&fileSha256(source)===sha,'copy/source changed');return path;};
  const inputs=project.inputs,config={title:project.title,source:{...inputs.source,sha256:project.boundHashes.source},sourcePath:await copy(project.sourcePath,'media/original.media',project.boundHashes.source),fontDirectory:'fonts'};
  for(const [key,value]of Object.entries({template:inputs.template,brandKit:inputs.brand,transcript:inputs.transcript,camera:inputs.camera,vision:{version:'1.0',frames:inputs.visionFrames},catalog:inputs.catalog})){const path='analysis/'+key+'.json';write(path,value);config[key+'Path']=path;files.push(path);}
  if(inputs.subjectLayers){
   const data=structuredClone(inputs.subjectLayers);data.matte.localFile=await copy(data.matte.localFile,'media/subject-matte.mkv',data.matte.sha256);
   for(const [i,e]of data.events.entries())e.localFile=await copy(e.localFile,'media/depth-resource-'+i+'.media',e.sha256);
   write('analysis/subject-layers.json',data);config.subjectLayersPath='analysis/subject-layers.json';
  }
  if(inputs.depthText){write('analysis/depth-text.json',inputs.depthText);config.depthTextPath='analysis/depth-text.json';}
  const music=prepared.resourceBindings?.backgroundAudio;
  if(music){const localFile=await copy(music.localFile,'media/music.media');config.backgroundAudio={...music,localFile};}
  config.illustrations=[];
  for(const [i,item]of (prepared.resourceBindings?.illustrations??[]).entries()){const localFile=await copy(item.localFile,'media/image-'+i+'.media',item.sha256);config.illustrations.push({...item,localFile});}
  for(const name of fontFiles(prepared.plan.policy.captions.font))await copy(join(project.fontDirectory,name),'fonts/'+name);
  const settings={...prepared.settings,musicAssetId:null,imageEvents:[],profileImages:true};write('project.json',config);write('settings.json',settings);
  write('review.json',{duration:prepared.plan.duration,sourceWords:prepared.director.audit.sourceWords,mappedWords:prepared.director.audit.mappedWords,originalFingerprint:prepared.fingerprint,restoration:'Create a new job from project.json and settings.json. This package does not resume an interrupted render.'});
  const entries=[];const collect=path=>{for(const file of readdirSync(path)){const name=join(path,file);const info=lstatSync(name);assert(!info.isSymbolicLink(),'symlinks forbidden');if(info.isDirectory())collect(name);else{assert(info.isFile(),'non-file entry');entries.push({path:relative(target,name).split(sep).join('/'),bytes:info.size,sha256:fileSha256(name)});}}};collect(target);entries.sort((a,b)=>a.path.localeCompare(b.path));
  let codeCommit=null,workingTreeDirty=null;try{codeCommit=execFileSync('git',['rev-parse','HEAD'],{cwd:ROOT}).toString().trim();workingTreeDirty=!!execFileSync('git',['status','--porcelain'],{cwd:ROOT}).toString().trim();}catch{}
  const manifest={version:'1.0',kind:'sues-portable-project',createdAt:new Date().toISOString(),codeCommit,workingTreeDirty,privateMedia:true,originalFingerprint:prepared.fingerprint,files:entries,filesDigest:hash(JSON.stringify(entries))};write('backup-manifest.json',manifest);verifyProjectBackup(target);complete=true;return {directory:target,manifest};
 }finally{if(!complete)rmSync(target,{recursive:true,force:true});}
}
export function verifyProjectBackup(directory){
 const root=resolve(directory);assert(lstatSync(root).isDirectory()&&!lstatSync(root).isSymbolicLink(),'regular backup directory required');const manifestPath=join(root,'backup-manifest.json');assert(lstatSync(manifestPath).isFile()&&!lstatSync(manifestPath).isSymbolicLink(),'regular manifest required');const manifest=JSON.parse(readFileSync(manifestPath,'utf8'));
 assert(manifest.version==='1.0'&&manifest.kind==='sues-portable-project'&&Array.isArray(manifest.files)&&manifest.files.length<=100,'manifest invalid');assert(manifest.filesDigest===hash(JSON.stringify(manifest.files)),'manifest digest mismatch');const seen=new Set();let bytes=0;
 for(const entry of manifest.files){assert(Number.isSafeInteger(entry.bytes)&&entry.bytes>=0&&typeof entry.sha256==='string'&&/^[a-f0-9]{64}$/.test(entry.sha256),'invalid entry size/hash');assert(typeof entry.path==='string'&&/^[a-zA-Z0-9_./-]+$/.test(entry.path)&&!entry.path.startsWith('/')&&entry.path.split('/').every(part=>part&&part!=='.'&&part!=='..')&&!seen.has(entry.path),'invalid entry path');seen.add(entry.path);const path=join(root,entry.path),actual=realpathSync(path);assert(actual.startsWith(realpathSync(root)+sep)&&lstatSync(path).isFile()&&!lstatSync(path).isSymbolicLink(),'entry outside backup');assert(lstatSync(path).size===entry.bytes&&fileSha256(path)===entry.sha256,'file hash mismatch: '+entry.path);bytes+=entry.bytes;assert(bytes<=2*1024**3,'backup size limit');}
 const inspectFiles=dir=>{for(const name of readdirSync(dir)){const path=join(dir,name),info=lstatSync(path);assert(!info.isSymbolicLink(),'symlinks forbidden');if(info.isDirectory())inspectFiles(path);else{assert(info.isFile(),'non-file entry');const rel=relative(root,path).split(sep).join('/');assert(rel==='backup-manifest.json'||seen.has(rel),'unlisted file: '+rel);}}};inspectFiles(root);
 for(const name of ['project.json','settings.json','media/original.media'])assert(seen.has(name),'required file missing');
 const config=JSON.parse(readFileSync(join(root,'project.json'),'utf8'));const paths=[...Object.entries(config).filter(([k])=>k.endsWith('Path')).map(([,v])=>v),...(config.backgroundAudio?[config.backgroundAudio.localFile]:[]),...(config.illustrations??[]).map(i=>i.localFile)];
 assert(paths.every(path=>seen.has(path))&&config.fontDirectory==='fonts','configuration points outside verified files');
 if(config.subjectLayersPath){const data=JSON.parse(readFileSync(join(root,config.subjectLayersPath),'utf8'));const nested=[data.matte?.localFile,...(data.events??[]).map(e=>e.localFile)];assert(nested.every(path=>typeof path==='string'&&seen.has(path)),'subject layer points outside verified files');}
 return {valid:true,files:manifest.files.length,bytes,codeCommit:manifest.codeCommit,workingTreeDirty:manifest.workingTreeDirty};
}
