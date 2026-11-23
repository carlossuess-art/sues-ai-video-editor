import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewMasterDirectorHybridGraph} from '../src/master-director-hybrid-review.js';
const source='a'.repeat(64),planId='b'.repeat(64),font='f'.repeat(64);
const visual=()=>({rect:{x:80,y:140,width:720,height:280},zIndex:6,opacity:1,
 typography:{family:'Montserrat',sizePx:72,weight:700,color:'#ffffff'},
 keyframes:[{atFrame:0,opacity:0},{atFrame:9,opacity:1,easing:'ease-in-out'}]});
const graph=()=>{
 const v=visual();
 return {schema:'sues-layer-graph/v1',sourceSha256:source,planFingerprint:planId,
  timelineFingerprint:'approved-timeline-001',canvas:{width:1080,height:1920},fps:30,durationFrames:150,
  nodes:[
   {id:'cut-1',sceneId:'intro',renderer:'native',track:'transition',effect:'transition-native',
    startFrame:30,endFrame:42,startTime:1,endTime:1.4,dependencies:[],sourceParameters:{kind:'warm'},
    editability:'native-controls-only',visual:null},
   {id:'title-1',sceneId:'intro',renderer:'remotion',track:'graphics',effect:'text',
    startFrame:40,endFrame:90,startTime:40/30,endTime:3,dependencies:['cut-1'],visual:v,
    sourceParameters:{text:'CORAZÓN',visual:structuredClone(v)},editability:'parameterized-layer'}
  ]};
};
const verified={verifiedFonts:{'Montserrat:700':{sha256:font}}};
test('mixed review preserves both engines and all operation identities without authorizing execution',()=>{
 const g=graph(),original=JSON.stringify(g),out=reviewMasterDirectorHybridGraph(g,verified);
 assert.equal(out.status,'MIXED_COMPONENTS_STAGED_NOT_RENDERABLE',JSON.stringify(out));
 assert.equal(out.canExecute,false);assert.equal(out.canRender,false);
 assert.deepEqual(out.nativeOperationIds,['cut-1']);assert.deepEqual(out.remotionOperationIds,['title-1']);
 assert.equal(out.operationCount,2);assert.equal(out.reviewedCount,2);
 assert.equal(out.remotionComponent.layers[0].text,'CORAZÓN');
 assert.equal(out.remotionComponent.planFingerprint,planId);
 assert.equal(out.remotionComponent.sourceSha256,source);
 assert.deepEqual(out.crossEngineDependencies,[{from:'cut-1',to:'title-1',fromEngine:'native',toEngine:'remotion'}]);
 assert.deepEqual(out.crossEngineOverlaps,[{nativeId:'cut-1',remotionId:'title-1',classification:'visual-order-unresolved'}]);
 assert.ok(out.issues.some(i=>i.code==='HYBRID_COMPOSITOR_NOT_IMPLEMENTED'));
 assert.equal(JSON.stringify(g),original);
});
test('a missing trusted Remotion font blocks the complete mixed review',()=>{
 const out=reviewMasterDirectorHybridGraph(graph());
 assert.equal(out.status,'BLOCKED');assert.ok(out.issues.some(i=>i.code==='FONT_NOT_VERIFIED'));
 assert.equal(out.remotionComponent,undefined);assert.equal(out.canExecute,false);
});
test('duplicate or unknown operations cannot disappear during partitioning',()=>{
 const g=graph();g.nodes[1].id='cut-1';assert.ok(reviewMasterDirectorHybridGraph(g,verified).issues.some(i=>i.code==='HYBRID_OPERATION_ID_INVALID'));
 g.nodes[1].id='title-1';g.nodes[1].renderer='unknown';
 assert.ok(reviewMasterDirectorHybridGraph(g,verified).issues.some(i=>i.code==='HYBRID_ENGINE_UNKNOWN'));
});
test('unresolved cross-engine dependencies block rather than invent a preceding edit',()=>{
 const g=graph();g.nodes[1].dependencies=['missing'];
 const out=reviewMasterDirectorHybridGraph(g,verified);assert.equal(out.status,'BLOCKED');
 assert.ok(out.issues.some(i=>i.code==='HYBRID_DEPENDENCY_MISSING'));
});
test('a single-engine plan is not incorrectly promoted as a hybrid',()=>{
 const g=graph();g.nodes.pop();
 const out=reviewMasterDirectorHybridGraph(g,verified);assert.equal(out.status,'NOT_MIXED');assert.equal(out.canExecute,false);
});

test('full-composition native effects overlapping a Remotion layer require visual ordering',()=>{
 const g=graph();for(const track of ['transition','graphics','captions']){g.nodes[0].track=track;assert.equal(reviewMasterDirectorHybridGraph(g,verified).crossEngineOverlaps[0].classification,'visual-order-unresolved');}
 g.nodes[0].track='camera';assert.equal(reviewMasterDirectorHybridGraph(g,verified).crossEngineOverlaps[0].classification,'visual-stack');
 g.nodes[0].track='transition';g.nodes[0].endFrame=40;g.nodes[0].endTime=40/30;assert.deepEqual(reviewMasterDirectorHybridGraph(g,verified).crossEngineOverlaps,[]);
});

test('native time boundaries are compared before rounding to avoid hiding overlaps',()=>{
 const g=graph();g.nodes[0].startTime=0.9;g.nodes[0].startFrame=27;g.nodes[0].endTime=40/30+0.001;g.nodes[0].endFrame=40;
 assert.equal(reviewMasterDirectorHybridGraph(g,verified).crossEngineOverlaps[0].classification,'visual-order-unresolved');
 delete g.nodes[0].endTime;assert.ok(reviewMasterDirectorHybridGraph(g,verified).issues.some(x=>x.code==='HYBRID_EXACT_TIMING_MISSING'));
});