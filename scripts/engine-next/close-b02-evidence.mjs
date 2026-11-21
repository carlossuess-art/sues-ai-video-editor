/** Read-only integrity cross-gate for PRIVATE B02 evidence; writes a separate QA JSON. */
import fs from 'node:fs/promises';import path from 'node:path';import crypto from 'node:crypto';
import {evaluateB02TechnicalClosure} from '../../src/engine-next/b02-proof-closure.js';
const [projectPath,nativePath,roiPath,mattePath,mp4Path,sourcePath,maskPath,reportPath]=process.argv.slice(2);
const inputs=[projectPath,nativePath,roiPath,mattePath,mp4Path,sourcePath,maskPath,reportPath];
if(inputs.length!==8||!inputs.every(p=>typeof p==='string'&&path.isAbsolute(p))||new Set(inputs).size!==8)
 throw Error('8 distinct, absolute paths required; no guessing of original/source assets');
const sha=async p=>{const h=crypto.createHash('sha256');const stream=(await import('node:fs')).createReadStream(p);for await(const c of stream)h.update(c);return h.digest('hex')};
const [project,nativeAudit,sourceRoi,temporalMatte,actualVideoSha256,sourceSha256,matteSha256]=await Promise.all([
 ...inputs.slice(0,4).map(async p=>JSON.parse(await fs.readFile(p,'utf8'))),sha(mp4Path),sha(sourcePath),sha(maskPath)]);
const result=evaluateB02TechnicalClosure({project,nativeAudit,sourceRoi,temporalMatte,actualVideoSha256,sourceSha256,matteSha256});
await fs.writeFile(reportPath,JSON.stringify(result,null,2)+'\n',{flag:'wx',mode:0o600});
console.log(JSON.stringify({technicalReady:result.technicalReady,technicalFailures:result.technicalFailures,
 creativeBlockers:result.creativeBlockers.length,reportPath}));
if(!result.technicalReady)process.exitCode=2;
