import test from 'node:test';import assert from 'node:assert/strict';
import {stageNativeB02Foreground} from '../../src/engine-next/native-b02-foreground.js';
const fixture=()=>({name:'SUES B02 Native Export QA ONLY',revision:3,width:1080,height:1920,fps:30,
 tracks:['V4','V3','V2','V1'].map(id=>({id,kind:'video'})),media:[{id:'m_sues_hyperframes_gold_3d_alpha_proof',duration:1.2,src:'/media/sues-hyperframes-gold-3d-alpha.webm'}],clips:[
 {id:'sues_b02_child_review_only',track:'V2',start:9.5,duration:4},
 {id:'sues_b02_temporal_luma_qa',track:'V4',start:9.5,duration:4,mediaId:'m_sues_b02_modnet_luma_qa'},
 {id:'sues_b02_carlos_foreground_luma_qa',track:'V3',start:9.5,duration:4,props:{matte:'luma',matteTrack:'V4'}},
 {id:'sues_hyperframes_gold_3d_review_only',track:'V4',kind:'video',start:4,duration:1.2,disabled:true,props:{opacity:1}}
 ]});
test('uses independent V5 foreground leaving V4 temporal matte intact',()=>{
 const p=fixture(),n=stageNativeB02Foreground(p,{expectedRevision:3});assert.equal(p.tracks.length,4);assert.equal(n.tracks[0].id,'V5');assert.equal(n.clips.at(-1).track,'V5');assert.equal(n.clips.at(-1).start,10.6);assert.equal(n.clips.at(-1).disabled,undefined);
 assert.equal(n.clips.at(-2).props.matteTrack,'V4');assert.equal(n.clips[1].track,'V4');
});
test('refuses production, bad revision, missing matte, duplicate V5 or altered alpha source',()=>{
 const examples=[{...fixture(),name:'PRODUCTION'}, {...fixture(),revision:5},{...fixture(),tracks:[...fixture().tracks,{id:'V5',kind:'video'}]}, {...fixture(),media:[]}, {...fixture(),clips:fixture().clips.map(c=>c.id==='sues_b02_temporal_luma_qa'?{...c,disabled:true}:c)}];
 for(const p of examples)assert.throws(()=>stageNativeB02Foreground(p,{expectedRevision:3}));
});
