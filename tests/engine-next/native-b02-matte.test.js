import test from 'node:test';import assert from 'node:assert/strict';
import {stageNativeB02Matte} from '../../src/engine-next/native-b02-matte.js';
function fixture(){return {name:'SUES 158404 · NATIVE LUMA MATTE PROOF · NOT APPROVED',revision:7,width:1080,height:1920,fps:30,
 tracks:[{id:'V1',kind:'video'},{id:'V2',kind:'video'},{id:'V3',kind:'video'},{id:'V4',kind:'video'}],
 media:[{id:'original',kind:'video'}],clips:[{id:'sues_audio_original',kind:'audio',track:'A1',start:0,duration:73.7667,props:{volume:1}}, {id:'sues_video_source',kind:'video',track:'V1',locked:true,start:0,duration:73.7667,in:0,mediaId:'original',props:{}},
 {id:'sues_b02_child_review_only',kind:'image',track:'V2',start:9.5,duration:4,disabled:true,props:{}},
 {id:'title',kind:'text',track:'V4',start:2.28,duration:.85,props:{}}]};}
const args={matteSrc:'/media/b02-alpha-luma.mp4',matteBytes:123456,expectedRevision:7};
test('builds three independently editable native tracks while preserving original',()=>{
 const x=fixture(),p=stageNativeB02Matte(x,args);assert.equal(x.clips.length,4);assert.equal(p.clips.length,6);
 assert.equal(p.clips[1].locked,true);assert.equal(p.clips[2].props.masks[0].feather,90);assert.equal(p.clips[0].props.volume,0.8);assert.equal(p.clips[1].props.volume,0);assert.equal(p.clips.at(-2).props.volume,0);assert.equal(p.clips.at(-2).props.matte,'luma');assert.equal(p.clips.at(-2).props.matteTrack,'V4');assert.equal(p.clips.at(-1).track,'V4');
});
test('blocks production, incorrect revision and overlapping active clips',()=>{
 for(const x of [{...fixture(),name:'SUES production'}, {...fixture(),revision:8}, {...fixture(),clips:[...fixture().clips,{id:'other',kind:'video',track:'V3',start:10,duration:2}]}])assert.throws(()=>stageNativeB02Matte(x,args));
});
test('prevents duplicated staging and disabled original source',()=>{
 const x=fixture();x.clips[1].locked=false;assert.throws(()=>stageNativeB02Matte(x,args));
 const y=stageNativeB02Matte(fixture(),args);assert.throws(()=>stageNativeB02Matte(y,args));
});
test('refuses a second active audio narration or an absent dedicated voice track',()=>{
 const p=fixture();p.clips.push({id:'other-narration',kind:'audio',track:'A1',start:10,duration:2,props:{volume:1}});assert.throws(()=>stageNativeB02Matte(p,args));
 const v=fixture();v.clips=v.clips.filter(c=>c.id!=='sues_audio_original');assert.throws(()=>stageNativeB02Matte(v,args));
});
