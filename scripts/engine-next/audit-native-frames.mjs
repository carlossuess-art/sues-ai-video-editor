/** Read-only quantitative native-frame/source comparison. Never modifies production or approves an edit.
 * Usage:
 * SUES_NLE_PUPPETEER_MODULE=/absolute/node_modules/puppeteer-core SUES_NLE_CHROME=/absolute/chrome \
 * node scripts/engine-next/audit-native-frames.mjs --source /absolute/original.mp4 --output /absolute/audit-dir --times 0.4,2.5,10.5
 */
import {createRequire} from 'node:module';import fs from 'node:fs/promises';import path from 'node:path';
import {createHash} from 'node:crypto';import {spawnSync} from 'node:child_process';
import {FableCutClient} from '../../src/engine-next/fablecut-client.js';
import {ProgramFrameRenderer} from '../../src/engine-next/program-frame.js';
import {parseSsim,assessFrameEvidence} from '../../src/engine-next/frame-audit.js';
const args=process.argv.slice(2);const opt=flag=>{const i=args.indexOf(flag);return i>=0?args[i+1]:null;};
const source=opt('--source'),output=opt('--output'),times=(opt('--times')||'').split(',').map(Number);
if(!source||!output||!path.isAbsolute(source)||!path.isAbsolute(output)||!opt('--times')||times.length<1||times.length>12||
 times.some(x=>!Number.isFinite(x)||x<0||x>=300)||!path.isAbsolute(process.env.SUES_NLE_CHROME||'')||!path.isAbsolute(process.env.SUES_NLE_PUPPETEER_MODULE||'')){
 console.error('Absolute source, output, Chrome and Puppeteer paths and 1–12 timestamps are required');process.exit(2);
}
const require=createRequire(path.join(process.env.SUES_NLE_PUPPETEER_MODULE,'package.json'));
const puppeteer=require(process.env.SUES_NLE_PUPPETEER_MODULE);
const client=new FableCutClient({baseUrl:process.env.SUES_NLE_ORIGIN||'http://127.0.0.1:7780'});
const renderer=new ProgramFrameRenderer({client,puppeteer,executablePath:process.env.SUES_NLE_CHROME,timeoutMs:35000});
const root=await fs.realpath(source),stat=await fs.stat(root);if(!stat.isFile())throw Error('Source is not a file');
await fs.mkdir(output,{recursive:true});const rows=[];
const run=(bin,argv)=>{const r=spawnSync(bin,argv,{encoding:'utf8',timeout:90000,maxBuffer:3_000_000});if(r.status!==0)throw Error(`${bin} failed: ${(r.stderr||'').slice(-450)}`);return r;};
for(const time of times){
 const {data:p}=await client.getProject();const shot=await renderer.capture({time,expectedRevision:p.revision});
 if(shot.width!==1080||shot.height!==1920)throw Error('QA only supports original 1080x1920 orientation');
 const stem=`frame-${Math.round(time*1000)}`;const program=path.join(output,`${stem}-program.png`),reference=path.join(output,`${stem}-source.png`);
 await fs.writeFile(program,shot.png);
 run('/usr/bin/ffmpeg',['-hide_banner','-loglevel','error','-ss',String(shot.time),'-i',root,'-frames:v','1','-y',reference]);
 const comparison=run('/usr/bin/ffmpeg',['-hide_banner','-i',program,'-i',reference,'-lavfi','[0:v][1:v]ssim','-f','null','-']);
 rows.push({time:shot.time,projectRevision:shot.revision,projectId:shot.projectId,width:shot.width,height:shot.height,
  program,reference,programSha256:createHash('sha256').update(shot.png).digest('hex'),ssim:parseSsim(comparison.stderr)});
 console.log(JSON.stringify({time:shot.time,ssim:rows.at(-1).ssim.all,revision:shot.revision}));
}
const result={schema:'sues-engine-next-frame-evidence/v1',sourceFile:root,sourceBytes:stat.size,
 analysis:assessFrameEvidence(rows,{expectedCount:times.length}),frames:rows};
const dest=path.join(output,'audit.json');await fs.writeFile(dest,JSON.stringify(result,null,2));
console.log(JSON.stringify({report:dest,analysis:result.analysis}));