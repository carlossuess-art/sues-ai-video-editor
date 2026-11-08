/** Explicit QA-only timeline swap from an existing PNG alpha cutout to a separate
 * edge-refined PNG. Preserves source media identity, undo path and the V4 matte.
 * Does not generate imagery, assert visual quality, or write to production.
 */
export function stageNativeB02EdgeRefinement(project,{expectedRevision,originalAlphaSha256,refinedSha256,refinedBytes,strength=0.5}={}) {
 const sha=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
 const verifiedOriginal='252939e06b787a17ef93de159f49f9e86731d7e628ced605b567968bd283fe5e';
 const verifiedRefined='aac8b173f301df941a5e9e882c17f7231d34b8cdb36e5991326b7313d7213ea0';
 if(!project||project.name!=='SUES B02 Despill RGB Edge QA ONLY'||
    !Number.isInteger(expectedRevision)||project.revision!==expectedRevision||
    project.width!==1080||project.height!==1920||project.fps!==30||
    strength!==0.5||!sha(originalAlphaSha256)||!sha(refinedSha256)||
    originalAlphaSha256!==verifiedOriginal||refinedSha256!==verifiedRefined||!Number.isSafeInteger(refinedBytes)||refinedBytes<1000) {
   throw Error('Only source-bound 50% B02 edge QA candidate allowed');
 }
 const clip=project.clips?.find(x=>x.id==='sues_b02_child_review_only');
 const source=project.media?.find(x=>x.id==='m_sues_child_group_modnet_alpha_qa');
 const fg=project.clips?.find(x=>x.id==='sues_b02_carlos_foreground_luma_qa');
 const matte=project.clips?.find(x=>x.id==='sues_b02_temporal_luma_qa');
 const gold=project.clips?.find(x=>x.id==='sues_hyperframes_gold_3d_review_only');
 if(clip?.mediaId!==source?.id||clip.track!=='V2'||clip.kind!=='image'||clip.start!==9.5||clip.duration!==4||
    source?.src!=='/media/sues-b02-child-group-alpha-candidate.png'||
    (source.alphaSha256!==undefined&&source.alphaSha256!==verifiedOriginal)||
    fg?.props?.matte!=='luma'||fg?.props?.matteTrack!=='V4'||fg.track!=='V3'||matte?.track!=='V4'||gold?.track!=='V5'||
    project.media?.some(x=>x.id==='m_sues_b02_child_refined50_qa'))throw Error('Original transparent timeline not intact');
 const next=structuredClone(project);
 next.media.push({id:'m_sues_b02_child_refined50_qa',kind:'image',name:'B02 50% RGB fringe candidate (alpha unchanged; unapproved)',
   src:'/media/sues-child-despill50.png',width:512,height:896,size:refinedBytes,
   fromMediaId:source.id,sourceAlphaSha256:originalAlphaSha256,sha256:refinedSha256,
   alphaByteExact:true,strength});
 const child=next.clips.find(x=>x.id===clip.id);
 child.mediaId='m_sues_b02_child_refined50_qa';child.name='Children RGB edge-refined 50% · QA NOT APPROVED';
 return next;
}
