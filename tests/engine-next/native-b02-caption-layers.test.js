import test from 'node:test';import assert from 'node:assert/strict';
import {compileVerifiedWordCaptions} from '../../src/engine-next/progressive-captions.js';
import {stageNativeB02WordReview} from '../../src/engine-next/native-b02-caption-layers.js';
const sha='9e06f49c30731d8a57aed312cfb46281bcffb7b3d5d62bf5a2164333944ccaad',fingerprint='c'.repeat(64);
function fixture(){return {name:'SUES B02 SYNTHETIC CAPTIONS QA ONLY',revision:7,width:1080,height:1920,fps:30,
 media:[{id:'m_sues_158404_video',src:'/media/sues-158404-original.mp4'}],tracks:['V5','V4','V3','V2','V1','A1'].map(id=>({id,kind:id==='A1'?'audio':'video'})),
 clips:[{id:'sues_video_source',mediaId:'m_sues_158404_video',kind:'video',track:'V1',start:0,duration:73.7667,locked:true},
 {id:'sues_b02_child_review_only',track:'V2',kind:'image',start:9.5,duration:4},
 {id:'sues_b02_carlos_foreground_luma_qa',track:'V3',kind:'video',props:{matteTrack:'V4'}},
 {id:'sues_hyperframes_gold_3d_review_only',track:'V5',kind:'video'}]};}
function proof(){return compileVerifiedWordCaptions({words:[{text:'PRUEBA',start:10,end:10.27},{text:'DE',start:10.4,end:10.63},{text:'CAPAS',start:10.8,end:11.15}],sourceSha256:sha,timelineFingerprint:fingerprint,humanReviewed:true,reviewIssues:[],timelineProven:true,geometryVerified:true,anchorX:0,anchorY:350,track:'V6'});}
const opts={expectedRevision:7,sourceSha256:sha,timelineFingerprint:fingerprint,syntheticOnly:true};
test('creates V6 for disabled frame-exact word progression and preserves original 5 visual tracks',()=>{
 const p=fixture(),out=stageNativeB02WordReview(p,{...opts,compiled:proof()});
 assert.equal(out.project.clips.length,p.clips.length+3);assert.equal(out.project.tracks[0].id,'V6');assert.equal(p.tracks[0].id,'V5');
 assert.ok(out.project.clips.slice(-3).every(x=>x.disabled&&x.track==='V6'&&x.name.includes('SYNTHETIC')));
 assert.deepEqual(out.project.clips.slice(-3).map(x=>x.props.text),['PRUEBA','PRUEBA DE','PRUEBA DE CAPAS']);
 assert.equal(out.manifest.cinematicQA,false);assert.equal(out.manifest.reviewStatus,'DISABLED_NOT_APPROVED');
});
test('rejects unreviewed transcription, fabricated fingerprint, malformed time, out-of-range words and duplicates',()=>{
 assert.throws(()=>stageNativeB02WordReview(fixture(),{...opts,timelineFingerprint:'bad',compiled:proof()}));
 assert.throws(()=>stageNativeB02WordReview(fixture(),{...opts,compiled:{...proof(),status:'BLOCKED'}}));
 assert.throws(()=>stageNativeB02WordReview({...fixture(),name:'PRODUCTION'},{...opts,compiled:proof()}));
 assert.throws(()=>stageNativeB02WordReview(fixture(),{...opts,compiled:{...proof(),clips:proof().clips.map((c,i)=>i===0?{...c,start:20}:c)}}));
 assert.throws(()=>stageNativeB02WordReview(fixture(),{...opts,compiled:{...proof(),clips:proof().clips.map((c,i)=>i===0?{...c,disabled:false}:c)}}));
 const p=fixture();p.tracks.unshift({id:'V6',kind:'video'});assert.throws(()=>stageNativeB02WordReview(p,{...opts,compiled:proof()}));
});
