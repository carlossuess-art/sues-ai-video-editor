/** Strict v1 contract: only transform one unlocked visual clip via native MCP.
 * FableCut is the only NLE. Caller must authenticate and verify project identity
 * against an independently authenticated FableCut read before dispatching.
 * The native MCP `baseRevision` prevents stale agent edits.
 */
const ID=/^[a-zA-Z0-9_-]{1,100}$/;
export function prepareDirectorNativeTransform({project,projectId,expectedProjectId,revision,clipId,x,y,scale}={}){
 if(!project||!Array.isArray(project.clips)||!Array.isArray(project.tracks)||
  typeof projectId!=='string'||projectId!==expectedProjectId||!/^p_[a-zA-Z0-9_-]{2,96}$/.test(projectId)||
  !Number.isInteger(project.revision)||project.revision!==revision||revision<0||!ID.test(clipId||''))
   throw Error('Native project identity or revision not verified');
 const clip=project.clips.find(c=>c.id===clipId);
 if(!clip||!['video','image'].includes(clip.kind)||clip.locked||
  (project.lockedTracks||[]).includes(clip.track)||clip.track==='V1'||
  !project.tracks.some(t=>t.id===clip.track)||
  ![x,y,scale].every(Number.isFinite)||Math.abs(x)>3000||Math.abs(y)>3000||scale<.05||scale>8)
  throw Error('Refused unsafe or locked native clip transform');
 const previous={x:clip.props?.x??0,y:clip.props?.y??0,scale:clip.props?.scale??1};
 if(![previous.x,previous.y,previous.scale].every(Number.isFinite))throw Error('Invalid current transform');
 return Object.freeze({tool:'fablecut_patch_project',arguments:{baseRevision:revision,
   ops:[{op:'updateClip',id:clipId,set:{props:{x,y,scale}}}]},
   expected:{projectId,sourceRevision:revision,clipId,disabled:!!clip.disabled},
   inverse:{baseRevision:revision+1,ops:[{op:'updateClip',id:clipId,set:{props:previous}}]},
   automaticDispatchAllowed:false,requiresAuthenticatedDispatch:true});
}
