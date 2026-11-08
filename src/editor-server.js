import {FableCutClient,FableCutConflict} from './engine-next/fablecut-client.js';
import {ProgramFrameRenderer,ProgramFrameBusy} from './engine-next/program-frame.js';
import {createRequire} from 'node:module';
import {auditMasterPauseCandidates,suggestMasterPauseCandidates} from './master-director-pause-audit.js';
import {saveMasterSourceBrief,listMasterSourceBriefs} from './master-director-brief-evidence.js';
import {translateFilmDirectorBrief} from './master-director-brief-translation.js';
import {auditMasterBriefCrosswalk} from './master-director-brief-crosswalk.js';
import {buildMasterBriefRequirements} from './master-director-brief-requirements.js';
import {auditFilmBriefCapabilities} from './master-director-brief-capabilities.js';
import {inspectFilmBriefGeometry} from './master-director-brief-geometry.js';
import {draftFilmDirectorCaptions} from './master-director-brief-caption-draft.js';
import {prepareFilmDirectorCaptionLayerCandidates} from './master-director-brief-caption-layers.js';
import {prepareMasterMaskCandidate,openMasterMaskCandidate} from './master-director-mask-candidate.js';
import {prepareMasterSupervisorEvidence,openMasterSupervisorEvidence} from './master-director-supervisor-evidence.js';
import {reviewMasterDirectorNative} from './master-director-native-review.js';
import {MasterPreviewRequests} from './master-director-preview-requests.js';
import {MasterHybridRequests} from './master-director-hybrid-requests.js';
import {prepareTrustedHybridWork,startTrustedHybridNativeJob,verifyTrustedHybridNativeChild} from './master-director-hybrid-worker.js';
import {fileSha256} from './local-pipeline.js';
import {sealMasterPreview,findMasterPreview,discardUnsealedMasterPreview,listMasterPreviews} from './master-director-preview-index.js';
import {probeMasterDirectorSource} from './master-director-source-probe.js';
import {prepareMasterDirectorRender} from './master-director-preflight.js';
import {renderMasterDirectorPreview} from './master-director-preview-renderer.js';
import {auditMasterDirectorMedia} from './master-director-technical-audit.js';
import {createMasterDirectorContextProvider} from './master-director-context.js';
import {MasterDirectorProjectStore} from './master-director-project-store.js';
import {LivePreviews} from './live-preview.js';
import {timelineFrames} from './timeline-frames.js';
import {AdjustmentPreviews} from './adjustment-previews.js';
import {DriveResourceCache,loadAuditedDrive,auditedCandidates} from './drive-resource-library.js';
import {directorAssets,saveDirectorJSON,completeDirectorCatalog} from './director-context.js';
import {CloudDirector,buildDirectorInstructions} from './cloud-director.js';
import {PlaybackPreviews} from './playback-preview.js';
import {reviewInstructionExecution} from './instruction-execution.js';
import {externalCatalog,reviewExternalPlan} from './external-edit-plan.js';
import {adaptCreativePlan} from './creative-plan-adapter.js';
import {prepareProject} from './local-pipeline.js';
import {planInstructions} from './instruction-director.js';
import {LocalAnalysis} from './local-analysis.js';
import {proposedSourceReview} from './source-cuts.js';
import {googleAuth,readGoogleConfig,GOOGLE_CALLBACK} from './editor-google-auth.js';
import {STYLE_VARIANTS} from './style-variants.js';
import {ProjectRecovery} from './project-recovery.js';
import {fontCatalog,fontDownload} from './font-catalog.js';
import {MediaLibrary} from './media-library.js';
import {searchPrivateLibrary} from './private-library-search.js';
import {proposeLibraryCues} from './director-library-cues.js';
import {GRAPHIC_BLOCKS,GLOBAL_TRANSITIONS} from './graphic-blocks.js';
import http from 'node:http';
import {readFileSync,statSync,createReadStream,openSync,readSync,closeSync,existsSync,writeFileSync,renameSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash,randomBytes,timingSafeEqual} from 'node:crypto';
import {VideoIntake,projectConfig,projectReady} from './video-intake.js';
import {RENDERED_MOTIONS} from './semantic-render.js';
import {MOTION_ALIASES} from './foundation-integration.js';
import {EditorJobs} from './editor-jobs.js';
import {loginSetup} from './editor-login-setup.js';
import {authorizedEmail,verifyPasswordAsync,createLoginLimiter,passwordSessions,SESSION_SECONDS,validPasswordRecord} from './editor-password-auth.js';
const WEB=resolve(dirname(fileURLToPath(import.meta.url)),'../web');
const eq=(a,b)=>typeof a==='string'&&Buffer.byteLength(a)===Buffer.byteLength(b)&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
export function parseRange(value,size){
 if(!value)return {start:0,end:size-1,partial:false};
 const m=/^bytes=(\d*)-(\d*)$/.exec(value);if(!m||(!m[1]&&!m[2]))throw new Error('Invalid range');
 let start=m[1]?Number(m[1]):Math.max(0,size-Number(m[2])),end=m[1]?(m[2]?Number(m[2]):size-1):size-1;
 if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=size||end<start)throw new Error('Invalid range');
 end=Math.min(end,size-1);return {start,end,partial:true};
}
// JSON.parse alone discards repeated keys. For master drafts, scan the valid
// JSON text before accepting it so API callers get the same lossless guard as UI.
function rejectDuplicateJsonKeys(raw){
 const stack=[];
 for(let i=0;i<raw.length;i++){
  const ch=raw[i];
  if(ch==='{')stack.push(new Set());
  else if(ch==='[')stack.push(null);
  else if(ch==='}'||ch===']')stack.pop();
  else if(ch==='"'){
   const start=i;i++;
   while(i<raw.length){if(raw.charCodeAt(i)===92){i+=2;continue;}if(raw[i]==='"')break;i++;}
   let next=i+1;while(next<raw.length&&/\s/.test(raw[next]))next++;
   if(raw[next]===':'){
    const key=JSON.parse(raw.slice(start,i+1)),keys=stack.at(-1);
    if(keys?.has(key))throw Error('El plan contiene una propiedad repetida.');
    keys?.add(key);
   }
  }
 }
}
async function body(req,maxBytes=65536,{rejectDuplicates=false}={}){
 if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']??''))throw new Error('JSON required');
 const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>maxBytes)throw new Error('Request too large');chunks.push(chunk);}
 const raw=rejectDuplicates?new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks)):Buffer.concat(chunks).toString(),value=JSON.parse(raw);
 if(rejectDuplicates)rejectDuplicateJsonKeys(raw);
 if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('JSON object required');return value;
}
export function createEditorServer({directory,profiles,port=0,token=randomBytes(32).toString('hex'),renderer,storage,publicOrigin,intakeProbe,assetProbe,passwordFile=join(directory,'access','admin-password-hash'),googleOAuthFile=join(dirname(passwordFile),'google-oauth.json'),googleOAuthFetch=fetch,cloudDirector,masterDirectorContext,masterPlanGenerator=null,masterSupervisorRunner,masterMaskConfig=null,masterMaskRunner,masterSourceProbe=probeMasterDirectorSource,masterPreviewConfig,masterPreviewRenderer=renderMasterDirectorPreview,masterPreviewAuditor=auditMasterDirectorMedia,engineNextFrameRenderer=null}){
 let origin;
 if(publicOrigin){
  const parsed=new URL(publicOrigin);
  if(parsed.protocol!=='https:'||parsed.username||parsed.password||parsed.pathname!=='/'||parsed.search||parsed.hash||parsed.origin!==publicOrigin)throw new Error('Canonical HTTPS origin required');
  origin=parsed.origin;
 }
 const loginLimiter=createLoginLimiter();
 let adminPasswordHash='';
 try{adminPasswordHash=readFileSync(passwordFile,'utf8').trim();}catch(error){if(error.code!=='ENOENT')throw error;}
 if(adminPasswordHash&&!validPasswordRecord(adminPasswordHash))throw new Error('Invalid administrator password hash file');
 let sessions=passwordSessions(token,adminPasswordHash);
 const google=googleAuth({config:readGoogleConfig(googleOAuthFile),publicOrigin,fetcher:googleOAuthFetch});
 const googleReady=()=>!!google&&!!adminPasswordHash;
 const setup=loginSetup(passwordFile);
 let loginBusy=0;
 const cookie=value=>`sues_session=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_SECONDS}; Expires=${new Date(Date.now()+SESSION_SECONDS*1000).toUTCString()}${publicOrigin?'; Secure':''}`;
 const previews=new PlaybackPreviews(join(directory,'playback-previews'),{canBuild:()=>!jobs.children.size&&!jobs.previewBusy});const jobs=new EditorJobs({directory,profiles,renderer,storage});jobs.preparePlayback=(job,source)=>previews.ensure(job.id,source);let intake,assets,recoveries;try{assets=new MediaLibrary(join(directory,'assets'),{probe:assetProbe});jobs.assetResolver=(id,kind)=>assets.resolve(id,kind);jobs.narrativeResolver=transcript=>proposeLibraryCues(directory,transcript);jobs.defaultMusicResolver=duration=>{const rows=assets.list().filter(a=>a.kind==='audio'&&a.duration>=duration&&(()=>{const m=assets.metadata(a.id);return m?.license.rightsStatus==='verified'&&m.license.commercialUseAllowed;})()).sort((a,b)=>(b.id==='55fc796a8b8062f55686ef690d724522d0d67f5393d72aade9c6c0d631c8dff6')-(a.id==='55fc796a8b8062f55686ef690d724522d0d67f5393d72aade9c6c0d631c8dff6')||a.duration-b.duration);return rows[0]??null;};recoveries=new ProjectRecovery(join(directory,'recoveries'),profiles);intake=new VideoIntake(join(directory,'uploads'),profiles,{probe:intakeProbe});}catch(error){void jobs.close();throw error;}let expectedHost;
 const adjustmentPreviews=new AdjustmentPreviews(join(directory,'adjustment-previews'),jobs,{playbackBusy:()=>previews.pending.size>0});
 const livePreviews=new LivePreviews(join(directory,'live-previews'),jobs,{busy:()=>previews.pending.size>0||!!adjustmentPreviews.running});
 const analysis=new LocalAnalysis(intake);
 const engineNextClient=process.env.SUES_ENGINE_NEXT_FABLECUT_URL?new FableCutClient({baseUrl:process.env.SUES_ENGINE_NEXT_FABLECUT_URL}):null;
 const nativeFrame=(engineNextClient&&engineNextFrameRenderer)||
  (engineNextClient&&process.env.SUES_ENGINE_NEXT_PUPPETEER_CORE&&process.env.SUES_ENGINE_NEXT_CHROME_PATH?
   new ProgramFrameRenderer({client:engineNextClient,puppeteer:createRequire(import.meta.url)(process.env.SUES_ENGINE_NEXT_PUPPETEER_CORE),executablePath:process.env.SUES_ENGINE_NEXT_CHROME_PATH}):null);
 const masterContextProvider=masterDirectorContext??createMasterDirectorContextProvider(directory);
 const masterPreviewRuns=new Map();
 const masterHybridRuns=new Map();
 const masterGeneratorRuns=new Set();
 const masterSupervisorRuns=new Set();
 const cloudRuns=new Set();
 const cloud=cloudDirector??new CloudDirector({credentialsFile:join(dirname(passwordFile),'cloud-director-keys.json')});
 const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));};
 const sourcePreviewId=sha=>{if(!/^[a-f0-9]{64}$/.test(sha))throw Error('Unknown source identifier');const hex=sha.slice(0,32);return [hex.slice(0,8),hex.slice(8,12),hex.slice(12,16),hex.slice(16,20),hex.slice(20,32)].join('-');};
 const sourceStream=(req,res,file,contentType)=>{
  const size=statSync(file).size;let range;try{range=parseRange(req.headers.range,size);}catch{res.setHeader('Content-Range',`bytes */${size}`);res.writeHead(416);return res.end();}
  const fd=openSync(file,'r'),head=Buffer.alloc(12);try{readSync(fd,head,0,12,0);}finally{closeSync(fd);}
  res.setHeader('Content-Type',contentType??(head.subarray(0,4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3]))?'video/webm':'video/mp4'));res.setHeader('Accept-Ranges','bytes');res.setHeader('Content-Length',range.end-range.start+1);if(range.partial)res.setHeader('Content-Range',`bytes ${range.start}-${range.end}/${size}`);res.writeHead(range.partial?206:200);if(req.method==='HEAD')return res.end();const stream=createReadStream(file,{start:range.start,end:range.end});res.on('close',()=>stream.destroy());stream.on('error',()=>res.destroy());return stream.pipe(res);
 };
 const server=http.createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Cross-Origin-Resource-Policy','same-origin');
  res.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'; manifest-src 'self'; font-src 'self'; style-src 'self'; img-src 'self' data:; media-src 'self' blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
  try{
   if(req.headers.host!==expectedHost)return json(res,403,{error:'Host rejected'});
   if(req.headers.origin&&req.headers.origin!==origin)return json(res,403,{error:'Origin rejected'});
   const url=new URL(req.url,origin),path=url.pathname;
   if(path==='/api/auth/options'&&req.method==='GET')return json(res,200,{google:googleReady()});
   if(path==='/api/auth/google/start'&&req.method==='POST'){
    if(req.headers['x-sues-request']!=='editor')return json(res,403,{error:'Request header required'});
    if(!googleReady())return json(res,503,{error:'Google todavía no está configurado. Utiliza tu correo y contraseña.'});
    try{const launch=google.begin();res.setHeader('Set-Cookie',launch.cookie);return json(res,200,{url:launch.url});}catch{return json(res,429,{error:'Demasiados accesos pendientes. Vuelve a intentarlo más tarde.'});}
   }
   if(path===GOOGLE_CALLBACK&&req.method==='GET'){
    let success=false;
    if(googleReady()){try{await google.complete(url.searchParams,req.headers.cookie);success=true;}catch{/* Never expose codes, tokens or provider errors. */}}
    res.setHeader('Set-Cookie',success?[google.clearCookie(),cookie(sessions.issue())]:[google?.clearCookie()??'sues_google=; Secure; HttpOnly; SameSite=Lax; Path=/api/auth/google; Max-Age=0']);
    res.writeHead(303,{Location:success?'/':'/?google=failed'});return res.end();
   }
   if(path==='/api/password/setup'&&req.method==='POST'){
    if(req.headers['x-sues-request']!=='editor')return json(res,403,{error:'Request header required'});
    const key=req.socket.remoteAddress||'unknown';
    if(!loginLimiter.allowed(key))return json(res,429,{error:'Demasiados intentos. Espera 15 minutos.'});
    let value;try{value=await body(req,4096);}catch{return json(res,400,{error:'Solicitud no válida'});}
    loginLimiter.fail(key);
    if(value.password!==value.confirmation)return json(res,400,{error:'Las contraseñas no coinciden'});
    try{adminPasswordHash=setup.apply(value.token,value.password);}catch(error){return json(res,400,{error:error.code?'No se pudo guardar el acceso de forma segura':error.message});}
    sessions=passwordSessions(token,adminPasswordHash);loginLimiter.clear(key);
    res.setHeader('Set-Cookie',cookie(sessions.issue()));
    return json(res,200,{ok:true});
   }
   if(path==='/api/login'&&req.method==='POST'){
    if(req.headers['x-sues-request']!=='editor')return json(res,403,{error:'Request header required'});
    if(!adminPasswordHash)return json(res,503,{error:'Inicio de sesión pendiente de configuración. Usa tu enlace privado o configura el acceso en el servidor.'});
    const key=req.socket.remoteAddress||'unknown';
    if(!loginLimiter.allowed(key)||loginBusy>=2)return json(res,429,{error:'Demasiados intentos. Espera 15 minutos.'});
    let credentials;try{credentials=await body(req,4096);}catch{return json(res,400,{error:'Solicitud no válida'});}
    if(!loginLimiter.allowed(key)||loginBusy>=2)return json(res,429,{error:'Demasiados intentos. Espera 15 minutos.'});
    loginLimiter.fail(key);loginBusy++;
    let valid=false;
    try{const passwordOK=await verifyPasswordAsync(credentials.password,adminPasswordHash);valid=authorizedEmail(credentials.email)&&passwordOK;}finally{loginBusy--;}
    if(!valid)return json(res,401,{error:'Correo o contraseña incorrectos'});
    loginLimiter.clear(key);
    res.setHeader('Set-Cookie',cookie(sessions.issue()));
    return json(res,200,{ok:true});
   }
   if(path==='/api/session'&&req.method==='POST'){
    if(!eq(req.headers.authorization,`Bearer ${token}`))return json(res,401,{error:'Session required'});
    res.setHeader('Set-Cookie',cookie(token));return json(res,200,{ok:true});
   }
   if(path.startsWith('/api/')){
    const cookie=/(?:^|;\s*)sues_session=([^;]+)/.exec(req.headers.cookie??'')?.[1];
    if(!eq(cookie,token)&&!sessions.valid(cookie))return json(res,401,{error:'Session required'});
    if(!['GET','HEAD'].includes(req.method)&&req.headers['x-sues-request']!=='editor')return json(res,403,{error:'Request header required'});
    if(path==='/api/logout'&&req.method==='POST'){res.setHeader('Set-Cookie',`sues_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${publicOrigin?'; Secure':''}`);return json(res,200,{ok:true});}
    // Opt-in staging bridge: authenticated SUES session + same-origin CSRF controls
    // are already enforced above. Never proxy the unauthenticated FableCut HTTP API.
    if(path==='/api/engine-next/project' && req.method==='GET'){
      if(!engineNextClient)return json(res,503,{error:'El nuevo estudio todavía no está activado en este entorno.'});
      try{
        const {data:p,projectId}=await engineNextClient.getProject();
        return json(res,200,{schema:'sues-engine-next-study/v1',projectId,revision:p.revision,name:p.name,width:p.width,height:p.height,
          tracks:p.tracks,clips:p.clips.map(c=>({id:c.id,name:c.name,kind:c.kind,track:c.track,start:c.start,duration:c.duration,disabled:!!c.disabled,locked:!!c.locked,x:c.props?.x??0,y:c.props?.y??0,scale:c.props?.scale??1,fontSize:c.kind==='text'?c.props?.fontSize:null})),
          media:p.media.map(m=>({id:m.id,name:m.name,kind:m.kind,playable:['video','audio','image'].includes(m.kind)})),editable:true,cinematicQA:false});
      }catch{return json(res,503,{error:'El motor NLE no responde; no se han realizado cambios.'});}
    }
    const engineMediaMatch=/^\/api\/engine-next\/media\/([a-zA-Z0-9_:-]{1,120})$/.exec(path);
    if(engineMediaMatch && ['GET','HEAD'].includes(req.method)){
      if(!engineNextClient)return json(res,503,{error:'Nuevo estudio no activado.'});
      try{
        const {response, item}=await engineNextClient.getMediaStream(engineMediaMatch[1],{range:req.headers.range});
        const type=item.kind==='image'?(item.src.toLowerCase().endsWith('.png')?'image/png':item.src.toLowerCase().endsWith('.webp')?'image/webp':'image/jpeg'):item.kind==='audio'?'audio/mp4':item.src.endsWith('.webm')?'video/webm':item.src.endsWith('.mov')?'video/quicktime':'video/mp4';
        res.setHeader('Content-Type',type);res.setHeader('Accept-Ranges','bytes');
        for(const key of ['content-length','content-range']){const value=response.headers.get(key);if(value)res.setHeader(key,value);}
        res.writeHead(response.status);
        if(req.method==='HEAD'){await response.body?.cancel();return res.end();}
        if(!response.body)return res.end();
        const {Readable}=await import('node:stream');
        return Readable.fromWeb(response.body).on('error',()=>res.destroy()).pipe(res);
      }catch{return json(res,404,{error:'Media del proyecto no disponible.'});}
    }
    if(path==='/api/engine-next/program-frame' && req.method==='GET'){
      if(!engineNextClient||!nativeFrame)return json(res,503,{error:'Vista compuesta nativa no activada para este entorno.'});
      const time=Number(url.searchParams.get('time')),revision=Number(url.searchParams.get('revision'));
      if(!url.searchParams.has('time')||!url.searchParams.has('revision')||!Number.isFinite(time)||time<0||time>300||!Number.isInteger(revision)||revision<0)
        return json(res,400,{error:'Tiempo o revisión inválidos.'});
      try{
        const frame=await nativeFrame.capture({time,expectedRevision:revision});
        res.setHeader('Content-Type','image/png');res.setHeader('Content-Length',frame.png.length);
        res.setHeader('X-Sues-Frame-Revision',String(frame.revision));res.setHeader('X-Sues-Frame-Time',String(frame.time));
        res.setHeader('X-Sues-Cinematic-QA','not-approved');res.writeHead(200);return res.end(frame.png);
      }catch(error){return json(res,error instanceof ProgramFrameBusy?429:503,{error:error instanceof ProgramFrameBusy?'El visor nativo está ocupado.':'No se pudo obtener un fotograma nativo verificable.'});}
    }
    if(path==='/api/engine-next/clip-transform' && req.method==='POST'){
      if(!engineNextClient)return json(res,503,{error:'Motor NLE no activado.'});
      const b=await body(req,1024);
      if(Object.keys(b).some(k=>!['expectedRevision','clipId','x','y','scale'].includes(k)) ||
          !Number.isInteger(b.expectedRevision)||b.expectedRevision<0 ||
          typeof b.clipId!=='string'||!/^[-a-zA-Z0-9_]{1,100}$/.test(b.clipId)||
          !Number.isInteger(b.x)||Math.abs(b.x)>1080||!Number.isInteger(b.y)||Math.abs(b.y)>1920||
          typeof b.scale!=='number'||!Number.isFinite(b.scale)||b.scale<0.1||b.scale>2)
        return json(res,400,{error:'Posición o escala inválidas.'});
      try{
        const result=await engineNextClient.updateProject(p=>{
          const clip=p.clips.find(c=>c.id===b.clipId&&['video','image'].includes(c.kind)&&!c.locked);
          if(!clip)throw Error('Locked or unsupported clip');
          clip.props={...clip.props,x:b.x,y:b.y,scale:b.scale};return p;
        },{expectedRevision:b.expectedRevision});
        return json(res,200,{ok:true,revision:result.revision,clipId:b.clipId,x:b.x,y:b.y,scale:b.scale,cinematicQA:false});
      }catch(e){return json(res,e instanceof FableCutConflict?409:422,{error:e instanceof FableCutConflict?'Revisión desactualizada; recarga antes de editar.':'No se puede transformar esta capa.'});}
    }
    if(path==='/api/engine-next/title-size' && req.method==='POST'){
      if(!engineNextClient)return json(res,503,{error:'Motor NLE no activado.'});
      const b=await body(req,1024);
      if(Object.keys(b).some(k=>!['expectedRevision','clipId','fontSize'].includes(k)) ||
          !Number.isInteger(b.expectedRevision)||b.expectedRevision<0 ||
          typeof b.clipId!=='string'||!/^[-a-zA-Z0-9_]{1,100}$/.test(b.clipId)||
          !Number.isInteger(b.fontSize)||b.fontSize<20||b.fontSize>140)
        return json(res,400,{error:'Propiedades del título no válidas.'});
      try{
        const result=await engineNextClient.updateProject(p=>{
          const clip=p.clips.find(c=>c.id===b.clipId&&c.kind==='text');
          if(!clip)throw Error('Title not found');
          clip.props={...clip.props,fontSize:b.fontSize};return p;
        },{expectedRevision:b.expectedRevision});
        return json(res,200,{ok:true,revision:result.revision,projectId:result.projectId,clipId:b.clipId,fontSize:b.fontSize});
      }catch(e){
        return json(res,e instanceof FableCutConflict?409:422,{error:e instanceof FableCutConflict?'Otro cambio modificó el proyecto. Actualiza y vuelve a intentarlo.':'El cambio no se ha podido aplicar.'});
      }
    }
    if(path==='/api/fonts'&&req.method==='GET')return json(res,200,fontCatalog());
    const fontMatch=/^\/api\/fonts\/([a-z-]+)\/(file|license)$/.exec(path);
    if(fontMatch&&['GET','HEAD'].includes(req.method)){const f=fontDownload(fontMatch[1],fontMatch[2]);if(!f)return json(res,404,{error:'Font not found'});const bytes=readFileSync(f.path);res.setHeader('Content-Type',f.contentType);res.setHeader('Content-Disposition',`attachment; filename="${f.filename}"`);res.setHeader('Content-Length',bytes.length);res.writeHead(200);return res.end(req.method==='HEAD'?undefined:bytes);}
    if(path==='/api/ai/providers'&&req.method==='GET')return json(res,200,{providers:cloud.providers(),automaticFallback:false});
    if(path==='/api/assets'&&req.method==='GET')return json(res,200,assets.list());
    if(path==='/api/library/capacity'&&req.method==='GET')return json(res,200,assets.capacity());
    if(path==='/api/resource-catalog'&&req.method==='GET')return json(res,200,assets.semanticCatalog());
    if(path==='/api/library/search'&&req.method==='GET'){
     const q=url.searchParams.get('q')??'',limit=url.searchParams.has('limit')?Number(url.searchParams.get('limit')):8;
     if(!q.trim()||q.length>250||!Number.isInteger(limit)||limit<1||limit>20)return json(res,400,{error:'Consulta o límite no válido'});
     try{return json(res,200,searchPrivateLibrary(directory,q,{limit}));}
     catch(error){return json(res,503,{error:'Índice privado de biblioteca no disponible'});}
    }
    if(path==='/api/library/materialize'&&req.method==='POST'){
     const value=await body(req,2048);
     if(!value||Object.keys(value).some(k=>!['driveId','rights'].includes(k)))return json(res,400,{error:'Solicitud Drive inválida'});
     try{const cache=new DriveResourceCache(directory);return json(res,201,await cache.materialize(value.driveId,{assets,rights:value.rights}));}
     catch(error){return json(res,422,{error:String(error.message).slice(0,180)});}
    }
    const assetMetadataMatch=/^\/api\/assets\/([a-f0-9]{64})\/metadata$/.exec(path);
    if(assetMetadataMatch&&req.method==='GET'){const resource=assets.semanticCatalog().assets.find(a=>a.id===assetMetadataMatch[1]);return json(res,resource?200:404,resource??{error:'Recurso ausente'});}
    if(assetMetadataMatch&&req.method==='PUT')return json(res,200,assets.saveMetadata(assetMetadataMatch[1],await body(req,65536)));
    if(path==='/api/assets'&&req.method==='POST'){req.setTimeout(120000);return json(res,201,await assets.receive(req,{kind:url.searchParams.get('kind'),rights:url.searchParams.get('rights'),title:url.searchParams.get('name')}));}
    const assetMatch=/^\/api\/assets\/([a-f0-9]{64})\/media$/.exec(path);
    if(assetMatch&&['GET','HEAD'].includes(req.method)){
     const a=assets.resolve(assetMatch[1]),size=a.bytes;let range;try{range=parseRange(req.headers.range,size);}catch{res.setHeader('Content-Range',`bytes */${size}`);res.writeHead(416);return res.end();}
     res.setHeader('Content-Type',a.mimeType);res.setHeader('Accept-Ranges','bytes');res.setHeader('Content-Length',range.end-range.start+1);if(range.partial)res.setHeader('Content-Range',`bytes ${range.start}-${range.end}/${size}`);res.writeHead(range.partial?206:200);if(req.method==='HEAD')return res.end();const stream=createReadStream(a.localFile,{start:range.start,end:range.end});res.on('close',()=>stream.destroy());stream.on('error',()=>res.destroy());return stream.pipe(res);
    }
    if(path==='/api/uploads'&&req.method==='GET')return json(res,200,intake.list());
    const sourceSuggestions=/^\/api\/uploads\/([a-f0-9]{64})\/cut-suggestions$/.exec(path);
    if(sourceSuggestions&&req.method==='GET'){
      const id=sourceSuggestions[1],upload=intake.list().find(u=>u.id===id);
      if(!upload||upload.state!=='READY'||!upload.profileId||!Object.hasOwn(profiles,upload.profileId))return json(res,409,{error:'Transcribe primero el vídeo para proponer cortes. Los cortes manuales se pueden marcar en cualquier momento.'});
      const config=projectConfig(profiles[upload.profileId]),transcript=JSON.parse(readFileSync(config.transcriptPath,'utf8'));
      return json(res,200,proposedSourceReview(transcript));
    }
    if(path==='/api/recoveries'&&req.method==='GET')return json(res,200,recoveries.list());
    if(path==='/api/recoveries'&&req.method==='POST'){
     req.setTimeout(900000);const recovered=await recoveries.receive(req);
     const job=jobs.list().find(j=>j.profileId===recovered.profileId)??jobs.create(recovered.profileId,recoveries.settings(recovered.profileId));
     return json(res,201,{recovery:recovered,job});
    }
    const uploadSource=/^\/api\/uploads\/([a-f0-9]{64})\/media$/.exec(path);
    if(uploadSource&&['GET','HEAD'].includes(req.method))return sourceStream(req,res,intake.media(uploadSource[1]));
    const profileSource=/^\/api\/profiles\/([^/]+)\/source$/.exec(path);
    if(profileSource&&['GET','HEAD'].includes(req.method)){const id=decodeURIComponent(profileSource[1]);if(!Object.hasOwn(profiles,id))throw new Error('Unknown profile');return sourceStream(req,res,jobs.loadProfile(id).sourcePath);}
    const jobSource=/^\/api\/jobs\/([a-f0-9-]+)\/source$/.exec(path);
    if(jobSource&&['GET','HEAD'].includes(req.method)){const job=jobs.get(jobSource[1]),project=jobs.loadProfile(job.profileId);if(project.inputs.source.sha256!==jobs.plan(job.id).manifest.source.sha256)throw new Error('Source changed; prepare the montage again');if(url.searchParams.get('preview')==='1'){const proxy=await previews.ensure(sourcePreviewId(project.inputs.source.sha256),project.sourcePath);res.setHeader('X-Sues-Playback','light-proxy');return sourceStream(req,res,proxy);}return sourceStream(req,res,project.sourcePath);}
    const localAnalysisMatch=/^\/api\/uploads\/([a-f0-9]{64})\/transcribe$/.exec(path);
    if(localAnalysisMatch&&req.method==='POST')return json(res,202,analysis.request(localAnalysisMatch[1]));
    if(localAnalysisMatch&&req.method==='GET')return json(res,200,analysis.status(localAnalysisMatch[1]));
    const briefMatch=/^\/api\/uploads\/([a-f0-9]{64})\/brief$/.exec(path);
    if(briefMatch&&req.method==='POST'){const b=await body(req);return json(res,200,intake.saveBrief(briefMatch[1],b.prompt,b));}
    const analysisMatch=/^\/api\/uploads\/([a-f0-9]{64})\/analysis$/.exec(path);
    if(analysisMatch&&req.method==='POST'){if(jobs.list().some(j=>j.profileId==='upload-'+analysisMatch[1]))throw new Error('Analysis owned by existing jobs; restore original assets');return json(res,200,intake.importAnalysis(analysisMatch[1],await body(req,2*1024*1024)));}
    if(path==='/api/uploads'&&req.method==='POST'){req.setTimeout(120000);return json(res,201,await intake.receive(req,{name:url.searchParams.get('name')}));}
    if(path==='/api/health'&&req.method==='GET')return json(res,200,{...jobs.health(),localTranscriptionAvailable:analysis.available(),googleLoginConfigured:googleReady(),passwordLoginConfigured:!!adminPasswordHash,passwordSetupConfigured:setup.available()});
    if(path==='/api/design'&&req.method==='GET'){
     const id=url.searchParams.get('profileId');if(!Object.hasOwn(profiles,id))return json(res,404,{error:'Unknown profile'});
     const config=projectConfig(profiles[id]),read=p=>JSON.parse(readFileSync(p,'utf8')),brand=read(config.brandKitPath),template=read(config.templatePath),catalog=read(config.catalogPath);
     return json(res,200,{brand,template,graphicBlocks:GRAPHIC_BLOCKS,transitions:GLOBAL_TRANSITIONS,styles:Object.entries(STYLE_VARIANTS).map(([id,v])=>({id,available:true,status:v.status,pacing:v.pacing})),motions:catalog.map(m=>({id:m.id,type:m.type,tags:m.tags,minDuration:m.trigger.minDuration,reasons:m.trigger.semanticReasons,rendered:RENDERED_MOTIONS.includes(m.id),allowedInTemplate:template.motion.allowed.map(a=>MOTION_ALIASES[a]??a).includes(m.id)}))});
    }
    if(path==='/api/profiles'&&req.method==='GET'){const recovered=new Map(recoveries.list().map(r=>[r.profileId,r.title]));return json(res,200,Object.keys(profiles).map(id=>({id,title:recovered.has(id)?recovered.get(id)+' · recuperado':id.startsWith('upload-')?'Vídeo subido':id,template:'SUES_CALMA',mode:'existing-transcript-and-vision',ready:projectReady(profiles[id])})));}
    // Chat-compatible discovery: one current editable job per project, never
    // a list of obsolete renders. No source files or private paths exposed.
    const projects=()=>{
     const groups=new Map();
     for(const job of jobs.list().filter(j=>!j.intermediate)){
      const key=job.projectId??job.profileId,current=groups.get(key);
      if(!current||(job.updatedAt??job.createdAt)>(current.updatedAt??current.createdAt)||
          job.updatedAt===current.updatedAt&&job.createdAt>current.createdAt)groups.set(key,job);
     }
     return [...groups.entries()].map(([projectId,job])=>{
      let cursor=job,masterRevision=null,masterJobId=null,integrityError=false;
      const visited=new Set();
      while(cursor&&!visited.has(cursor.id)){
       visited.add(cursor.id);
       try{
        const found=new MasterDirectorProjectStore(jobs.dir(cursor.id),async()=>null).current();
        if(found.revision){masterRevision=found.revision;masterJobId=cursor.id;break;}
       }catch{integrityError=true;break;}
       cursor=cursor.parentId?jobs.jobs.get(cursor.parentId):null;
      }
      // Source lineage is informational; it never transfers creative approval.
      // Do not reveal media paths, credentials, or raw project configuration.
      let sourceVersion={kind:'UNVERIFIED',canInheritApproval:false,requiresFreshPlanReview:true};
      try{
       const profile=jobs.loadProfile(job.profileId),lineage=JSON.parse(readFileSync(profile.configPath,'utf8')).sourceLineage;
       if(lineage?.schema==='sues-master-source-lineage/v1'&&lineage.type==='cfr30-derived-from-vfr'&&lineage.derivedSha256===profile.inputs.source.sha256&&lineage.approvalInherited===false&&lineage.originalPreserved===true){
        sourceVersion={kind:'CFR30_DERIVED',sha256:profile.inputs.source.sha256,
         originalSha256:lineage.originalSha256,originalPreserved:lineage.originalPreserved===true,
         canInheritApproval:false,requiresFreshPlanReview:true};
       }else if(!lineage){
        sourceVersion={kind:'ORIGINAL',sha256:profile.inputs.source.sha256,
         canInheritApproval:false,requiresFreshPlanReview:false};
       }
      }catch{integrityError=true;}
      return {projectId,title:job.projectTitle??job.title,activeJobId:job.id,
       updatedAt:job.updatedAt??job.createdAt,state:job.state,styleId:job.settings?.styleId??null,
       masterRevision,masterJobId,masterEditable:!!masterRevision&&masterJobId===job.id&&!integrityError,
       sourceVersion,
       ...(integrityError?{issue:'PROJECT_REVISION_INTEGRITY_ERROR'}:{})};
     }).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)||a.projectId.localeCompare(b.projectId));
    };
    if(path==='/api/projects'&&req.method==='GET')return json(res,200,{projects:projects()});
    const projectCurrent=/^\/api\/projects\/([A-Za-z0-9][A-Za-z0-9._:-]{0,127})\/current$/.exec(path);
    if(projectCurrent&&req.method==='GET'){
     const found=projects().find(row=>row.projectId===projectCurrent[1]);
     return json(res,found?200:404,found??{error:'Proyecto no encontrado'});
    }
    if(path==='/api/jobs'&&req.method==='GET')return json(res,200,jobs.list());
    if(path==='/api/jobs'&&req.method==='POST'){
     const b=await body(req);return json(res,201,jobs.create(b.profileId,b.settings??{},{parentId:b.parentId,projectTitle:b.projectTitle,newProject:b.newProject===true,...(b.useTemplateOnly===true?{instruction:{text:'Edición solo con la plantilla. El prompt guardado no se ha aplicado.',actions:[],at:new Date().toISOString()}}:{})}));
    }
    const match=/^\/api\/jobs\/([a-f0-9-]+)(?:\/(plan|review|acceptance|backup|render|cancel|preview|media|audit|undo|direct-plan|direct|external-catalog|external-review|external-execute|external-draft|creative-review|ai-plan|ai-context|library-cues|poster|timeline-frames|live-preview|adjust-preview|master-draft|master-generate|master-review|master-decision|master-layers|master-trace|master-supervisor|master-supervisor-evidence|master-mask-candidate|master-mask-frame|master-layer-edit|master-operation-edit|master-versions|master-current|master-current-operation-edit|master-current-layer-edit|master-current-command|master-pause-audit|master-source-brief|master-brief-translation|master-brief-crosswalk|master-brief-requirements|master-brief-capabilities|master-brief-geometry|master-brief-caption-draft|master-brief-caption-layers|master-render-preflight|master-preview|master-preview-media|master-previews|master-preview-status|master-native-review|master-native-apply|master-hybrid-start|master-hybrid-status))?$/.exec(path);
    if(!match)return json(res,404,{error:'Not found'});
    const [,id,action]=match;
    // Never expose a private native hybrid stage as a standalone final export.
    const stageInstruction=jobs.get(id).instructions?.at(-1);
    if(stageInstruction?.kind==='master-hybrid-native-stage'&&action&&action!=='cancel')
     return json(res,409,{status:'BLOCKED',error:'Esta versión es una etapa intermedia del montaje mixto; consulta el proyecto principal.'});
    if(['master-draft','master-generate','master-review','master-decision','master-layers','master-trace','master-supervisor','master-supervisor-evidence','master-mask-candidate','master-mask-frame','master-layer-edit','master-operation-edit','master-versions','master-current','master-current-operation-edit','master-current-layer-edit','master-current-command','master-pause-audit','master-source-brief','master-brief-translation','master-brief-crosswalk','master-brief-requirements','master-brief-capabilities','master-brief-geometry','master-brief-caption-draft','master-brief-caption-layers','master-render-preflight','master-preview','master-preview-media','master-previews','master-preview-status','master-native-review','master-native-apply','master-hybrid-start','master-hybrid-status'].includes(action)){
     const source=jobs.get(id);
     const store=new MasterDirectorProjectStore(jobs.dir(id),async(story)=>{
      // Provider is injected only by trusted server startup, never request JSON.
      if(typeof masterContextProvider!=='function')return null;
      const current=jobs.get(id),project=jobs.loadProfile(current.profileId);
      const catalog=externalCatalog(project,current.settings,assets.list());
      const verified=await masterContextProvider({jobId:id,project,job:current,assets,catalog,story});
      if(!verified)return null;
      return {...verified,sourceSha256:catalog.sourceSha256,timelineFingerprint:catalog.timelineFingerprint,duration:catalog.duration,
        // Internal logical preflight only: never records approval or launches work.
        nativePreflight:(plan,registry)=>reviewMasterDirectorNative({plan,registry,catalog,project,
         settings:current.settings,assets:assets.list(),commandPlanner:planInstructions})};
     });
     // Full mixed-engine execution is private and authenticated. A native child is
     // strictly intermediate; only a sealed Remotion preview can reach HUMAN_QA.
     if(action==='master-hybrid-status'&&req.method==='GET'){
      const requestId=url.searchParams.get('requestId');
      if(!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(requestId??''))
       return json(res,400,{error:'Identificador híbrido inválido.'});
      const requests=new MasterHybridRequests(jobs.dir(id)),record=requests.get(requestId);
      if(!record)return json(res,404,{error:'Ejecución mixta no encontrada.'});
      if(record.status==='RUNNING'&&!masterHybridRuns.has(id+':'+requestId)){
       record.status='INTERRUPTED';record.step='NEEDS_OPERATOR_DIAGNOSIS';
       record.issues=[{code:'HYBRID_RUN_INTERRUPTED_NO_AUTOMATIC_REPLAY'}];requests.save(record);
      }
      return json(res,200,record);
     }
     if(action==='master-hybrid-start'&&req.method==='POST'){
      const b=await body(req,2048,{rejectDuplicates:true});
      if(Object.keys(b).some(k=>!['revision','decisionId','requestId','quality'].includes(k))||!['preview','full-hd'].includes(b.quality??'preview')||
         !/^[a-f0-9]{64}$/.test(b.revision??'')||!/^[a-f0-9]{64}$/.test(b.decisionId??'')||
         !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(b.requestId??''))
       return json(res,400,{error:'Identificadores de proyecto mixto inválidos.'});
      if(!masterPreviewConfig)return json(res,503,{error:'El runtime privado de Remotion no está configurado.'});
      const quality=b.quality??'preview',requests=new MasterHybridRequests(jobs.dir(id)),old=requests.get(b.requestId),key=id+':'+b.requestId;
      if(old){
       if(old.revision!==b.revision||old.decisionId!==b.decisionId||(old.quality??'preview')!==quality)
        return json(res,409,{error:'El identificador pertenece a un plan o formato distinto.'});
       if(old.status==='RUNNING'&&!masterHybridRuns.has(key))
        return json(res,409,{error:'La ejecución anterior quedó interrumpida; necesita diagnóstico.'});
       return json(res,old.status==='RUNNING'?202:200,old);
      }
      if(requests.hasInterrupted()||requests.records().some(r=>r.status==='RUNNING')||
         [...masterHybridRuns.keys()].some(k=>k.startsWith(id+':'))||
         jobs.previewBusy||jobs.children.size||jobs.queued().length||jobs.publishing.size||
         previews.pending.size||adjustmentPreviews.running)
       return json(res,409,{error:'Hay otra ejecución activa o interrumpida; necesita revisión.'});
      const work=await prepareTrustedHybridWork({store,jobs,jobId:id,revision:b.revision,
       decisionId:b.decisionId,requestId:b.requestId,assets,commandPlanner:planInstructions});
      if(work.status!=='READY_TO_START_NATIVE_STAGE')
       return json(res,409,{status:'BLOCKED',issues:work.issues??[{code:'HYBRID_NOT_READY'}]});
      const record=requests.create({...b,quality}),previewRoot=join(jobs.dir(id),'master-director','previews');
      const task=(async()=>{
       let output=null,locked=false;
       const fail=(status,code,reason)=>{record.status=status;record.step='STOPPED';
        record.issues=[{code,...(typeof reason==='string'?{reason}:{})}];requests.save(record);};
       try{
        const started=await startTrustedHybridNativeJob({work,jobs,store,assets,commandPlanner:planInstructions});
        if(started.status!=='NATIVE_STAGE_QUEUED'){fail('BLOCKED',started.issues?.[0]?.code??'HYBRID_NATIVE_STAGE_REJECTED');return;}
        record.childId=started.childId;record.step='NATIVE_RENDERING';requests.save(record);
        let child;
        for(let i=0;i<1500;i++){
         child=jobs.get(started.childId);
         if(['DONE','FAILED','PUBLISH_FAILED','CANCELLED'].includes(child.state)||jobs.closing)break;
         await new Promise(resolve=>setTimeout(resolve,200));
        }
        if(jobs.closing){fail('INTERRUPTED','HYBRID_SERVER_CLOSING');return;}
        if(child?.state!=='DONE'){fail('BLOCKED','HYBRID_NATIVE_RENDER_NOT_COMPLETE');return;}
        record.step='VERIFYING_NATIVE';requests.save(record);
        const verified=await verifyTrustedHybridNativeChild({store,jobs,parentId:id,childId:child.id,
         revision:b.revision,decisionId:b.decisionId,assets,auditor:masterPreviewAuditor});
        if(verified.status!=='HANDOFF_READY_FOR_PRIVATE_PREVIEW'){
         fail('BLOCKED',verified.issues?.[0]?.code??'HYBRID_NATIVE_HANDOFF_REJECTED');return;
        }
        // The intermediate child has NOT been approved as the final video.
        record.nativeOutputSha256=verified.mediaAudit.outputSha256;
        record.step='WAITING_FOR_REMOTION_CAPACITY';requests.save(record);
        for(let i=0;i<450;i++){
         if(jobs.closing)break;
         if(!jobs.previewBusy&&!jobs.children.size&&!jobs.queued().length&&!jobs.publishing.size&&
            !previews.pending.size&&!adjustmentPreviews.running)break;
         await new Promise(resolve=>setTimeout(resolve,200));
        }
        if(jobs.closing){fail('INTERRUPTED','HYBRID_SERVER_CLOSING');return;}
        if(jobs.previewBusy||jobs.children.size||jobs.queued().length||jobs.publishing.size||
           previews.pending.size||adjustmentPreviews.running){fail('BLOCKED','HYBRID_PREVIEW_CAPACITY_UNAVAILABLE');return;}
        jobs.previewBusy=true;locked=true;record.step='REMOTION_RENDERING';requests.save(record);
        const approvalCheck=async()=>{
         try{
          const current=jobs.get(id),native=jobs.get(child.id);
          const layers=await store.layers(b.revision,b.decisionId),original=jobs.loadProfile(current.profileId),
           catalog=externalCatalog(original,current.settings,assets.list());
          return native.state==='DONE'&&native.parentId===id&&
           layers.hybrid?.status==='MIXED_COMPONENTS_STAGED_NOT_RENDERABLE'&&
           layers.hybrid.planFingerprint===verified.handoff.sourceLineage.approvedPlanFingerprint&&
           catalog.timelineFingerprint===layers.graph.timelineFingerprint&&
           catalog.sourceSha256===verified.handoff.sourceLineage.originalSourceSha256&&
           fileSha256(verified.outputPath)===verified.mediaAudit.outputSha256;
         }catch{return false;}
        };
        if(!await approvalCheck()){fail('BLOCKED','HYBRID_APPROVAL_OR_SOURCE_CHANGED');return;}
        const original=jobs.loadProfile(jobs.get(id).profileId),
         derived={...original,sourcePath:verified.outputPath,boundHashes:{...original.boundHashes,source:verified.mediaAudit.outputSha256}};
        const result=await masterPreviewRenderer({composition:verified.handoff.composition,project:derived,
         assets,workRoot:previewRoot,entryFile:masterPreviewConfig.entryFile,remotionCli:masterPreviewConfig.remotionCli,
         browserExecutable:masterPreviewConfig.browserExecutable,browserLibraryPath:masterPreviewConfig.browserLibraryPath,
         approvalCheck,quality});
        if(result.status!=='PREVIEW_RENDERED_UNVERIFIED'){fail('BLOCKED',result.issues?.[0]?.code??'HYBRID_REMOTION_FAILED',result.issues?.[0]?.reason);return;}
        output=result.outputPath;
        const audit=await masterPreviewAuditor({sourcePath:verified.outputPath,
         sourceSha256:verified.mediaAudit.outputSha256,outputPath:output,
         expected:{width:quality==='full-hd'?1080:270,height:quality==='full-hd'?1920:480,duration:verified.handoff.composition.durationFrames/30,fps:30}});
        if(audit.status!=='TECHNICAL_PASS_HUMAN_QA_PENDING'||audit.outputSha256!==result.record.outputSha256||
           (quality==='full-hd'&&(result.record.quality!==quality||result.record.width!==1080||result.record.height!==1920))||
           !await approvalCheck()){fail('BLOCKED','HYBRID_REMOTION_AUDIT_OR_APPROVAL_FAILED');return;}
        const seal={schema:'sues-master-preview-seal/v1',requestId:b.requestId,revision:b.revision,
         decisionId:b.decisionId,record:result.record,audit,
         hybrid:{schema:'sues-master-hybrid-lineage/v1',...verified.handoff.sourceLineage}};
        sealMasterPreview(previewRoot,output,seal);output=null;
        record.status='READY';record.step='HUMAN_QA_PENDING';record.previewId=result.record.id;
        record.result={status:'PREVIEW_READY_FOR_REVIEW',previewId:result.record.id,
         audit:{status:audit.status,fullDecode:audit.fullDecode,audioPresent:audit.audioPresent,
          outputSha256:audit.outputSha256},final:false};
        requests.save(record);
       }catch(error){try{fail('FAILED','HYBRID_WORKER_FAILED')}catch{}}
       finally{
        if(output)try{discardUnsealedMasterPreview(previewRoot,output)}catch{}
        if(locked){jobs.previewBusy=false;jobs.drain();}
        masterHybridRuns.delete(key);
       }
      })();masterHybridRuns.set(key,task);
      return json(res,202,{status:'RUNNING',requestId:b.requestId,final:false});
     }
     if(['master-native-review','master-native-apply'].includes(action)&&req.method==='POST'){
      const b=await body(req,2048),allowed=action==='master-native-review'?['revision','decisionId']:['revision','decisionId','reviewId','requestId'];
      if(Object.keys(b).some(k=>!allowed.includes(k)))return json(res,400,{error:'Solicitud inválida.'});
      let payloadSha256=null;
      if(action==='master-native-apply'){
       if(typeof b.requestId!=='string'||!/^[a-f0-9-]{36}$/.test(b.requestId)||typeof b.reviewId!=='string'||!/^[a-f0-9]{64}$/.test(b.reviewId))
        return json(res,400,{error:'Identificador de petición o revisión inválido.'});
       payloadSha256=createHash('sha256').update(JSON.stringify({revision:b.revision,decisionId:b.decisionId,reviewId:b.reviewId})).digest('hex');
       const prior=source.directReceipts?.find(r=>r.requestId===b.requestId);
       if(prior){
        if(prior.payloadSha256!==payloadSha256)return json(res,409,{error:'Petición reutilizada con otro plan.'});
        if(source.directReceipts.at(-1).requestId!==b.requestId||prior.revision!==source.revision)
         return json(res,409,{error:'La edición ya evolucionó. Abre el proyecto actual.'});
        return json(res,200,source.state==='PREVIEW_READY'?jobs.render(id):jobs.view(source));
       }
      }
      if(!['PREVIEW_READY','DONE'].includes(source.state))return json(res,409,{error:'Espera a que termine la edición actual.'});
      const approved=await store.approved(b.revision,b.decisionId);
      if(!approved)return json(res,409,{status:'BLOCKED',issues:[{code:'APPROVAL_OR_PROJECT_CHANGED'}]});
      const current=jobs.get(id),project=jobs.loadProfile(current.profileId),available=assets.list();
      const catalog=externalCatalog(project,current.settings,available);
      const reviewed=reviewMasterDirectorNative({plan:approved.plan,registry:approved.registry,catalog,project,settings:current.settings,assets:available,commandPlanner:planInstructions});
      if(action==='master-native-review')return json(res,200,reviewed);
      if(reviewed.status!=='READY_FOR_EDITOR_PREVIEW'||reviewed.preview?.reviewId!==b.reviewId)return json(res,409,{error:'El plan no está listo o ha cambiado. Revisa de nuevo.',issues:reviewed.issues??[]});
      const proposal=reviewExternalPlan(JSON.stringify(reviewed.nativePlan),{project,settings:current.settings,assets:available,commandPlanner:planInstructions});
      if(!proposal.canApply||proposal.reviewId!==b.reviewId)return json(res,409,{error:'El montaje ha cambiado. Revisa de nuevo.'});
      const applied=jobs.applyDirected(id,{...current.settings,...proposal.changes},{requestId:b.requestId,payloadSha256,
       instruction:{kind:'master-native',revision:b.revision,decisionId:b.decisionId,reviewId:b.reviewId,actions:proposal.actions,at:new Date().toISOString()}});
      return json(res,202,jobs.render(applied.job.id));
     }
     // Optional trusted zero-cost provider. Both input paths persist the same
     // master story and use the same review; this route never executes the plan.
     if(action==='master-generate'&&req.method==='GET'){
      const available=masterPlanGenerator?.verifiedFree===true&&masterPlanGenerator?.maxCostUSD===0&&typeof masterPlanGenerator?.generate==='function';
      return json(res,200,{available,schema:'sues-master-story/v1'});
     }
     if(action==='master-generate'&&req.method==='POST'){
      const b=await body(req,8192,{rejectDuplicates:true});
      if(Object.keys(b).some(k=>k!=='brief')||typeof b.brief!=='string'||b.brief.trim().length<5||b.brief.length>4000)
       return json(res,400,{error:'Escribe un encargo de entre 5 y 4000 caracteres.'});
      const generator=masterPlanGenerator;
      if(generator?.verifiedFree!==true||generator?.maxCostUSD!==0||typeof generator?.generate!=='function')
       return json(res,503,{error:'La generación de planes maestros todavía no está configurada con un proveedor gratuito.'});
      if(masterGeneratorRuns.has(id))return json(res,409,{error:'Ya hay una propuesta en preparación para este proyecto.'});
      masterGeneratorRuns.add(id);
      try{
       const current=jobs.get(id),project=jobs.loadProfile(current.profileId),catalog=externalCatalog(project,current.settings,assets.list());
       const trusted=typeof masterContextProvider==='function'?await masterContextProvider({jobId:id,project,job:current,assets,catalog,story:{resources:[]}}):null;
       if(!trusted?.registry||!Array.isArray(trusted.rulebook)||trusted.blockedIssues?.length)
        return json(res,409,{status:'BLOCKED',issues:trusted?.blockedIssues??[{code:'TRUSTED_SERVER_CONTEXT_UNAVAILABLE'}]});
       const registry=trusted.registry;
       // Send only the creative facts needed to make a candidate, not policy
       // files, credentials, paths, or permissions/approval receipts.
       const context={schema:'sues-master-generation-context/v1',sourceSha256:catalog.sourceSha256,
        timelineFingerprint:catalog.timelineFingerprint,duration:catalog.duration,timeSpace:catalog.timeSpace,
        fps:30,sourceTimeMap:catalog.sourceTimeMap,captions:catalog.captions,
        wordAnchors:registry.wordAnchors??{},canvas:registry.canvas??null,
        rendererCapabilities:registry.rendererCapabilities??{},fonts:Object.keys(registry.verifiedFonts??{}),
        approvedReferenceIds:registry.approvedReferenceIds??[],arcPolicy:registry.arcPolicy??null,
        resourceCandidates:catalog.assets,resourceCandidatesRequireVerification:true};
       const raw=await generator.generate({brief:b.brief.trim(),context:structuredClone(context),outputSchema:'sues-master-story/v1'});
       if(typeof raw!=='string'||Buffer.byteLength(raw,'utf8')>60000)throw Error('La propuesta generada no es un JSON maestro válido o supera el límite.');
       const story=JSON.parse(raw);rejectDuplicateJsonKeys(raw);
       const latest=jobs.get(id),latestCatalog=externalCatalog(jobs.loadProfile(latest.profileId),latest.settings,assets.list());
       if(latestCatalog.sourceSha256!==catalog.sourceSha256||latestCatalog.timelineFingerprint!==catalog.timelineFingerprint)
        return json(res,409,{error:'El proyecto ha cambiado durante la generación. Prepara de nuevo la propuesta.'});
       const saved=store.saveDraft(story),review=await store.review(saved.revision);
       return json(res,201,{story,revision:saved.revision,review,rendered:false});
      }catch{
       return json(res,422,{status:'BLOCKED',error:'No se pudo preparar un plan maestro válido. No se ha iniciado ninguna edición.'});
      }finally{masterGeneratorRuns.delete(id);}
     }
     if((action==='master-mask-candidate'&&req.method==='POST')||(action==='master-mask-frame'&&req.method==='GET')){
      const isStart=action==='master-mask-candidate',b=isStart?await body(req,2048):{
       revision:url.searchParams.get('revision'),decisionId:url.searchParams.get('decisionId'),candidateId:url.searchParams.get('candidateId'),file:url.searchParams.get('file')};
      if(isStart&&Object.keys(b).some(k=>!['revision','decisionId','operationId','mode'].includes(k)))return json(res,400,{error:'Solicitud de máscara inválida.'});
      if(!/^[a-f0-9]{64}$/.test(b.revision??'')||!/^[a-f0-9]{64}$/.test(b.decisionId??''))return json(res,400,{error:'Identificadores de máscara inválidos.'});
      const layers=await store.layers(b.revision,b.decisionId),graph=layers.graph,maskRoot=join(jobs.dir(id),'master-director','mask-candidates');
      if(layers.status!=='STRUCTURE_READY_NOT_RENDERED'||!graph)return json(res,409,{error:'La aprobación o el plan han cambiado.'});
      if(!isStart){
       const image=openMasterMaskCandidate({root:maskRoot,candidateId:b.candidateId,file:b.file,planFingerprint:graph.planFingerprint,sourceSha256:graph.sourceSha256});
       return sourceStream(req,res,image.path,image.mime);
      }
      if(masterMaskConfig?.verifiedLocal!==true||typeof masterMaskConfig.pythonPath!=='string'||!masterMaskConfig.pythonPath.startsWith('/')||
         typeof masterMaskConfig.scriptPath!=='string'||!masterMaskConfig.scriptPath.startsWith('/')||
         ![masterMaskConfig.pythonSha256,masterMaskConfig.scriptSha256,masterMaskConfig.modelSha256].every(x=>/^[a-f0-9]{64}$/.test(x??'')))
       return json(res,503,{error:'La generación local de máscaras todavía no está configurada.'});
      if(!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/.test(b.operationId??'')||!['keep-subject','keep-background'].includes(b.mode))
       return json(res,400,{error:'Elige una capa y un modo de máscara válidos.'});
      if(jobs.previewBusy||jobs.children.size||jobs.queued().length||jobs.publishing.size||previews.pending.size||adjustmentPreviews.running)
       return json(res,409,{error:'Hay otra edición o inspección en proceso.'});
      jobs.previewBusy=true;
      try{
       const ready=await prepareMasterDirectorRender({store,revision:b.revision,decisionId:b.decisionId,jobs,jobId:id,assets,probe:masterSourceProbe});
       if(ready.status!=='READY_FOR_SOURCE_STAGING'||ready.composition?.planFingerprint!==graph.planFingerprint)
        return json(res,409,{status:'BLOCKED',issues:ready.issues??[{code:'MASK_SOURCE_NOT_READY'}]});
       const approvalCheck=async()=>{const approved=await store.approved(b.revision,b.decisionId);return !!approved&&approved.view.fingerprint===graph.planFingerprint;};
       const options={graph,composition:ready.composition,project:ready.project,operationId:b.operationId,mode:b.mode,root:maskRoot,
        pythonPath:masterMaskConfig.pythonPath,pythonSha256:masterMaskConfig.pythonSha256,scriptPath:masterMaskConfig.scriptPath,
        scriptSha256:masterMaskConfig.scriptSha256,modelSha256:masterMaskConfig.modelSha256,approvalCheck};
       if(typeof masterMaskRunner==='function')options.runner=masterMaskRunner;
       return json(res,200,await prepareMasterMaskCandidate(options));
      }finally{jobs.previewBusy=false;jobs.drain();}
     }
     if((action==='master-supervisor'&&req.method==='POST')||(action==='master-supervisor-evidence'&&req.method==='GET')){
      const isStart=action==='master-supervisor',b=isStart?await body(req,2048):{
       revision:url.searchParams.get('revision'),decisionId:url.searchParams.get('decisionId'),previewId:url.searchParams.get('previewId'),
       inspectionId:url.searchParams.get('inspectionId'),file:url.searchParams.get('file')};
      if(isStart&&Object.keys(b).some(k=>!['revision','decisionId','previewId'].includes(k)))return json(res,400,{error:'Solicitud de supervisión inválida.'});
      if(!/^[a-f0-9]{64}$/.test(b.revision??'')||!/^[a-f0-9]{64}$/.test(b.decisionId??'')||
         !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(b.previewId??''))
       return json(res,400,{error:'Identificadores de supervisión inválidos.'});
      const previewRoot=join(jobs.dir(id),'master-director','previews'),evidenceRoot=join(jobs.dir(id),'master-director','supervision');
      const preview=findMasterPreview(previewRoot,{previewId:b.previewId});
      if(!preview||preview.seal.revision!==b.revision||preview.seal.decisionId!==b.decisionId)
       return json(res,409,{error:'La previsualización no corresponde a esta revisión.'});
      const layers=await store.layers(b.revision,b.decisionId),graph=layers.graph,outputSha256=preview.seal.record.outputSha256;
      if(layers.status!=='STRUCTURE_READY_NOT_RENDERED'||graph?.planFingerprint!==preview.seal.record.planFingerprint)
       return json(res,409,{error:'La aprobación o el plan han cambiado.'});
      if(!isStart){
       const artifact=openMasterSupervisorEvidence({root:evidenceRoot,inspectionId:b.inspectionId,file:b.file,planFingerprint:graph.planFingerprint,outputSha256});
       return sourceStream(req,res,artifact.path,artifact.mime);
      }
      if(masterSupervisorRuns.size||jobs.previewBusy||jobs.children.size||jobs.queued().length||jobs.publishing.size||previews.pending.size||adjustmentPreviews.running)
       return json(res,409,{error:'Hay otra edición o inspección en proceso. Espera antes de continuar.'});
      masterSupervisorRuns.add(id);jobs.previewBusy=true;
      try{
       const approvalCheck=async()=>{
        const approved=await store.approved(b.revision,b.decisionId),current=findMasterPreview(previewRoot,{previewId:b.previewId});
        return !!approved&&approved.view.fingerprint===graph.planFingerprint&&current?.seal.record.outputSha256===outputSha256;
       };
       const options={graph,previewPath:preview.file,outputSha256,root:evidenceRoot,approvalCheck};
       if(typeof masterSupervisorRunner==='function')options.runner=masterSupervisorRunner;
       return json(res,200,await prepareMasterSupervisorEvidence(options));
      }finally{masterSupervisorRuns.delete(id);jobs.previewBusy=false;jobs.drain();}
     }
     if(action==='master-trace'&&req.method==='GET'){
      const revision=url.searchParams.get('revision'),decisionId=url.searchParams.get('decisionId'),manifestRevision=url.searchParams.get('manifestRevision');
      if(![revision,decisionId,manifestRevision].every(x=>/^[a-f0-9]{64}$/.test(x??'')))return json(res,400,{error:'Identificadores de trazabilidad inválidos.'});
      return json(res,200,await store.trace(revision,decisionId,manifestRevision));
     }
     if(action==='master-versions'&&req.method==='GET')return json(res,200,{versions:store.listDrafts()});
     // The only active working revision is server-owned; editing against a stale
     // head returns 409 instead of silently overwriting another tab/chat edit.
     if(action==='master-current'&&req.method==='GET'){
      const current=store.current();
      return json(res,200,{...current,story:current.revision?store.readDraft(current.revision):null});
     }
     if(action==='master-current'&&req.method==='POST'){
      const b=await body(req,2048,{rejectDuplicates:true});
      if(Object.keys(b).some(k=>!['revision','expectedRevision'].includes(k))||
         !Object.hasOwn(b,'expectedRevision'))
       return json(res,400,{error:'Revisión esperada obligatoria.'});
      const result=store.setCurrent(b.revision,b.expectedRevision);
      return json(res,result.status==='CONFLICT'?409:200,result);
     }
     if(action==='master-current-operation-edit'&&req.method==='POST'){
      const b=await body(req,32768,{rejectDuplicates:true});
      if(Object.keys(b).some(k=>!['expectedRevision','operationId','patch'].includes(k)))
       return json(res,400,{error:'Edición no permitida.'});
      const result=store.editCurrentOperation(b.expectedRevision,b.operationId,b.patch);
      return json(res,result.status==='CONFLICT'?409:201,result);
     }
     if(action==='master-brief-crosswalk'&&req.method==='POST'){
      const b=await body(req,160000,{rejectDuplicates:true});
      if(!b||Object.keys(b).some(k=>!['briefRevision','expectedRevision','expectedSourceSha256','expectedTimelineFingerprint','story','links'].includes(k))||
         !/^[a-f0-9]{64}$/.test(b.briefRevision??'')||!Array.isArray(b.links)||!b.story)
       return json(res,400,{status:'BLOCKED',code:'INVALID_BRIEF_CROSSWALK_REQUEST'});
      if(store.current().revision!==b.expectedRevision)
       return json(res,409,{status:'CONFLICT',code:'STALE_PROJECT_REVISION'});
      const briefs=listMasterSourceBriefs(jobs.dir(id)),found=briefs.filter(x=>x.revision===b.briefRevision);
      if(found.length!==1)return json(res,404,{status:'BLOCKED',code:'SOURCE_BRIEF_NOT_FOUND'});
      const entry=found[0],project=jobs.loadProfile(source.profileId),catalog=externalCatalog(project,source.settings,assets.list());
      if(entry.sourceSha256!==catalog.sourceSha256||entry.timelineFingerprint!==catalog.timelineFingerprint||
         b.expectedSourceSha256!==catalog.sourceSha256||b.expectedTimelineFingerprint!==catalog.timelineFingerprint)
       return json(res,409,{status:'CONFLICT',code:'STALE_SOURCE_OR_TIMELINE'});
      const annex=translateFilmDirectorBrief({text:entry.text,sourceSha256:entry.sourceSha256,
       originalSha256:entry.originalSha256,timelineFingerprint:entry.timelineFingerprint,duration:catalog.duration});
      const audit=auditMasterBriefCrosswalk({annex,story:b.story,links:b.links});
      return json(res,audit.status==='BLOCKED'?422:200,audit);
     }
     if(action==='master-brief-caption-draft'&&req.method==='GET'){
      const revision=url.searchParams.get('briefRevision');
      if(!/^[a-f0-9]{64}$/.test(revision??''))return json(res,400,{status:'BLOCKED',code:'BRIEF_REVISION_REQUIRED'});
      const entry=listMasterSourceBriefs(jobs.dir(id)).find(x=>x.revision===revision);
      if(!entry)return json(res,404,{status:'BLOCKED',code:'SOURCE_BRIEF_NOT_FOUND'});
      const project=jobs.loadProfile(source.profileId),catalog=externalCatalog(project,source.settings,assets.list());
      if(entry.sourceSha256!==catalog.sourceSha256||entry.timelineFingerprint!==catalog.timelineFingerprint)
       return json(res,409,{status:'BLOCKED',code:'STALE_SOURCE_BRIEF',canExecute:false});
      const annex=translateFilmDirectorBrief({text:entry.text,sourceSha256:entry.sourceSha256,
       originalSha256:entry.originalSha256,timelineFingerprint:entry.timelineFingerprint,
       duration:catalog.duration,fps:30});
      const result=draftFilmDirectorCaptions(annex,project.inputs?.transcript);
      return json(res,result.status==='BLOCKED'?422:200,result);
     }
     if(action==='master-brief-caption-layers'&&req.method==='GET'){
      const revision=url.searchParams.get('briefRevision');
      if(!/^[a-f0-9]{64}$/.test(revision??''))
       return json(res,400,{status:'BLOCKED',code:'BRIEF_REVISION_REQUIRED'});
      const entry=listMasterSourceBriefs(jobs.dir(id)).find(x=>x.revision===revision);
      if(!entry)return json(res,404,{status:'BLOCKED',code:'SOURCE_BRIEF_NOT_FOUND'});
      const project=jobs.loadProfile(source.profileId),catalog=externalCatalog(project,source.settings,assets.list());
      if(entry.sourceSha256!==catalog.sourceSha256||entry.timelineFingerprint!==catalog.timelineFingerprint)
       return json(res,409,{status:'BLOCKED',code:'STALE_SOURCE_BRIEF',canExecute:false});
      const annex=translateFilmDirectorBrief({text:entry.text,sourceSha256:entry.sourceSha256,
       originalSha256:entry.originalSha256,timelineFingerprint:entry.timelineFingerprint,
       duration:catalog.duration,fps:30});
      const draft=draftFilmDirectorCaptions(annex,project.inputs?.transcript);
      const geometry=inspectFilmBriefGeometry(annex,{
       width:project.inputs?.source?.width,height:project.inputs?.source?.height});
      const result=prepareFilmDirectorCaptionLayerCandidates(annex,draft,geometry);
      return json(res,result.status==='BLOCKED'?422:200,result);
     }
     if(action==='master-brief-geometry'&&req.method==='GET'){
      const revision=url.searchParams.get('briefRevision');
      if(!/^[a-f0-9]{64}$/.test(revision??''))return json(res,400,{status:'BLOCKED',code:'BRIEF_REVISION_REQUIRED'});
      const entry=listMasterSourceBriefs(jobs.dir(id)).find(x=>x.revision===revision);
      if(!entry)return json(res,404,{status:'BLOCKED',code:'SOURCE_BRIEF_NOT_FOUND'});
      const project=jobs.loadProfile(source.profileId),catalog=externalCatalog(project,source.settings,assets.list());
      if(entry.sourceSha256!==catalog.sourceSha256||entry.timelineFingerprint!==catalog.timelineFingerprint)
       return json(res,409,{status:'BLOCKED',code:'STALE_SOURCE_BRIEF',canExecute:false});
      const annex=translateFilmDirectorBrief({text:entry.text,sourceSha256:entry.sourceSha256,
       originalSha256:entry.originalSha256,timelineFingerprint:entry.timelineFingerprint,
       duration:catalog.duration,fps:30});
      const result=inspectFilmBriefGeometry(annex,{width:project.inputs?.source?.width,height:project.inputs?.source?.height});
      return json(res,result.status==='BLOCKED'?422:200,result);
     }
     if(action==='master-brief-capabilities'&&req.method==='GET'){
      const revision=url.searchParams.get('briefRevision');
      if(!/^[a-f0-9]{64}$/.test(revision??''))return json(res,400,{status:'BLOCKED',code:'BRIEF_REVISION_REQUIRED'});
      const entry=listMasterSourceBriefs(jobs.dir(id)).find(x=>x.revision===revision);
      if(!entry)return json(res,404,{status:'BLOCKED',code:'SOURCE_BRIEF_NOT_FOUND'});
      const project=jobs.loadProfile(source.profileId),catalog=externalCatalog(project,source.settings,assets.list());
      if(entry.sourceSha256!==catalog.sourceSha256||entry.timelineFingerprint!==catalog.timelineFingerprint)
       return json(res,409,{status:'BLOCKED',code:'STALE_SOURCE_BRIEF',canExecute:false});
      const annex=translateFilmDirectorBrief({text:entry.text,sourceSha256:entry.sourceSha256,
       originalSha256:entry.originalSha256,timelineFingerprint:entry.timelineFingerprint,
       duration:catalog.duration,fps:30});
      const result=auditFilmBriefCapabilities(annex);
      return json(res,result.status==='BLOCKED'?422:200,result);
     }
     if(action==='master-brief-requirements'&&req.method==='GET'){
      const revision=url.searchParams.get('briefRevision');
      if(!/^[a-f0-9]{64}$/.test(revision??''))
       return json(res,400,{status:'BLOCKED',code:'BRIEF_REVISION_REQUIRED'});
      const briefs=listMasterSourceBriefs(jobs.dir(id)),entry=briefs.find(r=>r.revision===revision);
      if(!entry)return json(res,404,{status:'BLOCKED',code:'SOURCE_BRIEF_NOT_FOUND'});
      const project=jobs.loadProfile(source.profileId),catalog=externalCatalog(project,source.settings,assets.list());
      if(entry.sourceSha256!==catalog.sourceSha256||entry.timelineFingerprint!==catalog.timelineFingerprint)
       return json(res,409,{status:'BLOCKED',code:'STALE_SOURCE_BRIEF',canExecute:false});
      const annex=translateFilmDirectorBrief({text:entry.text,sourceSha256:entry.sourceSha256,
       originalSha256:entry.originalSha256,timelineFingerprint:entry.timelineFingerprint,
       duration:catalog.duration,fps:30});
      const report=buildMasterBriefRequirements(annex);
      return json(res,report.status==='BLOCKED'?422:200,report);
     }
     if(action==='master-brief-translation'&&req.method==='GET'){
      const revision=url.searchParams.get('briefRevision');
      if(!/^[a-f0-9]{64}$/.test(revision??''))
       return json(res,400,{status:'BLOCKED',code:'BRIEF_REVISION_REQUIRED'});
      const briefs=listMasterSourceBriefs(jobs.dir(id));
      const matches=briefs.filter(entry=>entry.revision===revision);
      if(matches.length!==1)return json(res,404,{status:'BLOCKED',code:'SOURCE_BRIEF_NOT_FOUND'});
      const entry=matches[0],project=jobs.loadProfile(source.profileId),
       catalog=externalCatalog(project,source.settings,assets.list());
      if(entry.sourceSha256!==catalog.sourceSha256||entry.timelineFingerprint!==catalog.timelineFingerprint)
       return json(res,409,{status:'BLOCKED',code:'STALE_SOURCE_BRIEF',canExecute:false});
      const outcome=translateFilmDirectorBrief({text:entry.text,sourceSha256:entry.sourceSha256,
       originalSha256:entry.originalSha256,timelineFingerprint:entry.timelineFingerprint,
       duration:catalog.duration,fps:30});
      return json(res,outcome.status==='BLOCKED'?422:200,outcome);
     }
     if(action==='master-source-brief'&&req.method==='GET'){
      const records=listMasterSourceBriefs(jobs.dir(id));
      const project=jobs.loadProfile(source.profileId),catalog=externalCatalog(project,source.settings,assets.list());
      return json(res,200,{schema:'sues-source-brief-list/v1',briefs:records.map(r=>({
       ...r,stale:r.sourceSha256!==catalog.sourceSha256||r.timelineFingerprint!==catalog.timelineFingerprint})),
       approved:false,canExecute:false});
     }
     if(action==='master-source-brief'&&req.method==='POST'){
      const b=await body(req,65536,{rejectDuplicates:true});
      if(Object.keys(b).some(k=>!['text','expectedRevision','expectedSourceSha256','expectedTimelineFingerprint'].includes(k))||
       !Object.hasOwn(b,'expectedRevision')||typeof b.text!=='string'||
       typeof b.expectedSourceSha256!=='string'||typeof b.expectedTimelineFingerprint!=='string')
       return json(res,400,{status:'BLOCKED',code:'INVALID_SOURCE_BRIEF_REQUEST'});
      if(store.current().revision!==b.expectedRevision)
       return json(res,409,{status:'CONFLICT',code:'STALE_PROJECT_REVISION'});
      const project=jobs.loadProfile(source.profileId),catalog=externalCatalog(project,source.settings,assets.list());
      if(b.expectedSourceSha256!==catalog.sourceSha256||b.expectedTimelineFingerprint!==catalog.timelineFingerprint)
       return json(res,409,{status:'CONFLICT',code:'STALE_SOURCE_OR_TIMELINE'});
      const config=JSON.parse(readFileSync(project.configPath,'utf8')),
       lineage=config.sourceLineage,original= lineage?.schema==='sues-master-source-lineage/v1'&&
        lineage.type==='cfr30-derived-from-vfr'&&lineage.derivedSha256===catalog.sourceSha256&&
        lineage.approvalInherited===false?lineage.originalSha256:catalog.sourceSha256;
      const result=saveMasterSourceBrief(jobs.dir(id),{
       text:b.text,sourceSha256:catalog.sourceSha256,originalSha256:original,timelineFingerprint:catalog.timelineFingerprint});
      return json(res,result.status==='BLOCKED'?422:201,result);
     }
     if(action==='master-pause-audit'&&req.method==='POST'){
      // Private read-only assessment against the actual source/transcript and
      // the current editing head. No cut, new job, approval or export is created.
      const b=await body(req,8192,{rejectDuplicates:true});
      if(Object.keys(b).some(k=>!['expectedRevision','expectedSourceSha256','expectedTimelineFingerprint','candidates','suggest'].includes(k))||
       !Object.hasOwn(b,'expectedRevision')||typeof b.expectedSourceSha256!=='string'||
       typeof b.expectedTimelineFingerprint!=='string'||(b.suggest===true?b.candidates!==undefined:!Array.isArray(b.candidates)))
       return json(res,400,{status:'BLOCKED',code:'INVALID_PAUSE_AUDIT_REQUEST'});
      const current=store.current();
      if(b.expectedRevision!==current.revision)
       return json(res,409,{status:'CONFLICT',code:'STALE_PROJECT_REVISION',currentRevision:current.revision});
      const project=jobs.loadProfile(source.profileId),catalog=externalCatalog(project,source.settings,assets.list());
      if(b.expectedSourceSha256!==catalog.sourceSha256||b.expectedTimelineFingerprint!==catalog.timelineFingerprint)
       return json(res,409,{status:'CONFLICT',code:'STALE_SOURCE_OR_TIMELINE'});
      const spans=catalog.sourceTimeMap?.spans;
      if(!Array.isArray(spans)||spans.length!==1||Math.abs((spans[0].sourceIn??-1))>1e-6||
         Math.abs((spans[0].editIn??-1))>1e-6||
         Math.abs((spans[0].sourceOut??-1)-catalog.duration)>0.04||
         Math.abs((spans[0].editOut??-1)-catalog.duration)>0.04)
       return json(res,422,{status:'BLOCKED',code:'CUT_TIMELINE_REQUIRES_VERIFIED_WORD_REBASE',approved:false,canExecute:false});
      const candidates=b.suggest===true?suggestMasterPauseCandidates(project.inputs.transcript.words):b.candidates;
      const result=auditMasterPauseCandidates({words:project.inputs.transcript.words,candidates,
       duration:catalog.duration});
      return json(res,result.status==='BLOCKED'?422:200,{
       ...result,proposedAutomatically:b.suggest===true,sourceSha256:catalog.sourceSha256,timelineFingerprint:catalog.timelineFingerprint,
       currentRevision:current.revision,applied:false,approved:false,canExecute:false});
     }
     if(action==='master-current-command'&&req.method==='POST'){
      const b=await body(req,8192,{rejectDuplicates:true});
      if(Object.keys(b).some(k=>!['expectedRevision','command'].includes(k))||
         !Object.hasOwn(b,'expectedRevision'))return json(res,400,{error:'Revisión actual obligatoria.'});
      const result=store.editCurrentAt(b.expectedRevision,b.command);
      return json(res,result.status==='CONFLICT'?409:result.status==='BLOCKED'?422:201,result);
     }
     if(action==='master-current-layer-edit'&&req.method==='POST'){
      const b=await body(req,32768,{rejectDuplicates:true});
      if(Object.keys(b).some(k=>!['expectedRevision','operationId','visual'].includes(k)))
       return json(res,400,{error:'Edición no permitida.'});
      const result=store.editCurrentVisual(b.expectedRevision,b.operationId,b.visual);
      return json(res,result.status==='CONFLICT'?409:201,result);
     }

     if(action==='master-draft'&&req.method==='GET')return json(res,200,{story:store.readDraft(url.searchParams.get('revision'))});
     if(action==='master-draft'&&req.method==='POST'){
      const b=await body(req,65536,{rejectDuplicates:true});if(Object.keys(b).some(k=>k!=='story'))return json(res,400,{error:'Solo se admite la historia creativa.'});
      return json(res,201,store.saveDraft(b.story));
     }
     if(action==='master-review'&&req.method==='POST'){
      const b=await body(req,2048);if(Object.keys(b).some(k=>k!=='revision'))return json(res,400,{error:'Solicitud inválida.'});
      return json(res,200,await store.review(b.revision));
     }
     if(action==='master-render-preflight'&&req.method==='POST'){
      const b=await body(req,2048);if(Object.keys(b).some(k=>!['revision','decisionId'].includes(k)))return json(res,400,{error:'Solicitud inválida.'});
      const result=await prepareMasterDirectorRender({store,revision:b.revision,decisionId:b.decisionId,jobs,jobId:id,assets,probe:masterSourceProbe});
      const {project,projectFingerprint,statusCode,...safe}=result;return json(res,statusCode??200,safe);
     }
     if(action==='master-preview-status'&&req.method==='GET'){
      const requestId=url.searchParams.get('requestId'),requests=new MasterPreviewRequests(jobs.dir(id)),record=requests.get(requestId);
      if(!record)return json(res,404,{error:'Previsualización no encontrada.'});
      if(record.status==='RUNNING'&&!masterPreviewRuns.has(id+':'+requestId)){
       const existing=findMasterPreview(join(jobs.dir(id),'master-director','previews'),{requestId});
       if(existing){record.status='READY';record.result={status:'PREVIEW_READY_FOR_REVIEW',previewId:existing.seal.record.id,record:existing.seal.record,audit:existing.seal.audit,final:false,reused:true};}
       else {record.status='INTERRUPTED';record.issues=[{code:'PREVIEW_INTERRUPTED_NEEDS_DIAGNOSIS'}];}
       requests.save(record);
      }
      return json(res,200,record);
     }
     if(action==='master-preview'&&req.method==='POST'){
      const b=await body(req,2048,{rejectDuplicates:true});if(Object.keys(b).some(k=>!['revision','decisionId','requestId','quality'].includes(k))||!['preview','full-hd'].includes(b.quality??'preview')||typeof b.requestId!=='string'||! /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(b.requestId))return json(res,400,{error:'Solicitud inválida.'});
      const quality=b.quality??'preview';
      if(!masterPreviewConfig)return json(res,503,{error:'La previsualización del Director todavía no está configurada.'});
      const requests=new MasterPreviewRequests(jobs.dir(id)),old=requests.get(b.requestId),key=id+':'+b.requestId;
      if(old){if(old.revision!==b.revision||old.decisionId!==b.decisionId||(old.quality??'preview')!==quality)return json(res,409,{error:'La solicitud pertenece a otra revisión del plan.'});
       if(old.status==='RUNNING'&&!masterPreviewRuns.has(key))return json(res,409,{error:'La previsualización anterior quedó interrumpida y necesita revisión.'});
       return json(res,old.status==='RUNNING'?202:200,old);}
      // Recover a completed sealed output after restart. If no seal exists,
      // do not start a second worker before an operator diagnoses the orphan.
      for(const stale of requests.records().filter(r=>r.status==='RUNNING'&&!masterPreviewRuns.has(id+':'+r.requestId))){
       const sealed=findMasterPreview(join(jobs.dir(id),'master-director','previews'),{requestId:stale.requestId});
       if(sealed){stale.status='READY';stale.result={status:'PREVIEW_READY_FOR_REVIEW',previewId:sealed.seal.record.id,record:sealed.seal.record,audit:sealed.seal.audit,final:false,reused:true};}
       else {stale.status='INTERRUPTED';stale.issues=[{code:'PREVIEW_INTERRUPTED_NEEDS_DIAGNOSIS'}];}
       requests.save(stale);
      }
      if(requests.hasInterrupted())return json(res,409,{error:'Hay una previsualización interrumpida que necesita revisión antes de continuar.'});
      if(jobs.previewBusy||jobs.children.size||jobs.queued().length||jobs.publishing.size||previews.pending.size||adjustmentPreviews.running)
       return json(res,409,{error:'Hay otra edición en proceso. Espera antes de previsualizar.'});
      const record=requests.create({requestId:b.requestId,revision:b.revision,decisionId:b.decisionId,quality});jobs.previewBusy=true;
      const task=(async()=>{
       let output=null,previewRoot=join(jobs.dir(id),'master-director','previews');
       try{
        const ready=await prepareMasterDirectorRender({store,revision:b.revision,decisionId:b.decisionId,jobs,jobId:id,assets,probe:masterSourceProbe});
        if(ready.status!=='READY_FOR_SOURCE_STAGING'){record.status='BLOCKED';record.issues=ready.issues;requests.save(record);return;}
        const approvalCheck=async()=>{
         const layers=await store.layers(b.revision,b.decisionId),current=jobs.get(id),catalog=externalCatalog(jobs.loadProfile(current.profileId),current.settings,assets.list());
         return layers.status==='STRUCTURE_READY_NOT_RENDERED'&&layers.remotion?.status==='READY_FOR_REMOTION_STAGING'&&
          layers.graph.planFingerprint===ready.composition.planFingerprint&&catalog.timelineFingerprint===ready.projectFingerprint&&catalog.sourceSha256===ready.composition.sourceSha256;
        };
        const result=await masterPreviewRenderer({composition:ready.composition,project:ready.project,assets,workRoot:previewRoot,
         entryFile:masterPreviewConfig.entryFile,remotionCli:masterPreviewConfig.remotionCli,browserExecutable:masterPreviewConfig.browserExecutable,browserLibraryPath:masterPreviewConfig.browserLibraryPath,approvalCheck,quality});
        if(result.status!=='PREVIEW_RENDERED_UNVERIFIED'){record.status='BLOCKED';record.issues=result.issues;requests.save(record);return;}
        output=result.outputPath;
        const audit=await masterPreviewAuditor({sourcePath:ready.project.sourcePath,sourceSha256:ready.composition.sourceSha256,
         outputPath:output,expected:{width:quality==='full-hd'?1080:270,height:quality==='full-hd'?1920:480,duration:ready.composition.durationFrames/30,fps:30}});
        if(audit.status!=='TECHNICAL_PASS_HUMAN_QA_PENDING'||audit.outputSha256!==result.record.outputSha256||
           (quality==='full-hd'&&(result.record.quality!==quality||result.record.width!==1080||result.record.height!==1920))||!await approvalCheck()){
         try{discardUnsealedMasterPreview(previewRoot,output)}catch{}output=null;
         record.status='BLOCKED';record.issues=[{code:'PREVIEW_AUDIT_OR_APPROVAL_FAILED'}];requests.save(record);return;
        }
        const seal={schema:'sues-master-preview-seal/v1',requestId:b.requestId,revision:b.revision,decisionId:b.decisionId,record:result.record,audit};
        sealMasterPreview(previewRoot,output,seal);output=null;
        record.status='READY';record.result={status:'PREVIEW_READY_FOR_REVIEW',previewId:result.record.id,record:result.record,audit,final:false};requests.save(record);
       }catch(error){
        if(output)try{discardUnsealedMasterPreview(previewRoot,output)}catch{}
        record.status='FAILED';record.issues=[{code:'PREVIEW_FAILED'}];try{requests.save(record)}catch{}
       }finally{jobs.previewBusy=false;jobs.drain();masterPreviewRuns.delete(key);}
      })();masterPreviewRuns.set(key,task);return json(res,202,{status:'RUNNING',requestId:b.requestId});
     }
     if(action==='master-previews'&&req.method==='GET')return json(res,200,{previews:listMasterPreviews(join(jobs.dir(id),'master-director','previews'))});
     if(action==='master-preview-media'&&['GET','HEAD'].includes(req.method)){
      const match=findMasterPreview(join(jobs.dir(id),'master-director','previews'),{previewId:url.searchParams.get('previewId')});
      if(!match)return json(res,404,{error:'Previsualización no encontrada.'});
      res.setHeader('X-Sues-Master-Preview','technical-not-final');return sourceStream(req,res,match.file,'video/mp4');
     }
     if(action==='master-operation-edit'&&req.method==='POST'){
      const b=await body(req,32768);if(Object.keys(b).some(k=>!['revision','operationId','patch'].includes(k)))return json(res,400,{error:'Solicitud inválida.'});
      return json(res,201,store.editOperation(b.revision,b.operationId,b.patch));
     }
     if(action==='master-layer-edit'&&req.method==='POST'){
      const b=await body(req,32768);if(Object.keys(b).some(k=>!['revision','operationId','visual'].includes(k)))return json(res,400,{error:'Solicitud inválida.'});
      return json(res,201,store.editVisual(b.revision,b.operationId,b.visual));
     }
     if(action==='master-layers'&&req.method==='POST'){
      const b=await body(req,2048);if(Object.keys(b).some(k=>!['revision','decisionId'].includes(k)))return json(res,400,{error:'Solicitud inválida.'});
      return json(res,200,await store.layers(b.revision,b.decisionId));
     }
     if(action==='master-decision'&&req.method==='POST'){
      const b=await body(req,2048);if(Object.keys(b).some(k=>!['revision','fingerprint','mode'].includes(k)))return json(res,400,{error:'Solicitud inválida.'});
      return json(res,200,await store.decide(b.revision,b.fingerprint,b.mode));
     }
     return json(res,405,{error:'Método no permitido.'});
    }
    if(!action&&req.method==='GET')return json(res,200,jobs.view(jobs.get(id)));
    if(!action&&req.method==='PATCH'){
     const b=await body(req),active=jobs.get(id);
     if(Object.keys(b).some(k=>!['settings','expectedRevision'].includes(k))||!b.settings||typeof b.settings!=='object')return json(res,400,{error:'Ajuste no permitido.'});
     if(Object.hasOwn(b,'expectedRevision')&&b.expectedRevision!==active.revision)
      return json(res,409,{error:'La edición ha cambiado. Abre la última revisión antes de guardar.',currentRevision:active.revision});
     return json(res,200,jobs.adjust(id,b.settings));
    }
    if(action==='external-draft'&&['GET','POST'].includes(req.method)){
     const file=join(jobs.dir(id),'external-plan-draft.json');
     if(req.method==='GET')return json(res,200,existsSync(file)?JSON.parse(readFileSync(file,'utf8')):{text:''});
     const b=await body(req);if(typeof b.text!=='string'||b.text.length>30000)throw Error('El plan admite hasta 30000 caracteres.');
     const draft={text:b.text,updatedAt:new Date().toISOString()},temporary=file+'.tmp';writeFileSync(temporary,JSON.stringify(draft),{mode:0o600});renameSync(temporary,file);return json(res,200,draft);
    }
    if(action==='creative-review'&&req.method==='POST'){
     const b=await body(req),source=jobs.get(id);
     if(!['PREVIEW_READY','DONE','FAILED','CANCELLED'].includes(source.state))return json(res,409,{error:'Espera a que termine la edición actual.'});
     if(b.fingerprint!==source.fingerprint)return json(res,409,{error:'El proyecto cambió. Revisa el plan de nuevo.'});
     const project=jobs.loadProfile(source.profileId),catalog=externalCatalog(project,source.settings,assets.list());
     const audit=loadAuditedDrive(directory),installed=new Set(assets.list().map(a=>a.id));
     const byNumber=q=>audit.cards.filter(c=>c.catalogueNumber===q&&!audit.excluded.has(c.driveId)&&!audit.excludedHashes.has(c.sha256));
     const resolveId=q=>{if(!/^BR-\d{4}$/.test(q))return null;const matches=byNumber(q);return matches.length===1&&installed.has(matches[0].sha256)?matches[0].sha256:null;};
     const search=q=>{if(/^BR-\d{4}$/.test(q)){const found=byNumber(q);return found.map(c=>({id:c.driveId,title:c.editorialTitleEs??c.visibleContentEs??q,kind:'video',availability:installed.has(c.sha256)?'private-operational':'remote-drive-only'}));}return searchPrivateLibrary(directory,q,{limit:20}).results;};
     const adapted=adaptCreativePlan(b.text,catalog.sourceSha256,{search,resolveId});
     let review=null;if(adapted.converted.operations.length)review=reviewExternalPlan(JSON.stringify(adapted.converted),{project,settings:source.settings,assets:assets.list(),commandPlanner:planInstructions});
     // Offer only audited, uniquely matched remote B-roll; never replace the selection.
     for(const row of review?.rows??[]){
      if(row.status!=='missing-resource')continue;
      const op=adapted.converted.operations[row.index-1];if(op?.type!=='broll'||typeof op.resourceId!=='string')continue;
      const matches=auditedCandidates(audit).filter(c=>c.sha256===op.resourceId||c.catalogueNumber===op.resourceId);
      if(matches.length!==1)continue;const c=matches[0];
      adapted.unresolved.push({line:0,original:'Recurso solicitado: '+op.resourceId,status:'missing-resource',description:'Disponible en Drive; requiere recuperación y nueva validación.',candidates:[{id:c.driveId,title:c.editorialTitleEs??c.visibleContentEs,kind:'video',availability:'remote-drive-only'}]});
     }
     const record={schema:'sues-creative-import/v1',sourceJobId:id,sourceFingerprint:source.fingerprint,createdAt:new Date().toISOString(),...adapted,review};
     const revision=createHash('sha256').update(JSON.stringify({adapted,review})).digest('hex');
     const file=join(jobs.dir(id),'creative-plan-'+adapted.id+'-'+source.fingerprint+'-'+revision+'.json');if(!existsSync(file))saveDirectorJSON(file,record);
     return json(res,200,{...record,canApply:adapted.unresolved.length===0&&review?.canApply===true});
    }
    if(action==='library-cues'&&req.method==='GET'){
     const job=jobs.get(id),limit=url.searchParams.has('limit')?Number(url.searchParams.get('limit')):6;
     if(!Number.isInteger(limit)||limit<1||limit>8)return json(res,400,{error:'Límite de sugerencias no válido'});
     try{return json(res,200,proposeLibraryCues(directory,jobs.loadProfile(job.profileId).inputs.transcript,{limit}));}
     catch(error){if(['ENOENT','EACCES','EPERM'].includes(error.code))return json(res,503,{error:'El índice privado de recursos no está disponible'});throw error;}
    }
    if(action==='ai-context'&&req.method==='POST'){
     const b=await body(req,8192),source=jobs.get(id);
     if(b.fingerprint!==source.fingerprint)return json(res,409,{error:'El proyecto ha cambiado. Guarda y vuelve a preparar la información.'});
     if(typeof (b.prompt??'')!=='string'||(b.prompt??'').length>4000)return json(res,400,{error:'Encargo demasiado largo.'});
     const project=jobs.loadProfile(source.profileId),catalog=completeDirectorCatalog(externalCatalog(project,source.settings,directorAssets(assets,directory)),source.settings);
     const instructions=buildDirectorInstructions(catalog,b.prompt??'');
     return json(res,200,{provider:'gemini',model:'gemini-3.8-flash',video:'Se enviaría el vídeo original completo con audio.',requestedFramesPerSecond:1,actualFramesVerified:false,reasoningLevel:'medium',catalogAssetCount:catalog.assets.length,captionCount:catalog.captions.length,instructions,sourceFingerprint:source.fingerprint,sent:false});
    }
    if(action==='ai-plan'&&req.method==='GET'){
     const latest=join(jobs.dir(id),'ai-plan-latest.json');
     if(!existsSync(latest))return json(res,200,{state:'NONE'});
     const info=JSON.parse(readFileSync(latest,'utf8')),file=join(jobs.dir(id),'ai-plan-result-'+info.requestId+'.json');
     if(existsSync(file)){const result=JSON.parse(readFileSync(file,'utf8'));return json(res,200,{...result,stale:info.fingerprint!==jobs.get(id).fingerprint});}
     return json(res,200,{...info,state:cloudRuns.has(id+':'+info.requestId)?'RUNNING':'INTERRUPTED',message:'El análisis quedó interrumpido; no se ha repetido ni cambiado de proveedor.'});
    }
    if(action==='ai-plan'&&req.method==='POST'){
     const b=await body(req,8192),source=jobs.get(id);
     if(!['PREVIEW_READY','DONE','FAILED','CANCELLED'].includes(source.state))return json(res,409,{error:'Espera a que termine la edición actual.'});
     if(b.fingerprint!==source.fingerprint)return json(res,409,{error:'El proyecto ha cambiado. Guarda los ajustes y solicita el plan de nuevo.'});
     if(b.provider!=='gemini')return json(res,409,{error:'Gemini es el proveedor activo. OpenAI sigue pendiente de configuración.'});
     if(!/^[a-f0-9-]{36}$/.test(b.requestId??'')||typeof (b.prompt??'')!=='string'||(b.prompt??'').length>4000)return json(res,400,{error:'Petición de IA no válida.'});
     const fingerprint=source.fingerprint;
     const project=jobs.loadProfile(source.profileId),catalog=completeDirectorCatalog(externalCatalog(project,source.settings,directorAssets(assets,directory)),source.settings);req.setTimeout(600000);
     const execute=async()=>{
      const result=await cloud.generate({provider:b.provider,catalog,sourcePath:project.sourcePath,prompt:b.prompt??'',requestId:b.requestId,directory:jobs.dir(id)});
      const review=reviewExternalPlan(result.text,{project:jobs.loadProfile(source.profileId),settings:source.settings,assets:assets.list(),commandPlanner:planInstructions});
      const response={...result,review,sourceJobId:id,sourceFingerprint:fingerprint,renderStarted:false};
      if(jobs.get(id).fingerprint===fingerprint)saveDirectorJSON(join(jobs.dir(id),'external-plan-draft.json'),{text:result.text,updatedAt:new Date().toISOString()});
      return response;
     };
     if(url.searchParams.get('async')==='1'){
      const key=id+':'+b.requestId,file=join(jobs.dir(id),'ai-plan-result-'+b.requestId+'.json'),latest=join(jobs.dir(id),'ai-plan-latest.json');
      if(existsSync(file))return json(res,200,JSON.parse(readFileSync(file,'utf8')));
      if(cloudRuns.has(key))return json(res,202,{state:'RUNNING',requestId:b.requestId});
      if([...cloudRuns].length)return json(res,409,{error:'Hay otro análisis de Gemini en curso. Espera a que termine.'});
      cloudRuns.add(key);saveDirectorJSON(latest,{requestId:b.requestId,fingerprint,startedAt:new Date().toISOString()});
      void execute().then(result=>saveDirectorJSON(file,{state:'COMPLETE',...result})).catch(error=>saveDirectorJSON(file,{state:'FAILED',message:error.message})).finally(()=>cloudRuns.delete(key));
      return json(res,202,{state:'RUNNING',requestId:b.requestId});
     }
     const result=await execute();
     if(jobs.get(id).fingerprint!==fingerprint)return json(res,409,{error:'Los ajustes cambiaron durante el análisis. El resultado queda guardado; no se ha aplicado.'});
     return json(res,200,result);
    }
    if(action==='external-catalog'&&req.method==='GET'){const source=jobs.get(id);const semantics=new Map(assets.semanticCatalog().assets.map(a=>[a.id,a.metadata]));
      const described=assets.list().map(a=>({...a,emotions:semantics.get(a.id)?.semantics?.emotionTags??[],
        narrativeRoles:semantics.get(a.id)?.semantics?.narrativeRoles??[],
        creativeApproval:semantics.get(a.id)?.approvedForProduction===true?'approved':'review-required'}));
      return json(res,200,externalCatalog(jobs.loadProfile(source.profileId),source.settings,described));}
    if(['external-review','external-execute'].includes(action)&&req.method==='POST'){
     const b=await body(req),source=jobs.get(id);
     // A duplicate request must be answered before re-evaluating the plan against
     // a timeline already modified by its first application.
     let payloadSha256=null;
     if(action==='external-execute'){
      if(typeof b.requestId!=='string'||!/^[a-f0-9-]{36}$/.test(b.requestId))throw Error('Identificador de petición no válido.');
      payloadSha256=createHash('sha256').update(JSON.stringify({text:b.text,reviewId:b.reviewId})).digest('hex');
      const prior=source.directReceipts?.find(r=>r.requestId===b.requestId);
      if(prior){
       if(prior.payloadSha256!==payloadSha256)return json(res,409,{error:'Petición reutilizada con otro plan.'});
       if(source.directReceipts.at(-1).requestId!==b.requestId||prior.revision!==source.revision)return json(res,409,{error:'La edición ya evolucionó. Abre el proyecto actual.'});
       return json(res,200,source.state==='PREVIEW_READY'?jobs.render(id):jobs.view(source));
      }
     }
     if(!['PREVIEW_READY','DONE'].includes(source.state))return json(res,409,{error:'Espera a que termine la edición actual.'});
     const proposal=reviewExternalPlan(b.text,{project:jobs.loadProfile(source.profileId),settings:source.settings,assets:assets.list(),commandPlanner:planInstructions});
     if(action==='external-review')return json(res,200,proposal);
     if(!proposal.canApply)return json(res,422,{error:'Hay operaciones pendientes. La edición actual no se ha modificado.',proposal});
     if(b.reviewId!==proposal.reviewId)return json(res,409,{error:'El plan o el proyecto han cambiado. Revisa de nuevo.'});
     const applied=jobs.applyDirected(id,proposal.changes,{requestId:b.requestId,payloadSha256,
      instruction:{kind:'external-plan',text:b.text,reviewId:proposal.reviewId,actions:proposal.actions,at:new Date().toISOString()}});
     return json(res,202,jobs.render(applied.job.id));
    }
    if(['direct-plan','direct'].includes(action)&&req.method==='POST'){
     const b=await body(req),source=jobs.get(id);
     let payloadSha256=null;
     if(action==='direct'){
      if(typeof b.requestId!=='string'||!/^[a-f0-9-]{36}$/.test(b.requestId))throw Error('Identificador de petición no válido.');
      payloadSha256=createHash('sha256').update(JSON.stringify({prompt:b.prompt??'',settings:b.settings??null,confirmReset:b.confirmReset===true})).digest('hex');
      const prior=source.directReceipts?.find(r=>r.requestId===b.requestId);
      if(prior){
       if(prior.payloadSha256!==payloadSha256)return json(res,409,{error:'Petición reutilizada con otro contenido.'});
       if(source.directReceipts.at(-1).requestId!==b.requestId||prior.revision!==source.revision)return json(res,409,{error:'La edición ya evolucionó. Abre el proyecto actual.'});
       return json(res,200,source.state==='PREVIEW_READY'?jobs.render(id):jobs.view(source));
      }
     }
     if(!['PREVIEW_READY','DONE'].includes(source.state))return json(res,409,{error:'Espera a que termine la edición actual.'});
     const base=b.settings??source.settings,proposal=planInstructions(b.prompt??'',base);
     if(proposal.canApply){const prepared=prepareProject(jobs.loadProfile(source.profileId),{...base,...proposal.changes});Object.assign(proposal,reviewInstructionExecution(proposal,prepared.plan));}
     if(action==='direct-plan')return json(res,200,proposal);
     if(!proposal.canApply)return json(res,422,{error:'Hay instrucciones que todavía no puedo ejecutar. Revisa la propuesta antes de generar.',proposal});
     if(proposal.requiresResetConfirmation&&b.confirmReset!==true)return json(res,409,{error:proposal.warning,proposal});
     const applied=jobs.applyDirected(id,{...base,...proposal.changes},{requestId:b.requestId,payloadSha256,
      instruction:{text:(b.prompt??'').trim(),actions:proposal.actions,at:new Date().toISOString()}});
     return json(res,202,jobs.render(applied.job.id));
    }
    if(action==='live-preview'){
     if(req.method==='POST')return json(res,202,livePreviews.scene(id,await body(req,131072)));
     if(['GET','HEAD'].includes(req.method)){const key=url.searchParams.get('key'),part=url.searchParams.get('part');if(part){const f=livePreviews.media(id,key,part);return sourceStream(req,res,f.file,f.mime);}return json(res,200,livePreviews.get(id,key));}
    }
    if(action==='adjust-preview'){
     if(req.method==='DELETE')return json(res,202,adjustmentPreviews.cancel(id,url.searchParams.get('key')));
     if(req.method==='POST')return json(res,202,adjustmentPreviews.start(id,await body(req,131072)));
     if(['GET','HEAD'].includes(req.method)){const key=url.searchParams.get('key');if(url.searchParams.get('media')==='1')return sourceStream(req,res,adjustmentPreviews.media(id,key));return json(res,200,adjustmentPreviews.view(adjustmentPreviews.get(id,key)));}
    }
    if(action==='acceptance'&&req.method==='POST')return json(res,200,await jobs.recordReview(id,await body(req)));
    if(action==='backup'&&req.method==='POST')return json(res,201,await jobs.backup(id));
    if(action==='backup'&&['GET','HEAD'].includes(req.method)){
     const file=jobs.backupMedia(id),size=statSync(file).size;let range;try{range=parseRange(req.headers.range,size);}catch{res.setHeader('Content-Range',`bytes */${size}`);res.writeHead(416);return res.end();}
     res.setHeader('Content-Type','application/x-tar');res.setHeader('Content-Disposition','attachment; filename="SUES_PROYECTO.tar"');res.setHeader('Accept-Ranges','bytes');res.setHeader('Content-Length',range.end-range.start+1);if(range.partial)res.setHeader('Content-Range',`bytes ${range.start}-${range.end}/${size}`);res.writeHead(range.partial?206:200);if(req.method==='HEAD')return res.end();const stream=createReadStream(file,{start:range.start,end:range.end});res.on('close',()=>stream.destroy());stream.on('error',()=>res.destroy());return stream.pipe(res);
    }
    if(action==='timeline-frames'&&req.method==='GET'){try{const data=await timelineFrames(jobs,id);if(url.searchParams.get('media')==='1'){res.setHeader('Content-Type','image/jpeg');res.setHeader('Cache-Control','private, max-age=3600');return res.end(readFileSync(data.file));}const {file,...metadata}=data;return json(res,200,metadata);}catch(e){return json(res,409,{error:e.message});}}
    if(action==='poster'&&req.method==='GET'){try{const file=await jobs.poster(id);res.setHeader('Content-Type','image/jpeg');return res.end(readFileSync(file));}catch{return json(res,404,{error:'Poster unavailable'});}}
    if(action==='review'&&req.method==='GET')return json(res,200,jobs.review(id));
    if(action==='plan'&&req.method==='GET')return json(res,200,jobs.plan(id));
    if(action==='audit'&&req.method==='GET')return json(res,200,await jobs.audit(id));
    if(action==='render'&&req.method==='POST')return json(res,202,jobs.render(id));
    if(action==='undo'&&req.method==='POST')return json(res,200,jobs.undo(id));
    if(action==='cancel'&&req.method==='POST')return json(res,202,jobs.cancel(id));
    if(action==='preview'&&['GET','HEAD'].includes(req.method)){const source=await jobs.media(id),file=await previews.ensure(id,source);return sourceStream(req,res,file);}
    if(action==='media'&&['GET','HEAD'].includes(req.method)){
     const source=await jobs.media(id),quality=url.searchParams.get('resolution');
     if(quality){const job=jobs.get(id);if(!job.editorialReview?.pass||job.editorialReview.fingerprint!==job.fingerprint)return json(res,409,{error:'Valida esta versión antes de descargar la exportación final.'});}
     if(quality&&!['720','1080'].includes(quality))return json(res,400,{error:'Resolución no compatible'});
     const file=quality==='720'?await previews.ensure(id,source,{quality:'720'}):source,size=statSync(file).size;let range;
     try{range=parseRange(req.headers.range,size);}catch{res.setHeader('Content-Range',`bytes */${size}`);res.writeHead(416);return res.end();}
     res.setHeader('Content-Type','video/mp4');res.setHeader('Accept-Ranges','bytes');res.setHeader('Content-Length',range.end-range.start+1);
     if(range.partial)res.setHeader('Content-Range',`bytes ${range.start}-${range.end}/${size}`);
     res.writeHead(range.partial?206:200);if(req.method==='HEAD')return res.end();
     const stream=createReadStream(file,{start:range.start,end:range.end});res.on('close',()=>stream.destroy());stream.on('error',()=>res.destroy());return stream.pipe(res);
    }
    return json(res,405,{error:'Method not allowed'});
   }
   const liveVendors=['subtitles-octopus.js','subtitles-octopus-worker.js','subtitles-octopus-worker.wasm','LICENSE','COPYRIGHT','source.json'];
   if(req.method==='GET'&&liveVendors.some(f=>path==='/vendor/libass-wasm/'+f)){const f=path.split('/').at(-1);res.setHeader('Content-Type',f.endsWith('.wasm')?'application/wasm':f.endsWith('.js')?'text/javascript; charset=utf-8':'text/plain; charset=utf-8');return res.end(readFileSync(join(WEB,'vendor/libass-wasm',f)));}
   const files={'/pwa.js':['pwa.js','text/javascript; charset=utf-8'],'/pwa.css':['pwa.css','text/css; charset=utf-8'],'/icon-192.png':['icon-192.png','image/png'],'/icon-512.png':['icon-512.png','image/png'],'/icon-maskable.png':['icon-maskable.png','image/png'],'/apple-touch-icon.png':['apple-touch-icon.png','image/png'],'/live-preview.js':['live-preview.js','text/javascript; charset=utf-8'],'/live-preview.css':['live-preview.css','text/css; charset=utf-8'],'/':['index.html','text/html; charset=utf-8'],'/engine-next.html':['engine-next.html','text/html; charset=utf-8'],'/engine-next.js':['engine-next.js','text/javascript; charset=utf-8'],'/engine-next-timeline.js':['engine-next-timeline.js','text/javascript; charset=utf-8'],'/engine-next.css':['engine-next.css','text/css; charset=utf-8'],'/playback-buffer.js':['playback-buffer.js','text/javascript; charset=utf-8'],'/app.js':['app.js','text/javascript; charset=utf-8'],'/app.css':['app.css','text/css; charset=utf-8'],'/studio.css':['studio.css','text/css; charset=utf-8'],'/manual-adjust.css':['manual-adjust.css','text/css; charset=utf-8'],'/source-cuts.css':['source-cuts.css','text/css; charset=utf-8'],'/manual-adjust.js':['manual-adjust.js','text/javascript; charset=utf-8'],'/source-cuts-ui.js':['source-cuts-ui.js','text/javascript; charset=utf-8'],'/manifest.webmanifest':['manifest.webmanifest','application/manifest+json'],'/sw.js':['sw.js','text/javascript; charset=utf-8'],'/icon.svg':['icon.svg','image/svg+xml']};
   if(req.method!=='GET'||!Object.hasOwn(files,path))return json(res,404,{error:'Not found'});
   const [file,type]=files[path];res.setHeader('Content-Type',type);res.end(readFileSync(join(WEB,file)));
  }catch(error){if(res.headersSent)return res.destroy();const safe=/not found|Unknown profile/i.test(error.message)?404:/busy|ready|changed|ha cambiado|render activo|Espera a que termine|transition|owned|Adjustments|queue full|closing/.test(error.message)?409:400;json(res,safe,{error:error.code?'No se pudo acceder al recurso local configurado':error.message.replaceAll(directory,'[local]')});}
 });
 server.requestTimeout=900000;server.headersTimeout=10000;
 return {jobs,server,token,async listen(){await new Promise((r,j)=>{server.once('error',j);server.listen(port,'127.0.0.1',r);});origin??=`http://127.0.0.1:${server.address().port}`;expectedHost=new URL(origin).host;return `${origin}/#${token}`;},async close(){jobs.closing=true;await Promise.allSettled([...masterPreviewRuns.values()]);await livePreviews.close();await adjustmentPreviews.close();await previews.close();server.closeIdleConnections();await new Promise(r=>server.close(r));await jobs.close();}};
}
