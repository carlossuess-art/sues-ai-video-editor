import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,chmodSync,rmSync,symlinkSync,renameSync} from 'node:fs';
import {join} from 'node:path';import {tmpdir} from 'node:os';
import {createNativeProjectBindingResolver} from '../../src/engine-next/fablecut-native-project-binding-registry.js';
const binding={nativeProjectId:'p_158404',jobId:'a0e00000-0000-4000-8000-000000000001',suesProjectId:'sues-project',verified:true};
const value=(bindings=[binding])=>JSON.stringify({schema:'sues-native-project-bindings/v1',bindings})+'\n';
const fixture=async fn=>{const dir=mkdtempSync(join(tmpdir(),'sues-private-native-map-')),file=join(dir,'bindings.json');try{await fn(dir,file);}finally{rmSync(dir,{recursive:true,force:true});}};
test('server-only registry resolves one canonical exact project and honors removal immediately',async()=>fixture(async(dir,file)=>{
 writeFileSync(file,value(),{mode:0o600});const get=createNativeProjectBindingResolver(file);
 assert.deepEqual(await get('p_158404'),binding);assert.equal(await get('p_different'),null);
 const next=join(dir,'next');writeFileSync(next,value([]),{mode:0o600});renameSync(next,file);
 assert.equal(await get('p_158404'),null);
}));
test('rejects malformed, duplicate, non-canonical, oversized and altered registries',async()=>fixture(async(dir,file)=>{
 const get=createNativeProjectBindingResolver(file);
 for(const text of [JSON.stringify({schema:'wrong',bindings:[binding]}),JSON.stringify({schema:'sues-native-project-bindings/v1',bindings:[binding,binding]}),
  JSON.stringify({schema:'sues-native-project-bindings/v1',bindings:[{...binding,verified:false}]}),
  JSON.stringify({schema:'sues-native-project-bindings/v1',bindings:[{...binding,jobId:'../escape'}]}),
  '{"schema":"sues-native-project-bindings/v1","schema":"other","bindings":[]}',
  JSON.stringify({schema:'sues-native-project-bindings/v1',bindings:[binding],danger:true}),
  ' '.repeat(33000)]){
  writeFileSync(file,text,{mode:0o600});assert.equal(await get('p_158404'),null);
 }
}));
test('refuses world-readable file, writable parent, symlinks, missing path and unsafe path',async()=>fixture(async(dir,file)=>{
 const get=createNativeProjectBindingResolver(file);
 assert.equal(await get('p_158404'),null);
 writeFileSync(file,value(),{mode:0o644});assert.equal(await get('p_158404'),null);
 chmodSync(file,0o600);chmodSync(dir,0o777);assert.equal(await get('p_158404'),null);
 chmodSync(dir,0o700);assert.deepEqual(await get('p_158404'),binding);
 const link=join(dir,'alias');symlinkSync(file,link);assert.equal(await createNativeProjectBindingResolver(link)('p_158404'),null);
 assert.throws(()=>createNativeProjectBindingResolver('relative.json'));
}));
