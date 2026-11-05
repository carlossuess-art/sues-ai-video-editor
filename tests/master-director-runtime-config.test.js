import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,chmodSync,symlinkSync,rmSync} from 'node:fs';import {join} from 'node:path';import {tmpdir} from 'node:os';import {createHash} from 'node:crypto';
import {loadMasterPreviewConfig} from '../src/master-director-runtime-config.js';
const digest=x=>createHash('sha256').update(x).digest('hex');
test('preview is opt-in and loads only a private hash-bound operator configuration',()=>{
 assert.equal(loadMasterPreviewConfig(),null);const dir=mkdtempSync(join(tmpdir(),'master-runtime-'));
 try{const cfg={schema:'sues-master-preview-config/v1'};for(const key of ['entryFile','remotionCli','browserExecutable']){const path=join(dir,key);writeFileSync(path,key,{mode:0o700});cfg[key]={path,sha256:digest(key)};}
  const file=join(dir,'config.json');writeFileSync(file,JSON.stringify(cfg),{mode:0o600});const result=loadMasterPreviewConfig(file);assert.equal(result.entryFile,cfg.entryFile.path);assert.equal(result.browserExecutable,cfg.browserExecutable.path);
  writeFileSync(cfg.entryFile.path,'changed');assert.throws(()=>loadMasterPreviewConfig(file),/dependency changed/);writeFileSync(cfg.entryFile.path,'entryFile');
  chmodSync(file,0o666);assert.throws(()=>loadMasterPreviewConfig(file),/Untrusted/);chmodSync(file,0o600);
  const link=join(dir,'link');symlinkSync(file,link);assert.throws(()=>loadMasterPreviewConfig(link),/Untrusted/);
  cfg.entryFile.path='relative';writeFileSync(file,JSON.stringify(cfg));assert.throws(()=>loadMasterPreviewConfig(file),/Invalid/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
