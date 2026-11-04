import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {capSpeechPauses,mapSourceTimeAfterPauseCuts} from '../../../src/speech-pause-cap.js';
const root='/opt/sues-video-setup/remotion-cta-poc-20261103/experiments/remotion-cta';
const transcript=JSON.parse(readFileSync('/opt/sues-video-setup/editor/jobs/uploads/analysis-remotion-v2b-20261104/transcript.json','utf8'));
const data=capSpeechPauses(transcript,{limitSeconds:0.7,fps:30});
const directory=join(root,'out','v3-drafts-20261104');mkdirSync(directory,{recursive:true});
const totalFrames=2289;
const ranges=[];let lastFrame=0;
for(const cut of data.cuts){
 const a=Math.round(cut.start*30),b=Math.round(cut.end*30);
 if(a>lastFrame)ranges.push({fromFrame:lastFrame,toFrame:a,from:lastFrame/30,to:a/30});
 lastFrame=b;
}
ranges.push({fromFrame:lastFrame,toFrame:totalFrames,from:lastFrame/30,to:transcript.sourceDuration});
const cutFrames=data.details.reduce((sum,d)=>sum+d.cutFrames,0);
if(ranges.reduce((sum,r)=>sum+r.toFrame-r.fromFrame,0)!==totalFrames-cutFrames)throw Error('Frame count mismatch');
const filters=[];
for(const [i,range] of ranges.entries()){
 const start=range.fromFrame/30,videoEnd=range.toFrame/30;
 const audioEnd=i===ranges.length-1?transcript.sourceDuration:videoEnd;
 if(audioEnd<=start)throw Error('Invalid audio segment');
 filters.push(`[0:v:0]trim=start_frame=${range.fromFrame}:end_frame=${range.toFrame},setpts=PTS-STARTPTS[v${i}]`);
 const duration=audioEnd-start,fade=Math.min(.006,duration/10);
 filters.push(`[0:a:0]atrim=start=${start.toFixed(6)}:end=${audioEnd.toFixed(6)},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=${fade.toFixed(4)},afade=t=out:st=${(duration-fade).toFixed(6)}:d=${fade.toFixed(4)}[a${i}]`);
}
filters.push(ranges.map((_,i)=>`[v${i}][a${i}]`).join('')+`concat=n=${ranges.length}:v=1:a=1[vout][aout]`);
const info={...data,ranges,expectedFrames:totalFrames-cutFrames,sourceFrames:totalFrames,originalFile:'SUES_158404_V3_REGLAS_158623_BORRADOR_PRIVADO_20261104.mp4',outputFile:'SUES_158404_V3C_SILENCIOS_MAX_07_20261104.mp4',reTiming:'audio+video together; overlay elements already baked into V3 before trimming',introOutro:'unchanged except internal voice gap',mappedExamples:[18.54,19.7,31.8,66.48,71.98].map(at=>({from:at,to:mapSourceTimeAfterPauseCuts(at,data.cuts)}))};
writeFileSync(join(directory,'pause-cap-07-filter.txt'),filters.join(';\n')+'\n');
writeFileSync(join(directory,'pause-cap-07-manifest.json'),JSON.stringify(info,null,2)+'\n');
console.log(JSON.stringify({cuts:data.cuts.length,removedSeconds:data.removedSeconds,outputDuration:data.outputDuration,frames:info.expectedFrames,ranges:ranges.length,warnings:data.warnings,manifest:join(directory,'pause-cap-07-manifest.json')},null,2));
