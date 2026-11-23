import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectMasterPreviewMemoryBudget,PREVIEW_MIN_FREE_BYTES} from '../src/master-director-memory-budget.js';
const m=1024*1024;
const sample=({hostKB=2500000,limit='1610612736',used='1048576',membership='/' }={})=>({path})=>{
 if(path==='/proc/meminfo')return 'MemAvailable: '+hostKB+' kB\n';
 if(path==='/proc/self/cgroup')return '0::'+membership+'\n';
 if(path==='/sys/fs/cgroup/memory.max')return limit+'\n';
 if(path==='/sys/fs/cgroup/memory.current')return used+'\n';
 throw Object.assign(new Error('Not found: '+path),{code:'ENOENT'});
};
const read=fn=>(path)=>fn({path});
test('independently reports safe host and container memory headroom',()=>{
 const r=inspectMasterPreviewMemoryBudget({read:read(sample())});
 assert.equal(r.ok,true);assert.equal(r.reason,'READY');assert.equal(r.minFreeBytes,512*m);
 assert.ok(r.cgroupAvailableBytes>PREVIEW_MIN_FREE_BYTES);
});
test('does not hide a low host-memory budget behind a healthy cgroup',()=>{
 const r=inspectMasterPreviewMemoryBudget({read:read(sample({hostKB:250000}))});
 assert.equal(r.ok,false);assert.equal(r.reason,'HOST_MEMORY_LOW');
});
test('identifies insufficient container headroom without reducing safety floor',()=>{
 const r=inspectMasterPreviewMemoryBudget({read:read(sample({limit:String(1536*m),used:String(1200*m)}))});
 assert.equal(r.ok,false);assert.equal(r.reason,'CGROUP_MEMORY_LOW');
 assert.equal(r.cgroupAvailableBytes,336*m);
});
test('blocks when memory accounting cannot be read',()=>{
 const r=inspectMasterPreviewMemoryBudget({read:()=>{throw Object.assign(new Error('denied'),{code:'EACCES'});}});
 assert.equal(r.ok,false);assert.equal(r.reason,'MEMORY_INSPECTION_FAILED');assert.equal(r.errorCode,'EACCES');
});
test('supports unlimited v2 cgroups and historic host-only path',()=>{
 const unlimited=inspectMasterPreviewMemoryBudget({read:read(sample({limit:'max'}))});
 assert.equal(unlimited.ok,true);assert.equal(unlimited.reason,'READY_CGROUP_UNLIMITED');
 const hostOnly=inspectMasterPreviewMemoryBudget({read:read(({path})=>path==='/proc/meminfo'?'MemAvailable: 2500000 kB\n':path==='/proc/self/cgroup'?'8:memory:/\n':'')});
 assert.equal(hostOnly.ok,true);assert.equal(hostOnly.reason,'READY_HOST_ONLY');
});
