import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectFilmBriefGeometry} from '../src/master-director-brief-geometry.js';
const annex=(lines)=>({schema:'sues-master-film-brief-translation/v1',canExecute:false,
 translationCoverage:{lostLines:0},operationIntents:lines.map((verbatim,i)=>({
  id:'i'+i,sceneId:'scene-01',sourceLine:i+1,track:'editorial-direction',detail:{verbatim}}))});
test('preserves multiple real placement rectangles with exact pixel units',()=>{
 const r=inspectFilmBriefGeometry(annex(['Firma x=720–970 y=220–310; CTA x=160–920 y=720–940']));
 assert.equal(r.proposedRectangles,2);assert.equal(r.ambiguous,0);
 assert.deepEqual(r.placements[0].rectangles,[{x:720,y:220,width:250,height:90},{x:160,y:720,width:760,height:220}]);
 assert.equal(r.canExecute,false);
});
test('recognizes the explicitly shared y interval of the two M02 columns',()=>{
 const r=inspectFilmBriefGeometry(annex(['M02 tapiz antracita; columnas x=110–500 y x=580–980, y=740–1150.']));
 assert.equal(r.ambiguous,0);assert.equal(r.proposedRectangles,2);
 assert.deepEqual(r.placements[0].rectangles,[
  {x:110,y:740,width:390,height:410},
  {x:580,y:740,width:400,height:410}
 ]);
 assert.equal(r.placements[0].axisBinding,'EXPLICIT_SHARED_Y_FOR_TWO_COLUMNS');
});
test('does not silently invent a second y axis or accept out-of-canvas placement',()=>{
 const r=inspectFilmBriefGeometry(annex(['Columnas x=110–500 y=740–1150 y x=580–980',
  'Título x=100–1200 y=600–800']));
 assert.equal(r.ambiguous,1);assert.equal(r.invalid,1);
 assert.equal(r.placements[0].rectangles,null);assert.equal(r.canExecute,false);
 assert.equal(inspectFilmBriefGeometry({schema:'unknown'}).status,'BLOCKED');
});
