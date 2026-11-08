import test from 'node:test';import assert from 'node:assert/strict';
import {stageNativeB02ChildAlpha} from '../../src/engine-next/native-b02-child-alpha.js';
const sha='a'.repeat(64);
const params={expectedRevision:4,alphaSrc:'/media/sues-b02-child-group-alpha-candidate.png',alphaBytes:892334,sourceSha256:sha,alphaSha256:sha};
const fixture=()=>({name:'SUES B02 Children Alpha Cutout QA ONLY',width:1080,height:1920,fps:30,revision:4,
 media:[{id:'m_sues_158404_child',kind:'image',src:'/media/sues-158404-child.jpg'}],
 clips:[{id:'sues_b02_child_review_only',kind:'image',track:'V2',mediaId:'m_sues_158404_child',start:9.5,duration:4,props:{masks:[{shape:'rect',feather:240}]}},
 {id:'sues_b02_carlos_foreground_luma_qa',track:'V3',props:{matte:'luma',matteTrack:'V4'}},{id:'sues_b02_temporal_luma_qa',track:'V4'},
 {id:'sues_hyperframes_gold_3d_review_only',track:'V5'}]});
test('stages a separate transparent child image without modifying original photo or matte',()=>{
 const original=fixture(),p=stageNativeB02ChildAlpha(original,params);
 assert.equal(original.media.length,1);assert.equal(p.media.length,2);assert.equal(p.media[0].src,'/media/sues-158404-child.jpg');
 assert.equal(p.clips[0].mediaId,'m_sues_child_group_modnet_alpha_qa');assert.equal(p.clips[0].props.masks,undefined);
 assert.equal(p.clips[1].props.matteTrack,'V4');assert.equal(p.clips[3].track,'V5');
});
test('rejects prod, wrong revision, wrong image, missing provenance and duplicate cutout',()=>{
 for(const p of [{...fixture(),name:'SUES production'},{...fixture(),revision:6},
  {...fixture(),media:[]},{...fixture(),clips:fixture().clips.filter(x=>x.id!=='sues_b02_carlos_foreground_luma_qa')}])assert.throws(()=>stageNativeB02ChildAlpha(p,params));
 assert.throws(()=>stageNativeB02ChildAlpha(fixture(),{...params,alphaSrc:'/media/another.png'}));
 assert.throws(()=>stageNativeB02ChildAlpha(fixture(),{...params,alphaSha256:'wrong'}));
});
