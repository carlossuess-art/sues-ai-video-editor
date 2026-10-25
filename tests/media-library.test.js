import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {MediaLibrary} from '../src/media-library.js';
import {fixture} from './helpers/editor-fixture.js';
import {loadProject,prepareProject} from '../src/local-pipeline.js';
const incoming=bytes=>Object.assign(Readable.from([bytes]),{headers:{'content-length':String(bytes.length)}});
const imageProbe={streams:[{codec_type:'video',codec_name:'png',width:800,height:300}],format:{format_name:'png_pipe'}};
test('private asset intake is bounded, content-addressed, deduplicated and verified after restart',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'sues-assets-'));try{const lib=new MediaLibrary(dir,{probe:async()=>imageProbe}),payload=Buffer.from('image-fixture'),meta={kind:'image',rights:'owned',title:'Mi imagen'};
 const a=await lib.receive(incoming(payload),meta),same=await lib.receive(incoming(payload),meta);assert.equal(a.id,same.id);assert.equal(lib.list().length,1);assert.ok(!JSON.stringify(lib.list()).includes(dir));assert.equal(new MediaLibrary(dir).resolve(a.id,'image').sha256,a.id);
 await assert.rejects(lib.receive(incoming(payload),{...meta,rights:'licensed'}),/otra procedencia/);
 await assert.rejects(lib.receive(incoming(payload),{...meta,rights:'unknown'}),/procedencia/);
 writeFileSync(join(dir,a.id+'.media'),'changed');assert.throws(()=>lib.resolve(a.id),/integrity/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('asset validation rejects animated/unbounded files and duration-invalid audio',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'sues-assets-'));try{const bytes=Buffer.from('bad'),meta={kind:'image',rights:'owned',title:'x'};
 for(const probe of [{...imageProbe,format:{format_name:'hls'}},{streams:[{codec_type:'video',codec_name:'png',width:8000,height:8000}],format:{format_name:'png_pipe'}}])await assert.rejects(new MediaLibrary(dir,{probe:async()=>probe}).receive(incoming(bytes),meta),/imagen fija/);
 await assert.rejects(new MediaLibrary(dir,{probe:async()=>({streams:[{codec_type:'audio'}],format:{duration:1}})}).receive(incoming(bytes),{...meta,kind:'audio'}),/audio de entre/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('selected library music/images bind their actual hashes into the plan and fingerprint',()=>{
 const f=fixture();try{const p=loadProject(f.profiles.test);p.resolveAsset=(id,kind)=>({assetId:id,sha256:id,kind,rights:'owned',localFile:'/asset/'+id,duration:30});
 const image='a'.repeat(64),music='b'.repeat(64),settings={musicAssetId:music,imageEvents:[{assetId:image,start:2,end:3}],motions:true};
 const result=prepareProject(p,settings);assert.equal(result.plan.audioMix.assetId,music);assert.equal(result.plan.illustrations[0].sha256,image);assert.notEqual(result.fingerprint,prepareProject(p).fingerprint);
 p.resolveAsset=()=>({duration:3});assert.throws(()=>prepareProject(p,{musicAssetId:music}),/más corta/);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});

test('the complete private library can exceed 128 assets while keeping bounded intake',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'sues-full-library-'));
 try{const lib=new MediaLibrary(dir,{probe:async()=>imageProbe});for(let i=0;i<129;i++)await lib.receive(incoming(Buffer.from('unique-full-library-'+i)),{kind:'image',rights:'owned',title:'Resource '+i});
 assert.equal(lib.capacity().installed,129);assert.equal(lib.capacity().maxAssets,512);assert.equal(new MediaLibrary(dir).list().length,129);assert.throws(()=>new MediaLibrary(dir,{maxAssets:513}),/Límites/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
