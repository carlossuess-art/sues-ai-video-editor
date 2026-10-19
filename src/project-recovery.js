import {mkdirSync,lstatSync,readdirSync,readFileSync,writeFileSync,renameSync,rmSync,statfsSync,existsSync} from 'node:fs';
import {open,unlink} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID,createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {verifyProjectBackup} from './project-backup.js';
import {loadProject,prepareProject} from './local-pipeline.js';

const run=promisify(execFile),MAX=512*1024*1024;
const EXTRACT=fileURLToPath(new URL('../scripts/backup/extract_private_project.py',import.meta.url));
const ID=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const regular=p=>{try{const s=lstatSync(p);return s.isFile()&&!s.isSymbolicLink();}catch{return false;}};

export class ProjectRecovery{
 constructor(directory,profiles){
  this.directory=resolve(directory);this.profiles=profiles;this.busy=false;
  mkdirSync(this.directory,{recursive:true,mode:0o700});
  if(lstatSync(this.directory).isSymbolicLink())throw new Error('Invalid recovery directory');
  for(const name of readdirSync(this.directory)){
   if(/^\.incoming-[a-f0-9-]+\.tar$/.test(name)||/^\.restore-[a-f0-9-]+$/.test(name))rmSync(join(this.directory,name),{recursive:true,force:true});
  }
  for(const record of this.records()){
   verifyProjectBackup(join(this.directory,record.id,'project'));
   this.profiles[record.profileId]=join(this.directory,record.id,'project','project.json');
  }
 }
 records(){
  return readdirSync(this.directory).filter(name=>ID.test(name)).map(id=>{
   const root=join(this.directory,id);
   if(lstatSync(root).isSymbolicLink()||!regular(join(root,'recovery.json')))throw new Error('Recovery needs inspection');
   const record=read(join(root,'recovery.json'));
   if(record.id!==id||record.profileId!=='restored-'+id||!/^[a-f0-9]{64}$/.test(record.archiveSha256))throw new Error('Recovery metadata changed');
   return record;
  });
 }
 settings(profileId){
  const record=this.records().find(r=>r.profileId===profileId);
  if(!record)throw new Error('Recovery not found');
  return read(join(this.directory,record.id,'project','settings.json'));
 }
 list(){return this.records().map(({id,profileId,title,createdAt,archiveSha256,bytes})=>({id,profileId,title,createdAt,archiveSha256,bytes}));}
 async receive(req){
  if(this.busy)throw new Error('Ya hay una recuperación en proceso');
  if(!/^(?:application\/(?:x-tar|octet-stream))(?:;|$)/i.test(req.headers['content-type']??''))throw new Error('Selecciona una copia SUES en formato TAR');
  const length=Number(req.headers['content-length']);
  if(!Number.isSafeInteger(length)||length<1||length>MAX)throw new Error('La copia debe ocupar entre 1 byte y 512 MiB');
  const disk=statfsSync(this.directory);
  if(disk.bavail*disk.bsize<length*2+512*1024*1024)throw new Error('Espacio insuficiente para recuperar el proyecto');
  const previous=this.records(),id=randomUUID(),temp=join(this.directory,'.incoming-'+id+'.tar'),stage=join(this.directory,'.restore-'+id),target=join(this.directory,id);
  let fd,complete=false;
  this.busy=true;
  try{
   fd=await open(temp,'wx',0o600);let size=0;const hash=createHash('sha256');
   for await(const chunk of req){
    size+=chunk.length;if(size>length)throw new Error('Tamaño de copia no válido');hash.update(chunk);let offset=0;
    while(offset<chunk.length){const {bytesWritten}=await fd.write(chunk,offset,chunk.length-offset);offset+=bytesWritten;}
   }
   await fd.close();fd=null;if(size!==length)throw new Error('La copia llegó incompleta');
   const archiveSha256=hash.digest('hex'),existing=previous.find(r=>r.archiveSha256===archiveSha256);
   if(existing){verifyProjectBackup(join(this.directory,existing.id,'project'));return {...this.list().find(r=>r.id===existing.id),reused:true};}
   if(previous.length>=4)throw new Error('Límite de cuatro proyectos recuperados alcanzado');
   mkdirSync(stage,{mode:0o700});
   try{await run('python3',[EXTRACT,temp,join(stage,'project')],{timeout:120000,maxBuffer:65536});}
   catch{throw new Error('La copia TAR está incompleta o contiene entradas no permitidas');}
   const checked=verifyProjectBackup(join(stage,'project'));
   const project=loadProject(join(stage,'project','project.json')),settings=read(join(stage,'project','settings.json'));
   prepareProject(project,settings);
   const record={id,profileId:'restored-'+id,title:project.title,createdAt:new Date().toISOString(),archiveSha256,bytes:checked.bytes};
   writeFileSync(join(stage,'recovery.json'),JSON.stringify(record)+'\n',{flag:'wx',mode:0o600});
   renameSync(stage,target);complete=true;
   this.profiles[record.profileId]=join(target,'project','project.json');
   return {...record,reused:false};
  }finally{
   if(fd)await fd.close();await unlink(temp).catch(()=>{});
   if(!complete&&existsSync(stage))rmSync(stage,{recursive:true,force:true});this.busy=false;
  }
 }
}
