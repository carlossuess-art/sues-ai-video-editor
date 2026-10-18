// Synthetic placement/mask proof only. Does not infer a walking person's body.
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {prepareIllustrations,illustrationFilters} from '../../src/illustrations.js';
import {buildTimeMap} from '../../src/time-map.js';
import {fileSha256} from '../../src/local-pipeline.js';
const [imagePath,outPath]=process.argv.slice(2);if(!outPath)throw Error('Usage: IMAGE NEW_OUTPUT_DIRECTORY');
const image=resolve(imagePath),out=resolve(outPath);mkdirSync(out,{mode:0o700});
const plan={source:{sha256:'a'.repeat(64)},duration:3,timeMap:buildTimeMap([{in:0,out:3}],3),camera:{keyframes:[0,3].map(time=>({time,x:0,y:0,width:1080,height:1920,zoom:1}))},semantic:{anchors:[],zooms:[],motions:[]},graphics:[],selectedMedia:[],layout:{caption:{left:120,right:900,top:1190,bottom:1400},outro:{left:120,right:900,top:1430,bottom:1530}}};
const audit=[];
for(const [name,y]of [['high-face',180],['middle-face',650]]){
 const face={x:400,y,width:280,height:300,score:1,leftEye:{x:510,y:y+100},rightEye:{x:570,y:y+100}},frames=[0,3].map(time=>({time,frameWidth:1080,frameHeight:1920,faces:[face]}));
 const items=prepareIllustrations([{assetId:'synthetic-resource',rights:'owned',role:'illustration',sourceSha256:plan.source.sha256,sha256:fileSha256(image),localFile:image,timeSpace:'edit-timeline',start:0,end:3,placement:'auto-subject',featherPx:100,fadeSeconds:.2}],plan,frames),filter=illustrationFilters(items,'base',1);
 const graph=`[0:v]drawbox=x=400:y=${y}:w=280:h=300:color=orange:t=fill[base];${filter.filters.join(';')};[${filter.base}]trim=start=1:end=1.1,setpts=PTS-STARTPTS[video]`;
 execFileSync('ffmpeg',['-v','error','-filter_complex_threads','1','-f','lavfi','-i','color=c=0x303030:s=1080x1920:r=30:d=3','-loop','1','-framerate','30','-i',image,'-filter_complex',graph,'-map','[video]','-frames:v','1',join(out,name+'.png')]);
 audit.push({case:name,face,box:items[0].box,mask:items[0].mask,placement:items[0].placement,render:'pass'});
}
writeFileSync(join(out,'audit.json'),JSON.stringify({kind:'synthetic-layout-not-walking-video',cases:audit,externalCostUSD:0},null,2));console.log(JSON.stringify(audit));
