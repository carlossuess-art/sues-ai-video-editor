/**
 * Insert Film Director progressive text as native FableCut V6 review media.
 * This stages only verified-source review layers, initially DISABLED. It does
 * not establish a transcript or permit publishing without human approval.
 * Synthetic QA text is allowed only in a separately named isolated project.
 */
const SOURCE_SHA='9e06f49c30731d8a57aed312cfb46281bcffb7b3d5d62bf5a2164333944ccaad';
const SHA=/^[a-f0-9]{64}$/;
export function stageNativeB02WordReview(project,{expectedRevision,compiled,sourceSha256,timelineFingerprint,syntheticOnly=false}={}){
 const safeName=syntheticOnly?'SUES B02 SYNTHETIC CAPTIONS QA ONLY':'SUES B02 VERIFIED CAPTIONS QA ONLY';
 if(!project||project.name!==safeName||!Number.isInteger(expectedRevision)||project.revision!==expectedRevision||
    project.width!==1080||project.height!==1920||project.fps!==30||
    sourceSha256!==SOURCE_SHA||!SHA.test(timelineFingerprint??'')||
    compiled?.status!=='REVIEW_LAYERS_DISABLED'||compiled.sourceSha256!==sourceSha256||
    compiled.timelineFingerprint!==timelineFingerprint||compiled.fps!==30||compiled.track!=='V6'||
    compiled.cinematicQA!==false||compiled.approvedByCarlos!==false||
    !Array.isArray(compiled.clips)||compiled.clips.length===0||compiled.clips.length>120||
    compiled.wordCount!==compiled.clips.length||compiled.manifest?.length!==compiled.clips.length)
  throw Error('B02 source, review or caption contract not verified');
 const clips=project.clips,source=project.media?.find(m=>m.id==='m_sues_158404_video');
 if(source?.src!=='/media/sues-158404-original.mp4'||
    !clips?.some(c=>c.id==='sues_video_source'&&c.mediaId===source.id&&c.locked)||
    !clips.some(c=>c.id==='sues_b02_child_review_only'&&c.track==='V2')||
    !clips.some(c=>c.id==='sues_b02_carlos_foreground_luma_qa'&&c.track==='V3'&&c.props?.matteTrack==='V4')||
    !clips.some(c=>c.id==='sues_hyperframes_gold_3d_review_only'&&c.track==='V5')||
    project.tracks?.some(t=>t.id==='V6')||clips.some(c=>c.track==='V6'||c.id.startsWith('sues_caption_word_')))
  throw Error('Original layered scene or free V6 track not intact');
 const next=structuredClone(project),used=new Set(clips.map(c=>c.id));let prevStart=-1;
 for(let i=0;i<compiled.clips.length;i++){
  const c=compiled.clips[i],m=compiled.manifest[i];
  if(!c||!m||c.id!=='sues_caption_word_'+String(i).padStart(4,'0')||used.has(c.id)||c.kind!=='text'||c.track!=='V6'||
    c.disabled!==true||c.locked===true||!Number.isFinite(c.start)||!Number.isFinite(c.duration)||
    c.start<9.5||c.duration<=0||c.start+c.duration>13.5+1e-8||c.start<=prevStart||
    !Number.isInteger(m.startFrame)||!Number.isInteger(m.endFrame)||
    Math.abs(c.start*30-m.startFrame)>1e-7||Math.abs((c.start+c.duration)*30-m.endFrame)>1e-7||
    m.wordIndex!==i||m.clipId!==c.id||typeof m.exactWord!=='string'||!m.exactWord.trim()||
    c.props?.text?.trim().length>36||!c.props?.text?.includes(m.exactWord.trim())||
    c.props.fontSize!==56||c.props.font!=='Montserrat'||c.props.boxFit!==true||
    !Number.isInteger(c.props.x)||!Number.isInteger(c.props.y)||
    Math.abs(c.props.x)>500||Math.abs(c.props.y)>1400)
   throw Error('Caption frame, text or source geometry is not eligible for safe staging at index '+i);
  used.add(c.id);prevStart=c.start;
  const copy=structuredClone(c);
  copy.name=(syntheticOnly?'SYNTHETIC QA ONLY · ':'REVIEW NOT APPROVED · ')+copy.name;
  copy.disabled=true;next.clips.push(copy);
 }
 next.tracks.unshift({id:'V6',kind:'video'});
 return {project:next,manifest:{schema:'sues-b02-native-caption-review/v1',sourceSha256,timelineFingerprint,
   syntheticOnly,wordCount:compiled.wordCount,track:'V6',fps:30,reviewStatus:'DISABLED_NOT_APPROVED',
   clipIds:compiled.clips.map(c=>c.id),sourceFrameWindow:[285,405],cinematicQA:false,approvedByCarlos:false}};
}
