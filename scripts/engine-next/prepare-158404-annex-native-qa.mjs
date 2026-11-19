// Operator-only preparation of the existing approved annex on a private clone.
// This does not grant human approval, publish media, or alter the source project.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {prepareStoryBatch,applyCommandBatch,projectFingerprint} from '../../src/engine-next/fablecut-command-batch.js';
import {sliceLinearEnvelope,linearFadeEnvelope} from '../../src/engine-next/fablecut-envelope-slice.js';
const [annexFile,baseFile,assetFile,destination,m01CorrectionFile]=process.argv.slice(2);
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const hash=file=>execFileSync('sha256sum',[file],{encoding:'utf8'}).split(' ')[0];
const annex=read(annexFile),base=read(baseFile),files=read(assetFile);
if(typeof destination!=='string'||path.resolve(destination)!==destination||!/^candidate[-A-Za-z0-9_.]*$/.test(path.basename(destination))||!path.basename(path.dirname(destination)).startsWith('q02-'))throw Error('PRIVATE_CANDIDATE_DESTINATION_REQUIRED');
if(base.comps?.some(comp=>comp.clips?.length))throw Error('NESTED_BASE_LAYERS_REQUIRE_RECONCILIATION');
if(annex.project!=='158404'||annex.operations.length!==87||annex.scenes.length!==7||fs.existsSync(destination)||!destination.startsWith('/opt/sues-video-setup/'))throw Error('PRIVATE_158404_QA_REQUIRED');
const native=createRequire(import.meta.url)('/srv/sues-fablecut-next/app/project-ops.js');
const ducking=createRequire(import.meta.url)('/srv/sues-fablecut-next/app/ducking.js');
const fps=30,seconds=frame=>frame/fps,duration=seconds(annex.editClock.endFrameExclusive);
const resources=[],assets={},media=[];
for(const [id,resource] of Object.entries(annex.resources)){
 const file=fs.realpathSync(files[id]);
 if(hash(file)!==resource.sha256)throw Error('RESOURCE_CHANGED_'+id);
 const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',file],{encoding:'utf8'}));
 const video=probe.streams.find(s=>s.codec_type==='video'),audio=probe.streams.find(s=>s.codec_type==='audio');
 const kind=/\.(png|jpe?g|webp)$/i.test(file)?'image':video?'video':audio?'audio':null;
 if(!kind)throw Error('RESOURCE_KIND_'+id);
 const m={id,name:resource.name,kind,src:'/media/'+resource.name,...(kind==='image'?{}:{duration:Number(probe.format.duration)}),...(video?{width:video.width,height:video.height}:{} )};
 media.push(m);resources.push({id,source:'library',assetId:id,expectedSha256:resource.sha256});
 assets[id]={...m,id,file,sha256:resource.sha256,size:fs.statSync(file).size,verifiedPhysical:true,rightsVerified:true,commercialUseAllowed:true,rightsScope:'TECHNICAL_PRIVATE_QA_ONLY_NOT_RELEASE_REGISTRY'};
}
if(assets.RAW.sha256!==annex.source.sha256)throw Error('SOURCE_MISMATCH');
const correction=m01CorrectionFile?read(m01CorrectionFile):null;
if(correction){
 if(correction.schema!=='sues-m01-private-correction/v1'||correction.scope!=='technical-qa'||correction.sourceSha256!==annex.source.sha256||correction.startFrame!==1074||correction.frames!==213||correction.sourceInFrame!==18)throw Error('M01_CORRECTION_UNBOUND');
 const file=fs.realpathSync(correction.maskFile),sha256=hash(file);
 if(sha256!==correction.maskSha256)throw Error('M01_MASK_CHANGED');
 const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-count_frames','-show_streams','-of','json',file],{encoding:'utf8'}));
 const v=probe.streams.find(s=>s.codec_type==='video');
 if(v?.width!==1080||v?.height!==1920||v?.r_frame_rate!=='30/1'||Number(v?.nb_read_frames)!==213||probe.streams.length!==1)throw Error('M01_MASK_CLOCK_UNVERIFIED');
 const m={id:'MAT01',name:'sues-158404-m01-private-matte.mp4',kind:'video',src:'/media/sues-158404-m01-private-matte.mp4',duration:213/30,width:1080,height:1920};
 media.push(m);resources.push({id:m.id,source:'library',assetId:m.id,expectedSha256:sha256});
 assets[m.id]={...m,file,sha256,size:fs.statSync(file).size,verifiedPhysical:true,rightsVerified:true,commercialUseAllowed:true,rightsScope:'TECHNICAL_PRIVATE_QA_ONLY_NOT_RELEASE_REGISTRY'};
}
// Reuse the editor's actual RMS/region detector, not guessed ASR speech spans.
const pcm=execFileSync('ffmpeg',['-v','error','-nostdin','-i',assets.VOX.file,'-vn','-ac','1','-ar','16000','-f','f32le','pipe:1'],{maxBuffer:16*1024*1024});
const samples=new Float32Array(pcm.buffer.slice(pcm.byteOffset,pcm.byteOffset+pcm.byteLength));
const voiceRegions=ducking.mergeRegions([ducking.activeRegions(ducking.rmsEnvelope([samples],16000),{threshold:-40})]);
if(!voiceRegions.length)throw Error('VOICE_REGIONS_UNVERIFIED');
const scenes=annex.scenes.map(s=>({id:s.id,start:seconds(s.startFrame),end:seconds(s.endFrameExclusive),purpose:s.purpose}));
const tracks=[8,7,6,5,4,3,2,1].map(i=>({id:'V'+i,kind:'video'})).concat([1,2,3,4].map(i=>({id:'A'+i,kind:'audio'})));
const before={...base,name:'SUES 158404 · private annex compatibility QA',revision:1,width:1080,height:1920,fps,tracks,media,clips:[],lockedTracks:[],disabledTracks:[],inPoint:0,outPoint:duration,markers:scenes.map(s=>({t:s.start,label:s.id,color:'cyan'}))};
for(const scene of scenes){
 for(const [id,kind,track,mediaId] of [['V01','video','V1','RAW'],['A01','audio','A1','VOX']])before.clips.push({id:id+'.'+scene.id,kind,track,mediaId,start:scene.start,in:scene.start,duration:scene.end-scene.start,props:kind==='video'?{volume:0,fit:'cover',scale:1}:{volume:1}});
}
native.checkProject(before);
const words=new Map(annex.wordTiming.words.map(w=>[w.id,w]));
const operations=[],manifest=[],crosswalk=[];
const role=track=>track.includes('Cámara')?'camera':track.includes('Voz')?'voice':track.includes('A-roll')?'camera':track.includes('Subtítulos')?'captions':track.includes('Música')?'music':track.includes('SFX')?'sfx':track.includes('Sujeto')||track.includes('Máscara')?'subject':track.includes('B-roll')?'broll':'graphics';
const checks={camera:['rendered-frame','time-sync'],voice:['audio-playback','time-sync'],captions:['rendered-frame','time-sync'],music:['audio-playback','time-sync'],sfx:['audio-playback','time-sync'],subject:['rendered-frame','motion-playback'],broll:['rendered-frame','motion-playback','narrative-review'],graphics:['rendered-frame','motion-playback','narrative-review']};
for(const original of annex.operations){
 const p=original.options,start=seconds(original.startFrame),end=seconds(original.endFrameExclusive),track=original.track.split(' ')[0],type=role(original.track);
 if(original.id.startsWith('CAM'))continue;
 let clip={id:original.id,kind:original.resource?assets[original.resource].kind:'text',track,start,in:seconds(original.sourceInFrame??0),duration:end-start,name:original.id,props:{volume:0,speed:1,...Object.fromEntries(['x','y','scale','fit','blend'].filter(k=>p[k]!==undefined).map(k=>[k,p[k]]))}};
 if(original.resource)clip.mediaId=original.resource;
 if(original.id==='A01')clip.props={volume:1};
 if(type==='music'||type==='sfx')clip.props={volume:10**(p.gainDb/20),duck:0};
 if(type==='music'){
  const keys=ducking.duckKeyframes(voiceRegions,clip,{amount:p.duckGainDb-p.gainDb,attack:seconds(p.attackFrames),release:seconds(p.releaseFrames)});
  if(keys.length)clip.keyframes={duck:keys};
 }
 if(/^FG/.test(original.id))Object.assign(clip.props,{matte:'luma',matteTrack:p.matteTrack});
 if(/^MT/.test(original.id))Object.assign(clip.props,{fit:'fill'});
 if(correction&&original.id==='M01'){
  // The existing editable motion starts its narration clock at 35.20 s;
  // this clip starts at 35.80 s. Eighteen frames align AMOR and MIEDO.
  clip.in=seconds(correction.sourceInFrame);
  Object.assign(clip.props,{matte:'luma-inverted',matteTrack:'V6'});
 }
 if(p.rectPx){
  const [x,y,w,h]=p.rectPx;Object.assign(clip.props,{x:x+w/2-540,y:y+h/2-960});
  if(clip.kind==='text')Object.assign(clip.props,{text:p.text??original.action,font:'Montserrat',weight:original.id.startsWith('H')?800:700,bold:true,fontSize:p.fontSizePx,color:p.color,boxW:w,boxH:h,strokeWidth:p.strokeWidthPx??p.outlinePx,strokeColor:p.stroke??'#171717',textAnim:'word-pop',caption:type==='captions',wordTimes:p.wordIds.map(id=>{const w=words.get(id);return [seconds(Math.round(w.startSeconds*fps))-start,seconds(Math.round(w.endSeconds*fps))-start];})});
  else clip.props.scale=Math.min(w/1080,h/1920);
 }
 const fadeIn=p.fadeInFrames??p.crossfadeFrames,fadeOut=p.fadeOutFrames??p.crossfadeFrames;
 if(fadeIn||fadeOut){
  const channel=clip.kind==='audio'?'volume':'opacity',level=clip.kind==='audio'?clip.props.volume:1;
  clip.keyframes={...clip.keyframes,[channel]:linearFadeEnvelope(end-start,seconds(fadeIn??0),seconds(fadeOut??0)).map(k=>({...k,v:k.v*level}))};
 }
 const ids=[];
 for(const scene of scenes){
  const a=Math.max(start,scene.start),b=Math.min(end,scene.end);if(b-a<1e-6)continue;
  const id=original.id+'.'+scene.id,cut=structuredClone(clip),baseLayer=['V01','A01'].includes(original.id);
  cut.id=id;cut.start=a;cut.duration=b-a;cut.in=clip.kind==='image'||clip.kind==='text'?0:clip.in+a-start;
  if(cut.keyframes)for(const [channel,keys] of Object.entries(clip.keyframes))cut.keyframes[channel]=sliceLinearEnvelope(keys,a-start,b-a);
  if(cut.props.wordTimes){
   // A caption spanning a scene boundary needs an explicit word-preserving layout.
   if(a!==start||b!==end)throw Error('TEXT_SCENE_SPLIT_REQUIRES_REVIEW_'+original.id);
  }
  const patch=baseLayer?{op:'updateClip',id,set:{props:cut.props}}:{op:'addClip',clip:cut};
  const operation={id,sceneId:scene.id,start:a,end:b,track:type,renderer:'native',effect:'fablecut-command-exact-v1',reason:type==='captions'?'Subtítulo fiel a la transcripción original':original.action,parameters:{command:{patch}},dependsOn:[],requiredQA:checks[type],...(original.resource?{resourceRef:original.resource}:{})};
  operations.push(operation);manifest.push({id,start:a,end:b,track:type,command:operation.parameters.command,...(original.resource?{assetId:original.resource,expectedSha256:assets[original.resource].sha256}:{})});ids.push(id);
 }
 crosswalk.push({sourceOperationId:original.id,sourceOperation:structuredClone(original),expandedOperationIds:ids,startFrame:original.startFrame,endFrameExclusive:original.endFrameExclusive});
}
if(correction){
 const scene=scenes.find(s=>s.start<=1074/30&&s.end>=1287/30);
 if(!scene)throw Error('M01_MASK_SCENE_UNBOUND');
 const camera=annex.operations.find(o=>o.id==='CAM04');
 const keys=camera.options.keyframes.map(([f,v])=>({t:seconds(f-camera.startFrame),v,ease:'linear'}));
 const scale=sliceLinearEnvelope(keys,seconds(1074-camera.startFrame),seconds(213));
 const id='MT01.'+scene.id,clip={id,kind:'video',track:'V6',mediaId:'MAT01',name:'M01 source-bound portrait matte candidate',start:seconds(1074),in:0,duration:seconds(213),props:{volume:0,fit:'fill',anchorX:0,anchorY:-120,y:-120,scale:1},keyframes:{scale}};
 const operation={id,sceneId:scene.id,start:clip.start,end:clip.start+clip.duration,track:'subject',renderer:'native',effect:'fablecut-command-exact-v1',reason:'Candidate dynamic portrait matte protects Carlos from M01; edge QA remains mandatory',parameters:{command:{patch:{op:'addClip',clip}}},dependsOn:['V01.'+scene.id],requiredQA:checks.subject,resourceRef:'MAT01'};
 operations.push(operation);manifest.push({id,start:operation.start,end:operation.end,track:operation.track,command:operation.parameters.command,assetId:'MAT01',expectedSha256:assets.MAT01.sha256});
}
for(const original of annex.operations.filter(o=>o.id.startsWith('CAM'))){
 const scene=scenes.find(s=>original.startFrame/30>=s.start&&original.endFrameExclusive/30<=s.end),id=original.id+'.'+scene.id,baseId='V01.'+scene.id;
 const keys=[{t:0,v:1},...original.options.keyframes.map(([f,v])=>({t:seconds(f)-scene.start,v,ease:'linear'})),{t:scene.end-scene.start,v:1}];
 const patch={op:'updateClip',id:baseId,set:{props:{anchorX:0,anchorY:-120,y:-120},keyframes:{scale:keys}}};
 const operation={id,sceneId:scene.id,start:scene.start,end:scene.end,track:'camera',renderer:'native',effect:'fablecut-command-exact-v1',reason:original.action,parameters:{command:{patch}},dependsOn:['V01.'+scene.id],requiredQA:checks.camera,resourceRef:'RAW'};
 operations.push(operation);manifest.push({id,start:operation.start,end:operation.end,track:'camera',command:operation.parameters.command,assetId:'RAW',expectedSha256:assets.RAW.sha256});crosswalk.push({sourceOperationId:original.id,sourceOperation:structuredClone(original),expandedOperationIds:[id],startFrame:original.startFrame,endFrameExclusive:original.endFrameExclusive});
}
// Keep source dependencies in the expanded story as well as the source ledger.
const sourceById=new Map(annex.operations.map(operation=>[operation.id,operation]));
const expandedBySource=new Map(crosswalk.map(row=>[row.sourceOperationId,row.expandedOperationIds]));
for(const operation of operations){
 const sourceId=operation.id.split('.')[0];
 const dependencies=sourceById.get(sourceId)?.dependsOn;
 if(!dependencies)continue;
 operation.dependsOn=[...new Set(dependencies.flatMap(sourceDependency=>{
  const ids=expandedBySource.get(sourceDependency);
  if(!ids)throw Error('SOURCE_DEPENDENCY_MISSING_'+sourceDependency);
  const sameScene=ids.filter(id=>id.endsWith('.'+operation.sceneId));
  return sameScene.length?sameScene:ids;
 }))];
}
if(correction){const m=operations.find(o=>o.id.startsWith('M01.'));m.dependsOn.push('MT01.'+m.sceneId);}
const story={schema:'sues-master-story/v1',sourceSha256:annex.source.sha256,timeline:{fps,duration,timeSpace:'edit-timeline',fingerprint:projectFingerprint(before)},visual:{mode:'brand-sues'},narrative:{centralMessage:'El precio de ser quien no eres',intendedExperience:'Revisar la fidelidad del plan aceptado de siete escenas',scenes},resources,operations};
const binding={schema:'sues-exact-native-plan/v1',maxCommands:150,storyFingerprint:projectFingerprint(story),baseFingerprint:projectFingerprint(before),expectedFingerprint:'0'.repeat(64),operations:manifest};
const expected=structuredClone(before);native.applyPatch(expected,manifest.map(o=>structuredClone(o.command.patch)),{});expected.revision++;native.checkProject(expected);binding.expectedFingerprint=projectFingerprint(expected);
const master=createHash('sha256').update('technical-qa-only').digest('hex');
const registry={sourceSha256:story.sourceSha256,timelineFingerprint:story.timeline.fingerprint,projectFingerprint:binding.baseFingerprint,approvedRuleVersion:'technical-qa-v1',unresolvedRuleConflicts:[],masterHashes:{qa:master},lockedMastersByMode:{'brand-sues':[{id:'qa',sha256:master}]},rendererCapabilities:{native:['fablecut-command-exact-v1']},licensedAssets:assets,brandId:'sues',profileId:'qa',projectId:'qa',approvedRuleIds:['qa-rule'],approvedReferenceIds:[],requiredRuleKeys:['qa.scope'],canvas:{width:1080,height:1920}};
const prepared=await prepareStoryBatch(story,{registry,project:before,nativePatch:binding,authorize:async()=>true});
if(prepared.status!=='PREPARED_NOT_EXECUTED')throw Error(JSON.stringify(prepared.issues));
binding.commandsFingerprint=projectFingerprint(prepared.request.commands);
const result=applyCommandBatch(before,prepared.request,{native,resolveAsset:id=>assets[id],nativePatch:binding});
if(crosswalk.length!==87||new Set(crosswalk.map(o=>o.sourceOperationId)).size!==87||crosswalk.some(o=>!o.expandedOperationIds.length))throw Error('SOURCE_COVERAGE_INCOMPLETE');
fs.mkdirSync(destination,{mode:0o700});fs.mkdirSync(destination+'/media',{mode:0o700});
for(const asset of Object.values(assets))fs.symlinkSync(asset.file,destination+asset.src);
for(const [file,data] of Object.entries({'project.json':before,'expected-project.json':expected,'story.json':story,'native-binding.json':binding,'registry.json':registry,'crosswalk.json':crosswalk,'source-annex.json':annex,'corrections.json':{scope:'technical-qa',m01:correction,audioEnvelope:{detector:'native FableCut RMS',thresholdDb:-40,voiceRegions,attackAndRelease:'annex frames',continuousAcrossSceneBoundaries:true},fadeCurve:'explicit linear keys, sliced without resetting'},'technical-report.json':{scope:'TECHNICAL_QA_ONLY',originalOperations:87,expandedOperations:operations.length,storyBytes:Buffer.byteLength(JSON.stringify(story)),receipts:result.receipts.length,sourceReviewed:false,fullyEquivalentToApprovedPlan:false,creativeApproval:false,executed:false,rendered:false,remaining:['ASR listening','audio playback of translated envelopes','M01 face/title collision','native full render','Master Director authenticated execution','two A/V reviews']}}))fs.writeFileSync(path.join(destination,file),JSON.stringify(data,null,2),{flag:'wx',mode:0o600});
console.log(JSON.stringify({destination,operations:operations.length,originalOperations:crosswalk.length,storyBytes:Buffer.byteLength(JSON.stringify(story)),status:'PREPARED_TECHNICAL_QA_NOT_EXECUTED'}));
