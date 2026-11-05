// Operator-owned opt-in for the private preview runtime. Request JSON never controls these paths.
import {accessSync,constants,lstatSync,readFileSync,realpathSync,statSync} from 'node:fs';
import {isAbsolute} from 'node:path';
import {fileSha256} from './local-pipeline.js';
const HASH=/^[a-f0-9]{64}$/;
const fields=['entryFile','remotionCli','browserExecutable'];
const record=x=>x&&typeof x==='object'&&!Array.isArray(x);
export function loadMasterPreviewConfig(path){
 if(path===undefined||path===null||path==='')return null;
 if(typeof path!=='string'||!isAbsolute(path))throw Error('Master preview config must be an absolute path');
 const st=lstatSync(path),uid=typeof process.getuid==='function'?process.getuid():null;
 if(!st.isFile()||st.isSymbolicLink()||st.size>16384||(st.mode&0o022)!==0||
    (uid!==null&&st.uid!==0&&st.uid!==uid))throw Error('Untrusted master preview config');
 const config=JSON.parse(readFileSync(path,'utf8'));
 if(!record(config)||config.schema!=='sues-master-preview-config/v1'||
    Object.keys(config).some(k=>!['schema',...fields].includes(k)))throw Error('Invalid master preview config');
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
 return result;
}
