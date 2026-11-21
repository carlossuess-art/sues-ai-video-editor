#!/usr/bin/env node
// Owner-operated, local-only bridge between ChatGPT and a persistent Reel edit.
// Never renders, publishes, chooses a resource, or bypasses the story QA.
import {readFileSync,existsSync,realpathSync} from 'node:fs';
import {resolve,join,relative} from 'node:path';
import {MasterDirectorProjectStore} from '../src/master-director-project-store.js';
const ID=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const HASH=/^[a-f0-9]{64}$/;
const args=process.argv.slice(2),action=args.shift();
const flags={};
for(let i=0;i<args.length;i++){
 const a=args[i];if(!/^--[a-z-]+$/.test(a)||Object.hasOwn(flags,a))throw Error('Unknown or repeated argument');
 if(a==='--confirm-edit'){flags[a]=true;continue;}
 if(i===args.length-1||args[i+1].startsWith('--'))throw Error('Missing argument value');
 flags[a]=args[++i];
}
const allowed=new Set(['--jobs-dir','--job-id','--expected','--command','--confirm-edit']);
if(!['status','apply'].includes(action)||Object.keys(flags).some(k=>!allowed.has(k)))throw Error('Usage: status|apply --jobs-dir PATH --job-id UUID [--expected SHA --command JSON --confirm-edit]');
if(!ID.test(flags['--job-id']??''))throw Error('Job ID must be an exact UUID');
if(typeof flags['--jobs-dir']!=='string'||!flags['--jobs-dir'].startsWith('/'))throw Error('An absolute jobs directory is required');
const directory=realpathSync(resolve(flags['--jobs-dir'])),target=join(directory,flags['--job-id']);
if(!existsSync(target)||realpathSync(target)!==target||relative(directory,target).startsWith('..'))throw Error('Job not found');
const job=JSON.parse(readFileSync(join(target,'job.json'),'utf8'));
if(job.id!==flags['--job-id']||job.instructions?.at(-1)?.kind==='master-hybrid-native-stage')throw Error('Job not directly editable');
const store=new MasterDirectorProjectStore(target,async()=>null),current=store.current();
if(action==='status'){
 if(flags['--confirm-edit']||flags['--command']||flags['--expected'])throw Error('Unexpected status arguments');
 const story=current.revision?store.readDraft(current.revision):null;
 console.log(JSON.stringify({status:'READ_ONLY',projectId:job.projectId??job.profileId,jobId:job.id,
  revision:current.revision,operations:(story?.operations??[]).map(o=>({id:o.id,track:o.track,start:o.start,end:o.end,renderer:o.renderer,resourceRef:o.resourceRef??null}))}));
}else{
 if(flags['--confirm-edit']!==true||!HASH.test(flags['--expected']??'')||typeof flags['--command']!=='string')throw Error('Explicit confirmation, expected revision and command required');
 if(flags['--command'].length>8192)throw Error('Command too large');
 const command=JSON.parse(flags['--command']);
 const result=store.editCurrentAt(flags['--expected'],command);
 console.log(JSON.stringify({...result,jobId:job.id}));
 if(result.status!=='CURRENT')process.exitCode=2;
}
