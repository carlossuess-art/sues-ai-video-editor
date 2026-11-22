/* SUES V1 candidate: bounded headless video windows + one continuous audio mix.
   No production deployment. Enabled only with SUES_SEGMENTED_EXPORT=1. */
"use strict";
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const Reuse=require('./sues-export-reuse.cjs');
const Window=require('./sues-window-reuse.cjs');
const WindowStore=require('./sues-window-cache.cjs');
const {execFile,spawn}=require('child_process');
const Native=require('./sues-native-ffmpeg.cjs');
const run=(args,timeout=180000)=>new Promise((ok,fail)=>execFile(args[0],args.slice(1),{encoding:'utf8',timeout,maxBuffer:2097152},(e,stdout,stderr)=>e?fail(Error(stderr||e.message)):ok(stdout)));
const delay=(ms)=>new Promise(r=>setTimeout(r,ms));
const failed=(msg,code=409)=>Object.assign(Error(msg),{code});
const validWindow=(w)=>Number.isSafeInteger(w.startFrame)&&Number.isSafeInteger(w.endFrame)&&w.startFrame>=0&&w.endFrame>w.startFrame;
const urlFile=(root,src)=>{
 if(typeof src!=="string"||!src.startsWith('/exports/'))throw failed('Invalid exported file path');
 const name=decodeURIComponent(src.slice('/exports/'.length));
 if(name!==path.basename(name)||name.includes('..'))throw failed('Invalid export filename');
 return path.join(root,name);
};
function createSegmentedExports({jobs,projectFile,exportsDir,chunkFrames=90,encoderProfile='delivery'}){
 const rate=Number(process.env.SUES_RESIDENT_BITRATE_MBPS);
 const cacheProfile=process.env.SUES_RESIDENT_WORKER==='1' && process.env.SUES_RESIDENT_BITRATE_MBPS && Number.isFinite(rate) && rate>=4 && rate<=40 ? encoderProfile+':resident-'+rate+'Mbps' : encoderProfile;
 const enabledWindowQA=process.env.SUES_WINDOW_REUSE==='1' && process.env.SUES_EXPORT_REUSE==='1';
 const windowProof=(project,frames,fps)=>{
  if(!enabledWindowQA)return null;
  const stable={...project,clips:[],revision:null,name:null};
  const compScoped=process.env.SUES_COMP_SCOPED_CACHE_QA==='1';
  if(compScoped)delete stable.comps; // composition definitions now live in their windows
  const globalMediaProof=Reuse.fingerprint({projectFile,appDir:__dirname,
   profile:cacheProfile,chunkFrames,snapshotRaw:Buffer.from(JSON.stringify(stable))});
  if(!globalMediaProof)return null;
  const rendererProof=WindowStore.shaFile(__filename)+':'+WindowStore.shaFile(require.resolve('./sues-window-reuse.cjs'));
  return Window.windows(project,{frames,fps,chunkFrames,globalMediaProof,rendererProof,compScoped});
 };
 const tasks=new Map();
 const view=(j)=>({id:j.id,kind:'export',status:j.status,cached:!!j.cached,via:'headless',range:'entire',profile:j.nativePlan?'native-ffmpeg-v1':encoderProfile,progress:j.progress,src:j.src||null,error:j.error||null,created:j.created,updated:j.updated});
 const active=()=>[...tasks.values()].find(j=>!['done','failed','cancelled'].includes(j.status));
 function ensure(j){if(j.cancelled)throw failed('Export cancelled');}
 async function checkProject(j){
  ensure(j);
  // The parent passes the immutable project snapshot in every child ticket.
  // Editing the live project during export is safe: we never re-read its clips.
  if(j.snapshot) return;
  const hash=crypto.createHash('sha256').update(fs.readFileSync(projectFile)).digest('hex');
  if(hash!==j.revisionHash)throw failed('Project changed during export; refused to mix different revisions');
 }
 async function child(j,opts){
  await checkProject(j);
  let ticket;
  for(let k=0;k<20;k++){
   try{ticket=jobs.request({...opts,where:process.env.SUES_RESIDENT_WORKER==='1'?'worker':'headless',trustedWorker:process.env.SUES_RESIDENT_WORKER==='1',sourceSession:j.id,revision:j.revision,snapshot:j.snapshot});break;}
   catch(e){if(e.code!==409||k===19)throw e;await delay(1000);ensure(j);}
  }
  j.child=ticket.id;
  for(let k=0;k<1200;k++){
   ensure(j);
   const current=jobs.get(ticket.id);
   if(!current)throw failed('Child export disappeared');
   if(current.status==='done')return current;
   if(['cancelled','failed'].includes(current.status))throw failed(current.error||current.status);
   if(Number.isFinite(current.progress))j.progress=Math.min(.97,j.base+j.weight*current.progress);
   j.updated=Date.now();await delay(1000);
  }
  throw failed('Child export timed out');
 }
 async function validatedClip(src,frames){
  const file=urlFile(exportsDir,src);
  const meta=JSON.parse(await run(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=codec_name,nb_frames,width,height','-of','json',file],45000));
  const v=meta.streams?.[0];
  if(!v||v.codec_name!=='h264'||Number(v.nb_frames)!==frames)throw failed(`Segment frame count mismatch: ${frames}`);
  return file;
 }
 async function execute(j){
  let scratch=null;
  const temporaryOutputs=new Set();
  try{
   j.status='running';j.updated=Date.now();
   scratch=fs.mkdtempSync(path.join(exportsDir,'.sues-parts-'));
   j.base=0;j.weight=.12;
   const fullMix=await child(j,{kind:'audio',range:'entire'});
   const wav=urlFile(exportsDir,fullMix.src);temporaryOutputs.add(wav);
   j.progress=.12;
   let queue=[];for(let st=0;st<j.frames;st+=chunkFrames)queue.push({startFrame:st,endFrame:Math.min(j.frames,st+chunkFrames)});
   const clips=[];
   while(queue.length){
    await checkProject(j);
    const w=queue.shift();j.base=.12+.78*(w.startFrame/j.frames);j.weight=.78*((w.endFrame-w.startFrame)/j.frames);
    try{
     const wi=Math.floor(w.startFrame/chunkFrames);
     if(j.windowSource?.reuse[wi]===true &&
        j.windowPlan?.[wi]?.startFrame===w.startFrame &&
        j.windowPlan?.[wi]?.endFrame===w.endFrame){
      const p=path.join(scratch,'reused-'+w.startFrame+'.mp4');
      try{
       await run(['ffmpeg','-nostdin','-hide_banner','-loglevel','error','-y',
        '-ss',String(w.startFrame/j.fps),'-i',j.windowSource.file,
        '-t',String((w.endFrame-w.startFrame)/j.fps),'-map','0:v:0','-an',
        '-c:v','copy','-avoid_negative_ts','make_zero',p],45000);
       const meta=JSON.parse(await run(['ffprobe','-v','error','-select_streams','v:0',
        '-show_entries','stream=codec_name,nb_frames,width,height','-of','json',p],20000));
       const v=meta.streams?.[0];
       if(v?.codec_name!=='h264'||Number(v.nb_frames)!==w.endFrame-w.startFrame ||
          Number(v.width)!==Number(j.snapshot.width)||Number(v.height)!==Number(j.snapshot.height))
        throw failed('Reused window failed frame/geometry verification');
       clips.push({at:w.startFrame,frames:w.endFrame-w.startFrame,path:p});
       j.progress=.12+.78*(w.endFrame/j.frames);j.updated=Date.now();j.child=null;
       continue;
      }catch(err){try{fs.unlinkSync(p)}catch{};console.warn('[SUES window QA] re-rendering unsafe reuse:',err.message)}
     }
     const res=await child(j,{kind:'export',range:'entire',profile:encoderProfile,videoOnly:true,window:w});
     const file=await validatedClip(res.src,w.endFrame-w.startFrame);
     temporaryOutputs.add(file);
     clips.push({at:w.startFrame,frames:w.endFrame-w.startFrame,path:file});
     j.progress=.12+.78*(w.endFrame/j.frames);j.updated=Date.now();
     j.child=null;
     if(process.env.SUES_RESIDENT_WORKER!=='1')await delay(1200); // resident renderer is never restarted between windows
    }catch(e){
     if(j.cancelled)throw e;
     if(w.endFrame-w.startFrame<=30)throw e;
     const middle=w.startFrame+Math.floor((w.endFrame-w.startFrame)/2);
     queue.unshift({startFrame:w.startFrame,endFrame:middle},{startFrame:middle,endFrame:w.endFrame});
    }
   }
   clips.sort((a,b)=>a.at-b.at);
   let next=0;for(const c of clips){if(c.at!==next)throw failed('Missing segment at frame '+next);next+=c.frames;}
   if(next!==j.frames)throw failed('Not all frames were exported');
   const list=path.join(scratch,'video.ffconcat');
   fs.writeFileSync(list,'ffconcat version 1.0\n'+clips.map(c=>`file '${c.path.replace(/'/g,"'\\''")}'\n`).join(''));
   const video=path.join(scratch,'video.mp4');
   await run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',list,'-map','0:v:0','-an','-c:v','copy',video],300000);
   j.progress=.94;
   const target=path.join(exportsDir,`SUES_export_${j.id}.mp4`);
   const pending=path.join(scratch,'output.mp4');
   await run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',video,'-i',wav,'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000','-ac','2','-t',String(j.frames/j.fps),'-movflags','+faststart',pending],300000);
   const info=JSON.parse(await run(['ffprobe','-v','error','-show_entries','format=duration:stream=codec_name,codec_type,nb_frames','-of','json',pending],45000));
   const v=info.streams?.find(s=>s.codec_type==='video'),a=info.streams?.find(s=>s.codec_type==='audio');
   if(!v||!a||v.codec_name!=='h264'||a.codec_name!=='aac'||+v.nb_frames!==j.frames||Math.abs(+info.format.duration-j.frames/j.fps)>.08)throw failed('Merged MP4 failed frame and audio checks');
   await checkProject(j);
   ensure(j);
   // Reject source/media/renderer mutations before publishing any mixed output.
   if(j.windowPlan){
    const post=windowProof(j.snapshot,j.frames,j.fps);
    if(!post||post.length!==j.windowPlan.length||
       post.some((w,i)=>w.key!==j.windowPlan[i].key))
       throw failed('Source or renderer changed during incremental export');
    if(j.windowSource && WindowStore.shaFile(j.windowSource.file)!==j.windowSource.sha256)
       throw failed('Previously cached master changed during incremental export');
   }
   ensure(j);
   fs.renameSync(pending,target);j.src='/exports/'+encodeURIComponent(path.basename(target));
   // Store a reusable output only if media, renderer, and project are still
   // byte-for-byte identical to the input of this completed export.
   try{
    const keyNow=Reuse.fingerprint({projectFile,appDir:__dirname,profile:cacheProfile,chunkFrames,snapshotRaw:j.projectRaw});
    if(j.cacheKey&&keyNow===j.cacheKey)Reuse.remember({exportsDir,key:j.cacheKey,frames:j.frames,fps:j.fps,src:j.src});
   }catch(err){console.warn('[SUES cache] unable to remember export:',err.message)}

   if(j.windowPlan)try{
    WindowStore.remember({exportsDir,src:j.src,windows:j.windowPlan,frames:j.frames,fps:j.fps});
   }catch(e){console.warn('[SUES window QA] manifest not saved:',e.message)}
   j.status='done';j.progress=1;j.updated=Date.now();
  }catch(e){j.error=String(e.message||e);j.status=j.cancelled?'cancelled':'failed';j.updated=Date.now();}
  finally{
   if(j.child&&j.status!=='done')jobs.cancel(j.child);
   if(scratch)fs.rmSync(scratch,{recursive:true,force:true});
   // Do not keep one intermediate MP4 per 3-second window or the PCM master.
   // All video bytes have already been copied into the atomically published MP4.
   for(const file of temporaryOutputs){try{fs.unlinkSync(file);}catch{}}
   if(process.env.SUES_RESIDENT_WORKER==="1")void jobs.releaseWorker().catch(e=>console.warn("[SUES resident] release failed:",e.message));
  }
 }

 async function executeNative(j){
  let scratch=null; j.status='running';j.updated=Date.now();
  try{
   ensure(j);
   scratch=fs.mkdtempSync(path.join(exportsDir,'.sues-native-'));
   const output=path.join(scratch,'native.mp4');
   const args=Native.command(j.nativePlan,output);
   args.splice(args.length-1,0,'-progress','pipe:2');
   await new Promise((resolve,reject)=>{
    const proc=spawn('ffmpeg',args,{stdio:['ignore','ignore','pipe']});
    j.nativeProc=proc;
    let errors='';
    proc.stderr.on('data',b=>{
     const t=b.toString();errors=(errors+t).slice(-4000);
     const matches=[...t.matchAll(/out_time_(?:us|ms)=(\d+)/g)];
     if(matches.length){
      const micros=Number(matches.at(-1)[1]);
      if(Number.isFinite(micros))j.progress=Math.min(.94,Math.max(j.progress,micros/(j.frames/j.fps*1000000)*.94));
      j.updated=Date.now();
     }
    });
    proc.once('error',reject);
    proc.once('close',(code,signal)=>code===0?resolve():reject(failed('Native FFmpeg failed: '+(errors||signal||code))));
    if(j.cancelled)proc.kill('SIGTERM');
   });
   j.nativeProc=null;ensure(j);
   const stat=fs.statSync(output);
   if(!stat.isFile()||stat.size<200)throw failed('Native export missing MP4');
   const info=JSON.parse(await run(['ffprobe','-v','error','-show_entries','format=duration:stream=codec_name,codec_type,nb_frames','-of','json',output],30000));
   const v=info.streams?.find(x=>x.codec_type==='video'),a=info.streams?.find(x=>x.codec_type==='audio');
   if(!v||!a||v.codec_name!=='h264'||a.codec_name!=='aac'||+v.nb_frames!==j.frames||Math.abs(+info.format.duration-j.frames/j.fps)>.08)throw failed('Native export frame/audio mismatch');
   ensure(j);
   if(j.cacheKey){
    const now=Reuse.fingerprint({projectFile,appDir:__dirname,profile:'native-ffmpeg-v1',chunkFrames,snapshotRaw:j.projectRaw});
    if(now!==j.cacheKey)throw failed('Native inputs changed during export');
   }
   const target=path.join(exportsDir,'SUES_export_'+j.id+'.mp4');
   fs.renameSync(output,target);j.src='/exports/'+encodeURIComponent(path.basename(target));
   try{if(j.cacheKey)Reuse.remember({exportsDir,key:j.cacheKey,frames:j.frames,fps:j.fps,src:j.src})}catch(e){console.warn('[SUES native cache]',e.message)}
   j.status='done';j.progress=1;j.updated=Date.now();
  }catch(e){j.error=j.cancelled?'cancelled':String(e.message||e);j.status=j.cancelled?'cancelled':'failed';j.updated=Date.now()}
  finally{if(j.nativeProc)try{j.nativeProc.kill('SIGTERM')}catch{};j.nativeProc=null;if(scratch)fs.rmSync(scratch,{force:true,recursive:true})}
 }
 return {
  request(){
   if(active())throw failed('A segmented export is still running');
   const raw=fs.readFileSync(projectFile),project=JSON.parse(raw.toString('utf8').replace(/^\uFEFF/,''));
   const fps=Number(project.fps||30);
   const ends=(project.clips||[]).map(c=>Number(c.start||0)+Number(c.duration||0));
   const frames=Math.round(Math.max(0,...ends)*fps);
   if(!(fps>0&&frames>=1&&frames<=108000))throw failed('Invalid timeline frame count',400);
   const nativePlan=process.env.SUES_NATIVE_FFMPEG==='1'?Native.evaluate(project,{dataDir:path.dirname(projectFile)}):null;
   const engine=nativePlan?.ok?'native-ffmpeg-v1':cacheProfile;
   let cacheKey=null,cached=null;
   try{
    cacheKey=Reuse.fingerprint({projectFile,appDir:__dirname,profile:engine,chunkFrames});
    cached=Reuse.lookup({exportsDir,key:cacheKey,frames,fps});
   }catch(err){console.warn('[SUES cache] safe miss:',err.message)}
   const id='xs_'+crypto.randomBytes(6).toString('hex'),now=Date.now();
   const j={id,status:cached?'done':'pending',progress:cached?1:0,cached:!!cached,cacheKey,nativePlan:nativePlan?.ok?nativePlan:null,created:now,updated:now,frames,fps,
     revision:project.revision||0,snapshot:project,projectRaw:raw,revisionHash:crypto.createHash('sha256').update(raw).digest('hex'),
     child:null,cancelled:false,src:cached?.src||null,error:null,base:0,weight:0};
   if(!cached&&!j.nativePlan)try{
    j.windowPlan=windowProof(project,frames,fps);
    if(j.windowPlan)j.windowSource=WindowStore.lookup({exportsDir,
      windows:j.windowPlan,frames,fps});
   }catch(e){console.warn('[SUES window QA] safe cache miss:',e.message)}
   tasks.set(id,j);if(!cached)setImmediate(()=>void (j.nativePlan?executeNative(j):execute(j)));
   const housekeeping=setTimeout(()=>{if(['done','failed','cancelled'].includes(j.status))tasks.delete(id);},2*3600000);
   housekeeping.unref?.();
   return view(j);
  },
  get(id){const j=tasks.get(id);return j?view(j):null;},
  cancel(id){const j=tasks.get(id);if(!j)return null;
   if(!['done','failed','cancelled'].includes(j.status)){
    j.cancelled=true;j.status='cancelled';j.error='cancelled';j.updated=Date.now();
    if(j.child)jobs.cancel(j.child);
    if(j.nativeProc)try{j.nativeProc.kill('SIGTERM')}catch{};
   }
   return view(j);
  },
  busy(){return Boolean(active());},
  shutdown(){for(const j of tasks.values()){if(j.child)jobs.cancel(j.child);if(j.nativeProc)try{j.nativeProc.kill('SIGTERM')}catch{}}},
 };
}
module.exports={createSegmentedExports};
