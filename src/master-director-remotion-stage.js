// Stage only authenticated, checksum-verified private stills into an isolated
// Remotion public directory. Never follows user-supplied paths or URLs.
import {mkdirSync,readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
const HASH=/^[a-f0-9]{64}$/;
export function stageMasterDirectorImages(composition,{assets,publicDirectory}={}){
 if(composition?.schema!=='sues-remotion-layers/v1'||!Array.isArray(composition.layers)||
    typeof publicDirectory!=='string'||!publicDirectory.startsWith('/'))throw Error('Invalid staging context');
 const ids=[...new Set(composition.layers.flatMap(l=>[...(['image','audio'].includes(l.kind)?[l.assetId]:[]),...(l.maskAssetId?[l.maskAssetId]:[])]))];
 if(ids.length>1500||ids.some(x=>!HASH.test(x??'')))throw Error('Invalid media asset');
 const expected=new Map();for(const l of composition.layers){
  for(const [id,kind] of [[l.kind==='image'?l.assetId:null,'image'],[l.kind==='audio'?l.assetId:null,'audio'],[l.maskAssetId,'image']])if(id){
   if(expected.has(id)&&expected.get(id)!==kind)throw Error('Conflicting media type');expected.set(id,kind);
  }
 }
 const prepared=[];let totalBytes=0;
 // First verify every source before writing any copy.
 for(const id of ids){
  const a=assets.resolve(id),m=assets.metadata(id);
  if(expected.get(id)==='image'?a.kind!=='image':!['audio','sfx'].includes(a.kind))throw Error('Asset kind unsupported');
  if(a.sha256!==id||m?.approvedForProduction!==true||m.license?.rightsStatus!=='verified'||
     m.license.commercialUseAllowed!==true||!m.license.proofRef||!m.testReportRef)throw Error('Image evidence unavailable');
  const bytes=readFileSync(a.localFile);
  totalBytes+=bytes.length;
  if(bytes.length>40*1024*1024||totalBytes>256*1024*1024||createHash('sha256').update(bytes).digest('hex')!==id)throw Error('Media bytes changed or staging limit exceeded');
  prepared.push({id,bytes});
 }
 const root=join(publicDirectory,'master-assets');mkdirSync(root,{recursive:true,mode:0o700});
 const made=[];
 try{for(const a of prepared){
  const path=join(root,a.id);
  try{writeFileSync(path,a.bytes,{mode:0o600,flag:'wx'});made.push(path);}
  catch(e){if(e.code!=='EEXIST'||createHash('sha256').update(readFileSync(path)).digest('hex')!==a.id)throw e;}
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
