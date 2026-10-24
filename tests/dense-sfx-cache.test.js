import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
test('dense audio cache preserves decoded samples and all delayed cue times',()=>{
 const dir=mkdtempSync(join(tmpdir(),'sues-dense-sfx-'));
 try{
  const sources=Array.from({length:10},(_,i)=>"aevalsrc='0.03*sin(2*PI*"+(440+i*71)+"*t)':s=48000:d=0.12,aformat=sample_fmts=fltp:channel_layouts=stereo,adelay="+(i*90)+"|"+(i*90)+"[sfx"+i+"]");
  writeFileSync(join(dir,'audio.ffscript'),sources.concat(["anullsrc=r=48000:cl=stereo:d=1.3,aformat=sample_fmts=fltp[sfx-silence]","[sfx-silence]"+sources.map((_,i)=>'[sfx'+i+']').join('')+"amix=inputs=11:duration=first:dropout_transition=0:normalize=0,atrim=duration=1.3[sfx-bus]"]).join(';\n')+'\n');
  const script="import importlib.util,pathlib,subprocess,struct,json\nspec=importlib.util.spec_from_file_location('r',__import__('sys').argv[1]);r=importlib.util.module_from_spec(spec);spec.loader.exec_module(r)\np=pathlib.Path(__import__('sys').argv[2]);c=r.cache_dense_sfx(p,1.3,p)\ndirect=subprocess.check_output(['ffmpeg','-v','error','-filter_complex_threads','1','-filter_complex_script',str(p/'audio.ffscript'),'-map','[sfx-bus]','-f','f32le','-'])\ncached=subprocess.check_output(['ffmpeg','-v','error','-i',str(c['bus']),'-f','f32le','-'])\nassert len(direct)==len(cached),(len(direct),len(cached))\na=struct.unpack('<%df'%(len(direct)//4),direct);b=struct.unpack('<%df'%(len(cached)//4),cached);error=max(abs(x-y) for x,y in zip(a,b));assert error<0.000001,error\nassert c['sources']==10 and c['batchSize']==6\nprint(json.dumps({'maxSampleError':error,'sources':10,'samples':len(a)}))\n";
  writeFileSync(join(dir,'check.py'),script);
  const out=execFileSync('python3',[join(dir,'check.py'),resolve('scripts/templates/render_local_preview.py'),dir],{timeout:90000,encoding:'utf8'});
  assert.equal(JSON.parse(out).sources,10);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
