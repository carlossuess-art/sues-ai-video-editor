import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {statSync,renameSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
const execute=promisify(execFile),pending=new Map();
let queue=Promise.resolve();
export async function timelineFrames(jobs,id){
 const job=jobs.get(id);
 if(job.state!=='DONE')throw Error('El montaje todavía no está disponible');
 const duration=job.summary?.duration;
 if(!Number.isFinite(duration)||duration<=0||duration>600)throw Error('Duración no válida');
 const width=90,height=160,columns=12,count=Math.min(60,Math.ceil(duration)),step=duration/count,rows=Math.ceil(count/columns);
 const target=join(jobs.dir(id),'timeline-'+job.fingerprint.slice(0,16)+'.jpg');
 const result={file:target,width,height,columns,rows,count,step,duration};
 try{if(statSync(target).size>0)return result;}catch{}
 const key=target;if(pending.has(key))return pending.get(key);
 const run=queue.catch(()=>{}).then(async()=>{
  if(jobs.children.size||jobs.previewBusy||jobs.queued().length||jobs.publishing.size)throw Error('Fotogramas pendientes mientras se genera el vídeo');
  jobs.previewBusy=true;const temp=join(jobs.dir(id),'.timeline-'+randomUUID()+'.jpg');
  try{const source=await jobs.media(id);
   await execute('ffmpeg',['-v','error','-threads','1','-i',source,'-an','-vf','fps='+count+'/'+duration+',scale='+width+':'+height+':force_original_aspect_ratio=decrease,pad='+width+':'+height+':(ow-iw)/2:(oh-ih)/2,tile='+columns+'x'+rows,'-frames:v','1','-threads','1','-q:v','5','-y',temp],{timeout:90000,maxBuffer:65536});
   if(statSync(temp).size>2*1024*1024)throw Error('Tira de fotogramas demasiado grande');renameSync(temp,target);return result;
  }finally{rmSync(temp,{force:true});jobs.previewBusy=false;jobs.drain();}
 });
 queue=run;pending.set(key,run);try{return await run;}finally{pending.delete(key);}
}
