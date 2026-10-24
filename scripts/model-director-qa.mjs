import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {loadProject,prepareProject,writePreparedBundle,RENDER_SCRIPT} from '../src/local-pipeline.js';
import {MediaLibrary} from '../src/media-library.js';
import {buildModelDirectorRequest,reviewModelDirectorResponse} from '../src/model-director.js';
const [mode,config,settingsPath,outDir,responsePath]=process.argv.slice(2);
if(!['request','review','render'].includes(mode)||!outDir)throw Error('Usage: request|review|render CONFIG SETTINGS OUTPUT [RESPONSE]');
const out=resolve(outDir);mkdirSync(out,{recursive:true});
const project=loadProject(config),settings=JSON.parse(readFileSync(settingsPath,'utf8'));
if(process.env.SUES_ASSET_DIRECTORY){const library=new MediaLibrary(process.env.SUES_ASSET_DIRECTORY);project.resolveAsset=(id,kind)=>library.resolve(id,kind);}
const observationsPath=join(out,'visual-observations.json');
let visualObservations=[];try{visualObservations=JSON.parse(readFileSync(observationsPath,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
const request=buildModelDirectorRequest({project,settings,visualObservations});
if(mode==='request'){
 writeFileSync(join(out,'director-request.json'),JSON.stringify(request,null,2));
 writeFileSync(join(out,'director-prompt.txt'),request.prompt);
 console.log(JSON.stringify({inputSha256:request.inputSha256,captions:request.input.captions.length}));process.exit(0);
}
const saved=JSON.parse(readFileSync(join(out,'director-request.json'),'utf8'));
if(saved.inputSha256!==request.inputSha256)throw Error('Source, captions or observations changed; regenerate model request');
const response=readFileSync(responsePath,'utf8'),result=reviewModelDirectorResponse(response,{request,project,settings});
writeFileSync(join(out,'director-review.json'),JSON.stringify(result,null,2));
if(!result.canApply)throw Error('Execution rejected: '+JSON.stringify(result.review));
if(mode==='review'){console.log(JSON.stringify({canApply:result.canApply,decisions:result.decisions}));process.exit(0);}
const prepared=prepareProject(project,result.review.changes),bundle=writePreparedBundle(project,prepared,join(out,'bundle'));
const rendered=spawnSync('python3',[RENDER_SCRIPT,'--source',project.sourcePath,'--bundle',bundle,'--out',join(out,'SUES_LOCAL_DIRECTOR.mp4')],{stdio:'inherit'});
process.exit(rendered.status??1);