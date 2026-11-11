// Read-only supervisor bridge for the canonical private FableCut runner.
// Technical evidence and reviewer declarations are NOT automatic artistic approval.
const HASH=/^[a-f0-9]{64}$/;
const ID=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/;
const QA=new Set(['rendered-frame','motion-playback','audio-playback','time-sync','narrative-review']);
const GLOBAL=['full-playback','narrative','source-continuity','face-and-safe-zones','captions-and-sync','music-and-sfx','no-interference'];
const COMMITTED='MCP_COMMITTED_READBACK_VERIFIED_NOT_RENDERED';
const RENDERED='TECHNICAL_QA_PASS_NOT_ARTISTIC_APPROVAL';
const fail=code=>{throw Error(code)};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const hash=x=>typeof x==='string'&&HASH.test(x);
const validId=x=>typeof x==='string'&&ID.test(x);
const nonblank=x=>typeof x==='string'&&x.trim().length>0&&x.length<=4000;
const frame=(t,fps)=>{const n=Math.round(t*fps);if(typeof t!=='number'||!Number.isFinite(t)||Math.abs(t*fps-n)>1e-4)fail('SUPERVISOR_FRAME_ALIGNMENT');return n};

// Set equality, not count equality. This protects the approved batch and QA.
export function assertStoryOperationCoverage(operations,receipts,code='STORY_OPERATION_COVERAGE_MISMATCH'){
 if(!Array.isArray(operations)||!Array.isArray(receipts)||!operations.length||operations.length!==receipts.length)fail(code);
 const expected=new Set(operations.map(o=>o?.id)),actual=new Set(receipts.map(r=>r?.operationId));
 if(expected.size!==operations.length||actual.size!==receipts.length||[...expected].some(id=>!validId(id)||!actual.has(id)))fail(code);
 return true;
}

// Build the existing supervisor's evidence graph from the exact native result.
// All bindings originate in the trusted host, never in a client's review report.
export function buildNativeSupervisorGraph({story,execution,render,projectFingerprint,outputSha256}={}){
 if(story?.schema!=='sues-master-story/v1'||story.timeline?.fps!==30||!hash(story.sourceSha256)||!nonblank(story.timeline?.fingerprint)||
    !Array.isArray(story.operations)||!story.operations.length||story.operations.length>100||
    execution?.schema!=='sues-private-story-execution/v1'||render?.schema!=='sues-private-story-render/v1'||render.status!==RENDERED||
    !['technical-qa','private-reviewed'].includes(execution.scope)||render.scope!==execution.scope||!hash(execution.storyRevision)||
    !hash(execution.decisionId)||!hash(execution.planFingerprint)||!hash(projectFingerprint)||execution.projectFingerprint!==projectFingerprint||
    render.projectFingerprint!==projectFingerprint||render.storyRevision!==execution.storyRevision||render.decisionId!==execution.decisionId||
    render.planFingerprint!==execution.planFingerprint||execution.sourceSha256!==story.sourceSha256||render.sourceSha256!==story.sourceSha256||
    execution.timelineFingerprint!==story.timeline.fingerprint||render.timelineFingerprint!==story.timeline.fingerprint||
    !hash(outputSha256)||render.sha256!==outputSha256||render.renderCopyParity!==true||execution.result?.receiptPersisted!==true)
  fail('SUPERVISOR_BINDING_MISMATCH');
 const durationFrames=frame(story.timeline.duration,30);
 if(durationFrames<1||durationFrames>3600)fail('SUPERVISOR_DURATION_LIMIT');
 const receipts=execution.result.receipts,audit=render.operationAudit;
 assertStoryOperationCoverage(story.operations,receipts);
 assertStoryOperationCoverage(story.operations,audit);
 if(render.operationCount!==story.operations.length||receipts.some(r=>r.status!==COMMITTED))fail('SUPERVISOR_EXECUTION_NOT_VERIFIED');
 const byId=new Map(audit.map(a=>[a.operationId,a]));
 const nodes=story.operations.map(o=>{
  const a=byId.get(o.id),startFrame=frame(o.start,30),endFrame=frame(o.end,30);
  if(o.renderer!=='native'||startFrame<0||endFrame<=startFrame||endFrame>durationFrames||!Array.isArray(o.requiredQA)||!o.requiredQA.length||new Set(o.requiredQA).size!==o.requiredQA.length||o.requiredQA.some(q=>!QA.has(q))||
     a.start!==o.start||a.end!==o.end||!same(a.requiredQA,o.requiredQA)||a.execution!==COMMITTED)fail('SUPERVISOR_OPERATION_MISMATCH');
  return {id:o.id,track:o.track,startFrame,endFrame,requiredQA:[...o.requiredQA]};
 });
 const streams=render.probe?.streams??[],v=streams.filter(s=>s.codec_type==='video'),a=streams.filter(s=>s.codec_type==='audio');
 if(v.length!==1||a.length!==1||v[0].codec_name!=='h264'||a[0].codec_name!=='aac'||v[0].width!==1080||v[0].height!==1920||v[0].r_frame_rate!=='30/1'||Number(v[0].nb_read_frames)!==durationFrames||
    !Number.isFinite(Number(v[0].duration))||Math.abs(Number(v[0].duration)-durationFrames/30)>1/30||!Number.isFinite(Number(a[0].duration))||Math.abs(Number(v[0].duration)-Number(a[0].duration))>.05||
    !Number.isFinite(render.audioStats?.peakDb)||!Number.isFinite(render.audioStats?.meanDb)||render.audioStats.meanDb< -55)fail('SUPERVISOR_MEDIA_PROOF_INVALID');
 return {schema:'sues-layer-graph/v1',fps:30,durationFrames,nodes,planFingerprint:execution.planFingerprint,sourceSha256:story.sourceSha256,timelineFingerprint:story.timeline.fingerprint,storyRevision:execution.storyRevision,decisionId:execution.decisionId,projectFingerprint,outputSha256,scope:execution.scope};
}

// Reuse the existing <=180-sample evidence extractor. Longer plans are split
// by operation, preserving every operation and whole-timeline samples in each part.
export function partitionNativeSupervisorGraph(graph){
 if(graph?.schema!=='sues-layer-graph/v1'||graph.fps!==30||!Number.isInteger(graph.durationFrames)||graph.durationFrames<1||graph.durationFrames>3600||!Array.isArray(graph.nodes)||!graph.nodes.length||graph.nodes.length>100)fail('SUPERVISOR_GRAPH_INVALID');
 const baseline=new Set();for(let f=0;f<graph.durationFrames;f+=30)baseline.add(f);baseline.add(graph.durationFrames-1);
 const groups=[];let nodes=[],frames=new Set(baseline);const ids=new Set();
 for(const n of graph.nodes){
  if(!validId(n.id)||ids.has(n.id)||!Number.isInteger(n.startFrame)||!Number.isInteger(n.endFrame)||n.startFrame<0||n.endFrame<=n.startFrame||n.endFrame>graph.durationFrames)fail('SUPERVISOR_GRAPH_INVALID');ids.add(n.id);
  const points=[n.startFrame,Math.floor((n.startFrame+n.endFrame-1)/2),n.endFrame-1];
  if(new Set([...frames,...points]).size>180){groups.push({...graph,nodes});nodes=[];frames=new Set(baseline)}
  nodes.push(n);for(const f of points)frames.add(f);
 }
 if(nodes.length)groups.push({...graph,nodes});return groups;
}

// Validate the evidence index itself before accepting reviewer declarations.
export function buildNativeSupervisorIndex(graph,inspections){
 if(!Array.isArray(inspections)||!inspections.length)fail('SUPERVISOR_EVIDENCE_MISSING');
 const ids=new Set(),covered=new Map(),timelineFrames=new Set(),evidence=new Map();
 for(const item of inspections){
  const r=item?.report,key=item?.inspectionId;
  if(!/^inspection-[A-Za-z0-9]{6}$/.test(key??'')||ids.has(key)||r?.schema!=='sues-master-supervisor-evidence/v1'||r.status!=='SAMPLES_REQUIRE_REVIEW'||r.final!==false||r.planFingerprint!==graph.planFingerprint||r.outputSha256!==graph.outputSha256||r.fps!==30||r.durationFrames!==graph.durationFrames||!Array.isArray(r.samples)||!Array.isArray(r.files))fail('SUPERVISOR_EVIDENCE_BINDING');
  ids.add(key);const files=new Map();
  for(const f of r.files){if(!/^(?:audio\.wav|frame-[0-9]{4}\.png)$/.test(f?.name??'')||files.has(f.name)||!hash(f.sha256)||!Number.isInteger(f.bytes)||f.bytes<=0)fail('SUPERVISOR_EVIDENCE_FILE');files.set(f.name,f);evidence.set(key+'/'+f.name,{kind:f.name==='audio.wav'?'audio':'frame',operationIds:[]})}
  if(!files.has('audio.wav'))fail('SUPERVISOR_AUDIO_EVIDENCE_MISSING');
  const sampleFiles=new Set();
  for(const s of r.samples){if(!files.has(s.file)||s.file==='audio.wav'||sampleFiles.has(s.file)||!Number.isInteger(s.frame)||s.frame<0||s.frame>=graph.durationFrames||!Array.isArray(s.operationIds))fail('SUPERVISOR_SAMPLE_INVALID');sampleFiles.add(s.file);timelineFrames.add(s.frame);
   if(new Set(s.operationIds).size!==s.operationIds.length)fail('SUPERVISOR_SAMPLE_OPERATION_MISMATCH');
   for(const id of s.operationIds){const n=graph.nodes.find(n=>n.id===id);if(!n||s.frame<n.startFrame||s.frame>=n.endFrame)fail('SUPERVISOR_SAMPLE_OPERATION_MISMATCH');if(!covered.has(id))covered.set(id,new Set());covered.get(id).add(s.frame)}
   evidence.get(key+'/'+s.file).operationIds=[...s.operationIds];
  }
  if(sampleFiles.size!==files.size-1)fail('SUPERVISOR_SAMPLE_FILE_MISMATCH');
 }
 if(graph.nodes.some(n=>[n.startFrame,Math.floor((n.startFrame+n.endFrame-1)/2),n.endFrame-1].some(f=>!covered.get(n.id)?.has(f))))fail('SUPERVISOR_OPERATION_EVIDENCE_MISSING');
 for(let f=0;f<graph.durationFrames;f+=30)if(!timelineFrames.has(f))fail('SUPERVISOR_TIMELINE_EVIDENCE_MISSING');
 if(!timelineFrames.has(graph.durationFrames-1))fail('SUPERVISOR_TIMELINE_EVIDENCE_MISSING');
 return {schema:'sues-fablecut-supervisor-index/v1',status:'READY_FOR_TWO_REVIEWS_NOT_ARTISTIC_QA',scope:graph.scope,sourceSha256:graph.sourceSha256,timelineFingerprint:graph.timelineFingerprint,storyRevision:graph.storyRevision,decisionId:graph.decisionId,planFingerprint:graph.planFingerprint,projectFingerprint:graph.projectFingerprint,outputSha256:graph.outputSha256,fps:30,durationFrames:graph.durationFrames,operations:graph.nodes.map(n=>({id:n.id,track:n.track,startFrame:n.startFrame,endFrame:n.endFrame,requiredQA:[...n.requiredQA]})),globalChecks:[...GLOBAL],inspections:inspections.map(x=>({inspectionId:x.inspectionId,report:x.report})),evidence:Object.fromEntries(evidence),final:false};
}

// Accept two separate, complete review declarations of the actual export. This
// verifies coverage and bindings, NOT the truth of subjective observations.
export function validateNativeSupervisorReview(index,review){
 if(index?.schema!=='sues-fablecut-supervisor-index/v1'||index.status!=='READY_FOR_TWO_REVIEWS_NOT_ARTISTIC_QA'||review?.schema!=='sues-fablecut-two-pass-review/v1'||review.outputSha256!==index.outputSha256||review.planFingerprint!==index.planFingerprint||review.storyRevision!==index.storyRevision||review.decisionId!==index.decisionId||review.sourceSha256!==index.sourceSha256||review.timelineFingerprint!==index.timelineFingerprint||review.projectFingerprint!==index.projectFingerprint||!Array.isArray(review.passes)||review.passes.length!==2)fail('SUPERVISOR_REVIEW_BINDING');
 const issues=[],seen=new Set();
 function check(row,required,operationId,passId){
  if(!row||row.check!==required||!['PASS','FAIL'].includes(row.status)||!nonblank(row.observation)||!Array.isArray(row.evidence)||!row.evidence.length||new Set(row.evidence).size!==row.evidence.length||row.evidence.some(ref=>typeof ref!=='string'||(ref!=='render'&&!Object.hasOwn(index.evidence,ref))))fail('SUPERVISOR_CHECK_INVALID');
  if(required==='rendered-frame'&&!row.evidence.some(ref=>index.evidence[ref]?.kind==='frame'&&index.evidence[ref].operationIds.includes(operationId)))fail('SUPERVISOR_FRAME_EVIDENCE_REQUIRED');
  if(required==='audio-playback'&&!row.evidence.some(ref=>index.evidence[ref]?.kind==='audio'))fail('SUPERVISOR_AUDIO_EVIDENCE_REQUIRED');
  if((required==='motion-playback'||required==='narrative-review'||required==='time-sync'||operationId==='global')&&!row.evidence.includes('render'))fail('SUPERVISOR_FULL_RENDER_REFERENCE_REQUIRED');
  if(row.status==='FAIL'){if(!nonblank(row.correction))fail('SUPERVISOR_CORRECTION_REQUIRED');issues.push({passId,operationId,check:required,observation:row.observation,correction:row.correction})}
 }
 for(const pass of review.passes){
  if(!validId(pass?.id)||seen.has(pass.id)||!nonblank(pass.reviewer)||typeof pass.reviewedAt!=='string'||!Number.isFinite(Date.parse(pass.reviewedAt))||pass.fullPlaybackReviewed!==true||!Array.isArray(pass.operations)||!Array.isArray(pass.globalChecks))fail('SUPERVISOR_INDEPENDENT_PASS_REQUIRED');seen.add(pass.id);
  assertStoryOperationCoverage(index.operations,pass.operations,'SUPERVISOR_REVIEW_OPERATION_COVERAGE');
  const opById=new Map(pass.operations.map(o=>[o.operationId,o]));
  for(const o of index.operations){const rows=opById.get(o.id).checks;if(!Array.isArray(rows)||rows.length!==o.requiredQA.length||new Set(rows.map(r=>r?.check)).size!==rows.length)fail('SUPERVISOR_REQUIRED_QA_COVERAGE');for(const q of o.requiredQA)check(rows.find(r=>r?.check===q),q,o.id,pass.id)}
  if(pass.globalChecks.length!==index.globalChecks.length||new Set(pass.globalChecks.map(x=>x?.check)).size!==index.globalChecks.length)fail('SUPERVISOR_GLOBAL_QA_COVERAGE');
  for(const q of index.globalChecks)check(pass.globalChecks.find(x=>x?.check===q),q,'global',pass.id);
 }
 return {schema:'sues-fablecut-supervisor-result/v1',status:issues.length?'QA_BLOCKED_CORRECTION_REQUIRED':index.scope==='technical-qa'?'TECHNICAL_FIXTURE_REVIEW_RECORDED':'TWO_REVIEWS_RECORDED_NOT_CREATIVE_APPROVAL',outputSha256:index.outputSha256,storyRevision:index.storyRevision,planFingerprint:index.planFingerprint,projectFingerprint:index.projectFingerprint,issues,passIds:[...seen],creativeApproval:false,publicationAuthorized:false,final:false,limitations:['reviewer-declarations-not-machine-semantic-proof','no-automatic-creative-correction','new-revision-required-for-changes']};
}
