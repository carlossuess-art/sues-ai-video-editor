import {mkdirSync,lstatSync,readFileSync,writeFileSync,renameSync,unlinkSync,rmdirSync,existsSync} from 'node:fs';
import {dirname,resolve,isAbsolute} from 'node:path';
import {randomUUID} from 'node:crypto';
const SHA=/^[a-f0-9]{64}$/,ID=/^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,127}$/;
const empty=()=>({schema:'sues-favorites/v1',revision:0,items:[]});
const kinds=new Set(['audio','sfx','music','image','video','svg','motion','preset','font','mask','composition','overlay']);
export class SuesFavorites{
 constructor(path,{resolveResource}={}){
  if(!isAbsolute(path)||resolve(path)!==path||typeof resolveResource!=='function')throw Error('TRUSTED_FAVORITES_CONFIGURATION_REQUIRED');
  this.path=path;this.resolveResource=resolveResource;mkdirSync(dirname(path),{recursive:true,mode:0o700});
  if(lstatSync(dirname(path)).isSymbolicLink())throw Error('UNSAFE_FAVORITES_DIRECTORY');
 }
 read(){
  if(!existsSync(this.path))return empty();
  const st=lstatSync(this.path);if(!st.isFile()||st.isSymbolicLink()||st.size>8*1024*1024)throw Error('INVALID_FAVORITES_FILE');
  const v=JSON.parse(readFileSync(this.path,'utf8'));
  if(v.schema!=='sues-favorites/v1'||!Number.isInteger(v.revision)||v.revision<0||!Array.isArray(v.items)||new Set(v.items.map(x=>x.id)).size!==v.items.length||v.items.some(x=>!SHA.test(x.id)||!kinds.has(x.kind)||typeof x.favorite!=='boolean'||!Number.isInteger(x.uses)||x.uses<0||!Array.isArray(x.usedIn)))throw Error('INVALID_FAVORITES_DATA');
  return v;
 }
 verified(id){const r=this.resolveResource(id);if(!SHA.test(id??'')||r?.sha256!==id||!kinds.has(r.kind)||typeof r.title!=='string'||!r.title.trim())throw Error('FAVORITE_RESOURCE_UNVERIFIED');return r}
 mutate(expected,fn){
  const lock=this.path+'.lock';try{mkdirSync(lock,{mode:0o700})}catch(e){if(e.code==='EEXIST')return {status:'CONFLICT',code:'FAVORITES_BUSY',revision:this.read().revision};throw e}
  try{const v=this.read();if(!Number.isInteger(expected)||expected!==v.revision)return {status:'CONFLICT',code:'STALE_FAVORITES',revision:v.revision};
   const next=structuredClone(v);fn(next);if(JSON.stringify(next.items)===JSON.stringify(v.items))return {status:'OK',...v};
   next.revision++;next.items.sort((a,b)=>a.id.localeCompare(b.id));const tmp=this.path+'.'+randomUUID()+'.tmp';
   try{writeFileSync(tmp,JSON.stringify(next)+'\n',{mode:0o600,flag:'wx'});renameSync(tmp,this.path)}finally{if(existsSync(tmp))unlinkSync(tmp)}
   return {status:'OK',...next};
  }finally{rmdirSync(lock)}
 }
 set({id,favorite,expectedRevision}={}){
  if(typeof favorite!=='boolean')throw Error('INVALID_FAVORITE');const r=this.verified(id);
  return this.mutate(expectedRevision,v=>{let x=v.items.find(x=>x.id===id);if(!x){x={id,kind:r.kind,title:r.title,favorite:false,manual:null,uses:0,usedIn:[]};v.items.push(x)}x.favorite=favorite;x.manual=favorite});
 }
 recordApprovedUse({ids,projectId,revision,expectedRevision,approved=false}={}){
  if(approved!==true||!ID.test(projectId??'')||!ID.test(String(revision??''))||!Array.isArray(ids)||ids.length>512)throw Error('APPROVED_USE_REQUIRED');
  const entries=[...new Set(ids)].map(id=>this.verified(id)),key=projectId+':'+revision;
  return this.mutate(expectedRevision,v=>{for(const r of entries){let x=v.items.find(a=>a.id===r.sha256);if(!x){x={id:r.sha256,kind:r.kind,title:r.title,favorite:false,manual:null,uses:0,usedIn:[]};v.items.push(x)}if(!x.usedIn.includes(key)){x.usedIn.push(key);x.uses++}if(x.manual!==false)x.favorite=true}});
 }
}
