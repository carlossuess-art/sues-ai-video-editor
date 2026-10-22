import {mkdirSync,readdirSync,readFileSync,writeFileSync,renameSync,lstatSync,existsSync,linkSync,unlinkSync,statfsSync} from 'node:fs';
import {open,unlink} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileSha256} from './local-pipeline.js';
import {validateAssetMetadata,publicAssetMetadata,RESERVED_SFX_ALIASES} from './asset-metadata.js';
const run=promisify(execFile),HASH=/^[a-f0-9]{64}$/,MAX=40*1024*1024;
const ASSET_LIMIT=128,LIBRARY_BYTE_LIMIT=2*1024*1024*1024;
const regular=p=>{try{const s=lstatSync(p);return s.isFile()&&!s.isSymbolicLink();}catch{return false;}};
export class MediaLibrary{
 constructor(directory,{probe,maxAssets=ASSET_LIMIT,maxLibraryBytes=LIBRARY_BYTE_LIMIT}={}){
  if(!Number.isSafeInteger(maxAssets)||maxAssets<1||maxAssets>ASSET_LIMIT||!Number.isSafeInteger(maxLibraryBytes)||maxLibraryBytes<1||maxLibraryBytes>LIBRARY_BYTE_LIMIT)throw Error('Límites de biblioteca no válidos');
  this.maxAssets=maxAssets;this.maxLibraryBytes=maxLibraryBytes;
  this.directory=resolve(directory);mkdirSync(this.directory,{recursive:true,mode:0o700});if(lstatSync(this.directory).isSymbolicLink())throw new Error('Invalid asset directory');
  this.probe=probe??(async (path,kind)=>JSON.parse((await run('ffprobe',['-v','error','-protocol_whitelist','file,pipe','-format_whitelist',kind==='image'?'image2,png_pipe,jpeg_pipe,webp_pipe,bmp_pipe':(['video','overlay'].includes(kind)?'mov,mp4,m4a,3gp,3g2,mj2':'wav,mp3,mov,ogg,flac,aac'),'-show_streams','-show_format','-of','json',path],{timeout:15000,maxBuffer:1024*1024})).stdout));
  for(const name of readdirSync(this.directory))if(/^\.asset-incoming-[a-f0-9-]+$/.test(name))unlinkSync(join(this.directory,name));
 }
 records(){return readdirSync(this.directory).filter(n=>/^[a-f0-9]{64}\.json$/.test(n)).map(n=>{const r=JSON.parse(readFileSync(join(this.directory,n),'utf8'));if(r.id!==n.slice(0,-5)||!HASH.test(r.id)||!['image','audio','sfx','video','overlay'].includes(r.kind)||!['owned','licensed'].includes(r.rights)||!Number.isInteger(r.bytes)||r.bytes<1||r.bytes>MAX)throw new Error('Asset metadata invalid');return r;});}
 list(){return this.records().map(({id,kind,title,rights,bytes,duration,width,height,mimeType,createdAt,fps,hasAlpha,hasAudio})=>({id,kind,title,rights,bytes,duration,width,height,mimeType,createdAt,...(fps?{fps}:{}),...(hasAlpha!==undefined?{hasAlpha}:{}),...(hasAudio!==undefined?{hasAudio}:{})}));}
 capacity(){const items=this.records(),usedBytes=items.reduce((sum,item)=>sum+item.bytes,0);return {installed:items.length,maxAssets:this.maxAssets,remainingSlots:Math.max(0,this.maxAssets-items.length),usedBytes,maxBytes:this.maxLibraryBytes,remainingBytes:Math.max(0,this.maxLibraryBytes-usedBytes)};}
 metadata(id){
  const asset=this.resolve(id),path=join(this.directory,'metadata-v2',id+'.json');
  const dir=join(this.directory,'metadata-v2');if(existsSync(dir)&&lstatSync(dir).isSymbolicLink())throw Error('Directorio de metadatos no seguro.');
  if(!existsSync(path))return null;
  if(!regular(path)||lstatSync(path).size>65536)throw Error('Metadatos V2 no seguros.');
  return validateAssetMetadata(JSON.parse(readFileSync(path,'utf8')),asset);
 }
 saveMetadata(id,value){
  const asset=this.resolve(id),metadata=validateAssetMetadata(value,asset),content=JSON.stringify(metadata)+'\n';
  if(Buffer.byteLength(content)>65536)throw Error('Metadatos V2 demasiado grandes.');
  const dir=join(this.directory,'metadata-v2');mkdirSync(dir,{recursive:true,mode:0o700});
  if(lstatSync(dir).isSymbolicLink())throw Error('Directorio de metadatos no seguro.');
  if(metadata.logicalAlias&&this.records().some(r=>r.id!==id&&this.metadata(r.id)?.logicalAlias===metadata.logicalAlias))throw Error('El alias ya está asociado a otro recurso.');
  const temporary=join(dir,'.'+randomUUID()+'.tmp');
  try{writeFileSync(temporary,content,{flag:'wx',mode:0o600});renameSync(temporary,join(dir,id+'.json'));}finally{if(existsSync(temporary))unlinkSync(temporary);}
  return publicAssetMetadata(metadata);
 }
 semanticCatalog(){
  const rows=this.records().map(asset=>({asset,metadata:this.metadata(asset.id)}));
  return {schema:'sues-resource-catalog/v2',assets:rows.map(({asset:r,metadata:m})=>({id:r.id,kind:r.kind,title:r.title,metadata:publicAssetMetadata(m),status:m?.approvedForProduction?'approved':'unavailable'})),aliases:RESERVED_SFX_ALIASES.map(alias=>this.aliasFromRows(alias,rows))};
 }
 resolveAlias(alias,{capabilities=[],profile}={}){
  return this.aliasFromRows(alias,this.records().map(asset=>({asset,metadata:this.metadata(asset.id)})),{capabilities,profile});
 }
 aliasFromRows(alias,rows,{capabilities=[],profile}={}){
  const matches=rows.filter(r=>r.metadata?.logicalAlias===alias);
  if(matches.length!==1)return {alias,status:'unavailable',reason:matches.length?'ambiguous-alias':'unmapped-alias'};
  const {asset,metadata:m}=matches[0];
  if(!m.approvedForProduction)return {alias,status:'unavailable',reason:'not-approved'};
  if(profile&&!m.semantics.profileCompatibility.includes(profile))return {alias,status:'unavailable',reason:'profile-incompatible'};
  const missing=m.constraints.requiredCapabilities.filter(c=>!capabilities.includes(c));
  if(missing.length)return {alias,status:'unavailable',reason:'missing-capability',missing};
  // metadata() rechecks the actual file hash through resolve(); never return a placeholder/path.
  return {alias,status:'available',assetId:asset.id,sha256:asset.id,kind:asset.kind};
 }
 resolve(id,kind){
  if(!HASH.test(id))throw new Error('Asset not found');const item=this.records().find(r=>r.id===id);if(!item||kind&&item.kind!==kind)throw new Error('Asset not found');const path=join(this.directory,id+'.media');
  if(!regular(path)||lstatSync(path).size!==item.bytes||fileSha256(path)!==id)throw new Error('Asset integrity changed');return {...item,sha256:id,assetId:id,localFile:path};
 }
 async receive(req,{kind,rights,title}){
  if(this.busy)throw new Error('Asset upload busy');if(!['image','audio','sfx','video','overlay'].includes(kind)||!['owned','licensed'].includes(rights))throw new Error('Selecciona tipo y procedencia del recurso');
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
   }else if(kind==='video'||kind==='overlay'){
    const streams=info.streams??[],videos=streams.filter(s=>s.codec_type==='video'),v=videos[0],duration=Number(info.format?.duration),format=info.format?.format_name??'';
    const fpsText=v?.avg_frame_rate??v?.r_frame_rate??'0/0',parts=fpsText.split('/').map(Number),fps=parts.length===2&&parts[1]>0?parts[0]/parts[1]:0;
    const supported=['h264','hevc','mpeg4','prores'],isMov=/^qt/.test(info.format?.tags?.major_brand??'');
    if(!format.includes('mov')||videos.length!==1||!v||!supported.includes(v.codec_name)||
       !Number.isInteger(v.width)||!Number.isInteger(v.height)||v.width<160||v.height<160||
       v.width>4096||v.height>4096||v.width*v.height>9000000||
       !Number.isFinite(duration)||duration<.2||duration>90||!Number.isFinite(fps)||fps<1||fps>120||
       streams.some(s=>!['video','audio'].includes(s.codec_type)&&!(s.codec_type==='data'&&s.codec_tag_string==='tmcd')))
      throw new Error('Usa un vídeo MP4/MOV válido de 0.2–90 segundos, máximo 4096 píxeles y 40 MiB');
    const hasAlpha=/^yuva|rgba|argb|bgra|gbrap/.test(v.pix_fmt??'')||v.tags?.alpha_mode==='1';
    props={width:v.width,height:v.height,duration,fps:Number(fps.toFixed(4)),
      mimeType:isMov?'video/quicktime':'video/mp4',hasAlpha,hasAudio:streams.some(s=>s.codec_type==='audio')};
   }else{
    const audio=info.streams?.find(s=>s.codec_type==='audio'),duration=Number(info.format?.duration);if(!audio||info.streams.some(s=>s.codec_type==='video'&&!s.disposition?.attached_pic)||!Number.isFinite(duration)||duration<(kind==='sfx'?.03:3)||duration>(kind==='sfx'?30:600))throw new Error(kind==='sfx'?'Usa un efecto de sonido de entre 0.03 y 30 segundos':'Usa un audio de entre 3 segundos y 10 minutos');
    const format=info.format?.format_name??'';props={duration,mimeType:format==='wav'?'audio/wav':format==='mp3'?'audio/mpeg':format==='flac'?'audio/flac':format==='ogg'?'audio/ogg':format.includes('mov')?'audio/mp4':'audio/aac'};
   }
   const id=hash.digest('hex'),entries=this.records(),prior=entries.find(r=>r.id===id);if(prior){if(prior.kind!==kind||prior.rights!==rights)throw new Error('El recurso ya existe con otra procedencia declarada');this.resolve(id,kind);return this.list().find(r=>r.id===id);}
   if(entries.length>=this.maxAssets)throw new Error('Límite de '+this.maxAssets+' recursos alcanzado');
   if(entries.reduce((sum,item)=>sum+item.bytes,0)+bytes>this.maxLibraryBytes)throw new Error('Cuota total de la biblioteca alcanzada');
   const path=join(this.directory,id+'.media');if(existsSync(path)){if(!regular(path)||fileSha256(path)!==id)throw new Error('Asset integrity changed');}else linkSync(temporary,path);
   const record={id,kind,title:title.trim(),rights,bytes,createdAt:new Date().toISOString(),...props},metadata=join(this.directory,id+'.json'),tempMeta=join(this.directory,'.asset-incoming-'+randomUUID());
   try{writeFileSync(tempMeta,JSON.stringify(record)+'\n',{flag:'wx',mode:0o600});renameSync(tempMeta,metadata);}finally{if(existsSync(tempMeta))unlinkSync(tempMeta);}
   return this.list().find(r=>r.id===id);
  }finally{if(fd)await fd.close();await unlink(temporary).catch(()=>{});this.busy=false;}
 }
}
