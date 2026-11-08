import test from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,rmSync,readFileSync,statSync} from 'node:fs';
import {tmpdir} from 'node:os';import {join} from 'node:path';
import {DirectorApprovalLedger} from '../../src/engine-next/fablecut-director-approval-ledger.js';
import {dispatchDirectorNativeTransform} from '../../src/engine-next/fablecut-director-dispatcher.js';
const request={actor:'carlos.sues',projectId:'p_3c0550a1dd',revision:54,clipId:'child',x:311,y:0,scale:.65};
const withLedger=async fn=>{const dir=mkdtempSync(join(tmpdir(),'sues-director-ledger-'));try{await fn(dir);}finally{rmSync(dir,{recursive:true,force:true});}};
test('requires verified human to issue and binds exact project/clip/coordinates/revision',async()=>withLedger(dir=>{
 const l=new DirectorApprovalLedger({directory:dir,now:()=>1000000});
 assert.throws(()=>l.issue(request),/Verified/);
 const {approvalId}=l.issue(request,{verifiedHumanSession:true});
 assert.equal(statSync(join(dir,approvalId+'.json')).mode&0o777,0o600);
 assert.equal(l.consume({...request,approvalId,x:312}),false);
 assert.equal(l.consume({...request,approvalId,revision:55}),false);
 assert.equal(l.consume({...request,approvalId,projectId:'p_other'}),false);
 assert.equal(l.consume({...request,approvalId}),true);
 assert.equal(l.consume({...request,approvalId}),false);
}));
test('approval expires, is one-use and remains consumed across a restarted ledger',async()=>withLedger(dir=>{
 let now=1000000;let l=new DirectorApprovalLedger({directory:dir,now:()=>now,ttlMs:2000});
 const id=l.issue(request,{verifiedHumanSession:true}).approvalId;
 now+=3000;assert.equal(l.consume({...request,approvalId:id}),false);
 const second=l.issue(request,{verifiedHumanSession:true}).approvalId;
 assert.equal(l.consume({...request,approvalId:second}),true);
 l=new DirectorApprovalLedger({directory:dir,now:()=>now});
 assert.equal(l.consume({...request,approvalId:second}),false);
}));
test('persistent approval and audit support native dispatcher with only one invocation',async()=>withLedger(async dir=>{
 const l=new DirectorApprovalLedger({directory:dir,now:()=>2000000}),issued=l.issue(request,{verifiedHumanSession:true});
 let rev=54,called=0;const clip={id:'child',kind:'image',track:'V2',disabled:true,props:{x:300,y:0,scale:.65}};
 const dep={authorize:async({approvalId,...info})=>l.consume({...request,...info,approvalId}),audit:async row=>l.audit(row),
 readProject:async()=>({projectId:request.projectId,data:{revision:rev,tracks:[{id:'V1'},{id:'V2'}],clips:[{id:'source',kind:'video',locked:true,track:'V1',props:{}},clip]}}),
 invokeMcp:async(tool,args)=>{assert.equal(tool,'fablecut_patch_project');called++;rev++;Object.assign(clip.props,args.ops[0].set.props);return 'Patched (revision 55): moved child';}};
 const out=await dispatchDirectorNativeTransform({...request,approvalId:issued.approvalId},dep);
 assert.equal(out.ok,true);assert.equal(called,1);
 await assert.rejects(dispatchDirectorNativeTransform({...request,approvalId:issued.approvalId},dep),e=>e.code==='FORBIDDEN');
 assert.equal(called,1);
 const stages=readFileSync(join(dir,'dispatch-audit.jsonl'),'utf8').trim().split('\n').map(JSON.parse).map(x=>x.stage);
 assert.deepEqual(stages,['approved-before-dispatch','committed-verified']);
}));

test('revocation is durable, actor-scoped and races safely with consumption',async()=>withLedger(dir=>{
 const l=new DirectorApprovalLedger({directory:dir,now:()=>3000000});
 const first=l.issue(request,{verifiedHumanSession:true}).approvalId;
 assert.equal(l.revoke({approvalId:first,actor:'other.admin'}),false);
 assert.equal(l.revoke({approvalId:first,actor:request.actor}),true);
 assert.equal(l.revoke({approvalId:first,actor:request.actor}),false);
 assert.equal(l.consume({...request,approvalId:first}),false);
 const reopened=new DirectorApprovalLedger({directory:dir,now:()=>3000000});
 assert.equal(reopened.consume({...request,approvalId:first}),false);
 const second=l.issue(request,{verifiedHumanSession:true}).approvalId;
 assert.equal(l.consume({...request,approvalId:second}),true);
 assert.equal(l.revoke({approvalId:second,actor:request.actor}),false);
 assert.equal(l.revoke({approvalId:'../invalid',actor:request.actor}),false);
}));

test('approval with creative fingerprint cannot be consumed under a substituted plan',async()=>withLedger(dir=>{
 const l=new DirectorApprovalLedger({directory:dir,now:()=>1000000});
 const proof={storyRevision:'a'.repeat(64),decisionId:'b'.repeat(64),operationId:'move-child',planFingerprint:'c'.repeat(64),projectFingerprint:'d'.repeat(64)};
 const issued=l.issue({...request,planProof:proof},{verifiedHumanSession:true});
 assert.equal(l.consume({...request,approvalId:issued.approvalId}),false);
 assert.equal(l.consume({...request,approvalId:issued.approvalId,planProof:{...proof,planFingerprint:'e'.repeat(64)}}),false);
 assert.equal(l.consume({...request,approvalId:issued.approvalId,planProof:proof}),true);
}));
