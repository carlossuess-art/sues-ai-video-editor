import test from 'node:test';
import assert from 'node:assert/strict';
import {rmSync} from 'node:fs';
import {fixture} from './helpers/editor-fixture.js';
import {loadProject,prepareProject} from '../src/local-pipeline.js';
import {buildPreviewASS,buildPreviewFilter} from '../src/local-preview.js';
import {validateEditorSettings} from '../src/automatic-director.js';
test('explicit keyword selection survives edited text and never invents source word indexes',()=>{
 const f=fixture();try{const p=loadProject(f.profiles.test),base=prepareProject(p),c=base.plan.captions[0];
 const r=prepareProject(p,{captionOverrides:{[c.id]:'Mi propia voz.'},keywordOverrides:{[c.id]:{word:2,level:'exceptional',style:'coral'}}}),caption=r.plan.captions[0];assert.equal(caption.keyword.displayWordIndex,2);assert.equal(caption.keyword.sourceWordIndex,undefined);assert.equal(caption.keyword.method,'explicit-editor-choice');assert.ok(buildPreviewASS(r.plan).includes('\\i1'));assert.ok(buildPreviewASS(r.plan).includes('VOZ.'));
 assert.throws(()=>prepareProject(p,{keywordOverrides:{[c.id]:{word:15,level:'important',style:'white'}}}),/outside/);
 assert.throws(()=>prepareProject(p,{keywordOverrides:{'seg-999':{level:'none'}}}),/Unknown keyword/);
 const none=prepareProject(p,{keywordOverrides:{[c.id]:{level:'none'}}});assert.equal(none.plan.captions[0].keyword,null);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('music controls preserve continuous original voice and can disable ducking or the bed',()=>{
 const f=fixture();try{const p=loadProject(f.profiles.test);p.inputs.backgroundAudio={assetId:'own',localFile:'/music.wav',rights:'owned',gain:.12};
 const noBed=prepareProject(p,{musicEnabled:false});assert.equal(noBed.plan.audioMix,null);assert.equal(noBed.plan.audioSourceAvailable,true);
 const reduced=prepareProject(p,{musicGain:.06,duckMusic:false});assert.equal(reduced.plan.audioMix.gain,.06);const graph=buildPreviewFilter(reduced.plan);assert.ok(!graph.includes('sidechaincompress'));assert.ok(graph.includes('[audio][music-bed]amix'));assert.equal(prepareProject(p,{musicGain:0}).plan.audioMix,null);
 for(const settings of [{musicGain:1},{musicEnabled:'yes'},{keywordOverrides:{'seg-001':{word:0,level:'important',style:'{bad}'}}}])assert.throws(()=>validateEditorSettings(settings));
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
