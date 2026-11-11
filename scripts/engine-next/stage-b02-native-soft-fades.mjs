/** One-way candidate builder: read existing QA JSON, create a distinct new JSON.
 * No FableCut service access, no new media, no claims of artistic approval. */
import fs from 'node:fs/promises';import path from 'node:path';
import {draftB02ChildFade} from '../../src/engine-next/native-b02-fade-candidate.js';
const [source,target]=process.argv.slice(2);
if(!source||!target||!path.isAbsolute(source)||!path.isAbsolute(target)||source===target)
 throw Error('Two distinct absolute input and output paths required');
const current=JSON.parse(await fs.readFile(source,'utf8'));
const {candidate,proposal}=draftB02ChildFade(current);
await fs.writeFile(target,JSON.stringify(candidate,null,2)+'\n',{flag:'wx',mode:0o600});
await fs.writeFile(target+'.review.json',JSON.stringify(proposal,null,2)+'\n',{flag:'wx',mode:0o600});
console.log(JSON.stringify({result:target,sourceRevision:current.revision,newRevision:candidate.revision,proposal}));
