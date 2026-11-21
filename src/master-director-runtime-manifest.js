// Snapshot the exact runtime tree; no package installation or network access.
import {lstatSync,readdirSync,readlinkSync,realpathSync} from 'node:fs';
import {isAbsolute,join,relative,resolve} from 'node:path';
import {fileSha256} from './local-pipeline.js';
export function inventoryMasterRuntime(root){
 if(typeof root!=='string'||!isAbsolute(root)||resolve(root)!==root||realpathSync(root)!==root)throw Error('Invalid runtime root');
 const uid=typeof process.getuid==='function'?process.getuid():null,entries=[];
 function visit(path,rel){
  if(entries.length>=100000)throw Error('Runtime contains too many entries');
  const st=lstatSync(path),mode=st.mode&0o7777;
  if(uid!==null&&st.uid!==0&&st.uid!==uid)throw Error('Untrusted runtime owner');
  if(st.isSymbolicLink()){
   const target=readlinkSync(path),real=realpathSync(path),inside=relative(root,real);
   if(inside==='..'||inside.startsWith('../')||isAbsolute(inside))throw Error('Runtime symlink escapes root');
   entries.push({path:rel,type:'symlink',target});return;
  }
  if((mode&0o022)!==0)throw Error('Writable runtime entry');
  if(st.isDirectory()){
   entries.push({path:rel,type:'directory',mode});
   for(const name of readdirSync(path).sort())visit(join(path,name),rel?rel+'/'+name:name);
  }else if(st.isFile()){
   if(st.size>1024*1024*1024)throw Error('Runtime file too large');
   entries.push({path:rel,type:'file',mode,size:st.size,sha256:fileSha256(path)});
  }else throw Error('Unexpected runtime entry');
 }
 visit(root,'');return {schema:'sues-runtime-manifest/v1',entries};
}
export function verifyMasterRuntimeManifest(root,manifest){
 if(!manifest||manifest.schema!=='sues-runtime-manifest/v1'||!Array.isArray(manifest.entries))throw Error('Invalid runtime manifest');
 const current=inventoryMasterRuntime(root);
 if(JSON.stringify(current)!==JSON.stringify(manifest))throw Error('Master preview runtime changed');
 return true;
}
