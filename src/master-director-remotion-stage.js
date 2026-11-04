// Stage only authenticated, checksum-verified private stills into an isolated
// Remotion public directory. Never follows user-supplied paths or URLs.
import {mkdirSync,readFileSync,writeFileSync,unlinkSync,copyFileSync,chmodSync,statSync,constants} from 'node:fs';
import {fileSha256} from './local-pipeline.js';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
const HASH=/^[a-f0-9]{64}$/;
export function stageMasterDirectorImages(composition,{assets,publicDirectory}={}){
 if(composition?.schema!=='sues-remotion-layers/v1'||!Array.isArray(composition.layers)||
    typeof publicDirectory!=='string'||!publicDirectory.startsWith('/'))throw Error('Invalid staging context');
 const ids=[...new Set(composition.layers.flatMap(l=>[...(['image','audio','video'].includes(l.kind)?[l.assetId]:[]),...(l.maskAssetId?[l.maskAssetId]:[])]))];
 if(ids.length>1500||ids.some(x=>!HASH.test(x??'')))throw Error('Invalid media asset');
 const expected=new Map();for(const l of composition.layers){
  for(const [id,kind] of [[l.kind==='image'?l.assetId:null,'image'],[l.kind==='audio'?l.assetId:null,'audio'],[l.kind==='video'?l.assetId:null,'video'],[l.maskAssetId,'image']])if(id){
   if(expected.has(id)&&expected.get(id)!==kind)throw Error('Conflicting media type');expected.set(id,kind);
  }
 }
 const prepared=[];let totalBytes=0;
 // First verify every source before writing any copy.
 for(const id of ids){
  const a=assets.resolve(id),m=assets.metadata(id);
  if(expected.get(id)==='image'?a.kind!=='image':expected.get(id)==='video'?a.kind!=='video':!['audio','sfx'].includes(a.kind))throw Error('Asset kind unsupported');
  if(a.sha256!==id||m?.approvedForProduction!==true||m.license?.rightsStatus!=='verified'||
     m.license.commercialUseAllowed!==true||!m.license.proofRef||!m.testReportRef)throw Error('Image evidence unavailable');
  const size=statSync(a.localFile).size;totalBytes+=size;
  if(size>40*1024*1024||totalBytes>256*1024*1024||fileSha256(a.localFile)!==id)throw Error('Media bytes changed or staging limit exceeded');
  prepared.push({id,source:a.localFile});
 }
 const root=join(publicDirectory,'master-assets');mkdirSync(root,{recursive:true,mode:0o700});
 const made=[];
 try{for(const a of prepared){
  const path=join(root,a.id);
  try{copyFileSync(a.source,path,constants.COPYFILE_EXCL);made.push(path);chmodSync(path,0o600);}
  catch(e){if(e.code!=='EEXIST'||fileSha256(path)!==a.id)throw e;}
  if(fileSha256(path)!==a.id||fileSha256(a.source)!==a.id)throw Error('Media bytes changed during staging');
 }}catch(e){for(const p of made)try{unlinkSync(p)}catch{}throw e;}
 return {status:'STAGED_NOT_RENDERED',assetIds:ids};
}

// Stage fonts by the exact file hashes that loadProject derived from the current
// project. Names are allowlisted; supplied plans never select filesystem paths.
export function stageMasterDirectorFonts(composition,{project,publicDirectory}={}){
 const files={'Montserrat:400':'Montserrat-Regular.ttf','Montserrat:700':'Montserrat-Bold.ttf',
  'Montserrat ExtraBold:800':'Montserrat-ExtraBold.ttf','Anton:400':'Anton-Regular.ttf',
  'Allerta Stencil:400':'AllertaStencil-Regular.ttf'};
 if(composition?.schema!=='sues-remotion-layers/v1'||!Array.isArray(composition.layers)||
    typeof project?.fontDirectory!=='string'||typeof publicDirectory!=='string'||!publicDirectory.startsWith('/'))throw Error('Invalid font staging context');
 const targets=new Map();
 for(const layer of composition.layers.filter(l=>l.kind==='text')){
  const t=layer.visual?.typography,key=t?.family+':'+t?.weight,file=files[key],hash=layer.fontAssetId;
  if(!file||!HASH.test(hash??'')||project.fontHashes?.[file]!==hash)throw Error('Font binding unverified');
  const bytes=readFileSync(join(project.fontDirectory,file));
  if(createHash('sha256').update(bytes).digest('hex')!==hash)throw Error('Font bytes changed');
  targets.set(hash,bytes);
 }
 const root=join(publicDirectory,'master-fonts');mkdirSync(root,{recursive:true,mode:0o700});
 const made=[];
 try{for(const [id,bytes] of targets){const path=join(root,id);
  try{writeFileSync(path,bytes,{mode:0o600,flag:'wx'});made.push(path);}
  catch(e){if(e.code!=='EEXIST'||createHash('sha256').update(readFileSync(path)).digest('hex')!==id)throw e;}
 }}catch(e){for(const p of made)try{unlinkSync(p)}catch{}throw e;}
 return {status:'STAGED_NOT_RENDERED',fontIds:[...targets.keys()]};
}

// Original source is staged separately from library assets; the project object
// must come from loadProject. Hash again before and after copying.
export function stageMasterDirectorSource(composition,{project,publicDirectory}={}){
 if(composition?.schema!=='sues-remotion-layers/v1'||!HASH.test(composition.source?.assetId??'')||
    composition.source.assetId!==project?.boundHashes?.source||typeof project?.sourcePath!=='string'||
    typeof publicDirectory!=='string'||!publicDirectory.startsWith('/'))throw Error('Invalid source staging context');
 const id=composition.source.assetId,size=statSync(project.sourcePath).size;
 if(size>256*1024*1024||fileSha256(project.sourcePath)!==id)throw Error('Source bytes changed or staging limit exceeded');
 const root=join(publicDirectory,'master-source');mkdirSync(root,{recursive:true,mode:0o700});const path=join(root,id);
 try{copyFileSync(project.sourcePath,path,constants.COPYFILE_EXCL);chmodSync(path,0o600);}
 catch(e){if(e.code!=='EEXIST'||fileSha256(path)!==id)throw e;}
 if(fileSha256(path)!==id||fileSha256(project.sourcePath)!==id)throw Error('Source changed while staging');
 return {status:'STAGED_NOT_RENDERED',sourceSha256:id};
}
