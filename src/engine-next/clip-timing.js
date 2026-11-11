/** CAS-safe, frame-aligned timing changes for editable native FableCut text clips.
 * Stage only: never re-enable disabled review subtitles or change other tracks.
 */
export function retimeNativeTextClip(project,{clipId,startFrame,durationFrames}={}){
 if(!project||!Array.isArray(project.clips)||project.fps!==30||
    typeof clipId!=='string'||!/^[-a-zA-Z0-9_]{1,100}$/.test(clipId)||
    !Number.isInteger(startFrame)||startFrame<0||startFrame>9000||
    !Number.isInteger(durationFrames)||durationFrames<1||durationFrames>9000||
    startFrame+durationFrames>9000)throw new Error('Invalid frame-aligned timing');
 const next=structuredClone(project);
 const clip=next.clips.find(c=>c.id===clipId);
 if(!clip||clip.kind!=='text'||clip.locked||clip.track==='V1'||
    !next.tracks?.some(t=>t.id===clip.track)||
    !Number.isFinite(clip.start)||!Number.isFinite(clip.duration))throw new Error('Only unlocked native text clips may be retimed');
 const before={start:clip.start,duration:clip.duration,disabled:!!clip.disabled};
 clip.start=Number((startFrame/30).toFixed(6));clip.duration=Number((durationFrames/30).toFixed(6));
 if(!!clip.disabled!==before.disabled)throw new Error('Cannot activate clips');
 return {project:next,change:{clipId,before,after:{start:clip.start,duration:clip.duration,disabled:before.disabled}}};
}
