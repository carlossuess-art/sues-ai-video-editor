// Explicit art-direction study. Editorial labels are not ASR or verbatim captions.
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateStudyRecipe,studyFingerprint} from '../../src/editorial-study.js';
import {loadProject,fileSha256,writePreparedBundle,ENGINE_HASH} from '../../src/local-pipeline.js';
import {compileTemplatePolicy} from '../../src/template.js';
import {applyStyleVariant} from '../../src/style-variants.js';
import {PREVIEW_LAYOUT,wrapCaption} from '../../src/local-preview.js';
import {prepareSubjectLayers} from '../../src/subject-layers.js';
import {prepareSoundEffects} from '../../src/sound-effects.js';
import {buildTimeMap} from '../../src/time-map.js';
const [existingProject,sourceFile,layerFile,styleId,destination,recipeFile]=process.argv.slice(2);
if(!destination||!['SUES_DOPAMIN','SUES_CALMA'].includes(styleId))throw Error('Usage: EXISTING_PROJECT SOURCE LAYERS STYLE NEW_BUNDLE [RECIPE_JSON]');
const project=loadProject(resolve(existingProject)),data=JSON.parse(readFileSync(resolve(layerFile))),source={width:1080,height:1920,duration:data.matte.duration,sha256:fileSha256(resolve(sourceFile))};
if(source.sha256!==data.sourceSha256)throw Error('Source mismatch');
const policy=structuredClone(compileTemplatePolicy(applyStyleVariant(project.inputs.template,styleId),project.inputs.brand));policy.outro.duration=0;
const plan={version:'1.0',kind:'local-preview',source,policy,timeMap:buildTimeMap([{in:0,out:source.duration}],source.duration),camera:{keyframes:[0,source.duration].map(time=>({time,x:0,y:0,width:1080,height:1920,zoom:1}))},semantic:{zooms:[],motions:[],anchors:[]},selectedMedia:[],illustrations:[],graphics:[],broll:{decisions:[]},layout:PREVIEW_LAYOUT,renderColors:{dark:project.inputs.brand.colors.dark},duration:source.duration,originalVoice:true,productionReady:false,renderReady:true,finishFade:null};
const recipe=JSON.parse(readFileSync(recipeFile?resolve(recipeFile):new URL('../../examples/templates/reviewed-depth.recipe.json',import.meta.url),'utf8'));
const {labels,profile,musicGain,sfxGain}=validateStudyRecipe(recipe,source.duration,styleId);
plan.captions=labels.map((c,i)=>({...c,id:'editorial-'+i,source:'manual',textOrigin:'explicit-editorial-label-not-ASR',wordIndexes:[],wordCues:[],lines:wrapCaption(c.text),keyword:null}));
plan.subjectLayers=prepareSubjectLayers({...data,events:data.events.slice(0,profile.subjectEventLimit)},plan);
plan.globalTransitions=profile.transitions;
plan.globalTransitions=plan.globalTransitions.map(e=>({...e,duration:e.end-e.start}));
plan.audioMix=null;
// Preserve the audio mix contract from the existing module rather than inventing fields.
if(project.inputs.backgroundAudio){const {prepareBackgroundAudio}=await import('../../src/audio-mix.js');plan.audioMix=prepareBackgroundAudio({...project.inputs.backgroundAudio,gain:musicGain},source.duration);}
plan.soundEffects=prepareSoundEffects(plan,{sfxEnabled:true,sfxGain});
plan.editorialStudy={purpose:'compare-subject-depth-language',verbatimCaptions:false,ASR:false,automaticPersonDetection:false,fullBodyMask:false,maskScope:data.matte.scope,modelDownloads:false};
plan.pending=['human-visual-and-audio-review','full-body-automatic-mask','semantic-director'];
const prepared={plan,settings:{styleId},director:{version:'1.0',method:'explicit-editorial-study-no-ASR-no-LLM'},fingerprint:studyFingerprint({plan,settings:{styleId},fontHashes:project.fontHashes,backgroundAudioHash:project.boundHashes.backgroundAudio,engineHash:[ENGINE_HASH,fileSha256(fileURLToPath(import.meta.url)),fileSha256(fileURLToPath(new URL('../../src/editorial-study.js',import.meta.url)))].join(':')})};
const out=writePreparedBundle({...project,sourcePath:resolve(sourceFile)},prepared,resolve(destination));
console.log(JSON.stringify({bundle:out,style:styleId,duration:plan.duration,maskScope:data.matte.scope,editorialLabels:labels.length}));
