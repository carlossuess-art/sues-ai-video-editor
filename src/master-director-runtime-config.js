// Operator-owned opt-in for the private preview runtime. Request JSON never controls these paths.
import {accessSync,constants,lstatSync,readFileSync,realpathSync,statSync} from 'node:fs';
import {dirname,isAbsolute,join,parse,relative,resolve} from 'node:path';
import {fileSha256} from './local-pipeline.js';
import {verifyMasterRuntimeManifest} from './master-director-runtime-manifest.js';
const HASH=/^[a-f0-9]{64}$/;
const fields=['entryFile','remotionCli','browserExecutable'];
const record=x=>x&&typeof x==='object'&&!Array.isArray(x);
export function loadMasterPreviewConfig(path){
 if(path===undefined||path===null||path==='')return null;
 if(typeof path!=='string'||!isAbsolute(path)||resolve(path)!==path)throw Error('Master preview config must be an absolute normalized path');
 const uid=typeof process.getuid==='function'?process.getuid():null;
 // A trusted file inside a replaceable parent directory is not a trusted configuration.
 // Sticky directories protect entries from replacement by users who do not own them.
 for(let dir=dirname(path);;dir=dirname(dir)){
  const parent=lstatSync(dir);
  if(!parent.isDirectory()||parent.isSymbolicLink()||
     (uid!==null&&parent.uid!==0&&parent.uid!==uid)||
     ((parent.mode&0o022)!==0&&(parent.mode&0o1000)===0))throw Error('Untrusted master preview config directory');
  if(dir===parse(dir).root)break;
 }
 const st=lstatSync(path);
 if(!st.isFile()||st.isSymbolicLink()||st.size>16384||(st.mode&0o022)!==0||
    (uid!==null&&st.uid!==0&&st.uid!==uid))throw Error('Untrusted master preview config');
 const config=JSON.parse(readFileSync(path,'utf8'));
 const v2=config?.schema==='sues-master-preview-config/v2';
 if(!record(config)||(!v2&&config.schema!=='sues-master-preview-config/v1')||
    Object.keys(config).some(k=>!['schema',...fields,...(v2?['integrity']:[])].includes(k)))throw Error('Invalid master preview config');
 const result={};
 for(const name of fields){
  const item=config[name];
  if(!record(item)||Object.keys(item).some(k=>!['path','sha256'].includes(k))||
     typeof item.path!=='string'||!isAbsolute(item.path)||!HASH.test(item.sha256??''))throw Error('Invalid master preview dependency');
  const target=realpathSync(item.path),file=statSync(target);
  if(!file.isFile()||file.size<1||file.size>1024*1024*1024||fileSha256(target)!==item.sha256)throw Error('Master preview dependency changed');
  if(name==='browserExecutable')accessSync(target,constants.X_OK);
  result[name]=target;
 }
 if(v2){
  const integrity=config.integrity;
  if(!record(integrity)||Object.keys(integrity).some(k=>!['root','manifest','sha256','systemLibraries'].includes(k))||
     typeof integrity.root!=='string'||!isAbsolute(integrity.root)||resolve(integrity.root)!==integrity.root||
     typeof integrity.manifest!=='string'||!isAbsolute(integrity.manifest)||resolve(integrity.manifest)!==integrity.manifest||
     !HASH.test(integrity.sha256??'')||(integrity.systemLibraries!==undefined&&typeof integrity.systemLibraries!=='boolean'))throw Error('Invalid runtime integrity configuration');
  // The manifest is operator-owned and not writable by other users. Its parent
  // chain is subject to the same trust rules as the main configuration.
  for(let dir=dirname(integrity.manifest);;dir=dirname(dir)){
   const parent=lstatSync(dir);
   if(!parent.isDirectory()||parent.isSymbolicLink()||(uid!==null&&parent.uid!==0&&parent.uid!==uid)||
      ((parent.mode&0o022)!==0&&(parent.mode&0o1000)===0))throw Error('Untrusted runtime manifest directory');
   if(dir===parse(dir).root)break;
  }
  const ms=lstatSync(integrity.manifest);
  if(!ms.isFile()||ms.isSymbolicLink()||ms.size<1||ms.size>16*1024*1024||(ms.mode&0o022)!==0||
     (uid!==null&&ms.uid!==0&&ms.uid!==uid)||fileSha256(integrity.manifest)!==integrity.sha256)throw Error('Untrusted runtime manifest');
  for(let dir=dirname(integrity.root);;dir=dirname(dir)){
   const parent=lstatSync(dir);
   if(!parent.isDirectory()||parent.isSymbolicLink()||(uid!==null&&parent.uid!==0&&parent.uid!==uid)||
      ((parent.mode&0o022)!==0&&(parent.mode&0o1000)===0))throw Error('Untrusted runtime root directory');
   if(dir===parse(dir).root)break;
  }
  for(const path of Object.values(result)){const rel=relative(integrity.root,path);if(!rel||rel==='..'||rel.startsWith('../')||isAbsolute(rel))throw Error('Runtime dependency outside pinned root');}
  verifyMasterRuntimeManifest(integrity.root,JSON.parse(readFileSync(integrity.manifest,'utf8')));
  if(integrity.systemLibraries===true){const libraries=join(integrity.root,'system-libs'),st=lstatSync(libraries);if(!st.isDirectory()||st.isSymbolicLink())throw Error('Invalid runtime libraries');result.browserLibraryPath=libraries;}
 }
 return result;
}
