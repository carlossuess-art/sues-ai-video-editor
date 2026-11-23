// Disabled unless an administrator supplies a private, immutable host contract.
// Never trusts HTTP payloads for FableCut paths, projects or native permissions.
import {openSync,closeSync,readFileSync,fstatSync,lstatSync,constants,realpathSync} from 'node:fs';
import {dirname,isAbsolute,resolve} from 'node:path';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {FableCutClient} from './fablecut-client.js';
import {projectFingerprint} from './fablecut-command-batch.js';
import {createNativeProjectBindingResolver} from './fablecut-native-project-binding-registry.js';
const require=createRequire(import.meta.url);
const safePath=p=>typeof p==='string'&&isAbsolute(p)&&resolve(p)===p&&!p.includes('/../');
const PROJECT=/^p_[A-Za-z0-9_-]{2,96}$/;
function secureFile(p){
 if(!safePath(p))throw Error('TRUSTED_HOST_ABSOLUTE_FILE_REQUIRED');
 let fd;try{
  const st=lstatSync(p);if(!st.isFile()||st.isSymbolicLink()||(st.mode&0o077)||st.size>32768||st.size<2)throw Error('TRUSTED_HOST_UNSAFE_FILE');
  const uid=process.getuid?.();if(uid!==undefined&&st.uid!==uid&&st.uid!==0)throw Error('TRUSTED_HOST_OWNER_CHANGED');
  fd=openSync(p,constants.O_RDONLY|constants.O_NOFOLLOW);
  const opened=fstatSync(fd);if(st.ino!==opened.ino||st.dev!==opened.dev)throw Error('TRUSTED_HOST_FILE_REPLACED');
  return readFileSync(fd,'utf8');
 }finally{if(fd!==undefined)closeSync(fd)}
}
function validateConfig(c){
 const keys=['schema','privateClone','fablecutUrl','dataDir','nativeProjectId','nativeOpsFile','mcpServerFile','bindingFile','approvalsDir','nativeTrackRoles'];
 if(!c||typeof c!=='object'||Array.isArray(c)||Object.keys(c).sort().join()!==keys.sort().join()||c.schema!=='sues-fablecut-trusted-host/v1'||c.privateClone!==true||!PROJECT.test(c.nativeProjectId??''))throw Error('TRUSTED_HOST_INVALID_CONFIG');
 const u=new URL(c.fablecutUrl);if(u.protocol!=='http:'||u.hostname!=='127.0.0.1'||!/^\d{4,5}$/.test(u.port)||+u.port<10000||[3010,7780,7777].includes(+u.port)||u.pathname!=='/'||u.search||u.hash||u.username||u.password)throw Error('TRUSTED_HOST_PRIVATE_LOOPBACK_ONLY');
 for(const name of ['dataDir','nativeOpsFile','mcpServerFile','bindingFile','approvalsDir'])if(!safePath(c[name]))throw Error('TRUSTED_HOST_UNSAFE_PATH_'+name);
 const blocked=['/srv/sues-fablecut-next/data','/srv/sues-fablecut-next/app','/opt/sues-video-setup/editor'];
 if(blocked.some(p=>c.dataDir===p||c.dataDir.startsWith(p+'/'))||!c.dataDir.includes('private-qa'))throw Error('TRUSTED_HOST_NEVER_USE_PRODUCTION_DATA');
 if(!c.nativeTrackRoles||typeof c.nativeTrackRoles!=='object'||Array.isArray(c.nativeTrackRoles)||!Object.keys(c.nativeTrackRoles).length||Object.entries(c.nativeTrackRoles).some(([k,v])=>!/^\w{1,20}$/.test(k)||!['graphics','audio','voice','video','music','sfx','captions'].includes(v)))throw Error('TRUSTED_HOST_INVALID_TRACK_ROLES');
 for(const p of [c.dataDir,c.approvalsDir])if(!lstatSync(p).isDirectory()||lstatSync(p).isSymbolicLink())throw Error('TRUSTED_HOST_UNSAFE_DIRECTORY');
 for(const p of [c.nativeOpsFile,c.mcpServerFile])if(!lstatSync(p).isFile()||realpathSync(p)!==p)throw Error('TRUSTED_HOST_UNSAFE_EXECUTABLE');
 return c;
}
function callExactMcp(c,name,args){
 if(name!=='fablecut_patch_project'||!args||!Number.isInteger(args.baseRevision)||!Array.isArray(args.ops)||args.ops.length<1||args.ops.length>1500||Object.keys(args).some(k=>!['baseRevision','ops'].includes(k)))throw Error('TRUSTED_HOST_PATCH_ONLY');
 return new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,[c.mcpServerFile],{
   cwd:dirname(c.mcpServerFile),
   env:{PATH:process.env.PATH??'/usr/bin:/bin',HOME:process.env.HOME??'/tmp',HOST:'127.0.0.1',FABLECUT_DATA_DIR:c.dataDir,FABLECUT_PORT:new URL(c.fablecutUrl).port,FABLECUT_NO_AUTOSTART:'1'},
   stdio:['pipe','pipe','pipe']
  });
  let complete=false,data='';
  const done=(error,value)=>{if(complete)return;complete=true;clearTimeout(timer);if(!child.killed)child.kill();if(error)reject(error);else resolve(value)};
  const timer=setTimeout(()=>done(Error('TRUSTED_MCP_TIMEOUT_COMMIT_UNKNOWN_DO_NOT_RETRY')),20000);
  child.stdout.setEncoding('utf8');child.stdout.on('data',chunk=>{
   data+=chunk;
   if(data.length>32768)return done(Error('TRUSTED_MCP_OUTPUT_TOO_LONG_DO_NOT_RETRY'));
   const at=data.indexOf('\n');if(at<0)return;
   let msg;try{msg=JSON.parse(data.slice(0,at))}catch{return done(Error('TRUSTED_MCP_INVALID_RESULT_DO_NOT_RETRY'))}
   if(msg.id!==1||msg.error||msg.result?.isError)return done(Error('TRUSTED_MCP_REJECTED_'+String(msg.result?.content?.[0]?.text??msg.error?.message??'UNKNOWN').slice(0,120)));
   const result=msg.result?.content?.[0]?.text;
   if(typeof result!=='string')return done(Error('TRUSTED_MCP_NO_RECEIPT_DO_NOT_RETRY'));
   done(null,result);
  });
  child.stderr.resume();
  child.stdin.on('error',e=>done(Error('TRUSTED_MCP_INPUT_FAILED_'+(e.code??'UNKNOWN')+'_DO_NOT_RETRY')));
  child.on('error',e=>done(Error('TRUSTED_MCP_CHILD_FAILED_'+e.code)));
  child.on('exit',code=>{if(!complete)done(Error('TRUSTED_MCP_EXIT_'+code+'_DO_NOT_RETRY'))});
  child.stdin.end(JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name,arguments:args}})+'\n');
 });
}
/** Admin-only private host configuration. HTTP users cannot enable it. */
export function loadTrustedNativeHost(configPath){
 const cfg=validateConfig(JSON.parse(secureFile(configPath)));
 if((process.env.SUES_ENGINE_NEXT_FABLECUT_URL&&process.env.SUES_ENGINE_NEXT_FABLECUT_URL!==cfg.fablecutUrl)||
    (process.env.SUES_ENGINE_NEXT_DIRECTOR_APPROVALS_DIR&&process.env.SUES_ENGINE_NEXT_DIRECTOR_APPROVALS_DIR!==cfg.approvalsDir))
   throw Error('TRUSTED_HOST_CONFLICTING_ENVIRONMENT');
 const native=require(cfg.nativeOpsFile);
 if(typeof native?.applyPatch!=='function'||typeof native?.checkProject!=='function')throw Error('TRUSTED_HOST_NATIVE_MODULE_INVALID');
 const client=new FableCutClient({baseUrl:cfg.fablecutUrl});
 const bindings=createNativeProjectBindingResolver(cfg.bindingFile);
 const resolveJobContext=async jobId=>{
  if(typeof jobId!=='string')return null;
  const binding=await bindings(cfg.nativeProjectId);
  if(!binding||binding.jobId!==jobId||binding.nativeProjectId!==cfg.nativeProjectId)return null;
  const before=await client.getProject();
  if(before.projectId!==cfg.nativeProjectId||Object.keys(cfg.nativeTrackRoles).some(id=>!before.data.tracks?.some(t=>t.id===id)))return null;
  return {privateClone:true,nativeProjectId:cfg.nativeProjectId,nativeFingerprint:projectFingerprint(before.data),nativeTrackRoles:structuredClone(cfg.nativeTrackRoles),nativeMediaBindings:{}};
 };
 const invoker=async(name,args)=>{
  if(name!=='fablecut_patch_project')throw Error('TRUSTED_HOST_PATCH_ONLY');
  const current=await client.getProject();
  if(current.projectId!==cfg.nativeProjectId||current.data.revision!==args?.baseRevision)throw Error('TRUSTED_HOST_PROJECT_OR_REVISION_CHANGED');
  return callExactMcp(cfg,name,args);
 };
 return {env:{SUES_ENGINE_NEXT_FABLECUT_URL:cfg.fablecutUrl,SUES_ENGINE_NEXT_DIRECTOR_APPROVALS_DIR:cfg.approvalsDir},
  options:{nativeProjectBindingsFile:cfg.bindingFile,nativeDirectorInvoker:invoker,
   nativeBatchRuntime:{resolveJobContext,native,resolveAsset:()=>null,stageAssets:async assets=>{
    if(!Array.isArray(assets)||assets.length)throw Error('TRUSTED_HOST_ASSET_STAGING_NOT_YET_VERIFIED');
   }}}};
}
