import { createReadStream, statSync } from 'node:fs';
import { validatePayload, httpsURL } from './plan.js';
const BASE='https://api.shotstack.io';
export class ProviderFailed extends Error {}
export class ShotstackStage {
  constructor({key=process.env.SHOTSTACK_STAGE_API_KEY,env='stage',fetchImpl=fetch}={}) {
    if(env!=='stage') throw new Error('Producción bloqueada: sólo stage');
    if(!key?.trim()) throw new Error('Configura SHOTSTACK_STAGE_API_KEY en .env; nunca en el chat');
    this.key=key;this.fetch=fetchImpl;
  }
  async request(service,path,{method='GET',body}={}) {
    if(!['edit','ingest'].includes(service)) throw new Error('Servicio bloqueado');
    const r=await this.fetch(`${BASE}/${service}/stage/${path}`,{method,redirect:'error',signal:AbortSignal.timeout(120000),headers:{'x-api-key':this.key,'Content-Type':'application/json','Accept':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});
    if(!r.ok) throw new Error(`Shotstack ${service}: HTTP ${r.status}. No se reenvía el POST automáticamente.`);
    if(r.status===204) return null;
    return r.json();
  }
  async initUpload(filename) {return this.request('ingest','upload',{method:'POST',body:{filename}});}
  async upload(url,file) {
    const u=httpsURL(url);
    if(!u.hostname.endsWith('.amazonaws.com') || !u.hostname.includes('shotstack-ingest-api-stage')) throw new Error('Upload URL fuera de Ingest stage');
    const size=statSync(file).size;
    if(size<=0||size>250*1024*1024) throw new Error('Vídeo vacío o superior a 250 MiB');
    const r=await this.fetch(url,{method:'PUT',redirect:'error',headers:{'Content-Length':String(size)},body:createReadStream(file),duplex:'half',signal:AbortSignal.timeout(300000)});
    if(!r.ok) throw new Error(`Upload: HTTP ${r.status}`);
  }
  source(id) {return this.request('ingest',`sources/${encodeURIComponent(id)}`);}
  deleteSource(id) {return this.request('ingest',`sources/${encodeURIComponent(id)}`,{method:'DELETE'});}
  submit(edit) {validatePayload(edit);return this.request('edit','render',{method:'POST',body:edit});}
  status(id) {return this.request('edit',`render/${encodeURIComponent(id)}`);}
}
export async function poll(read,extract,{timeoutMs=600000,intervalMs=5000,sleep=ms=>new Promise(r=>setTimeout(r,ms)),now=Date.now}={}) {
  const deadline=now()+timeoutMs;
  do {
    const data=await read(); const status=extract(data);
    if(['ready','done'].includes(status)) return data;
    if(status==='failed') throw new ProviderFailed('Proveedor: job fallido; consulta el ID guardado');
    if(!['queued','importing','fetching','preprocessing','rendering','saving','uploading','processing'].includes(status)) throw new Error('Estado desconocido del proveedor o generación no permitida');
    if(now()>=deadline) break;
    await sleep(Math.min(intervalMs,Math.max(0,deadline-now())));
  }while(now()<=deadline);
  throw new Error('Tiempo de espera agotado; usa resume, nunca reenvíes el render');
}
