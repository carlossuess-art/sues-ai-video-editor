'use strict';
/** One-step inverse command for the same active FableCut project/revision.
 * This is NOT a global history restore. Only reversible individual property
 * operations through the existing authenticated, CAS-protected endpoints.
 * No persistent stored snapshots, no autonomous overwrites of other editors.
 */
const SuesUndo = (()=>{
 const schema='sues-engine-next-local-undo/v1';
 const kinds={transform:'/api/engine-next/clip-transform',timing:'/api/engine-next/clip-timing',title:'/api/engine-next/title-size'};
 function capture({kind,projectId,clip,previousRevision,savedRevision}={}) {
  if(!Object.hasOwn(kinds,kind)||!/^p_[a-zA-Z0-9_-]{2,96}$/.test(projectId||'')||
     !clip||typeof clip.id!=='string'||!/^[-a-zA-Z0-9_]{1,100}$/.test(clip.id)||
     !Number.isInteger(previousRevision)||!Number.isInteger(savedRevision)||savedRevision<=previousRevision)
     throw Error('Invalid native undo origin');
  let before;
  if(kind==='transform'){
   if(!['video','image'].includes(clip.kind)||clip.locked||![clip.x,clip.y,clip.scale].every(Number.isFinite))throw Error('Unsafe transform inverse');
   before={x:clip.x,y:clip.y,scale:clip.scale};
  }else if(kind==='timing'){
   if(clip.kind!=='text'||clip.locked||![clip.start,clip.duration].every(Number.isFinite))throw Error('Unsafe text timing inverse');
   before={startFrame:Math.round(clip.start*30),durationFrames:Math.round(clip.duration*30)};
   // Legacy FableCut clips may use subframe seconds (e.g. 2.28s, 0.85s).
   // Never silently round their original timing when undoing a frame edit.
   if(before.startFrame<0||before.durationFrames<1||
      Math.abs(clip.start-before.startFrame/30)>0.00001||
      Math.abs(clip.duration-before.durationFrames/30)>0.00001)
     throw Error('El tiempo original no está alineado a fotogramas: deshacer exacto no disponible');
  }else{
   if(clip.kind!=='text'||clip.locked||!Number.isInteger(clip.fontSize)||clip.fontSize<20||clip.fontSize>140)throw Error('Unsafe title inverse');
   before={fontSize:clip.fontSize};
  }
  return Object.freeze({schema,kind,projectId,clipId:clip.id,previousRevision,savedRevision,before:Object.freeze(before)});
 }
 function request(command,current){
  if(!command||command.schema!==schema||!Object.hasOwn(kinds,command.kind)||
     !current||current.projectId!==command.projectId||current.revision!==command.savedRevision||
     !current.clips?.some(c=>c.id===command.clipId))throw Error('Undo refused: the shared project has changed');
  return {path:kinds[command.kind],payload:{expectedRevision:command.savedRevision,clipId:command.clipId,...command.before}};
 }
 return Object.freeze({capture,request});
})();
if(typeof module!=='undefined'&&module.exports)module.exports=SuesUndo;
