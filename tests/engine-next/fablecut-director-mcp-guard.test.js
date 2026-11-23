import test from 'node:test';import assert from 'node:assert/strict';
import {prepareDirectorNativeTransform} from '../../src/engine-next/fablecut-director-mcp-guard.js';
const project={revision:54,lockedTracks:[],tracks:[{id:'V1',kind:'video'},{id:'V2',kind:'video'}],clips:[
 {id:'source',kind:'video',track:'V1',locked:true,props:{x:0,y:0,scale:1}},
 {id:'child',kind:'image',track:'V2',disabled:true,props:{x:300,y:0,scale:.65}}]};
const input={project,projectId:'p_3c0550a1dd',expectedProjectId:'p_3c0550a1dd',revision:54,clipId:'child',x:325,y:10,scale:.7};
test('constructs only native updateClip patch with exact revision and safe inverse',()=>{
 const a=prepareDirectorNativeTransform(input);
 assert.equal(a.tool,'fablecut_patch_project');assert.equal(a.arguments.baseRevision,54);
 assert.deepEqual(a.arguments.ops,[{op:'updateClip',id:'child',set:{props:{x:325,y:10,scale:.7}}}]);
 assert.deepEqual(a.inverse.ops,[{op:'updateClip',id:'child',set:{props:{x:300,y:0,scale:.65}}}]);
 assert.equal(a.expected.disabled,true);assert.equal(a.automaticDispatchAllowed,false);
 assert.equal(JSON.stringify(a.arguments).includes('force'),false);
});
test('refuses wrong project or stale revision, locked sources/tracks and invalid geometry',()=>{
 for(const patch of [{projectId:'p_other'},{revision:53},{clipId:'source'},{x:4000},{scale:0},{clipId:'unknown'},
   {project:{...project,lockedTracks:['V2']}}])assert.throws(()=>prepareDirectorNativeTransform({...input,...patch}));
});
