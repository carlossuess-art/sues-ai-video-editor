/** Reversible QA candidate: reframe ONLY the children overlay of B02.
 * Film Director intent is to keep the speaker and child story visible;
 * acceptance requires viewing real FableCut program frames, never mere geometry.
 */
export function stageB02ChildReframe(project,{x,y,scale}={}){
 if(!project||project.width!==1080||project.height!==1920||project.fps!==30||
    project.inPoint!==9.5||project.outPoint!==13.5||!Array.isArray(project.media)||
    !Number.isInteger(project.revision)||project.revision<0||!Array.isArray(project.clips)||
    !Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(scale)||
    x<60||x>340||y< -340||y> -100||scale<.65||scale>.85)
    throw Error('Invalid B02 scene, revision or conservative QA geometry');
 const find=id=>project.clips.find(c=>c.id===id);
 const child=find('sues_b02_child_review_only'),carlos=find('sues_b02_carlos_foreground_luma_qa'),
       matte=find('sues_b02_temporal_luma_qa'),v1=find('sues_video_source'),voice=find('sues_audio_original'),gold=find('sues_hyperframes_gold_3d_review_only');
 if(!child||!carlos||!matte||!v1?.locked||!voice?.locked||gold?.disabled!==true||
    child.mediaId!=='m_sues_b02_child_refined50_qa'||
    project.media.filter(x=>x?.id===child.mediaId).length!==1||
    project.media.find(x=>x.id===child.mediaId).src!=='/media/sues-child-despill50.png'||
    child.start!==9.5||child.duration!==4||child.track!=='V2'||child.disabled===true||
    carlos.props?.matteTrack!==matte.track||
    child.props?.x!==340||child.props?.y!==-160||child.props?.scale!==.85||
    child.transitionIn?.type!=='fade'||child.transitionIn?.duration!==.3||
    child.transitionOut?.type!=='fade'||child.transitionOut?.duration!==.3)
    throw Error('Expected protected gold-off B02 fade baseline missing');
 const changed=structuredClone(project),v2=changed.clips.find(c=>c.id===child.id);
 v2.props.x=x;v2.props.y=y;v2.props.scale=scale;
 changed.revision+=1;
 changed.name='SUES B02 · child reframe preview x'+x+' y'+y+' s'+scale+' · NOT APPROVED';
 return {candidate:changed,proposal:{sceneId:'scene-02',operationId:'shot-2-2',clipId:child.id,
    before:{x:340,y:-160,scale:.85},after:{x,y,scale},
    status:'REAL_NATIVE_PREVIEW_REQUIRED_NOT_APPROVED',
    changesOnly:['sues_b02_child_review_only.props.x','sues_b02_child_review_only.props.y','sues_b02_child_review_only.props.scale'],
    preserved:['sues_video_source','sues_audio_original','sues_b02_carlos_foreground_luma_qa','sues_b02_temporal_luma_qa','sues_hyperframes_gold_3d_review_only'],
    caveats:['Check Carlos face and hand occlusions at 120 frames','Check children remain visibly behind Carlos','Read human voice before approving timing','Do not treat candidate geometry as artistic approval']}};
}
