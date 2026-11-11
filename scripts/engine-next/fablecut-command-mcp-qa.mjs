// Isolated native MCP proof. No HTTP route or production permission.
import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';import {createRequire} from 'node:module';
import {dispatchCommandBatch} from '../../src/engine-next/fablecut-command-dispatcher.js';
import {projectFingerprint} from '../../src/engine-next/fablecut-command-batch.js';
const [engine,dir]=process.argv.slice(2),base=fs.realpathSync(dir);
if(!base.includes('/automation-v1/test-project-')||!fs.existsSync(base+'/undo.json'))throw Error('QA copy only');
const native=createRequire(import.meta.url)(path.join(engine,'project-ops.js')),projectId='private-command-qa';
const call=(name,args)=>{
 const input=JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name,arguments:args}})+'\n';
 const out=execFileSync('node',[path.join(engine,'mcp-server.js')],{input,encoding:'utf8',env:{...process.env,FABLECUT_DATA_DIR:base,FABLECUT_PORT:'7786'},timeout:20000});
 const r=out.trim().split('\n').map(x=>JSON.parse(x)).find(x=>x.id===1);
 if(r?.result?.isError||!r?.result?.content?.[0]?.text)throw Error(r?.result?.content?.[0]?.text??'Invalid MCP response');
 return r.result.content[0].text;
};
const readProject=async()=>({projectId,data:JSON.parse(call('fablecut_get_project',{}))});
const p=(await readProject()).data,clip=p.clips.find(c=>c.id.startsWith('sues_cmd_')&&c.kind==='audio');
const request={baseRevision:p.revision,baseFingerprint:projectFingerprint(p),commands:[{id:'mcp-volume-qa',action:'set_volume',clipId:clip.id,volume:.42}]};
const audit=async x=>fs.appendFileSync(base+'/mcp-audit.jsonl',JSON.stringify(x)+'\n',{mode:0o600});
const deps={native,readProject,invokeMcp:async(n,a)=>call(n,a),audit,resolveAsset:()=>null,stageAssets:async a=>{if(a.length)throw Error('No staging in this QA')},authorize:async()=>false};
const input={projectId,approvalId:'technical-qa-only',request};
let denied=false,stale=false;try{await dispatchCommandBatch(input,deps)}catch(e){denied=e.message==='APPROVAL_REQUIRED'}
if(!denied||projectFingerprint((await readProject()).data)!==request.baseFingerprint)throw Error('Permission test failed');
const result=await dispatchCommandBatch(input,{...deps,authorize:async()=>true});
try{call('fablecut_patch_project',{baseRevision:p.revision,ops:[{op:'updateClip',id:clip.id,set:{props:{volume:.1}}}]})}catch(e){stale=e.message.includes('CONFLICT')}
if(!stale)throw Error('CAS test failed');
fs.writeFileSync(base+'/mcp-proof.json',JSON.stringify({result,denied,stale,creativeApproved:false},null,2));console.log(JSON.stringify({revision:result.revision,receipts:result.receipts,denied,stale}));
