import http from 'node:http';
import {readFileSync,statSync,createReadStream} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes,timingSafeEqual} from 'node:crypto';
import {loadProject} from './local-pipeline.js';
import {RENDERED_MOTIONS} from './semantic-render.js';
import {MOTION_ALIASES} from './foundation-integration.js';
import {EditorJobs} from './editor-jobs.js';
const WEB=resolve(dirname(fileURLToPath(import.meta.url)),'../web');
const eq=(a,b)=>typeof a==='string'&&Buffer.byteLength(a)===Buffer.byteLength(b)&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
export function parseRange(value,size){
 if(!value)return {start:0,end:size-1,partial:false};
 const m=/^bytes=(\d*)-(\d*)$/.exec(value);if(!m||(!m[1]&&!m[2]))throw new Error('Invalid range');
 let start=m[1]?Number(m[1]):Math.max(0,size-Number(m[2])),end=m[1]?(m[2]?Number(m[2]):size-1):size-1;
 if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=size||end<start)throw new Error('Invalid range');
 end=Math.min(end,size-1);return {start,end,partial:true};
}
async function body(req){
 if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']??''))throw new Error('JSON required');
 const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>65536)throw new Error('Request too large');chunks.push(chunk);}
 const value=JSON.parse(Buffer.concat(chunks).toString());if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('JSON object required');return value;
}
export function createEditorServer({directory,profiles,port=0,token=randomBytes(32).toString('hex'),renderer,storage}){
 const jobs=new EditorJobs({directory,profiles,renderer,storage});let expectedHost;
 const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));};
 const server=http.createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Cross-Origin-Resource-Policy','same-origin');
  res.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; media-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
  try{
   if(req.headers.host!==expectedHost)return json(res,403,{error:'Host rejected'});
   if(req.headers.origin&&req.headers.origin!==`http://${expectedHost}`)return json(res,403,{error:'Origin rejected'});
   const url=new URL(req.url,`http://${expectedHost}`),path=url.pathname;
   if(path==='/api/session'&&req.method==='POST'){
    if(!eq(req.headers.authorization,`Bearer ${token}`))return json(res,401,{error:'Session required'});
    res.setHeader('Set-Cookie',`sues_session=${token}; HttpOnly; SameSite=Strict; Path=/`);return json(res,200,{ok:true});
   }
   if(path.startsWith('/api/')){
    const cookie=/(?:^|;\s*)sues_session=([^;]+)/.exec(req.headers.cookie??'')?.[1];
    if(!eq(cookie,token))return json(res,401,{error:'Session required'});
    if(!['GET','HEAD'].includes(req.method)&&req.headers['x-sues-request']!=='editor')return json(res,403,{error:'Request header required'});
    if(path==='/api/health'&&req.method==='GET')return json(res,200,jobs.health());
    if(path==='/api/design'&&req.method==='GET'){
     const id=url.searchParams.get('profileId');if(!Object.hasOwn(profiles,id))return json(res,404,{error:'Unknown profile'});
     const project=loadProject(profiles[id]),{brand,template,catalog}=project.inputs;
     return json(res,200,{brand,template,styles:['SUES_CALMA','SUES_IMPACTO','SUES_EXPLICA','SUES_HISTORIA'].map(id=>({id,available:id==='SUES_CALMA'})),motions:catalog.map(m=>({id:m.id,type:m.type,tags:m.tags,minDuration:m.trigger.minDuration,reasons:m.trigger.semanticReasons,rendered:RENDERED_MOTIONS.includes(m.id),allowedInTemplate:template.motion.allowed.map(a=>MOTION_ALIASES[a]??a).includes(m.id)}))});
    }
    if(path==='/api/profiles'&&req.method==='GET')return json(res,200,Object.keys(profiles).map(id=>({id,title:id,template:'SUES_CALMA',mode:'existing-transcript-and-vision'})));
    if(path==='/api/jobs'&&req.method==='GET')return json(res,200,jobs.list());
    if(path==='/api/jobs'&&req.method==='POST'){
     const b=await body(req);return json(res,201,jobs.create(b.profileId,b.settings??{}));
    }
    const match=/^\/api\/jobs\/([a-f0-9-]+)(?:\/(plan|render|cancel|media|audit|undo))?$/.exec(path);
    if(!match)return json(res,404,{error:'Not found'});
    const [,id,action]=match;
    if(!action&&req.method==='GET')return json(res,200,jobs.view(jobs.get(id)));
    if(!action&&req.method==='PATCH')return json(res,200,jobs.adjust(id,(await body(req)).settings));
    if(action==='plan'&&req.method==='GET')return json(res,200,jobs.plan(id));
    if(action==='audit'&&req.method==='GET')return json(res,200,await jobs.audit(id));
    if(action==='render'&&req.method==='POST')return json(res,202,jobs.render(id));
    if(action==='undo'&&req.method==='POST')return json(res,200,jobs.undo(id));
    if(action==='cancel'&&req.method==='POST')return json(res,202,jobs.cancel(id));
    if(action==='media'&&['GET','HEAD'].includes(req.method)){
     const file=await jobs.media(id),size=statSync(file).size;let range;
     try{range=parseRange(req.headers.range,size);}catch{res.setHeader('Content-Range',`bytes */${size}`);res.writeHead(416);return res.end();}
     res.setHeader('Content-Type','video/mp4');res.setHeader('Accept-Ranges','bytes');res.setHeader('Content-Length',range.end-range.start+1);
     if(range.partial)res.setHeader('Content-Range',`bytes ${range.start}-${range.end}/${size}`);
     res.writeHead(range.partial?206:200);if(req.method==='HEAD')return res.end();
     const stream=createReadStream(file,{start:range.start,end:range.end});res.on('close',()=>stream.destroy());stream.on('error',()=>res.destroy());return stream.pipe(res);
    }
    return json(res,405,{error:'Method not allowed'});
   }
   const files={'/':['index.html','text/html; charset=utf-8'],'/app.js':['app.js','text/javascript; charset=utf-8'],'/app.css':['app.css','text/css; charset=utf-8'],'/manifest.webmanifest':['manifest.webmanifest','application/manifest+json'],'/sw.js':['sw.js','text/javascript; charset=utf-8'],'/icon.svg':['icon.svg','image/svg+xml']};
   if(req.method!=='GET'||!Object.hasOwn(files,path))return json(res,404,{error:'Not found'});
   const [file,type]=files[path];res.setHeader('Content-Type',type);res.end(readFileSync(join(WEB,file)));
  }catch(error){if(res.headersSent)return res.destroy();const safe=/not found|Unknown profile/i.test(error.message)?404:/busy|ready|changed|transition|owned|Adjustments|queue full|closing/.test(error.message)?409:400;json(res,safe,{error:error.code?'No se pudo acceder al recurso local configurado':error.message.replaceAll(directory,'[local]')});}
 });
 server.requestTimeout=10000;server.headersTimeout=10000;
 return {jobs,server,token,async listen(){await new Promise((r,j)=>{server.once('error',j);server.listen(port,'127.0.0.1',r);});expectedHost=`127.0.0.1:${server.address().port}`;return `http://${expectedHost}/#${token}`;},async close(){await jobs.close();server.closeIdleConnections();await new Promise(r=>server.close(r));}};
}
