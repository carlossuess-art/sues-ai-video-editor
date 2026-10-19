import test from 'node:test';
import assert from 'node:assert/strict';
import {rmSync,writeFileSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fixture} from './helpers/editor-fixture.js';
import {loadProject,prepareProject} from '../src/local-pipeline.js';
import {buildPreviewASS,buildPreviewFilter} from '../src/local-preview.js';
import {prepareSubjectLayers,subjectLayerFilters} from '../src/subject-layers.js';
import {createProjectBackup,verifyProjectBackup} from '../src/project-backup.js';
const data=(plan)=>({version:'1.0',sourceSha256:plan.source.sha256,matte:{localFile:'/tmp/matte.mkv',sha256:'b'.repeat(64),method:'guided-grabcut-v1',scope:'full-visible-subject',reviewStatus:'reviewed',reviewedRanges:[{start:1,end:8}],width:1080,height:1920,fps:30,duration:plan.duration},events:[{assetId:'owned-depth',rights:'owned',localFile:'/tmp/resource.png',sha256:'c'.repeat(64),start:1,end:3,opacity:1,fadeSeconds:.2,box:{left:0,right:1080,top:0,bottom:1100}}]});
test('reviewed source/time-bound subject layers fail closed for incompatible geometry, cuts and reviews',()=>{
 const f=fixture();try{const project=loadProject(f.profiles.test),plan=prepareProject(project,{zoomIntensity:0,motions:false}).plan,d=data(plan);
 assert.equal(prepareSubjectLayers(d,plan)[0].automaticPersonDetection,false);
 for(const invalid of [{...d,sourceSha256:'d'.repeat(64)},{...d,matte:{...d.matte,reviewStatus:'unreviewed'}},{...d,matte:{...d.matte,reviewedRanges:[{start:2,end:8}]}},{...d,matte:{...d.matte,fps:25}},{...d,events:[{...d.events[0],box:{left:0,right:1080,top:0,bottom:1500}}]}])assert.throws(()=>prepareSubjectLayers(invalid,plan),/Subject layers/);
 const limited={...d,matte:{...d.matte,scope:'upper-body',reviewedRegion:{top:0,bottom:800}}};assert.throws(()=>prepareSubjectLayers(limited,plan),/resource box/);
 const zoom={...plan,semantic:{...plan.semantic,zooms:[{start:1,end:2}]}};assert.throws(()=>prepareSubjectLayers(d,zoom),/overlap/);
 assert.throws(()=>prepareSubjectLayers(d,{...plan,timeMap:{spans:[{sourceIn:1}]}}),/full-frame/);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('subject layer compilation is opt-in and original captions/audio filters remain separate',()=>{
 const f=fixture();try{const project=loadProject(f.profiles.test),base=prepareProject(project,{zoomIntensity:0,motions:false}),d=data(base.plan);project.inputs.subjectLayers=d;
 const hidden=prepareProject(project,{motions:false,zoomIntensity:0});assert.deepEqual(hidden.plan.subjectLayers,[]);assert.equal(buildPreviewASS(hidden.plan),buildPreviewASS(base.plan));
 const enabled=prepareProject(project,{zoomIntensity:0,motionChoices:[],highlightCaptions:[]});assert.equal(enabled.plan.subjectLayers.length,1);assert.ok(buildPreviewFilter(enabled.plan).includes("A*B/255"));assert.ok(buildPreviewFilter(enabled.plan).indexOf('depth-resource')<buildPreviewFilter(enabled.plan).indexOf('ass=filename'));
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('portable recovery keeps source-bound matte and asset without old host paths',async()=>{
 const f=fixture();try{const project=loadProject(f.profiles.test),d=data(prepareProject(project,{motions:false,zoomIntensity:0}).plan);for(const [key,name]of [['matte','matte.mkv'],['image','resource.png']])writeFileSync(join(f.dir,name),key);
 const {fileSha256}=await import('../src/local-pipeline.js');d.matte.localFile=join(f.dir,'matte.mkv');d.matte.sha256=fileSha256(d.matte.localFile);d.events[0].localFile=join(f.dir,'resource.png');d.events[0].sha256=fileSha256(d.events[0].localFile);project.inputs.subjectLayers=d;
 const p=prepareProject(project,{zoomIntensity:0}),out=join(f.dir,'portable');await createProjectBackup(project,p,out);assert.equal(verifyProjectBackup(out).valid,true);
 const restored=prepareProject(loadProject(join(out,'project.json')),JSON.parse(readFileSync(join(out,'settings.json'))));assert.equal(buildPreviewFilter(restored.plan),buildPreviewFilter(p.plan));assert.equal(buildPreviewASS(restored.plan),buildPreviewASS(p.plan));
 const metadata=join(out,'analysis/subject-layers.json'),original=readFileSync(metadata),d2=JSON.parse(original);d2.matte.localFile=join(f.dir,'matte.mkv');writeFileSync(metadata,JSON.stringify(d2));
 const manifestPath=join(out,'backup-manifest.json'),manifest=JSON.parse(readFileSync(manifestPath));const entry=manifest.files.find(e=>e.path==='analysis/subject-layers.json');entry.sha256=fileSha256(metadata);entry.bytes=readFileSync(metadata).length;manifest.filesDigest=createHash('sha256').update(JSON.stringify(manifest.files)).digest('hex');writeFileSync(manifestPath,JSON.stringify(manifest));
 assert.throws(()=>verifyProjectBackup(out),/subject layer points outside/);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('FFmpeg real masked composition preserves foreground pixels and adds only the resource outside',()=>{
 const f=fixture();try{const project=loadProject(f.profiles.test),plan=prepareProject(project,{motions:false,zoomIntensity:0}).plan,e=prepareSubjectLayers(data(plan),plan);
 const resource=join(f.dir,'blue.png'),mask=join(f.dir,'mask.mkv');
 execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','color=c=blue:s=1080x1920','-frames:v','1',resource]);
 execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','color=c=black:s=1080x1920:r=30:d=4','-vf','drawbox=x=350:y=200:w=300:h=1720:color=white:t=fill,format=gray','-c:v','ffv1',mask]);
 const graph=subjectLayerFilters(e,'0:v',1),filter=graph.filters.join(';')+`;[${graph.base}]format=rgb24[v]`,src='color=c=0x223344:s=1080x1920:r=30:d=4';
 const actual=execFileSync('ffmpeg',['-v','error','-f','lavfi','-i',src,'-loop','1','-framerate','30','-i',resource,'-i',mask,'-filter_complex_threads','1','-filter_complex',filter,'-map','[v]','-ss','2','-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','-'],{maxBuffer:8*1024*1024});
 const dry=execFileSync('ffmpeg',['-v','error','-f','lavfi','-i',src,'-ss','2','-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','-'],{maxBuffer:8*1024*1024});
 const pixel=(b,x,y)=>[...b.subarray((y*1080+x)*3,(y*1080+x)*3+3)];assert.deepEqual(pixel(actual,500,500),pixel(dry,500,500));assert.notDeepEqual(pixel(actual,100,500),pixel(dry,100,500));assert.deepEqual(pixel(actual,100,1500),pixel(dry,100,1500));
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
