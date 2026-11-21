import fs from 'node:fs';
import { createCleanupService } from './cleanup.mjs';
const c=createCleanupService();
const [command,...args]=process.argv.slice(2);
try {
 if(command==='scan'){
  const s=c.scan();
  const file='/var/lib/sues-vps-mcp/cleanup/report-'+s.scanId+'.txt';
  fs.writeFileSync(file,c.markdown(s)+'\n',{mode:0o600,flag:'wx'});
  console.log(JSON.stringify({scanId:s.scanId,freeSpace:s.freeSpace,summary:s.summary,
   items:s.items.map(i=>({id:i.id,risk:i.risk,category:i.category,bytes:i.bytes,reason:i.reason,path:i.path})),
   copyReport:file,deleted:false},null,2));
 }else if(command==='prepare'){
  const [scanId,...ids]=args;
  console.log(JSON.stringify(c.prepare(scanId,ids),null,2));
 }else if(command==='execute'){
  const data=JSON.parse(fs.readFileSync(0,'utf8'));
  console.log(JSON.stringify(c.execute(data.approvalId,data.token,data.confirmationPhrase),null,2));
 }else{
  console.error('Uso: scan | prepare <scan-id> <item-id>... | execute (JSON por stdin)');
  process.exitCode=2;
 }
}catch(e){console.error('NO SE HA EJECUTADO LA LIMPIEZA:',e.message);process.exitCode=1}
