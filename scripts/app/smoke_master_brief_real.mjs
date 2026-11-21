// Real private Film Director brief → authenticated editor HTTP smoke.
// No creative decision, renderer call or release. Never include user media in Git.
// Usage: node scripts/app/smoke_master_brief_real.mjs PRIVATE_PROJECT.json PRIVATE_BRIEF.md
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {createEditorServer} from '../../src/editor-server.js';

const [projectPath,briefPath]=process.argv.slice(2);
if(!projectPath||!briefPath){
 console.error('Usage: node scripts/app/smoke_master_brief_real.mjs PRIVATE_PROJECT.json PRIVATE_BRIEF.md');
 process.exit(2);
}
const brief=readFileSync(resolve(briefPath),'utf8').trimEnd();
if(!brief.includes('NO APROBADO / NO EJECUTAR'))throw Error('Only unapproved briefs permitted for this audit');
const directory=mkdtempSync(join(tmpdir(),'sues-real-brief-smoke-'));
const app=createEditorServer({directory,profiles:{'real-review-only':resolve(projectPath)}});
let result;
try{
 const base=(await app.listen()).split('/#')[0],job=app.jobs.create('real-review-only'),root=base+'/api/jobs/'+job.id;
 const login=await fetch(base+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}});
 if(login.status!==200)throw Error('SESSION_AUTH_FAILED');
 const headers={Cookie:login.headers.get('set-cookie')?.split(';')[0],'X-Sues-Request':'editor','Content-Type':'application/json'};
 const catResponse=await fetch(root+'/external-catalog',{headers}),catalog=await catResponse.json();
 if(catResponse.status!==200||!/^[a-f0-9]{64}$/.test(catalog.sourceSha256??'')||!catalog.timelineFingerprint)throw Error('CATALOG_UNVERIFIED');
 const saved=await fetch(root+'/master-source-brief',{method:'POST',headers,
  body:JSON.stringify({text:brief,expectedRevision:null,expectedSourceSha256:catalog.sourceSha256,expectedTimelineFingerprint:catalog.timelineFingerprint})});
 const receipt=await saved.json();
 if(saved.status!==201||!receipt.revision)throw Error('BRIEF_SAVE_FAILED:'+JSON.stringify(receipt));
 const uri=root+'/master-brief-translation?briefRevision='+receipt.revision;
 const before=JSON.stringify(app.jobs.get(job.id));
 const [translation,capabilities,requirements,unauthorized,missing]=await Promise.all([
  fetch(uri,{headers}),fetch(root+'/master-brief-capabilities?briefRevision='+receipt.revision,{headers}),
  fetch(root+'/master-brief-requirements?briefRevision='+receipt.revision,{headers}),fetch(uri),
  fetch(root+'/master-brief-translation?briefRevision='+'f'.repeat(64),{headers})]);
 const [annex,audit,ready]=await Promise.all([translation.json(),capabilities.json(),requirements.json()]);
 result={schema:'sues-real-brief-http-smoke/v1',sourceSha256:catalog.sourceSha256,
  timelineFingerprint:catalog.timelineFingerprint,http:{save:saved.status,translation:translation.status,
   capabilities:capabilities.status,requirements:requirements.status,unauthorized:unauthorized.status,missing:missing.status},
  scenes:annex.scenes?.length,shots:annex.shotCount,intents:annex.operationIntents?.length,
  sourceLines:annex.translationCoverage?.sourceLineCount,lostLines:annex.translationCoverage?.lostLines,
  unaccountedLines:annex.instructionCoverage?.unaccountedNonemptyLines?.length,
  resources:ready.resources?.map(x=>x.slot),capabilityStatus:audit.status,
  requirementsStatus:ready.status,planApproved:annex.approved,canExecute:annex.canExecute,
  jobUnchanged:JSON.stringify(app.jobs.get(job.id))===before};
 const accepted=[translation.status===200,capabilities.status===200,requirements.status===200,
  unauthorized.status===401,missing.status===404,result.lostLines===0,
  result.unaccountedLines===0,result.scenes>0,result.intents>0,
  audit.status==='BLOCKED_PENDING_EXECUTABLE_EQUIVALENCE',
  ready.status==='EVIDENCE_REQUIRED',result.planApproved===false,
  result.canExecute===false,result.jobUnchanged];
 result.status=accepted.every(Boolean)?'HTTP_AUDIT_PASS_NOT_CREATIVE_APPROVAL':'HTTP_AUDIT_FAILED';
 console.log(JSON.stringify(result,null,2));
 if(!accepted.every(Boolean))process.exitCode=1;
}finally{
 await app.close();
 rmSync(directory,{recursive:true,force:true});
}
