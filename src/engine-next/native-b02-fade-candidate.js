/** Draft an editable FableCut fade transition without touching approved source, VO or matte.
 * SUES Film Director requires IN and OUT transitions for B02, but their
 * 9-frame duration is an experimental candidate pending visual approval.
 */
export function draftB02ChildFade(project,{fadeFrames=9}={}){
 if(!project||project.fps!==30||project.width!==1080||project.height!==1920||!Array.isArray(project.clips)||
  !Number.isInteger(project.revision)||project.revision<0||!Number.isInteger(fadeFrames)||fadeFrames<3||fadeFrames>15)
  throw Error('Invalid native B02 canvas, revision or fade duration');
 const get=id=>project.clips.find(x=>x?.id===id);
 const v=get('sues_video_source'),a=get('sues_audio_original'),child=get('sues_b02_child_review_only'),
  matte=get('sues_b02_temporal_luma_qa'),fg=get('sues_b02_carlos_foreground_luma_qa'),gold=get('sues_hyperframes_gold_3d_review_only');
 if(!v?.locked||!a?.locked||!child||!matte||!fg||!gold||gold.disabled!==true||
  child.track!=='V2'||child.start!==9.5||child.duration!==4||child.disabled===true||
  fg.props?.matteTrack!==matte.track)throw Error('B02 QA scene is not the isolated, protected composition');
 if(child.transitionIn||child.transitionOut)throw Error('Existing transitions require separate human review');
 const candidate=structuredClone(project);
 const target=candidate.clips.find(c=>c.id==='sues_b02_child_review_only');
 const seconds=fadeFrames/30;
 target.transitionIn={type:'fade',duration:seconds};
 target.transitionOut={type:'fade',duration:seconds};
 candidate.revision=project.revision+1;
 candidate.name='SUES B02 child soft fades '+fadeFrames+'f · QA CANDIDATE NOT APPROVED';
 return {candidate,proposal:{id:'shot-2-2',transitionInFrames:fadeFrames,transitionOutFrames:fadeFrames,
  durationSeconds:seconds,appliesToClip:target.id,unchangedLayerIds:[v.id,a.id,fg.id,matte.id,gold.id],
  state:'VISUAL_QA_PENDING_NOT_APPROVED',rationale:'Softly introduce and remove children while the foreground person matte remains stable'}};
}
