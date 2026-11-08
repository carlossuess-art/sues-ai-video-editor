/** Read-only, fail-closed native FableCut → SUES job binding registry.
 * Only a trusted administrator may provision this file outside the web root.
 * Reading does not create, mutate or infer associations. No HTTP write route.
 */
import {openSync,readFileSync,closeSync,fstatSync,lstatSync,constants} from 'node:fs';
import {resolve,isAbsolute,dirname,parse} from 'node:path';
const NATIVE=/^p_[A-Za-z0-9_-]{2,96}$/;
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const PROJECT=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const own=(st,uid)=>uid===null||st.uid===0||st.uid===uid;
const exact=(o,keys)=>o&&typeof o==='object'&&!Array.isArray(o)&&
  Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
function inspectParents(file,uid){
 for(let d=dirname(file);;d=dirname(d)){
  const st=lstatSync(d);
  if(!st.isDirectory()||st.isSymbolicLink()||!own(st,uid)||
     ((st.mode&0o022)!==0&&(st.mode&0o1000)===0))throw Error('Unsafe registry directory');
  if(d===parse(d).root)break;
 }
}
export function createNativeProjectBindingResolver(filePath){
 if(typeof filePath!=='string'||!isAbsolute(filePath)||resolve(filePath)!==filePath)
  throw Error('Binding registry must be an absolute normalized private path');
 return async nativeProjectId=>{
  if(!NATIVE.test(nativeProjectId??''))return null;
  let fd;
  try{
   const uid=typeof process.getuid==='function'?process.getuid():null;
   inspectParents(filePath,uid);
   // O_NOFOLLOW disallows replacing the final file with a symlink.
   fd=openSync(filePath,constants.O_RDONLY|constants.O_NOFOLLOW);
   const st=fstatSync(fd),lst=lstatSync(filePath);
   if(!st.isFile()||!lst.isFile()||lst.isSymbolicLink()||
      st.dev!==lst.dev||st.ino!==lst.ino||st.nlink!==1||
      !own(st,uid)||(st.mode&0o077)!==0||st.size<2||st.size>32768)return null;
   const text=readFileSync(fd,'utf8');
   // Canonical single-line JSON prevents duplicate keys and conflicting parsing.
   // A privileged tool may generate it with JSON.stringify({schema,bindings}).
   if(text!==text.trim()&&text!==text.trim()+'\n')return null;
   const registry=JSON.parse(text);
   if(JSON.stringify(registry)!==text.trim()||!exact(registry,['schema','bindings'])||
      registry.schema!=='sues-native-project-bindings/v1'||!Array.isArray(registry.bindings)||
      registry.bindings.length>64)return null;
   const seenNative=new Set(),seenJob=new Set();
   for(const b of registry.bindings){
    if(!exact(b,['nativeProjectId','jobId','suesProjectId','verified'])||
       !NATIVE.test(b.nativeProjectId??'')||!UUID.test(b.jobId??'')||
       !PROJECT.test(b.suesProjectId??'')||b.verified!==true||
       seenNative.has(b.nativeProjectId)||seenJob.has(b.jobId))return null;
    seenNative.add(b.nativeProjectId);seenJob.add(b.jobId);
   }
   // Re-read on each invocation; revocation by removing a binding is immediate.
   const result=registry.bindings.find(b=>b.nativeProjectId===nativeProjectId);
   return result?{...result}:null;
  }catch{return null;}finally{if(fd!==undefined)closeSync(fd);}
 };
}
