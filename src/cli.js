import {readFileSync,writeFileSync,mkdirSync,existsSync,createWriteStream,renameSync,statSync,unlinkSync} from 'node:fs';
import {join,resolve,basename,extname} from 'node:path';
import {Readable,Transform} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {fileURLToPath} from 'node:url';
import {buildEdit,defaultPlan,fingerprint,httpsURL} from './plan.js';
import {ShotstackStage,poll,ProviderFailed} from './provider.js';
import {Jobs} from './jobs.js';
export function prepare(plan,dir) {
  const edit=buildEdit(plan);mkdirSync(dir,{recursive:true,mode:0o700});
  writeFileSync(join(dir,'plan.json'),JSON.stringify(plan,null,2),{mode:0o600});
  writeFileSync(join(dir,'edit.json'),JSON.stringify(edit,null,2),{mode:0o600});
  return edit;
}
export async function downloadOutput(url,dir,{fetchImpl=fetch}={}) {
  const u=httpsURL(url);
  if(!u.hostname.includes('shotstack') || !u.hostname.includes('stage') || !u.hostname.endsWith('.amazonaws.com')) throw new Error('Salida fuera de Shotstack stage');
  const dest=join(dir,'result.mp4');
  if(existsSync(dest)) return;
  const r=await fetchImpl(url,{redirect:'error',signal:AbortSignal.timeout(300000)});
  if(!r.ok||!r.body) throw new Error(`Descarga: HTTP ${r.status}`);
  const contentType=r.headers.get('content-type')||'';
  if(!/video\/mp4|application\/octet-stream/.test(contentType)) throw new Error('Salida no es MP4');
  let bytes=0;
  const limit=new Transform({transform(chunk,enc,cb){bytes+=chunk.length;cb(bytes>250*1024*1024?new Error('Salida excede 250 MiB'):null,chunk);}});
  const tmp=join(dir,'result.part');
  try {
    await pipeline(Readable.fromWeb(r.body),limit,createWriteStream(tmp,{mode:0o600}));
    const header=readFileSync(tmp).subarray(0,12);
    if(header.subarray(4,8).toString()!=='ftyp') throw new Error('Contenido MP4 inválido');
    renameSync(tmp,dest);
  }catch(e){if(existsSync(tmp))unlinkSync(tmp);throw e;}
  writeFileSync(join(dir,'preview.html'),'<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>SUES · POC</title><body style="background:#101820;color:white;font-family:sans-serif;text-align:center"><h1>SUES · POC sandbox</h1><video src="result.mp4" controls playsinline style="max-height:80vh;max-width:100%"></video><p>Prueba técnica con marca de agua. Revisa voz, cortes, texto y encuadre.</p></body></html>');
}
export async function continueJob(store,client,{download=downloadOutput,pollOptions}={}) {
  let j=store.load();
  if(['UPLOADING','INGESTING'].includes(j.state)) {
    if(!j.sourceId) throw new Error('Upload sin ID: conservar job para revisión; no reenviar automáticamente');
    if(j.state==='UPLOADING')j=store.transition(j,'INGESTING');
    let s;
    try {s=await poll(()=>client.source(j.sourceId),r=>r.data.attributes.status,pollOptions);}
    catch(e){if(e instanceof ProviderFailed)store.transition(j,'FAILED',{failureStage:'ingest'});throw e;}
    const a=s.data.attributes;
    const plan=defaultPlan(a.source,a.duration);
    let edit;
    try {edit=prepare(plan,store.dir);}
    catch(e){store.transition(j,'FAILED',{failureStage:'validation'});throw e;}
    j=store.transition(j,'READY',{sourceDuration:a.duration,sourceWidth:a.width,sourceHeight:a.height,planHash:fingerprint(plan),editHash:fingerprint(edit)});
  }
  if(j.state==='READY') {
    const plan=JSON.parse(readFileSync(join(store.dir,'plan.json')));
    const edit=buildEdit(plan);
    if(fingerprint(plan)!==j.planHash || fingerprint(edit)!==j.editHash)throw new Error('Plan modificado: crea un job nuevo tras revisar los cambios');
    j=store.transition(j,'SUBMITTING');
    try {
      const r=await client.submit(edit);
      if(!r.success || !r.response?.id) throw new Error('Respuesta render sin ID');
      j=store.transition(j,'RENDERING',{renderId:r.response.id,submittedAt:new Date().toISOString()});
    }catch(e) {
      store.transition(store.load(),'SUBMISSION_UNKNOWN');throw new Error('Envío incierto: NO reenviar; recuperar ID en dashboard. '+e.message);
    }
  }
  if(['SUBMITTING','SUBMISSION_UNKNOWN'].includes(j.state))throw new Error('Envío incierto: recupera ID con recover, nunca reenvíes');
  if(j.state==='RENDERING') {
    let r;
    try {r=await poll(()=>client.status(j.renderId),r=>r.response.status,pollOptions);}
    catch(e){if(e instanceof ProviderFailed)store.transition(j,'FAILED',{failureStage:'render'});throw e;}
    if(!r.response.url) throw new Error('Render terminado sin URL');
    // Keep rendering state until download succeeds, so resume can retry a download.
    await download(r.response.url,store.dir);
    j=store.transition(j,'DONE',{completedAt:new Date().toISOString(),renderTime:r.response.renderTime,result:'result.mp4',preview:'preview.html'});
  }
  return j;
}
export async function run(file,dir,{client=new ShotstackStage(),download,pollOptions}={}) {
  const st=statSync(file);
  if(!st.isFile()||st.size<=0||st.size>250*1024*1024||!['.mp4','.mov','.webm'].includes(extname(file).toLowerCase()))throw new Error('Usa MP4/MOV/WEBM de hasta 250 MiB y 30–60 s');
  const store=new Jobs(dir),unlock=store.lock();
  try {
    let j=store.create();j=store.transition(j,'UPLOADING');
    const r=await client.initUpload(basename(file));
    const id=r.data?.attributes?.id||r.data?.id;
    const url=r.data?.attributes?.url;
    if(!id||!url) throw new Error('Respuesta upload incompleta');
    j=store.save({...j,sourceId:id});
    await client.upload(url,file);
    store.transition(j,'INGESTING');
    return await continueJob(store,client,{download,pollOptions});
  }finally{unlock();}
}
export async function main(args=process.argv.slice(2)) {
  const [command,input,...rest]=args;
  if(command==='prepare') {
    const index=rest.indexOf('--out');const dir=resolve(index>=0?rest[index+1]:'runtime/dry-run');
    prepare(JSON.parse(readFileSync(input,'utf8')),dir);console.log('Timeline validado offline. Coste: 0 USD. '+dir);return;
  }
  if(!['run','resume','recover','cleanup'].includes(command))throw new Error('Comandos: prepare PLAN --out DIR | run VIDEO --out DIR --execute-stage | resume DIR --execute-stage | recover DIR --render-id ID --execute-stage | cleanup DIR --execute-stage');
  if(!rest.includes('--execute-stage') && input!=='--execute-stage') throw new Error('Acceso remoto sólo con --execute-stage; coste de render stage 0, sin generación IA');
  const client=new ShotstackStage();
  if(command==='run') {
    const i=rest.indexOf('--out');if(i<0||!rest[i+1])throw new Error('--out obligatorio para conservar el job');
    const j=await run(resolve(input),resolve(rest[i+1]),{client});console.log('Estado: '+j.state);return;
  }
  const store=new Jobs(resolve(input)),unlock=store.lock();
  try {
    let j=store.load();
    if(command==='recover') {
      const i=rest.indexOf('--render-id');const id=rest[i+1];if(i<0||!id)throw new Error('--render-id obligatorio');
      if(j.state==='SUBMITTING') j=store.transition(j,'SUBMISSION_UNKNOWN');
      if(j.state!=='SUBMISSION_UNKNOWN')throw new Error('Sólo recuperar envíos inciertos');
      const r=await client.status(id);
      // Prevent associating a render from a different job when API returns its input.
      if(!r.response?.data || fingerprint(r.response.data)!==j.editHash)throw new Error('Render no coincide con edit guardado; revisar manualmente en dashboard');
      j=store.transition(j,'RENDERING',{renderId:id});
    }
    if(command==='cleanup') {
      if(!['DONE','FAILED','SUBMISSION_UNKNOWN'].includes(j.state))throw new Error('No borrar una fuente con trabajo pendiente');
      if(j.sourceId)await client.deleteSource(j.sourceId);
      store.transition(j,'CLEANED',{sourceDeletedAt:new Date().toISOString()});
      console.log('Fuente de ESTE job eliminada. Resultado local conservado.');return;
    }
    j=await continueJob(store,client);console.log('Estado: '+j.state);
  }finally{unlock();}
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) main().catch(e=>{console.error(e.message);process.exitCode=1;});
