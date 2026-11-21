import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,symlinkSync,chmodSync,rmSync} from 'node:fs';
import {join} from 'node:path';import {tmpdir} from 'node:os';import {createHash} from 'node:crypto';
import {inventoryMasterRuntime,verifyMasterRuntimeManifest} from '../src/master-director-runtime-manifest.js';
import {loadMasterPreviewConfig} from '../src/master-director-runtime-config.js';
const sha=x=>createHash('sha256').update(x).digest('hex');
test('v2 binds every runtime file and fails closed on transitive changes',()=>{
 const dir=mkdtempSync(join(tmpdir(),'sues-pinned-runtime-')),root=join(dir,'runtime');mkdirSync(root,{mode:0o700});
 try{
  const config={schema:'sues-master-preview-config/v2'};
  for(const key of ['entryFile','remotionCli','browserExecutable']){const path=join(root,key);writeFileSync(path,key,{mode:0o700});config[key]={path,sha256:sha(key)};}
  mkdirSync(join(root,'system-libs'),{mode:0o700});writeFileSync(join(root,'system-libs','library.so'),'fixture',{mode:0o600});
  const dep=join(root,'transitive.js');writeFileSync(dep,'original',{mode:0o600});symlinkSync('transitive.js',join(root,'internal-link'));
  const manifest=inventoryMasterRuntime(root),bytes=JSON.stringify(manifest),file=join(dir,'manifest.json');writeFileSync(file,bytes,{mode:0o600});
  config.integrity={root,manifest:file,sha256:sha(bytes),systemLibraries:true};const configPath=join(dir,'config.json');writeFileSync(configPath,JSON.stringify(config),{mode:0o600});
  const loaded=loadMasterPreviewConfig(configPath);assert.equal(loaded.entryFile,config.entryFile.path);assert.equal(loaded.browserLibraryPath,join(root,'system-libs'));
  writeFileSync(dep,'changed');assert.throws(()=>loadMasterPreviewConfig(configPath),/runtime changed/);writeFileSync(dep,'original');
  writeFileSync(join(root,'extra.js'),'extra');assert.throws(()=>verifyMasterRuntimeManifest(root,manifest),/runtime changed/);rmSync(join(root,'extra.js'));
  chmodSync(dep,0o666);assert.throws(()=>loadMasterPreviewConfig(configPath),/Writable runtime/);chmodSync(dep,0o600);
  symlinkSync('/etc/passwd',join(root,'escape'));assert.throws(()=>inventoryMasterRuntime(root),/escapes root/);rmSync(join(root,'escape'));
  assert.equal(verifyMasterRuntimeManifest(root,manifest),true);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
