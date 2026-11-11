/** Compare two historical, unapproved SUES master-story authorities with the
 * 49-operation native gap ledger. Never silently retime voice-synced titles or
 * substitute resource hashes. Not a master story importer.
 */
const fail=s=>{throw Error('Reel 158404 source reconciliation: '+s)};
const source='9e06f49c30731d8a57aed312cfb46281bcffb7b3d5d62bf5a2164333944ccaad';
const ms=n=>Math.round(n*1e6)/1000;
export function reconcileReel158404StorySources(ledger,story){
 if(ledger?.schema!=='sues-engine-next-gap-ledger/v1'||story?.schema!=='sues-master-story/v1'||
    ledger.sourceSha256!==source||story.sourceSha256!==source||
    ledger.sceneCount!==7||ledger.operationCount!==49||ledger.operations?.length!==49||
    story.operations?.length!==49||ledger.resources?.length!==10||story.resources?.length!==10||
    story.timeline?.fps!==30||story.timeline?.duration!==73.753467)
   fail('authoritative source, 49 operations, duration or inventory mismatch');
 const byId=new Map(),br=new Map();
 for(const op of story.operations){if(typeof op.id!=='string'||byId.has(op.id))fail('duplicate or missing story operation ID');byId.set(op.id,op)}
 for(const r of story.resources){if(typeof r.id!=='string'||br.has(r.id))fail('duplicate or missing story resource ID');br.set(r.id,r)}
 const conflicts=[],matchingIds=new Set();
 for(const op of ledger.operations){
   if(typeof op.operationId!=='string'||matchingIds.has(op.operationId))fail('duplicate ledger operation');
   const actual=byId.get(op.operationId);
   if(!actual||actual.sceneId!==op.sceneId||actual.track!==op.track||actual.effect!==op.effect)
      fail('cannot reconcile missing/changed story operation '+op.operationId);
   matchingIds.add(op.operationId);
   if(!Number.isFinite(actual.start)||!Number.isFinite(actual.end)||!Number.isFinite(op.start)||!Number.isFinite(op.end))
      fail('unverified operation time');
   if(Math.abs(actual.start-op.start)>1e-6||Math.abs(actual.end-op.end)>1e-6){
     conflicts.push({operationId:op.operationId,sceneId:op.sceneId,track:op.track,
       gapStart:op.start,gapEnd:op.end,storyStart:actual.start,storyEnd:actual.end,
       gapMinusStoryStartMs:ms(op.start-actual.start),gapMinusStoryEndMs:ms(op.end-actual.end),
       requiresAuthenticSpeechReview:op.track==='graphics'&&op.operationId.startsWith('title-'),
       allowAutomaticMerge:false});
   }
 }
 if(matchingIds.size!==49||byId.size!==49)fail('unknown extra operation or lost story ID');
 const assetConflicts=[],resIds=new Set();
 for(const r of ledger.resources){
  if(typeof r.id!=='string'||resIds.has(r.id))fail('duplicate ledger resource');resIds.add(r.id);
  const x=br.get(r.id);if(!x||r.kind!==x.kind||r.source!==x.source)fail('resource slot changed '+r.id);
  if((r.assetId||null)!==(x.assetId||null))assetConflicts.push({resourceId:r.id,gapAssetId:r.assetId||null,
     storyAssetId:x.assetId||null,requireVerifiedMediaSha:true,allowAutomaticSubstitution:false});
 }
 if(resIds.size!==10||br.size!==10)fail('resource slot count mismatch');
 const sceneOrder=['scene-01','scene-02','scene-03','scene-04','scene-05','scene-06','scene-07'];
 if(story.narrative?.scenes?.length!==7||sceneOrder.some((id,i)=>story.narrative.scenes[i]?.id!==id))fail('story scene order modified');
 const result={schema:'sues-reel158404-source-conflict-audit/v1',status:conflicts.length||assetConflicts.length?'REVIEW_REQUIRED_NOT_MERGED':'STRUCTURALLY_MATCHING_STILL_UNAPPROVED',
    sourceSha256:source,fullStoryFingerprint:story.timeline.fingerprint,
    ledgerOperationCount:49,storyOperationCount:49,matchingOperationIds:49,
    operationsWithIdenticalTiming:49-conflicts.length,timingConflicts:conflicts,
    assetSlots:10,assetsWithIdenticalId:10-assetConflicts.length,assetConflicts,
    automaticMergeAllowed:false,changesAppliedToNativeProject:false,
    creativeApproved:false,noTranscriptInferred:true,
    guidelines:['Conflicts are not automatically corrected from either historical file','Voice semantics and exact word boundaries must be checked before any title/speech-sensitive retiming','Only SHA-confirmed media may be promoted to native and only with rights/visual QA','Do not remove or invent any of the 49 operations']};
 return result;
}
