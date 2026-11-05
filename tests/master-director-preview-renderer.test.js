import test from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,readdirSync,existsSync,rmSync} from 'node:fs';import {join} from 'node:path';import {tmpdir} from 'node:os';import {createHash} from 'node:crypto';
import {renderMasterDirectorPreview} from '../src/master-director-preview-renderer.js';
const sha=s=>createHash('sha256').update(s).digest('hex');
test('preview stages private source, rechecks approval, and removes staged media',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'master-render-'));
 try{const bytes=Buffer.from('original'),sourcePath=join(dir,'source'),id=sha(bytes);writeFileSync(sourcePath,bytes);
  const workRoot=join(dir,'work'),composition={schema:'sues-remotion-layers/v1',sourceSha256:id,planFingerprint:'b'.repeat(64),canvas:{width:1080,height:1920},fps:30,durationFrames:30,layers:[],source:{assetId:id,spans:[]}};
  const args={composition,project:{sourcePath,boundHashes:{source:id},fontDirectory:dir,fontHashes:{}},assets:{},workRoot,entryFile:'/tmp/src/index.ts',remotionCli:'/tmp/remotion.js',browserExecutable:'/tmp/chrome',approvalCheck:async()=>true,
   runner:async(_cmd,argv)=>{assert.ok(argv.includes('--bundle-cache=false'));assert.ok(argv.includes('--offthreadvideo-cache-size-in-bytes=67108864'));assert.ok(argv.includes('--offthreadvideo-video-threads=1'));writeFileSync(argv[4],'private-preview');return {stdout:''}}};
  const cache=join(dir,'node_modules','.cache','webpack');mkdirSync(cache,{recursive:true});writeFileSync(join(cache,'keep'),'untouched');
  const blocked=await renderMasterDirectorPreview({...args,entryFile:join(dir,'src','index.ts')});assert.equal(blocked.issues[0].code,'PREVIEW_RUNTIME_CACHE_UNSAFE');assert.equal(readFileSync(join(cache,'keep'),'utf8'),'untouched');rmSync(join(dir,'node_modules'),{recursive:true});
  const denied=await renderMasterDirectorPreview({...args,memoryCheck:()=>false});assert.equal(denied.issues[0].code,'PREVIEW_MEMORY_LIMIT');assert.equal(existsSync(workRoot),false);
  const result=await renderMasterDirectorPreview(args);assert.equal(result.status,'PREVIEW_RENDERED_UNVERIFIED');
  assert.equal(result.record.final,false);assert.equal(readFileSync(result.outputPath,'utf8'),'private-preview');assert.equal(existsSync(join(result.outputPath,'..','public')),false);
  let checks=0;const failed=await renderMasterDirectorPreview({...args,approvalCheck:async()=>++checks<3});
  assert.equal(failed.status,'BLOCKED');assert.equal(failed.issues[0].code,'APPROVAL_OR_SOURCE_CHANGED_DURING_RENDER');assert.equal(readdirSync(workRoot).length,1);
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('memory guard stops a running render and cleans its staged files',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'master-memory-'));
 try{const bytes=Buffer.from('source'),sourcePath=join(dir,'source'),id=sha(bytes);writeFileSync(sourcePath,bytes);mkdirSync(join(dir,'src'));writeFileSync(join(dir,'src','index.ts'),'');const cli=join(dir,'cli.cjs');writeFileSync(cli,'setInterval(()=>{},1000)');
  const composition={schema:'sues-remotion-layers/v1',sourceSha256:id,planFingerprint:'b'.repeat(64),canvas:{width:1080,height:1920},fps:30,durationFrames:30,layers:[],source:{assetId:id,spans:[]}};
  let checks=0;const result=await renderMasterDirectorPreview({composition,project:{sourcePath,boundHashes:{source:id},fontDirectory:dir,fontHashes:{}},assets:{},workRoot:join(dir,'work'),entryFile:join(dir,'src','index.ts'),remotionCli:cli,browserExecutable:'/tmp/chrome',approvalCheck:async()=>true,memoryCheck:()=>++checks<2});
  assert.equal(result.status,'BLOCKED');assert.equal(result.issues[0].code,'PREVIEW_MEMORY_LIMIT');assert.deepEqual(readdirSync(join(dir,'work')),[]);
 }finally{rmSync(dir,{recursive:true,force:true});}
});


test('missing browser libraries are reported by category without exposing stderr',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'master-browser-diagnostic-'));
 try{
  const bytes=Buffer.from('source'),sourcePath=join(dir,'source'),id=sha(bytes);writeFileSync(sourcePath,bytes);
  mkdirSync(join(dir,'src'));
  const entry=join(dir,'src','index.ts');writeFileSync(entry,'');
  const cli=join(dir,'missing-lib.cjs');writeFileSync(cli,"console.error('chrome: error while loading shared libraries: libexample.so: cannot open shared object file');process.exit(1)");
  const composition={schema:'sues-remotion-layers/v1',sourceSha256:id,planFingerprint:'b'.repeat(64),canvas:{width:1080,height:1920},fps:30,durationFrames:30,layers:[],source:{assetId:id,spans:[]}};
  const result=await renderMasterDirectorPreview({composition,project:{sourcePath,boundHashes:{source:id},fontDirectory:dir,fontHashes:{}},assets:{},workRoot:join(dir,'work'),entryFile:entry,remotionCli:cli,browserExecutable:'/tmp/chrome',approvalCheck:async()=>true,memoryCheck:()=>true});
  assert.equal(result.status,'BLOCKED');assert.equal(result.issues[0].code,'PREVIEW_RENDER_FAILED');
  assert.equal(result.issues[0].reason,'BROWSER_LIBRARY_UNAVAILABLE');
  assert.ok(!JSON.stringify(result).includes('libexample.so'));
 }finally{rmSync(dir,{recursive:true,force:true});}
});
