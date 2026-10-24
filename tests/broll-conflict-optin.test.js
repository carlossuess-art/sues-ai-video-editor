import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveBrollConflicts} from '../src/external-edit-plan.js';
const state={videoEvents:[
 {assetId:'clock',start:8.34,end:11.24,reason:'Reloj'},
 {assetId:'oldWalk',start:37.26,end:40.26,reason:'Caminar'}
],zoomEvents:[
 {start:11.32,end:14.32,scale:1.07},
 {start:18.92,end:22.02,scale:1.07},
 {start:40.64,end:44.08,scale:1.07},
 {start:58.32,end:61.52,scale:1.06}
]};
test('only explicit opt-in removes existing B-roll too close to revised insert and hidden zoom',()=>{
 const before=structuredClone(state),a={start:9.16,end:12.54,replaceExistingBrolls:true,replaceHiddenZooms:true};
 const x=resolveBrollConflicts(state,a);
 assert.deepEqual(x.videoEvents.map(e=>e.assetId),['oldWalk']);
 assert.deepEqual(x.zoomEvents.map(e=>e.start),[18.92,40.64,58.32]);
 assert.equal(x.removedClips,1);
 assert.equal(x.removedZooms,1);
 assert.deepEqual(state,before,'original settings never mutated');
 const y=resolveBrollConflicts({...state,videoEvents:x.videoEvents,zoomEvents:x.zoomEvents},{start:40.98,end:46.92,replaceExistingBrolls:true,replaceHiddenZooms:true});
 assert.equal(y.videoEvents.length,0);
 assert.deepEqual(y.zoomEvents.map(e=>e.start),[18.92,58.32]);
});
test('no flags never remove a zoom or existing clip',()=>{
 const x=resolveBrollConflicts(state,{start:9.16,end:12.54});
 assert.deepEqual(x.videoEvents,state.videoEvents);
 assert.deepEqual(x.zoomEvents,state.zoomEvents);
 assert.equal(x.removedClips,0);
 assert.equal(x.removedZooms,0);
});
test('gap enforcement includes nearby non-overlapping clips within three seconds',()=>{
 const x=resolveBrollConflicts({videoEvents:[{start:5,end:8},{start:15,end:18}],zoomEvents:[]},
 {start:9.5,end:12.5,replaceExistingBrolls:true,replaceHiddenZooms:true});
 assert.equal(x.videoEvents.length,0);
});
