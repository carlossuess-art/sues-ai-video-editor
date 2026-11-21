import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,readdirSync,rmSync,symlinkSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {inspectMasterPolicyCandidates} from '../src/master-director-policy-inspection.js';
const rules=readFileSync(new URL('../docs/SUES_MASTER_DIRECTOR_REGLAS_APROBADAS_20261104.md',import.meta.url),'utf8');
function fixture(){
 const directory=mkdtempSync(join(tmpdir(),'sues-policy-inspect-'));mkdirSync(join(directory,'metadata-v2'));
 const masters=['one','two','three'].map(content=>{
  const id=createHash('sha256').update(content).digest('hex');
  writeFileSync(join(directory,id+'.media'),content);
  writeFileSync(join(directory,id+'.json'),JSON.stringify({id,kind:'image',rights:'owned',bytes:content.length,title:'test'}));
  writeFileSync(join(directory,'metadata-v2',id+'.json'),JSON.stringify({schemaVersion:'sues-asset-metadata/v2',assetId:id,sha256:id,kind:'image',lifecycle:'approved',origin:'test-fixture',license:{rightsStatus:'verified',commercialUseAllowed:true,proofRef:'fixture'},semantics:{narrativeRoles:[],emotionTags:[],profileCompatibility:['DOPAMIN','CALMA']},constraints:{requiredCapabilities:[],faceExclusion:false},approvedForProduction:true,testReportRef:'fixture'}));
  return {assetId:id};
 });return {directory,masters};
}
test('policy inspection is read-only and uses validated content-bound metadata',()=>{
 const f=fixture();try{
  const before=readdirSync(f.directory).sort();const p=inspectMasterPolicyCandidates({...f,approvedRulesText:rules});
  assert.equal(p.rulebook.length,20);assert.equal(p.masters.length,3);assert.deepEqual(readdirSync(f.directory).sort(),before);
  writeFileSync(join(f.directory,f.masters[0].assetId+'.media'),'tampered');
  assert.throws(()=>inspectMasterPolicyCandidates({...f,approvedRulesText:rules}),/integrity/);
 }finally{rmSync(f.directory,{recursive:true,force:true});}
});
test('missing evidence and symlinked media fail closed',()=>{
 const f=fixture();try{
  const id=f.masters[0].assetId,meta=join(f.directory,'metadata-v2',id+'.json');
  const m=JSON.parse(readFileSync(meta,'utf8'));m.approvedForProduction=false;writeFileSync(meta,JSON.stringify(m));
  assert.throws(()=>inspectMasterPolicyCandidates({...f,approvedRulesText:rules}),/evidence/);
  m.approvedForProduction=true;writeFileSync(meta,JSON.stringify(m));const media=join(f.directory,id+'.media');rmSync(media);symlinkSync(join(f.directory,f.masters[1].assetId+'.media'),media);
  assert.throws(()=>inspectMasterPolicyCandidates({...f,approvedRulesText:rules}),/unavailable/);
 }finally{rmSync(f.directory,{recursive:true,force:true});}
});
test('inspection CLI emits only summary by default and does not create a policy',()=>{
 const f=fixture();try{
  const cmd=spawnSync(process.execPath,['scripts/app/master-director-policy-check.mjs',f.directory,...f.masters.map(m=>m.assetId)],{encoding:'utf8'});
  assert.equal(cmd.status,0,cmd.stderr);const result=JSON.parse(cmd.stdout);assert.equal(result.status,'READY_FOR_INDEPENDENT_REVIEW');assert.equal(result.rules,20);
  assert.ok(!cmd.stdout.includes('proofRef'));assert.ok(!readdirSync(f.directory).includes('master-director-policy.json'));
 }finally{rmSync(f.directory,{recursive:true,force:true});}
});
