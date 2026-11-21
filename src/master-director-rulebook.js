// Resolves trusted, versioned master rules WITHOUT inferring approval or choosing by date.
// An unrecognized or conflicting rule stops execution: references are not brand defaults.
export const RULE_AUTHORITY=Object.freeze([
 'safety-and-rights','explicit-user-approval','locked-masters','project','profile','scene'
]);
const SCOPES=['global','brand','profile','project','scene','reference'];
const validId=x=>typeof x==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/.test(x);
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const issue=(issues,code,subject='rulebook')=>issues.push({code,subject});
const stable=value=>{
 if(Array.isArray(value))return '['+value.map(stable).join(',')+']';
 if(object(value))return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+stable(value[k])).join(',')+'}';
 return JSON.stringify(value);
};
const scopeMatches=(rule,c)=>{
 switch(rule.scope){
  case 'global': return true;
  case 'brand': return rule.scopeId===c.brandId;
  case 'profile':return rule.scopeId===c.profileId;
  case 'project':return rule.scopeId===c.projectId;
  case 'scene':return rule.scopeId===c.sceneId;
  case 'reference':return c.visualMode==='reference-exact'&&rule.scopeId===c.referenceId;
  default:return false;
 }
};

/** trustedIds MUST come from authenticated approval records, never from the creative brief. */
export function resolveMasterDirectorRules(rules,context={},trustedIds=[]){
 const issues=[],conflicts=[],selectedRules=[],ignored=[];
 if(!Array.isArray(rules)||!Array.isArray(trustedIds)||!Array.isArray(context.authorizedReferenceIds)){
  issue(issues,'RULEBOOK_INPUT_UNVERIFIED');
  return {status:'BLOCKED',issues,conflicts,selectedRules,ignored,unresolvedRuleConflicts:[]};
 }
 if(context.visualMode!=='brand-sues'&&context.visualMode!=='reference-exact')
  issue(issues,'VISUAL_MODE_INVALID');
 if(context.visualMode==='reference-exact'&&
    (!validId(context.referenceId)||!context.authorizedReferenceIds.includes(context.referenceId)))
  issue(issues,'REFERENCE_NOT_AUTHORIZED');
 const byId=new Map(),candidate=[];
 for(const r of rules){
  if(!object(r)||!validId(r.id)||byId.has(r.id)){
   issue(issues,'RULE_ID_DUPLICATE_OR_INVALID',r?.id??'unknown');continue;
  }
  byId.set(r.id,r);
  if(!validId(r.key)||!SCOPES.includes(r.scope)||!RULE_AUTHORITY.includes(r.authority)||
     (r.scope!=='global'&&!validId(r.scopeId))||
     !Object.hasOwn(r,'value')||r.value===undefined||r.value===null||
     !['approved','historical','draft','rejected'].includes(r.status)||
     !Array.isArray(r.supersedes)||!r.supersedes.every(validId)){
   issue(issues,'RULE_FIELDS_INVALID',r.id);continue;
  }
  if(r.status!=='approved'){ignored.push(r.id);continue;}
  if(!trustedIds.includes(r.id)){
   issue(issues,'APPROVAL_NOT_AUTHENTICATED',r.id);continue;
  }
  if(!scopeMatches(r,context)){ignored.push(r.id);continue;}
  candidate.push(r);
 }
 const byKey=new Map();
 for(const r of candidate){
  if(!byKey.has(r.key))byKey.set(r.key,[]);
  byKey.get(r.key).push(r);
 }
 for(const [key,items] of byKey){
  if(items.length===1){selectedRules.push(items[0]);continue;}
  const values=new Set(items.map(r=>stable(r.value)));
  if(values.size===1){
   const ranked=items.slice().sort((a,b)=>RULE_AUTHORITY.indexOf(a.authority)-RULE_AUTHORITY.indexOf(b.authority)||a.id.localeCompare(b.id));
   selectedRules.push(ranked[0]);continue;
  }
  // A conflicting value needs an EXPLICIT approved supersession chain; recency is insufficient.
  const supersedes=(winner,target,visited=new Set())=>{
   if(winner.id===target.id)return true;
   if(visited.has(winner.id))return false;
   visited.add(winner.id);
   for(const targetId of winner.supersedes){
    if(targetId===target.id)return true;
    const next=byId.get(targetId);
    if(next&&supersedes(next,target,new Set(visited)))return true;
   }
   return false;
  };
  const candidates=items.filter(r=>items.every(other=>{
   if(r.id===other.id)return true;
   if(other.authority==='safety-and-rights')return false;
   return RULE_AUTHORITY.indexOf(r.authority)<=RULE_AUTHORITY.indexOf(other.authority)&&
     supersedes(r,other);
  }));
  if(candidates.length!==1){
   conflicts.push({key,ruleIds:items.map(r=>r.id).sort(),reason:'unresolved contradictory rules'});
  }else selectedRules.push(candidates[0]);
 }
 selectedRules.sort((a,b)=>a.key.localeCompare(b.key)||a.id.localeCompare(b.id));
 return {status:issues.length||conflicts.length?'BLOCKED':'READY',
  issues,conflicts,selectedRules,ignored,
  unresolvedRuleConflicts:conflicts.map(x=>x.key)};
}
