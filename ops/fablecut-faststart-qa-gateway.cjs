'use strict';
/** Private FableCut clone only. Never install in production without formal hardening.
 * Fail closed: every export obtains a new server-verified binding, and the
 * project references only its original asset. A missing pair is auto-built.
 */
const fs=require('node:fs');
const fsp=require('node:fs/promises');
const path=require('node:path');
const crypto=require('node:crypto');
const {execFile}=require('node:child_process');
const {promisify}=require('node:util');
const execFileAsync=promisify(execFile);
const SHA=/^[a-f0-9]{64}$/;
const isSafeName=n=>typeof n==='string'&&/^[a-zA-Z0-9._-]{1,120}\.mp4$/.test(n)&&n!=='.mp4'&&!n.startsWith('..');
const fileSHA=async file=>{
  const hash=crypto.createHash('sha256');
  await new Promise((ok,no)=>{const st=fs.createReadStream(file);st.on('data',b=>hash.update(b));st.on('end',ok);st.on('error',no)});
  return hash.digest('hex');
};
async function regularFileWithoutSymlink(file,root){
  const stat=await fsp.lstat(file);
  if(!stat.isFile()||stat.isSymbolicLink()||stat.size<100)throw Error('Not a regular data asset');
  const real=await fsp.realpath(file),realRoot=await fsp.realpath(root);
  if(path.dirname(real)!==realRoot)throw Error('Asset escaped private media directory');
  return stat;
}
function createFaststartQaGateway({dataDir,sourceName,cacheName,sourceSha256,builderPath,pythonBin='python3',host='127.0.0.1',sourceTimeline=null}){
  if(host!=='127.0.0.1'||!path.isAbsolute(dataDir)||!path.isAbsolute(builderPath)||
    !isSafeName(sourceName)||!isSafeName(cacheName)||sourceName===cacheName||!SHA.test(sourceSha256||''))
    throw Error('Private verified-cache gateway refuses unsafe configuration');
  if(sourceTimeline&&(!Number.isInteger(sourceTimeline.frames)||sourceTimeline.frames<1||sourceTimeline.frames>18000||
    !Number.isInteger(sourceTimeline.spans)||sourceTimeline.spans<1||sourceTimeline.spans>100||
    sourceTimeline.fps!==30||sourceTimeline.width!==1080||sourceTimeline.height!==1920))throw Error('Invalid protected source timeline');
  const mediaDir=path.join(dataDir,'media'),source=path.join(mediaDir,sourceName),cache=path.join(mediaDir,cacheName);
  const manifest=path.join(mediaDir,cacheName+'.verified.json');
  const sourceUrl='/media/'+encodeURIComponent(sourceName),cacheUrl='/media/'+encodeURIComponent(cacheName);
  let running=null;
  const verify=async()=>{
    const project=JSON.parse(await fsp.readFile(path.join(dataDir,'project.json'),'utf8'));
    if(!Array.isArray(project.media)||!project.media.some(m=>m?.src===sourceUrl)||
      !Array.isArray(project.clips)||!project.clips.some(c=>(sourceTimeline?c?.kind==='video':c?.locked===true)&&project.media.some(m=>m?.id===c.mediaId&&m.src===sourceUrl)))
      throw Error('Active editable project no longer uses the protected authentic source');
    if(sourceTimeline){
      const spans=project.clips.filter(c=>c.track==='V1').sort((a,b)=>a.start-b.start);
      let cursor=0;
      for(const c of spans){
        const m=project.media.find(m=>m.id===c.mediaId);
        if(c.kind!=='video'||m?.src!==sourceUrl||!Number.isFinite(c.start)||!Number.isFinite(c.in)||!Number.isFinite(c.duration)||
          Math.abs(c.start-cursor)>1e-6||Math.abs(c.in-c.start)>1e-6||c.duration<=0||
          c.disabled||project.disabledTracks?.includes('V1')||c.props?.speed!==undefined&&c.props.speed!==1||c.keyframes?.speed?.length)
          throw Error('Unverified scene-split source clock');
        cursor=c.start+c.duration;
      }
      if(spans.length!==sourceTimeline.spans||project.fps!==sourceTimeline.fps||project.width!==sourceTimeline.width||project.height!==sourceTimeline.height||Math.abs(cursor-sourceTimeline.frames/sourceTimeline.fps)>1e-6)
        throw Error('Incomplete protected source timeline');
    }
    await regularFileWithoutSymlink(source,mediaDir);
    if(await fileSHA(source)!==sourceSha256)throw Error('Original source SHA changed');
    const files=await Promise.all([fsp.lstat(cache).catch(e=>e.code==='ENOENT'?null:Promise.reject(e)),fsp.lstat(manifest).catch(e=>e.code==='ENOENT'?null:Promise.reject(e))]);
    if(!files[0]&&!files[1]){
      await execFileAsync(pythonBin,[builderPath,'--source',source,'--expected-sha256',sourceSha256,
        '--cache',cache,'--manifest',manifest,'--source-url',sourceUrl,'--cache-url',cacheUrl],{timeout:330000,maxBuffer:1<<20});
    }else if(!files[0]||!files[1])throw Error('Incomplete cache and manifest pair; manual investigation required');
    await regularFileWithoutSymlink(cache,mediaDir);await regularFileWithoutSymlink(manifest,mediaDir);
    const proof=JSON.parse(await fsp.readFile(manifest,'utf8'));
    if(proof.schema!=='sues-native-faststart-cache/v1'||proof.sourceSha256!==sourceSha256||
      proof.sourceMediaUrl!==sourceUrl||proof.cacheMediaUrl!==cacheUrl||
      !SHA.test(proof.cacheSha256||'')||proof.sourcePreserved!==true||proof.decoderOnly!==true||
      proof.noReencoding!==true||proof.videoPacketTimelineExact!==true||proof.audioPacketTimelineExact!==true||
      proof.videoBitstreamEqual!==true||proof.audioBitstreamEqual!==true||
      proof.productionActivation!==false||proof.creativeApproved!==false||
      !Number.isInteger(proof.videoPacketCount)||proof.videoPacketCount<1||
      !Number.isInteger(proof.audioPacketCount)||proof.audioPacketCount<1)
      throw Error('Cache provenance/packet verification is not approved');
    if(await fileSHA(cache)!==proof.cacheSha256)throw Error('Cache SHA changed after creation');
    if(await fileSHA(source)!==sourceSha256)throw Error('Original source changed while checking cache');
    return Object.freeze({verified:true,decoderOnly:true,sourceMediaUrl:sourceUrl,cacheMediaUrl:cacheUrl,
      sourceSha256,cacheSha256:proof.cacheSha256,videoPacketCount:proof.videoPacketCount,
      audioPacketCount:proof.audioPacketCount,production:false});
  };
  return {
    async binding(){
      // single-flight for concurrent two-source video layers; no stale result reused across exports
      if(running)return running;
      running=verify().finally(()=>{running=null});
      return running;
    },
    private:true,
  };
}
module.exports={createFaststartQaGateway,isSafeName,fileSHA};
