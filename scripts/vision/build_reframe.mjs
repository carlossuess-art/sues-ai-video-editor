#!/usr/bin/env node
import {readFile,writeFile} from 'node:fs/promises';
import {buildStableReframePlan,summarizeReframePlan} from '../../src/reframe.js';

const [input,output]=process.argv.slice(2);
if(!input||!output){
  console.error('Uso: node scripts/vision/build_reframe.mjs detections.json reframe.json');
  process.exit(2);
}
const source=JSON.parse(await readFile(input,'utf8'));
if(!Array.isArray(source.frames)||!source.frames.length) throw new Error('frames ausente o vacío');
const plan=buildStableReframePlan(source.frames);
plan.source={
  provider:source.provider??null,
  model:source.model??null,
  coordinates:source.coordinates??null
};
plan.summary=summarizeReframePlan(plan);
await writeFile(output,JSON.stringify(plan,null,2)+'\n');
console.log(JSON.stringify(plan.summary));
