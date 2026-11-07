/** Offline 4 s B02 composition proof, not an approved clip or production command.
 * Reproducible, source-bound and reversible. No change to the FableCut project.
 * Usage: node scripts/engine-next/render-b02-matte-proof.mjs --source /abs/source.mp4 --image /abs/child.jpg --mask /abs/alpha.mkv --report /abs/alpha.json --out /abs/new-candidate.mp4
 */
import fs from 'node:fs/promises';import path from 'node:path';import {createHash} from 'node:crypto';import {spawnSync} from 'node:child_process';
import {validateTemporalMatteEvidence} from '../../src/engine-next/temporal-matte-evidence.js';
const argv=process.argv.slice(2),option=key=>{const i=argv.indexOf(key);return i>=0?argv[i+1]:null;};
const source=option('--source'),image=option('--image'),matte=option('--mask'),reportPath=option('--report'),out=option('--out');
if(![source,image,matte,reportPath,out].every(p=>typeof p==='string'&&path.isAbsolute(p)))throw Error('All five absolute paths required');
if(await fs.stat(out).then(()=>true).catch(()=>false))throw Error('Proof output already exists: refusing overwrite');
const hash=async p=>createHash('sha256').update(await fs.readFile(p)).digest('hex');
const report=JSON.parse(await fs.readFile(reportPath,'utf8'));
const maskHash=await hash(matte);if(maskHash!==report.outputSha256)throw Error('Matte bytes changed');
const sourceHash=await hash(source);if(sourceHash!==report.sourceSha256)throw Error('Original source hash changed');
const probe=file=>{const r=spawnSync('/usr/bin/ffprobe',['-v','error','-select_streams','v:0','-count_frames','-show_entries','stream=codec_name,pix_fmt,width,height,nb_read_frames','-of','json',file],{encoding:'utf8',timeout:25000});if(r.status!==0)throw Error('FFprobe failed');return JSON.parse(r.stdout).streams?.[0];};
const evidence=validateTemporalMatteEvidence(report,{...probe(matte),nb_frames:probe(matte)?.nb_read_frames},{sourceSha256:sourceHash,expectedStart:9.5,expectedFrames:120});
const imageHash=await hash(image);
const fade="[0:v]fps=30,scale=1080:1920,format=rgba,split=2[original][base];"+
 "[1:v]scale=500:890,format=rgb24[child];"+
 "nullsrc=s=500x890,format=gray,geq=lum='255*min(1,min(X,W-X)/75)*min(1,min(Y,H-Y)/85)'[fade];"+
 "[child][fade]alphamerge[childf];[base][childf]overlay=x=560:y=560:format=auto[withchild];"+
 "[2:v]scale=1080:1920,format=gray,boxblur=luma_radius=5:luma_power=1[matte];"+
 "[original][matte]alphamerge[subject];[withchild][subject]overlay=x=0:y=0:format=auto,format=yuv420p[out]";
const args=['-hide_banner','-v','error','-xerror','-threads','1','-ss','9.5','-t','4','-i',source,'-loop','1','-framerate','30','-t','4','-i',image,'-i',matte,'-filter_complex',fade,'-map','[out]','-an','-t','4','-r','30','-frames:v','120','-c:v','libx264','-preset','veryfast','-threads','1','-crf','24','-movflags','+faststart','-n',out];
const ff=spawnSync('/usr/bin/ffmpeg',args,{encoding:'utf8',timeout:180000,maxBuffer:250000});
if(ff.status!==0)throw Error('FFmpeg composition failed: '+(ff.stderr||'').slice(-400));
const encoded=probe(out);if(encoded?.codec_name!=='h264'||encoded.width!==1080||encoded.height!==1920||Number(encoded.nb_read_frames)!==120)throw Error('Wrong candidate frame count or dimensions');
const manifest={schema:'sues-b02-masked-composite-proof/v1',status:'CANDIDATE_NOT_VISUALLY_APPROVED',sourceSha256:sourceHash,imageSha256:imageHash,maskSha256:maskHash,outputSha256:await hash(out),startSeconds:9.5,frames:120,canvas:{width:1080,height:1920,fps:30},matte:evidence,
 imageRect:{x:560,y:560,width:500,height:890,featherX:75,featherY:85},subjectAlphaFeatherPx:5,
 sound:'no-audio-technical-proof',limitations:['flattened candidate, NOT NLE-editable mask','licensed image provenance to confirm','temporal contour review required','not Film Director approved','preview/export parity not proven']};
await fs.writeFile(out+'.json',JSON.stringify(manifest,null,2));console.log(JSON.stringify({output:out,sha:manifest.outputSha256,status:manifest.status,frames:120}));