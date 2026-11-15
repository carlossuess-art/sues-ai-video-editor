/**
 * Auxiliary SVG proxy renderer. This is NOT a HyperFrames/FableCut-native export.
 * The master source remains deterministic SVG. Usage in isolated staged directory:
 * SUES_SHARP_MODULE=/absolute/path/to/node_modules/sharp node render-svg-proxy.mjs
 */
import {createRequire} from 'node:module';
import {existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {join,dirname,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {renderCardToSpaceSvg,SEQUENCE_FRAMES} from './runtime/sequence-card-to-space.js';

const require=createRequire(import.meta.url);
const pkg=process.env.SUES_SHARP_MODULE??'sharp';
const sharp=require(pkg);
const root=dirname(new URL(import.meta.url).pathname);
const frameDir=join(root,'proxy-frames');
const output=join(root,'SUES_CARD_TO_SPACE_PROXY_QA.mp4');
if(existsSync(output)||existsSync(frameDir))throw Error('Proxy already exists: keep prior evidence rather than overwrite');
if(SEQUENCE_FRAMES!==151)throw Error('Frame count changed; review A/V chronology before rendering');
mkdirSync(frameDir,{recursive:false});
const width=540,height=960,fps=30;
for(let frame=0;frame<SEQUENCE_FRAMES;frame++){
 const svg=renderCardToSpaceSvg(frame);
 const dest=join(frameDir,'frame-'+String(frame).padStart(3,'0')+'.png');
 await sharp(Buffer.from(svg)).resize(width,height).png({compressionLevel:6}).toFile(dest);
}
const args=['-hide_banner','-loglevel','error','-framerate',String(fps),'-start_number','0','-i',join(frameDir,'frame-%03d.png'),'-c:v','libx264','-preset','fast','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart','-y',output];
const ff=spawnSync('ffmpeg',args,{encoding:'utf8',timeout:90000});
if(ff.status!==0)throw Error('ffmpeg failed: '+String(ff.stderr).slice(0,200));
const {readFileSync,statSync}=await import('node:fs');
const sha=createHash('sha256').update(readFileSync(output)).digest('hex');
const meta={status:'SVG_PROXY_NOT_HYPERFRAMES',width,height,fps,frames:SEQUENCE_FRAMES,durationSec:SEQUENCE_FRAMES/fps,sha256:sha,output:output.split('/').at(-1),audio:'none'};
writeFileSync(join(root,'proxy-evidence.json'),JSON.stringify(meta,null,2)+'\n');
console.log(JSON.stringify(meta));
