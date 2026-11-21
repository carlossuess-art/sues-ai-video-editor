// Technical hybrid POC only: existing native child MP4 -> Remotion overlays.
// Synthetic fixture, not an authenticated production job or final editable export.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {loadMasterPreviewConfig} from '../src/master-director-runtime-config.js';
import {renderMasterDirectorPreview} from '../src/master-director-preview-renderer.js';
import {auditMasterDirectorMedia} from '../src/master-director-technical-audit.js';
const root='/qa',sourcePath=root+'/native-stage.mp4';
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const id=hash(sourcePath),fontPath=root+'/fonts/Montserrat-Bold.ttf',font=hash(fontPath);
const config=loadMasterPreviewConfig('/tmp/sues-master-preview-v2-staging.json');
const metadata=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',sourcePath],{encoding:'utf8'}));
const video=metadata.streams.find(s=>s.codec_type==='video');
assert.equal(video.avg_frame_rate,'30/1');assert.equal(video.width,1080);assert.equal(video.height,1920);
assert.ok(metadata.streams.some(s=>s.codec_type==='audio'));
assert.ok(Math.abs(Number(metadata.format.duration)-12)<.1);
const v={rect:{x:50,y:170,width:890,height:220},zIndex:6,opacity:1,
 typography:{family:'Montserrat',sizePx:96,weight:700,color:'#ffffff'},
 keyframes:[{atFrame:0,opacity:0},{atFrame:18,opacity:1,easing:'ease-in-out'}]};
const composition={schema:'sues-remotion-layers/v1',planFingerprint:'f'.repeat(64),
 sourceSha256:id,canvas:{width:1080,height:1920},fps:30,durationFrames:360,
 source:{assetId:id,fit:'fill',audio:true,spans:[{sourceInFrame:0,startFrame:0,endFrame:360}]},
 layers:[{id:'hybrid-title',kind:'text',startFrame:60,endFrame:160,fontAssetId:font,
  text:'SEGUNDA ETAPA',visual:v}]};
const project={sourcePath,boundHashes:{source:id},fontDirectory:root+'/fonts',
 fontHashes:{'Montserrat-Bold.ttf':font}};
const result=await renderMasterDirectorPreview({composition,project,assets:{resolve(){throw Error('unexpected asset')},metadata(){throw Error('unexpected metadata')}},
 workRoot:root+'/remotion-preview',...config,approvalCheck:async()=>true});
assert.equal(result.status,'PREVIEW_RENDERED_UNVERIFIED',JSON.stringify(result.issues));
const audit=await auditMasterDirectorMedia({sourcePath,sourceSha256:id,outputPath:result.outputPath,expected:{width:270,height:480,duration:12,fps:30}});
assert.equal(audit.status,'TECHNICAL_PASS_HUMAN_QA_PENDING',JSON.stringify(audit));
assert.equal(audit.fullDecode,true);
const frame=(path,seconds,scale)=>execFileSync('ffmpeg',['-v','error','-ss',String(seconds),'-i',path,'-frames:v','1','-vf',scale?'scale=270:480,format=rgb24':'format=rgb24','-f','rawvideo','-pix_fmt','rgb24','-'],{maxBuffer:3*1024*1024});
const before=frame(sourcePath,3,true),after=frame(result.outputPath,3,false);
assert.equal(before.length,after.length);
let changed=0;for(let i=0;i<before.length;i++)if(Math.abs(before[i]-after[i])>32)changed++;
assert.ok(changed>1000,'Remotion overlay was absent from the native video');
console.log(JSON.stringify({status:'TWO_STAGE_TECHNICAL_PASS_NOT_PRODUCTION',nativeSourceSha256:id,previewSha256:audit.outputSha256,
 frames:360,overlaidChannels:changed,decoded:true,audioPresent:audit.audioPresent,
 note:'Original native project editability and overlay graph must be linked by a future authenticated mixed project/version contract.'}));
