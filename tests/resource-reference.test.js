import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {resourceLevelFilter} from '../src/audio-levels.js';

test('short transient references retain audible level, bounded peaks and original sample count',()=>{
 for(const duration of [.36,.864,1.601604]){
  const release=Math.max(.01,duration-.03);
  const source=`anoisesrc=color=pink:amplitude=0.16:seed=731:sample_rate=48000:duration=${duration},highpass=f=700,lowpass=f=4800,afade=t=in:d=0.01,afade=t=out:st=0.03:d=${release}`;
  const pcm=execFileSync('ffmpeg',['-v','error','-filter_threads','1','-f','lavfi','-i',source,'-af',resourceLevelFilter(duration).replace(/,$/,''),'-f','f32le','-'],{timeout:30000,maxBuffer:4*1024*1024});
  const samples=new Float32Array(pcm.buffer,pcm.byteOffset,pcm.byteLength/4);let peak=0,power=0;
  for(const x of samples){assert.ok(Number.isFinite(x));peak=Math.max(peak,Math.abs(x));power+=x*x;}
  assert.ok(Math.abs(samples.length/2-duration*48000)<=2,'padding must not shift or extend cue');
  assert.ok(peak>.1,'transient must remain audible after normalization');assert.ok(peak<.96,'peak ceiling');
  assert.ok(Math.sqrt(power/samples.length)>.02,'body of effect must not collapse to silence');
 }
});
