import {
 mkdirSync,readFileSync,writeFileSync,readdirSync,lstatSync,existsSync,
 linkSync,unlinkSync,statfsSync,renameSync,rmSync
} from 'node:fs';
import {open,unlink} from 'node:fs/promises';
import {resolve,dirname,join} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import {fontFiles,resolveFontDirectory} from './font-kits.js';
import {validateTranscript} from './transcript.js';
import {loadProject,prepareProject,fileSha256} from './local-pipeline.js';

const FONT_DIR=fileURLToPath(new URL('../assets/fonts/',import.meta.url));
const run=promisify(execFile),MAX=250*1024*1024,HASH=/^[a-f0-9]{64}$/;
const FONT_FILES=['OpenSans.ttf','OpenSans-Bold.ttf','OFL.txt'];
const read=path=>JSON.parse(readFileSync(path,'utf8'));
const regular=path=>{try{const s=lstatSync(path);return s.isFile()&&!s.isSymbolicLink();}catch{return false;}};
const fonts=directory=>FONT_FILES.every(name=>regular(join(directory,name)))?directory:FONT_DIR;
function atomicJSON(path,value){
 const temporary=join(dirname(path),'.metadata-'+randomUUID());
 try{writeFileSync(temporary,JSON.stringify(value)+'\n',{mode:0o600,flag:'wx'});renameSync(temporary,path);}
 finally{if(existsSync(temporary))unlinkSync(temporary);}
}
export function projectConfig(path){
 const base=dirname(resolve(path)),config=read(path);
 for(const key of Object.keys(config))if(key.endsWith('Path')||key==='fontDirectory')config[key]=resolve(base,config[key]);
 if(config.backgroundAudio)config.backgroundAudio.localFile=resolve(base,config.backgroundAudio.localFile);
 if(config.illustrations)config.illustrations=config.illustrations.map(a=>({...a,localFile:resolve(base,a.localFile)}));
 return config;
}
export function projectReady(path){
 try{
  const c=projectConfig(path),template=read(c.templatePath),brand=read(c.brandKitPath),family=template.captions.font??brand.fonts.primary,fontDirectory=resolveFontDirectory(c.fontDirectory,family);
  return ['sourcePath','transcriptPath','cameraPath','visionPath','templatePath','brandKitPath','catalogPath',...(c.depthTextPath?['depthTextPath']:[])].every(k=>regular(c[k]))&&fontFiles(family).every(f=>regular(join(fontDirectory,f)));
 }catch{return false;}
}

// Single-owner intake. The caller must hold EditorJobs' exclusive store lock.
// HTTP never accepts filesystem paths, command strings, model keys or provider URLs.
export class VideoIntake{
 constructor(directory,profiles,{probe}={}){
  this.directory=resolve(directory);this.profiles=profiles;
  this.probe=probe??(async path=>{
   const {stdout}=await run('ffprobe',['-v','error','-protocol_whitelist','file,pipe','-format_whitelist','mov,matroska,webm','-show_streams','-show_format','-of','json',path],{timeout:15000,maxBuffer:1024*1024});
   return JSON.parse(stdout);
  });
  mkdirSync(this.directory,{recursive:true,mode:0o700});
  if(lstatSync(this.directory).isSymbolicLink())throw new Error('Invalid upload directory');
  // A crash cannot expose an incomplete upload as a stored video.
  for(const f of readdirSync(this.directory))if(/^\.(incoming|metadata)-[a-f0-9-]+$/.test(f))unlinkSync(join(this.directory,f));
  for(const item of this.records())if(item.profileId){
   const path=join(this.directory,item.sha256+'.project.json');
   if(regular(path))profiles[item.profileId]=path;
  }
 }
 records(){
  return readdirSync(this.directory).filter(f=>/^[a-f0-9]{64}\.json$/.test(f)).map(f=>{
   const record=read(join(this.directory,f));
   if(record.sha256!==f.slice(0,-5)||!HASH.test(record.sha256)||!Number.isSafeInteger(record.bytes)||record.bytes<1||record.bytes>MAX||record.profileId&&record.profileId!=='upload-'+record.sha256)throw new Error('Upload metadata needs inspection');
   return record;
  });
 }
 list(){
  return this.records().map(c=>({id:c.sha256,bytes:c.bytes,createdAt:c.createdAt,profileId:c.profileId??null,
   state:c.profileId?(projectReady(this.profiles[c.profileId])?'READY':'WAITING_ASSETS'):'NEEDS_ANALYSIS'}));
 }
 importAnalysis(id,data){
  if(!HASH.test(id))throw new Error('Upload not found');
  const entry=this.list().find(e=>e.id===id);if(!entry)throw new Error('Upload not found');
  if(entry.state==='READY')throw new Error('Analysis already ready; create a separate revision');
  if(data.sourceSha256!==id)throw new Error('Analysis source SHA256 mismatch');
  validateTranscript(data.transcript);
  const metadata=read(join(this.directory,id+'.json'));
  if(Math.abs(data.transcript.sourceDuration-metadata.source.duration)>.05)throw new Error('Analysis duration mismatch');
  const vision=data.vision;
  if(!vision||!Array.isArray(vision.frames)||vision.frames.length<1||vision.frames.length>1201)throw new Error('Analysis vision frames required');
  if(vision.frames.some(f=>!Number.isFinite(f.time)||f.time<0||f.time>metadata.source.duration+.05||f.frameWidth!==metadata.source.width||f.frameHeight!==metadata.source.height))throw new Error('Analysis vision source mismatch');
  const templatePath=Object.values(this.profiles)[0];if(!templatePath)throw new Error('No CALMA template configured');
  const template=projectConfig(templatePath),dir=join(this.directory,'analysis-'+randomUUID());
  // A different upload does not inherit music chosen for another source.
  delete template.backgroundAudio;delete template.illustrations;delete template.depthTextPath;
  mkdirSync(dir,{mode:0o700});
  let committed=false;
  try{
   for(const [name,value]of Object.entries({transcript:data.transcript,camera:data.camera,vision}))atomicJSON(join(dir,name+'.json'),value);
   const config={...template,source:metadata.source,sourcePath:join(this.directory,id+'.video'),transcriptPath:join(dir,'transcript.json'),cameraPath:join(dir,'camera.json'),visionPath:join(dir,'vision.json'),fontDirectory:fonts(template.fontDirectory)};
   const candidate=join(dir,'project.json');atomicJSON(candidate,config);
   // Validate the complete plan before making the profile selectable.
   prepareProject(loadProject(candidate));
   const profileId='upload-'+id,profilePath=join(this.directory,id+'.project.json');
   atomicJSON(profilePath,config);atomicJSON(join(this.directory,id+'.json'),{...metadata,profileId});
   committed=true;this.profiles[profileId]=profilePath;return this.list().find(e=>e.id===id);
  }finally{if(!committed)rmSync(dir,{recursive:true,force:true});}
 }
 async receive(req){
  if(this.busy)throw new Error('Upload busy');
  if(!/^(?:video\/(?:mp4|quicktime|webm)|application\/octet-stream)(?:;|$)/i.test(req.headers['content-type']??''))throw new Error('Selecciona un vídeo MP4, MOV o WebM');
  const length=Number(req.headers['content-length']);
  if(!Number.isSafeInteger(length)||length<1||length>MAX)throw new Error('El vídeo debe ocupar entre 1 byte y 250 MiB');
  const entries=this.list(),disk=statfsSync(this.directory);
  if(disk.bavail*disk.bsize<length+512*1024*1024)throw new Error('Espacio insuficiente para subir el vídeo');
  this.busy=true;const temp=join(this.directory,'.incoming-'+randomUUID());let fd;
  try{
   fd=await open(temp,'wx',0o600);let size=0;const hash=createHash('sha256');
   for await(const chunk of req){
    size+=chunk.length;if(size>length||size>MAX)throw new Error('Tamaño de vídeo no válido');
    hash.update(chunk);let offset=0;
    while(offset<chunk.length){const {bytesWritten}=await fd.write(chunk,offset,chunk.length-offset);offset+=bytesWritten;}
   }
   await fd.close();fd=null;if(size!==length)throw new Error('Subida incompleta');
   const info=await this.probe(temp),video=info.streams?.find(s=>s.codec_type==='video'),duration=Number(info.format?.duration);
   if(!video||!Number.isInteger(video.width)||!Number.isInteger(video.height)||video.width<2||video.height<2||!Number.isFinite(duration)||duration<=0||duration>600||video.width>7680||video.height>7680)throw new Error('Vídeo no válido o duración superior a 10 minutos');
   if(!info.streams.some(s=>s.codec_type==='audio'))throw new Error('El vídeo necesita una pista de voz o audio');
   const rotation=Number(video.side_data_list?.find(s=>s.rotation!==undefined)?.rotation??0);
   if(!Number.isFinite(rotation)||rotation%90!==0)throw new Error('Orientación de vídeo no compatible');
   const sha256=hash.digest('hex'),path=join(this.directory,sha256+'.video');
   if(entries.length>=4&&!entries.some(e=>e.id===sha256))throw new Error('Límite de cuatro vídeos alcanzado');
   if(existsSync(path)){
    if(!regular(path)||lstatSync(path).size!==size||fileSha256(path)!==sha256)throw new Error('Stored video integrity changed');
   }else linkSync(temp,path);
   const metadata={sha256,bytes:size,createdAt:new Date().toISOString(),source:{sha256,duration,width:Math.abs(rotation)%180===90?video.height:video.width,height:Math.abs(rotation)%180===90?video.width:video.height}};
   for(const config of Object.values(this.profiles)){
    const c=projectConfig(config);if(c.source?.sha256!==sha256)continue;
    metadata.profileId='upload-'+sha256;const target=join(this.directory,sha256+'.project.json');
    if(!existsSync(target))atomicJSON(target,{...c,sourcePath:path,fontDirectory:fonts(c.fontDirectory)});
    this.profiles[metadata.profileId]=target;break;
   }
   const target=join(this.directory,sha256+'.json');if(!existsSync(target))atomicJSON(target,metadata);
   return this.list().find(c=>c.id===sha256);
  }finally{if(fd)await fd.close();await unlink(temp).catch(()=>{});this.busy=false;}
 }
}
