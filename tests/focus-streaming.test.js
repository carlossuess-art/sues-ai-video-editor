import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {rmSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fixture} from './helpers/editor-fixture.js';
import {loadProject,prepareProject} from '../src/local-pipeline.js';
import {buildPreviewFilter} from '../src/local-preview.js';
// A delayed split input used to buffer 18 seconds of 1080p frames before producing
// the first frame. Exercise FFmpeg under a fixed address-space budget instead of
// asserting graph spelling. No source files, production media or services needed.
test('late focus produces the first frame under a 768 MiB memory budget',()=>{
 const f=fixture();try{
  const p=prepareProject(loadProject(f.profiles.test),{motions:false,zoomIntensity:0}).plan;
  p.semantic={zooms:[],motions:[{start:18,end:20,backgroundTreatment:{sigma:18,dim:.12,fadeSeconds:.35}}]};
  p.finishFade=null;p.graphics=[];p.globalTransitions=[];
  const filter=buildPreviewFilter(p,{hasAudio:false}).replace('ass=filename=captions.ass:fontsdir=fonts','null'),path=join(f.dir,'focus.ffscript');writeFileSync(path,filter);
  const args=['-v','error','-threads','1','-f','lavfi','-i','color=c=blue:s=1080x1920:r=30:d=24','-filter_complex_threads','1','-filter_complex_script',path,'-map','[video]','-frames:v','1','-threads','1','-pix_fmt','rgb24','-f','rawvideo','-'];
  const output=execFileSync('python3',['-c','import os,resource,sys; resource.setrlimit(resource.RLIMIT_AS,(768*1024*1024,768*1024*1024)); os.execvp("ffmpeg",["ffmpeg",*sys.argv[1:]])',...args],{timeout:30000,maxBuffer:8*1024*1024});
  assert.equal(output.length,1080*1920*3);assert.ok(output[2]>200&&output[0]<10&&output[1]<10,'the original blue frame must be preserved before the late effect');
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
