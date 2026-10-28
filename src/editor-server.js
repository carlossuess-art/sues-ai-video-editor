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
async function body(req,maxBytes=65536){
 if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']??''))throw new Error('JSON required');
 const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>maxBytes)throw new Error('Request too large');chunks.push(chunk);}
 const value=JSON.parse(Buffer.concat(chunks).toString());if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('JSON object required');return value;
}
export function createEditorServer({directory,profiles,port=0,token=randomBytes(32).toString('hex'),renderer,storage,publicOrigin,intakeProbe,assetProbe,passwordFile=join(directory,'access','admin-password-hash'),googleOAuthFile=join(dirname(passwordFile),'google-oauth.json'),googleOAuthFetch=fetch,cloudDirector}){
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
 const analysis=new LocalAnalysis(intake);
 const cloudRuns=new Set();
 const cloud=cloudDirector??new CloudDirector({credentialsFile:join(dirname(passwordFile),'cloud-director-keys.json')});
 const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));};
 const sourceStream=(req,res,file)=>{
  const size=statSync(file).size;let range;try{range=parseRange(req.headers.range,size);}catch{res.setHeader('Content-Range',`bytes */${size}`);res.writeHead(416);return res.end();}
  const fd=openSync(file,'r'),head=Buffer.alloc(12);try{readSync(fd,head,0,12,0);}finally{closeSync(fd);}
  res.setHeader('Content-Type',head.subarray(0,4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3]))?'video/webm':'video/mp4');res.setHeader('Accept-Ranges','bytes');res.setHeader('Content-Length',range.end-range.start+1);if(range.partial)res.setHeader('Content-Range',`bytes ${range.start}-${range.end}/${size}`);res.writeHead(range.partial?206:200);if(req.method==='HEAD')return res.end();const stream=createReadStream(file,{start:range.start,end:range.end});res.on('close',()=>stream.destroy());stream.on('error',()=>res.destroy());return stream.pipe(res);
 };
 const server=http.createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Cross-Origin-Resource-Policy','same-origin');
  res.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; media-src 'self' blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
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
    if(jobSource&&['GET','HEAD'].includes(req.method)){const job=jobs.get(jobSource[1]),project=jobs.loadProfile(job.profileId);if(project.inputs.source.sha256!==jobs.plan(job.id).manifest.source.sha256)throw new Error('Source changed; prepare the montage again');return sourceStream(req,res,project.sourcePath);}
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
    if(path==='/api/jobs'&&req.method==='GET')return json(res,200,jobs.list());
    if(path==='/api/jobs'&&req.method==='POST'){
     const b=await body(req);return json(res,201,jobs.create(b.profileId,b.settings??{},{parentId:b.parentId,projectTitle:b.projectTitle,newProject:b.newProject===true,...(b.useTemplateOnly===true?{instruction:{text:'Edición solo con la plantilla. El prompt guardado no se ha aplicado.',actions:[],at:new Date().toISOString()}}:{})}));
    }
    const match=/^\/api\/jobs\/([a-f0-9-]+)(?:\/(plan|review|acceptance|backup|render|cancel|preview|media|audit|undo|direct-plan|direct|external-catalog|external-review|external-execute|external-draft|creative-review|ai-plan|ai-context|library-cues|poster|timeline-frames|adjust-preview))?$/.exec(path);
    if(!match)return json(res,404,{error:'Not found'});
    const [,id,action]=match;
    if(!action&&req.method==='GET')return json(res,200,jobs.view(jobs.get(id)));
    if(!action&&req.method==='PATCH')return json(res,200,jobs.adjust(id,(await body(req)).settings));
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
     if(!['PREVIEW_READY','DONE','FAILED','CANCELLED'].includes(source.state))throw Error('Espera a que termine la edición actual.');
     const proposal=reviewExternalPlan(b.text,{project:jobs.loadProfile(source.profileId),settings:source.settings,assets:assets.list(),commandPlanner:planInstructions});
     if(action==='external-review')return json(res,200,proposal);
     if(typeof b.requestId!=='string'||!/^[a-f0-9-]{36}$/.test(b.requestId))throw Error('Identificador de petición no válido.');
     const existing=[...jobs.jobs.values()].find(j=>j.parentId===id&&j.requestId===b.requestId);
     if(existing){if(existing.instructions.at(-1)?.reviewId!==b.reviewId)return json(res,409,{error:'Petición reutilizada con otro plan.'});return json(res,200,existing.state==='PREVIEW_READY'?jobs.render(existing.id):jobs.view(existing));}
     if(!proposal.canApply)return json(res,422,{error:'Hay operaciones pendientes. No se ha creado ni renderizado otra versión.',proposal});
     if(b.reviewId!==proposal.reviewId)return json(res,409,{error:'El plan o el proyecto han cambiado. Revisa de nuevo.'});
     const next=jobs.create(source.profileId,proposal.changes,{parentId:id,requestId:b.requestId,instruction:{kind:'external-plan',text:b.text,reviewId:proposal.reviewId,actions:proposal.actions,at:new Date().toISOString()}});
     return json(res,202,jobs.render(next.id));
    }
    if(['direct-plan','direct'].includes(action)&&req.method==='POST'){
     const b=await body(req),source=jobs.get(id);
     if(!['PREVIEW_READY','DONE','FAILED','CANCELLED'].includes(source.state))throw Error('Espera a que termine la edición actual.');
     const base=b.settings??source.settings,proposal=planInstructions(b.prompt??'',base);
     if(proposal.canApply){const prepared=prepareProject(jobs.loadProfile(source.profileId),{...base,...proposal.changes});Object.assign(proposal,reviewInstructionExecution(proposal,prepared.plan));}
     if(action==='direct-plan')return json(res,200,proposal);
     if(typeof b.requestId!=='string'||!/^[a-f0-9-]{36}$/.test(b.requestId))throw Error('Identificador de petición no válido.');
     const existing=[...jobs.jobs.values()].find(j=>j.parentId===id&&j.requestId===b.requestId);
     if(existing)return json(res,200,existing.state==='PREVIEW_READY'?jobs.render(existing.id):jobs.view(existing));
     if(!proposal.canApply)return json(res,422,{error:'Hay instrucciones que todavía no puedo ejecutar. Revisa la propuesta antes de generar.',proposal});
     if(proposal.requiresResetConfirmation&&b.confirmReset!==true)return json(res,409,{error:proposal.warning,proposal});
     const next=jobs.create(source.profileId,{...base,...proposal.changes},{parentId:id,requestId:b.requestId,instruction:{text:(b.prompt??'').trim(),actions:proposal.actions,at:new Date().toISOString()}});
     return json(res,202,jobs.render(next.id));
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
   const files={'/':['index.html','text/html; charset=utf-8'],'/playback-buffer.js':['playback-buffer.js','text/javascript; charset=utf-8'],'/app.js':['app.js','text/javascript; charset=utf-8'],'/app.css':['app.css','text/css; charset=utf-8'],'/studio.css':['studio.css','text/css; charset=utf-8'],'/manual-adjust.css':['manual-adjust.css','text/css; charset=utf-8'],'/source-cuts.css':['source-cuts.css','text/css; charset=utf-8'],'/manual-adjust.js':['manual-adjust.js','text/javascript; charset=utf-8'],'/source-cuts-ui.js':['source-cuts-ui.js','text/javascript; charset=utf-8'],'/manifest.webmanifest':['manifest.webmanifest','application/manifest+json'],'/sw.js':['sw.js','text/javascript; charset=utf-8'],'/icon.svg':['icon.svg','image/svg+xml']};
   if(req.method!=='GET'||!Object.hasOwn(files,path))return json(res,404,{error:'Not found'});
   const [file,type]=files[path];res.setHeader('Content-Type',type);res.end(readFileSync(join(WEB,file)));
  }catch(error){if(res.headersSent)return res.destroy();const safe=/not found|Unknown profile/i.test(error.message)?404:/busy|ready|changed|ha cambiado|render activo|Espera a que termine|transition|owned|Adjustments|queue full|closing/.test(error.message)?409:400;json(res,safe,{error:error.code?'No se pudo acceder al recurso local configurado':error.message.replaceAll(directory,'[local]')});}
 });
 server.requestTimeout=900000;server.headersTimeout=10000;
 return {jobs,server,token,async listen(){await new Promise((r,j)=>{server.once('error',j);server.listen(port,'127.0.0.1',r);});origin??=`http://127.0.0.1:${server.address().port}`;expectedHost=new URL(origin).host;return `${origin}/#${token}`;},async close(){jobs.closing=true;await adjustmentPreviews.close();await previews.close();server.closeIdleConnections();await new Promise(r=>server.close(r));await jobs.close();}};
}
