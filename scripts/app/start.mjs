import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {createEditorServer} from '../../src/editor-server.js';
const [config,directory='runtime/editor-jobs',port='4173']=process.argv.slice(2);
if(!config){console.error('Usage: npm run editor -- project.json [jobs-directory] [port]');process.exit(1);}
if(!/^\d+$/.test(port)||Number(port)>65535){console.error('Invalid port');process.exit(1);}
if(process.env.SUES_TOKEN_FILE&&!/^[a-f0-9]{64}$/.test(readFileSync(process.env.SUES_TOKEN_FILE,'utf8').trim()))throw new Error('Invalid private token file');
const editor=createEditorServer({directory:resolve(directory),profiles:{'Carlos · CALMA':resolve(config)},port:Number(port),maxUploads:Number(process.env.SUES_MAX_UPLOADS??16),...(process.env.SUES_PUBLIC_ORIGIN?{publicOrigin:process.env.SUES_PUBLIC_ORIGIN}:{}),...(process.env.SUES_TOKEN_FILE?{token:readFileSync(process.env.SUES_TOKEN_FILE,'utf8').trim(),passwordFile:join(dirname(process.env.SUES_TOKEN_FILE),'admin-password-hash')}: {})});
try{const launch=await editor.listen();if(process.env.SUES_ACCESS_FILE){writeFileSync(process.env.SUES_ACCESS_FILE,launch+'\n',{mode:0o600});console.log('SUES editor listening on loopback; private access file updated.');}else console.log('SUES local editor (loopback only): '+launch);}catch(e){console.error(e.message);process.exit(1);}
let closing=false;for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{if(closing)return;closing=true;await editor.close();process.exit(0);});
