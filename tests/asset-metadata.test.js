import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {mkdtempSync,rmSync,readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {MediaLibrary} from '../src/media-library.js';
import {createEditorServer} from '../src/editor-server.js';
const incoming=bytes=>Object.assign(Readable.from([bytes]),{headers:{'content-length':String(bytes.length)}});
const probe=async()=>({streams:[{codec_type:'audio'}],format:{duration:1,format_name:'wav'}});
const meta=id=>({schemaVersion:'sues-asset-metadata/v2',assetId:id,sha256:id,kind:'sfx',logicalAlias:'SFX_TEXT_SNAP',lifecycle:'integrated',origin:'private-resource-review',license:{rightsStatus:'unverified',commercialUseAllowed:false,proofRef:'/private/licence-proof'},semantics:{narrativeRoles:['turning_point'],emotionTags:['revelation'],profileCompatibility:['DOPAMIN'],energyRange:[.2,.8]},constraints:{requiredCapabilities:['sfx'],faceExclusion:false},approvedForProduction:false,privateStorageRef:'/private/media',testReportRef:'/private/listening-review'});
test('V2 metadata is opt-in, atomic, content-bound and keeps private references out of catalogs',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'sues-meta-'));try{
  const lib=new MediaLibrary(dir,{probe}),asset=await lib.receive(incoming(Buffer.from('sound')),{kind:'sfx',rights:'licensed',title:'Sound'}),id=asset.id;
  const legacy=readFileSync(join(dir,id+'.json'),'utf8');
  assert.equal(lib.semanticCatalog().aliases.length,14);assert.ok(lib.semanticCatalog().aliases.every(a=>a.status==='unavailable'));assert.equal(lib.metadata(id),null);assert.ok(!readdirSync(dir).includes('metadata-v2'));
  lib.saveMetadata(id,meta(id));const pending=readFileSync(join(dir,'metadata-v2',id+'.json'),'utf8');
  assert.equal(lib.resolveAlias('SFX_TEXT_SNAP').reason,'not-approved');
  for(const patch of [{sha256:'a'.repeat(64)},{kind:'music'},{approvedForProduction:true},{semantics:{...meta(id).semantics,energyRange:[.9,.1]}},{logicalAlias:'../escape'}])assert.throws(()=>lib.saveMetadata(id,{...meta(id),...patch}));
  assert.equal(readFileSync(join(dir,'metadata-v2',id+'.json'),'utf8'),pending);
  const approved={...meta(id),lifecycle:'approved',approvedForProduction:true,license:{...meta(id).license,rightsStatus:'verified',commercialUseAllowed:true}};
  assert.throws(()=>lib.saveMetadata(id,{...approved,testReportRef:''}),/prueba/);
  lib.saveMetadata(id,approved);assert.equal(lib.resolveAlias('SFX_TEXT_SNAP').reason,'missing-capability');assert.equal(lib.resolveAlias('SFX_TEXT_SNAP',{capabilities:['sfx'],profile:'CALMA'}).reason,'profile-incompatible');
  assert.equal(new MediaLibrary(dir).resolveAlias('SFX_TEXT_SNAP',{capabilities:['sfx'],profile:'DOPAMIN'}).assetId,id);
  assert.ok(!JSON.stringify(lib.semanticCatalog()).includes('/private/'));assert.equal(readFileSync(join(dir,id+'.json'),'utf8'),legacy);
  const other=await lib.receive(incoming(Buffer.from('other')),{kind:'sfx',rights:'owned',title:'Other'});assert.throws(()=>lib.saveMetadata(other.id,meta(other.id)),/otro recurso/);
  writeFileSync(join(dir,id+'.media'),'tampered');assert.throws(()=>lib.resolveAlias('SFX_TEXT_SNAP',{capabilities:['sfx']}),/integrity/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('metadata endpoints require a session and write header; invalid updates preserve metadata',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'sues-meta-api-')),app=createEditorServer({directory:dir,profiles:{},assetProbe:probe});
 try{
  const launch=await app.listen(),url=launch.split('/#')[0];
  assert.equal((await fetch(url+'/api/resource-catalog')).status,401);
  const session=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}}),headers={Cookie:session.headers.get('set-cookie').split(';')[0],'X-Sues-Request':'editor','Content-Type':'application/json'};
  const asset=await (await fetch(url+'/api/assets?kind=sfx&rights=owned&name=Sound',{method:'POST',headers,body:'sound'})).json();
  const path=url+'/api/assets/'+asset.id+'/metadata';
  assert.equal((await fetch(path,{method:'PUT',headers:{Cookie:headers.Cookie},body:JSON.stringify(meta(asset.id))})).status,403);
  assert.equal((await fetch(path,{method:'PUT',headers,body:JSON.stringify(meta(asset.id))})).status,200);
  assert.equal((await fetch(path,{method:'PUT',headers,body:'{}'})).status,400);
  const read=await (await fetch(path,{headers})).json();assert.equal(read.metadata.lifecycle,'integrated');assert.ok(!JSON.stringify(read).includes('/private/'));
 }finally{await app.close();rmSync(dir,{recursive:true,force:true});}
});
