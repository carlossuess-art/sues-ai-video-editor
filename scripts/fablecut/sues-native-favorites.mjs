import {realpathSync,statSync,readFileSync} from 'node:fs';
import {resolve,join,sep,extname,basename} from 'node:path';
import {createHash} from 'node:crypto';
import {SuesFavorites} from './sues-favorites.mjs';
const cache=new Map();
const types={'.mp4':'video','.mov':'video','.webm':'video','.mkv':'video','.m4v':'video','.mp3':'audio','.wav':'audio','.m4a':'audio','.aac':'audio','.flac':'audio','.ogg':'audio','.png':'image','.jpg':'image','.jpeg':'image','.webp':'image','.gif':'image','.svg':'svg','.ttf':'font','.otf':'font','.woff':'font','.woff2':'font','.json':'preset'};
export function createNativeFavorites({mediaDir,libraryDir,storeFile}){
 const roots={media:realpathSync(mediaDir),library:realpathSync(libraryDir)};
 function describe(src){
  if(typeof src!=='string'||src.length>1024||!/^\/(media|library)\//.test(src)||/[?#]/.test(src))throw Error('INVALID_RESOURCE_SOURCE');
  const [root,...parts]=src.slice(1).split('/').map(decodeURIComponent);
  if(parts.some(x=>!x||x==='.'||x==='..'||/[\\/\0]/.test(x)))throw Error('INVALID_RESOURCE_PATH');
  const file=realpathSync(join(roots[root],...parts));if(!file.startsWith(roots[root]+sep))throw Error('RESOURCE_OUTSIDE_ROOT');
  const st=statSync(file);if(!st.isFile())throw Error('NOT_RESOURCE_FILE');
  let kind=types[extname(file).toLowerCase()];if(kind==='preset'&&!(root==='library'&&['presets','templates','project-templates'].includes(parts[0])))throw Error('UNSUPPORTED_RESOURCE');
  if(!kind)throw Error('UNSUPPORTED_RESOURCE');if(root==='library'&&parts[0]==='sfx'&&kind==='audio')kind='sfx';if(root==='library'&&['templates','project-templates'].includes(parts[0]))kind='composition';
  const signature=[st.dev,st.ino,st.size,st.mtimeMs,st.ctimeMs].join(':');
  let sha=cache.get(file)?.signature===signature?cache.get(file).sha:null;
  if(!sha){sha=createHash('sha256').update(readFileSync(file)).digest('hex');if(cache.size>1024)cache.clear();cache.set(file,{signature,sha});}
  return {sha256:sha,id:sha,kind,title:basename(file),src};
 }
 const state=()=>new SuesFavorites(storeFile,{resolveResource:()=>null}).read();
 function lookup(sources){
  if(!Array.isArray(sources)||sources.length>512)throw Error('INVALID_RESOURCE_LIST');
  const f=state(),byId=new Map(f.items.map(x=>[x.id,x]));
  return {revision:f.revision,items:[...new Set(sources)].flatMap(src=>{try{const r=describe(src),s=byId.get(r.id);return [{...r,favorite:s?.favorite===true,uses:s?.uses??0}]}catch{return [{src,unavailable:true,favorite:false}]}})};
 }
 function set({src,favorite,expectedRevision}){const r=describe(src);return new SuesFavorites(storeFile,{resolveResource:id=>id===r.id?r:null}).set({id:r.id,favorite,expectedRevision});}
 function recordApprovedUse({sources,projectId,revision,expectedRevision,approved}){
  const rows=sources.map(describe),byId=new Map(rows.map(r=>[r.id,r]));
  return new SuesFavorites(storeFile,{resolveResource:id=>byId.get(id)}).recordApprovedUse({ids:[...byId.keys()],projectId,revision,expectedRevision,approved});
 }
 return {lookup,set,state,recordApprovedUse,describe};
}
