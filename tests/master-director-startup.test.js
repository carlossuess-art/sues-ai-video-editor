import test from 'node:test';import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';import {createHash} from 'node:crypto';
import {existsSync,readFileSync,writeFileSync,rmSync} from 'node:fs';import {join,resolve} from 'node:path';
import {fixture} from './helpers/editor-fixture.js';
const hash=x=>createHash('sha256').update(x).digest('hex');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
test('normal server startup accepts opt-in config and refuses a changed runtime',async()=>{
 const f=fixture(),access=join(f.dir,'private-access'),configPath=join(f.dir,'master-config.json');
 const cfg={schema:'sues-master-preview-config/v1'};
 for(const key of ['entryFile','remotionCli','browserExecutable']){const path=join(f.dir,key);writeFileSync(path,key,{mode:0o700});cfg[key]={path,sha256:hash(key)};}
 writeFileSync(configPath,JSON.stringify(cfg),{mode:0o600});
 const start=()=>spawn(process.execPath,[resolve('scripts/app/start.mjs'),f.profiles.test,join(f.dir,'jobs'),'0'],{env:{...process.env,SUES_ACCESS_FILE:access,SUES_MASTER_PREVIEW_CONFIG:configPath},stdio:'ignore'});
 let child=start();
 try{
  for(let i=0;i<100&&!existsSync(access)&&child.exitCode===null;i++)await pause(100);
  assert.ok(existsSync(access),'normal startup did not become ready');
  const url=readFileSync(access,'utf8').trim().split('/#')[0];
  assert.equal((await fetch(url+'/api/jobs')).status,401);
  child.kill('SIGTERM');await new Promise(r=>child.once('exit',r));
  rmSync(access,{force:true});writeFileSync(cfg.entryFile.path,'changed');child=start();
  for(let i=0;i<100&&child.exitCode===null;i++)await pause(100);
  assert.notEqual(child.exitCode,null,'changed dependency left server running');assert.notEqual(child.exitCode,0);assert.equal(existsSync(access),false);
 }finally{if(child.exitCode===null){child.kill('SIGTERM');await new Promise(r=>child.once('exit',r));}rmSync(f.dir,{recursive:true,force:true});}
});
