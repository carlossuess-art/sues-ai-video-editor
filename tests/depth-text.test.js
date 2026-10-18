import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,rmSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {fixture} from './helpers/editor-fixture.js';
import {loadProject,prepareProject} from '../src/local-pipeline.js';
import {buildPreviewASS} from '../src/local-preview.js';
import {prepareDepthText,contourAt} from '../src/depth-text.js';
import {createProjectBackup} from '../src/project-backup.js';
const points=()=>Array.from({length:32},(_,i)=>[540+170*Math.cos(i*Math.PI/16),450+170*Math.sin(i*Math.PI/16)]);
const input=sha=>({version:'1.0',sourceSha256:sha,events:[{text:'DEPTH',start:.25,end:1.25,x:510,y:450,size:160,color:'#FFFFFF',mask:{method:'manual-rotoscope',scope:'head-and-neck',reviewedRegion:{top:200,bottom:700},keyframes:[{time:.25,points:points()},{time:1.25,points:points()}]}}]});
const bind=f=>{const cfg=JSON.parse(readFileSync(f.profiles.test)),p=loadProject(f.profiles.test);writeFileSync(join(f.dir,'depth.json'),JSON.stringify(input(p.boundHashes.source)));cfg.depthTextPath='depth.json';writeFileSync(f.profiles.test,JSON.stringify(cfg));return loadProject(f.profiles.test);};
test('source-bound contours stay distinct from automatic segmentation and survive backup/restore',async()=>{
 const f=fixture();try{const p=bind(f),v=prepareProject(p,{zoomIntensity:0});assert.equal(v.plan.depthText.length,1);assert.equal(v.plan.depthText[0].automaticSegmentation,false);assert.equal(v.plan.depthText[0].occlusionScope,'head-and-neck');assert.match(buildPreviewASS(v.plan),/\\iclip\(1,m /);assert.deepEqual(prepareProject(p,{motions:false,zoomIntensity:0}).plan.depthText,[]);
 const out=join(f.dir,'backup');await createProjectBackup(p,v,out);const restored=prepareProject(loadProject(join(out,'project.json')),{zoomIntensity:0});assert.equal(buildPreviewASS(v.plan),buildPreviewASS(restored.plan));
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('unreviewed geometry, mismatched source, unsupported camera and extrapolation fail closed',()=>{
 const f=fixture();try{const p=loadProject(f.profiles.test),plan=prepareProject(p,{zoomIntensity:0}).plan,data=input(p.boundHashes.source),bad=()=>structuredClone(data);let b=bad();b.sourceSha256='0'.repeat(64);assert.throws(()=>prepareDepthText(b,plan),/binding/);
 b=bad();b.events[0].mask.keyframes[0].points=[[0,0],[100,0],[100,100],[0,100]];assert.throws(()=>prepareDepthText(b,plan),/contour/);
 b=bad();b.events[0].mask.keyframes[1].time=1;assert.throws(()=>prepareDepthText(b,plan),/whole event/);
 b=bad();b.events[0].mask.reviewedRegion.bottom=460;assert.throws(()=>prepareDepthText(b,plan),/reviewed mask region/);
 const camera=structuredClone(plan);camera.camera.keyframes[0].x=2;assert.throws(()=>prepareDepthText(data,camera),/full-frame/);
 const zoom=structuredClone(plan);zoom.semantic.zooms=[{start:0,end:2}];assert.throws(()=>prepareDepthText(data,zoom),/overlaps/);
 const d=bad();d.events[0].mask.keyframes[1].points=points().map(([x,y])=>[x+10,y]);assert.ok(Math.abs(contourAt(d.events[0].mask,.75)[0][0]-715)<.001);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('real libass removes depth text inside a synthetic contour while retaining pixels outside',()=>{
 const f=fixture();try{const p=bind(f),v=prepareProject(p,{zoomIntensity:0});writeFileSync(join(f.dir,'depth.ass'),buildPreviewASS(v.plan));
 const render=filter=>execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','color=c=0x204080:s=1080x1920:r=30:d=1','-vf',filter+",select=eq(n\\,15)",'-frames:v','1','-pix_fmt','rgb24','-f','rawvideo','-'],{maxBuffer:12*1024*1024});
 const clear=render('null'),composed=render(`ass=filename=${join(f.dir,'depth.ass')}:fontsdir=${resolve('assets/fonts/montserrat')}`);let inside=0,outside=0;
 for(let y=320;y<580;y++)for(let x=100;x<930;x++){const i=(y*1080+x)*3,changed=clear[i]!==composed[i]||clear[i+1]!==composed[i+1]||clear[i+2]!==composed[i+2];if(changed){if(Math.hypot(x-540,y-450)<165)inside++;else outside++;}}
 assert.equal(inside,0);assert.ok(outside>500,'text must remain visible outside the contour');
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
