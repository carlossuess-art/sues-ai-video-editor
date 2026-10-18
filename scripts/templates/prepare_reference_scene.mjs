// Explicit editorial recipe for Carlos's existing 38.31s recording.
// No new ASR/vision inference, generative models or third-party media.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {loadProject,prepareProject,writePreparedBundle,fileSha256} from '../../src/local-pipeline.js';
const [input,destination]=process.argv.slice(2);if(!destination)throw Error('Usage: EXISTING_PROJECT_JSON NEW_OUTPUT_DIRECTORY');
const original=resolve(input),root=resolve(new URL('../..',import.meta.url).pathname),out=resolve(destination),project=loadProject(original);
if(project.boundHashes.source!=='50c56298e59f783b2dfe2979c80ddc4e83a84ab4eb9048aa56ff8423be67ba6a')throw Error('This recipe is bound to the reviewed Carlos recording');
mkdirSync(out,{mode:0o700});const cfg=JSON.parse(readFileSync(original));
for(const key of Object.keys(cfg))if(key.endsWith('Path')||key==='fontDirectory')cfg[key]=resolve(dirname(original),cfg[key]);
cfg.templatePath=join(root,'examples/templates/sues-calma.template.json');cfg.catalogPath=join(root,'examples/motions/catalog.sample.json');
if(cfg.backgroundAudio)cfg.backgroundAudio.localFile=resolve(dirname(original),cfg.backgroundAudio.localFile);
const sample=project.inputs.visionFrames.reduce((a,b)=>Math.abs(b.time-6.2)<Math.abs(a.time-6.2)?b:a),face=sample.faces[0];
const width=Math.round(face.width*1.1/10)*10,height=Math.round(width*.42),left=Math.ceil((face.x+face.width/2-width/2)/2)*2,top=Math.ceil(((face.leftEye.y+face.rightEye.y)/2-height/2)/2)*2;
if(left<0||top<0||left+width>1080||top+height>1920)throw Error('Derived crop outside original');
const image=join(out,'gaze.png');execFileSync('ffmpeg',['-v','error','-ss','6.2','-i',project.sourcePath,'-frames:v','1','-vf',`crop=${width}:${height}:${left}:${top},scale=1080:454,eq=saturation=0.12:contrast=1.15:brightness=-0.04,colorbalance=rs=0.04:bs=-0.03`,image]);
cfg.illustrations=[{assetId:'carlos-gaze-derived-frame',role:'illustration',rights:'owned',sourceSha256:project.boundHashes.source,sha256:fileSha256(image),localFile:image,timeSpace:'edit-timeline',start:5.2,end:8.4,motion:'slow-push',edgeToEdge:true,box:{left:0,right:1080,top:0,bottom:450},featherPx:180,fadeSeconds:.4}];
const path=join(out,'project.json');writeFileSync(path,JSON.stringify(cfg,null,2)+'\n');const loaded=loadProject(path),base=prepareProject(loaded,{profileImages:false});
const caption=text=>{const c=base.plan.captions.find(c=>c.text===text);if(!c)throw Error('Reviewed caption missing: '+text);return c;};
const key=(text,word,style,level='exceptional')=>[caption(text).id,{word,style,level}];
const settings={zoomIntensity:.75,musicGain:.1,profileImages:true,graphicCards:[{captionId:caption('has querido ver.').id,type:'grid'},{captionId:caption('silencio,').id,type:'secret'},{captionId:caption('Todos tus temores,').id,type:'compare',left:'Temores',right:'Observar lo que siento'}],transitions:[{captionId:caption('has querido ver.').id,type:'radial'},{captionId:caption('pero dime,').id,type:'blur'},{captionId:caption('te cuenta cosas').id,type:'warm'}],keywordOverrides:Object.fromEntries([key('reconocer que hay',0,'gold'),key('tus ojos,',1,'gold'),key('enseñó a detenerte',2,'condensed','important'),key('y sentir.',1,'gold'),key('eres culpa,',1,'gold'),key('avanzar,',0,'gold')])};
const prepared=prepareProject(loaded,settings);writeFileSync(join(out,'settings.json'),JSON.stringify(prepared.settings,null,2)+'\n');writePreparedBundle(loaded,prepared,join(out,'bundle'));
writeFileSync(join(out,'recipe-evidence.json'),JSON.stringify({sourceSha256:project.boundHashes.source,asset:{role:'derived-frame-from-owned-recording',time:6.2,crop:{left,top,width,height},sha256:fileSha256(image)},editorialRecipe:true,automaticSemanticSelection:false,humanAcceptance:false,externalCostUSD:0},null,2)+'\n');
console.log(JSON.stringify({project:path,bundle:join(out,'bundle'),source:project.sourcePath,externalCostUSD:0}));
