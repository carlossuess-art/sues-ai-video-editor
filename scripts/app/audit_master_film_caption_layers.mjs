#!/usr/bin/env node
// Generate a read-only, immutable handoff of word-accurate caption candidates
// and real Film Director spatial evidence. This is NOT master-story JSON.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {inspectFilmBriefGeometry} from '../../src/master-director-brief-geometry.js';
import {prepareFilmDirectorCaptionLayerCandidates} from '../../src/master-director-brief-caption-layers.js';
const fail=(code,exit=2)=>{console.error(code);process.exit(exit);};
const args={};
for(let i=2;i<process.argv.length;i+=2){
 const flag=process.argv[i],value=process.argv[i+1];
 if(!['--annex','--caption-draft','--out'].includes(flag)||!value||args[flag])
  fail('INVALID_ARGUMENTS');
 args[flag]=value;
}
if(!['--annex','--caption-draft','--out'].every(k=>args[k]))fail('MISSING_REQUIRED_INPUT');
let annex,draft;
try{
 const read=path=>{const text=readFileSync(resolve(path),'utf8');
  if(Buffer.byteLength(text)>2_000_000)throw Error('INPUT_TOO_LARGE');
  return JSON.parse(text);
 };
 annex=read(args['--annex']);draft=read(args['--caption-draft']);
}catch{fail('INVALID_JSON_OR_UNREADABLE_FILE',3);}
const geometry=inspectFilmBriefGeometry(annex);
const result=prepareFilmDirectorCaptionLayerCandidates(annex,draft,geometry);
if(result.status==='BLOCKED')fail('CAPTION_LAYER_EVIDENCE_BLOCKED:'+result.code,4);
const report={schema:'sues-film-caption-handoff/v1',status:'CANDIDATES_NEED_HUMAN_REVIEW',
 sourceBriefSha256:result.sourceBriefSha256,sourceSha256:result.sourceSha256,
 timelineFingerprint:result.timelineFingerprint,wordCount:result.wordCount,
 frameCount:result.frameCount,candidateCount:result.candidateCount,
 proposedSafeZone:result.safeZoneProposed,
 issuesByCode:Object.fromEntries([...new Set(result.issues.map(i=>i.code))]
  .map(code=>[code,result.issues.filter(i=>i.code===code).length])),
 approved:false,canExecute:false};
const destination=resolve(args['--out']);
try{
 mkdirSync(dirname(destination),{recursive:true});
 writeFileSync(destination,JSON.stringify({report,geometry,captionLayerCandidates:result},null,2)+'\n',
  {flag:'wx',mode:0o600});
}catch{fail('OUTPUT_EXISTS_OR_CANNOT_WRITE',5);}
console.log(JSON.stringify(report));
