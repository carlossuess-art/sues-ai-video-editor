import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,rmSync,symlinkSync,mkdirSync,statSync,chmodSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {LocalPrivateStorage} from '../src/private-storage.js';
const context={ownerId:'owner-01',projectId:'project-01'};
function setup(maxBytes){const dir=mkdtempSync(join(tmpdir(),'sues-private-')),source=join(dir,'source.mp4');writeFileSync(source,'0000ftyp-payload');return {dir,source,storage:new LocalPrivateStorage({directory:join(dir,'objects'),maxBytes})};}
test('immutable content-addressed objects survive source removal, deduplicate and stay private',async()=>{
 const f=setup();try{const first=await f.storage.put(f.source,context,{mediaType:'video/mp4'}),second=await f.storage.put(f.source,context,{mediaType:'video/mp4'});assert.deepEqual(first,second);rmSync(f.source);const path=await f.storage.resolve(first,context);assert.equal(readFileSync(path,'utf8'),'0000ftyp-payload');assert.equal(statSync(path).mode&0o077,0);}finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('storage rejects foreign scopes, forged references, traversal and symlink directories',async()=>{
 const f=setup();try{const ref=await f.storage.put(f.source,context);await assert.rejects(f.storage.resolve(ref,{...context,ownerId:'other'}),/owner\/project/);await assert.rejects(f.storage.resolve({...ref,key:'../../source'},context),/object key/);await assert.rejects(f.storage.put(f.source,{...context,projectId:'../escape'}),/owner\/project/);
  const outside=join(f.dir,'outside');mkdirSync(outside);const scoped=join(f.storage.root,'owners','attacker');symlinkSync(outside,scoped);await assert.rejects(f.storage.put(f.source,{...context,ownerId:'attacker'}),/symlink/);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('over-limit inputs and corrupted stored objects fail without overwriting content',async()=>{
 const f=setup(20);try{const ref=await f.storage.put(f.source,context),path=await f.storage.resolve(ref,context);writeFileSync(path,'bad');await assert.rejects(f.storage.resolve(ref,context),/size\/type|checksum/);await assert.rejects(f.storage.put(f.source,context),/integrity/);assert.equal(readFileSync(path,'utf8'),'bad');writeFileSync(f.source,'x'.repeat(21));await assert.rejects(f.storage.put(f.source,context),/size limit/);}finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('existing broadly-readable storage root is rejected',()=>{const dir=mkdtempSync(join(tmpdir(),'sues-permissions-'));try{chmodSync(dir,0o755);assert.throws(()=>new LocalPrivateStorage({directory:dir}),/permissions/);}finally{rmSync(dir,{recursive:true,force:true});}});
