import test from 'node:test';import assert from 'node:assert/strict';
import {prepareFilmDirectorCaptionLayerCandidates as prepare} from '../src/master-director-brief-caption-layers.js';
const hash=x=>x.repeat(64);
const annex={schema:'sues-master-film-brief-translation/v1',approved:false,canExecute:false,
 fps:30,duration:2,sourceBriefSha256:hash('a'),sourceSha256:hash('b'),timelineFingerprint:hash('c'),
 scenes:[{id:'scene-01'}]};
const geometry={schema:'sues-film-brief-geometry-audit/v1',invalid:0,canExecute:false,
 placements:[{sourceText:'Subtítulos x=90-990 y=1470-1660',rectangles:[{x:90,y:1470,width:900,height:190}]}]};
const words=[{wordId:'w0',text:'Hay',sceneId:'scene-01',startFrame:1,endFrame:5},
 {wordId:'w1',text:'una',sceneId:'scene-01',startFrame:5,endFrame:10},
 {wordId:'w2',text:'forma',sceneId:'scene-01',startFrame:10,endFrame:15}];
const cues=[{id:'c0',wordId:'w0',sceneId:'scene-01',startFrame:1,endFrame:5,text:'Hay',approved:false,renderable:false},
 {id:'c1',wordId:'w1',sceneId:'scene-01',startFrame:5,endFrame:10,text:'Hay una',approved:false,renderable:false},
 {id:'c2',wordId:'w2',sceneId:'scene-01',startFrame:10,endFrame:15,text:'Hay una forma',approved:false,renderable:false}];
const draft={schema:'sues-film-director-word-captions-draft/v1',approved:false,canExecute:false,
 sourceBriefSha256:annex.sourceBriefSha256,sourceSha256:annex.sourceSha256,
 timelineFingerprint:annex.timelineFingerprint,words,captionCues:cues,risks:[]};
test('every exact spoken word becomes an accumulated, bounded, non-executable visual candidate',()=>{
 const x=prepare(annex,draft,geometry);
 assert.equal(x.status,'PREPARED_NOT_EXECUTABLE_NEEDS_HUMAN_ASR_AND_FRAME_QA');
 assert.equal(x.candidateCount,3);assert.equal(x.candidates[2].text,'Hay una forma');
 assert.equal(x.candidates[2].start,10/30);assert.deepEqual(x.safeZoneProposed,{x:90,y:1470,width:900,height:190});
 assert.equal(x.approved,false);assert.equal(x.canExecute,false);
 assert.ok(x.candidates.every(c=>c.approved===false&&c.canExecute===false));
});
test('mutating voice, source hash or proposed geometry never passes',()=>{
 const d=structuredClone(draft);d.captionCues[1].text='una';
 const result=prepare(annex,d,geometry);
 assert.equal(result.status,'BLOCKED');assert.equal(result.code,'CAPTION_CUMULATIVE_WORD_TEXT_CHANGED');
 const d2=structuredClone(draft);d2.sourceSha256=hash('d');
 assert.equal(prepare(annex,d2,geometry).code,'UNTRUSTED_CAPTION_SOURCE_OR_GEOMETRY');
 const g={...geometry,placements:[]};
 assert.equal(prepare(annex,draft,g).code,'CAPTION_SAFE_ZONE_MISSING_OR_AMBIGUOUS');
});
