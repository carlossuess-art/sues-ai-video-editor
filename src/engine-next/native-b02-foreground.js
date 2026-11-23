/** Strict isolated proof adapter: stage the already licensed/identified gold 3D
 * above the temporal V4 matte using a dedicated V5 foreground. Not a release plan.
 */
export function stageNativeB02Foreground(project,{expectedRevision}={}){
 if(!project||!Number.isInteger(expectedRevision)||project.revision!==expectedRevision||
  !/^(SUES B02|SUES 158404 · NATIVE LUMA MATTE PROOF)/.test(project.name||'')||
  !/(QA ONLY|NOT APPROVED)$/.test(project.name||'')||
  project.width!==1080||project.height!==1920||project.fps!==30)throw Error('Only a revision-matched isolated QA composition is allowed');
 const required=[['sues_b02_carlos_foreground_luma_qa','V3'],['sues_b02_temporal_luma_qa','V4'],['sues_b02_child_review_only','V2']];
 for(const [id,track] of required){const c=project.clips?.find(x=>x.id===id);if(!c||c.track!==track||c.disabled===true||c.start!==9.5||c.duration!==4)throw Error('Native temporal scene incomplete');}
 const actor=project.clips.find(x=>x.id==='sues_b02_carlos_foreground_luma_qa');
 if(actor.props?.matte!=='luma'||actor.props?.matteTrack!=='V4')throw Error('Source track matte not linked to V4');
 const mat=project.clips.find(x=>x.id==='sues_b02_temporal_luma_qa');if(mat.mediaId!=='m_sues_b02_modnet_luma_qa')throw Error('Incorrect matte media');
 const clip=project.clips.find(x=>x.id==='sues_hyperframes_gold_3d_review_only');
 const medium=project.media?.find(x=>x.id==='m_sues_hyperframes_gold_3d_alpha_proof');
 if(clip?.disabled!==true||clip.kind!=='video'||clip.track!=='V4'||clip.start!==4||medium?.src!=='/media/sues-hyperframes-gold-3d-alpha.webm'||medium.duration!==1.2)throw Error('Original 3D proof unavailable or modified');
 if(project.tracks.some(x=>x.id==='V5'))throw Error('V5 already exists; refuse duplicate');
 const result=structuredClone(project);result.tracks.unshift({id:'V5',kind:'video'});
 const gold=result.clips.find(x=>x.id==='sues_hyperframes_gold_3d_review_only');
 gold.track='V5';gold.start=10.6;gold.duration=1.2;gold.in=0;gold.name='Gold 3D above Carlos · STAGING NOT APPROVED';
 delete gold.disabled;
 // Place the object above Carlos on the left; never obscure the child scene on the right.
 gold.props={...gold.props,x:-390,y:-650,scale:.6,opacity:1};
 return result;
}
