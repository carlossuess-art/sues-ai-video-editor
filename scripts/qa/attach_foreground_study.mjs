import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {prepareForegroundEffects,foregroundSpaceHash} from '../../src/foreground-effects.js';
import {writePreparedBundle,ENGINE_HASH} from '../../src/local-pipeline.js';
const [base,mask,out]=process.argv.slice(2);
const plan=JSON.parse(readFileSync(join(base,'manifest.json'),'utf8'));
plan.globalTransitions=plan.globalTransitions.filter(e=>e.type!=='blur');
const sha256=createHash('sha256').update(readFileSync(mask)).digest('hex');
plan.foregroundEffects=prepareForegroundEffects({schema:'sues-foreground-effects/v1',sourceSha256:plan.source.sha256,cameraSpaceSha256:foregroundSpaceHash(plan),
matte:{localFile:mask,sha256,modelSha256:'07c308cf0fc7e6e8b2065a12ed7fc07e1de8febb7dc7839d7b7f15dd66584df9',method:'modnet-onnx-cpu',width:512,height:896,fps:30,frames:300,duration:10,activeRanges:[{start:6,end:8.8}],reviewStatus:'sample-reviewed'},
events:[{type:'background-blur',start:6,end:8.8,sigma:12},{type:'behind-text',start:6.4,end:8.8,lines:['MUNDO','INTERIOR']}]},plan);
plan.pending=[...plan.pending,'temporal-matte-visual-review','director-and-broll-selection'];
mkdirSync(out,{recursive:true});
const fingerprint=createHash('sha256').update(JSON.stringify({plan,engine:ENGINE_HASH})).digest('hex');
writePreparedBundle({fontDirectory:join(base,'fonts')},{plan,director:JSON.parse(readFileSync(join(base,'director.json'),'utf8')),settings:{experimentalForeground:true},fingerprint},join(out,'bundle'));
writeFileSync(join(out,'camera-space-binding.json'),JSON.stringify({sourceSha256:plan.source.sha256,cameraSpaceSha256:foregroundSpaceHash(plan),matteSha256:sha256},null,2));
console.log(JSON.stringify({bundle:join(out,'bundle'),fingerprint,events:plan.foregroundEffects.events,automaticDirector:false}));