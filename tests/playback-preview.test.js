import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,rmSync,readFileSync,statSync,copyFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {PlaybackPreviews} from '../src/playback-preview.js';
import {fixture} from './helpers/editor-fixture.js';
import {createEditorServer} from '../src/editor-server.js';
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const generate=p=>execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','testsrc2=size=1080x1920:rate=30:duration=1','-f','lavfi','-i','sine=frequency=440:duration=1','-c:v','libx264','-threads','1','-preset','ultrafast','-crf','18','-c:a','aac','-shortest',p]);
test('light preview decodes, keeps duration/audio and leaves export bytes intact; cached requests reuse it',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'sues-proxy-')),source=join(dir,'export.mp4'),cache=new PlaybackPreviews(join(dir,'cache')),id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 try{
  generate(source);const before=hash(source);const [a,b]=await Promise.all([cache.ensure(id,source),cache.ensure(id,source)]);assert.equal(a,b);
  const info=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',a],{encoding:'utf8'}));
  const v=info.streams.find(s=>s.codec_type==='video');assert.equal(v.width,720);assert.equal(v.height,1280);assert.ok(info.streams.some(s=>s.codec_type==='audio'));assert.ok(Math.abs(Number(info.format.duration)-1)<.12);
  assert.equal(hash(source),before);assert.ok(statSync(a).size<statSync(source).size);const timestamp=statSync(a).mtimeMs;await cache.ensure(id,source);assert.equal(statSync(a).mtimeMs,timestamp);
  await assert.rejects(cache.ensure('../escape',source));const bytes=readFileSync(a);assert.ok(bytes.indexOf(Buffer.from('moov'))<bytes.indexOf(Buffer.from('mdat')));
 }finally{await cache.close();rmSync(dir,{recursive:true,force:true});}
});
test('preview endpoint is private and seekable while the export endpoint retains full resolution',async()=>{
 const f=fixture();let app;
 try{
  const source=join(f.dir,'actual.mp4');generate(source);app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles});
  const base=(await app.listen()).split('/#')[0],job=app.jobs.create('test'),record=app.jobs.get(job.id);record.state='DONE';record.output='export.mp4';copyFileSync(source,join(app.jobs.dir(job.id),record.output));
  const path='/api/jobs/'+job.id+'/preview';assert.equal((await fetch(base+path)).status,401);
  const login=await fetch(base+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}}),headers={Cookie:login.headers.get('set-cookie').split(';')[0]};
  const preview=await fetch(base+path,{headers:{...headers,Range:'bytes=0-1023'}});assert.equal(preview.status,206);assert.equal((await preview.arrayBuffer()).byteLength,1024);assert.equal(preview.headers.get('cache-control'),'no-store');
  const full=await fetch(base+'/api/jobs/'+job.id+'/media',{headers});assert.equal(createHash('sha256').update(Buffer.from(await full.arrayBuffer())).digest('hex'),hash(source));
 }finally{if(app)await app.close();rmSync(f.dir,{recursive:true,force:true});}
});
