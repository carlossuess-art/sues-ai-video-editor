import {mkdirSync,lstatSync,realpathSync,openSync,readSync,writeSync,closeSync,linkSync,unlinkSync,statSync} from 'node:fs';
import {join,resolve,relative,sep} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {fileSha256} from './local-pipeline.js';
const assert=(ok,message)=>{if(!ok)throw new Error(`Private storage: ${message}`);};
const ID=/^[A-Za-z0-9_-]{1,80}$/;
export class LocalPrivateStorage{
 constructor({directory,maxBytes=256*1024*1024}){
  assert(Number.isSafeInteger(maxBytes)&&maxBytes>0,'maxBytes');this.maxBytes=maxBytes;
  this.root=resolve(directory);mkdirSync(this.root,{recursive:true,mode:0o700});assert(lstatSync(this.root).isDirectory()&&!lstatSync(this.root).isSymbolicLink(),'root must be a private directory');assert((lstatSync(this.root).mode&0o077)===0,'root permissions must be private');this.root=realpathSync(this.root);
 }
 context(context){assert(context&&ID.test(context.ownerId)&&ID.test(context.projectId),'owner/project id');return [context.ownerId,context.projectId];}
 directory(context,parts=[],create=false){
  const [owner,project]=this.context(context);let current=this.root;
  for(const part of ['owners',owner,'projects',project,...parts]){
   assert(typeof part==='string'&&/^[A-Za-z0-9_-]+$/.test(part),'path component');current=join(current,part);
   if(create){try{mkdirSync(current,{mode:0o700});}catch(error){if(error.code!=='EEXIST')throw error;}}
   const stat=lstatSync(current);assert(stat.isDirectory()&&!stat.isSymbolicLink()&&(stat.mode&0o077)===0,'symlink/non-private directory rejected');
  }
  assert(!relative(this.root,current).startsWith('..'+sep),'path escaped root');return current;
 }
 async put(source,context,{mediaType='application/octet-stream'}={}){
  assert(['video/mp4','application/json','application/octet-stream'].includes(mediaType),'media type');
  const before=lstatSync(source);assert(before.isFile()&&!before.isSymbolicLink(),'source must be a regular file');assert(before.size>0&&before.size<=this.maxBytes,'object size limit');
  const temp=join(this.directory(context,['temporary'],true),randomUUID()),hash=createHash('sha256'),buffer=Buffer.allocUnsafe(1024*1024);let input,output,total=0;
  try{
   input=openSync(source,'r');output=openSync(temp,'wx',0o600);let count;
   while((count=readSync(input,buffer,0,buffer.length,null))>0){total+=count;assert(total<=this.maxBytes,'object size limit');hash.update(buffer.subarray(0,count));let offset=0;while(offset<count)offset+=writeSync(output,buffer,offset,count-offset);}
   closeSync(input);input=undefined;closeSync(output);output=undefined;
   const after=lstatSync(source);assert(total===before.size&&after.size===before.size&&after.mtimeMs===before.mtimeMs&&after.ino===before.ino,'source changed during copy');
   const digest=hash.digest('hex'),target=join(this.directory(context,['objects',digest.slice(0,2)],true),digest);
   try{linkSync(temp,target);}catch(error){if(error.code!=='EEXIST')throw error;assert(lstatSync(target).isFile()&&!lstatSync(target).isSymbolicLink()&&statSync(target).size===total&&fileSha256(target)===digest,'existing object integrity failure');}
   return {version:'1.0',provider:'private-local',ownerId:context.ownerId,projectId:context.projectId,key:'sha256:'+digest,bytes:total,mediaType};
  }finally{if(input!==undefined)closeSync(input);if(output!==undefined)closeSync(output);try{unlinkSync(temp);}catch(error){if(error.code!=='ENOENT')throw error;}}
 }
 async resolve(reference,context){
  this.context(context);assert(reference?.version==='1.0'&&reference.provider==='private-local','reference version/provider');
  assert(reference.ownerId===context.ownerId&&reference.projectId===context.projectId,'owner/project mismatch');
  assert(/^sha256:[a-f0-9]{64}$/.test(reference.key),'object key');assert(Number.isSafeInteger(reference.bytes)&&reference.bytes>0&&reference.bytes<=this.maxBytes,'reference size');
  const digest=reference.key.slice(7),path=join(this.directory(context,['objects',digest.slice(0,2)]),digest),stat=lstatSync(path);
  assert(stat.isFile()&&!stat.isSymbolicLink()&&(stat.mode&0o077)===0&&stat.size===reference.bytes,'object size/type changed');assert(fileSha256(path)===digest,'object checksum changed');return path;
 }
}
