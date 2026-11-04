// Offline policy construction from Carlos' approved text and authenticated media
// records. This module does not write a policy or assign unverified masters.
import {createHash} from 'node:crypto';
const HASH=/^[a-f0-9]{64}$/;
export function extractApprovedRules(approvedRulesText){
 if(typeof approvedRulesText!=='string'||!approvedRulesText.includes('Las 20 reglas aprobadas en conversación'))
  throw Error('Approved rulebook required');
 const content=approvedRulesText.split('## Las 20 reglas aprobadas')[1]?.split('## Estructura narrativa habitual aprobada')[0];
 if(!content)throw Error('Approved rule sections missing');
 const matches=[...content.matchAll(/^([0-9]{2})\.\s+(.+?)(?=\n\n|$)/gm)];
 if(matches.length!==20||matches.some((m,i)=>Number(m[1])!==i+1))throw Error('All 20 ordered rules required');
 return matches.map((m,i)=>({id:'approved-rule-'+String(i+1).padStart(2,'0'),
  key:'approved.rule.'+String(i+1).padStart(2,'0'),scope:'global',authority:'explicit-user-approval',
  status:'approved',value:m[2],supersedes:[]}));
}
export function buildMasterDirectorPolicy({approvedRulesText,masters,assets}={}){
 const rulebook=extractApprovedRules(approvedRulesText);
 if(!Array.isArray(masters)||masters.length!==3||new Set(masters.map(x=>x?.assetId)).size!==3)
  throw Error('Three distinct verified brand masters required');
 const checked=masters.map((m,i)=>{
  if(!HASH.test(m?.assetId??''))throw Error('Invalid master resource ID');
  const resource=assets.resolve(m.assetId),metadata=assets.metadata(m.assetId);
  if(resource.sha256!==m.assetId||metadata?.approvedForProduction!==true||
     metadata.license?.rightsStatus!=='verified'||metadata.license.commercialUseAllowed!==true||
     !metadata.license.proofRef||!metadata.testReportRef)throw Error('Master resource evidence missing');
  return {id:'sues-tapiz-'+(i+1),assetId:m.assetId};
 });
 return {schema:'sues-master-policy/v1',version:'rules-approved-20261104',
  approvedRuleSourceSha256:createHash('sha256').update(approvedRulesText).digest('hex'),
  approvedRuleIds:rulebook.map(r=>r.id),requiredRuleKeys:rulebook.map(r=>r.key),
  approvedReferenceIds:[],masters:checked,rulebook};
}
