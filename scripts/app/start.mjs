import {resolve} from 'node:path';
import {createEditorServer} from '../../src/editor-server.js';
const [config,directory='runtime/editor-jobs',port='4173']=process.argv.slice(2);
if(!config){console.error('Usage: npm run editor -- project.json [jobs-directory] [port]');process.exit(1);}
if(!/^\d+$/.test(port)||Number(port)>65535){console.error('Invalid port');process.exit(1);}
const editor=createEditorServer({directory:resolve(directory),profiles:{'Carlos · CALMA':resolve(config)},port:Number(port)});
try{console.log('SUES local editor (loopback only): '+await editor.listen());}catch(e){console.error(e.message);process.exit(1);}
let closing=false;for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{if(closing)return;closing=true;await editor.close();process.exit(0);});
