import test from 'node:test';import assert from 'node:assert/strict';
import {stageNativeB02EdgeRefinement} from '../../src/engine-next/native-b02-edge-refinement.js';
const sourceSha='a'.repeat(64),refinedSha='b'.repeat(64),params={expectedRevision:8,originalAlphaSha256:sourceSha,refinedSha256:refinedSha,refinedBytes:890000,strength:0.5};
const fixture=()=>({name:'SUES B02 Despill RGB Edge QA ONLY',revision:8,width:1080,height:1920,fps:30,
 media:[{id:'m_sues_child_group_modnet_alpha_qa',src:'/media/sues-b02-child-group-alpha-candidate.png',alphaSha256:sourceSha}],
 clips:[{id:'sues_b02_child_review_only',mediaId:'m_sues_child_group_modnet_alpha_qa',track:'V2',kind:'image',start:9.5,duration:4,props:{}},
 {id:'sues_b02_carlos_foreground_luma_qa',track:'V3',props:{matte:'luma',matteTrack:'V4'}},
 {id:'sues_b02_temporal_luma_qa',track:'V4'},
 {id:'sues_hyperframes_gold_3d_review_only',track:'V5'}]});
test('adds a new media reference without overwriting original alpha, V4 matte or V5 gold',()=>{
 const p=fixture(),q=stageNativeB02EdgeRefinement(p,params);
 assert.equal(p.clips[0].mediaId,'m_sues_child_group_modnet_alpha_qa');
 assert.equal(q.media.length,2);assert.equal(q.media[0].src,'/media/sues-b02-child-group-alpha-candidate.png');
 assert.equal(q.media[1].alphaByteExact,true);assert.equal(q.clips[0].mediaId,'m_sues_b02_child_refined50_qa');
 assert.equal(q.clips[1].props.matteTrack,'V4');assert.equal(q.clips[3].track,'V5');
});
test('refuses production, revision conflicts, forged alpha provenance, aggressive blend and duplicate staging',()=>{
 for(const p of [{...fixture(),name:'PROD'}, {...fixture(),revision:9},{...fixture(),media:[]},
   {...fixture(),clips:fixture().clips.filter(x=>x.id!=='sues_b02_temporal_luma_qa')}])assert.throws(()=>stageNativeB02EdgeRefinement(p,params));
 assert.throws(()=>stageNativeB02EdgeRefinement(fixture(),{...params,strength:0.85}));
 assert.throws(()=>stageNativeB02EdgeRefinement(fixture(),{...params,refinedSha256:sourceSha}));
 const staged=stageNativeB02EdgeRefinement(fixture(),params);assert.throws(()=>stageNativeB02EdgeRefinement(staged,params));
});
