import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const normalize=s=>String(s).normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().replace(/[^a-z0-9]+/g,' ');
const synonyms={whoosh:['whoosh','swish','swoosh','barrido'],riser:['riser','rise','subida','tension'],impacto:['impact','hit','boom','impacto'],teclado:['keyboard','typing','typewriter','teclado','teclas'],flash:['flash','burn','flare','destello'],barrido:['sweep','streak','barrido','whoosh'],lightleak:['light leak','light leaks','leak','fuga luz'],transicion:['transition','wipe','transicion'],tension:['riser','tension','drone'],revelacion:['reveal','sparkle','riser','revelacion'],calma:['calm','ambient','soft','calma']};
export function enrichCatalog(catalog,{sfxIndex,vfxIndex,root}={}){
 const index=new Map();
 for(const a of sfxIndex?.effects??[])index.set('sfx/'+a.relative_path,{category:a.category,indexDuration:a.duration_seconds,indexSha256:a.sha256,pack:a.pack,publisherLicense:sfxIndex.license,licenseEvidence:'INDEX_CLAIM_NOT_RIGHTS_APPROVAL'});
 for(const a of vfxIndex?.files??[])index.set(a.relative_path,{category:a.category,indexDuration:a.duration_seconds,indexSha256:a.sha256,pack:a.pack,licenseEvidence:'PACK_DOCUMENTATION_NOT_REVIEWED'});
 const base=root?fs.realpathSync(root):null;
 return {...catalog,assets:catalog.assets.map(a=>{
  let physicalStatus='CATALOG_ONLY';if(base){try{const f=fs.realpathSync(path.join(base,a.relativePath));physicalStatus=f.startsWith(base+path.sep)&&fs.statSync(f).isFile()?'PRESENT':'OUTSIDE_ROOT'}catch{physicalStatus='MISSING'}}
  return {...a,...index.get(a.relativePath),physicalStatus,intensity:a.intensity??null,compatibility:a.type==='audio'?'native-audio':a.type==='video'||a.type==='image'?'native-visual':a.type==='motion-graphic'?'svg-needs-format-check':'not-media'};
 })};
}
export function searchResources(catalog,query,{type,duration,limit=12,availableOnly=false,intensity,compatibility}={}){
 const q=normalize(query).trim();if(!q)return [];
 const terms=[q,...Object.entries(synonyms).filter(([k,v])=>q===k||v.includes(q)||q.includes(k)).flatMap(([,v])=>v)];
 return catalog.assets.map(a=>{const hay=normalize(a.relativePath+' '+(a.category??'')+' '+(a.tags||[]).join(' '));const score=terms.reduce((s,t)=>s+(hay.includes(normalize(t))?1:0),0);return {...a,score,semanticMatch:'NAME_OR_TAG_INFERENCE_ONLY',physicalStatus:a.physicalStatus??'CATALOG_ONLY',durationStatus:Number.isFinite(a.indexDuration)?'INDEX_RECORDED':'UNPROBED'};}).filter(a=>a.score&&(!type||a.type===type)&&(!availableOnly||a.physicalStatus==='PRESENT')&&(!compatibility||a.compatibility===compatibility)&&(!intensity||a.intensity===intensity)&&(!Number.isFinite(duration)||!Number.isFinite(a.indexDuration)||a.indexDuration>=duration)).sort((a,b)=>b.score-a.score||a.relativePath.localeCompare(b.relativePath)).slice(0,Math.min(50,Math.max(1,limit))).map(a=>({...a,requestedDuration:duration??null}));
}
export function resolveCatalogAsset(catalog,root,id){
 const a=catalog.assets.find(x=>x.id===id);if(!a)throw Error('UNKNOWN_ASSET');
 const base=fs.realpathSync(root),file=fs.realpathSync(path.join(base,a.relativePath));if(!file.startsWith(base+path.sep)||!fs.statSync(file).isFile())throw Error('ASSET_OUTSIDE_ROOT');
 const ext=path.extname(file).toLowerCase(),kind={'.wav':'audio','.mp3':'audio','.m4a':'audio','.mp4':'video','.webm':'video','.mov':'video','.png':'image','.jpg':'image','.jpeg':'image','.svg':'svg'}[ext];if(!kind)throw Error('UNSUPPORTED_ASSET_EXTENSION');
 const info=kind==='svg'?{}:JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',file],{encoding:'utf8'}));
 const stream=info.streams?.find(s=>s.codec_type===(kind==='audio'?'audio':'video'));if(kind!=='svg'&&!stream)throw Error('MEDIA_STREAM_MISSING');
 const sha256=execFileSync('sha256sum',[file],{encoding:'utf8'}).split(/\s/)[0];if(a.indexSha256&&a.indexSha256!==sha256)throw Error('ASSET_HASH_MISMATCH');
 const duration=Number(info.format?.duration??stream?.duration??0),fps=stream?.r_frame_rate?.split('/').map(Number);
 return {id,name:path.basename(file),file,src:'/media/sues_asset_'+createHash('sha256').update(id).digest('hex').slice(0,24)+ext,kind,duration:Number.isFinite(duration)?duration:0,size:fs.statSync(file).size,width:stream?.width,height:stream?.height,fps:fps?.[1]?fps[0]/fps[1]:undefined,verifiedPhysical:true,sha256,license:a.license??'UNVERIFIED',rightsVerified:false};
}

// Discover existing media from a trusted project, not from arbitrary user paths.
// Keep project-local candidates separate from the canonical library.
export function projectAudioCatalog(project,root){
 const base=fs.realpathSync(root);
 const assets=[];
 for(const m of project.media??[]){
  if(m.kind!=='audio'||!/^\/media\/[A-Za-z0-9_.-]+$/.test(m.src??''))continue;
  const relativePath=m.src.slice(1);
  try {
   const file=fs.realpathSync(path.join(base,relativePath));
   if(!file.startsWith(base+path.sep)||!fs.statSync(file).isFile())continue;
   assets.push({id:'project-audio-'+createHash('sha256').update(relativePath).digest('hex').slice(0,24),relativePath,type:'audio',tags:[],category:'project-local audio',indexDuration:Number.isFinite(m.duration)?m.duration:null,physicalStatus:'PRESENT',compatibility:'native-audio',license:'UNVERIFIED_PROJECT_LOCAL',intensity:null});
  } catch {}
 }
 return {assets};
}
