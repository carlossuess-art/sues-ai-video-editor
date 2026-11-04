import test from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,writeFileSync,readFileSync,readdirSync,existsSync,rmSync} from 'node:fs';import {join} from 'node:path';import {tmpdir} from 'node:os';import {createHash} from 'node:crypto';
import {renderMasterDirectorPreview} from '../src/master-director-preview-renderer.js';
const sha=s=>createHash('sha256').update(s).digest('hex');
test('preview stages private source, rechecks approval, and removes staged media',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'master-render-'));
 try{const bytes=Buffer.from('original'),sourcePath=join(dir,'source'),id=sha(bytes);writeFileSync(sourcePath,bytes);
  const workRoot=join(dir,'work'),composition={schema:'sues-remotion-layers/v1',sourceSha256:id,planFingerprint:'b'.repeat(64),canvas:{width:1080,height:1920},fps:30,durationFrames:30,layers:[],source:{assetId:id,spans:[]}};
  const args={composition,project:{sourcePath,boundHashes:{source:id},fontDirectory:dir,fontHashes:{}},assets:{},workRoot,entryFile:'/tmp/src/index.ts',remotionCli:'/tmp/remotion.js',browserExecutable:'/tmp/chrome',approvalCheck:async()=>true,
   runner:async(_cmd,argv)=>{writeFileSync(argv[4],'private-preview');return {stdout:''}}};
  const result=await renderMasterDirectorPreview(args);assert.equal(result.status,'PREVIEW_RENDERED_UNVERIFIED');
  assert.equal(result.record.final,false);assert.equal(readFileSync(result.outputPath,'utf8'),'private-preview');assert.equal(existsSync(join(result.outputPath,'..','public')),false);
  let checks=0;const failed=await renderMasterDirectorPreview({...args,approvalCheck:async()=>++checks<3});
  assert.equal(failed.status,'BLOCKED');assert.equal(failed.issues[0].code,'APPROVAL_OR_SOURCE_CHANGED_DURING_RENDER');assert.equal(readdirSync(workRoot).length,1);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
