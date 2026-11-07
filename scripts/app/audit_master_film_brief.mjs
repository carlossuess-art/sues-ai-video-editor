#!/usr/bin/env node
// Audits a PRIVATE, unapproved Film Director brief against a verified source.
// Produces evidence only: this does not build an executable master story or approve a Reel.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {translateFilmDirectorBrief} from '../../src/master-director-brief-translation.js';
import {auditFilmBriefCapabilities} from '../../src/master-director-brief-capabilities.js';
import {buildMasterBriefRequirements} from '../../src/master-director-brief-requirements.js';

const options={};
for(let i=2;i<process.argv.length;i+=2){
 const flag=process.argv[i],value=process.argv[i+1];
 if(!['--brief','--source-sha','--original-sha','--fingerprint','--duration','--out'].includes(flag)||!value||options[flag]){
  console.error('INVALID_ARGUMENTS');process.exit(2);
 }
 options[flag]=value;
}
if(!['--brief','--source-sha','--original-sha','--fingerprint','--duration'].every(k=>options[k])){
 console.error('REQUIRED: --brief --source-sha --original-sha --fingerprint --duration [--out]');process.exit(2);
}
const text=readFileSync(resolve(options['--brief']),'utf8').replace(/\r\n/g,'\n').replace(/\n$/,'');
const annex=translateFilmDirectorBrief({text,
 sourceSha256:options['--source-sha'],originalSha256:options['--original-sha'],
 timelineFingerprint:options['--fingerprint'],duration:Number(options['--duration'])});
if(annex.status==='BLOCKED'){
 console.error(JSON.stringify({status:'BLOCKED',code:annex.code}));process.exit(3);
}
const capabilities=auditFilmBriefCapabilities(annex);
const requirements=buildMasterBriefRequirements(annex);
if(capabilities.status==='BLOCKED'||requirements.status==='BLOCKED'||annex.translationCoverage.lostLines||
 annex.instructionCoverage.unaccountedNonemptyLines.length){
 console.error('AUDIT_INTEGRITY_FAILURE');process.exit(4);
}
const report={
 schema:'sues-master-brief-private-audit/v1',sourceBriefSha256:annex.sourceBriefSha256,
 sourceSha256:annex.sourceSha256,originalSha256:annex.originalSha256,
 timelineFingerprint:annex.timelineFingerprint,scenes:annex.scenes.length,
 shots:annex.shotCount,intents:annex.operationIntents.length,
 preservedLines:annex.translationCoverage.preservedLines,
 unaccountedNonemptyLines:annex.instructionCoverage.unaccountedNonemptyLines,
 resources:requirements.resources.map(r=>({slot:r.slot,kind:r.kind,status:r.status,issues:r.issues})),
 capabilityCounts:capabilities.counts,unresolved:capabilities.unresolved,
 status:'AUDITED_NOT_APPROVED_NOT_EXECUTABLE',approved:false,canExecute:false
};
if(options['--out']){
 const target=resolve(options['--out']);mkdirSync(dirname(target),{recursive:true});
 writeFileSync(target,JSON.stringify({report,annex,capabilities,requirements},null,2)+'\n',{flag:'wx',mode:0o600});
}
console.log(JSON.stringify(report));
