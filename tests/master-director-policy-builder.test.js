import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildMasterDirectorPolicy} from '../src/master-director-policy-builder.js';
const text=readFileSync(new URL('../docs/SUES_MASTER_DIRECTOR_REGLAS_APROBADAS_20261104.md',import.meta.url),'utf8');
const masters=['a','b','c'].map(x=>({assetId:x.repeat(64)}));
const assets={resolve:sha256=>({sha256}),metadata:()=>({approvedForProduction:true,license:{rightsStatus:'verified',commercialUseAllowed:true,proofRef:'verified'},testReportRef:'verified'})};
test('approved rulebook remains complete, literal and linked to three verified masters',()=>{
 const p=buildMasterDirectorPolicy({approvedRulesText:text,masters,assets});
 assert.equal(p.rulebook.length,20);assert.equal(p.masters.length,3);
 assert.ok(p.rulebook[0].value.includes('Comprender la historia completa'));
 assert.ok(p.rulebook[19].value.includes('Dos modos'));
 assert.equal(p.requiredRuleKeys.length,20);assert.equal(p.approvedRuleSourceSha256.length,64);
});
test('does not create policy from a partial rulebook or unverified masters',()=>{
 assert.throws(()=>buildMasterDirectorPolicy({approvedRulesText:text.replace('20. **Dos modos','21. **Dos modos'),masters,assets}),/20 ordered/);
 assert.throws(()=>buildMasterDirectorPolicy({approvedRulesText:text,masters:masters.slice(0,2),assets}),/Three distinct/);
 assert.throws(()=>buildMasterDirectorPolicy({approvedRulesText:text,masters,assets:{...assets,metadata:()=>null}}),/evidence/);
});
