import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {auditRevisionDelta} from '../sues-production-policy.js';

const fingerprint = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const sha = value => /^[a-f0-9]{64}$/.test(value ?? '');
const only = (object, keys) => object && typeof object === 'object' && !Array.isArray(object) &&
 Object.keys(object).every(key => keys.includes(key));
const close = (a,b) => Math.abs(a-b) < 1e-6;
export const isRevisionPatch = command => Object.hasOwn(command ?? {},'patch');

function verifiedArollSpans(project, placement) {
 const fps = project.fps;
 const spans = project.clips.filter(c=>c.track==='V1' && c.mediaId==='source-video')
  .sort((a,b)=>a.start-b.start).flatMap(c=>{
   const frame = Math.round(c.start*fps), sourceInFrame = Math.round(c.in*fps);
   const startFrame = Math.max(frame,placement.startFrame);
   const endFrame = Math.min(Math.round((c.start+c.duration)*fps),placement.endFrame);
   if(endFrame<=startFrame) return [];
   return [{clipId:c.id,startFrame,endFrame,
    sourceInFrame:sourceInFrame+startFrame-frame,sourceOutFrame:sourceInFrame+endFrame-frame}];
  });
 let cursor = placement.startFrame;
 for(const span of spans){
  if(span.startFrame!==cursor) return false;
  cursor=span.endFrame;
 }
 return cursor===placement.endFrame && isDeepStrictEqual(spans,placement.originalArollSpans);
}

// Only a trusted private host can pin the draft, ordered commands, base and result.
export function prepareBoundRevisionPatch(story, project, registry, binding) {
 if (!binding || fingerprint(story) !== binding.storyFingerprint ||
     fingerprint(project) !== binding.baseFingerprint || !sha(binding.expectedFingerprint)) {
  return {status:'BLOCKED',issues:story.operations.map(({id}) => ({
   operationId:id,code:'NATIVE_REVISION_PATCH_UNBOUND'
  }))};
 }
 const resources = new Map((story.resources ?? []).map(r => [r.id,r]));
 const media = new Map(project.media.map(m => [m.id,m]));
 const clips = new Map(project.clips.map(c => [c.id,c]));
 const seen = new Set();
 const commands = [], issues = [];
 for (const [index,o] of story.operations.entries()) {
  const c = o.parameters?.command, p = c?.patch, place = c?.placement;
  const asset = resources.get(o.resourceRef);
  const id = p?.id ?? p?.media?.id ?? p?.clip?.id ?? 'project.name';
  let valid = o.renderer === 'native' && o.effect === 'fablecut-command-exact-v1' &&
   o.id === id && !!p && c?.action === p.op && c?.historicalOrder === index + 1 &&
   o.dependsOn.every(dep => seen.has(dep));
  if (valid && p.op === 'addMedia') {
   valid = only(p,['op','media']) && place === null && !media.has(id) && asset?.assetId === id &&
    /^\/media\/[A-Za-z0-9_.-]+$/.test(p.media.src ?? '');
   if (valid) media.set(id,p.media);
  } else if (valid && p.op === 'setProject') {
   valid = only(p,['op','set']) && only(p.set,['name']) &&
    typeof p.set.name === 'string' && place === null && !asset;
  } else if (valid && (p.op === 'addClip' || p.op === 'updateClip')) {
   const before = clips.get(id), add = p.op === 'addClip';
   valid = add ? !before && only(p,['op','clip']) :
    !!before && !before.locked && !before.disabled && only(p,['op','id','set']) &&
    only(p.set,['name','mediaId','duration','props','keyframes']);
   const clip = add ? p.clip : {...before,...p.set};
   const m = media.get(clip.mediaId), fps = project.fps;
   valid &&= !!place && !!m && asset?.assetId === m.id && m.kind === clip.kind &&
    project.tracks.some(t => t.id === clip.track && t.kind === 'video') &&
    !project.lockedTracks?.includes(clip.track) && !project.disabledTracks?.includes(clip.track) &&
    registry.nativeTrackRoles?.[clip.track] === o.track && place.track === clip.track &&
    [place.startFrame,place.endFrame,place.mediaInFrame].every(Number.isInteger) &&
    close(clip.start*fps,place.startFrame) && close((clip.start+clip.duration)*fps,place.endFrame) &&
    close(clip.in*fps,place.mediaInFrame) && close(clip.start,o.start) && close(clip.start+clip.duration,o.end) &&
    verifiedArollSpans(project,place) &&
    (m.kind !== 'video' || (close((clip.in+clip.duration)*fps,place.mediaOutFrame) &&
     clip.in+clip.duration <= m.duration+1e-6));
   if (valid) clips.set(id,clip);
  } else valid = false;
  if (valid) commands.push({id:o.id,patch:p,...(asset ? {assetId:asset.assetId,expectedSha256:asset.expectedSha256} : {})});
  else issues.push({operationId:o.id,code:'NATIVE_REVISION_PATCH_INVALID'});
  seen.add(o.id);
 }
 return issues.length ? {status:'BLOCKED',issues} : {status:'PREPARED_NOT_EXECUTED',story,
  request:{baseRevision:project.revision,baseFingerprint:binding.baseFingerprint,commands}};
}

export function applyBoundRevisionPatch(project, request, {native,resolveAsset,binding}) {
 if (!binding || request.baseFingerprint !== binding.baseFingerprint ||
     fingerprint(request.commands) !== binding.commandsFingerprint) {
  throw Error('NATIVE_REVISION_PATCH_REQUEST_UNBOUND');
 }
 const media = new Map(project.media.map(m => [m.id,m]));
 const assets = new Map();
 const patchOps = request.commands.map(c => {
  if (c.patch.media) media.set(c.patch.media.id,c.patch.media);
  if (c.assetId) {
   const asset = resolveAsset(c.assetId), m = media.get(c.assetId);
   if (!sha(c.expectedSha256) || asset?.id !== c.assetId || asset.sha256 !== c.expectedSha256 ||
       asset.verifiedPhysical !== true || asset.rightsVerified !== true || asset.commercialUseAllowed !== true || !m ||
       asset.src !== m.src || asset.kind !== m.kind) {
    const error = Error('NATIVE_REVISION_PATCH_ASSET_UNVERIFIED');
    error.operationId = c.id;
    throw error;
   }
   assets.set(asset.id,asset);
  }
  return structuredClone(c.patch);
 });
 const after = structuredClone(project);
 native.applyPatch(after,structuredClone(patchOps),{});
 after.revision++;
 native.checkProject(after);
 const allowed = patchOps.filter(p => p.clip || p.id).map(p => 'root/'+(p.clip?.id ?? p.id));
 const delta = auditRevisionDelta(project,after,{allowed,allowedProjectFields:['media','name']});
 if (!delta.ok || fingerprint(after) !== binding.expectedFingerprint) throw Error('NATIVE_REVISION_PATCH_RESULT_MISMATCH');
 return {project:after,patchOps,assets:[...assets.values()],
  receipts:request.commands.map(c => ({operationId:c.id,action:c.patch.op,status:'NATIVE_PROJECT_APPLIED_NOT_RENDERED'})),
  undo:{baseFingerprint:fingerprint(after),project:structuredClone(project)}};
}

// Build and verify the inverse for a trusted, persisted receipt before any CAS.
export function planBoundRevisionRollback(current, undo, native) {
 if (!undo?.project || fingerprint(current) !== undo.baseFingerprint) throw Error('STALE_UNDO');
 const previous = undo.project;
 const byId = new Map(current.clips.map(c => [c.id,c]));
 const previousIds = new Set(previous.clips.map(c => c.id));
 const ops = current.clips.filter(c => !previousIds.has(c.id)).map(c => ({op:'removeClip',id:c.id}));
 for (const clip of previous.clips) {
  const after = byId.get(clip.id);
  if (!after) throw Error('UNDO_MISSING_CLIP');
  const set = {};
  for (const key of new Set([...Object.keys(clip),...Object.keys(after)])) {
   if (isDeepStrictEqual(clip[key],after[key])) continue;
   if (key !== 'props') set[key] = clip[key] ?? null;
   else set.props = Object.fromEntries([...new Set([...Object.keys(clip.props ?? {}),
    ...Object.keys(after.props ?? {})])].map(k => [k,clip.props?.[k] ?? null]));
  }
  if (Object.keys(set).length) ops.push({op:'updateClip',id:clip.id,set});
 }
 const previousMedia = new Set(previous.media.map(m => m.id));
 for (const m of current.media) if (!previousMedia.has(m.id)) ops.push({op:'removeMedia',id:m.id});
 if (previous.name !== current.name) ops.push({op:'setProject',set:{name:previous.name}});
 const expected = structuredClone(current);
 native.applyPatch(expected,structuredClone(ops),{});
 expected.revision++;
 native.checkProject(expected);
 if (!isDeepStrictEqual(expected,{...previous,revision:expected.revision})) throw Error('UNDO_RESULT_MISMATCH');
 return {baseRevision:current.revision,ops,expected};
}
