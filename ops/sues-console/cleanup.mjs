import fs from 'node:fs';
import path from 'node:path';
import { randomUUID, randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const HOUR=3600000, DAY=24*HOUR, PHRASE='BORRAR SOLO ESTOS TEMPORALES';
const DEFAULTS=Object.freeze({
  store:'/var/lib/sues-vps-mcp/cleanup',
  exports:'/srv/sues-fablecut-next/data/exports',
  automation:'/srv/sues-fablecut-next/data/automation-v1',
  qa:'/srv/sues-fablecut-next/data/qa',
  backups:'/opt/sues-video-setup',
  apt:'/var/cache/apt/archives',
  temp:'/tmp',
  remotion:'/opt/sues-video-setup/remotion-cta-poc-20261103/experiments/remotion-cta',
  chrome:'/opt/sues-video-setup/sfx-qa-tools',
});
const hash=s=>createHash('sha256').update(s).digest('hex');
const iso=()=>new Date().toISOString();
const validId=x=>typeof x==='string'&&/^[a-f0-9-]{36}$/.test(x);
function exists(p){try{return fs.lstatSync(p)}catch{return null}}
function size(p){try{return Number(execFileSync('du',['-s','-B1','--',p],{encoding:'utf8',timeout:12000,maxBuffer:10000}).trim().split(/\s+/)[0])}catch{return -1}}
function safeRoot(dir){const st=exists(dir);return st?.isDirectory()&&!st.isSymbolicLink()?path.resolve(dir):null}
function fingerprint(p){const s=exists(p);if(!s||s.isSymbolicLink()||(!s.isFile()&&!s.isDirectory()))return null;return [s.dev,s.ino,s.size,Math.round(s.mtimeMs),s.isDirectory()?'dir':'file'].join(':')}
function inside(root,p){const x=path.resolve(p),r=path.resolve(root);if(!x.startsWith(r+path.sep))return false;let q=path.dirname(x);while(q!==r&&q!==path.dirname(q)){const s=exists(q);if(!s?.isDirectory()||s.isSymbolicLink())return false;q=path.dirname(q)}return q===r}
function readJSON(p){return JSON.parse(fs.readFileSync(p,'utf8'))}
function atomicJSON(p,v){const tmp=p+'.'+randomUUID()+'.tmp';fs.writeFileSync(tmp,JSON.stringify(v,null,2),{mode:0o600,flag:'wx'});fs.renameSync(tmp,p)}
function candidates(root,pred){const r=safeRoot(root);if(!r)return [];return fs.readdirSync(r,{withFileTypes:true}).filter(pred).map(e=>path.join(r,e.name))}
function noActiveRender(){try{const ps=execFileSync('ps',['-eo','args'],{encoding:'utf8',timeout:5000});return !/fablecut-story-run-segment-qa\.mjs render|render-full-wrap-20261121\.py|render-para-20261121\.py/.test(ps)}catch{return false}}
export function createCleanupService(overrides={}) {
 const roots={...DEFAULTS,...overrides};
 fs.mkdirSync(roots.store,{recursive:true,mode:0o700});fs.chmodSync(roots.store,0o700);
 function scanItems(){
  const items=[],now=Date.now(),busy=!noActiveRender();
  const add=(p,base,category,risk,reason,minAge=0)=>{
   const s=exists(p),fp=fingerprint(p);
   if(!fp||!safeRoot(base)||!inside(base,p)||now-s.mtimeMs<minAge)return;
   const bytes=size(p);if(bytes<0)return;
   items.push({id:hash(category+':'+p).slice(0,16),category,risk,path:p,bytes,
     ageDays:Math.floor((now-s.mtimeMs)/DAY),reason,fingerprint:fp});
  };
  for(const p of candidates(roots.exports,e=>e.isFile()&&/\.part\.(mp4|mov|m4v|webm|mkv)$/i.test(e.name)))
   add(p,roots.exports,'exportacion_incompleta','recomendado','MP4 parcial antiguo; no es un video finalizado',2*DAY);
  for(const p of candidates(roots.apt,e=>e.isFile()&&/\.deb$/i.test(e.name)))
   add(p,roots.apt,'cache_apt','recomendado','Paquete descargado: se puede volver a obtener',3*DAY);
  for(const p of candidates(roots.temp,e=>e.isDirectory()&&/^fablecut-export-[A-Za-z0-9_-]+$/.test(e.name)))
   add(p,roots.temp,'perfil_temporal_navegador','recomendado','Perfil transitorio de una exportacion anterior',3*DAY);
  const chrome=path.join(roots.chrome,'chrome.zip'),binary=path.join(roots.chrome,'chrome-linux64','chrome');
  if(exists(binary)?.isFile())add(chrome,roots.chrome,'instalador_chrome','recomendado','ZIP redundante: navegador instalado preservado',DAY);
  const modules=path.join(roots.remotion,'node_modules'),lock=path.join(roots.remotion,'package-lock.json');
  if(exists(lock)?.isFile())add(modules,roots.remotion,'dependencias_regenerables','recomendado','npm ci puede recrear las dependencias',2*DAY);
  for(const project of candidates(roots.automation,e=>e.isDirectory()&&/^test-project-[\w-]+$/.test(e.name))) {
   for(const p of candidates(project,e=>e.isDirectory()&&/^render-work-[\w-]+$/.test(e.name))){
    if(exists(path.join(p,'segment-proof.json'))||exists(path.join(p,'render-proof.json')))continue;
    const st=exists(p);if(!st||Date.now()-st.mtimeMs<2*DAY)continue;
    let failed=false;const status=path.join(p,'export-status.json');
    if(exists(status)?.isFile())try{
      failed=['failed','cancelled','error'].includes(String(readJSON(status).status).toLowerCase())
    }catch{}
    const safe=!busy&&(failed||Date.now()-st.mtimeMs>=7*DAY);
    add(p,project,'render_sin_validar',safe?'recomendado':'revisar',
      busy?'Render activo en servidor; prohibido borrar':failed?'Render fallido sin comprobante':'Sin comprobante: puede contener investigacion',2*DAY);
   }
  }
  for(const p of candidates(roots.qa,e=>e.isDirectory()&&/^reel-[\w-]+$/.test(e.name)))
   add(p,roots.qa,'proyecto_qa_antiguo','revisar','Pruebas y materiales: requieren revision antes de retirar',7*DAY);
  for(const p of candidates(roots.backups,e=>e.isDirectory()&&/^update-backup-\d{8}-/.test(e.name)))
   add(p,roots.backups,'copia_recuperacion','conservar','Copia de seguridad: no borrar automaticamente',0);
  const unique=[...new Map(items.map(x=>[x.path,x])).values()].sort((a,b)=>b.bytes-a.bytes).slice(0,250);
  const fsstat=fs.statfsSync('/');
  return {items:unique,busy,freeSpace:fsstat.bavail*fsstat.bsize};
 }
 function report(items){
  return {recommendedBytes:items.filter(i=>i.risk==='recomendado').reduce((n,i)=>n+i.bytes,0),
    recommendedCount:items.filter(i=>i.risk==='recomendado').length,
    reviewCount:items.filter(i=>i.risk==='revisar').length,
    protectedCount:items.filter(i=>i.risk==='conservar').length};
 }
 function scan(){
  const s=scanItems(),id=randomUUID();
  const data={schema:'sues-cleanup/scan-v1',scanId:id,createdAt:iso(),
    expiresAt:Date.now()+30*60*1000,...s,summary:report(s.items)};
  atomicJSON(path.join(roots.store,'scan-'+id+'.json'),data);
  return data;
 }
 function readRecord(prefix,id){
  if(!validId(id))throw Error('Identificador invalido');
  const record=readJSON(path.join(roots.store,prefix+'-'+id+'.json'));
  if(record.expiresAt<Date.now())throw Error('Informe caducado: ejecutar un nuevo analisis');
  return record;
 }
 function currentAllowed(item){
  const p=item.path,c=item.category;
  const base=c==='exportacion_incompleta'?roots.exports:
   c==='cache_apt'?roots.apt:c==='perfil_temporal_navegador'?roots.temp:
   c==='instalador_chrome'?roots.chrome:c==='dependencias_regenerables'?roots.remotion:
   c==='render_sin_validar'?path.dirname(p):null;
  if(!base||!safeRoot(base)||!inside(base,p)||fingerprint(p)!==item.fingerprint)return false;
  const age=Date.now()-exists(p).mtimeMs;
  if(c==='exportacion_incompleta')return /\.part\.(mp4|mov|m4v|webm|mkv)$/i.test(path.basename(p))&&age>=2*DAY;
  if(c==='cache_apt')return /\.deb$/i.test(path.basename(p))&&age>=3*DAY;
  if(c==='perfil_temporal_navegador')return /^fablecut-export-[A-Za-z0-9_-]+$/.test(path.basename(p))&&age>=3*DAY;
  if(c==='instalador_chrome')return p===path.join(roots.chrome,'chrome.zip')&&age>=DAY&&exists(path.join(roots.chrome,'chrome-linux64/chrome'))?.isFile();
  if(c==='dependencias_regenerables')return p===path.join(roots.remotion,'node_modules')&&age>=2*DAY&&exists(path.join(roots.remotion,'package-lock.json'))?.isFile();
  if(c==='render_sin_validar')return path.dirname(path.dirname(p))===path.resolve(roots.automation)
    &&/^test-project-[\w-]+$/.test(path.basename(path.dirname(p)))
    &&/^render-work-[\w-]+$/.test(path.basename(p))
    &&age>=2*DAY&&!exists(path.join(p,'segment-proof.json'))&&!exists(path.join(p,'render-proof.json'))
    &&noActiveRender();
  return false;
 }
 function prepare(scanId,selected){
  const s=readRecord('scan',scanId);
  if(!Array.isArray(selected)||!selected.length||selected.length>100||new Set(selected).size!==selected.length)throw Error('Elegir entre 1 y 100 IDs distintos');
  const items=selected.map(id=>s.items.find(x=>x.id===id));
  if(items.some(x=>!x||x.risk!=='recomendado'||!currentAllowed(x)))throw Error('Seleccion no permitida, protegida o desactualizada');
  const token=randomBytes(24).toString('hex'),approvalId=randomUUID();
  const req={approvalId,scanId,selected,tokenHash:hash(token),expiresAt:Date.now()+10*60*1000,used:false};
  atomicJSON(path.join(roots.store,'approval-'+approvalId+'.json'),req);
  return {approvalId,token,confirmationPhrase:PHRASE,expiresAt:new Date(req.expiresAt).toISOString(),
   items:items.map(({id,path,bytes,reason})=>({id,path,bytes,reason})),totalBytes:items.reduce((a,i)=>a+i.bytes,0),
   warning:'DEFINITIVO: al ejecutar se perderan estos temporales; no incluye proyectos ni copias de seguridad'};
 }
 function execute(approvalId,token,phrase){
  const ap=readRecord('approval',approvalId);
  if(ap.used)throw Error('Esta aprobacion ya se utilizo');
  if(phrase!==PHRASE)throw Error('Confirmacion incorrecta; no se ha borrado nada');
  if(typeof token!=='string'||!/[a-f0-9]{48}/.test(token)||token.length!==48)throw Error('Token invalido');
  if(!timingSafeEqual(Buffer.from(ap.tokenHash,'hex'),Buffer.from(hash(token),'hex')))throw Error('Token incorrecto');
  const s=readRecord('scan',ap.scanId);
  const items=ap.selected.map(id=>s.items.find(x=>x.id===id));
  if(items.some(x=>!x||x.risk!=='recomendado'||!currentAllowed(x)))throw Error('Archivos cambiados: nuevo analisis obligatorio');
  const audit=path.join(roots.store,'audit.jsonl');
  const log=x=>fs.appendFileSync(audit,JSON.stringify(x)+'\n',{mode:0o600});
  const now=iso();ap.used=true;ap.usedAt=now;
  atomicJSON(path.join(roots.store,'approval-'+approvalId+'.json'),ap);
  log({event:'authorized',at:now,approvalId,items:items.map(i=>({path:i.path,category:i.category,bytes:i.bytes}))});
  const results=[];
  for(const item of items){
   try{
    if(!currentAllowed(item))throw Error('Item cambio antes de borrar');
    fs.rmSync(item.path,{recursive:exists(item.path).isDirectory(),force:false,maxRetries:0});
    results.push({id:item.id,path:item.path,status:'eliminado',estimatedBytes:item.bytes});
   }catch(err){results.push({id:item.id,path:item.path,status:'error',error:String(err.message).slice(0,300)})}
  }
  const outcome={approvalId,finishedAt:iso(),results,
   estimatedFreedBytes:results.filter(i=>i.status==='eliminado').reduce((n,i)=>n+i.estimatedBytes,0),
   note:'Espacio estimado; enlaces fisicos compartidos pueden impedir liberar todos los bytes'};
  log({event:'finished',...outcome});
  return outcome;
 }
 function markdown(s){
  const fmt=n=>(n/(1024**3)).toFixed(2)+' GiB';
  const lines=['SUES Console | Informe de limpieza '+s.createdAt,
   'Disco libre: '+fmt(s.freeSpace),'Recomendado: '+s.summary.recommendedCount+' / '+fmt(s.summary.recommendedBytes),
   'Revisar: '+s.summary.reviewCount+' | Conservar: '+s.summary.protectedCount,
   'ID | Estado | Tamano | Motivo | Ruta'];
  for(const i of s.items)lines.push([i.id,i.risk,fmt(i.bytes),i.reason,i.path].join(' | '));
  lines.push('Ningun archivo se borra durante el analisis. Las opciones Revisar y Conservar no pueden borrarse desde esta herramienta.');
  return lines.join('\n');
 }
 return {scan,prepare,execute,markdown};
}
