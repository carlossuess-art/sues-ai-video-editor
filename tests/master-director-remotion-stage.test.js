import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,existsSync,rmSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {stageMasterDirectorImages} from '../src/master-director-remotion-stage.js';
test('copies only a verified image to an isolated Remotion directory and rejects changed bytes',()=>{
 const dir=mkdtempSync(join(tmpdir(),'master-stage-'));
 try{const bytes=Buffer.from('test asset'),id=createHash('sha256').update(bytes).digest('hex'),source=join(dir,'source');writeFileSync(source,bytes);
  const c={schema:'sues-remotion-layers/v1',layers:[{kind:'image',assetId:id}]};
  const assets={resolve:()=>({sha256:id,localFile:source,kind:'image'}),metadata:()=>({approvedForProduction:true,license:{rightsStatus:'verified',commercialUseAllowed:true,proofRef:'record'},testReportRef:'record'})};
  assert.equal(stageMasterDirectorImages(c,{assets,publicDirectory:dir}).status,'STAGED_NOT_RENDERED');
  assert.deepEqual(readFileSync(join(dir,'master-assets',id)),bytes);
  writeFileSync(source,'changed');assert.throws(()=>stageMasterDirectorImages(c,{assets,publicDirectory:dir}),/changed/);
  const denied={...assets,metadata:()=>null};assert.throws(()=>stageMasterDirectorImages(c,{assets:denied,publicDirectory:dir}),/evidence/);
  assert.equal(existsSync(join(dir,'master-assets',id)),true);
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('font staging binds family and weight to current project bytes',async()=>{
 const {stageMasterDirectorFonts}=await import('../src/master-director-remotion-stage.js');
 const dir=mkdtempSync(join(tmpdir(),'master-font-'));
 try{const bytes=Buffer.from('fake font fixture'),hash=createHash('sha256').update(bytes).digest('hex'),file='Montserrat-Bold.ttf';writeFileSync(join(dir,file),bytes);
  const project={fontDirectory:dir,fontHashes:{[file]:hash}},c={schema:'sues-remotion-layers/v1',layers:[{kind:'text',fontAssetId:hash,visual:{typography:{family:'Montserrat',weight:700}}}]};
  assert.equal(stageMasterDirectorFonts(c,{project,publicDirectory:dir}).status,'STAGED_NOT_RENDERED');assert.deepEqual(readFileSync(join(dir,'master-fonts',hash)),bytes);
  writeFileSync(join(dir,file),'altered');assert.throws(()=>stageMasterDirectorFonts(c,{project,publicDirectory:dir}),/changed/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
