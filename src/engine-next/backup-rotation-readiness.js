import {statSync,existsSync,readdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
/** A READ-ONLY diagnostic. Never rotates or removes backups. */
export function assessBackupRotation({root,pinnedRelative='gemini-live-20261026/rollback/editor-before.tar'}={}){
 if(typeof root!=='string'||!root.startsWith('/')||!/^[-a-zA-Z0-9_/.]+$/.test(pinnedRelative)||pinnedRelative.includes('..'))throw Error('Invalid backup root or pinned backup path');
 const base=resolve(root);const folders=readdirSync(base,{withFileTypes:true}).filter(x=>x.isDirectory()&&/^update-backup-\d{8}-\d{6}(?:-\d+)?$/.test(x.name)).map(x=>x.name).sort();
 const latest=folders.slice(-2);
 const incomplete=latest.filter(name=>!['editor-state.tar','editor-state.manifest.json'].every(f=>{
  const p=join(base,name,f);return existsSync(p)&&statSync(p).isFile()&&statSync(p).size>0;
 }));
 const pinned=join(base,pinnedRelative);const pinPresent=existsSync(pinned)&&statSync(pinned).isFile()&&statSync(pinned).size>0;
 const blockers=[];
 if(incomplete.length)blockers.push('LATEST_BACKUP_INCOMPLETE');
 if(!pinPresent)blockers.push('PINNED_ROLLBACK_MISSING');
 if(folders.length<2)blockers.push('INSUFFICIENT_UPDATE_BACKUPS');
 return Object.freeze({schema:'sues-backup-rotation-readiness/v1',readOnly:true,root:base,totalUpdateFolders:folders.length,latestFolders:latest,incompleteLatestFolders:incomplete,pinnedBackupPresent:pinPresent,eligibleToConsiderRotation:blockers.length===0,blockers,filesDeleted:0,
  notice:'Readiness checks are not full checksum/restore verification. Never delete backups based on this report alone.'});
}
