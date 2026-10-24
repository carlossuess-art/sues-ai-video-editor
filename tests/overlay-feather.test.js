import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,rmSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fixture} from './helpers/editor-fixture.js';
import {loadProject,prepareProject} from '../src/local-pipeline.js';
import {buildPreviewFilter} from '../src/local-preview.js';
test('compiled lower-half light overlay fades from zero alpha at its top edge',()=>{
 const f=fixture();try{
  const p=loadProject(f.profiles.test),file=join(f.dir,'source.mp4'),id=createHash('sha256').update(readFileSync(file)).digest('hex');
  p.resolveAsset=()=>({assetId:id,kind:'overlay',rights:'licensed',sha256:id,localFile:file,duration:12});
  const plan=prepareProject(p,{overlayEvents:[{assetId:id,start:9,end:10.2,sourceIn:0,intensity:.22,reason:'Regression: hard top edge'}]}).plan;
  const graph=buildPreviewFilter(plan),start=graph.indexOf("geq=r="),end=graph.indexOf(',colorchannelmixer',start);
  assert.ok(start>=0&&end>start);const filter='format=rgba,'+graph.slice(start,end)+',format=rgba';
  const data=execFileSync('ffmpeg',['-v','error','-filter_threads','1','-f','lavfi','-i','color=c=blue:s=16x480:d=0.1','-vf',filter,'-frames:v','1','-pix_fmt','rgba','-f','rawvideo','-'],{maxBuffer:100000});
  const alpha=y=>data[(y*16+8)*4+3];assert.equal(alpha(0),0);assert.ok(alpha(120)>=120&&alpha(120)<=130);assert.equal(alpha(240),255);assert.equal(alpha(479),255);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
