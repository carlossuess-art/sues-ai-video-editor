// Build the private V17 → V18 regression draft. This command never writes a FableCut project.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createReadStream, readFileSync, realpathSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {join, resolve, sep} from 'node:path';
import {projectFingerprint} from '../../src/engine-next/fablecut-command-batch.js';
import {MasterDirectorProjectStore} from '../../src/master-director-project-store.js';
import {inspectMasterDirectorStory, STORY_SCHEMA} from '../../src/master-director-story.js';

const [dataRoot, workRoot, engineModule] = process.argv.slice(2);
if (!dataRoot || !workRoot || !engineModule) {
 throw Error('Usage: node fablecut-v18-story-regression.mjs <automation-data> <new-private-work-dir> <project-ops.js>');
}
const data = realpathSync(dataRoot);
const work = realpathSync(workRoot);
assert.ok(work !== data && !work.startsWith(data + sep) && !data.startsWith(work + sep),
 'Use a separate private working directory.');
const v17 = join(data, 'test-project-039-v17');
const v18 = join(data, 'test-project-040-v18');
const load = file => JSON.parse(readFileSync(file, 'utf8'));
const project = load(join(v17, 'project.json'));
const expected = load(join(v18, 'project.json'));
const historical = load(join(v18, 'approved-v18-delta.json'));
const proof = load(join(v18, 'execution-proof.json'));
const source = join(data, 'recording-20261110-115912', 'original.mp4');
async function fileHash(file) {
 const hash = createHash('sha256');
 for await (const chunk of createReadStream(file)) hash.update(chunk);
 return hash.digest('hex');
}

const sourceSha256 = await fileHash(source);
assert.equal(sourceSha256, '0190efba90de1f7f73bfef8fc1c3822779a82c123225f77b68a50a9b31a77ad8');
assert.equal(await fileHash(join(v18, 'approved-v18-delta.json')),
 'bcb45d732de9505954b2c443398e6d0a7aa365254fafd2039fc4dc9c8ae6ec1a');
assert.equal(project.revision, 22);
assert.equal(expected.revision, 23);
assert.equal(projectFingerprint(project), historical.baseFingerprint);
assert.equal(projectFingerprint(project), proof.beforeFingerprint);
assert.equal(projectFingerprint(expected), proof.afterFingerprint);
assert.equal(project.fps, 30);
assert.equal(expected.fps, project.fps);
assert.equal(project.outPoint, expected.outPoint);
const fps = project.fps;
const duration = project.outPoint;
const frame = time => {
 const value = time * fps;
 assert.ok(Math.abs(value - Math.round(value)) < 1e-6);
 return Math.round(value);
};
const interval = clip => ({
 startFrame: frame(clip.start),
 endFrame: frame(clip.start + clip.duration)
});
const sourceMap = project.clips.filter(clip => clip.track === 'V1' && clip.mediaId === 'source-video')
 .sort((a, b) => a.start - b.start)
 .map(clip => ({
  clipId: clip.id,
  ...interval(clip),
  sourceInFrame: frame(clip.in),
  sourceOutFrame: frame(clip.in + clip.duration)
 }));
assert.equal(sourceMap.length, 18);
const gaps = [];
let previousEnd = 0;
for (const span of sourceMap) {
 assert.ok(span.startFrame >= previousEnd && span.endFrame <= frame(duration));
 if (span.startFrame > previousEnd) gaps.push([previousEnd, span.startFrame]);
 previousEnd = span.endFrame;
}
if (previousEnd < frame(duration)) gaps.push([previousEnd, frame(duration)]);
function sourceSpans(start, end) {
 return sourceMap.flatMap(span => {
  const startFrame = Math.max(span.startFrame, start);
  const endFrame = Math.min(span.endFrame, end);
  if (endFrame <= startFrame) return [];
  const offset = span.sourceInFrame - span.startFrame;
  return [{clipId: span.clipId, startFrame, endFrame,
   sourceInFrame: startFrame + offset, sourceOutFrame: endFrame + offset}];
 });
}

const mediaById = new Map(expected.media.map(media => [media.id, media]));
const clipById = new Map(expected.clips.map(clip => [clip.id, clip]));
const changed = [
 {id:'SC02-SOFA', asset:'v18-sofa-integrated', reason:'Recuperar el recurso de sofá integrado.'},
 {id:'V13-SELF-GLOW', asset:'v18-mist', reason:'Preservar niebla, mezcla y fotogramas clave.'},
 {id:'V14-HIGHER-SELF-MOTION', asset:'v15-higher-self-expanded', reason:'Preservar el movimiento de la capa existente.'},
 {id:'V18-LOCAL-FLASH', asset:'v18-flash', reason:'Preservar el destello localizado superpuesto en V3.'},
 {id:'V18-MIST-VEIL', asset:'v18-mist-veil', reason:'Preservar el velo de niebla superpuesto en V3.'}
];
const assetFacts = await Promise.all(changed.map(async row => {
 const media = mediaById.get(row.asset);
 assert.ok(/^\/media\/[A-Za-z0-9_.-]+$/.test(media?.src ?? ''), row.asset);
 const file = realpathSync(join(v18, media.src.slice(1)));
 assert.ok(file.startsWith(resolve(data, '..') + sep), 'Asset outside the editor data directory.');
 return {id: row.asset, source: 'library', assetId: row.asset,
  expectedSha256: await fileHash(file), kind: media.kind, narrativePurpose: row.reason};
}));

const sceneId = 'historical-v17-to-v18';
const effect = 'fablecut-command-exact-v1';
const operations = historical.ops.map((patch, index) => {
 const id = patch.id ?? patch.clip?.id ?? patch.media?.id ?? 'project.name';
 const row = patch.media ? changed.find(item => item.asset === id) : changed.find(item => item.id === id);
 const clip = row && clipById.get(row.id);
 if (id !== 'project.name') assert.ok(row && clip && clip.mediaId === row.asset, id);
 const window = clip ? interval(clip) : {startFrame:0,endFrame:frame(duration)};
 const isClip = patch.op === 'updateClip' || patch.op === 'addClip';
 const media = clip && mediaById.get(clip.mediaId);
 const placement = isClip ? {
  track: clip.track,
  ...window,
  mediaInFrame: frame(clip.in),
  ...(media.kind === 'video' ? {mediaOutFrame:frame(clip.in + clip.duration)} : {}),
  originalArollSpans:sourceSpans(window.startFrame, window.endFrame)
 } : null;
 if (placement) {
  assert.equal(placement.originalArollSpans.reduce((n, s) => n + s.endFrame - s.startFrame, 0),
   window.endFrame - window.startFrame, id + ' A-roll source coverage');
 }
 const dependsOn = isClip && historical.ops.some(op => op.media?.id === row.asset)
  ? [row.asset] : [];
 if (id === 'project.name') dependsOn.push(...changed.map(item => item.id));
 return {
  id, sceneId, start:window.startFrame/fps, end:window.endFrame/fps,
  track:'graphics', renderer:'native', effect,
  reason: row?.reason ?? 'Conservar el nombre guardado para la revisión histórica.',
  parameters:{command:{
   // These historical patch commands remain blocked by the existing exact-command allowlist.
   action:patch.op, patch, placement, historicalOrder:index+1
  }},
  dependsOn,
  requiredQA:['rendered-frame','motion-playback','narrative-review'],
  ...(row ? {resourceRef:row.asset} : {})
 };
});
assert.equal(operations.length, 10);
assert.equal(new Set(operations.map(operation => operation.id)).size, 10);
const story = {
 schema:STORY_SCHEMA,
 sourceSha256,
 timeline:{fingerprint:projectFingerprint(project),timeSpace:'edit-timeline',fps,duration},
 visual:{mode:'brand-sues'},
 narrative:{
  centralMessage:'¿Quién habla en tu cabeza?',
  intendedExperience:'Conservar íntegro el retoque atmosférico guardado en la V18.',
  scenes:[{id:sceneId,start:0,end:duration,purpose:'Ventana técnica de la revisión del montaje.'}]
 },
 resources:assetFacts,
 operations
};

const store = new MasterDirectorProjectStore(work, () => { throw Error('Technical draft only.'); });
const {revision} = store.saveDraft(story);
const reread = store.readDraft(revision);
assert.deepEqual(reread, story);
const inspection = inspectMasterDirectorStory(reread, {
 sourceSha256,timelineFingerprint:story.timeline.fingerprint,
 rendererCapabilities:{native:[effect]}
});
assert.equal(inspection.status, 'BLOCKED');
assert.ok(inspection.issues.every(({code}) =>
 ['MASTERS_NOT_VERIFIED','RULE_VERSION_NOT_VERIFIED','RULE_CONFLICT_AUDIT_MISSING','LIBRARY_ASSET_UNVERIFIED'].includes(code)),
 JSON.stringify(inspection.issues));
const patches = reread.operations.map(operation => operation.parameters.command.patch);
assert.deepEqual(patches, historical.ops);
const native = createRequire(import.meta.url)(realpathSync(engineModule));
const parity = structuredClone(project);
native.applyPatch(parity, structuredClone(patches), {});
parity.revision += 1;
native.checkProject(parity);
assert.deepEqual(parity, expected);
const result = {
 status:'PRIVATE_TECHNICAL_DRAFT_BLOCKED_FOR_EXECUTION', revision,
 sourceSha256, originalArollSpans:sourceMap.length, originalArollGaps:gaps,
 operationIds:reread.operations.map(operation => operation.id),
 resources:reread.resources.length, storyBytes:Buffer.byteLength(JSON.stringify(reread)),
 baseFingerprint:story.timeline.fingerprint, expectedFingerprint:proof.afterFingerprint,
 inMemoryFingerprint:projectFingerprint(parity), inspectionIssues:inspection.issues
};
writeFileSync(join(work, 'regression-proof.json'), JSON.stringify({...result,sourceMap}, null, 2) + '\n',
 {flag:'wx', mode:0o600});
console.log(JSON.stringify(result));
