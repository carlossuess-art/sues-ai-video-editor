/**
 * SUES Engine Next · capability-gap ledger.
 *
 * This file is NOT a video renderer. It preserves every approved editing
 * operation while the user-facing timeline engine is being replaced.
 * "verified-in-source" means only an API surface was inspected; it does not
 * mean a cinematic result has passed the Reel 158404 test.
 */
const SOURCE = Object.freeze({
  fablecut: Object.freeze({
    repository: 'https://github.com/ronak-create/FableCut',
    pinnedCommit: '579b08ec1a789baec5cbf06d7430373460508d09',
    license: 'MIT',
    role: 'unified multipista timeline, compositor, MCP edits, user playback, export',
    evidence: '506 unit tests pass + 34 focused tests pass with FFmpeg on isolated source',
    verifiedReal158404: false
  }),
  hyperframes: Object.freeze({
    repository: 'https://github.com/heygen-com/hyperframes',
    pinnedCommit: 'a3b8f521d9114286fa410a49bfd07ccf7d541689',
    license: 'Apache-2.0',
    role: 'HTML/Three.js/GSAP seekable motion, transparent overlays, reusable source',
    evidence: 'source inspected and CLI/render requirements reviewed; no 158404 render',
    verifiedReal158404: false
  }),
  firered: Object.freeze({
    repository: 'https://github.com/FireRedTeam/FireRed-OpenStoryline',
    pinnedCommit: 'c9e9452',
    license: 'Apache-2.0',
    role: 'narrative rough cut planning inspiration, not timeline authority',
    evidence: 'source inspected; cannot replace Sues film direction without evaluation',
    verifiedReal158404: false
  }),
  sues: Object.freeze({
    repository: 'https://github.com/carlossuess-art/sues-ai-video-editor',
    role: 'Film Director 1.5.7, brand, approved user intent and original assets',
    evidence: '7 scenes / 49 operations persisted in isolated staging; not approved',
    verifiedReal158404: true
  })
});

export const ENGINE_NEXT_SOURCES = SOURCE;
export const ENGINE_NEXT_QA_CRITERIA = Object.freeze([
  'same-editable-timeline-for-ui-agent-and-export',
  'revisioned-atomic-commands-and-undo',
  'frame-exact-preview-and-export-parity',
  'temporal-matting-full-shot-coverage',
  'child-and-group-visible-behind-subject',
  'alpha-gif-in-front-of-subject',
  'two-line-word-progressive-subtitles-under-chin',
  'semantic-titles-never-before-speech-meaning',
  'three-dimensional-narrative-motion-source-editable',
  'music-voice-intelligibility-and-intro-impact',
  'full-1080x1920-render-inspect-and-reopen',
  'no-unreported-lost-operation-or-asset',
  'safe-license-provenance-and-resource-budget'
]);

const TRACK_ENGINE = Object.freeze({
  camera: 'fablecut:video',
  broll: 'fablecut:layered-video',
  captions: 'fablecut:text-track',
  graphics: 'fablecut:graphics-or-hyperframes',
  music: 'fablecut:audio',
  sfx: 'fablecut:audio',
  voice: 'fablecut:audio'
});
export function classifyOperation(op) {
  if (!op || typeof op.id !== 'string' || !Number.isFinite(op.start) ||
      !Number.isFinite(op.end) || op.end <= op.start)
    return {status:'invalid-contract', target:null, reason:'operation malformed or impossible time interval'};
  const target = TRACK_ENGINE[op.track] ?? null;
  if (!target) return {status:'unmapped',target:null,reason:'unknown track; no silent omission allowed'};
  const params = op.parameters ?? {};
  const reason = String(op.reason ?? '');
  if (op.track === 'camera')
    return {status:'adapter-needed',target,reason:'source media must be bound to original SHA and timing'};
  if (op.track === 'captions')
    return {status:'adapter-needed',target,reason:'ASR verification, fonts, two-line under-chin layout and word timing required'};
  if (op.track === 'broll') {
    if (params.requiresTracking || params.alphaLayered || /mask|feather|matte/i.test(op.effect??''))
      return {status:'temporal-matte-needed',target,reason:'unbroken real matte and perceptual occlusion QA required'};
    return {status:'adapter-needed',target,reason:'asset licensed, transition in/out and scene geography must be proven'};
  }
  if (op.track === 'graphics') {
    if (/gif|alpha/i.test(op.effect??'') || params.layer === 'in-front-of-Carlos')
      return {status:'alpha-motion-needed',target,reason:'alpha and z-order must survive preview/export'};
    if (/motion|3d|cinematic|block/i.test(op.effect??'') || /motion/i.test(reason))
      return {status:'hyperframes-source-needed',target,reason:'seekable source, editable props, rich motion and preview parity required'};
    return {status:'semantic-title-needed',target,reason:'show only after meaning; font-size and face-safe geometry QA'};
  }
  if (op.track === 'music' || op.track === 'sfx' || op.track === 'voice')
    return {status:'mix-provenance-needed',target,reason:'asset rights, voice intelligibility and actual audio listening'};
  return {status:'unmapped',target,reason:'track has no real engine adapter'};
}
/**
 * Deliberately not a fake compiler. Every operation has an ID and independent
 * status, preserving the user's whole creative plan for a future executable
 * adapter. Only a validated same-renderer proof may promote a status.
 */
export function buildEngineNextLedger(story, {sourceSha256}={}) {
  if (story?.schema!=='sues-master-story/v1' ||
      !Array.isArray(story.operations) || !Array.isArray(story.narrative?.scenes) ||
      !Array.isArray(story.resources) ||
      typeof story.sourceSha256!=='string' ||
      (sourceSha256 && story.sourceSha256!==sourceSha256))
    throw Error('Authentic approved-story evidence required');
  const ids=new Set(),scenes=new Map(story.narrative.scenes.map(s=>[s.id,s]));
  const resources=new Set(story.resources.map(r=>r.id));
  const ops=story.operations.map(op=>{
    if (ids.has(op.id)) throw Error('Duplicate operation '+op.id);
    ids.add(op.id);
    const scene=scenes.get(op.sceneId);
    if (!scene || op.start<scene.start-1e-6 || op.end>scene.end+1e-6)
      throw Error('Operation outside its approved scene: '+op.id);
    if(op.resourceRef && !resources.has(op.resourceRef))
      throw Error('Unknown asset dependency: '+op.id);
    return {operationId:op.id,sceneId:op.sceneId,start:op.start,end:op.end,
      track:op.track,effect:op.effect,...classifyOperation(op),
      assetId:op.resourceRef??null,
      source:op.parameters?.source??null,
      creativeApproved:false,renderProven:false};
  });
  if (ops.length!==story.operations.length||ids.size!==story.operations.length)
    throw Error('Loss of approved creative intent');
  return Object.freeze({
    schema:'sues-engine-next-gap-ledger/v1',
    sourceSha256:story.sourceSha256,
    storySchema:story.schema,
    sceneCount:story.narrative.scenes.length,
    operationCount:ops.length,
    resources:story.resources.map(r=>({id:r.id,source:r.source,kind:r.kind,
      assetId:r.assetId??null,verifiedInStudio:false})),
    operations:ops,
    candidates:Object.fromEntries(Object.entries(SOURCE).map(([k,v])=>[k,{...v}])),
    renderStatus:'NO_EXECUTABLE_ENGINE_CERTIFIED',
    approvedByCarlos:false,
    criteria:[...ENGINE_NEXT_QA_CRITERIA]
  });
}