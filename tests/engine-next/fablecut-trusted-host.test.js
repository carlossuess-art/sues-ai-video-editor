import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,chmodSync,rmSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';import {join} from 'node:path';
import {loadTrustedNativeHost} from '../../src/engine-next/fablecut-trusted-host.js';
const fixture=async fn=>{
 const root=mkdtempSync(join(tmpdir(),'sues-host-'));
 try{
  const dataDir=join(root,'private-qa'),approvalsDir=join(root,'approvals'),ops=join(root,'ops.cjs'),mcp=join(root,'mcp.cjs'),binding=join(root,'binding.json'),config=join(root,'host.json');
  mkdirSync(dataDir,{mode:0o700});mkdirSync(approvalsDir,{mode:0o700});
  writeFileSync(ops,'module.exports={applyPatch(){},checkProject(){}};\n');writeFileSync(mcp,'process.exit(1);\n');
  writeFileSync(binding,JSON.stringify({schema:'sues-native-project-bindings/v1',bindings:[]})+'\n',{mode:0o600});
  const value={schema:'sues-fablecut-trusted-host/v1',privateClone:true,fablecutUrl:'http://127.0.0.1:17967',dataDir,nativeProjectId:'p_private_qa',nativeOpsFile:ops,mcpServerFile:mcp,bindingFile:binding,approvalsDir,nativeTrackRoles:{V2:'graphics'}};
  const save=(v=value,mode=0o600)=>writeFileSync(config,JSON.stringify(v)+'\n',{mode});
  await fn({root,dataDir,approvalsDir,config,binding,value,save});
 }finally{rmSync(root,{recursive:true,force:true})}
};
test('trusted FableCut host is strictly opt-in and fails on missing settings',()=>{
 assert.throws(()=>loadTrustedNativeHost(undefined),/TRUSTED_HOST_ABSOLUTE_FILE_REQUIRED/);
});
test('load scoped QA host, but no binding implies no executable project',async()=>fixture(async f=>{
 f.save();const host=loadTrustedNativeHost(f.config);
 assert.equal(host.env.SUES_ENGINE_NEXT_FABLECUT_URL,'http://127.0.0.1:17967');
 assert.equal(await host.options.nativeBatchRuntime.resolveJobContext('made-up-job'),null);
 assert.equal(typeof host.options.nativeDirectorInvoker,'function');
 await host.options.nativeBatchRuntime.stageAssets([]);
 await assert.rejects(()=>host.options.nativeBatchRuntime.stageAssets([{}]),/NOT_YET_VERIFIED/);
 await assert.rejects(()=>host.options.nativeDirectorInvoker('other_tool',{}),/PATCH_ONLY/);
}));
test('config must be a single private regular file',async()=>fixture(async f=>{
 f.save(f.value,0o644);assert.throws(()=>loadTrustedNativeHost(f.config),/UNSAFE_FILE/);
 chmodSync(f.config,0o600);const link=join(f.root,'link.json');symlinkSync(f.config,link);
 assert.throws(()=>loadTrustedNativeHost(link),/UNSAFE_FILE/);
}));
test('public or product service/data destinations cannot be configured',async()=>fixture(async f=>{
 for(const patch of [{fablecutUrl:'https://example.com'},{fablecutUrl:'http://127.0.0.1:7780'},
  {privateClone:false},{dataDir:'/srv/sues-fablecut-next/data'}, {nativeTrackRoles:{}},
  {nativeProjectId:'../../escape'}]){
  f.save({...f.value,...patch});assert.throws(()=>loadTrustedNativeHost(f.config));
 }
}));
test('verified binding resolves only the matching private job and current active project',async()=>fixture(async f=>{
 const {createServer}=await import('node:http');
 const good='a0e00000-0000-4000-8000-000000000001';
 let nativeId=f.value.nativeProjectId, project={name:'private',revision:4,tracks:[{id:'V2',kind:'video'}],media:[],clips:[],fps:30};
 const server=createServer((req,res)=>{
  res.writeHead(200,{'content-type':'application/json','x-fablecut-project':nativeId});res.end(JSON.stringify(project));
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const port=server.address().port;
  if(port<10000)throw Error('unexpected system ephemeral port');
  f.save({...f.value,fablecutUrl:'http://127.0.0.1:'+port});
  writeFileSync(f.binding,JSON.stringify({schema:'sues-native-project-bindings/v1',bindings:[{nativeProjectId:nativeId,jobId:good,suesProjectId:'qa-project',verified:true}]})+'\n',{mode:0o600});
  const host=loadTrustedNativeHost(f.config),resolveJob=host.options.nativeBatchRuntime.resolveJobContext;
  assert.equal(await resolveJob('other-job'),null);
  const valid=await resolveJob(good);assert.equal(valid.nativeProjectId,nativeId);assert.equal(valid.privateClone,true);
  nativeId='p_different';assert.equal(await resolveJob(good),null);
  nativeId=f.value.nativeProjectId;project={...project,tracks:[]};assert.equal(await resolveJob(good),null);
  writeFileSync(f.binding,JSON.stringify({schema:'sues-native-project-bindings/v1',bindings:[]})+'\n',{mode:0o600});
  assert.equal(await resolveJob(good),null);
 }finally{await new Promise(resolve=>server.close(resolve))}
}));
