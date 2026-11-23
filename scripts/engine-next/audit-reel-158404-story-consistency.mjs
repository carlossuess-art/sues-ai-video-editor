#!/usr/bin/env node
import {readFile,writeFile} from 'node:fs/promises';import {resolve} from 'node:path';
import {reconcileReel158404StorySources} from '../../src/engine-next/reel-158404-story-consistency.js';
const [ledgerArg,storyArg,output]=process.argv.slice(2);
if([ledgerArg,storyArg,output].some(x=>typeof x!=='string'||!x.startsWith('/')||resolve(x)!==x)||new Set([ledgerArg,storyArg,output]).size!==3)
 throw Error('Supply absolute original gap-ledger, alternative master story and new audit JSON');
const ledger=JSON.parse(await readFile(ledgerArg,'utf8')),story=JSON.parse(await readFile(storyArg,'utf8'));
const report=reconcileReel158404StorySources(ledger,story);
await writeFile(output,JSON.stringify(report,null,2)+'\n',{flag:'wx',mode:0o600});
console.log(JSON.stringify({status:report.status,matchedOps:report.matchingOperationIds,matchingTimes:report.operationsWithIdenticalTiming,
  titleTimingConflicts:report.timingConflicts.length,resourceIdConflicts:report.assetConflicts.length,
  generatedReport:output,autoMerge:report.automaticMergeAllowed}));
