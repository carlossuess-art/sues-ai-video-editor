// Explicit editorial pass for the reviewed, hash-bound raw selection.
// Reuses transcript phrases and existing native renderer; no model or detector.
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {loadProject,prepareProject,writePreparedBundle} from '../../src/local-pipeline.js';
const [config,settingsPath,destination]=process.argv.slice(2);
if(!destination)throw Error('Usage: PROJECT SETTINGS NEW_BUNDLE');
const project=loadProject(resolve(config));
if(project.boundHashes.source!=='2647f4e598b27f74391efe6cad10ec381026766211a6264385f395bfd359f1b2')throw Error('This editorial pass requires the reviewed source selection');
const prepared=prepareProject(project,JSON.parse(readFileSync(resolve(settingsPath)))),plan=prepared.plan;
const recipe={version:1,sourceSha256:project.boundHashes.source,method:'explicit-editorial-review',automaticSemanticSelection:false,detectorUsed:false,bodyMask:false,
 zoom:{start:2.83,end:10.9,scale:1.1,ramp:1.2,anchor:{x:.5,y:.28},anchorMethod:'manual-fixed-composition-point-not-face-track'},
 labels:[{text:'¿TE BLOQUEAS?',start:0,end:2.65,x:510,y:215,size:96,color:'white'},{text:'ESCRÍBEME',start:15.94,end:16.91,x:510,y:1240,size:104,color:'yellow'}],
 transition:{start:13.4,end:13.8},voiceChanged:false,captionTimingChanged:false};
if(plan.depthText?.length){recipe.labels=recipe.labels.filter(l=>l.start>3);recipe.importedContourOcclusion=plan.depthText.map(e=>({start:e.start,end:e.end,scope:e.occlusionScope,method:e.mask.method}));}
for(const e of plan.globalTransitions){e.start=recipe.transition.start;e.end=recipe.transition.end;}
for(const e of plan.soundEffects.events)if(e.reason==='transition')e.start=recipe.transition.start;
const z=recipe.zoom,event={id:'reviewed-camera-01',type:'zoom',start:z.start,end:z.end,ramp:z.ramp,params:{scale:z.scale,reason:'emphasis'},reason:'Reviewed emphasis during the blocking sentence',rule:'explicit-editorial-review-v1'};
plan.semantic={timeSpace:'edit-timeline',events:[event],zooms:[event],motions:[],anchors:[{start:0,end:plan.duration,points:[{time:0,...z.anchor},{time:plan.duration,...z.anchor}]}],audit:{frames:0,method:'manual-fixed-composition-point',detectorUsed:false,bodySegmentation:false}};
plan.editorialReview=recipe;
prepared.fingerprint=createHash('sha256').update(prepared.fingerprint+JSON.stringify(recipe)).digest('hex');
const out=writePreparedBundle(project,prepared,resolve(destination));
const stamp=t=>`0:${String(Math.floor(t/60)).padStart(2,'0')}:${(t%60).toFixed(2).padStart(5,'0')}`;
let ass=readFileSync(join(out,'captions.ass'),'utf8');
for(const l of recipe.labels){
 const c=l.color==='yellow'?'&H005EE4FF&':'&H00FFFFFF&';
 // Editorial labels, separate from spoken captions. Real ExtraBold, no karaoke.
 const tags=`\\an5\\pos(${l.x},${l.y})\\fnMontserrat ExtraBold\\b800\\fs${l.size}\\fscx100\\fsp-2\\bord0\\shad0\\fad(100,100)`;
 ass+=`Dialogue: 3,${stamp(l.start)},${stamp(l.end)},Caption,,0,0,0,,{${tags.replace(`\\pos(${l.x},${l.y})`,`\\pos(${l.x+3.54},${l.y-3.54})`)}\\1c&H000000&\\1a&H40&\\blur10}${l.text}\n`;
 ass+=`Dialogue: 4,${stamp(l.start)},${stamp(l.end)},Caption,,0,0,0,,{${tags}\\1c${c}}${l.text}\n`;
}
writeFileSync(join(out,'captions.ass'),ass);writeFileSync(join(out,'editorial-recipe.json'),JSON.stringify(recipe,null,2)+'\n');
console.log(JSON.stringify({bundle:out,duration:plan.duration,voiceChanged:false,editorialLabels:recipe.labels.length,cameraMaximum:z.scale}));
