/** Compare independent FableCut program snapshots of enabled/disabled isolated QA layers.
 * Both images must be 1080×1920 native canvas frames at the exact same time.
 * Usage: node scripts/engine-next/audit-layer-delta.mjs /absolute/off.png /absolute/on.png /absolute/report.json
 */
import path from 'node:path';import fs from 'node:fs/promises';import {spawnSync} from 'node:child_process';
import {parsePsnr,isolateQuadrantChange} from '../../src/engine-next/layer-isolation-audit.js';
const [off,on,report]=process.argv.slice(2);if(![off,on,report].every(x=>typeof x==='string'&&path.isAbsolute(x)))throw Error('Provide three absolute paths');
const probe=file=>{const x=spawnSync('/usr/bin/ffprobe',['-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','json',file],{encoding:'utf8',timeout:20000});if(x.status!==0)throw Error('Cannot inspect PNG');const s=JSON.parse(x.stdout).streams?.[0];if(s?.width!==1080||s?.height!==1920)throw Error('Require native 1080x1920 PNGs');};
probe(off);probe(on);
const regions={'top-left':'540:960:0:0','top-right':'540:960:540:0','bottom-left':'540:960:0:960','bottom-right':'540:960:540:960'};
const scores={};for(const [name,crop] of Object.entries(regions)){
 const r=spawnSync('/usr/bin/ffmpeg',['-hide_banner','-i',off,'-i',on,'-filter_complex',`[0:v]crop=${crop}[a];[1:v]crop=${crop}[b];[a][b]psnr`,'-f','null','-'],{encoding:'utf8',timeout:45000});
 if(r.status!==0)throw Error(`FFmpeg comparison failed: ${name}`);
 scores[name]=parsePsnr(r.stderr);
}
const qa=isolateQuadrantChange(scores);const out={...qa,off,on};
await fs.writeFile(report,JSON.stringify(out,(key,v)=>v===Infinity?'identical (infinite PSNR)':v,2));
console.log(JSON.stringify({report,status:qa.status,scores:out.scores},(key,v)=>v===Infinity?'identical':v));
if(qa.status!=='VISIBLE_CHANGE_CONFINED_TO_EXPECTED_QUADRANT')process.exitCode=1;