import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {buildHyperFramesMotionHandoff,REQUIRED_SOURCE_FILES} from '../src/motion-templates/hyperframes-motion-handoff.js';
import {validateNativeProbe,validatePixelEvidence,validateSourceManifest,
 createVerifiedNativeProof} from '../scripts/motion-templates/verify-hyperframes-native-render.mjs';
const times=[0,.267,.467,.9,1.2,1.7,2.2,2.7,3.1,3.5,4.1,4.8];
const pixel=()=>({results:times.map(time=>({time,psnrDb:44,highDeltaFraction:.0001}))});
const expected={width:1080,height:1920,fps:30,frames:151,durationSec:151/30};
const validProbe=()=>({format:{duration:'5.033333',size:'378170'},streams:[{
 codec_type:'video',codec_name:'h264',pix_fmt:'yuv420p',profile:'High',
 width:1080,height:1920,r_frame_rate:'30/1',avg_frame_rate:'30/1',nb_frames:'151'
}]});
test('requires exact native export properties before a render proof can be issued',()=>{
 const v=validateNativeProbe(validProbe(),expected);
 assert.equal(v.frames,151);assert.equal(v.audioStreams,0);
 assert.throws(()=>validateNativeProbe({...validProbe(),streams:[{...validProbe().streams[0],width:540}]},expected),/dimensions/);
 assert.throws(()=>validateNativeProbe({...validProbe(),streams:[...validProbe().streams,{codec_type:'audio'}]},expected),/NO synthetic audio/);
 assert.throws(()=>validateNativeProbe({...validProbe(),streams:[{...validProbe().streams[0],nb_frames:'150'}]},expected),/frame count/);
 assert.throws(()=>validateNativeProbe({...validProbe(),streams:[{...validProbe().streams[0],r_frame_rate:'30000/1001'}]},expected),/frame rate/);
});
test('12 actual-frame photo metrics must be complete and reasonably consistent',()=>{
 assert.equal(validatePixelEvidence(pixel()).minPsnrDb,44);
 const skip=pixel();skip.results.pop();
 assert.throws(()=>validatePixelEvidence(skip),/all 12/);
 const low=pixel();low.results[3].psnrDb=5;
 assert.throws(()=>validatePixelEvidence(low),/divergence/);
 const wrong=pixel();wrong.results[8].time=9;
 assert.throws(()=>validatePixelEvidence(wrong),/timestamp/);
});
test('source hashes cannot change between composition and media proof',()=>{
 const root=mkdtempSync(join(tmpdir(),'sues-native-proof-source-'));let hashes={};
 try{
  for(const [i,path] of REQUIRED_SOURCE_FILES.entries()){
   const filename=join(root,path);mkdirSync(join(root,...path.split('/').slice(0,-1)),{recursive:true});
   writeFileSync(filename,'fixture source file '+i);
   const {createHash}=await import('node:crypto');
   hashes[path]=createHash('sha256').update(readFileSync(filename)).digest('hex');
  }
  const m=buildHyperFramesMotionHandoff({sourceHashes:hashes});
  m.validation='SOURCE_ONLY_NO_RENDER';
  assert.equal(validateSourceManifest(root,m).source.fingerprint,m.source.fingerprint);
  writeFileSync(join(root,'runtime/sequence-card-to-space.js'),'stale source');
  assert.throws(()=>validateSourceManifest(root,m),/Source changed/);
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('actual 1080p HyperFrames output can be bound to native receipts without authorising import', {
 skip:!process.env.SUES_HF_QA_ROOT
},()=>{
 const root=process.env.SUES_HF_QA_ROOT;
 const json=p=>JSON.parse(readFileSync(p,'utf8'));
 const x=createVerifiedNativeProof(root,json(process.env.SUES_HF_SOURCE_MANIFEST),
  process.env.SUES_HF_NATIVE_MP4,json(process.env.SUES_HF_PIXEL_REPORT),
  readFileSync(process.env.SUES_HF_NATIVE_STDERR,'utf8'),
  process.env.SUES_HF_RECEIPT_DEST);
 assert.equal(x.status,'TECHNICAL_RENDER_AND_FRAME_ALIGNMENT_VERIFIED');
 assert.equal(x.renderedFile.width,1080);
 assert.equal(x.renderedFile.height,1920);
 assert.equal(x.renderedFile.frames,151);
 assert.ok(x.frameConsistency.minPsnrDb>40);
 assert.equal(x.editorial.fablecutIngestStatus,'NOT_IMPORTED');
 assert.equal(x.productionChanged,false);
 assert.equal(x.publishAuthorized,false);
});
