import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {loadProject,writePreparedBundle,fileSha256,ENGINE_HASH,RENDER_SCRIPT} from '../../src/local-pipeline.js';
import {prepareLocalPreview} from '../../src/local-preview.js';
import {applyStyleVariant} from '../../src/style-variants.js';
import {captionHierarchy} from '../../src/caption-hierarchy.js';
import {prepareGraphicBlocks} from '../../src/graphic-blocks.js';
import {prepareSoundEffects} from '../../src/sound-effects.js';
import {prepareCustomSfx} from '../../src/custom-sfx.js';
import {applyResourceLevels} from '../../src/audio-levels.js';
import {MediaLibrary} from '../../src/media-library.js';
import {visionTrackHash} from '../../src/camera-trajectory.js';
import {buildCameraProfilePlan} from '../../src/reframe.js';
import {fontFiles} from '../../src/font-kits.js';
const [specFile,outDir,renderFlag]=process.argv.slice(2);
if(!specFile||!outDir||renderFlag&&renderFlag!=='--render')throw Error('Usage: prepare_camera_study.mjs SPEC_JSON NEW_OUTPUT [--render]');
const spec=JSON.parse(readFileSync(specFile,'utf8')),base=dirname(resolve(specFile)),local=p=>resolve(base,p);
if(spec.schema!=='sues-camera-study/v1')throw Error('Study schema required');
const project=loadProject(local(spec.projectConfig)),start=spec.sourceSpan.in,end=spec.sourceSpan.out;
if(![start,end].every(Number.isFinite)||start<0||Math.abs(end-start-10)>1e-6||end>project.inputs.source.duration)throw Error('Exactly ten authorized source seconds required');
if(spec.sourceSha256!==project.boundHashes.source)throw Error('Study source binding mismatch');
const out=resolve(outDir);mkdirSync(out,{recursive:true});
project.fontDirectory=local(spec.fontDirectory);
project.fontHashes=Object.fromEntries(fontFiles('Montserrat').map(f=>[f,fileSha256(join(project.fontDirectory,f))]));
const library=new MediaLibrary(local(spec.assetsDirectory));
const music=library.resolve(spec.musicId,'audio');
const brand=JSON.parse(readFileSync(new URL('../../examples/brand-kit.sues.json',import.meta.url),'utf8'));
brand.outro={...brand.outro,text:'',duration:1};
const template=applyStyleVariant(JSON.parse(readFileSync(new URL('../../examples/templates/sues-calma.template.json',import.meta.url),'utf8')),'SUES_DOPAMIN');
template.captions.maxWords=2;
const source=project.inputs.source,camera=buildCameraProfilePlan(project.inputs.visionFrames,{profile:'conservative'});
const trajectory={...spec.trajectory,sourceSha256:source.sha256,visionSha256:visionTrackHash(project.inputs.visionFrames)};
const manualBroll=(spec.broll??[]).map(e=>{const a=library.resolve(e.assetId,'video');return {...e,localFile:a.localFile,sha256:a.sha256,rights:a.rights,mediaDuration:a.duration};});
const plan=prepareLocalPreview({...project.inputs,template,brand,camera,segments:[spec.sourceSpan],manualBroll,slots:[],assets:[],cameraTrajectory:trajectory,
 previewLayout:{title:{left:120,right:900,top:430,bottom:550},caption:{left:120,right:900,top:1370,bottom:1510},outro:{left:120,right:900,top:1430,bottom:1530}},
 backgroundAudio:{assetId:music.assetId,rights:music.rights,localFile:music.localFile,gain:.18,duckEnabled:true}});
plan.captions=captionHierarchy(plan.captions.map(c=>({...c,emphasisWordIndexes:[]})),project.inputs.transcript.words,plan.policy.captions);
for(const chosen of spec.emphasisWords??[]){
 const targets=plan.captions.filter(c=>c.text.toLocaleLowerCase('es').includes(chosen.toLocaleLowerCase('es')));
 if(!targets.length)throw Error('Spoken emphasis absent: '+chosen);
 for(const c of targets){const words=c.text.split(/\s+/),index=words.findIndex(w=>w.toLocaleLowerCase('es').replace(/[^\p{L}]/gu,'')===chosen.toLocaleLowerCase('es'));if(index<0)throw Error('Exact spoken word required');c.keyword={displayWordIndex:index,level:'exceptional',style:'fireMetal',scale:1.6,method:'explicit-study-direction'};}
}
Object.assign(plan,prepareGraphicBlocks([],spec.transitions??[],plan,true));
plan.soundEffects=prepareSoundEffects(plan,{sfxEnabled:true,sfxGain:.3,voiceNormalization:true});
plan.customSfx=prepareCustomSfx(spec.sfxEvents??[],plan.duration,(id,kind)=>library.resolve(id,kind),{voiceNormalized:true});
plan.voiceEffects={events:[]};plan.voiceGain=1.5;plan.mastering={enabled:true,mode:'fixed-headroom',gainDb:-1.8};
plan.voiceNormalization={enabled:true,targetIntegratedLufs:-16,targetTruePeakDb:-3,targetLra:7};
applyResourceLevels(plan);
const provenance={schema:'sues-camera-study-provenance/v1',sourceSha256:source.sha256,sourceSpan:spec.sourceSpan,visionTrackSha256:visionTrackHash(project.inputs.visionFrames),existingDetectionSamples:project.inputs.visionFrames.length,
 trajectoryEvidence:plan.semantic.trajectory.evidence,newInference:false,creativeDirection:'explicit-work-study-not-autonomous',blockedEvents:spec.blockedEvents??[],allMissionEventsComplete:false};
const fingerprint=createHash('sha256').update(JSON.stringify({plan,provenance,fontHashes:project.fontHashes,engine:ENGINE_HASH})).digest('hex');
const prepared={plan,settings:{cameraTrajectory:trajectory},director:{version:'1.0',templateId:template.id,timeSpace:'edit-timeline',decisions:[],audit:provenance},fingerprint};
const bundle=writePreparedBundle(project,prepared,join(out,'bundle'));
writeFileSync(join(out,'provenance.json'),JSON.stringify(provenance,null,2));
writeFileSync(join(out,'study-plan.json'),JSON.stringify(spec,null,2));
console.log(JSON.stringify({bundle,duration:plan.duration,framesAudited:plan.semantic.audit.frames,maxCombinedZoom:plan.semantic.audit.maxCombinedZoom,captions:plan.captions.length,sourceSha256:source.sha256,allMissionEventsComplete:false}));
if(renderFlag){const p=spawnSync('python3',[RENDER_SCRIPT,'--source',project.sourcePath,'--bundle',bundle,'--out',join(out,'SUES_CAMERA_STUDY_10S.mp4')],{stdio:'inherit'});process.exit(p.status??1);}