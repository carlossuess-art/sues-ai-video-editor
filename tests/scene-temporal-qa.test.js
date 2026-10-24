import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,symlinkSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {parseTemporalFFmpeg,selectCutSafeRange,loadTemporalAudit} from '../src/scene-temporal-qa.js';
import {proposeLibraryCues} from '../src/director-library-cues.js';
const id='a'.repeat(64);
const example={assetId:id,sha256:id,scope:'ffmpeg-full-duration-technical',complete:true,durationSec:6.4,videoFrames:192,
 sceneCutTimes:[2.6],blackIntervals:[[3.7,4.4]],freezeIntervals:[]};
test('FFmpeg full-timeline metadata parser extracts real cut and black/freeze windows',()=>{
 const log='[Parsed_showinfo_2 @ ...] n:0 pts:100 pts_time:2.600 pos:304 iskey:1\n'+
  '[Parsed_showinfo_2 @ ...] n:1 pts:101 pts_time:2.650 pos:340 iskey:0\n'+
  '[blackdetect @ ...] black_start:3.7 black_end:4.4 black_duration:0.7\n'+
  '[freezedetect @ ...] lavfi.freezedetect.freeze_start: 5.0\n'+
  '[freezedetect @ ...] lavfi.freezedetect.freeze_end: 5.8';
 assert.deepEqual(parseTemporalFFmpeg(log,6.4),{sceneCutTimes:[2.6],blackIntervals:[[3.7,4.4]],freezeIntervals:[[5,5.8]]});
});
test('continuity-aware range excludes cuts and black intervals and abstains if not enough seconds',()=>{
 assert.deepEqual(selectCutSafeRange(example,1.8),{startSec:.34,endSec:2.14,source:'full-timeline-cut-black-analysis',appliedToVideo:false});
 assert.equal(selectCutSafeRange(example,3.5),null);
 assert.ok(selectCutSafeRange({durationSec:6.4,sceneCutTimes:[],blackIntervals:[]},5.94));
 assert.equal(selectCutSafeRange({durationSec:3,sceneCutTimes:[],blackIntervals:[]},3.4),null);
 assert.equal(selectCutSafeRange({...example,blackIntervals:[[2,NaN]]},1),null);
});
const create=()=>{
 const root=mkdtempSync(join(tmpdir(),'sues-audit-')),l=join(root,'library'),a=join(root,'assets','metadata-v2');mkdirSync(l);mkdirSync(a,{recursive:true});
 writeFileSync(join(l,'official-library-v1.json'),JSON.stringify({runtimeItems:[{id,kind:'video',titleEs:'Cadena bajo agua',storedInEditor:true}]}));
 writeFileSync(join(l,'purchased-source-index-309-v1.json'),JSON.stringify({items:[]}));
 writeFileSync(join(l,'asset-visual-review-v1.json'),JSON.stringify({schema:'sues-asset-visual-review/v1',items:[
  {assetId:id,scope:'sampled-frames-only',sampleSeconds:[0,1,2,3],sceneTags:['industrial-chain-in-water'],riskFlags:[]}
 ]}));
 writeFileSync(join(a,id+'.json'),JSON.stringify({assetId:id,sha256:id,kind:'video',technical:{durationSec:6.4,width:1080,height:1920},
  license:{rightsStatus:'verified',commercialUseAllowed:true},semantics:{profileCompatibility:['DOPAMIN'],narrativeRoles:['opresión']}}));
 return {root,l};
};
const transcript=text=>({version:'1.0',language:'es',sourceDuration:28,words:text.split(' ').map((w,i)=>({text:w,start:2+i*.45,end:2+(i+1)*.45}))});
test('audited B-roll gets a proposed safe internal source range but stays human-reviewed',()=>{
 const {root,l}=create();
 try{
  writeFileSync(join(l,'asset-temporal-audit-v1.json'),JSON.stringify({schema:'sues-broll-temporal-audit/v1',entries:[example]}));
  const r=proposeLibraryCues(root,transcript('Estoy muy agobiado y con presion hoy.'));
  const x=r.cues.find(y=>y.decision==='contextual-review-only').candidates[0];
  assert.equal(x.assetId,id);
  assert.equal(x.evidence.temporalReview.complete,true);
  assert.equal(x.evidence.temporalReview.sceneCutCount,1);
  assert.ok(x.evidence.suggestedSourceRange);
  assert.ok(x.evidence.suggestedSourceRange.endSec<=2.48);
  assert.equal(x.evidence.suggestedSourceRange.appliedToVideo,false);
  assert.equal(x.needsHumanReview,true);
  assert.equal(x.evidence.visualContentVerified,false);
  assert.equal(r.approvedToAutoPublish,false);
  assert.ok(!JSON.stringify(r).includes('/tmp/'));
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('full audit with insufficient clean span safely abstains; missing manifest falls back to manual review',()=>{
 const {root,l}=create();
 try{
  const t=transcript('Muy agobiado con la tension estos meses.');
  let r=proposeLibraryCues(root,t);
  assert.ok(r.cues.some(x=>x.decision==='contextual-review-only'));
  writeFileSync(join(l,'asset-temporal-audit-v1.json'),JSON.stringify({schema:'sues-broll-temporal-audit/v1',
   entries:[{...example,sceneCutTimes:[1.2,2.4,3.6,4.8],blackIntervals:[]}]}));
  r=proposeLibraryCues(root,t);
  assert.equal(r.cues.filter(x=>x.decision==='contextual-review-only').length,0);
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('invalid private audit, duplicate hashes, symlink, or unexpected public extension are rejected',()=>{
 const {root,l}=create(),p=join(l,'asset-temporal-audit-v1.json');
 try{
  const outside=join(root,'external.json');writeFileSync(outside,'{}');symlinkSync(outside,p);
  assert.throws(()=>loadTemporalAudit(root),/Unsafe/);rmSync(p);
  writeFileSync(p,JSON.stringify({schema:'sues-broll-temporal-audit/v1',entries:[example,example]}));
  assert.throws(()=>loadTemporalAudit(root),/Invalid/);
  writeFileSync(p,JSON.stringify({schema:'sues-broll-temporal-audit/v1',entries:[{...example,blackIntervals:[[5,7]]}]}));
  assert.throws(()=>loadTemporalAudit(root),/Invalid/);
  writeFileSync(p,JSON.stringify({schema:'sues-broll-temporal-audit/v1',entries:[{...example,secret:'https://private.invalid'}]}));
  const m=loadTemporalAudit(root);assert.equal(m.size,1);
  assert.ok(!JSON.stringify([...m]).includes('private.invalid'));
 }finally{rmSync(root,{recursive:true,force:true});}
});
