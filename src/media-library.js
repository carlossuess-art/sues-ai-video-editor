import {mkdirSync,readdirSync,readFileSync,writeFileSync,renameSync,lstatSync,existsSync,linkSync,unlinkSync,statfsSync} from 'node:fs';
import {open,unlink} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileSha256} from './local-pipeline.js';
const run=promisify(execFile),HASH=/^[a-f0-9]{64}$/,MAX=40*1024*1024;
const regular=p=>{try{const s=lstatSync(p);return s.isFile()&&!s.isSymbolicLink();}catch{return false;}};
export class MediaLibrary{
 constructor(directory,{probe}={}){
  this.directory=resolve(directory);mkdirSync(this.directory,{recursive:true,mode:0o700});if(lstatSync(this.directory).isSymbolicLink())throw new Error('Invalid asset directory');
  this.probe=probe??(async (path,kind)=>JSON.parse((await run('ffprobe',['-v','error','-protocol_whitelist','file,pipe','-format_whitelist',kind==='image'?'image2,png_pipe,jpeg_pipe,webp_pipe,bmp_pipe':'wav,mp3,mov,ogg,flac,aac','-show_streams','-show_format','-of','json',path],{timeout:15000,maxBuffer:1024*1024})).stdout));
  for(const name of readdirSync(this.directory))if(/^\.asset-incoming-[a-f0-9-]+$/.test(name))unlinkSync(join(this.directory,name));
 }
 records(){return readdirSync(this.directory).filter(n=>/^[a-f0-9]{64}\.json$/.test(n)).map(n=>{const r=JSON.parse(readFileSync(join(this.directory,n),'utf8'));if(r.id!==n.slice(0,-5)||!HASH.test(r.id)||!['image','audio'].includes(r.kind)||!['owned','licensed'].includes(r.rights)||!Number.isInteger(r.bytes)||r.bytes<1||r.bytes>MAX)throw new Error('Asset metadata invalid');return r;});}
 list(){return this.records().map(({id,kind,title,rights,bytes,duration,width,height,mimeType,createdAt})=>({id,kind,title,rights,bytes,duration,width,height,mimeType,createdAt}));}
 resolve(id,kind){
  if(!HASH.test(id))throw new Error('Asset not found');const item=this.records().find(r=>r.id===id);if(!item||kind&&item.kind!==kind)throw new Error('Asset not found');const path=join(this.directory,id+'.media');
  if(!regular(path)||lstatSync(path).size!==item.bytes||fileSha256(path)!==id)throw new Error('Asset integrity changed');return {...item,sha256:id,assetId:id,localFile:path};
 }
 async receive(req,{kind,rights,title}){
  if(this.busy)throw new Error('Asset upload busy');if(!['image','audio'].includes(kind)||!['owned','licensed'].includes(rights))throw new Error('Selecciona tipo y procedencia del recurso');
  if(typeof title!=='string'||title.trim().length<1||title.length>100||/[\x00-\x1f\x7f]/.test(title))throw new Error('Nombre de recurso no válido');
  const length=Number(req.headers['content-length']);if(!Number.isSafeInteger(length)||length<1||length>MAX)throw new Error('El recurso debe ocupar entre 1 byte y 40 MiB');
  const disk=statfsSync(this.directory);if(disk.bavail*disk.bsize<length+256*1024*1024)throw new Error('Espacio insuficiente');
  this.busy=true;const temporary=join(this.directory,'.asset-incoming-'+randomUUID());let fd;
  try{
   fd=await open(temporary,'wx',0o600);let bytes=0;const hash=createHash('sha256');
   for await(const chunk of req){bytes+=chunk.length;if(bytes>length)throw new Error('Subida demasiado grande');hash.update(chunk);let offset=0;while(offset<chunk.length){const w=await fd.write(chunk,offset,chunk.length-offset);offset+=w.bytesWritten;}}
   await fd.close();fd=null;if(bytes!==length)throw new Error('Subida incompleta');const info=await this.probe(temporary,kind);let props;
   if(kind==='image'){
    const video=info.streams?.find(s=>s.codec_type==='video'),formats={png:'image/png',mjpeg:'image/jpeg',webp:'image/webp',bmp:'image/bmp'};
    if(!video||!formats[video.codec_name]||!['png_pipe','jpeg_pipe','webp_pipe','bmp_pipe','image2'].includes(info.format?.format_name)||!Number.isInteger(video.width)||!Number.isInteger(video.height)||video.width<2||video.height<2||video.width>6000||video.height>6000||video.width*video.height>20000000)throw new Error('Usa una imagen fija PNG, JPEG, WebP o BMP de hasta 20 megapíxeles');
    props={width:video.width,height:video.height,mimeType:formats[video.codec_name]};
   }else{
    const audio=info.streams?.find(s=>s.codec_type==='audio'),duration=Number(info.format?.duration);if(!audio||info.streams.some(s=>s.codec_type==='video'&&!s.disposition?.attached_pic)||!Number.isFinite(duration)||duration<3||duration>600)throw new Error('Usa un audio de entre 3 segundos y 10 minutos');
    const format=info.format?.format_name??'';props={duration,mimeType:format==='wav'?'audio/wav':format==='mp3'?'audio/mpeg':format==='flac'?'audio/flac':format==='ogg'?'audio/ogg':format.includes('mov')?'audio/mp4':'audio/aac'};
   }
   const id=hash.digest('hex'),entries=this.records(),prior=entries.find(r=>r.id===id);if(prior){if(prior.kind!==kind||prior.rights!==rights)throw new Error('El recurso ya existe con otra procedencia declarada');this.resolve(id,kind);return this.list().find(r=>r.id===id);}
   if(entries.length>=24)throw new Error('Límite de 24 recursos alcanzado');
   const path=join(this.directory,id+'.media');if(existsSync(path)){if(!regular(path)||fileSha256(path)!==id)throw new Error('Asset integrity changed');}else linkSync(temporary,path);
   const record={id,kind,title:title.trim(),rights,bytes,createdAt:new Date().toISOString(),...props},metadata=join(this.directory,id+'.json'),tempMeta=join(this.directory,'.asset-incoming-'+randomUUID());
   try{writeFileSync(tempMeta,JSON.stringify(record)+'\n',{flag:'wx',mode:0o600});renameSync(tempMeta,metadata);}finally{if(existsSync(tempMeta))unlinkSync(tempMeta);}
   return this.list().find(r=>r.id===id);
  }finally{if(fd)await fd.close();await unlink(temporary).catch(()=>{});this.busy=false;}
 }
}
