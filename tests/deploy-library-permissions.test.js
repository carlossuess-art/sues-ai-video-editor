import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,symlinkSync,chmodSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
const prefix="import sys,json\nsys.path.insert(0,'scripts/deploy')\nfrom library_access_preflight import library_access_report\n";
function inspect(root,uid,gid){
 const source=prefix+"print(json.dumps(library_access_report(sys.argv[1],int(sys.argv[2]),int(sys.argv[3]))))";
 const result=spawnSync('python3',['-c',source,root,String(uid),String(gid)],{encoding:'utf8'});
 if(result.status!==0)throw Error(result.stderr||'preflight failed');
 return JSON.parse(result.stdout);
}
test('library preflight checks runtime permission bits without mutating metadata',()=>{
 const root=mkdtempSync(join(tmpdir(),'sues-preflight-')),a=join(root,'jobs','assets'),b=join(root,'jobs','library');
 try{
  mkdirSync(a,{recursive:true,mode:0o700});mkdirSync(b,{mode:0o700});
  writeFileSync(join(a,'media.json'),'{}',{mode:0o600});writeFileSync(join(a,'media.media'),'media',{mode:0o600});
  writeFileSync(join(b,'official-library-v1.json'),'{}',{mode:0o600});
  const good=inspect(root,process.getuid(),process.getgid());
  assert.equal(good.ready,true);assert.equal(good.changesMade,false);
  const bad=inspect(root,987654,987654);
  assert.equal(bad.ready,false);assert.ok(bad.blocked.assets>=1);assert.ok(bad.blocked.library>=1);
  assert.deepEqual(inspect(root,process.getuid(),process.getgid()).blocked,{assets:0,library:0});
  chmodSync(join(a,'media.media'),0o000);
  assert.equal(inspect(root,process.getuid(),process.getgid()).blocked.assets,1);
  assert.equal(good.schema,'sues-library-access-report/v1');
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('library preflight fails safely when catalog absent or a symlink is found',()=>{
 const root=mkdtempSync(join(tmpdir(),'sues-preflight-')),a=join(root,'jobs','assets');
 try{
  mkdirSync(a,{recursive:true});const missing=inspect(root,process.getuid(),process.getgid());
  assert.equal(missing.ready,false);assert.deepEqual(missing.missing,['library']);
  symlinkSync(join(root,'nope'),join(a,'ref'));
  const code=prefix+"library_access_report(sys.argv[1],int(sys.argv[2]),int(sys.argv[3]))";
  const res=spawnSync('python3',['-c',code,root,String(process.getuid()),String(process.getgid())],{encoding:'utf8'});
  assert.notEqual(res.status,0);assert.match(res.stderr,/Unsupported entry/);
 }finally{rmSync(root,{recursive:true,force:true});}
});
