#!/usr/bin/env node
/** Non-mutating publication gate. Never changes DNS, Caddy, services or media. */
import {readFileSync,statSync,existsSync,readdirSync,lstatSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve4} from 'node:dns/promises';
import {join} from 'node:path';
import {request} from 'node:http';

const options={snapshot:process.env.SUES_FABLECUT_PUBLICATION_SNAPSHOT||'/srv/sues-fablecut-next/data/qa/studio-publication-preflight-20261108',
 backupRoot:process.env.SUES_VIDEO_SETUP_ROOT||'/opt/sues-video-setup',
 host:process.env.SUES_FABLECUT_PUBLIC_HOST||'studio.suesholistics.com',
 expectedIPv4:process.env.SUES_FABLECUT_PUBLIC_IPV4||null};
const checks=[];const record=(name,ok,details)=>checks.push({name,status:ok?'PASS':'BLOCKED',details});
const sha=file=>{const h=createHash('sha256');const f=readFileSync(file);h.update(f);return h.digest('hex');};
const getLocal=()=>new Promise(resolve=>{const req=request('http://127.0.0.1:7780/',{method:'GET',timeout:3500},res=>{res.resume();resolve(res.statusCode===200);});req.on('error',()=>resolve(false));req.on('timeout',()=>req.destroy());req.end();});
try{
 const manifest=JSON.parse(readFileSync(join(options.snapshot,'manifest.json'),'utf8'));
 const files=manifest.files;
 if(!files||typeof files!=='object'||Array.isArray(files)||Object.keys(files).length<2)throw Error('Invalid snapshot file inventory');
 let valid=0,bytes=0;
 for(const [name,expected] of Object.entries(files)){
  if(!/^[A-Za-z0-9._/-]+$/.test(name)||name.startsWith('/')||name.split('/').includes('..')||!/^[a-f0-9]{64}$/.test(expected))throw Error('Invalid snapshot entry');
  const file=join(options.snapshot,name),st=lstatSync(file);
  if(!st.isFile()||st.isSymbolicLink()||sha(file)!==expected)throw Error('Snapshot integrity mismatch');
  valid++;bytes+=st.size;
 }
 record('fablecut-snapshot',true,{files:valid,bytes,sourceRevision:manifest.sourceRevision,clips:manifest.clips});
}catch(e){record('fablecut-snapshot',false,{reason:e.message});}
record('native-fablecut-loopback',await getLocal(),{endpoint:'127.0.0.1:7780'});
try{
 const root=options.backupRoot;
 const updates=readdirSync(root).filter(n=>/^update-backup-\d{8}-\d{6}(?:-\d+)?$/.test(n)&&statSync(join(root,n)).isDirectory()).sort();
 const pin=join(root,'gemini-live-20261026/rollback/editor-before.tar');
 const latest=updates.slice(-2).map(n=>({name:n,archive:existsSync(join(root,n,'editor-state.tar')),manifest:existsSync(join(root,n,'editor-state.manifest.json'))}));
 const ok=existsSync(pin)&&latest.length===2&&latest.every(x=>x.archive&&x.manifest);
 record('legacy-rollback-rotation',ok,{pinnedRollbackPresent:existsSync(pin),updateBackups:updates.length,latest});
}catch(e){record('legacy-rollback-rotation',false,{reason:e.message});}
try{
 const ips=await resolve4(options.host);
 record('public-studio-dns',!!options.expectedIPv4&&ips.includes(options.expectedIPv4),{resolved:ips,expectedIPv4:options.expectedIPv4??'not-configured'});
}catch{record('public-studio-dns',false,{reason:'not-resolved-or-unavailable'});}
// These checks cannot be inferred from accessible HTTP 200 or a test token.
record('authenticated-studio-public-gateway',false,{reason:'No verified public HTTPS auth gate E2E yet'});
record('real-human-login-e2e',false,{reason:'Real login test not completed; do not bypass security control'});
const report={schema:'sues-fablecut-publication-preflight/v1',at:new Date().toISOString(),readOnly:true,
 publishAllowed:checks.every(x=>x.status==='PASS'),checks};
console.log(JSON.stringify(report,null,2));
// An incomplete preflight is a nonzero exit code, never evidence of readiness.
if(!report.publishAllowed)process.exitCode=2;
