// Private intake of an already-uploaded recording. Reuses existing source
// timestamp probe, exact native project contract and approved rule policy.
// No invented transcript, automatic rights, editing, generation or deployment.
import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';import {execFileSync} from 'node:child_process';
import {probeMasterDirectorSource} from '../../src/master-director-source-probe.js';
import {extractApprovedRules} from '../../src/master-director-policy-builder.js';
import {projectFingerprint} from '../../src/engine-next/fablecut-command-batch.js';
const [sourceArg,policyArg,dest]=process.argv.slice(2),data=fs.realpathSync('/srv/sues-fablecut-next/data'),root=fs.realpathSync(data+'/automation-v1');
const source=fs.realpathSync(sourceArg),out=path.resolve(dest),policyFile=fs.realpathSync(policyArg);
if(!source.startsWith(data+path.sep)||!fs.statSync(source).isFile()||path.dirname(out)!==root||!/^test-project-[A-Za-z0-9_-]+$/.test(path.basename(out))||fs.existsSync(out))throw Error('PRIVATE_SOURCE_AND_NEW_CLONE_REQUIRED');
if(!policyFile.startsWith(root+path.sep)||!fs.statSync(policyFile).isFile()||(fs.statSync(policyFile).mode&0o077)!==0)throw Error('TRUSTED_PRIVATE_POLICY_REQUIRED');
const h=JSON.parse(fs.readFileSync(policyFile,'utf8'));
if(!['technical-qa','private-reviewed'].includes(h.scope)||!h.registry||!Array.isArray(h.rulebook))throw Error('INVALID_TRUSTED_POLICY');
const hash=f=>execFileSync('sha256sum',[f],{encoding:'utf8'}).split(' ')[0],sha=hash(source);
const sourceProof=await probeMasterDirectorSource({sourcePath:source,boundHashes:{source:sha}});
if(sourceProof.status!=='SOURCE_CFR30_VERIFIED'){console.log(JSON.stringify({status:'BLOCKED_SOURCE_NEEDS_VERIFIED_CFR_DERIVATIVE',sourceProof}));process.exit(2)}
if(sourceProof.sourceDuration>600)throw Error('SOURCE_DURATION_LIMIT');
const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',source],{encoding:'utf8'}));
const v=probe.streams.find(s=>s.codec_type==='video');if(v.codec_name!=='h264'||!['yuv420p','yuvj420p'].includes(v.pix_fmt))throw Error('BROWSER_DECODABLE_H264_REQUIRED');
const duration=sourceProof.sourceDuration,scope=h.scope,registry=structuredClone(h.registry);
if(h.daedalManifest){
 const manifest=fs.realpathSync(h.daedalManifest.file);
 if(path.dirname(manifest)!==root||!fs.statSync(manifest).isFile()||(fs.statSync(manifest).mode&0o077)!==0||hash(manifest)!==h.daedalManifest.sha256)throw Error('DAEDAL_MANIFEST_CHANGED');
 const m=JSON.parse(fs.readFileSync(manifest,'utf8'));
 if(m.schema!=='sues-daedal-verified-library/v1'||!m.nativeAssets||!m.licensedAssets)throw Error('INVALID_DAEDAL_MANIFEST');
 h.assets={...h.assets,...m.nativeAssets};registry.licensedAssets={...registry.licensedAssets,...m.licensedAssets};
}

if(scope==='private-reviewed'){
 const rules=extractApprovedRules(fs.readFileSync(new URL('../../docs/SUES_MASTER_DIRECTOR_REGLAS_APROBADAS_20261104.md',import.meta.url),'utf8'));
 if(JSON.stringify(h.rulebook)!==JSON.stringify(rules)||JSON.stringify(registry.approvedRuleIds)!==JSON.stringify(rules.map(r=>r.id))||JSON.stringify(registry.requiredRuleKeys)!==JSON.stringify(rules.map(r=>r.key)))throw Error('CANONICAL_APPROVED_RULEBOOK_REQUIRED');
 const masters=registry.lockedMastersByMode?.['brand-sues'];
 if(!Array.isArray(masters)||masters.length!==3)throw Error('THREE_VERIFIED_BRAND_MASTERS_REQUIRED');
 for(const m of masters){
  const a=h.assets?.[m.sha256],rights=registry.licensedAssets?.[m.sha256];
  if(!a||rights?.rightsVerified!==true||rights?.commercialUseAllowed!==true||rights.sha256!==m.sha256||registry.masterHashes?.[m.id]!==m.sha256||!fs.realpathSync(a.file).startsWith(data+path.sep)||hash(a.file)!==m.sha256)throw Error('BRAND_MASTER_EVIDENCE_REQUIRED');
 }
}
fs.mkdirSync(out,{mode:0o700});fs.mkdirSync(out+'/media',{mode:0o700});
fs.symlinkSync(source,out+'/media/source.mp4');
// Extract authentic audio at the exact frame clock; no music or voice generation.
const voice=out+'/media/voice.wav';
execFileSync('ffmpeg',['-v','error','-nostdin','-i',source,'-map','0:a:0','-vn','-af','apad,atrim=duration='+duration,'-ar','48000','-ac','2','-c:a','pcm_s16le',voice],{timeout:180000});
if(hash(source)!==sha)throw Error('SOURCE_CHANGED_DURING_STAGE');
const roles={V9:'subject',V8:'captions',V7:'graphics',V6:'graphics',V5:'transition',V4:'subject',V3:'broll',V2:'broll',V1:'camera',A1:'voice',A2:'music',A3:'music',A4:'sfx',A5:'sfx'};
const project={name:'SUES private new recording · '+path.basename(out),revision:1,width:1080,height:1920,fps:30,background:'#000000',inPoint:0,outPoint:duration,tracks:Object.keys(roles).map(id=>({id,kind:id.startsWith('A')?'audio':'video'})),media:[{id:'source-video',kind:'video',name:'Original source',src:'/media/source.mp4',duration,width:v.width,height:v.height,fps:30,size:fs.statSync(source).size},{id:'source-voice',kind:'audio',name:'Original voice',src:'/media/voice.wav',duration,size:fs.statSync(voice).size}],clips:[{id:'base-camera',kind:'video',mediaId:'source-video',track:'V1',start:0,in:0,duration,props:{fit:'contain',scale:1,x:0,y:0,opacity:1,volume:0}},{id:'base-voice',kind:'audio',mediaId:'source-voice',track:'A1',start:0,in:0,duration,props:{volume:1,gain:0}}]};
const native=createRequire(import.meta.url)('/srv/sues-fablecut-next/app/project-ops.js');native.checkProject(project);
const fp=projectFingerprint(project),timeline=projectFingerprint({sourceSha256:sha,fps:30,duration,sourceTimeMap:[{sourceIn:0,sourceOut:duration,editIn:0}]});
registry.projectId=path.basename(out);registry.canvas={width:1080,height:1920};
// Prior video anchors are invalid for this source. Import only verified,
// source-bound reviewed word evidence; never fabricate a transcript.
registry.wordAnchors={};
const wordEvidence=h.wordEvidence;
if(wordEvidence?.sourceSha256===sha&&wordEvidence.humanReviewed===true&&Array.isArray(wordEvidence.words)){
 for(const [i,w] of wordEvidence.words.entries()){
  if(typeof w.text!=='string'||!w.text.trim()||!Number.isFinite(w.start)||!Number.isFinite(w.end)||w.start<0||w.end<=w.start||w.end>duration+1e-6)throw Error('INVALID_REVIEWED_WORD_EVIDENCE');
  registry.wordAnchors['word-'+i+'-span-0']={time:w.start,end:w.end,text:w.text};
 }
}
registry.rendererCapabilities={...registry.rendererCapabilities,native:[...new Set([...(registry.rendererCapabilities?.native??[]),'fablecut-command-exact-v1'])]};
const host={schema:'sues-private-story-host/v1',scope,sourceFile:source,sourceSha256:sha,nativeFingerprint:fp,timelineFingerprint:timeline,duration,nativeTrackRoles:roles,registry,rulebook:h.rulebook,assets:h.assets??{}};
fs.writeFileSync(out+'/project.json',JSON.stringify(project,null,2),{mode:0o600,flag:'wx'});fs.writeFileSync(out+'/host.json',JSON.stringify(host,null,2),{mode:0o600,flag:'wx'});
const report={schema:'sues-private-recording-stage/v1',status:'SOURCE_STAGED_NOT_APPROVED',sourceSha256:sha,voiceSha256:hash(voice),sourceProof,timelineFingerprint:timeline,nativeFingerprint:fp,sourceTimeMap:[{sourceIn:0,sourceOut:duration,editIn:0}],tracks:roles,wordAnchorCount:Object.keys(registry.wordAnchors).length,scope,requiredNext:'Review source and create canonical story; no edit approval yet'};
fs.writeFileSync(out+'/source-stage.json',JSON.stringify(report,null,2),{mode:0o600,flag:'wx'});console.log(JSON.stringify(report));
