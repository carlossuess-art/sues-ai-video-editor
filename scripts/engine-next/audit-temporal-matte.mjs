/** Offline verification of encoded matte metadata; NOT perceptual QA. */
import fs from 'node:fs/promises';import path from 'node:path';import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';
import {validateTemporalMatteEvidence} from '../../src/engine-next/temporal-matte-evidence.js';
const [video,reportFile,expectedSource,expectedStart,expectedFrames]=process.argv.slice(2);
if(!video||!reportFile||![video,reportFile].every(path.isAbsolute)||!Number.isFinite(Number(expectedStart))||!Number.isInteger(Number(expectedFrames)))throw Error('Usage: audit-temporal-matte.mjs /absolute/mask.mkv /absolute/report.json SOURCE_SHA START_SECONDS FRAME_COUNT');
const report=JSON.parse(await fs.readFile(reportFile,'utf8'));
const stream=JSON.parse(execFileSync('/usr/bin/ffprobe',['-v','error','-select_streams','v:0','-count_frames','-show_entries','stream=codec_name,pix_fmt,width,height,nb_read_frames','-of','json',video],{encoding:'utf8'})).streams?.[0];
const bytes=await fs.readFile(video);const actual=createHash('sha256').update(bytes).digest('hex');if(actual!==report.outputSha256)throw Error('Matte output changed');
const evidence=validateTemporalMatteEvidence(report,{...stream,nb_frames:stream?.nb_read_frames},{sourceSha256:expectedSource,expectedStart:Number(expectedStart),expectedFrames:Number(expectedFrames)});
console.log(JSON.stringify({...evidence,outputSha256:actual,bytes:bytes.length}));