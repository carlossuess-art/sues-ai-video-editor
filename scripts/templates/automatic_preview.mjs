import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {spawn} from 'node:child_process';
import {loadProject,prepareProject,writePreparedBundle,RENDER_SCRIPT} from '../../src/local-pipeline.js';
const [config,out,...args]=process.argv.slice(2);
if(!config||!out||args.some(a=>!['--render','--settings'].includes(a)&&args[args.indexOf(a)-1]!=='--settings')){
 console.error('Usage: node scripts/templates/automatic_preview.mjs project.json NEW_OUTPUT_DIRECTORY [--settings settings.json] [--render]');process.exit(1);
}
try{
 const at=args.indexOf('--settings'),settings=at<0?{}:JSON.parse(readFileSync(args[at+1],'utf8'));
 const project=loadProject(config),prepared=prepareProject(project,settings),directory=resolve(out);
 const bundle=writePreparedBundle(project,prepared,join(directory,'bundle'));
 console.log(JSON.stringify({bundle,duration:prepared.plan.duration,words:prepared.director.audit.mappedWords,events:prepared.director.decisions.length,rejections:prepared.director.audit.rejections,fingerprint:prepared.fingerprint,externalCostUSD:0}));
 if(args.includes('--render')){
  const child=spawn('python3',[RENDER_SCRIPT,'--source',project.sourcePath,'--bundle',bundle,'--out',join(directory,'SUES_CALMA_AUTOMATICO.mp4')],{stdio:'inherit'});
  process.on('SIGINT',()=>child.kill('SIGINT'));process.on('SIGTERM',()=>child.kill('SIGTERM'));
  child.on('exit',code=>process.exit(code??1));
 }
}catch(e){console.error(e.message);process.exitCode=1;}
