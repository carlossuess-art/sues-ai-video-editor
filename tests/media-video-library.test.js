import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {mkdtempSync, rmSync, writeFileSync, readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {MediaLibrary} from '../src/media-library.js';
import {createEditorServer} from '../src/editor-server.js';

const incoming = bytes => Object.assign(Readable.from([bytes]), {headers:{'content-length':String(bytes.length)}});
const validProbe = {
 streams:[{codec_type:'video',codec_name:'mpeg4',width:640,height:360,avg_frame_rate:'25/1',pix_fmt:'yuv420p'}],
 format:{format_name:'mov,mp4,m4a,3gp,3g2,mj2',duration:'1.25',tags:{major_brand:'isom'}}
};

test('private video/overlay accepts content-hashed media and keeps originals isolated',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'sues-video-asset-'));
 try{
  const lib=new MediaLibrary(dir,{probe:async()=>validProbe}),a=await lib.receive(incoming(Buffer.from('video1')),{kind:'video',rights:'licensed',title:'Reloj'});
  const overlay=await lib.receive(incoming(Buffer.from('over1')),{kind:'overlay',rights:'licensed',title:'Destello'});
  const timecode=await new MediaLibrary(join(dir,'tc'),{probe:async()=>({...validProbe,streams:[...validProbe.streams,{codec_type:'data',codec_tag_string:'tmcd'}]})}).receive(incoming(Buffer.from('timecode')),{kind:'video',rights:'owned',title:'Animación con tiempo'});assert.equal(timecode.width,640);
  assert.equal(a.mimeType,'video/mp4');assert.equal(a.fps,25);assert.equal(a.width,640);assert.equal(a.duration,1.25);
  assert.equal(overlay.kind,'overlay');assert.equal(lib.list().length,2);
  assert.equal(new MediaLibrary(dir).resolve(a.id,'video').sha256,a.id);
  assert.ok(!JSON.stringify(lib.semanticCatalog()).includes(dir));
  assert.equal(lib.semanticCatalog().assets.find(x=>x.id===a.id).status,'unavailable');
  const again=await lib.receive(incoming(Buffer.from('video1')),{kind:'video',rights:'licensed',title:'No reemplazar'});
  assert.equal(again.title,'Reloj');
  await assert.rejects(lib.receive(incoming(Buffer.from('video1')),{kind:'overlay',rights:'licensed',title:'Reetiquetado'}),/otra procedencia/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('video intake rejects streaming protocols, audio-only, unsafe codecs, dimensions, durations and fps',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'sues-video-reject-'));
 try{
  const base={kind:'video',rights:'owned',title:'Clip'};
  const probes=[
   {...validProbe,format:{format_name:'hls',duration:'1'}},
   {...validProbe,streams:[{codec_type:'audio',codec_name:'aac'}]},
   {...validProbe,streams:[{...validProbe.streams[0],codec_name:'unknown'}]},
   {...validProbe,streams:[{...validProbe.streams[0],width:8000}]},
   {...validProbe,format:{...validProbe.format,duration:'1000'}},
   {...validProbe,streams:[{...validProbe.streams[0],avg_frame_rate:'0/0'}]},
   {...validProbe,streams:[validProbe.streams[0],validProbe.streams[0]]},
   {...validProbe,streams:[...validProbe.streams,{codec_type:'subtitle'}]},
   {...validProbe,streams:[...validProbe.streams,{codec_type:'data',codec_tag_string:'unsafe'}]}
  ];
  for(const p of probes)await assert.rejects(new MediaLibrary(dir,{probe:async()=>p}).receive(incoming(Buffer.from('invalid')) ,base),/Usa un vídeo MP4\/MOV/);
  assert.equal(new MediaLibrary(dir).list().length,0);
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('actual FFmpeg video is probed, saved privately, and served through authenticated range requests',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'sues-video-real-'));
 let app;
 try{
  const path=join(dir,'fixture.mp4');
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-f','lavfi','-i','color=c=blue:s=320x240:r=25:d=0.6','-c:v','mpeg4','-q:v','5','-pix_fmt','yuv420p','-y',path],{timeout:15000});
  const bytes=readFileSync(path);
  app=createEditorServer({directory:join(dir,'state'),profiles:{}});
  const origin=(await app.listen()).split('/#')[0];
  assert.equal((await fetch(origin+'/api/assets')).status,401);
  const session=await fetch(origin+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}});
  const cookie=session.headers.get('set-cookie').split(';')[0];
  const headers={Cookie:cookie,'X-Sues-Request':'editor'};
  const created=await fetch(origin+'/api/assets?kind=video&rights=owned&name=Prueba',{method:'POST',headers:{...headers,'Content-Type':'video/mp4'},body:bytes});
  assert.equal(created.status,201,await created.clone().text());
  const video=await created.json();assert.equal(video.kind,'video');assert.equal(video.mimeType,'video/mp4');
  assert.equal(video.width,320);assert.equal(video.height,240);assert.ok(video.duration>.5);
  assert.equal((await fetch(origin+'/api/assets/'+video.id+'/media',{headers:{Range:'bytes=0-15'}})).status,401);
  const media=await fetch(origin+'/api/assets/'+video.id+'/media',{headers:{...headers,Range:'bytes=0-15'}});
  assert.equal(media.status,206);assert.deepEqual(Buffer.from(await media.arrayBuffer()),bytes.subarray(0,16));
  const cat=await (await fetch(origin+'/api/resource-catalog',{headers})).json();
  assert.equal(cat.assets.find(x=>x.id===video.id).status,'unavailable');
  assert.equal((await fetch(origin+'/api/assets/'+video.id+'/metadata',{headers})).status,200);
 }finally{if(app)await app.close();rmSync(dir,{recursive:true,force:true});}
});
