import test from 'node:test';
import assert from 'node:assert/strict';
import {compileMasterDirectorRemotion} from '../src/master-director-remotion-compiler.js';
const graph=()=>({schema:'sues-layer-graph/v1',sourceSha256:'a'.repeat(64),planFingerprint:'b'.repeat(64),canvas:{width:1080,height:1920},fps:30,durationFrames:90,nodes:[{id:'text-1',renderer:'remotion',track:'graphics',effect:'text',startFrame:3,endFrame:60,visual:{rect:{x:12,y:45,width:300,height:120},zIndex:4,opacity:0.8,typography:{family:'Montserrat',sizePx:80,weight:700,color:'#ffffff'},keyframes:[{atFrame:0,x:0,easing:'linear'},{atFrame:20,x:30,easing:'linear'}]},sourceParameters:{text:'Hola',visual:{}}}]});
test('preserves spatial and temporal attributes for supported text',()=>{
 const g=graph();g.nodes[0].sourceParameters.visual=structuredClone(g.nodes[0].visual);const r=compileMasterDirectorRemotion(g,{verifiedFonts:{'Montserrat:700':{sha256:'e'.repeat(64)}}});
 assert.equal(r.status,'READY_FOR_REMOTION_STAGING');assert.equal(r.composition.layers[0].startFrame,3);
 assert.deepEqual(r.composition.layers[0].visual,g.nodes[0].visual);assert.equal(r.composition.layers[0].text,'Hola');
});
test('refuses masks, unsupported effects, unverified fonts and spring easing rather than flattening them',()=>{
 for(const mutate of [g=>g.nodes[0].visual.mask={proofId:'test'},g=>g.nodes[0].effect='subject-occlusion',g=>g.nodes[0].visual.typography.family='missing',g=>g.nodes[0].visual.keyframes[0].easing='spring',g=>g.nodes[0].sourceParameters.shadow=true]){
  const g=graph();g.nodes[0].sourceParameters.visual=structuredClone(g.nodes[0].visual);mutate(g);const r=compileMasterDirectorRemotion(g,{verifiedFonts:{'Montserrat:700':{sha256:'e'.repeat(64)}}});
  assert.equal(r.status,'BLOCKED');assert.equal(r.composition,null);assert.ok(r.issues.length);
 }
});
test('still image compilation requires a verified, matching library asset and explicit fit',()=>{
 const g=graph(),id='c'.repeat(64);g.nodes[0]={id:'image',renderer:'remotion',track:'graphics',effect:'image-exact',startFrame:1,endFrame:30,
  resource:{id,sha256:id},visual:{rect:{x:10,y:20,width:300,height:500},zIndex:1,opacity:1,keyframes:[]}};
 g.nodes[0].sourceParameters={fit:'fill',visual:structuredClone(g.nodes[0].visual)};
 assert.equal(compileMasterDirectorRemotion(g).status,'BLOCKED');
 const registry={[id]:{sha256:id,kind:'image',rightsVerified:true,commercialUseAllowed:true}};
 const r=compileMasterDirectorRemotion(g,{verifiedAssets:registry});assert.equal(r.status,'READY_FOR_REMOTION_STAGING');
 assert.equal(r.composition.layers[0].assetId,id);assert.equal(r.composition.layers[0].kind,'image');
 registry[id].sha256='d'.repeat(64);assert.equal(compileMasterDirectorRemotion(g,{verifiedAssets:registry}).status,'BLOCKED');
});
test('static alpha mask needs source-bound evidence covering the exact interval',()=>{
 const g=graph(),id='c'.repeat(64);g.nodes[0].visual.mask={proofId:'mask01',mode:'alpha-keep'};
 g.nodes[0].sourceParameters.visual=structuredClone(g.nodes[0].visual);
 const options={verifiedFonts:{'Montserrat:700':{sha256:'e'.repeat(64)}},verifiedAssets:{[id]:{sha256:id,kind:'image',rightsVerified:true,commercialUseAllowed:true}},verifiedMasks:{mask01:{verified:true,assetId:id,sourceSha256:g.sourceSha256,start:0,end:3}}};
 const r=compileMasterDirectorRemotion(g,options);assert.equal(r.status,'READY_FOR_REMOTION_STAGING');assert.equal(r.composition.layers[0].maskAssetId,id);
 options.verifiedMasks.mask01.sourceSha256='f'.repeat(64);assert.equal(compileMasterDirectorRemotion(g,options).issues[0].code,'MASK_EVIDENCE_UNVERIFIED');
 options.verifiedMasks.mask01.sourceSha256=g.sourceSha256;options.verifiedMasks.mask01.end=1;
 assert.equal(compileMasterDirectorRemotion(g,options).status,'BLOCKED');
});
test('audio clips preserve precise frame bounds, gain and verified source in-point',()=>{
 const g=graph(),id='d'.repeat(64);g.nodes=[{id:'music-1',renderer:'remotion',track:'music',effect:'audio-clip-exact',startFrame:10,endFrame:40,resource:{id,sha256:id},visual:null,sourceParameters:{gain:.2,sourceInFrame:15}}];
 const registry={[id]:{sha256:id,kind:'audio',duration:10,rightsVerified:true,commercialUseAllowed:true}};
 const r=compileMasterDirectorRemotion(g,{verifiedAssets:registry});assert.equal(r.status,'READY_FOR_REMOTION_STAGING');
 assert.deepEqual(r.composition.layers[0],{id:'music-1',kind:'audio',assetId:id,startFrame:10,endFrame:40,sourceInFrame:15,gain:.2});
 registry[id].duration=1;assert.equal(compileMasterDirectorRemotion(g,{verifiedAssets:registry}).status,'BLOCKED');
});
test('video clip requires exact in-point, a verified duration and explicit silent handling',()=>{
 const g=graph(),id='9'.repeat(64);g.nodes[0]={id:'broll',renderer:'remotion',track:'broll',effect:'video-exact',startFrame:3,endFrame:33,resource:{id,sha256:id},visual:{rect:{x:0,y:0,width:1080,height:1920},zIndex:1,opacity:1,keyframes:[]}};
 g.nodes[0].sourceParameters={fit:'fill',visual:structuredClone(g.nodes[0].visual),sourceInFrame:15,muted:true};
 const registry={[id]:{sha256:id,kind:'video',duration:4,rightsVerified:true,commercialUseAllowed:true}};
 const r=compileMasterDirectorRemotion(g,{verifiedAssets:registry});assert.equal(r.status,'READY_FOR_REMOTION_STAGING');assert.equal(r.composition.layers[0].sourceInFrame,15);assert.equal(r.composition.layers[0].muted,true);
 g.nodes[0].sourceParameters.muted=false;assert.equal(compileMasterDirectorRemotion(g,{verifiedAssets:registry}).status,'BLOCKED');
});

test('preserves explicitly supported easing curves in approved layers',()=>{
 for(const easing of ['linear','ease-in','ease-out','ease-in-out']){
  const g=graph();g.nodes[0].visual.keyframes[1].easing=easing;g.nodes[0].sourceParameters.visual=structuredClone(g.nodes[0].visual);
  const r=compileMasterDirectorRemotion(g,{verifiedFonts:{'Montserrat:700':{sha256:'e'.repeat(64)}}});
  assert.equal(r.status,'READY_FOR_REMOTION_STAGING');assert.equal(r.composition.layers[0].visual.keyframes[1].easing,easing);
 }
});

test('blocks spring even when graph and source parameters agree',()=>{
 const g=graph();g.nodes[0].visual.keyframes[1].easing='spring';g.nodes[0].sourceParameters.visual=structuredClone(g.nodes[0].visual);
 const r=compileMasterDirectorRemotion(g,{verifiedFonts:{'Montserrat:700':{sha256:'e'.repeat(64)}}});
 assert.equal(r.status,'BLOCKED');assert.equal(r.composition,null);assert.ok(r.issues.some(i=>i.code==='ANIMATION_UNSUPPORTED'));
});


test('dynamic alpha mask requires one verified asset per frame and exact source timing',()=>{
 const g=graph(),ids=['c','d','f'].map(c=>c.repeat(64));g.nodes[0].startFrame=3;g.nodes[0].endFrame=6;
 g.nodes[0].visual.keyframes=[{atFrame:0,opacity:0},{atFrame:2,opacity:1}];
 g.nodes[0].visual.mask={proofId:'moving-mask',mode:'alpha-keep'};g.nodes[0].sourceParameters.visual=structuredClone(g.nodes[0].visual);
 const proof={verified:true,sourceSha256:g.sourceSha256,start:0.1,end:0.2,startFrame:3,endFrame:6,fps:30,coordinateSpace:'layer',frameAssetIds:ids};
 const options={verifiedFonts:{'Montserrat:700':{sha256:'e'.repeat(64)}},verifiedAssets:Object.fromEntries(ids.map(id=>[id,{sha256:id,kind:'image',rightsVerified:true,commercialUseAllowed:true}])),verifiedMasks:{'moving-mask':proof}};
 let result=compileMasterDirectorRemotion(g,options);assert.equal(result.status,'READY_FOR_REMOTION_STAGING');assert.deepEqual(result.composition.layers[0].maskFrameAssetIds,ids);
 proof.frameAssetIds=ids.slice(0,2);assert.equal(compileMasterDirectorRemotion(g,options).status,'BLOCKED');
 proof.frameAssetIds=ids;proof.assetId=ids[0];assert.equal(compileMasterDirectorRemotion(g,options).status,'BLOCKED');
 delete proof.assetId;proof.sourceSha256='0'.repeat(64);assert.equal(compileMasterDirectorRemotion(g,options).status,'BLOCKED');
 proof.sourceSha256=g.sourceSha256;options.verifiedAssets[ids[1]].rightsVerified=false;assert.equal(compileMasterDirectorRemotion(g,options).status,'BLOCKED');
});


test('static drop shadows preserve exact values and reject unsupported combinations',()=>{
 const options={verifiedFonts:{'Montserrat:700':{sha256:'e'.repeat(64)}}},g=graph();
 g.nodes[0].visual.dropShadow={color:'#ff8800aa',offsetX:12,offsetY:-8,blurPx:20};
 g.nodes[0].sourceParameters.visual=structuredClone(g.nodes[0].visual);
 const result=compileMasterDirectorRemotion(g,options);assert.equal(result.status,'READY_FOR_REMOTION_STAGING');assert.deepEqual(result.composition.layers[0].visual.dropShadow,g.nodes[0].visual.dropShadow);
 for(const invalid of [{...g.nodes[0].visual.dropShadow,blurPx:-1},{...g.nodes[0].visual.dropShadow,color:'red'},{...g.nodes[0].visual.dropShadow,offsetX:501},{...g.nodes[0].visual.dropShadow,spread:2}]){
  const candidate=structuredClone(g);candidate.nodes[0].visual.dropShadow=invalid;candidate.nodes[0].sourceParameters.visual=structuredClone(candidate.nodes[0].visual);
  assert.equal(compileMasterDirectorRemotion(candidate,options).status,'BLOCKED');
 }
 const masked=structuredClone(g);masked.nodes[0].visual.mask={proofId:'proof',mode:'alpha-keep'};masked.nodes[0].sourceParameters.visual=structuredClone(masked.nodes[0].visual);
 assert.equal(compileMasterDirectorRemotion(masked,options).status,'BLOCKED');
});


test('static glow is bounded and rejects shadows and unverified masks',()=>{
 const options={verifiedFonts:{'Montserrat:700':{sha256:'e'.repeat(64)}}},g=graph();
 g.nodes[0].visual.glow={color:'#ff9900aa',radiusPx:24};g.nodes[0].sourceParameters.visual=structuredClone(g.nodes[0].visual);
 const result=compileMasterDirectorRemotion(g,options);assert.equal(result.status,'READY_FOR_REMOTION_STAGING');assert.deepEqual(result.composition.layers[0].visual.glow,g.nodes[0].visual.glow);
 for(const bad of [{color:'#ff0000',radiusPx:0},{color:'#ff0000',radiusPx:201},{color:'red',radiusPx:4},{color:'#ff0000',radiusPx:4,intensity:2}]){
  const candidate=structuredClone(g);candidate.nodes[0].visual.glow=bad;candidate.nodes[0].sourceParameters.visual=structuredClone(candidate.nodes[0].visual);assert.equal(compileMasterDirectorRemotion(candidate,options).status,'BLOCKED');
 }
 for(const extra of [{mask:{proofId:'p1',mode:'alpha-keep'}},{dropShadow:{color:'#000000',offsetX:0,offsetY:1,blurPx:2}}]){
  const candidate=structuredClone(g);Object.assign(candidate.nodes[0].visual,extra);candidate.nodes[0].sourceParameters.visual=structuredClone(candidate.nodes[0].visual);assert.equal(compileMasterDirectorRemotion(candidate,options).status,'BLOCKED');
 }
});


test('verified static or frame-by-frame masks preserve one static finish',()=>{
 for(const dynamic of [false,true])for(const finish of [{dropShadow:{color:'#0000ff',offsetX:12,offsetY:3,blurPx:4}},{glow:{color:'#ffffff',radiusPx:8}}]){
  const g=graph(),id='c'.repeat(64);g.nodes[0].startFrame=3;g.nodes[0].endFrame=6;
  g.nodes[0].visual.keyframes=[{atFrame:0,opacity:0},{atFrame:2,opacity:1}];
  Object.assign(g.nodes[0].visual,{mask:{proofId:'proof',mode:'alpha-keep'}},finish);g.nodes[0].sourceParameters.visual=structuredClone(g.nodes[0].visual);
  const proof={verified:true,sourceSha256:g.sourceSha256,start:0.1,end:0.2,...(dynamic?{startFrame:3,endFrame:6,fps:30,coordinateSpace:'layer',frameAssetIds:[id,id,id]}:{assetId:id})};
  const options={verifiedFonts:{'Montserrat:700':{sha256:'e'.repeat(64)}},verifiedAssets:{[id]:{sha256:id,kind:'image',rightsVerified:true,commercialUseAllowed:true}},verifiedMasks:{proof}};
  const result=compileMasterDirectorRemotion(g,options);assert.equal(result.status,'READY_FOR_REMOTION_STAGING');assert.deepEqual(result.composition.layers[0].visual,g.nodes[0].visual);
  assert.deepEqual(dynamic?result.composition.layers[0].maskFrameAssetIds:result.composition.layers[0].maskAssetId,dynamic?[id,id,id]:id);
  proof.verified=false;assert.equal(compileMasterDirectorRemotion(g,options).status,'BLOCKED');
 }
});


test('image and video preserve only explicit centered fit modes and reject all other values',()=>{
 const id='c'.repeat(64);for(const kind of ['image','video'])for(const fit of ['fill','contain','cover']){
  const g=graph();g.nodes[0]={id:'asset',renderer:'remotion',track:'graphics',effect:kind+'-exact',startFrame:1,endFrame:30,resource:{id,sha256:id},visual:{rect:{x:10,y:20,width:300,height:500},zIndex:1,opacity:1,keyframes:[]}};
  g.nodes[0].sourceParameters={fit,visual:structuredClone(g.nodes[0].visual),...(kind==='video'?{sourceInFrame:2,muted:true}:{})};
  const options={verifiedAssets:{[id]:{sha256:id,kind,duration:3,rightsVerified:true,commercialUseAllowed:true}}};
  const r=compileMasterDirectorRemotion(g,options);assert.equal(r.status,'READY_FOR_REMOTION_STAGING');assert.equal(r.composition.layers[0].fit,fit);
  g.nodes[0].sourceParameters.fit='none';assert.equal(compileMasterDirectorRemotion(g,options).status,'BLOCKED');
 }
});
test('animation keyframes are finite, strictly ordered and limited to the layer lifespan',()=>{
 const options={verifiedFonts:{'Montserrat:700':{sha256:'e'.repeat(64)}}};
 const make=()=>{const g=graph();g.nodes[0].sourceParameters.visual=structuredClone(g.nodes[0].visual);return g;};
 const invalid=[
  [{atFrame:0,opacity:0},{atFrame:0,opacity:1}],
  [{atFrame:20,opacity:1},{atFrame:0,opacity:0}],
  [{atFrame:-1,opacity:1}],
  [{atFrame:57,opacity:1}], // layer [3,60) is 57 local frames
  [{atFrame:2.5,opacity:1}],
  [{atFrame:2,opacity:1.5}],
  [{atFrame:2,opacity:-.1}],
  [{atFrame:2,scale:9}],
  [{atFrame:2,scale:-1}],
  [{atFrame:2,x:Infinity}],
  [{atFrame:2,y:NaN}],
  [{atFrame:2,x:10001}],
  [{atFrame:2,rotation:-10001}],
  [{atFrame:2,easing:'linear'}],
 ];
 for(const keys of invalid){
  const g=make();g.nodes[0].visual.keyframes=keys;g.nodes[0].sourceParameters.visual=structuredClone(g.nodes[0].visual);
  const r=compileMasterDirectorRemotion(g,options);
  assert.equal(r.status,'BLOCKED',JSON.stringify(keys));
  assert.ok(r.issues.some(i=>i.code==='ANIMATION_UNSUPPORTED'),JSON.stringify(keys));
 }
 const valid=make();
 valid.nodes[0].visual.keyframes=[{atFrame:0,x:-200,opacity:0},{atFrame:20,x:0,opacity:1,easing:'ease-out'},{atFrame:56,rotation:20}];
 valid.nodes[0].sourceParameters.visual=structuredClone(valid.nodes[0].visual);
 assert.equal(compileMasterDirectorRemotion(valid,options).status,'READY_FOR_REMOTION_STAGING');
});
