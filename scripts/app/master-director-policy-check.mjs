// Offline and read-only. Policy output, when requested, stays on stdout.
import {readFileSync} from 'node:fs';
import {inspectMasterPolicyCandidates} from '../../src/master-director-policy-inspection.js';
const args=process.argv.slice(2),emit=args[0]==='--emit-policy';
if(emit)args.shift();
if(args.length!==4){console.error('Uso: node scripts/app/master-director-policy-check.mjs [--emit-policy] /ruta/absoluta/assets ID1 ID2 ID3');process.exitCode=2;}
else try{
 const [directory,...ids]=args;
 const policy=inspectMasterPolicyCandidates({directory,masters:ids.map(assetId=>({assetId})),approvedRulesText:readFileSync(new URL('../../docs/SUES_MASTER_DIRECTOR_REGLAS_APROBADAS_20261104.md',import.meta.url),'utf8')});
 console.log(JSON.stringify(emit?policy:{status:'READY_FOR_INDEPENDENT_REVIEW',rules:policy.rulebook.length,masters:policy.masters.length,policyVersion:policy.version,warning:'Metadata claims require independent verification; nothing was written or deployed.'}));
}catch(error){console.error('Bloqueado: '+error.message);process.exitCode=1;}
