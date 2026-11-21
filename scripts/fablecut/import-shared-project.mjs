// Import one editable project into the existing native editor. Dry-run by default.
import {readFileSync,realpathSync,statSync,existsSync,mkdirSync,linkSync,writeFileSync} from 'node:fs';
import {resolve,join,dirname,extname,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const sha=b=>createHash('sha256').update(b).digest('hex');
const inside=(p,r)=>p===r||p.startsWith(r+sep);
export function prepareSharedProject({sourceDir,targetDir,allowedRoots=[]}){
 const source=realpathSync(sourceDir),target=realpathSync(targetDir),roots=[source,target,...allowedRoots.map(realpathSync)];
 if(source===target)throw Error('SOURCE_ALREADY_PRIMARY');
 const original=readFileSync(join(source,'project.json')),doc=JSON.parse(original);
 if(!Array.isArray(doc.media)||!Array.isArray(doc.clips))throw Error('INVALID_NATIVE_PROJECT');
 const actions=[];for(const m of doc.media){
  if(typeof m.src!=='string'||!/^\/(media|library)\//.test(m.src)||m.src.includes('..')||m.src.includes('\\'))throw Error('UNSUPPORTED_MEDIA_SOURCE');
  const relative=m.src.slice(1),local=join(source,relative),fallback=join(target,relative);
  const path=realpathSync(existsSync(local)?local:fallback);
  if(!roots.some(r=>inside(path,r))||!statSync(path).isFile())throw Error('MEDIA_OUTSIDE_APPROVED_ROOT');
  const hash=sha(readFileSync(path)),ext=extname(path).toLowerCase();
  if(!/^\.[a-z0-9]{1,8}$/.test(ext))throw Error('INVALID_EXTENSION');
  const destination=join(target,'media','sues_'+hash+ext);
  if(existsSync(destination)&&sha(readFileSync(destination))!==hash)throw Error('MEDIA_HASH_COLLISION');
  actions.push({source:path,destination,hash,exists:existsSync(destination)});
  m.src='/media/sues_'+hash+ext;
 }
 return {doc,actions,sourceHash:sha(original),target};
}
export async function importSharedProject(opts){
 const p=prepareSharedProject(opts);
 if(!opts.apply)return {status:'DRY_RUN_OK',media:p.actions.length,sourceHash:p.sourceHash,project:p.doc.name??p.doc.id??'native'};
 const url=new URL(opts.baseUrl);if(!['127.0.0.1','localhost','[::1]'].includes(url.hostname)||url.protocol!=='http:')throw Error('LOOPBACK_ONLY');
 const call=async(path,body)=>{const r=await fetch(new URL(path,url),body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});if(!r.ok)throw Error('NATIVE_HTTP_'+r.status);return r.json();};
 const marker=join(p.target,'.sues-import-'+p.sourceHash+'.json');
 if(existsSync(marker))throw Error('IMPORT_ALREADY_ATTEMPTED_CHECK_RECEIPT');
 for(const a of p.actions){if(!a.exists){mkdirSync(dirname(a.destination),{recursive:true});try{linkSync(a.source,a.destination);}catch(e){if(e.code!=='EEXIST')throw e;}}if(sha(readFileSync(a.destination))!==a.hash)throw Error('MEDIA_CHANGED');}
 if(sha(readFileSync(join(opts.sourceDir,'project.json')))!==p.sourceHash)throw Error('SOURCE_CHANGED');
 const before=await call('/api/projects');writeFileSync(marker,JSON.stringify({status:'INTENT',sourceHash:p.sourceHash,before}),{flag:'wx',mode:0o600});
 const result=await call('/api/projects',{action:'import',project:p.doc,name:opts.name??p.doc.name??'SUES editable',open:false});
 const after=await call('/api/projects');writeFileSync(marker,JSON.stringify({status:'IMPORTED_REQUIRES_READBACK',sourceHash:p.sourceHash,result,before,after},null,2),{mode:0o600});
 return {status:'IMPORTED_REQUIRES_READBACK',result,receipt:marker};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [sourceDir,targetDir,baseUrl]=process.argv.slice(2,5);if(!sourceDir||!targetDir||!baseUrl)throw Error('Usage: SOURCE_DIR TARGET_DIR LOOPBACK_URL [--apply]');
 console.log(JSON.stringify(await importSharedProject({sourceDir,targetDir,baseUrl,apply:process.argv.includes('--apply')}),null,2));
}
