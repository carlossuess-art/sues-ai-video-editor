import test from 'node:test';
import assert from 'node:assert/strict';
import {rmSync} from 'node:fs';
import {fixture} from './helpers/editor-fixture.js';
import {loadProject,prepareProject} from '../src/local-pipeline.js';
import {validateCameraTrajectory,trajectoryScaleAt,visionTrackHash} from '../src/camera-trajectory.js';
import {semanticZoomFilter} from '../src/semantic-render.js';
import {reviewExternalPlan} from '../src/external-edit-plan.js';
const config=project=>({schema:'sues-camera-trajectory/v1',sourceSha256:project.inputs.source.sha256,
 visionSha256:visionTrackHash(project.inputs.visionFrames),timeSpace:'original-seconds',reason:'Acercamiento motivado a la mirada',
 keyframes:[{time:0,scale:1.15,easing:'ease-in-out'},{time:2,scale:1,easing:'linear'},{time:2.2,scale:1,easing:'ease-in-out'},{time:5.5,scale:1.35,easing:'ease-in-out'},{time:6,scale:1,easing:'linear'}]});
const setup=()=>{const f=fixture(),project=loadProject(f.profiles.test);project.inputs.visionFrames=Array.from({length:49},(_,i)=>({...structuredClone(project.inputs.visionFrames[0]),time:i/2}));return {f,project};};
test('camera trajectory executes at exact times and uses the real eye anchor graph',()=>{
 const {f,project}=setup();try{
 const trajectory=config(project),p=prepareProject(project,{motions:false,zoomIntensity:0,cameraTrajectory:trajectory}).plan,t=p.semantic.trajectory;
 assert.equal(trajectoryScaleAt(t,0),1.15);assert.equal(trajectoryScaleAt(t,2),1);assert.equal(trajectoryScaleAt(t,2.2),1);
 assert.equal(trajectoryScaleAt(t,5.5),1.35);assert.equal(trajectoryScaleAt(t,6),1);
 assert.ok(trajectoryScaleAt(t,4)>1&&trajectoryScaleAt(t,4)<1.35);
 assert.equal(t.evidence.newInference,false);assert.ok(p.semantic.audit.frames>=720);
 assert.match(semanticZoomFilter(p.semantic),/perspective=/);assert.match(semanticZoomFilter(p.semantic),/cos\(PI/);
 assert.equal(p.semantic.zooms.length,0);
 assert.throws(()=>prepareProject(project,{zoomIntensity:0,cameraTrajectory:trajectory}),/hidden by a full-frame/);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('trajectory rejects changed source, landmarks, fixed framing and missing eyes',()=>{
 const {f,project}=setup();try{
 const value=config(project),run=t=>prepareProject(project,{zoomIntensity:0,cameraTrajectory:t});
 assert.throws(()=>run({...value,sourceSha256:'0'.repeat(64)}),/binding/);
 assert.throws(()=>run({...value,visionSha256:'0'.repeat(64)}),/binding/);
 assert.throws(()=>prepareProject(project,{cameraTrajectory:value}),/disable legacy zooms/);
 const saved=project.inputs.visionFrames;
 project.inputs.visionFrames=project.inputs.visionFrames.filter(f=>f.time<2||f.time>5);
 assert.throws(()=>run({...value,visionSha256:visionTrackHash(project.inputs.visionFrames)}),/coverage/);
 project.inputs.visionFrames=saved.map(f=>({...f,faces:f.faces.map(({leftEye,rightEye,...face})=>face)}));
 assert.throws(()=>run({...value,visionSha256:visionTrackHash(project.inputs.visionFrames)}),/coverage/);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('trajectory contract is bounded and cannot accept free-form filter expressions',()=>{
 const {f,project}=setup();try{
 const value=config(project);
 assert.throws(()=>validateCameraTrajectory({...value,timeSpace:'final-milliseconds'}));
 assert.throws(()=>validateCameraTrajectory({...value,keyframes:[...value.keyframes].reverse()}));
 assert.throws(()=>validateCameraTrajectory({...value,keyframes:[...value.keyframes.slice(0,-1),{time:6,scale:1.1,easing:'linear'}]}));
 assert.throws(()=>validateCameraTrajectory({...value,filter:'movie=/etc/passwd'}));
 assert.throws(()=>validateCameraTrajectory({...value,keyframes:[{time:0,scale:1.1,easing:'expression'},{time:6,scale:1,easing:'linear'}]}));
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('external plan compiles a trajectory and preserves earlier settings',()=>{
 const {f,project}=setup();try{
 const settings=prepareProject(project,{motions:false}).settings,before=JSON.stringify(settings),trajectory=config(project);
 const review=reviewExternalPlan(JSON.stringify({schema:'sues-edit-plan/v1',sourceSha256:project.inputs.source.sha256,operations:[{type:'camera-trajectory',trajectory,replaceLegacyZooms:true}]}),{project,settings});
 assert.equal(review.canApply,true,JSON.stringify(review.notes));
 assert.equal(review.changes.zoomIntensity,0);assert.equal(prepareProject(project,review.changes).plan.semantic.trajectory.keyframes.length,5);
 assert.equal(JSON.stringify(settings),before);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});