import {lstatSync,openSync,readSync,closeSync} from 'node:fs';
export function parseRenderProgress(text,duration){
 let frame=0,seconds=0,speed=null,ended=false;
 for(const line of text.split(/\r?\n/)){
  const match=/^(frame|out_time_us|out_time|speed|progress)=(.*)$/.exec(line);if(!match)continue;const [,key,value]=match;
  if(key==='frame'&&/^\d+$/.test(value)&&Number.isSafeInteger(Number(value)))frame=Number(value);
  if(key==='out_time_us'&&/^-?\d+$/.test(value)&&Number.isSafeInteger(Number(value)))seconds=Math.max(0,Number(value)/1e6);
  if(key==='out_time'&&/^\d{2,}:\d{2}:\d{2}(?:\.\d+)?$/.test(value)){const [h,m,s]=value.split(':').map(Number);if(m<60&&s<60&&Number.isFinite(h*3600+m*60+s))seconds=h*3600+m*60+s;}
  if(key==='speed'&&/^\d+(?:\.\d+)?x$/.test(value)){const n=Number(value.slice(0,-1));if(n<=10000)speed=n;}
  if(key==='progress')ended=value==='end';
 }
 const bounded=Number.isFinite(duration)&&duration>0?Math.min(seconds,duration):0;
 return {stage:ended?'verifying':'rendering',percent:Number.isFinite(duration)&&duration>0?Math.min(99,Math.floor(bounded/duration*100)):0,processedSeconds:bounded,frame,speed};
}
export function renderProgress(path,duration,state){
 if(state==='DONE')return {stage:'complete',percent:100};
 if(['PUBLISHING','PUBLISH_FAILED'].includes(state))return {stage:state==='PUBLISHING'?'saving':'save-failed',percent:99};
 if(state==='QUEUED')return {stage:'queued',percent:0};
 if(state!=='RENDERING')return {stage:state.toLowerCase(),percent:null};
 try{
  const stat=lstatSync(path);if(!stat.isFile()||stat.isSymbolicLink())return parseRenderProgress('',duration);
  const count=Math.min(stat.size,65536),buffer=Buffer.alloc(count),fd=openSync(path,'r');try{const bytes=readSync(fd,buffer,0,count,Math.max(0,stat.size-count));return parseRenderProgress(buffer.toString('utf8',0,bytes),duration);}finally{closeSync(fd);}
 }catch{return parseRenderProgress('',duration);}
}
