import fs from 'node:fs/promises';import path from 'node:path';
import {stageB02ChildReframe} from '../../src/engine-next/native-b02-child-reframe.js';
const [src,out,x,y,scale]=process.argv.slice(2);
if(![src,out].every(v=>typeof v==='string'&&path.isAbsolute(v))||src===out)throw Error('Two different absolute JSON paths required');
const args=[x,y,scale].map(Number);if(args.length!==3||args.some(a=>!Number.isFinite(a)))throw Error('Three valid x/y/scale parameters required');
const {candidate,proposal}=stageB02ChildReframe(JSON.parse(await fs.readFile(src,'utf8')),{x:args[0],y:args[1],scale:args[2]});
await fs.writeFile(out,JSON.stringify(candidate,null,2)+'\n',{flag:'wx',mode:0o600});
await fs.writeFile(out+'.review.json',JSON.stringify(proposal,null,2)+'\n',{flag:'wx',mode:0o600});
console.log(JSON.stringify({out,revision:candidate.revision,proposal}));
