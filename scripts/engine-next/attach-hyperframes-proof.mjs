/** Local staged integration, not automatic production deploy. */
import fs from 'node:fs/promises';import path from 'node:path';import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {FableCutClient} from '../../src/engine-next/fablecut-client.js';
const root='/opt/sues-video-setup/hyperframes-engine-next/sues-motion-proof';
const file=path.join(root,'sues-gold-3d-alpha.webm');
const source=path.join(root,'index.html');
const bytes=await fs.readFile(file);
const probe=JSON.parse(execFileSync('/usr/bin/ffprobe',['-v','error','-select_streams','v:0','-show_entries','stream=codec_name,width,height:stream_tags=alpha_mode','-of','json',file],{encoding:'utf8'}));
const video=probe.streams?.[0];
if(video?.codec_name!=='vp9'||video?.tags?.alpha_mode!=='1')throw Error('Verified alpha VP9 required');
const client=new FableCutClient();
const initial=await client.getProject();
if(!/^SUES 158404/.test(initial.data.name||''))throw Error('Wrong staging project');
const assetId='m_sues_hyperframes_gold_3d_alpha_proof';const clipId='sues_hyperframes_gold_3d_review_only';
if(initial.data.media.some(m=>m.id===assetId))throw Error('Already imported, refusing duplicate');
const src=await client.uploadMedia(bytes,{name:'sues-hyperframes-gold-3d-alpha.webm'});
const result=await client.updateProject(p=>{
 if(!p.tracks.some(t=>t.id==='V4'&&t.kind==='video'))throw Error('Video layer V4 missing');
 p.media.push({id:assetId,kind:'video',name:'SUES HyperFrames · 3D gold source-linked proof',src,duration:1.2,width:video.width,height:video.height,size:bytes.length});
 p.clips.push({id:clipId,mediaId:assetId,kind:'video',track:'V4',start:4,in:0,duration:1.2,props:{fit:'contain',scale:.5,x:240,y:0},disabled:true,name:'HYPERFRAMES 3D · review only · enable after visual QA'});
 return p;
},{projectId:initial.projectId,expectedRevision:initial.data.revision});
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const manifest={schema:'sues-hyperframes-fablecut-bridge/v1',status:'IMPORTED_DISABLED_PENDING_VISUAL_QA',projectId:result.projectId,revision:result.revision,mediaId:assetId,clipId,mediaSrc:src,alpha:video.tags.alpha_mode,videoSha256:sha(bytes),sourceSha256:sha(await fs.readFile(source)),sourcePath:source,renderPath:file};
const output=path.join(root,'sues-fablecut-3d-bridge-manifest.json');await fs.writeFile(output,JSON.stringify(manifest,null,2));
console.log(JSON.stringify({ok:true,manifest},null,2));