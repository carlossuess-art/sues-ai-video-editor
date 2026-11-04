// Trusted, read-only adapter from the editor's current files to Master Director.
// The policy is provisioned offline by the administrator, never by an HTTP request.
import {readFileSync,lstatSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {extractApprovedRules} from './master-director-policy-builder.js';
const SHA=/^[a-f0-9]{64}$/;
const ID=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/;
const native=['caption-edit','caption-hide','caption-emphasis','zoom-native','broll-fullframe',
 'sfx-one-shot','music-full-video','transition-native','card-grid-native','motion-catalog-native',
 'overlay-native-default','image-native-auto','voice-preset-native','voice-level-native',
 'audio-levels-native','mastering-native'];
const sha=x=>createHash('sha256').update(x).digest('hex');
const safeId=x=>typeof x==='string'&&ID.test(x);
export function createMasterDirectorContextProvider(directory){
 const policyPath=join(directory,'master-director-policy.json');
 return async({jobId,job,project,assets,catalog,story})=>{
  let policy;
  try{
   const st=lstatSync(policyPath);
   // Root / same-service managed file, never group/world writable or a symlink.
   if(!st.isFile()||st.isSymbolicLink()||st.size>256000||(st.mode&0o022)!==0)return null;
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
  const licensedAssets={},masters=[],masterHashes={};
  const wanted=new Set([...policy.masters.map(m=>m?.assetId),...(Array.isArray(story?.resources)?story.resources:[]).filter(r=>r?.source==='library').map(r=>r.assetId)]);
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
   brandId:'sues',profileId:job.settings?.styleId==='SUES_DOPAMIN'?'DOPAMIN':'CALMA',projectId:jobId,
   approvedRuleVersion:policy.version,approvedRuleIds:ids,requiredRuleKeys:keys,
   approvedReferenceIds:policy.approvedReferenceIds,masterHashes,
   lockedMastersByMode:{'brand-sues':masters,'reference-exact':masters},
   rendererCapabilities:{native,remotion:['text','image-exact','audio-clip-exact']},licensedAssets,generatedAssets:{},wordAnchors,
   frameEvidence:{},maskEvidence:{},canvas:{width:1080,height:1920},verifiedFonts
  }};
 };
}
