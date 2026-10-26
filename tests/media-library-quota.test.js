import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {MediaLibrary} from '../src/media-library.js';
import {createEditorServer} from '../src/editor-server.js';

const info={streams:[{codec_type:'video',codec_name:'png',width:800,height:300}],format:{format_name:'png_pipe'}};
const incoming=s=>{const b=Buffer.from(s);return Object.assign(Readable.from([b]),{headers:{'content-length':String(b.length)}});};
const metadata={kind:'image',rights:'owned',title:'Fixture'};
test('library grows beyond old 24-slot ceiling, but enforces total files and bytes',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'sues-capacity-'));
 try{
  const limited=new MediaLibrary(dir,{probe:async()=>info,maxAssets:2,maxLibraryBytes:20});
  await limited.receive(incoming('aaaaa'),metadata);await limited.receive(incoming('bbbbb'),metadata);
  assert.deepEqual({installed:limited.capacity().installed,remaining:limited.capacity().remainingSlots},{installed:2,remaining:0});
  await assert.rejects(limited.receive(incoming('ccccc'),metadata),/Límite de 2/);
  await limited.receive(incoming('aaaaa'),metadata);assert.equal(limited.capacity().installed,2); // dedupe at limit
  assert.throws(()=>new MediaLibrary(dir,{maxAssets:999}),/Límites/);
  const quota=new MediaLibrary(dir,{probe:async()=>info,maxAssets:5,maxLibraryBytes:12});
  await assert.rejects(quota.receive(incoming('dddddd'),metadata),/Cuota total/);
  assert.equal(quota.capacity().usedBytes,10);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('library capacity is authenticated; default 512 slots and 2 GiB hard quota',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'sues-cap-http-')),app=createEditorServer({directory:dir,profiles:{}});
 try{
  const loc=await app.listen(),url=loc.split('/#')[0];
  assert.equal((await fetch(url+'/api/library/capacity')).status,401);
  const s=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}});
  const cookie=s.headers.get('set-cookie').split(';')[0];
  const r=await fetch(url+'/api/library/capacity',{headers:{Cookie:cookie}});
  assert.equal(r.status,200);
  const c=await r.json();assert.equal(c.maxAssets,512);assert.equal(c.maxBytes,2*1024**3);assert.equal(c.installed,0);
 }finally{await app.close();rmSync(dir,{recursive:true,force:true});}
});
