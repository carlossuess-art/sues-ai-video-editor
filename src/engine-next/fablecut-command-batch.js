// Private, revision-bound batch adapter. Native project-ops is injected by the
// host; no arbitrary MCP tool, force flag, file path or creative fallback.
import {createHash} from 'node:crypto';
import {inspectMasterDirectorStory} from '../master-director-story.js';
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const id=x=>typeof x==='string'&&/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,79}$/.test(x);
const fail=m=>{throw Error(m)};
const finite=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
const fields=(o,allowed,required=[])=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).every(k=>allowed.includes(k))&&required.every(k=>Object.hasOwn(o,k));
const aligned=(v,fps)=>finite(v,0,86400)&&Math.abs(v*fps-Math.round(v*fps))<1e-4;
const blends=['normal','screen','lighter','multiply','overlay','lighten','darken'];
const eases=['linear','ease-in','ease-out','ease-in-out'];
const transitions=['fade','slide-left','slide-right','slide-up','slide-down','zoom','wipe-left','whip','glitch'];
export const COMMANDS={
 add_sfx:['assetId','start','duration','track','sourceIn','volume'],
 add_music:['assetId','start','duration','track','sourceIn','volume'],
 add_broll:['assetId','start','duration','track','sourceIn','x','y','scale','opacity','fit'],
 add_image:['assetId','start','duration','track','x','y','scale','opacity','fit'],
 add_svg:['assetId','start','duration','track','x','y','scale','opacity','fit'],
 add_vfx:['assetId','start','duration','track','sourceIn','x','y','scale','opacity','fit','blend'],
 set_transform:['clipId','x','y','scale','opacity'],
 animate:['clipId','channel','keys'],
 set_volume:['clipId','volume'],
 duck:['clipId','start','duration','amount','attack','release'],
 transition:['clipId','side','type','duration'],
 move:['clipId','start'],
 split:['clipId','at'],
 trim:['clipId','duration'],
 replace:['clipId','assetId','sourceIn'],
 remove:['clipId'],
 add_title:['start','duration','track','text','x','y','fontSize','color','font'],
 add_caption:['start','duration','track','text','x','y','fontSize','color','font','wordTimes','wordIds'],
 dissolve:['clipId','leftClipId','duration'],
 set_visual_effect:['clipId','brightness','contrast','saturation','blur','shake','shakeSpeed','rgbSplit','rotation'],
 add_shape:['start','duration','track','x','y','scale','opacity','shapes'],
 set_mask:['clipId','mask'],
 add_matte:['assetId','start','duration','track','sourceIn','x','y','scale','opacity','fit'],
 set_matte:['clipId','matteClipId','matteTrack','mode','proofId'],
};
export const projectFingerprint=hash;
export function applyCommandBatch(project,request,{native,resolveAsset}={}){
 if(!native?.applyPatch||!native?.checkProject||typeof resolveAsset!=='function')fail('Native engine and trusted asset resolver required');
 if(!fields(request,['baseRevision','baseFingerprint','commands'],['baseRevision','baseFingerprint','commands'])||!Number.isInteger(project.revision)||request.baseRevision!==project.revision||request.baseFingerprint!==hash(project))fail('STALE_REVISION_OR_FINGERPRINT');
 if(!Number.isInteger(project.fps)||project.fps<1||project.fps>120||!Array.isArray(project.clips)||!Array.isArray(project.tracks)||!Array.isArray(project.media))fail('INVALID_PROJECT');
 if(!Array.isArray(request.commands)||!request.commands.length||request.commands.length>100)fail('1..100 commands required');
 const p=structuredClone(project),fps=p.fps,limit=Math.max(0,...p.clips.map(c=>c.start+c.duration)),receipts=[],assets=[],patchOps=[],seen=new Set();
 const assertProjection=(wanted,actual)=>{
  if(typeof wanted==='number'){if(!Number.isFinite(wanted)||typeof actual!=='number'||Math.abs(wanted-actual)>1e-4)fail('NATIVE_NORMALIZATION_CHANGED_VALUE');return}
  if(Array.isArray(wanted)){if(!Array.isArray(actual)||wanted.length!==actual.length)fail('NATIVE_NORMALIZATION_CHANGED_ARRAY');wanted.forEach((x,i)=>assertProjection(x,actual[i]));return}
  if(wanted&&typeof wanted==='object'){if(!actual||typeof actual!=='object')fail('NATIVE_NORMALIZATION_DROPPED_OBJECT');for(const [k,v] of Object.entries(wanted))assertProjection(v,actual[k]);return}
  if(wanted!==actual)fail('NATIVE_NORMALIZATION_CHANGED_VALUE');
 };
 const frameKeys=(x,duration)=>{if(x.keys!==undefined){if(!Array.isArray(x.keys)||x.keys.length>120)fail('INVALID_LAYER_KEYS');let last=-1;for(const k of x.keys){if(!aligned(k.t,fps)||k.t<=last||k.t>duration+1e-6)fail('INVALID_LAYER_KEYFRAME');last=k.t}}if(Array.isArray(x.items))x.items.forEach(i=>frameKeys(i,duration));};
 const range=(start,duration)=>{if(!aligned(start,fps)||!aligned(duration,fps)||duration<=0||start+duration>limit+1e-6)fail('INVALID_FRAME_RANGE')};
 const lane=(track,kind)=>{if(!p.tracks.some(t=>t.id===track&&t.kind===kind)||p.lockedTracks?.includes(track)||p.disabledTracks?.includes(track))fail('INVALID_OR_LOCKED_TRACK')};
 const free=(track,start,duration,except)=>{if(p.clips.some(c=>c.id!==except&&c.track===track&&!c.disabled&&c.start<start+duration-1e-6&&c.start+c.duration>start+1e-6))fail('TRACK_OVERLAP')};
 const clipOf=cid=>{const c=p.clips.find(c=>c.id===cid);if(!c||c.locked||c.disabled||p.lockedTracks?.includes(c.track)||p.disabledTracks?.includes(c.track))fail('CLIP_MISSING_LOCKED_OR_DISABLED');return c};
 const numeric=(v,min,max,name)=>{if(!finite(v,min,max))fail('INVALID_'+name);return v};
 const transform=c=>{const v={};for(const [k,min,max] of [['x',-10000,10000],['y',-10000,10000],['scale',.01,10],['opacity',0,1]])if(k in c)v[k]=numeric(c[k],min,max,k);return v};
 for(const c of request.commands){
  try {
  if(!id(c?.id)||seen.has(c.id)||!Object.hasOwn(COMMANDS,c.action)||!fields(c,['id','action','expectedSha256',...COMMANDS[c.action]],['id','action']))fail('UNKNOWN_OR_DUPLICATE_COMMAND');
  seen.add(c.id);const ops=[],cid='sues_cmd_'+hash(c.id).slice(0,24);let target=cid;
  if(['add_sfx','add_music','add_broll','add_vfx','add_image','add_svg','add_matte'].includes(c.action)){
   const audio=['add_sfx','add_music'].includes(c.action);range(c.start,c.duration);lane(c.track,audio?'audio':'video');free(c.track,c.start,c.duration);
   if(!id(c.assetId))fail('INVALID_ASSET_ID');
   const a=resolveAsset(c.assetId);if(!a||a.id!==c.assetId||!['audio','video','image','svg'].includes(a.kind)||!/^\/media\/[A-Za-z0-9_.-]+$/.test(a.src)||!a.verifiedPhysical)fail('ASSET_UNVERIFIED');
   if(c.expectedSha256!==undefined&&(!/^[a-f0-9]{64}$/.test(c.expectedSha256)||a.sha256!==c.expectedSha256||a.rightsVerified!==true))fail('ASSET_HASH_OR_RIGHTS_UNVERIFIED');
   if(audio?a.kind!=='audio':c.action==='add_broll'?a.kind!=='video':c.action==='add_image'?a.kind!=='image':c.action==='add_svg'?a.kind!=='svg':c.action==='add_matte'?!['video','image'].includes(a.kind):a.kind==='audio')fail('ASSET_KIND_MISMATCH');
   const sourceIn=c.sourceIn??0;if(!aligned(sourceIn,fps)||(['image','svg'].includes(a.kind)&&sourceIn!==0)||(a.kind!=='image'&&a.kind!=='svg'&&(!finite(a.duration,0,86400)||sourceIn+c.duration>a.duration+1e-6)))fail('ASSET_SOURCE_RANGE');
   const mid='sues_asset_'+hash(a.id).slice(0,24),prior=p.media.find(m=>m.id===mid);
   if(prior&&prior.src!==a.src)fail('MEDIA_COLLISION');
   if(prior&&(prior.kind!==a.kind||prior.duration!==a.duration))fail('MEDIA_METADATA_COLLISION');
   if(!prior)ops.push({op:'addMedia',media:{id:mid,name:a.name,kind:a.kind,src:a.src,duration:a.duration,size:a.size,...(a.width?{width:a.width,height:a.height}:{}),...(a.fps?{fps:a.fps}:{})}});
   const props=audio?{volume:numeric(c.volume,0,1,'volume'),gain:0,duck:0,speed:1}:{...transform(c),volume:0,speed:1,fit:c.fit??'contain',blend:c.blend??'normal'};
   if(!audio&&(!['contain','cover','fill'].includes(props.fit)||!blends.includes(props.blend)))fail('INVALID_COMPOSITION');
   ops.push({op:'addClip',clip:{id:cid,mediaId:mid,kind:a.kind,track:c.track,start:c.start,in:sourceIn,duration:c.duration,name:c.id,props}});assets.push(a);
  }else if(c.action==='add_shape'){
   range(c.start,c.duration);lane(c.track,'video');free(c.track,c.start,c.duration);
   if(!Array.isArray(c.shapes)||!c.shapes.length||c.shapes.length>32||JSON.stringify(c.shapes).length>20000)fail('INVALID_SHAPE_LAYER');
   for(const shape of c.shapes)frameKeys(shape,c.duration);
   ops.push({op:'addClip',clip:{id:cid,kind:'shape',track:c.track,start:c.start,in:0,duration:c.duration,name:c.id,props:{...transform(c),shapes:structuredClone(c.shapes)}}});
  }else if(['add_title','add_caption'].includes(c.action)){
   range(c.start,c.duration);lane(c.track,'video');free(c.track,c.start,c.duration);
   if(typeof c.text!=='string'||!c.text.trim()||c.text.length>500||typeof c.font!=='string'||!c.font.trim()||!/^#[0-9a-f]{6}$/i.test(c.color))fail('INVALID_TITLE');
   const props={...transform(c),text:c.text,font:c.font,fontSize:numeric(c.fontSize,1,500,'fontSize'),color:c.color};
   if(c.action==='add_caption'){
    const words=c.text.trim().split(/\s+/);
    if(words.length>9||c.text.split('\n').length>2||!finite(c.x,-10000,10000)||!finite(c.y,-10000,10000)||!Array.isArray(c.wordTimes)||c.wordTimes.length!==words.length||!Array.isArray(c.wordIds)||c.wordIds.length!==words.length||new Set(c.wordIds).size!==words.length||!c.wordIds.every(id))fail('INVALID_CAPTION_CLOCK');
    let end=0;for(const pair of c.wordTimes){if(!Array.isArray(pair)||pair.length!==2||!aligned(pair[0],fps)||!aligned(pair[1],fps)||pair[0]<end-1e-6||pair[1]<=pair[0]||pair[1]>c.duration+1e-6)fail('INVALID_CAPTION_WORD_RANGE');end=pair[1]}
    Object.assign(props,{caption:true,textAnim:'word-pop',wordTimes:structuredClone(c.wordTimes),bold:true});
   }
   ops.push({op:'addClip',clip:{id:cid,kind:'text',track:c.track,start:c.start,in:0,duration:c.duration,name:c.id,props}});
  }else{
   const cl=clipOf(c.clipId);target=cl.id;const audio=cl.kind==='audio';
   if(c.action==='set_transform'){if(audio)fail('NOT_VISUAL');const props=transform(c);if(!Object.keys(props).length||Object.keys(props).some(k=>cl.keyframes?.[k]?.length))fail('KEYFRAMED_OR_EMPTY_TRANSFORM');ops.push({op:'updateClip',id:target,set:{props}})}
   if(c.action==='set_visual_effect'){
    if(audio)fail('NOT_VISUAL');
    const props={};for(const [k,min,max] of [['brightness',0,200],['contrast',0,200],['saturation',0,300],['blur',0,100],['shake',0,100],['shakeSpeed',0,100],['rgbSplit',0,100],['rotation',-360,360]])if(k in c){if(cl.keyframes?.[k]?.length)fail('EXISTING_EFFECT_KEYFRAMES');props[k]=numeric(c[k],min,max,k)}
    if(!Object.keys(props).length)fail('EMPTY_VISUAL_EFFECT');
    ops.push({op:'updateClip',id:target,set:{props}});
   }
   if(c.action==='dissolve'){
    const left=clipOf(c.leftClipId);
    const a=p.tracks.findIndex(t=>t.id===cl.track),b=p.tracks.findIndex(t=>t.id===left.track);
    if(!['video','image'].includes(cl.kind)||!['video','image'].includes(left.kind)||cl.id===left.id||a<0||b<0||a>=b||cl.transitionIn||left.transitionOut||cl.props?.matte||left.props?.matte||cl.props?.opacity!==undefined&&cl.props.opacity!==1||left.props?.opacity!==undefined&&left.props.opacity!==1||cl.keyframes?.opacity?.length||left.keyframes?.opacity?.length||!aligned(c.duration,fps)||c.duration<.1||cl.start<=left.start||Math.abs(left.start+left.duration-cl.start-c.duration)>1e-6||cl.duration<c.duration)fail('DISSOLVE_REQUIRES_EXACT_OVERLAPPING_LAYERS');
    ops.push({op:'updateClip',id:target,set:{transitionIn:{type:'fade',duration:c.duration}}});
   }
   if(c.action==='set_mask'){
    const m=c.mask;
    if(audio||!fields(m,['name','shape','mode','x','y','w','h','scale','rotation','opacity','feather','expand','invert','points','keys'],['name','shape','mode','x','y','opacity','feather'])||!id(m.name)||!['rect','ellipse','bezier'].includes(m.shape)||!['add','subtract','intersect','difference'].includes(m.mode)||cl.props?.masks?.some(x=>x.name===m.name))fail('INVALID_OR_EXISTING_MASK');
    if(!finite(m.x,-2,3)||!finite(m.y,-2,3)||!finite(m.opacity,0,1)||!finite(m.feather,0,1000)||m.shape!=='bezier'&&(!finite(m.w,.001,8)||!finite(m.h,.001,8))||m.shape==='bezier'&&(!Array.isArray(m.points)||m.points.length<3))fail('INVALID_MASK_GEOMETRY');
    frameKeys(m,cl.duration);
    ops.push({op:'setMask',id:target,set:structuredClone(m)});
   }
   if(c.action==='set_matte'){
    const m=clipOf(c.matteClipId),a=p.tracks.findIndex(t=>t.id===m.track),b=p.tracks.findIndex(t=>t.id===cl.track);
    if(audio||!['video','image'].includes(m.kind)||m.id===cl.id||m.track!==c.matteTrack||a<0||b<0||a>=b||cl.props?.matte||!['alpha','alpha-inverted','luma','luma-inverted'].includes(c.mode)||!id(c.proofId)||Math.abs(m.start-cl.start)>1e-6||Math.abs(m.duration-cl.duration)>1e-6||p.clips.some(x=>x.id!==m.id&&x.track===m.track&&!x.disabled&&x.start<cl.start+cl.duration-1e-6&&x.start+x.duration>cl.start+1e-6))fail('INVALID_MATTE_BINDING');
    ops.push({op:'setMatte',id:target,matte:c.mode,track:c.matteTrack});
   }
   if(c.action==='set_volume'){if(!audio||cl.keyframes?.volume?.length)fail('NOT_AUDIO_OR_KEYFRAMED');ops.push({op:'updateClip',id:target,set:{props:{volume:numeric(c.volume,0,1,'volume')}}})}
   if(c.action==='animate'){
    const limits={x:[-10000,10000],y:[-10000,10000],scale:[.01,10],opacity:[0,1],volume:[0,1],duck:[-40,0],shake:[0,100]};
    if(!Object.hasOwn(limits,c.channel)||audio!==['volume','duck'].includes(c.channel)||!Array.isArray(c.keys)||c.keys.length<2||c.keys.length>120||cl.keyframes?.[c.channel]?.length)fail('INVALID_OR_EXISTING_ANIMATION');
    let last=-1;for(const k of c.keys){if(!fields(k,['t','v','ease'],['t','v'])||!aligned(k.t,fps)||k.t<=last||k.t>cl.duration+1e-6||!finite(k.v,...limits[c.channel])||(k.ease!==undefined&&!eases.includes(k.ease)))fail('INVALID_KEYFRAME');last=k.t}
    ops.push({op:'updateClip',id:target,set:{keyframes:{...cl.keyframes,[c.channel]:structuredClone(c.keys)}}});
   }
   if(c.action==='duck'){
    if(!audio||cl.keyframes?.duck?.length)fail('NOT_AUDIO_OR_EXISTING_DUCK');range(c.start,c.duration);const a=c.start-cl.start,b=a+c.duration;
    if(!aligned(a,fps)||!aligned(c.attack,fps)||!aligned(c.release,fps)||c.attack<=0||c.release<=0||a-c.attack<0||b+c.release>cl.duration+1e-6)fail('DUCK_OUTSIDE_CLIP');
    const amount=numeric(c.amount,-40,0,'duck');ops.push({op:'updateClip',id:target,set:{keyframes:{...cl.keyframes,duck:[{t:a-c.attack,v:0},{t:a,v:amount},{t:b,v:amount},{t:b+c.release,v:0}]}}});
   }
   if(c.action==='transition'){
    if(!['in','out'].includes(c.side)||!transitions.includes(c.type)||(audio&&c.type!=='fade')||!aligned(c.duration,fps)||c.duration<.1||c.duration>cl.duration||cl['transition'+(c.side==='in'?'In':'Out')])fail('INVALID_OR_EXISTING_TRANSITION');
    ops.push({op:'updateClip',id:target,set:{[c.side==='in'?'transitionIn':'transitionOut']:{type:c.type,duration:c.duration}}});
   }
   if(['split','trim','replace'].includes(c.action)){
    if(!['audio','video','image','svg'].includes(cl.kind)||cl.linkGroup||cl.linkedId||cl.parent||p.clips.some(x=>x.parent===target)||Object.values(cl.keyframes??{}).some(a=>a?.length)||cl.transitionIn||cl.transitionOut||cl.props?.masks?.length||cl.props?.tracks?.length||(cl.props?.speed??1)!==1)fail('COMPLEX_CLIP_EDIT_UNSUPPORTED');
    if(c.action==='split'){
     if(!aligned(c.at,fps)||!aligned(cl.start,fps)||!aligned(cl.duration,fps)||!aligned(cl.in??0,fps)||c.at<=cl.start||c.at>=cl.start+cl.duration)fail('INVALID_SPLIT_FRAME');
     const left=c.at-cl.start,right=cl.duration-left;if(left<.05||right<.05)fail('SPLIT_TOO_SHORT');
     ops.push({op:'updateClip',id:target,set:{duration:left}},{op:'addClip',clip:{...structuredClone(cl),id:cid,start:c.at,in:(cl.in??0)+left,duration:right}});target=cid;
    }else if(c.action==='trim'){
     if(!aligned(c.duration,fps)||c.duration<.05||c.duration>=cl.duration)fail('ONLY_SHORTEN_CLIP');
     ops.push({op:'updateClip',id:target,set:{duration:c.duration}});
    }else{
     if(!id(c.assetId))fail('INVALID_ASSET_ID');const a=resolveAsset(c.assetId),sourceIn=c.sourceIn??0;
     if(!a||a.id!==c.assetId||!a.verifiedPhysical||a.kind!==cl.kind||!/^\/media\/[A-Za-z0-9_.-]+$/.test(a.src)||!aligned(sourceIn,fps)||(['image','svg'].includes(a.kind)&&sourceIn!==0)||(['video','audio'].includes(a.kind)&&(!finite(a.duration,0,86400)||sourceIn+cl.duration>a.duration+1e-6)))fail('REPLACEMENT_INCOMPATIBLE');
     if(c.expectedSha256!==undefined&&(a.sha256!==c.expectedSha256||a.rightsVerified!==true))fail('ASSET_HASH_OR_RIGHTS_UNVERIFIED');
     const mid='sues_asset_'+hash(a.id).slice(0,24),prior=p.media.find(m=>m.id===mid);
     if(prior&&(prior.src!==a.src||prior.kind!==a.kind||prior.duration!==a.duration))fail('MEDIA_COLLISION');
     if(!prior)ops.push({op:'addMedia',media:{id:mid,name:a.name,kind:a.kind,src:a.src,duration:a.duration,size:a.size,...(a.width?{width:a.width,height:a.height}:{}),...(a.fps?{fps:a.fps}:{})}});
     ops.push({op:'updateClip',id:target,set:{mediaId:mid,in:sourceIn}});assets.push(a);
    }
   }
   if(c.action==='move'){range(c.start,cl.duration);if(cl.linkGroup||cl.linkedId||cl.parent||p.clips.some(x=>x.parent===target))fail('LINKED_MOVE_UNSUPPORTED');free(cl.track,c.start,cl.duration,target);ops.push({op:'updateClip',id:target,set:{start:c.start}})}
   if(c.action==='remove'){if(!target.startsWith('sues_cmd_')||cl.linkGroup||cl.linkedId||p.clips.some(x=>x.parent===target))fail('REMOVE_ONLY_INDEPENDENT_ADAPTER_CLIP');ops.push({op:'removeClip',id:target})}
  }
  patchOps.push(...structuredClone(ops));const result=native.applyPatch(p,ops,{});native.checkProject(p);
  const applied=p.clips.find(x=>x.id===target);
  if(c.action==='add_shape')assertProjection(c.shapes,applied?.props?.shapes);
  if(c.action==='set_mask')assertProjection(c.mask,applied?.props?.masks?.find(m=>m.name===c.mask.name));
  if(c.action==='set_matte'&&(applied?.props?.matte!==c.mode||applied?.props?.matteTrack!==c.matteTrack))fail('NATIVE_MATTE_CHANGED');
  receipts.push({operationId:c.id,action:c.action,clipId:target,status:'NATIVE_PROJECT_APPLIED_NOT_RENDERED',notes:result.notes});
  } catch(error) { error.operationId=c?.id??null; throw error; }
 }
 p.revision=project.revision+1;return {project:p,receipts,assets,patchOps,undo:{baseFingerprint:hash(p),project:structuredClone(project)}};
}
export function undoCommandBatch(current,undo){if(hash(current)!==undo?.baseFingerprint)fail('STALE_UNDO');const p=structuredClone(undo.project);p.revision=current.revision+1;return p}
// Only explicit lossless mappings. The approval check is an external dependency,
// never a boolean supplied by the creative story. No partial execution.
export async function prepareStoryBatch(story,{registry,authorize,project,bindings}={}){
 const audit=inspectMasterDirectorStory(story,registry);
 if(audit.status!=='READY_FOR_PLAN_REVIEW') return {status:'BLOCKED',issues:audit.issues,assetRequests:audit.assetRequests,story};
 if(typeof authorize!=='function'||await authorize(story,registry)!==true)return {status:'BLOCKED',issues:[{code:'APPROVAL_REQUIRED'}],story};
 const issues=[],commands=[],virtualClips=new Map();
 if(!project||project.fps!==story.timeline.fps||Math.abs(Math.max(0,...project.clips.map(c=>c.start+c.duration))-story.timeline.duration)>1e-6||registry.projectFingerprint!==hash(project))return {status:'BLOCKED',issues:[{code:'NATIVE_PROJECT_BINDING_STALE'}],story};
 const ordered=[],visited=new Set(),byId=new Map(story.operations.map(o=>[o.id,o]));
 function visit(o){if(visited.has(o.id))return;for(const dep of o.dependsOn)visit(byId.get(dep));visited.add(o.id);ordered.push(o)}
 for(const o of story.operations)visit(o);
 for(const o of ordered){
  const b=bindings?.[o.id],p=o.parameters,r=story.resources?.find(r=>r.id===o.resourceRef);
  if(o.renderer==='native'&&o.effect==='fablecut-command-exact-v1'){
   // This extension is capability-gated by the canonical story inspector.
   // No creative defaults: the complete command is part of approved parameters.
   const c=p?.command,virtual=virtualClips.get(c?.clipId),cl=project.clips.find(x=>x.id===c?.clipId)??virtual?.clip;
   const add=['add_sfx','add_music','add_broll','add_vfx','add_image','add_svg','add_title','add_caption','add_shape','add_matte'];
   const allowed={add_sfx:['sfx'],add_music:['music'],add_broll:['broll'],add_vfx:['graphics','transition'],add_image:['graphics'],add_svg:['graphics'],add_title:['graphics'],add_caption:['captions'],add_shape:['graphics'],set_mask:['subject','graphics','broll'],add_matte:['subject'],set_matte:['subject','graphics','broll'],dissolve:['transition'],set_visual_effect:['camera','subject','graphics','broll'],set_transform:['camera','subject','graphics','broll'],animate:['camera','subject','graphics','broll','music','sfx','voice'],set_volume:['music','sfx','voice'],duck:['music'],transition:['transition','music','sfx','broll','graphics']};
   const equal=(a,b)=>Math.abs(a-b)<1e-6;
   const targetTrack=registry.nativeTrackRoles?.[c?.track??cl?.track];
   let valid=fields(p,['command'],['command'])&&c&&fields(c,['action',...(COMMANDS[c.action]??[])],['action'])&&allowed[c.action]?.includes(o.track)&&targetTrack===o.track&&(!virtual||o.dependsOn.includes(virtual.operationId));
   if(c&&add.includes(c.action))valid=valid&&equal(c.start,o.start)&&equal(c.start+c.duration,o.end);
   else if(c?.action==='duck')valid=valid&&!!cl&&equal(c.start,o.start)&&equal(c.start+c.duration,o.end);
   else if(c?.action==='dissolve')valid=valid&&!!cl&&equal(cl.start,o.start)&&equal(cl.start+c.duration,o.end);
   else if(c?.action==='transition')valid=valid&&!!cl&&(c.side==='in'?equal(cl.start,o.start)&&equal(cl.start+c.duration,o.end):equal(cl.start+cl.duration-c.duration,o.start)&&equal(cl.start+cl.duration,o.end));
   else valid=valid&&!!cl&&equal(cl.start,o.start)&&equal(cl.start+cl.duration,o.end);
   if(c&&['add_sfx','add_music','add_broll','add_vfx','add_image','add_svg','add_matte'].includes(c.action)){
    valid=valid&&r?.source==='library'&&c.assetId===r.assetId;
   }else if(o.resourceRef){
    const existing=registry.nativeMediaBindings?.[cl?.mediaId];
    valid=valid&&r?.source==='library'&&existing?.assetId===r.assetId&&existing?.sha256===r.expectedSha256;
   }else valid=valid&&!o.resourceRef;
   if(c?.action==='set_matte'){
    const vm=virtualClips.get(c.matteClipId),matte=project.clips.find(x=>x.id===c.matteClipId)??vm?.clip;
    const proof=registry.maskEvidence?.[c.proofId],binding=vm?{assetId:vm.assetId,sha256:vm.expectedSha256}:registry.nativeMediaBindings?.[matte?.mediaId];
    valid=valid&&matte&&(!vm||o.dependsOn.includes(vm.operationId))&&proof?.verified===true&&proof.sourceSha256===story.sourceSha256&&proof.timelineFingerprint===story.timeline.fingerprint&&proof.assetId===binding?.assetId&&proof.assetId===binding?.sha256&&equal(proof.start,o.start)&&equal(proof.end,o.end)&&typeof proof.evidenceRef==='string'&&!!proof.evidenceRef.trim();
   }
   if(c?.action==='add_caption'){
    const words=typeof c.text==='string'?c.text.trim().split(/\s+/):[];
    valid=valid&&Array.isArray(c.wordIds)&&Array.isArray(c.wordTimes)&&c.wordIds.length===words.length&&c.wordTimes.length===words.length&&
     !!registry.verifiedFonts?.[c.font+':700']&&c.wordIds.every((id,i)=>{
      const w=registry.wordAnchors?.[id],pair=c.wordTimes[i],fps=story.timeline.fps;
      return w&&w.text===words[i]&&Number.isFinite(w.time)&&Number.isFinite(w.end)&&Array.isArray(pair)&&equal(c.start+pair[0],Math.round(w.time*fps)/fps)&&equal(c.start+pair[1],Math.round(w.end*fps)/fps);
     });
   }
   if(o.speechAnchor){
    const w=registry.wordAnchors?.[o.speechAnchor.wordId],fps=story.timeline.fps;
    valid=valid&&add.includes(c?.action)&&w&&Number.isFinite(w.time)&&equal(o.start,Math.round(w.time*fps)/fps+o.speechAnchor.offsetFrames/fps);
   }
   if(valid){
    commands.push({id:o.id,...structuredClone(c),...(r&&add.includes(c.action)?{expectedSha256:r.expectedSha256}:{})});
    if(add.includes(c.action)){const clipId='sues_cmd_'+hash(o.id).slice(0,24);virtualClips.set(clipId,{operationId:o.id,assetId:c.assetId,expectedSha256:r?.expectedSha256,clip:{id:clipId,track:c.track,start:c.start,duration:c.duration}});}
   }
   else issues.push({operationId:o.id,code:'EXACT_COMMAND_BINDING_OR_TIMING_INVALID'});
  }else if(o.renderer==='native'&&o.effect==='sfx-one-shot'&&o.track==='sfx'&&fields(p,['gain'],['gain'])&&r?.source==='library'&&b?.track&& !o.speechAnchor&&Math.abs((registry.licensedAssets?.[r.assetId]?.duration??-1)-(o.end-o.start))<1e-6){
   commands.push({id:o.id,action:'add_sfx',assetId:r.assetId,expectedSha256:r.expectedSha256,start:o.start,duration:o.end-o.start,track:b.track,volume:p.gain});
  }else if(o.renderer==='native'&&o.effect==='zoom-native'&&o.track==='camera'&&fields(p,['scale'],['scale'])&&b?.clipId&&!o.speechAnchor){
   const cl=project.clips.find(c=>c.id===b.clipId);
   if(cl&&Math.abs(cl.start-o.start)<1e-6&&Math.abs(cl.start+cl.duration-o.end)<1e-6)commands.push({id:o.id,action:'set_transform',clipId:b.clipId,scale:p.scale});
   else issues.push({operationId:o.id,code:'ZOOM_REQUIRES_EXACT_CLIP_INTERVAL'});
  }else issues.push({operationId:o.id,code:'NO_LOSSLESS_MAPPING',effect:o.effect});
 }
 return issues.length?{status:'BLOCKED',issues,story}:{status:'PREPARED_NOT_EXECUTED',story,request:{baseRevision:project.revision,baseFingerprint:hash(project),commands}};
}
