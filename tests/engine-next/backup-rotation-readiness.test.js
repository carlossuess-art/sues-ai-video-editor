import test from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {assessBackupRotation} from '../../src/engine-next/backup-rotation-readiness.js';
const mk=()=>mkdtempSync(join(tmpdir(),'sues-backup-readiness-'));
test('fails closed when latest archive is incomplete and pinned rollback is absent',()=>{
 const root=mk();try{
  for(const n of ['20261025-074747','20261026-151931','20261029-182123'])mkdirSync(join(root,'update-backup-'+n));
  for(const n of ['20261025-074747','20261026-151931'])for(const f of ['editor-state.tar','editor-state.manifest.json'])writeFileSync(join(root,'update-backup-'+n,f),'safe');
  const d=assessBackupRotation({root});assert.equal(d.totalUpdateFolders,3);assert.equal(d.eligibleToConsiderRotation,false);
  assert.ok(d.blockers.includes('LATEST_BACKUP_INCOMPLETE'));assert.ok(d.blockers.includes('PINNED_ROLLBACK_MISSING'));
  assert.equal(d.filesDeleted,0);
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('readiness requires pinned archive and complete latest folders, without mutating them',()=>{
 const root=mk();try{
  const f=['20261025-074747','20261026-151931'];for(const x of f){mkdirSync(join(root,'update-backup-'+x));for(const y of ['editor-state.tar','editor-state.manifest.json'])writeFileSync(join(root,'update-backup-'+x,y),'safe');}
  mkdirSync(join(root,'gemini-live-20261026','rollback'),{recursive:true});writeFileSync(join(root,'gemini-live-20261026','rollback','editor-before.tar'),'safe');
  const a=assessBackupRotation({root});assert.equal(a.eligibleToConsiderRotation,true);assert.equal(a.filesDeleted,0);
 }finally{rmSync(root,{recursive:true,force:true});}
});
