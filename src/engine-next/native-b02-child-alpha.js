/** Strict opt-in visual QA swap: use one transparent RGBA child-group cutout on
 * FableCut V2 without changing the original JPG or the V3/V4 temporal matte.
 * No production write; no automatic approval or licensing determination.
 */
export function stageNativeB02ChildAlpha(project,{expectedRevision,alphaSrc,alphaBytes,sourceSha256,alphaSha256}={}){
 if(!project||project.name!=='SUES B02 Children Alpha Cutout QA ONLY'||
  !Number.isInteger(expectedRevision)||project.revision!==expectedRevision||
  project.width!==1080||project.height!==1920||project.fps!==30)throw Error('Only revision-matched isolated cutout QA project allowed');
 if(alphaSrc!=='/media/sues-b02-child-group-alpha-candidate.png'||
  !Number.isSafeInteger(alphaBytes)||alphaBytes<1000||
  ![sourceSha256,alphaSha256].every(x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x)))throw Error('Source-bound alpha evidence required');
 const kid=project.clips?.find(x=>x.id==='sues_b02_child_review_only'),fg=project.clips?.find(x=>x.id==='sues_b02_carlos_foreground_luma_qa'),matte=project.clips?.find(x=>x.id==='sues_b02_temporal_luma_qa'),gold=project.clips?.find(x=>x.id==='sues_hyperframes_gold_3d_review_only');
 if(!kid||kid.kind!=='image'||kid.track!=='V2'||kid.mediaId!=='m_sues_158404_child'||kid.start!==9.5||kid.duration!==4||kid.disabled===true||
   fg?.props?.matte!=='luma'||fg?.props?.matteTrack!=='V4'||fg?.track!=='V3'||matte?.track!=='V4'||gold?.track!=='V5'||
   project.media?.some(m=>m.id==='m_sues_child_group_modnet_alpha_qa'))throw Error('Native matte project or original photo not intact');
 const original=project.media?.find(x=>x.id==='m_sues_158404_child');if(original?.src!=='/media/sues-158404-child.jpg')throw Error('Original child photo source changed');
 const next=structuredClone(project),candidate=next.clips.find(x=>x.id===kid.id);
 next.media.push({id:'m_sues_child_group_modnet_alpha_qa',name:'MODNet group-alpha candidate NOT APPROVED',kind:'image',src:alphaSrc,width:512,height:896,size:alphaBytes,originalMediaId:original.id,originalSha256:sourceSha256,alphaSha256});
 candidate.mediaId='m_sues_child_group_modnet_alpha_qa';candidate.name='Children as transparent PNG · subject mask QA ONLY';
 const {masks,...otherProps}=candidate.props||{};candidate.props=otherProps;
 return next;
}
