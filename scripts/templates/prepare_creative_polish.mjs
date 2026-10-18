// Refine the existing full-voice project. No new transcript, inference or stock.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';import {resolve,dirname,join} from 'node:path';
import {loadProject,prepareProject,writePreparedBundle} from '../../src/local-pipeline.js';
const [config,settingsPath,destination]=process.argv.slice(2);if(!destination)throw Error('Usage: EXISTING_PROJECT SETTINGS NEW_DIRECTORY');
const path=resolve(config),out=resolve(destination);mkdirSync(out,{mode:0o700});
const data=JSON.parse(readFileSync(path));for(const key of Object.keys(data))if(key.endsWith('Path')||key==='fontDirectory')data[key]=resolve(dirname(path),data[key]);if(data.backgroundAudio)data.backgroundAudio.localFile=resolve(dirname(path),data.backgroundAudio.localFile);
const projectPath=join(out,'project.json');writeFileSync(projectPath,JSON.stringify(data,null,2)+'\n');
const project=loadProject(projectPath),prepared=prepareProject(project,{...JSON.parse(readFileSync(settingsPath)),sfxEnabled:true,sfxGain:.3});writeFileSync(join(out,'settings.json'),JSON.stringify(prepared.settings,null,2)+'\n');writePreparedBundle(project,prepared,join(out,'bundle'));
console.log(JSON.stringify({project:projectPath,bundle:join(out,'bundle'),source:project.sourcePath,words:prepared.director.audit.mappedWords,graphics:prepared.plan.graphics.length,sfx:prepared.plan.soundEffects.events.length}));
