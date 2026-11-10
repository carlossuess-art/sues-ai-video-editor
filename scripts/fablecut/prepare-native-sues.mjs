// Patch the EXISTING FableCut installation; never install another editor.
// Default is read-only preflight. Apply only after backups and real test.
import {readFileSync,writeFileSync,mkdirSync,existsSync,renameSync,copyFileSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const here=dirname(fileURLToPath(import.meta.url));
const replace=(s,a,b)=>{if(!s.includes(a))throw Error('UNSUPPORTED_NATIVE_SOURCE: '+a.slice(0,100));return s.replace(a,b)};
export function patchNativeSources(input){
 let server=input.server,app=input.app,html=input.html;
 if(!server.includes('SUES_NATIVE_FAVORITES_V1')){
 server=replace(server,'  /* API: project */',`  /* SUES_NATIVE_FAVORITES_V1 — same private store used by Master Director */
  if (p === "/api/sues-favorites" && req.method === "POST") {
    try {
      if (!process.env.SUES_FAVORITES_FILE) { sendJSON(res, 503, {error:"Shared SUES favorites not configured"}); return; }
      const mod = await import("./sues-native-favorites.mjs");
      const fav = mod.createNativeFavorites({mediaDir:MEDIA_DIR,libraryDir:LIBRARY_DIR,storeFile:process.env.SUES_FAVORITES_FILE});
      const a = JSON.parse((await readBody(req)).toString("utf8"));
      if (a.action === "lookup") { sendJSON(res,200,fav.lookup(a.sources)); return; }
      if (a.action === "set") { const result=fav.set(a); sendJSON(res,result.status==="CONFLICT"?409:200,result); return; }
      sendJSON(res,400,{error:"Unknown favorites action"});
    } catch(e) { sendJSON(res,422,{error:String(e.message).slice(0,160)}); }
    return;
  }

  /* API: project */`);
 }
 if(!app.includes('SUES_NATIVE_FAVORITES_V1')){
 app=replace(app,'function setMediaFavorite(ids, on) {',`/* SUES_NATIVE_FAVORITES_V1 */
const suesFavoriteCache = new Map();
let suesFavoriteBusy=false;
async function suesFavoritesRequest(body){
 const r=await fetch("/api/sues-favorites",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
 const data=await r.json();if(!r.ok)throw Error(data.error||data.code||"No se pudo sincronizar favoritos");return data;
}
async function suesSyncFavorites(){
 if(suesFavoriteBusy||!state.connected||document.hidden)return;
 suesFavoriteBusy=true;
 try{
  const shown=project.media.map(m=>m.src).filter(Boolean);
  const library=(runtime.library[state.binTab]||[]).map(m=>m.src).filter(Boolean);
  const sources=[...new Set([...shown,...library])];
  if(!sources.length)return;
  const result=await suesFavoritesRequest({action:"lookup",sources:sources.slice(0,512)});
  let changed=false;
  for(const x of result.items){if(x.unavailable)continue;const before=suesFavoriteCache.get(x.src);suesFavoriteCache.set(x.src,x.favorite);if(before!==x.favorite)changed=true;}
  for(const m of project.media){if(!suesFavoriteCache.has(m.src))continue;const next=suesFavoriteCache.get(m.src);if(!!m.favorite!==next){if(next)m.favorite=true;else delete m.favorite;changed=true;}}
  if(changed){if(state.binTab==="project")renderBin();else renderLibrary();}
 }catch{}finally{suesFavoriteBusy=false;}
}
async function suesSetFavorite(src,on){
 const base=await suesFavoritesRequest({action:"lookup",sources:[src]});
 if(!base.items[0]||base.items[0].unavailable)throw Error("Recurso no disponible");
 await suesFavoritesRequest({action:"set",src,favorite:on,expectedRevision:base.revision});
 suesFavoriteCache.set(src,on);
 for(const m of project.media.filter(m=>m.src===src)){if(on)m.favorite=true;else delete m.favorite;}
 if(state.binTab==="project")renderBin();else renderLibrary();
}
window.addEventListener("focus",()=>void suesSyncFavorites());
setInterval(()=>void suesSyncFavorites(),15000);
async function setMediaFavorite(ids, on) {`);
 app=replace(app,`  for (const id of ids) {
    const m = getMedia(id);
    if (!m) continue;
    if (on) m.favorite = true; else delete m.favorite;
  }
  scheduleSave(); renderBin();
}`,`  try { for(const id of ids){const m=getMedia(id);if(m?.src)await suesSetFavorite(m.src,on);} }
  catch(e){toast("Favoritos SUES: "+e.message);}
}`);
 app=replace(app,'  const files = runtime.library[dir] || [];','  const files = [...(runtime.library[dir] || [])].sort((a,b)=>Number(suesFavoriteCache.get(b.src)===true)-Number(suesFavoriteCache.get(a.src)===true)||a.name.localeCompare(b.name));');
 app=replace(app,'    const thumbEl = item.querySelector(".bin-thumb");',`    const star=document.createElement("button");star.type="button";star.className="btn tiny";star.textContent=suesFavoriteCache.get(f.src)?"★":"☆";star.title="Favorito SUES";star.setAttribute("aria-pressed",String(suesFavoriteCache.get(f.src)===true));star.addEventListener("click",e=>{e.stopPropagation();suesSetFavorite(f.src,suesFavoriteCache.get(f.src)!==true).catch(e=>toast(e.message));});item.append(star);
    const thumbEl = item.querySelector(".bin-thumb");`);
 app=replace(app,'  return runtime.library[dir];','  void suesSyncFavorites();\n  return runtime.library[dir];');
 }
 if(!html.includes('SUES_NATIVE_ES_V1')){
 html=replace(html,'<html lang="en">','<html lang="es">');
 html=replace(html,'id="btnProjectsDash" title="Projects (Ctrl/Cmd+O): open, create, duplicate, archive">Projects','id="btnProjectsDash" title="Proyectos (Ctrl/Cmd+O): abrir, crear, duplicar y archivar">Proyectos');
 html=html.replace('>＋ Import<','>＋ Importar<').replace('>+ Import<','>+ Importar<').replace('>+ Title<','>+ Título<').replace('>+ Adjust<','>+ Ajuste<').replace('>⬇ Export<','>⬇ Exportar<').replace('>Edit</button>','>Editar</button>');
 html=replace(html,'<body>','<body>\n<!-- SUES_NATIVE_ES_V1 -->');
 }
 return {server,app,html};
}
export function nativePresets(policy,Templates){
 const mk=(id,name,props,keys)=>Templates.normalizeTemplate({id,name,group:'SUES',width:1080,height:1920,duration:3,hold:3,tracks:[{id:'V1',kind:'video'}],clips:[{id:'title',kind:'text',track:'V1',name:'Texto editable',start:0,in:0,duration:3,props,...(keys?{keyframes:keys}:{})}],fields:[{key:'texto',label:'Texto',type:'text',targets:['title:props.text']}]},true);
 const base={text:'TU TÍTULO',font:policy.title.font,weight:900,bold:true,fontSize:114,color:policy.title.color,color2:policy.title.color2,strokeColor:policy.title.strokeColor,strokeWidth:8,textShadow:24,align:'center',lineHeight:1.04,boxW:900,boxFit:true};
 const title=mk('sues-title-master','SUES · Título dorado',base);
 const cap=mk('sues-caption-master','SUES · Subtítulo blanco',{...base,text:'TU SUBTÍTULO',fontSize:policy.caption.fontSize,weight:policy.caption.weight,color:policy.caption.color,color2:policy.caption.color,strokeWidth:0,textShadow:8,y:400});
 const slide=Templates.normalizePreset({id:'sues-title-slide-down',name:'SUES · Título descendente',group:'SUES',anchor:'in',length:0.6,keys:{y:[{t:0,v:-500},{t:0.6,v:0,ease:'ease-out'}],opacity:[{t:0,v:0},{t:0.2,v:1}]}},true);
 return {templates:[title,cap],presets:[slide]};
}
export function prepareInstallation({appDir,libraryDir,apply=false,policy,storeFile}){
 if(!storeFile)throw Error('Set one explicit SUES_FAVORITES_FILE for both services');
 const require=createRequire(join(appDir,'package.json'));const Templates=require(join(appDir,'templates.js'));
 const paths={server:join(appDir,'server.js'),app:join(appDir,'app.js'),html:join(appDir,'index.html')};
 const originals=Object.fromEntries(Object.entries(paths).map(([key,file])=>[key,readFileSync(file,'utf8')]));
 const changed=patchNativeSources(originals);new Function(changed.server);new Function(changed.app);
 const masters=nativePresets(policy,Templates);
 const staged=[...Object.entries(paths).map(([key,path])=>({path,content:changed[key]})),{path:join(appDir,'sues-native-favorites.mjs'),content:readFileSync(join(here,'sues-native-favorites.mjs'),'utf8')},{path:join(appDir,'sues-favorites.mjs'),content:readFileSync(join(here,'../../src/sues-favorites.js'),'utf8')}];
 for(const [kind,items] of Object.entries(masters))for(const item of items)staged.push({path:join(libraryDir,kind,item.id+'.json'),content:JSON.stringify(item,null,2)+'\n'});
 for(const s of staged){if(s.path.startsWith(libraryDir+'/')&&existsSync(s.path)&&readFileSync(s.path,'utf8')!==s.content)throw Error('PRESET_COLLISION: '+s.path)}
 const result=staged.map(s=>({path:s.path,sha256:createHash('sha256').update(s.content).digest('hex'),changed:!existsSync(s.path)||readFileSync(s.path,'utf8')!==s.content}));
 if(apply){
  const backup=join(appDir,'.sues-backup-'+Date.now());mkdirSync(backup,{mode:0o700});
  for(const s of staged){if(existsSync(s.path)){if(readFileSync(s.path,'utf8')===s.content)continue;copyFileSync(s.path,join(backup,s.path.split('/').at(-1)));}mkdirSync(dirname(s.path),{recursive:true});const tmp=s.path+'.sues-tmp';writeFileSync(tmp,s.content,{flag:'wx'});renameSync(tmp,s.path)}
  return {status:'FILES_PREPARED_RESTART_AND_QA_REQUIRED',backup,files:result};
 }
 return {status:'DRY_RUN_OK',files:result};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [appDir,libraryDir]=process.argv.slice(2,4);if(!appDir||!libraryDir)throw Error('Usage: node prepare-native-sues.mjs APP_DIR LIBRARY_DIR [--apply]');
 const policy=JSON.parse(readFileSync(join(here,'../../config/sues-production-policy.json'),'utf8'));
 console.log(JSON.stringify(prepareInstallation({appDir:resolve(appDir),libraryDir:resolve(libraryDir),policy,storeFile:process.env.SUES_FAVORITES_FILE,apply:process.argv.includes('--apply')}),null,2));
}
