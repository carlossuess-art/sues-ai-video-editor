import {resolve} from 'node:path';
import {readFileSync} from 'node:fs';
import {loadProject,prepareProject} from '../../src/local-pipeline.js';
import {createProjectBackup,verifyProjectBackup} from '../../src/project-backup.js';
const [mode,first,second,third]=process.argv.slice(2);
try{
 if(mode==='--verify'&&first){console.log(JSON.stringify(verifyProjectBackup(resolve(first)),null,2));}
 else if(mode==='--create'&&first&&second){const settings=third?JSON.parse(readFileSync(third,'utf8')):{},project=loadProject(first),prepared=prepareProject(project,settings),result=await createProjectBackup(project,prepared,second);console.log(JSON.stringify({directory:result.directory,...verifyProjectBackup(result.directory)},null,2));}
 else throw new Error('Usage: node scripts/backup/project.mjs --create PROJECT.json NEW_DIRECTORY [SETTINGS.json] | --verify BACKUP_DIRECTORY');
}catch(error){console.error(error.message);process.exitCode=1;}
