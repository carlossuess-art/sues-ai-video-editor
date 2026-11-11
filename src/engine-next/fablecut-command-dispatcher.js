// Private host integration: native MCP, CAS, authorization, audit and readback.
// This is not an HTTP route and must not be exposed without the existing
// authenticated approval ledger and an independently verified project binding.
import {applyCommandBatch,projectFingerprint} from './fablecut-command-batch.js';
export async function dispatchCommandBatch({projectId,approvalId,request},{authorize,readProject,invokeMcp,audit,native,resolveAsset,stageAssets}={}){
 if(![authorize,readProject,invokeMcp,audit,stageAssets].every(x=>typeof x==='function')||typeof projectId!=='string'||typeof approvalId!=='string')throw Error('TRUSTED_HOST_REQUIRED');
 const before=await readProject();if(before.projectId!==projectId)throw Error('PROJECT_ID_MISMATCH');
 const predicted=applyCommandBatch(before.data,request,{native,resolveAsset});
 const proof={projectId,approvalId,baseRevision:request.baseRevision,baseFingerprint:request.baseFingerprint,requestFingerprint:projectFingerprint(request)};
 if(await authorize(proof)!==true)throw Error('APPROVAL_REQUIRED');
 await audit({...proof,stage:'approved-before-dispatch',operationIds:predicted.receipts.map(r=>r.operationId)});
 await stageAssets(predicted.assets); // Host validates bytes, paths and rights; no arbitrary uploads.
 const current=await readProject();
 if(current.projectId!==projectId||projectFingerprint(current.data)!==request.baseFingerprint)throw Error('PROJECT_CHANGED_BEFORE_DISPATCH');
 let result;try{result=await invokeMcp('fablecut_patch_project',{baseRevision:request.baseRevision,ops:predicted.patchOps})}
 catch(e){await audit({...proof,stage:'dispatch-failed',reason:String(e.message).slice(0,250)});throw e}
 const after=await readProject();
 const verified=typeof result==='string'&&result.includes('Patched (revision '+(request.baseRevision+1)+')')&&after.projectId===projectId&&projectFingerprint(after.data)===projectFingerprint(predicted.project);
 await audit({...proof,stage:verified?'committed-verified':'unverified-do-not-retry',revision:after.data?.revision});
 if(!verified)throw Error('NATIVE_READBACK_MISMATCH_DO_NOT_RETRY');
 return {revision:after.data.revision,receipts:predicted.receipts.map(r=>({...r,status:'MCP_COMMITTED_READBACK_VERIFIED_NOT_RENDERED'})),undo:predicted.undo};
}
