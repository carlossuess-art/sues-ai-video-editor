import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash,randomUUID} from 'node:crypto';
import {mkdirSync,readFileSync,statSync,createReadStream,renameSync,writeFileSync,unlinkSync,existsSync} from 'node:fs';
import {join} from 'node:path';
const run=promisify(execFile);
const signature=p=>{const s=statSync(p);return [s.dev,s.ino,s.size,s.mtimeMs].join(':');};
async function hash(p){const h=createHash('sha256');for await(const c of createReadStream(p))h.update(c);return h.digest('hex');}
async function probe(p){return JSON.parse((await run('ffprobe',['-v','error','-show_streams','-show_format','-of','json',p],{timeout:30000,maxBuffer:1048576})).stdout);}
export class PlaybackPreviews{
 constructor(directory){this.directory=directory;mkdirSync(directory,{recursive:true,mode:0o700});this.pending=new Map();this.tail=Promise.resolve();this.controllers=new Set();this.closing=false;}
 ensure(id,source){
  if(!/^[a-f0-9-]{36}$/.test(id))return Promise.reject(Error('Unknown preview'));
  if(this.pending.has(id))return this.pending.get(id);
  const promise=this.tail.then(()=>this.build(id,source));this.tail=promise.catch(()=>{});
  this.pending.set(id,promise);promise.then(()=>this.pending.delete(id),()=>this.pending.delete(id));return promise;
 }
 async build(id,source){
  if(this.closing)throw Error('Preview closing');
  const before=signature(source),target=join(this.directory,id+'.mp4'),record=target+'.json';
  try{const cached=JSON.parse(readFileSync(record,'utf8'));if(cached.sourceSignature===before&&statSync(target).size===cached.bytes&&await hash(target)===cached.sha256)return target;}catch{}
  const original=await probe(source),duration=Number(original.format.duration),sourceSha=await hash(source);
  const temp=join(this.directory,'.'+id+'-'+randomUUID()+'.mp4'),controller=new AbortController();this.controllers.add(controller);
  try{
   await run('ffmpeg',['-v','error','-nostdin','-threads','1','-i',source,'-map','0:v:0','-map','0:a:0?','-vf',"scale=w='min(720,iw)':h=-2:flags=fast_bilinear",'-filter_threads','1','-r','30','-c:v','libx264','-threads','1','-preset','veryfast','-crf','28','-maxrate','1200k','-bufsize','2400k','-g','60','-pix_fmt','yuv420p','-c:a','aac','-b:a','96k','-map_metadata','-1','-movflags','+faststart','-y',temp],{timeout:180000,maxBuffer:2097152,signal:controller.signal});
   const output=await probe(temp),v=output.streams.find(s=>s.codec_type==='video');
   if(!v||v.codec_name!=='h264'||v.width>720||Math.abs(Number(output.format.duration)-duration)>.12)throw Error('Preview verification failed');
   await run('ffmpeg',['-v','error','-xerror','-threads','1','-i',temp,'-f','null','-'],{timeout:180000,maxBuffer:1048576,signal:controller.signal});
   if(signature(source)!==before||await hash(source)!==sourceSha)throw Error('Source changed during preview');
   const metadata={version:1,sourceSignature:before,sourceSha256:sourceSha,sha256:await hash(temp),bytes:statSync(temp).size,duration:Number(output.format.duration),width:v.width,height:v.height,exportUnchanged:true};
   renameSync(temp,target);writeFileSync(record,JSON.stringify(metadata),{mode:0o600});return target;
  }finally{this.controllers.delete(controller);if(existsSync(temp))unlinkSync(temp);}
 }
 async close(){this.closing=true;for(const c of this.controllers)c.abort();await this.tail;}
}
