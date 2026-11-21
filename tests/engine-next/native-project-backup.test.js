import test from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,readFile,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {captureReadOnlyFablecutBackup,validateFablecutBackup} from '../../src/engine-next/native-project-backup.js';
const project={name:'Test',width:1080,height:1920,fps:30,revision:53,tracks:[{id:'V1'}],media:[{id:'m1'}],clips:[{id:'c1'}]};
const backup={fablecut:'backup',format:1,name:'Test',project,versions:[{v:1}]};
const mock=async url=>new Response(JSON.stringify(url.endsWith('/api/project')?project:backup));
test('creates read-only verified snapshot and exact version roundtrip without PUT',async()=>{
 const root=await mkdtemp(join(tmpdir(),'sues-backup-'));
 try{let calls=[];const destination=join(root,'snapshot');const got=await captureReadOnlyFablecutBackup({destination,fetchImpl:async(url,opts)=>{calls.push({url,method:opts.method});return mock(url);}});
 assert.equal(got.manifest.project.revision,53);assert.equal(got.manifest.project.versions,1);assert.equal(got.manifest.persistentRestoreAttempted,false);
 assert.deepEqual(calls.map(c=>c.method),['GET','GET','GET']);
 assert.deepEqual(JSON.parse(await readFile(join(destination,'fablecut-project-backup.json'),'utf8')),backup);
 }finally{await rm(root,{recursive:true,force:true});}
});
test('rejects backup not corresponding to current open project',()=>assert.throws(()=>validateFablecutBackup({...backup,project:{...project,revision:54}},project)));
test('rejects malformed backup and missing core identifiers',()=>{
 assert.throws(()=>validateFablecutBackup({...backup,format:3}));
 assert.throws(()=>validateFablecutBackup({...backup,project:{...project,clips:[{id:'x'},{id:'x'}]}}));
 assert.throws(()=>validateFablecutBackup({...backup,versions:[{v:1},{v:1}]}));
});
test('rejects changes between two project reads without leaving partial files',async()=>{
 const root=await mkdtemp(join(tmpdir(),'sues-backup-'));let n=0;
 try{await assert.rejects(captureReadOnlyFablecutBackup({destination:join(root,'safe'),fetchImpl:async url=>new Response(JSON.stringify(url.endsWith('/api/project')?(++n===1?project:{...project,revision:54}):backup))}),/Concurrent/);
 await assert.rejects(readFile(join(root,'safe','manifest.json')));
 }finally{await rm(root,{recursive:true,force:true});}
});
test('rejects non-loopback or suspicious output paths',async()=>{
 await assert.rejects(captureReadOnlyFablecutBackup({baseUrl:'http://example.com/',destination:'/tmp/sues-long-enough',fetchImpl:mock}));
 await assert.rejects(captureReadOnlyFablecutBackup({destination:'relative',fetchImpl:mock}));
});
