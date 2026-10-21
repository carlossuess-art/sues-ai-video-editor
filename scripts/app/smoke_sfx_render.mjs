// Generated-media QA; never changes a production job or invokes an AI service.
import assert from 'node:assert/strict';
import {mkdirSync,copyFileSync,readFileSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {fixture} from '../../tests/helpers/editor-fixture.js';
import {loadProject,prepareProject,writePreparedBundle,fileSha256,RENDER_SCRIPT} from '../../src/local-pipeline.js';
const out=resolve(process.argv[2]),sfx=resolve(process.argv[3]);mkdirSync(out,{recursive:true,mode:0o700});
const f=fixture(),source=join(f.dir,'source.mp4'),music=join(f.dir,'music.wav');
execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','color=c=0x18303a:s=1080x1920:r=30:d=24','-f','lavfi','-i','sine=frequency=180:duration=24','-c:v','libx264','-threads','2','-preset','ultrafast','-c:a','aac','-shortest','-y',source]);
execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','sine=frequency=220:duration=24.5','-y',music]);
for(const n of ['OpenSans.ttf','OpenSans-Bold.ttf','OFL.txt'])copyFileSync(resolve('assets/fonts',n),join(f.dir,'fonts',n));
const p=loadProject(f.profiles.test),id=fileSha256(sfx),mid=fileSha256(music),info=JSON.parse(execFileSync('ffprobe',['-v','error','-show_format','-of','json',sfx]));
p.resolveAsset=(assetId,kind)=>assetId===id&&kind==='sfx'?{kind,assetId:id,sha256:id,rights:'licensed',title:'QA whoosh',duration:Number(info.format.duration),localFile:sfx}:{assetId:mid,sha256:mid,kind:'audio',rights:'owned',duration:24.5,localFile:music};
const prepared=prepareProject(p,{musicAssetId:mid,musicGain:.08,sfxEvents:[{assetId:id,start:2.125,gain:.3},{assetId:id,start:5.5,gain:.2}],sfxEnabled:true,transitions:[{type:'warm',start:15.27}],zoomIntensity:0}),before=fileSha256(source),bundle=join(out,'bundle');writePreparedBundle(p,prepared,bundle);
execFileSync('python3',[RENDER_SCRIPT,'--source',source,'--bundle',bundle,'--out',join(out,'render.mp4')],{maxBuffer:4e6});const audit=JSON.parse(readFileSync(join(out,'render.audit.json')));assert.equal(audit.fullDecode,'pass');assert.equal(audit.sourcePreserved,true);assert.equal(audit.customSfx.assets.length,1);assert.equal(audit.customSfx.events[0].start,2.125);assert.equal(fileSha256(source),before);assert.ok(Math.abs(audit.durationEncoded-24)<=1/30+.001);writeFileSync(join(out,'result.json'),JSON.stringify({realRender:true,fullDecode:true,sourcePreserved:true,musicAndProceduralAndCustomMixed:true,repeatedCustomResourceInputs:1,customCues:2,duration:audit.durationEncoded,outputSha256:audit.outputSha256,externalCostUSD:0},null,2));console.log(readFileSync(join(out,'result.json'),'utf8'));
