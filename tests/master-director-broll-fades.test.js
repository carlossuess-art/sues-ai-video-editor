import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectBrollFadeLink} from '../src/master-director-broll-fades.js';
import {translateFilmDirectorBrief} from '../src/master-director-brief-translation.js';
import {auditMasterBriefCrosswalk} from '../src/master-director-brief-crosswalk.js';
const H='a'.repeat(64),O='b'.repeat(64),T='verified-timeline';
const source=`# Director\n> NO APROBADO / NO EJECUTAR ${O}\n### Escena 01 · ARRANQUE · 00:00–00:02\n- \`0–2 s\`: base **B01**; B-roll pantalla completa; texto editorial **HOY**; S en zona inferior.\n`;
const annex=translateFilmDirectorBrief({text:source,sourceSha256:H,originalSha256:O,timelineFingerprint:T,duration:2});
const fade={kind:'opacity-fade',edge:'in',durationFrames:8};
const visual={rect:{x:0,y:0,width:1080,height:1920},opacity:1,keyframes:[
 {atFrame:0,opacity:0,easing:'linear'},{atFrame:8,opacity:1,easing:'ease-out'},
 {atFrame:51,opacity:1,easing:'linear'},{atFrame:59,opacity:0,easing:'ease-in'}]};
const op={id:'broll1',sceneId:'scene-01',renderer:'remotion',track:'broll',effect:'video-exact',resourceRef:'B01',start:0,end:2,
 parameters:{visual}};
const inIntent=annex.operationIntents.find(x=>x.id.endsWith('-transition-in'));
const outIntent=annex.operationIntents.find(x=>x.id.endsWith('-transition-out'));
test('the original B-roll visual layer may prove *both* explicitly specified fades without a new fictional track',()=>{
 assert.equal(inspectBrollFadeLink(inIntent,op,{transition:fade},annex),null);
 assert.equal(inspectBrollFadeLink(outIntent,op,{transition:{...fade,edge:'out'}},annex),null);
 assert.equal(inspectBrollFadeLink(inIntent,op,{transition:{...fade,edge:'out'}},annex),'TRANSITION_EDGE_MISMATCH');
 assert.equal(inspectBrollFadeLink(inIntent,op,{},annex),'TRANSITION_TYPE_NOT_EXPLICITLY_MAPPED');
 assert.equal(inspectBrollFadeLink(inIntent,op,{transition:{...fade,durationFrames:0}},annex),'TRANSITION_DURATION_INVALID');
 assert.equal(inspectBrollFadeLink(inIntent,{...op,resourceRef:'B02'},{transition:fade},annex),'TRANSITION_VIDEO_RESOURCE_MISMATCH');
 assert.equal(inspectBrollFadeLink(inIntent,{...op,effect:'image-exact'},{transition:fade},annex),'TRANSITION_VIDEO_RESOURCE_MISMATCH');
 assert.equal(inspectBrollFadeLink(inIntent,{...op,parameters:{visual:{...visual,rect:{...visual.rect,width:400}}}},{transition:fade},annex),'TRANSITION_NEEDS_FULL_FRAME_VIDEO_OPACITY');
});
test('reject fake fades, missing entry/exit, unsafe curves and unaligned timing',()=>{
 for(const mutate of [
  keys=>keys.filter(k=>k.atFrame!==0),
  keys=>keys.map(k=>k.atFrame===59?{...k,opacity:1}:k),
  keys=>keys.map(k=>k.atFrame===8?{...k,opacity:.5}:k),
  keys=>keys.map(k=>k.atFrame===51?{...k,opacity:0}:k),
  keys=>keys.map(k=>k.atFrame===8?{...k,easing:'spring'}:k),
  keys=>[...keys].reverse(),
  keys=>[keys[0],{atFrame:4,opacity:.7},...keys.slice(1)]
 ]){
  const altered={...op,parameters:{visual:{...visual,keyframes:mutate(visual.keyframes)}}};
  assert.notEqual(inspectBrollFadeLink(inIntent,altered,{transition:fade},annex),null);
 }
 assert.equal(inspectBrollFadeLink(inIntent,{...op,start:1/30},{transition:fade},annex),'TRANSITION_VIDEO_INTERVAL_MISMATCH');
});
test('crosswalk sees structural faded B-roll but still blocks every unmapped cinematic instruction',()=>{
 const story={schema:'sues-master-story/v1',sourceSha256:H,
  timeline:{fingerprint:T,timeSpace:'edit-timeline',fps:30,duration:2},
  narrative:{scenes:[{id:'scene-01',start:0,end:2,purpose:'Acción original'}]},
  resources:[{id:'B01',source:'generate',kind:'video',creationBrief:'People applauding'}],
  operations:[op]};
 const links=[
  {intentId:inIntent.id,status:'mapped',operationIds:['broll1'],transition:fade},
  {intentId:outIntent.id,status:'mapped',operationIds:['broll1'],transition:{...fade,edge:'out'}},
  {intentId:annex.operationIntents.find(x=>x.id.endsWith('-base')).id,status:'mapped',operationIds:['broll1']}
 ];
 const result=auditMasterBriefCrosswalk({annex,story,links});
 assert.equal(result.status,'BLOCKED');assert.equal(result.code,'TRANSLATION_INTENTS_PENDING');
 assert.ok(result.pendingIntents.length>=1);
 assert.equal(result.canExecute,false);
 const missing=links.filter(l=>l.intentId!==outIntent.id);
 const again=auditMasterBriefCrosswalk({annex,story,links:missing});
 assert.equal(again.status,'BLOCKED');assert.ok(again.pendingIntents.some(x=>x.intentId===outIntent.id));
});

test('the genuine strict Remotion compiler keeps the very same verified video and its fade keyframes',async()=>{
 const {compileMasterDirectorRemotion}=await import('../src/master-director-remotion-compiler.js');
 const mediaHash='f'.repeat(64),videoVisual={...structuredClone(visual),zIndex:2};
 const graph={schema:'sues-layer-graph/v1',sourceSha256:H,planFingerprint:'c'.repeat(64),
  canvas:{width:1080,height:1920},fps:30,durationFrames:60,nodes:[{
   id:'broll1',sceneId:'scene-01',track:'broll',renderer:'remotion',effect:'video-exact',
   startFrame:0,endFrame:60,resource:{id:mediaHash,sha256:mediaHash},visual:videoVisual,
   sourceParameters:{visual:structuredClone(videoVisual),fit:'fill',muted:true,sourceInFrame:0}
  }]};
 const verifiedAssets={[mediaHash]:{sha256:mediaHash,kind:'video',duration:3,
  rightsVerified:true,commercialUseAllowed:true}};
 const result=compileMasterDirectorRemotion(graph,{verifiedAssets});
 assert.equal(result.status,'READY_FOR_REMOTION_STAGING');
 const layer=result.composition.layers[0];assert.equal(layer.kind,'video');
 assert.deepEqual(layer.visual.keyframes,visual.keyframes);
 assert.equal(layer.assetId,mediaHash);assert.equal(layer.muted,true);
 // This validates only compilation in an isolated synthetic test. There is no
 // claim the 158404 B01 resource, rights or fade style has been approved.
 verifiedAssets[mediaHash].rightsVerified=false;
 assert.equal(compileMasterDirectorRemotion(graph,{verifiedAssets}).status,'BLOCKED');
});
