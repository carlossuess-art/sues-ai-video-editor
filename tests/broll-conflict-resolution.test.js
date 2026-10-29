import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {fixture} from './helpers/editor-fixture.js';
import {loadProject,prepareProject} from '../src/local-pipeline.js';
import {resolveBrollConflicts,externalCatalog,reviewExternalPlan} from '../src/external-edit-plan.js';
test('explicit replacement keeps unrelated events and never changes its inputs',()=>{
 const settings={videoEvents:[{start:5,end:8},{start:15,end:18}],zoomEvents:[{start:6,end:9},{start:19,end:21}]},snapshot=JSON.stringify(settings),op={start:7,end:10};
 assert.equal(resolveBrollConflicts(settings,op).removedClips,0);
 const r=resolveBrollConflicts(settings,{...op,replaceExistingBrolls:true,replaceHiddenZooms:true});
 assert.deepEqual(r.videoEvents,[settings.videoEvents[1]]);assert.deepEqual(r.zoomEvents,[settings.zoomEvents[1]]);assert.equal(r.removedClips,1);assert.equal(r.removedZooms,1);assert.equal(JSON.stringify(settings),snapshot);
 assert.equal(resolveBrollConflicts(settings,{start:11,end:14,replaceExistingBrolls:true},0).removedClips,0);
});
test('current external contract replaces only on opt in, stays atomic and honors timeline fingerprint',()=>{
 const f=fixture();try{
 const project=loadProject(f.profiles.test),id=createHash('sha256').update(readFileSync(join(f.dir,'source.mp4'))).digest('hex');
 project.resolveAsset=()=>({assetId:id,sha256:id,kind:'video',rights:'owned',localFile:join(f.dir,'source.mp4'),duration:12});
 const settings=prepareProject(project,{zoomIntensity:0,videoEvents:[{assetId:id,start:5,end:8,reason:'Recurso original que se conserva'}],montageCuts:[{start:1,end:2}]}).settings;
 const catalog=externalCatalog(project,settings),assets=[{id,kind:'video',title:'Recurso privado'}],op={type:'broll',resourceId:id,start:6,end:9,reason:'Sustitución narrativa explícita'};
 const review=(ops,fingerprint=catalog.timelineFingerprint)=>reviewExternalPlan(JSON.stringify({schema:catalog.schema,sourceSha256:catalog.sourceSha256,timelineFingerprint:fingerprint,operations:ops}),{project,settings,assets});
 const before=JSON.stringify(settings);assert.equal(review([op]).canApply,false);
 const r=review([{...op,replaceExistingBrolls:true,replaceHiddenZooms:true}]);assert.equal(r.canApply,true,JSON.stringify(r));assert.equal(r.changes.videoEvents.length,1);assert.equal(r.changes.videoEvents[0].start,6);assert.match(r.rows[0].description,/sustituye 1/);assert.deepEqual(r.changes.montageCuts,settings.montageCuts);
 assert.equal(review([{...op,replaceExistingBrolls:'true'}]).canApply,false);
 assert.equal(review([{...op,replaceExistingBrolls:true},{type:'unsupported',description:'No ejecutable'}]).changes,null);
 assert.throws(()=>review([{...op,replaceExistingBrolls:true}],'stale'));
 assert.equal(JSON.stringify(settings),before);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
