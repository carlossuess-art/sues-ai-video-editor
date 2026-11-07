/** Loopback-only FableCut adapter. Never expose the upstream REST port publicly. */
const DEFAULT_BASE='http://127.0.0.1:7779';
export class FableCutConflict extends Error { constructor(message, detail){super(message);this.name='FableCutConflict';this.detail=detail;} }
export class FableCutClient {
  constructor({baseUrl=DEFAULT_BASE,fetchImpl=globalThis.fetch}={}) {
    const u=new URL(baseUrl);
    if(u.protocol!=='http:' || !['127.0.0.1','localhost','[::1]'].includes(u.hostname) || u.username || u.password || u.pathname!=='/' || u.search || u.hash) throw new Error('FableCut must use an explicit loopback HTTP origin');
    this.baseUrl=u.origin;this.fetch=fetchImpl;
  }
  async request(path,{method='GET',body,projectId}={}) {
    if(!['/api/project','/api/projects','/api/versions'].includes(path)) throw Error('FableCut API path not allowed');
    const r=await this.fetch(this.baseUrl+path,{method,headers:{'content-type':'application/json',...(projectId?{'x-fablecut-project':projectId}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(8000)});
    const content=await r.text();let data;try{data=JSON.parse(content);}catch{throw Error(`FableCut returned non-JSON (${r.status})`);}
    if(r.status===409)throw new FableCutConflict(data.error||'FableCut revision conflict',data);
    if(!r.ok)throw Error(`FableCut HTTP ${r.status}: ${data.error||'unknown error'}`);
    return {data,projectId:r.headers?.get?.('x-fablecut-project')||null};
  }
  async uploadMedia(bytes,{name}={}) {
    if(!/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,110}\.(?:webm|mov|mp4|png|jpg|gif)$/.test(name||''))throw Error('Unsafe media filename');
    if(!(bytes instanceof Uint8Array) || !bytes.byteLength || bytes.byteLength>50_000_000)throw Error('Invalid media buffer');
    const url=this.baseUrl+'/api/upload?name='+encodeURIComponent(name);
    const r=await this.fetch(url,{method:'POST',body:bytes,signal:AbortSignal.timeout(30000)});
    const data=await r.json();
    if(!r.ok || data.ok!==true || typeof data.src!=='string' || !data.src.startsWith('/media/'))throw Error('FableCut media upload failed');
    return data.src;
  }
  async getProject(){return this.request('/api/project');}
  async listProjects(){return this.request('/api/projects');}
  async getVersions(){return this.request('/api/versions');}
  async updateProject(transform,{projectId,expectedRevision}={}){
    if(typeof transform!=='function')throw TypeError('transform must be a function');
    const {data:current,projectId:active}=await this.getProject();
    if(!active || (projectId&&active!==projectId))throw new FableCutConflict('Active project changed; refusing edit',{active,projectId});
    if(!Number.isInteger(current.revision)|| current.revision<0)throw Error('Invalid project revision');
    if(expectedRevision!==undefined && expectedRevision!==current.revision)throw new FableCutConflict('Stale base revision',{expectedRevision,actual:current.revision});
    const changed=await transform(structuredClone(current));
    if(!changed || typeof changed!=='object'||Array.isArray(changed))throw TypeError('transform must return project object');
    if(changed.revision!==current.revision)throw Error('Transform cannot change revision; adapter owns it');
    if(!Array.isArray(changed.tracks)||!Array.isArray(changed.clips)||!Array.isArray(changed.media))throw Error('Cannot save a project lacking its tracks, clips or media');
    changed.revision=current.revision+1;
    const saved=await this.request('/api/project',{method:'PUT',body:changed,projectId:active});
    return {revision:saved.data.revision,projectId:active,project:changed};
  }
}