// Verifies that every frame in a proposed Film Director storyboard has one
// coherent base shot. This is a structural audit, not permission to render.
const blocked=(code,issues=[])=>({schema:'sues-film-brief-shot-coverage/v1',
 status:'BLOCKED',code,issues,approved:false,canExecute:false});
const finite=x=>typeof x==='number'&&Number.isFinite(x);
export function inspectFilmBriefShotCoverage(annex){
 if(annex?.schema!=='sues-master-film-brief-translation/v1'||
    annex.canExecute!==false||annex.approved!==false||
    !Array.isArray(annex.scenes)||!annex.scenes.length||
    !finite(annex.duration)||annex.duration<=0||
    !Number.isInteger(annex.fps)||annex.fps<1||
    annex.translationCoverage?.lostLines!==0)
    return blocked('UNTRUSTED_SHOT_COVERAGE_INPUT');
 const frameCount=Math.round(annex.duration*annex.fps),issues=[],byScene=[];
 const seen=new Set();
 let previousSceneEnd=0;
 for(const [sceneIndex,scene] of annex.scenes.entries()){
   if(!scene||typeof scene.id!=='string'||seen.has(scene.id)||
      !Array.isArray(scene.shots)||!scene.shots.length||
      !finite(scene.editStart)||!finite(scene.editEnd)){
     issues.push({code:'INVALID_SCENE',sceneIndex});continue;
   }
   seen.add(scene.id);
   const start=Math.round(scene.editStart*annex.fps),end=Math.round(scene.editEnd*annex.fps);
   if(start!==previousSceneEnd)issues.push({code:'SCENE_GAP_OR_OVERLAP',sceneId:scene.id,
      expectedStartFrame:previousSceneEnd,actualStartFrame:start});
   if(end<=start||end>frameCount)issues.push({code:'INVALID_SCENE_RANGE',sceneId:scene.id});
   previousSceneEnd=end;
   let cursor=start;
   const shotFrames=[];
   for(const shot of [...scene.shots].sort((a,b)=>a.editStart-b.editStart)){
     if(!shot||seen.has(shot.id)||shot.sceneId!==scene.id||
        !['camera','broll','motion'].includes(shot.kind)||
        !finite(shot.editStart)||!finite(shot.editEnd)||
        !finite(shot.sourceStart)||!finite(shot.sourceEnd)||
        !Number.isInteger(shot.sourceLine)||shot.sourceLine<1){
       issues.push({code:'INVALID_SHOT',sceneId:scene.id,shotId:shot?.id});continue;
     }
     seen.add(shot.id);
     const a=Math.round(shot.editStart*annex.fps),b=Math.round(shot.editEnd*annex.fps);
     if(a!==cursor)issues.push({code:'BASE_SHOT_GAP_OR_OVERLAP',
       sceneId:scene.id,shotId:shot.id,expectedStartFrame:cursor,actualStartFrame:a});
     if(b<=a||b>end||a<start)issues.push({code:'SHOT_OUTSIDE_SCENE',
       sceneId:scene.id,shotId:shot.id,startFrame:a,endFrame:b});
     if(shot.kind==='camera'&&shot.base!=='CARLOS'||
        shot.kind==='broll'&&(!/^B0\d+$/.test(shot.base??'')||shot.resourceHint!==shot.base)||
        shot.kind==='motion'&&(!/^M0\d+$/.test(shot.base??'')||shot.resourceHint!==shot.base))
       issues.push({code:'BASE_KIND_RESOURCE_INCONSISTENT',sceneId:scene.id,shotId:shot.id});
     if(shot.overlayResourceHints!==undefined&&
        (!Array.isArray(shot.overlayResourceHints)||shot.overlayResourceHints.some(x=>!/^M0\d+$/.test(x))))
       issues.push({code:'INVALID_OVERLAY_SLOT',sceneId:scene.id,shotId:shot.id});
     cursor=b;shotFrames.push({id:shot.id,startFrame:a,endFrame:b,kind:shot.kind,
       base:shot.base,overlayResourceHints:shot.overlayResourceHints??[]});
   }
   if(cursor!==end)issues.push({code:'SCENE_BASE_COVERAGE_INCOMPLETE',sceneId:scene.id,
     finalShotEndFrame:cursor,sceneEndFrame:end});
   byScene.push({sceneId:scene.id,startFrame:start,endFrame:end,shots:shotFrames});
 }
 if(previousSceneEnd!==frameCount)issues.push({code:'FULL_TIMELINE_NOT_COVERED',
   expectedEndFrame:frameCount,actualEndFrame:previousSceneEnd});
 return {schema:'sues-film-brief-shot-coverage/v1',status:issues.length?'BLOCKED':'STRUCTURALLY_CONTIGUOUS_REQUIRES_RESOURCE_AND_FRAME_QA',
   frameCount,sceneCount:byScene.length,shotCount:byScene.reduce((n,x)=>n+x.shots.length,0),
   issues,scenes:byScene,approved:false,canExecute:false};
}
