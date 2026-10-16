#!/usr/bin/env node
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname} from 'node:path';
import {buildStableReframePlan,summarizeReframePlan,buildCameraProfilePlan} from '../../src/reframe.js';

const [input,output,...args]=process.argv.slice(2);
const pi=args.indexOf('--profile'),profile=pi<0?'composition':args[pi+1];
if(pi>=0&&!profile)throw new Error('--profile requiere conservative o composition');
if(!input||!output){
  console.error('Uso: node scripts/vision/build_reframe.mjs detections.json reframe.json');
  process.exit(2);
}
const source=JSON.parse(await readFile(input,'utf8'));
if(!Array.isArray(source.frames)||!source.frames.length) throw new Error('frames ausente o vacío');
const plan=profile==='legacy'?buildStableReframePlan(source.frames):buildCameraProfilePlan(source.frames,{profile});
plan.source={
  provider:source.provider??null,
  model:source.model??null,
  coordinates:source.coordinates??null
};
plan.summary=summarizeReframePlan(plan);
await mkdir(dirname(output),{recursive:true});
await writeFile(output,JSON.stringify(plan,null,2)+'\n');
console.log(JSON.stringify(plan.summary));
