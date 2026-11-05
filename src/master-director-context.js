// Trusted, read-only adapter from the editor's current files to Master Director.
// The policy is provisioned offline by the administrator, never by an HTTP request.
import {readFileSync,lstatSync} from 'node:fs';
import {dirname,isAbsolute,join,parse,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {extractApprovedRules} from './master-director-policy-builder.js';
const SHA=/^[a-f0-9]{64}$/;
const ID=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/;
const native=['caption-edit','caption-hide','caption-emphasis','zoom-native','broll-fullframe',
 'sfx-one-shot','music-full-video','transition-native','card-grid-native','motion-catalog-native',
 'overlay-native-default','image-native-auto','elements-native','voice-preset-native','voice-level-native',
 'audio-levels-native','mastering-native'];
const sha=x=>createHash('sha256').update(x).digest('hex');
const safeId=x=>typeof x==='string'&&ID.test(x);
export function createMasterDirectorContextProvider(directory){
 const policyPath=join(directory,'master-director-policy.json');
 return async({jobId,job,project,assets,catalog,story})=>{
  let policy;
  try{
   // Both the file and its parent chain must be controlled by the service or root.
   // A writable non-sticky parent permits a trusted file to be replaced.
   if(!isAbsolute(policyPath)||resolve(policyPath)!==policyPath)return null;
   const uid=typeof process.getuid==='function'?process.getuid():null;
   for(let dir=dirname(policyPath);;dir=dirname(dir)){
    const parent=lstatSync(dir);
    if(!parent.isDirectory()||parent.isSymbolicLink()||
       (uid!==null&&parent.uid!==0&&parent.uid!==uid)||
       ((parent.mode&0o022)!==0&&(parent.mode&0o1000)===0))return null;
    if(dir===parse(dir).root)break;
   }
   const st=lstatSync(policyPath);
   if(!st.isFile()||st.isSymbolicLink()||st.size>256000||(st.mode&0o022)!==0||
      (uid!==null&&st.uid!==0&&st.uid!==uid))return null;
   policy=JSON.parse(readFileSync(policyPath,'utf8'));
  }catch{return null;}
  const ids=policy?.approvedRuleIds,keys=policy?.requiredRuleKeys,rules=policy?.rulebook;
  if(policy?.schema!=='sues-master-policy/v1'||!safeId(policy.version)||
     !Array.isArray(ids)||ids.length!==20||new Set(ids).size!==20||!ids.every(safeId)||
     !Array.isArray(keys)||keys.length!==20||new Set(keys).size!==20||!keys.every(safeId)||
     !Array.isArray(rules)||rules.length!==20||!Array.isArray(policy.masters)||policy.masters.length!==3||
     new Set(policy.masters.map(m=>m?.assetId)).size!==3||
     !Array.isArray(policy.approvedReferenceIds)||!policy.approvedReferenceIds.every(safeId))return null;
  try{
   const source=readFileSync(new URL('../docs/SUES_MASTER_DIRECTOR_REGLAS_APROBADAS_20261104.md',import.meta.url),'utf8');
   const canonical=extractApprovedRules(source);
   if(policy.approvedRuleSourceSha256!==sha(source)||JSON.stringify(rules)!==JSON.stringify(canonical)||
      JSON.stringify(ids)!==JSON.stringify(canonical.map(r=>r.id))||JSON.stringify(keys)!==JSON.stringify(canonical.map(r=>r.key)))return null;
  }catch{return null;}
  // Do not silently reinterpret other editor styles as CALMA.
  const style=job.settings?.styleId??'SUES_CALMA';
  const profileId=style==='SUES_CALMA'?'CALMA':style==='SUES_DOPAMIN'?'DOPAMIN':null;
  if(!profileId)return {blockedIssues:[{code:'MASTER_PROFILE_NOT_SUPPORTED',subject:String(style)}]};
  const licensedAssets={},masters=[],masterHashes={},maskEvidence={};
  // Optional attestations are administrator-owned server policy, never supplied
  // by a plan. Scope every proof to this source and current edited timeline.
  const requestedMasks=new Set((Array.isArray(story?.operations)?story.operations:[])
   .map(op=>op?.parameters?.visual?.mask?.proofId).filter(safeId));
  if(policy.maskEvidence!==undefined&&!Array.isArray(policy.maskEvidence))return null;
  const availableMasks=policy.maskEvidence??[];
  if(availableMasks.length>300||new Set(availableMasks.map(m=>m?.id)).size!==availableMasks.length)return null;
  const maskAssets=[];
  for(const id of requestedMasks){
   const proof=availableMasks.find(m=>m?.id===id);if(!proof)continue;
   if(proof.verified!==true||proof.sourceSha256!==catalog.sourceSha256||
      proof.timelineFingerprint!==catalog.timelineFingerprint||typeof proof.evidenceRef!=='string'||!proof.evidenceRef.trim()||
      !Number.isFinite(proof.start)||!Number.isFinite(proof.end)||proof.start<0||proof.end<=proof.start)
    return {blockedIssues:[{code:'MASK_POLICY_EVIDENCE_INVALID',subject:id}]};
   if(Array.isArray(proof.frameAssetIds)){
    if(proof.coordinateSpace!=='layer'||proof.fps!==30||!Number.isInteger(proof.startFrame)||!Number.isInteger(proof.endFrame)||
       proof.startFrame<0||proof.endFrame<=proof.startFrame||proof.endFrame-proof.startFrame>120||
       proof.frameAssetIds.length!==proof.endFrame-proof.startFrame||!proof.frameAssetIds.every(x=>SHA.test(x??''))||
       Math.abs(proof.start-proof.startFrame/30)>1e-6||Math.abs(proof.end-proof.endFrame/30)>1e-6)
     return {blockedIssues:[{code:'MASK_POLICY_EVIDENCE_INVALID',subject:id}]};
    maskAssets.push(...proof.frameAssetIds);
   }else{
    if(!SHA.test(proof.assetId??''))return {blockedIssues:[{code:'MASK_POLICY_EVIDENCE_INVALID',subject:id}]};
    maskAssets.push(proof.assetId);
   }
   maskEvidence[id]=structuredClone(proof);
  }
  const wanted=new Set([...policy.masters.map(m=>m?.assetId),...maskAssets,...(Array.isArray(story?.resources)?story.resources:[]).filter(r=>r?.source==='library').map(r=>r.assetId)]);
  for(const id of wanted){
   if(!SHA.test(id??''))return null;
   try{
    // resolve rehashes bytes and metadata verifies identity against the record.
    const a=assets.resolve(id),m=assets.metadata(id);
    if(!m||m.approvedForProduction!==true||m.license?.rightsStatus!=='verified'||
       m.license.commercialUseAllowed!==true||!m.license.proofRef||!m.testReportRef)
      return {blockedIssues:[{code:'ASSET_EVIDENCE_MISSING',subject:id}]};
    licensedAssets[id]={sha256:id,rightsVerified:true,commercialUseAllowed:true,title:a.title,
     kind:a.kind,duration:a.duration??null,origin:'editor-private-library',version:id};
   }catch{return {blockedIssues:[{code:'ASSET_UNAVAILABLE_OR_CHANGED',subject:id}]};}
  }
  for(const m of policy.masters){
   if(!safeId(m.id)||!SHA.test(m.assetId??'')||!licensedAssets[m.assetId]||masterHashes[m.id])return null;
   masterHashes[m.id]=m.assetId;masters.push({id:m.id,sha256:m.assetId});
  }
  // Use only entire words surviving in each edit segment. Repeated source
  // spans receive distinct IDs; no guessed position for a cut-off word.
  const wordAnchors={};
  const words=project?.inputs?.transcript?.words,spans=catalog?.sourceTimeMap?.spans;
  if(Array.isArray(words)&&Array.isArray(spans))for(let i=0;i<words.length;i++){
   const w=words[i];if(!Number.isFinite(w?.start)||!Number.isFinite(w?.end)||w.end<=w.start)continue;
   for(let j=0;j<spans.length;j++){
    const s=spans[j];if(w.start>=s.sourceIn&&w.end<=s.sourceOut){
     wordAnchors['word-'+i+'-span-'+j]={time:s.editIn+w.start-s.sourceIn,text:String(w.text??'')};
    }
   }
  }
  const verifiedFonts={};
  for(const [family,weight,file] of [['Montserrat',400,'Montserrat-Regular.ttf'],['Montserrat',700,'Montserrat-Bold.ttf'],['Montserrat ExtraBold',800,'Montserrat-ExtraBold.ttf'],['Anton',400,'Anton-Regular.ttf'],['Allerta Stencil',400,'AllertaStencil-Regular.ttf']]){
   const digest=project?.fontHashes?.[file];if(SHA.test(digest??''))verifiedFonts[family+':'+weight]={sha256:digest,file};
  }
  return {rulebook:policy.rulebook,registry:{
   brandId:'sues',profileId,projectId:jobId,
   approvedRuleVersion:policy.version,approvedRuleIds:ids,requiredRuleKeys:keys,
   approvedReferenceIds:policy.approvedReferenceIds,masterHashes,
   lockedMastersByMode:{'brand-sues':masters,'reference-exact':masters},
   rendererCapabilities:{native,remotion:['text','image-exact','video-exact','audio-clip-exact']},licensedAssets,generatedAssets:{},wordAnchors,
   arcPolicy:'reel-observed-v2',frameEvidence:{},maskEvidence,canvas:{width:1080,height:1920},verifiedFonts
  }};
 };
}
