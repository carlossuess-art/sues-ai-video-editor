#!/usr/bin/env node
/** Technical integration QA only. Never a creative approval or publication.
 * Imports a word-timed HyperFrames test MP4 into the actual 10 Nov V18
 * FableCut project CLONE, preserving every existing clip and media element.
 * Does not call the Master Director human-approval ledger, because Carlos has
 * not approved a creative plan for this specific prototype.
 */
import {readFileSync,writeFileSync,existsSync,realpathSync,lstatSync,copyFileSync,constants,statSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const require0=(ok,msg)=>{if(!ok)throw Error(msg)};
const sha=data=>createHash('sha256').update(data).digest('hex');
const root='/opt/sues-video-setup/motion-narrative-review-20261115/fablecut-private-qa/reel-20261110-v18-hf';
const v18='/srv/sues-fablecut-next/data/automation-v1/test-project-040-v18';
const rec='/srv/sues-fablecut-next/data/automation-v1/recording-20261110-115912';
const hf='/opt/sues-video-setup/hyperframes-engine-next/sues-motion-narrative-20261115/qa-real-reel-v18-20261115';
const server='/srv/sues-fablecut-next/app/mcp-server.js';
const file=join(root,'project.json'),privateMP4=join(hf,'hf-real-reel-v18-QA.mp4');
const marker=join(root,'ISOLATED_HF_QA_NOT_PRODUCTION.txt');
require0(realpathSync(root)===root&&existsSync(marker)&&lstatSync(marker).isFile(),'No V18 QA clone sentinel');
require0(realpathSync(join(rec,'original.mp4'))===join(rec,'original.mp4'),'Original source not canonical');
require0(!existsSync(join(root,'qa-hf-v18-real-reel-intake.json')),'Refuse second import of QA reel');
const t=JSON.parse(readFileSync(join(hf,'real-reel-timing-qa.json'),'utf8'));
const before=JSON.parse(readFileSync(file,'utf8'));
const original=JSON.parse(readFileSync(join(v18,'project.json'),'utf8'));
const rendered=readFileSync(privateMP4);
require0(sha(readFileSync(join(rec,'original.mp4')))==='0190efba90de1f7f73bfef8fc1c3822779a82c123225f77b68a50a9b31a77ad8'&&
 t.originalSha256==='0190efba90de1f7f73bfef8fc1c3822779a82c123225f77b68a50a9b31a77ad8','Wrong user original');
require0(sha(readFileSync(file))===sha(readFileSync(join(v18,'project.json')))&&
 sha(readFileSync(file))===t.projectSha256&&before.revision===23&&
 before.clips.length===165&&before.media.length===49&&
 before.width===1080&&before.height===1920&&before.fps===30,
 'V18 QA clone changed or wrong project');
const shaRendered=sha(rendered);
const probe=spawnSync('ffprobe',['-v','error','-show_entries',
 'stream=codec_type,codec_name,width,height,r_frame_rate,nb_frames:format=duration,size',
 '-of','json',privateMP4],{encoding:'utf8',timeout:18000});
require0(probe.status===0,'HF native render probe failed');
const info=JSON.parse(probe.stdout),v=info.streams.filter(s=>s.codec_type==='video');
require0(v.length===1&&info.streams.filter(s=>s.codec_type==='audio').length===0&&
 v[0].codec_name==='h264'&&v[0].width===1080&&v[0].height===1920&&
 v[0].nb_frames==='151'&&v[0].r_frame_rate==='30/1'&&
 Math.abs(Number(info.format.duration)-151/30)<.02,'Not a verified silent HF 151-frame video');
require0(t.state==='TIMING_MAPPED_NOT_CREATIVELY_APPROVED'&&
 t.projectRevision===23&&t.clipStartFrame===1488&&t.clipEndFrame===1639&&
 t.wordAnchors.length===8&&t.existingUpperGraphicsOverlaps.length>0&&
 t.creativeApproval===false&&t.productionChanged===false&&
 t.wordAnchors.every((w,i)=>Number.isFinite(w.editStart)&&
  Math.abs(w.editStart*30-(1488+w.localFrame))<=1),'Word mapping or QA conflict evidence missing');
require0(before.tracks.some(x=>x.id==='V9'&&x.kind==='video')&&
 before.clips.every(x=>x.id!=='c_hf_v18_unapproved_qa_1488'),'Test upper video track unavailable');
const mediaName='hf-v18-unapproved-qa-'+shaRendered.slice(0,24)+'.mp4';
const dest=join(root,'media',mediaName),mediaId='m_hf_v18_qa_'+shaRendered.slice(0,20);
require0(!existsSync(dest),'A clone media target already exists; reconcile before retry');
writeFileSync(join(root,'qa-hf-v18-before.json'),JSON.stringify(before,null,2)+'\n',
 {flag:'wx',mode:0o600});
copyFileSync(privateMP4,dest,constants.COPYFILE_EXCL);
require0(sha(readFileSync(dest))===shaRendered,'Native HF copy changed');
const request={jsonrpc:'2.0',id:1,method:'tools/call',params:{
 name:'fablecut_patch_project',arguments:{baseRevision:before.revision,ops:[
  {op:'addMedia',media:{id:mediaId,kind:'video',src:'/media/'+mediaName,
   name:'HyperFrames QA · V18 · UNAPPROVED',duration:151/30,width:1080,height:1920,fps:30}},
  {op:'addClip',clip:{id:'c_hf_v18_unapproved_qa_1488',mediaId,kind:'video',
   track:'V9',start:1488/30,in:0,duration:151/30,
   name:'HF QA ONLY - REQUIRES CREATIVE REVIEW',props:{fit:'fill',opacity:1,x:0,y:0,scale:1}}},
  {op:'setProject',set:{inPoint:1488/30,outPoint:1639/30}}
 ]}}};
const process=spawnSync('node',[server],{env:{...process.env,
 FABLECUT_DATA_DIR:root,FABLECUT_PORT:'17947',PORT:'17947',HOST:'127.0.0.1'},
 input:JSON.stringify(request)+'\n',encoding:'utf8',timeout:25000,maxBuffer:250000});
require0(process.status===0,'FableCut MCP QA patch process failed: '+String(process.stderr).slice(0,450));
const rpc=process.stdout.split('\n').filter(s=>s.startsWith('{')).map(x=>JSON.parse(x)).find(x=>x.id===1);
const output=rpc?.result?.content?.find(x=>x.type==='text')?.text;
require0(!rpc?.result?.isError&&typeof output==='string'&&output.startsWith('Patched'),
 'FableCut V18 clone patch uncertain: '+String(output).slice(0,400));
const after=JSON.parse(readFileSync(file,'utf8'));
require0(after.revision===24&&after.media.length===50&&after.clips.length===166&&
 before.clips.every(c=>after.clips.some(x=>x.id===c.id&&JSON.stringify(x)===JSON.stringify(c)))&&
 before.media.every(m=>after.media.some(x=>x.id===m.id&&JSON.stringify(x)===JSON.stringify(m)))&&
 after.clips.some(c=>c.id==='c_hf_v18_unapproved_qa_1488'&&c.mediaId===mediaId&&
  c.track==='V9'&&c.start===1488/30&&Math.abs(c.duration-151/30)<1e-6)&&
 after.inPoint===1488/30&&after.outPoint===1639/30&&
 sha(readFileSync(dest))===shaRendered,'V18 post-CAS readback inconsistent: NO RETRY');
const receipt={schema:'sues-hf-real-reel-v18-qa-intake/v1',
 status:'REAL_REEL_SOURCE_SYNCHRONIZED_PRIVATE_FABLECUT_CLONE_PATCHED',
 originalFileSha256:t.originalSha256,normalizedFileSha256:t.normalizedSourceSha256,
 originalV18ProjectSha256:t.projectSha256,afterV18ProjectSha256:sha(readFileSync(file)),
 clonedRevisionBefore:23,clonedRevisionAfter:24,
 clipStartFrame:1488,clipEndFrameExclusive:1639,
 graphicsTrack:'V9',clipId:'c_hf_v18_unapproved_qa_1488',mediaId,
 motionSha256:shaRendered,wordAnchors:t.wordAnchors,
 existingUpperGraphicsOverlaps:t.existingUpperGraphicsOverlaps,
 originalClipsPreserved:165,originalMediaPreserved:49,
 qaOnly:true,requiresCollisionReview:true,creativeApproved:false,
 fullAVReview:false,publicationAuthorized:false,productionChanged:false};
writeFileSync(join(root,'qa-hf-v18-real-reel-intake.json'),
 JSON.stringify(receipt,null,2)+'\n',{flag:'wx',mode:0o600});
console.log(JSON.stringify({status:receipt.status,rev:receipt.clonedRevisionAfter,
 clips:after.clips.length,media:after.media.length,topLayer:receipt.graphicsTrack,
 wordIds:receipt.wordAnchors.map(w=>w.id),conflicts:receipt.existingUpperGraphicsOverlaps.length,
 sourceSha256:receipt.originalFileSha256,productionChanged:false}));
