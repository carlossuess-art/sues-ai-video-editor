import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
test('library SFX batches preserve repeated source cue gains, fades and exact delays',()=>{
 const dir=mkdtempSync(join(tmpdir(),'sues-library-sfx-'));
 try{
  const labels=Array.from({length:9},(_,i)=>'[custom-source'+i+']');
  const clauses=['[0:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,atrim=duration=0.12,asetpts=PTS-STARTPTS,asplit=9'+labels.join('')];
  for(let i=0;i<9;i++)clauses.push(labels[i]+'afade=t=in:d=0.01,volume='+(0.2+i/20)+',adelay='+(i*180)+'|'+(i*180)+'[custom-cue'+i+']');
  clauses.push('anullsrc=r=48000:cl=stereo:d=2.1,aformat=sample_fmts=fltp[custom-silence]','[custom-silence]'+labels.map((_,i)=>'[custom-cue'+i+']').join('')+'amix=inputs=10:duration=first:dropout_transition=0:normalize=0[custom-bus]');
  writeFileSync(join(dir,'audio.ffscript'),clauses.join(';\n')+'\n');
  const script=`import importlib.util,pathlib,subprocess,struct,json,sys,shutil
spec=importlib.util.spec_from_file_location('r',sys.argv[1]);r=importlib.util.module_from_spec(spec);spec.loader.exec_module(r)
p=pathlib.Path(sys.argv[2]);wav=p/'tone.wav'
subprocess.run(['ffmpeg','-v','error','-f','lavfi','-i','sine=frequency=440:sample_rate=48000:duration=0.12','-ac','2',str(wav)],check=True)
c=r.cache_library_sfx(p,2.1,p,[wav])
direct=subprocess.check_output(['ffmpeg','-v','error','-i',str(wav),'-filter_complex_threads','1','-filter_complex_script',str(p/'audio.ffscript'),'-map','[custom-bus]','-f','f32le','-'])
cached=subprocess.check_output(['ffmpeg','-v','error','-i',str(c['bus']),'-f','f32le','-'])
assert len(direct)==len(cached),(len(direct),len(cached))
a=struct.unpack('<%df'%(len(direct)//4),direct);b=struct.unpack('<%df'%(len(cached)//4),cached);error=max(abs(x-y) for x,y in zip(a,b));assert error<0.000001,error
assert c['sources']==9 and c['batchSize']==3
assert len(c['removed'])==12
print(json.dumps({'sources':9,'maxSampleError':error,'samples':len(a)}))
shutil.rmtree(c['directory'])
`;
  writeFileSync(join(dir,'check.py'),script);
  const out=execFileSync('python3',[join(dir,'check.py'),resolve('scripts/templates/render_local_preview.py'),dir],{timeout:90000,encoding:'utf8'});
  assert.equal(JSON.parse(out).sources,9);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
