// Reuse installed FFmpeg; Git deployment tests run on the host that owns Git.
import {execFileSync,spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import {realpathSync,readdirSync} from 'node:fs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const walk=dir=>readdirSync(resolve(root,dir),{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(dir+'/'+e.name):e.name.endsWith('.test.js')?[dir+'/'+e.name]:[]);
const files=process.argv.length>2?process.argv.slice(2):walk('tests');
if(files.some(x=>!/^tests\/[a-z0-9._/-]+\.test\.js$/i.test(x)||x.includes('..')))throw Error('Pass only repository test files');
const host=files.filter(f=>f==='tests/deploy-service.test.js');
const media=files.filter(f=>!host.includes(f));
if(host.length){const result=spawnSync(process.execPath,['--test',...host],{cwd:root,stdio:'inherit'});if(result.error)throw result.error;if(result.status!==0)process.exit(result.status??1);}
if(media.length){
 const image=execFileSync('docker',['inspect','sues-video-editor','--format','{{.Image}}'],{encoding:'utf8'}).trim();
 if(!/^sha256:[a-f0-9]{64}$/.test(image))throw Error('Installed runtime image not identified');
 const deps=realpathSync(resolve(root,'node_modules'));
 const result=spawnSync('docker',['run','--rm','--network','none','--memory','1200m','--cpus','0.75','-v',root+':/app','-v',deps+':/app/node_modules:ro','-w','/app','--entrypoint','node',image,'--test','--test-concurrency=1',...media],{stdio:'inherit'});
 if(result.error)throw result.error;
 process.exitCode=result.status??1;
}
