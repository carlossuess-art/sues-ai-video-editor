// Composited motion showcase using the same paper/ASS/transition renderers as
// the app. Copy is explicitly supplied by Carlos; not a semantic edit of speech.
import {readFileSync,writeFileSync,mkdirSync,cpSync,openSync,closeSync} from 'node:fs';
import {resolve,join,basename} from 'node:path';
import {execFileSync} from 'node:child_process';
import {loadProject,prepareProject,fileSha256} from '../../src/local-pipeline.js';
import {buildPreviewASS,buildPreviewFilter} from '../../src/local-preview.js';
import {buildTimeMap} from '../../src/time-map.js';
const [config,destination]=process.argv.slice(2);if(!destination)throw Error('Usage: EXISTING_PROJECT_WITH_MUSIC NEW_DIRECTORY');
const out=resolve(destination);mkdirSync(out,{mode:0o700});const project=loadProject(config),base=prepareProject(project,{profileImages:false,motions:false,zoomIntensity:0,musicEnabled:false}).plan;
if(base.policy.captions.font!=='Montserrat'||!project.inputs.backgroundAudio)throw Error('Montserrat project and existing music required');
const duration=17,plan={...base,duration,timeMap:buildTimeMap([{in:0,out:duration}],base.source.duration),policy:{...base.policy,outro:{...base.policy.outro,duration:1.2}},captions:[{id:'seg-999',source:'manual',text:'Vuelve a ti',lines:['Vuelve a ti'],wordIndexes:[],start:14.25,end:15.8,keyword:{displayWordIndex:2,level:'exceptional',style:'gold'}}],illustrations:[],audioMix:null,semantic:{zooms:[],motions:[],anchors:[]},graphics:[
 {type:'grid',start:.4,end:3.9,text:'al equipo de',lines:['al equipo de'],heading:'al equipo de',bodyLines:['efectos especiales','y maquillaje'],icons:['clapper','makeup'],fontSize:112},
 {type:'secret',start:5.05,end:8.45,text:'NADIE TE CUENTA',lines:['NADIE TE CUENTA'],lead:'que',fontSize:112},
 {type:'compare',start:9.35,end:13.75,text:'El rico / Experto',lines:['El rico','Experto'],left:'El rico',right:'Experto',icons:['luggage','clock'],fontSize:144}
 ],globalTransitions:[{type:'radialBurst',start:3.7,end:4.1,duration:.4},{type:'blur',start:8.35,end:8.75,duration:.4},{type:'warm',start:13.55,end:14.15,duration:.6}]};
writeFileSync(join(out,'manifest.json'),JSON.stringify(plan,null,2)+'\n');writeFileSync(join(out,'captions.ass'),buildPreviewASS(plan));cpSync(project.fontDirectory,join(out,'fonts'),{recursive:true});
const filter=buildPreviewFilter(plan,{hasAudio:false}).trim()+`;\n[1:a]atrim=duration=${duration},asetpts=PTS-STARTPTS,volume=0.1,afade=t=in:st=0:d=0.5,afade=t=out:st=${duration-1}:d=1[demo-audio]\n`;
writeFileSync(join(out,'filter.ffscript'),filter);const output=join(out,'showcase.mp4'),before=fileSha256(project.sourcePath);
console.log(JSON.stringify({stage:'rendering',duration,scenes:3,copy:'user-provided',voice:'not included in this motion showcase',font:'Montserrat'}));
const log=openSync(join(out,'render.log'),'wx',0o600);
try{execFileSync('ffmpeg',['-v','verbose','-threads','2','-i',project.sourcePath,'-i',project.inputs.backgroundAudio.localFile,'-filter_complex_threads','1','-filter_complex_script','filter.ffscript','-map','[video]','-map','[demo-audio]','-t',String(duration),'-c:v','libx264','-threads','2','-preset','veryfast','-crf','20','-pix_fmt','yuv420p','-c:a','aac','-b:a','128k','-movflags','+faststart','-progress','progress.txt',output],{cwd:out,stdio:['ignore','ignore',log]});}finally{closeSync(log);}
execFileSync('ffmpeg',['-v','error','-i',output,'-f','null','-']);if(fileSha256(project.sourcePath)!==before)throw Error('Original changed');
const selectedFaces=readFileSync(join(out,'render.log'),'utf8').split('\n').filter(s=>s.includes('fontselect:')).map(s=>s.slice(s.indexOf('fontselect:')));
// Embedded libass faces may bypass fontselect log messages. Validate each role
// against an isolated Fontconfig directory, keeping observed logs separately.
const escapeXml=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const fontConfig=join(out,'fontconfig.xml');mkdirSync(join(out,'font-cache'));
writeFileSync(fontConfig,`<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig><dir>${escapeXml(join(out,'fonts'))}</dir><cachedir>${escapeXml(join(out,'font-cache'))}</cachedir></fontconfig>`);
const fontconfigFaceChecks=[];
for(const [pattern,file] of [
 ['Montserrat:weight=200:slant=0','Montserrat-Bold.ttf'],
 ['Montserrat ExtraBold:weight=205:slant=0','Montserrat-ExtraBold.ttf'],
 ['Montserrat:weight=200:slant=100','Montserrat-BoldItalic.ttf'],
 ['Montserrat ExtraBold:weight=205:slant=100','Montserrat-ExtraBoldItalic.ttf'],
 ['Anton:weight=80','Anton-Regular.ttf'],['Allerta Stencil:weight=80','AllertaStencil-Regular.ttf']]){
 const match=execFileSync('fc-match',['-f','%{file}|%{family}|%{style}',pattern],{env:{...process.env,FONTCONFIG_FILE:fontConfig},encoding:'utf8'}).trim();
 const matchedFile=match.split('|')[0];if(basename(matchedFile)!==file)throw Error('Font role mismatch: '+pattern+' -> '+match);
 fontconfigFaceChecks.push({pattern,file,sha256:fileSha256(matchedFile),family:match.split('|')[1],style:match.split('|')[2]});
}
const audit={kind:'three-composited-motion-scenes-user-copy',duration,sourcePreserved:true,sourceSha256:before,outputSha256:fileSha256(output),fullDecode:'pass',fontconfigFaceChecks,selectedFaces,copySource:'explicit-user-message-and-brand-outro-not-transcript',voiceIncluded:false,music:'existing-owned-track',humanAcceptance:false,externalCostUSD:0};writeFileSync(join(out,'audit.json'),JSON.stringify(audit,null,2)+'\n');console.log(JSON.stringify({stage:'DONE',output}));
