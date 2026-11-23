// Run against the audited V17/V18 case in a throwaway directory on a trusted QA host.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync,spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {join,sep} from 'node:path';
import {MasterDirectorProjectStore} from '../../src/master-director-project-store.js';
import {DirectorApprovalLedger} from '../../src/engine-next/fablecut-director-approval-ledger.js';
import {createApprovedBatchService} from '../../src/engine-next/fablecut-approved-batch.js';
import {applyCommandBatch,prepareStoryBatch,projectFingerprint} from '../../src/engine-next/fablecut-command-batch.js';
import {planBoundRevisionRollback} from '../../src/engine-next/fablecut-bound-revision-patch.js';

const [dataRoot, destination, engineRoot, draft] = process.argv.slice(2);
const data = fs.realpathSync(dataRoot), out = fs.realpathSync(destination), engine = fs.realpathSync(engineRoot);
assert.ok(!out.startsWith(data+sep) && !data.startsWith(out+sep) && /^\/opt\/sues-video-setup\//.test(out));
assert.equal(fs.readdirSync(out).length,0);
const read = f => JSON.parse(fs.readFileSync(f,'utf8'));
const sha = f => execFileSync('sha256sum',[f],{encoding:'utf8'}).split(' ')[0];
const base = join(data,'test-project-039-v17'), target = join(data,'test-project-040-v18');
const baseFile = join(base,'project.json'), targetFile = join(target,'project.json');
const originals = [sha(baseFile),sha(targetFile)];
const before = read(baseFile), expected = read(targetFile), story = read(draft);
const native = createRequire(import.meta.url)(join(engine,'project-ops.js'));
const baseFingerprint = 'eefd306793bda63408d7f3c367ff043730d383bf4b10d9a620e4ddcc942215c7';
const expectedFingerprint = '316c4585e022567ebf284152b90f67d9b35b24dc688d1c368e064d49b542b7c1';
const storyFingerprint = 'a4220b5f5a7ff50556a6373860de1b128b0d56c11b70b2e5e66e54201a7dd001';
assert.equal(projectFingerprint(before),baseFingerprint);
assert.equal(projectFingerprint(expected),expectedFingerprint);
assert.equal(projectFingerprint(story),storyFingerprint);
fs.mkdirSync(join(out,'media'),{mode:0o700});
fs.symlinkSync(join(data,'..','library'),join(out,'library'));
fs.copyFileSync(baseFile,join(out,'project.json'),fs.constants.COPYFILE_EXCL);
for (const m of before.media.filter(m => m.src?.startsWith('/media/'))) {
 assert.equal(m.src.slice(7).includes('/'),false);
 fs.symlinkSync(fs.realpathSync(base+m.src),out+m.src);
}
const assets = new Map(story.resources.map(r => {
 const m = expected.media.find(m => m.id===r.assetId);
 assert.match(m.src,/^\/media\/[A-Za-z0-9_.-]+$/);
 const file = fs.realpathSync(target+m.src);
 assert.equal(sha(file),r.expectedSha256);
 // Temporary test authority for isolated comparisons with historically used bytes.
 // This is not a production rights registry or creative approval.
 return [r.assetId,{...m,file,sha256:r.expectedSha256,verifiedPhysical:true,
  rightsVerified:true,commercialUseAllowed:true}];
}));
const master = createHash('sha256').update('isolated-v18-technical-qa').digest('hex');
const registry = {
 brandId:'sues',profileId:'qa',projectId:'qa',sourceSha256:story.sourceSha256,
 timelineFingerprint:story.timeline.fingerprint,projectFingerprint:baseFingerprint,
 approvedRuleVersion:'rules-qa-v1',approvedRuleIds:['qa-rule'],requiredRuleKeys:['qa.scope'],
 approvedReferenceIds:[],masterHashes:{qa:master},lockedMastersByMode:{'brand-sues':[{id:'qa',sha256:master}]},
 unresolvedRuleConflicts:[],rendererCapabilities:{native:['fablecut-command-exact-v1']},
 licensedAssets:Object.fromEntries(assets),nativeTrackRoles:{V3:'graphics'},nativeMediaBindings:{},
 canvas:{width:before.width,height:before.height}
};
const rulebook = [{id:'qa-rule',key:'qa.scope',scope:'global',authority:'explicit-user-approval',
 status:'approved',value:'isolated-technical-only',supersedes:[]}];
const nativePatch = {storyFingerprint,baseFingerprint,expectedFingerprint};
const resolveAsset = id => assets.get(id);
const prepare = (s,r,n = nativePatch) => prepareStoryBatch(s,{
 registry:r,project:before,nativePatch:n,authorize:async()=>true});
const unbound = await prepare(story,registry,null);
assert.equal(unbound.status,'BLOCKED');
assert.equal(unbound.issues.length,10);
const missing = await prepare(story,{...registry,licensedAssets:{}});
assert.equal(missing.issues.filter(i => i.code==='LIBRARY_ASSET_UNVERIFIED').length,5);
const wrongTrack = await prepare(story,{...registry,nativeTrackRoles:{}});
assert.equal(wrongTrack.issues.filter(i => i.code==='NATIVE_REVISION_PATCH_INVALID').length,5);
const prepared = await prepare(story,registry);
assert.equal(prepared.status,'PREPARED_NOT_EXECUTED',JSON.stringify(prepared.issues));
nativePatch.commandsFingerprint = projectFingerprint(prepared.request.commands);
const altered = structuredClone(prepared.request);
altered.commands[0].patch.media.name += ' changed';
assert.throws(()=>applyCommandBatch(before,altered,{native,nativePatch,resolveAsset}),/REQUEST_UNBOUND/);
assert.throws(()=>applyCommandBatch(before,prepared.request,{native,nativePatch,resolveAsset:()=>null}),
 error=>error.message==='NATIVE_REVISION_PATCH_ASSET_UNVERIFIED'&&error.operationId===story.operations[0].id);

const call = (name,args) => new Promise((accept,reject)=>{
 const input = JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name,arguments:args}})+'\n';
 const child = spawn(process.execPath,[join(engine,'mcp-server.js')],{
  env:{...process.env,FABLECUT_DATA_DIR:out,FABLECUT_PORT:'17947',HOST:'127.0.0.1'},
  stdio:['pipe','pipe','ignore']});
 let settled = false;
 const finish = (error,value) => {
  if(settled) return;
  settled=true;
  clearTimeout(timeout);
  child.stdin.end();
  if(error){ child.kill();reject(error); } else accept(value);
 };
 const timeout = setTimeout(()=>finish(Error('QA_MCP_RESPONSE_TIMEOUT')),25000);
 let buffer = '';
 child.stdout.setEncoding('utf8').on('data',chunk=>{
  buffer += chunk;
  if(buffer.length>8000000) return finish(Error('QA_MCP_RESPONSE_TOO_LARGE'));
  let newline;
  while((newline=buffer.indexOf('\n'))>=0){
   const line=buffer.slice(0,newline);
   buffer=buffer.slice(newline+1);
   let message;
   try{message=JSON.parse(line);}catch(error){return finish(error);}
   if(message.id!==1) continue;
   const result=message.result;
   if(result?.isError||!result?.content?.[0]?.text)
    return finish(Error(result?.content?.[0]?.text??'Invalid MCP response'));
   return finish(null,result.content[0].text);
  }
 });
 child.once('error',finish);
 child.once('exit',()=>finish(Error('QA_MCP_EXITED')));
 child.stdin.once('error',finish);
 child.stdin.write(input);
});
const projectId = 'p_private_v18_chain_qa';
const readProject = async()=>({projectId,data:JSON.parse(await call('fablecut_get_project',{}))});
const store = new MasterDirectorProjectStore(out,async s => ({
 sourceSha256:story.sourceSha256,timelineFingerprint:story.timeline.fingerprint,duration:story.timeline.duration,
 registry,rulebook,nativePreflight:async(_plan,r)=>{
  const p = await prepare(s,r);
  if (p.status!=='PREPARED_NOT_EXECUTED') return p;
  applyCommandBatch(before,p.request,{native,nativePatch,resolveAsset});
  return {status:'READY_FOR_EDITOR_PREVIEW'};
 }
}));
const {revision} = store.saveDraft(story);
store.setCurrent(revision,null);
const review = await store.review(revision);
assert.equal(review.status,'READY_FOR_CHOICE',JSON.stringify(review.issues));
const decision = await store.decide(revision,review.fingerprint,'approve');
assert.ok(decision.decisionId);
const ledger = new DirectorApprovalLedger({directory:join(out,'approvals')});
let dispatches = 0;
let failStaging = true;
const service = createApprovedBatchService({
 ledger,resolveContext:async()=>({nativeProjectId:projectId,privateClone:true,store,
  nativeFingerprint:baseFingerprint,nativeTrackRoles:registry.nativeTrackRoles,nativeMediaBindings:{},nativePatch}),
 readProject,native,resolveAsset,
 stageAssets:async items=>{
  if(failStaging) throw Error('QA_SIMULATED_STAGE_FAILURE');
  for (const a of items) {
   assert.equal(sha(a.file),a.sha256);
   if (!fs.existsSync(out+a.src)) fs.symlinkSync(a.file,out+a.src);
   assert.equal(sha(out+a.src),a.sha256);
  }
 },invokeMcp:async(name,args)=>{
  dispatches++;
  await call(name,args);
  // Exercise a lost response after the native commit.
  throw Error('QA_SIMULATED_LOST_RESPONSE');
 }
});
const input = {actor:'qa-operator',projectId,storyRevision:revision,decisionId:decision.decisionId};
await assert.rejects(service.issue(input),/Verified exact batch approval required/);
const failedGrant = await service.issue(input,{verifiedHumanSession:true});
await assert.rejects(service.execute({...input,approvalId:failedGrant.approvalId}),/QA_SIMULATED_STAGE_FAILURE/);
assert.deepEqual((await readProject()).data,before);
assert.equal(dispatches,0);
failStaging=false;
await assert.rejects(service.execute({...input,approvalId:failedGrant.approvalId}),/APPROVAL_REQUIRED/);
const grant = await service.issue(input,{verifiedHumanSession:true});
const result = await service.execute({...input,approvalId:grant.approvalId});
assert.equal(result.receiptPersisted,true);
assert.deepEqual(result.receipts.map(r=>r.operationId),story.operations.map(o=>o.id));
assert.deepEqual((await readProject()).data,expected);
await assert.rejects(service.execute({...input,approvalId:grant.approvalId}),/NATIVE_BINDING_STALE/);
assert.equal(dispatches,1);
const disk = read(join(out,'approvals',grant.approvalId+'.result.json')).result;
assert.deepEqual(disk,result.receiptPersisted ? {
  revision:result.revision,receipts:result.receipts,undo:result.undo
} : null);
const rollback = planBoundRevisionRollback(expected,disk.undo,native);
assert.match(await call('fablecut_patch_project',{baseRevision:rollback.baseRevision,ops:rollback.ops}),/revision 24/);
const restored = (await readProject()).data;
assert.deepEqual(restored,{...before,revision:24});
assert.throws(()=>planBoundRevisionRollback(restored,disk.undo,native),/STALE_UNDO/);
assert.deepEqual([sha(baseFile),sha(targetFile)],originals);
const proof = {technicalQAOnly:true,revision,matchedResult:expectedFingerprint,operations:disk.receipts,
 deniedUnbound:unbound.issues,deniedUnverifiedResources:missing.issues,deniedWrongTrack:wrongTrack.issues,
 restoredRevision:restored.revision,dispatches,failedStagingPreservedBase:true,lostResponseReconciled:true};
fs.writeFileSync(join(out,'chain-proof.json'),JSON.stringify(proof,null,2)+'\n',{mode:0o600,flag:'wx'});
console.log(JSON.stringify({revision,operations:disk.receipts.length,restoredRevision:restored.revision,
 dispatches,failedStagingPreservedBase:true,lostResponseReconciled:true}));
