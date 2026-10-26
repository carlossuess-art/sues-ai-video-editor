import {readFileSync,lstatSync,existsSync,mkdirSync,writeFileSync,renameSync,readdirSync,unlinkSync,utimesSync,createReadStream} from 'node:fs';
import {join} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {Readable} from 'node:stream';
const HASH=/^[a-f0-9]{64}$/,ID=/^[\w-]{10,160}$/,MAX=40*1024*1024,CAP=128*1024*1024;
const regular=p=>{const s=lstatSync(p);if(!s.isFile()||s.isSymbolicLink())throw Error('Unsafe library file');return s;};
export function loadAuditedDrive(jobsDirectory){
 const path=join(jobsDirectory,'library','audited-drive-v1.json');
 if(!existsSync(path))return {cards:[],excluded:new Set(),excludedHashes:new Set()};
 if(regular(path).size>8*1024*1024)throw Error('Oversized audited catalog');
 const data=JSON.parse(readFileSync(path,'utf8'));
 if(data.schema!=='sues-resource-audit/v1'||!Array.isArray(data.cards)||data.cards.length>10000)throw Error('Invalid audited catalog');
 const excluded=new Set(),excludedHashes=new Set();
 for(const c of data.cards){
  if(!ID.test(c.driveId)||typeof c.kind!=='string')throw Error('Invalid audited resource');
  if(c.selectionExcluded===true)excluded.add(c.driveId);
 }
 // Hash groups collapse aliases even if old source-index entries lack exclusions.
 for(const group of data.byteDuplicateGroups??[]){
  if(!HASH.test(group.sha256)||!Array.isArray(group.driveIds))throw Error('Invalid duplicate group');
  const keep=group.driveIds.find(id=>!excluded.has(id));
  for(const id of group.driveIds)if(id!==keep)excluded.add(id);
 }
 for(const c of data.cards)if(c.selectionExcluded===true&&HASH.test(c.sha256??'')&&!data.cards.some(other=>!excluded.has(other.driveId)&&other.sha256===c.sha256))excludedHashes.add(c.sha256);
 return {cards:data.cards,excluded,excludedHashes};
}
export function auditedCandidates(audit){
 return audit.cards.filter(c=>!audit.excluded.has(c.driveId)&&c.kind==='video-candidate'&&c.decodeStatus==='pass'&&
  c.bytesVerified===true&&HASH.test(c.sha256)&&typeof c.visibleContentEs==='string'&&c.visibleContentEs.trim()&&
  c.sampleReviewCount>=4&&Number.isSafeInteger(c.bytes)&&c.bytes>0&&c.bytes<=MAX);
}
export class DriveResourceCache{
 constructor(jobsDirectory,{fetcher=fetch,capBytes=CAP}={}){
  if(!Number.isSafeInteger(capBytes)||capBytes<1||capBytes>CAP)throw Error('Invalid cache limit');
  this.jobsDirectory=jobsDirectory;this.fetcher=fetcher;this.capBytes=capBytes;
  this.root=join(jobsDirectory,'drive-cache');mkdirSync(this.root,{recursive:true,mode:0o700});
  if(lstatSync(this.root).isSymbolicLink())throw Error('Unsafe cache directory');
 }
 async materialize(driveId,{assets,rights}={}){
  if(!ID.test(driveId))throw Error('Invalid Drive resource ID');
  if(!assets||!['owned','licensed'].includes(rights))throw Error('Explicit rights and media library required');
  const audit=loadAuditedDrive(this.jobsDirectory);
  const c=auditedCandidates(audit).find(c=>c.driveId===driveId);
  if(!c)throw Error('Resource excluded, damaged or not reviewed by samples');
  if(c.bytes>this.capBytes)throw Error('Resource exceeds cache quota');
  // Global cache lock prevents quota races, eviction during receive, and double fetches.
  const lock=join(this.root,'.lock');try{mkdirSync(lock);}catch{throw Error('Drive cache busy; retry');}
  let temporary;
  try{
   const target=join(this.root,c.sha256+'.media');
   let hit=false;
   if(existsSync(target)){
    if(regular(target).size!==c.bytes||createHash('sha256').update(readFileSync(target)).digest('hex')!==c.sha256)throw Error('Cache integrity mismatch');
    hit=true;
   }else{
    const files=readdirSync(this.root).filter(n=>/^[a-f0-9]{64}\.media$/.test(n)).map(n=>({path:join(this.root,n),st:regular(join(this.root,n))})).sort((a,b)=>a.st.mtimeMs-b.st.mtimeMs);
    let used=files.reduce((n,f)=>n+f.st.size,0);
    while(used+c.bytes>this.capBytes&&files.length){const f=files.shift();unlinkSync(f.path);used-=f.st.size;}
    const url=new URL('https://drive.usercontent.google.com/download');url.searchParams.set('id',c.driveId);url.searchParams.set('export','download');
    // No arbitrary URL, cookies, redirects, execution of Drive projects, or provider calls.
    const signal=AbortSignal.timeout(45000);
    const response=await this.fetcher(url,{redirect:'error',signal});
    if(response.status!==200)throw Error('Drive access unavailable ('+response.status+'); authorized account connection may be required');
    const type=response.headers.get('content-type')??'';
    if(/text|html|json/i.test(type))throw Error('Drive returned a login/confirmation page');
    const declared=response.headers.get('content-length');
    if(declared!==null&&Number(declared)!==c.bytes)throw Error('Drive size changed');
    temporary=join(this.root,'.incoming-'+randomUUID());
    // The bounded file is assembled only after checking the streaming size limit.
    const chunks=[];let size=0;
    try{for await(const chunk of response.body){size+=chunk.length;if(size>c.bytes||size>MAX)throw Error('Drive download exceeds declared size');chunks.push(Buffer.from(chunk));}}catch(e){await response.body?.cancel?.().catch(()=>{});throw e;}
    const bytes=Buffer.concat(chunks);
    if(size!==c.bytes||createHash('sha256').update(bytes).digest('hex')!==c.sha256)throw Error('Drive hash/size mismatch');
    writeFileSync(temporary,bytes,{flag:'wx',mode:0o600});renameSync(temporary,target);temporary=null;
   }
   utimesSync(target,new Date(),new Date());
   const req=Readable.from(createReadStream(target));req.headers={'content-length':String(c.bytes)};
   const asset=await assets.receive(req,{kind:'video',rights,title:(c.editorialTitleEs??c.visibleContentEs).slice(0,100)});
   if(asset.id!==c.sha256)throw Error('Imported resource hash mismatch');
   return {schema:'sues-drive-materialization/v1',driveId:c.driveId,catalogueNumber:c.catalogueNumber,asset,cacheHit:hit,
    bytesVerified:true,reviewScope:'sampled-frames-only',fragmentApproved:c.fragmentApproved===true,
    approvedForProduction:false,sourceAudioDefault:false};
  }finally{
   if(temporary&&existsSync(temporary))unlinkSync(temporary);
   // Remove only this lock directory, never installed media or job bindings.
   const {rmdirSync}=await import('node:fs');rmdirSync(lock);
  }
 }
}
