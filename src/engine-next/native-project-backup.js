/** Read-only FableCut project backup verification for SUES 2.3 safety gate.
 * Never imports/restores a backup into the persistent engine. The caller
 * supplies an isolated directory; every artifact is content-addressed.
 */
import {createHash} from 'node:crypto';
import {mkdir,writeFile,readFile,rename,rm} from 'node:fs/promises';
import {join,resolve,dirname} from 'node:path';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const canonical=value=>Buffer.from(JSON.stringify(value));
function checkDocument(p) {
 if(!p||!Number.isInteger(p.revision)||p.revision<0||!Array.isArray(p.clips)||!Array.isArray(p.media)||!Array.isArray(p.tracks)||
    !Number.isFinite(p.width)||!Number.isFinite(p.height)||!Number.isFinite(p.fps))throw Error('Invalid FableCut project');
 for(const list of [p.clips,p.media,p.tracks]){const ids=list.map(x=>x?.id);if(ids.some(x=>typeof x!=='string'||!x)||new Set(ids).size!==ids.length)throw Error('Invalid native project identifiers');}
 return {revision:p.revision,clips:p.clips.length,media:p.media.length,tracks:p.tracks.length,width:p.width,height:p.height,fps:p.fps};
}
export function validateFablecutBackup(backup,expectedProject){
 if(!backup||backup.fablecut!=='backup'||backup.format!==1||!backup.project||!Array.isArray(backup.versions)||
   typeof backup.name!=='string'||backup.versions.length>1000)throw Error('Invalid FableCut backup format');
 const stats=checkDocument(backup.project);
 if(expectedProject){const old=checkDocument(expectedProject);if(hash(canonical(backup.project))!==hash(canonical(expectedProject))||stats.revision!==old.revision)throw Error('Backup does not match current project');}
 const versionNumbers=new Set();for(const v of backup.versions){if(!Number.isInteger(v.v)||v.v<1||versionNumbers.has(v.v))throw Error('Invalid version record');versionNumbers.add(v.v);}
 return {...stats,versions:backup.versions.length};
}
export async function captureReadOnlyFablecutBackup({baseUrl='http://127.0.0.1:7780',fetchImpl=fetch,destination}={}){
 const endpoint=new URL(baseUrl);
 if(endpoint.protocol!=='http:'||!['127.0.0.1','localhost','[::1]'].includes(endpoint.hostname)||endpoint.pathname!=='/'||endpoint.search||endpoint.hash||endpoint.username||endpoint.password)throw Error('Backup origin must be FableCut loopback');
 if(typeof destination!=='string'||!destination.startsWith('/')||resolve(destination)!==destination||destination==='/'||destination.length<18)throw Error('Destination must be a fresh absolute QA directory');
 const read=async path=>{const response=await fetchImpl(endpoint.origin+path,{method:'GET',redirect:'error',signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error('FableCut backup GET failed '+response.status);const text=await response.text();if(text.length>10_000_000)throw Error('Backup response exceeds 10MB');return JSON.parse(text);};
 // Non-destructive GET requests, refuse mismatches if open project changes between reads.
 const before=await read('/api/project');const backup=await read('/api/projects/backup');const after=await read('/api/project');
 const stats=validateFablecutBackup(backup,before);
 if(hash(canonical(before))!==hash(canonical(after)))throw Error('Concurrent project change; discard inconsistent backup');
 const data=Buffer.from(JSON.stringify(backup,null,2)+'\n');
 const sha=hash(data);const manifest={schema:'sues-native-nle-backup/v1',status:'VERIFIED_READ_ONLY',project:stats,sha256:sha,bytes:data.length,
   filename:'fablecut-project-backup.json',readOnly:true,persistentRestoreAttempted:false,
   limitations:['Snapshot includes project and version records, not media file bytes','Restoration is a separate controlled QA test; never auto-restore production','No publishing or deployment authorization']};
 await mkdir(destination,{recursive:false,mode:0o750});
 try{
  await writeFile(join(destination,'fablecut-project-backup.json.tmp'),data,{flag:'wx',mode:0o600});
  await rename(join(destination,'fablecut-project-backup.json.tmp'),join(destination,'fablecut-project-backup.json'));
  await writeFile(join(destination,'manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx',mode:0o600});
  const roundtrip=await readFile(join(destination,'fablecut-project-backup.json'));
  if(hash(roundtrip)!==sha)throw Error('Backup roundtrip SHA mismatch');
  validateFablecutBackup(JSON.parse(roundtrip.toString()),before);
  return {destination,manifest};
 }catch(e){await rm(destination,{recursive:true,force:true});throw e;}
}
