import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {fixture} from './helpers/editor-fixture.js';
import {loadProject,prepareProject} from '../src/local-pipeline.js';
import {buildPreviewASS} from '../src/local-preview.js';

test('white B-roll gets a readable caption background only during its actual intersection',()=>{
 const f=fixture(),dir=mkdtempSync(join(tmpdir(),'sues-contrast-'));
 try{
  const p=prepareProject(loadProject(f.profiles.test),{motions:false,zoomIntensity:0}).plan;
  p.captions=[{id:'seg-001',text:'Texto',lines:['Texto'],start:1,end:4,wordIndexes:[0],wordCues:[],source:'manual'}];
  p.selectedMedia=[{start:2,end:3}];p.graphics=[];p.semantic.motions=[];p.depthText=[];p.elements=[];
  const file=join(dir,'captions.ass');writeFileSync(file,buildPreviewASS(p));
  const sample=time=>execFileSync('ffmpeg',['-v','error','-threads','1','-f','lavfi','-i','color=c=white:s=1080x1920:r=10:d=4','-vf',`ass=filename=${file}:fontsdir=${resolve('assets/fonts/montserrat')},crop=2:2:116:1220,scale=1:1`,'-ss',String(time),'-frames:v','1','-threads','1','-f','rawvideo','-pix_fmt','rgb24','-'],{timeout:30000});
  assert.ok(sample(1.5)[0]>240,'no backplate before B-roll');
  assert.ok(sample(2.5)[0]<100,'actual darker pixel behind the white caption');
  assert.ok(sample(3.5)[0]>240,'no backplate after B-roll');
 }finally{rmSync(f.dir,{recursive:true,force:true});rmSync(dir,{recursive:true,force:true});}
});
