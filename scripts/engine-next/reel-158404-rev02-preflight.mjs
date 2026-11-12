// SUES 158404 REV02: private source/ASR preflight. READ ONLY w.r.t. the editor.
// This never edits, renders, modifies or publishes a video.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const ROOT='/srv/sues-fablecut-next/data/automation-v1';
const OUT=path.join(ROOT,'reel-158404-rev02-preflight');
const sourceCandidates=[
 '/opt/sues-video-setup/editor/director-run-20261106/source.mp4',
 path.join(ROOT,'../qa/reel-158404-milestone1-20261108/sues-158404-original.mp4')
];
const transcriptCandidates=[
 '/opt/sues-video-setup/analysis-review/film-director-transcription-20261106/transcript_words.json',
 '/opt/sues-video-setup/editor/director-run-20261106/transcript.json'
];
const frameDir='/opt/sues-video-setup/editor/director-run-20261106/analysis-3fps';
const wantHash='9e06f49c30731d8a57aed312cfb46281bcffb7b3d5d62bf5a2164333944ccaad';
const windows=[
 ['P01','PERDERTE',0,3.5],['P03','MOLESTAR',7.7,10.5],
 ['P05','FELICITAN',13.8,16.9],['P06','NO',16.8,21.3],
 ['P06','CULPABLE',16.8,21.3],['P07','LIMITES',21.2,24.5],
 ['P08','MIEDO',24.4,28.1],['P09','QUERERME',27.9,34.2],
 ['P11','AMOR',38.3,43.4],['P11','MIEDO',38.3,43.4],
 ['P12','DESPERTAR',43.2,47.9],['P13','RECONOCER',47.7,52.6],
 ['P14','ABANDONANDO',52.4,55.9],['P14','ENCAJAR',52.4,55.9],
 ['P16','TRAICIONARTE',60.7,65.3],['P18','SIGUEME',69.4,73.77]
];
const first=files=>files.find(p=>fs.existsSync(p)&&fs.statSync(p).isFile())||null;
const norm=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]/g,'').toUpperCase();
function extractWords(x){
 if(Array.isArray(x)){
  if(x.some(z=>z&&Array.isArray(z.words)))return x.flatMap(extractWords);
  if(x.length&&x.every(z=>z&&z.start!==undefined&&z.end!==undefined&&(z.word!==undefined||z.text!==undefined)))return x;
  return x.flatMap(extractWords);
 }
 if(x&&typeof x==='object'){
  if(Array.isArray(x.words))return extractWords(x.words);
  for(const k of ['segments','results','transcript','data'])if(x[k])return extractWords(x[k]);
 }
 return [];
}
function sha(file){
 const h=crypto.createHash('sha256'),fd=fs.openSync(file,'r'),buf=Buffer.alloc(1048576);
 try{let n;while((n=fs.readSync(fd,buf,0,buf.length,null))>0)h.update(buf.subarray(0,n));}
 finally{fs.closeSync(fd);}
 return h.digest('hex');
}
if(!fs.existsSync(ROOT))throw Error('AUTOMATION_ROOT_NOT_FOUND');
fs.mkdirSync(OUT,{recursive:true,mode:0o700});fs.chmodSync(OUT,0o700);
const source=first(sourceCandidates),transcript=first(transcriptCandidates),blockers=[];
let video={},fileHash=null,words=[],matches=[];
if(!source)blockers.push('SOURCE_NOT_FOUND');
else{
 fileHash=sha(source);
 if(fileHash!==wantHash)blockers.push('SOURCE_SHA_MISMATCH');
 const raw=execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',source],{encoding:'utf8',timeout:30000});
 const probe=JSON.parse(raw),v=probe.streams.find(x=>x.codec_type==='video');
 video={width:v?.width,height:v?.height,duration:Number(probe.format.duration),codec:v?.codec_name};
 if(video.width!==1080||video.height!==1920||Math.abs(video.duration-73.753467)>.12)blockers.push('SOURCE_GEOMETRY_OR_DURATION_CHANGED');
}
if(!transcript)blockers.push('TRANSCRIPT_NOT_FOUND');
else{
 words=extractWords(JSON.parse(fs.readFileSync(transcript,'utf8'))).map((w,i)=>({id:String(w.id||('w'+String(i+1).padStart(4,'0'))),text:String(w.word??w.text??'').trim(),start:Number(w.start),end:Number(w.end),confidence:w.probability??w.confidence??null}));
 if(words.length!==168)blockers.push('WORD_COUNT_'+words.length+'_NOT_168');
 if(words.some(w=>!Number.isFinite(w.start)||!Number.isFinite(w.end)||w.start<0||w.end<=w.start))blockers.push('INVALID_WORD_TIME');
 for(const [scene,token,lo,hi] of windows){
  const found=words.filter(w=>norm(w.text)===norm(token)&&w.start>=lo-.2&&w.start<=hi+.2);
  if(!found.length)blockers.push('UNRESOLVED_'+scene+'_'+token);
  for(const w of found){
   const i=words.indexOf(w),context=words.slice(Math.max(0,i-4),Math.min(words.length,i+5)).map(w=>w.text).join(' ');
   matches.push({operationId:'EMPH-'+scene+'-'+norm(token)+'-'+String(matches.filter(m=>m.scene===scene&&m.token===token).length+1).padStart(2,'0'),scene,token,wordId:w.id,sourceStart:w.start,sourceEnd:w.end,sourceFrames30:[Math.round(w.start*30),Math.round(w.end*30)],context,confidence:w.confidence,reviewedByEar:false});
  }
 }
}
let frames=0;if(fs.existsSync(frameDir))frames=fs.readdirSync(frameDir).filter(n=>/^frame_\d+\.jpg$/.test(n)).length;
if(frames!==221)blockers.push('FRAME_SAMPLE_COUNT_'+frames+'_NOT_221');
const output={schema:'sues-reel-158404-rev02-preflight/v1',timestamp:new Date().toISOString(),state:'READ_ONLY_PREPARATION_NOT_EDITED',
 original:source,originalSha256:fileHash,video,transcript,wordCount:words.length,frameDir,frameCount:frames,
 selectedDistinctTerms:15,contextualTargets:windows.length,detected:matches,blockers,
 requiredManualReview:['Listen to whole source','Correct dubious ASR phrases','Track face/hand zones on real frames','Check masters and resource rights','Approve exact creative story and source->edit map','Two genuine audiovisual QA passes'],
 videoEdited:false,productionTouched:false,published:false
};
const report=path.join(OUT,'report.json');fs.writeFileSync(report,JSON.stringify(output,null,2),{mode:0o600,flag:'w'});
console.log('SUES 158404 · REV02 · PREPARATION ONLY');
console.log('Original:',source||'MISSING','SHA:',fileHash||'MISSING');
console.log('Words:',words.length,'3fps frames:',frames,'Selected matches:',matches.length);
for(const x of blockers)console.log('BLOCKER:',x);
for(const x of matches)console.log(x.operationId,x.wordId,x.sourceStart.toFixed(3)+'-'+x.sourceEnd.toFixed(3),x.context);
console.log('REPORT:',report);
console.log('VIDEO_EDITED=false; PRODUCTION_UNCHANGED');
process.exitCode=blockers.length?2:0;
