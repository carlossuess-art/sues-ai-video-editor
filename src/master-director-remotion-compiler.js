// Strict adapter: positioned visual layers with explicit supported keyframe curves.
// Unknown operations/parameters are rejected, never replaced or flattened.
const plain=x=>x&&typeof x==='object'&&!Array.isArray(x);
const only=(o,keys)=>plain(o)&&Object.keys(o).every(k=>keys.includes(k));
const fail=(issues,node,code)=>issues.push({operationId:node?.id??'graph',code});
const SHA=/^[a-f0-9]{64}$/;
const validShadow=s=>only(s,['color','offsetX','offsetY','blurPx'])&&/^#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?$/.test(s.color??'')&&
 Number.isFinite(s.offsetX)&&Math.abs(s.offsetX)<=500&&Number.isFinite(s.offsetY)&&Math.abs(s.offsetY)<=500&&Number.isFinite(s.blurPx)&&s.blurPx>=0&&s.blurPx<=200;
export function compileMasterDirectorRemotion(graph,{verifiedFonts={},verifiedAssets={},verifiedMasks={}}={}){
 const issues=[],layers=[];
 if(graph?.schema!=='sues-layer-graph/v1'||!Array.isArray(graph.nodes)||!graph.canvas||
    !Number.isInteger(graph.durationFrames)||graph.durationFrames<1||graph.fps!==30)
  return {status:'BLOCKED',issues:[{operationId:'graph',code:'INVALID_LAYER_GRAPH'}],composition:null};
 for(const node of graph.nodes){
  const v=node?.visual,p=node?.sourceParameters;
  const audio=node?.renderer==='remotion'&&['music','sfx'].includes(node.track)&&node.effect==='audio-clip-exact';
  if(audio){
   const id=node.resource?.id,a=verifiedAssets[id];
   if(!only(p,['gain','sourceInFrame'])||!Number.isFinite(p.gain)||p.gain<0||p.gain>2||
      !Number.isInteger(p.sourceInFrame)||p.sourceInFrame<0||!Number.isInteger(node.startFrame)||
      !Number.isInteger(node.endFrame)||node.startFrame<0||node.endFrame<=node.startFrame||node.endFrame>graph.durationFrames||
      !SHA.test(id??'')||node.resource?.sha256!==id||a?.sha256!==id||!['audio','sfx'].includes(a.kind)||
      a.rightsVerified!==true||a.commercialUseAllowed!==true||!Number.isFinite(a.duration)||
      (p.sourceInFrame+node.endFrame-node.startFrame)/graph.fps>a.duration+0.000001){
    fail(issues,node,'AUDIO_PARAMETERS_OR_RESOURCE_UNVERIFIED');continue;
   }
   layers.push({id:node.id,kind:'audio',assetId:id,startFrame:node.startFrame,endFrame:node.endFrame,
    sourceInFrame:p.sourceInFrame,gain:p.gain});continue;
  }
  const text=node?.renderer==='remotion'&&['captions','graphics'].includes(node.track)&&node.effect==='text';
  const image=node?.renderer==='remotion'&&['broll','graphics'].includes(node.track)&&node.effect==='image-exact';
  const video=node?.renderer==='remotion'&&['broll','graphics'].includes(node.track)&&node.effect==='video-exact';
  if(!text&&!image&&!video){fail(issues,node,'REMOTION_OPERATION_UNSUPPORTED');continue;}
  if(!only(p,text?['text','visual']:video?['fit','visual','sourceInFrame','muted']:['fit','visual'])||JSON.stringify(p.visual)!==JSON.stringify(v)||
     !only(v,text?['rect','zIndex','opacity','typography','keyframes','mask','dropShadow']:['rect','zIndex','opacity','keyframes','mask','dropShadow'])||
     (v.dropShadow!==undefined&&(!validShadow(v.dropShadow)||v.mask!==undefined))||
     !only(v.rect,['x','y','width','height'])||
     (text&&(!only(v.typography,['family','sizePx','weight','color'])||typeof p.text!=='string'||!p.text.length||p.text.length>500))||
     ((image||video)&&p.fit!=='fill')||
     (video&&(!Number.isInteger(p.sourceInFrame)||p.sourceInFrame<0||p.muted!==true))){fail(issues,node,'LAYER_PARAMETERS_UNSUPPORTED');continue;}
  const font=text?verifiedFonts[v.typography.family+':'+v.typography.weight]:null;
  if(text&&(!font||!SHA.test(font.sha256??''))){fail(issues,node,'FONT_NOT_VERIFIED');continue;}
  const id=node.resource?.id,asset=verifiedAssets[id];
  if(image&&(!SHA.test(id??'')||node.resource?.sha256!==id||asset?.sha256!==id||asset?.kind!=='image'||
     asset?.rightsVerified!==true||asset?.commercialUseAllowed!==true))
   {fail(issues,node,'IMAGE_RESOURCE_UNVERIFIED');continue;}
  let maskAssetId=null,maskFrameAssetIds=null;
  if(v.mask!==undefined){
   const m=v.mask,proof=verifiedMasks[m?.proofId];
   if(!only(m,['proofId','mode'])||m.mode!=='alpha-keep'||proof?.verified!==true||
      proof.sourceSha256!==graph.sourceSha256||!Number.isFinite(proof.start)||!Number.isFinite(proof.end)||
      proof.start>node.startFrame/graph.fps||proof.end<node.endFrame/graph.fps){
    fail(issues,node,'MASK_EVIDENCE_UNVERIFIED');continue;
   }
   // Dynamic masks are trusted proof records, not a user-supplied list of paths.
   // One verified image per output frame; no interpolation or repeated frame fallback.
   if(Object.hasOwn(proof,'frameAssetIds')){
    const count=node.endFrame-node.startFrame;
    if(!Array.isArray(proof.frameAssetIds)||proof.assetId!==undefined||proof.coordinateSpace!=='layer'||proof.fps!==graph.fps||proof.startFrame!==node.startFrame||
       proof.endFrame!==node.endFrame||!Number.isInteger(count)||count<1||count>120||proof.frameAssetIds.length!==count||
       proof.frameAssetIds.some(id=>!SHA.test(id??'')||verifiedAssets[id]?.sha256!==id||
        verifiedAssets[id]?.kind!=='image'||verifiedAssets[id]?.rightsVerified!==true||verifiedAssets[id]?.commercialUseAllowed!==true)){
     fail(issues,node,'DYNAMIC_MASK_EVIDENCE_UNVERIFIED');continue;
    }
    maskFrameAssetIds=[...proof.frameAssetIds];
   }else{
    const id=proof.assetId,a=verifiedAssets[id];
    if(!SHA.test(id??'')||a?.sha256!==id||a?.kind!=='image'||a?.rightsVerified!==true||a?.commercialUseAllowed!==true)
     {fail(issues,node,'MASK_RESOURCE_UNVERIFIED');continue;}
    maskAssetId=id;
   }
  }
  if(video&&(!SHA.test(id??'')||node.resource?.sha256!==id||asset?.sha256!==id||asset?.kind!=='video'||
     asset?.rightsVerified!==true||asset?.commercialUseAllowed!==true||!Number.isFinite(asset.duration)||
     (p.sourceInFrame+node.endFrame-node.startFrame)/graph.fps>asset.duration+0.000001))
   {fail(issues,node,'VIDEO_RESOURCE_UNVERIFIED');continue;}
  if(!Array.isArray(v.keyframes)||v.keyframes.some(k=>!only(k,['atFrame','easing','x','y','opacity','scale','rotation'])||
      !['linear','ease-in','ease-out','ease-in-out'].includes(k.easing??'linear'))){fail(issues,node,'ANIMATION_UNSUPPORTED');continue;}
  if(!Number.isInteger(node.startFrame)||!Number.isInteger(node.endFrame)||node.startFrame<0||
     node.endFrame<=node.startFrame||node.endFrame>graph.durationFrames)
   {fail(issues,node,'TIMELINE_INVALID');continue;}
  layers.push({id:node.id,kind:text?'text':video?'video':'image',startFrame:node.startFrame,endFrame:node.endFrame,
   ...(text?{text:p.text,fontAssetId:font.sha256}:video?{assetId:id,sourceInFrame:p.sourceInFrame,muted:true}:{assetId:id}),...(maskAssetId?{maskAssetId}:{}),...(maskFrameAssetIds?{maskFrameAssetIds}:{}),visual:structuredClone(v)});
 }
 if(issues.length)return {status:'BLOCKED',issues,composition:null};
 return {status:'READY_FOR_REMOTION_STAGING',issues:[],composition:{schema:'sues-remotion-layers/v1',
  planFingerprint:graph.planFingerprint,sourceSha256:graph.sourceSha256,canvas:graph.canvas,
  fps:graph.fps,durationFrames:graph.durationFrames,layers}};
}
