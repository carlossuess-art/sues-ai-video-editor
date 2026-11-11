#!/usr/bin/env node
/** Offline check only. Lists native media dependencies from real regular files. */
import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {inspectNativeMediaDependencies} from '../../src/engine-next/native-media-dependencies.js';
const [projectPath,mediaRoot,outputPath]=process.argv.slice(2);
if(!projectPath||!mediaRoot||!outputPath)throw Error('Usage: node scripts/engine-next/native-media-preflight.mjs <project.json> <mediaDir> <report.json>');
const project=JSON.parse(readFileSync(projectPath,'utf8'));
const valid=new Set(readdirSync(mediaRoot,{withFileTypes:true}).filter(x=>x.isFile()).map(x=>x.name));
const report=inspectNativeMediaDependencies(project,valid);
writeFileSync(outputPath,JSON.stringify(report,null,2)+'\n',{flag:'wx',mode:0o600});
console.log(JSON.stringify({report:outputPath,assets:report.assetCount,missingUsed:report.missingUsed,missingTotal:report.missing.length,playbackReady:report.playbackReady,editableProjectPortable:report.editableProjectPortable}));
if(!report.editableProjectPortable)process.exitCode=2;
