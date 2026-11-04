import test from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';import {join} from 'node:path';import {tmpdir} from 'node:os';import {createHash} from 'node:crypto';
import {auditMasterDirectorMedia} from '../src/master-director-technical-audit.js';
test('technical audit binds decode to source and output without claiming creative QA',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'master-audit-'));
 try{const sourcePath=join(dir,'source'),outputPath=join(dir,'output');writeFileSync(sourcePath,'source');writeFileSync(outputPath,'output');
  const sourceSha256=createHash('sha256').update('source').digest('hex');let calls=0;
  const runner=async name=>{calls++;return {stdout:name==='ffprobe'?JSON.stringify({streams:[{codec_type:'video',codec_name:'h264',width:270,height:480,avg_frame_rate:'30/1'},{codec_type:'audio',codec_name:'aac'}],format:{duration:'1.0'}}):''}};
  const input={sourcePath,sourceSha256,outputPath,expected:{width:270,height:480,duration:1,fps:30},runner};
  const result=await auditMasterDirectorMedia(input);assert.equal(result.status,'TECHNICAL_PASS_HUMAN_QA_PENDING');assert.equal(result.fullDecode,true);assert.ok(result.notVerified.includes('audio-listening'));assert.equal(calls,2);
  writeFileSync(sourcePath,'changed');assert.equal((await auditMasterDirectorMedia(input)).issues[0].code,'SOURCE_CHANGED');
 }finally{rmSync(dir,{recursive:true,force:true});}
});
