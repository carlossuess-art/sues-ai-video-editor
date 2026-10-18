import test from 'node:test';
import assert from 'node:assert/strict';
import {shortCaptionGroups} from '../src/short-captions.js';
import {progressiveRuns} from '../src/caption-motion.js';
const phrase=(text,id,start,end,offset=0)=>text.split(' ').map((text,i)=>({text,phraseId:id,start,end,timingUncertain:true,sourceWordIndex:offset+i,sourceSegmentIndex:0}));
test('recovered phrases retain display intervals and never acquire word karaoke',()=>{
 const words=[...phrase('No es pereza.','a',1,2),...phrase('Es un sistema','b',2,3,3)];
 const groups=shortCaptionGroups(words);assert.equal(groups.length,2);assert.equal(groups[0].text,'No es pereza.');assert.deepEqual(groups.flatMap(c=>c.wordIndexes),[0,1,2,3,4,5]);assert.ok(groups.every(c=>c.timingGranularity==='phrase'&&c.timingUncertain));
 assert.equal(progressiveRuns({...groups[0],wordCues:[{start:1,end:2,wordIndexes:[0,1,2]}]},[],{progressive:true}),null);
 assert.throws(()=>shortCaptionGroups(words,{maxWords:1}),/cannot be split/);
});
test('ambiguous or overlapping recovered phrase alignment fails closed',()=>{
 const a=phrase('No es','a',1,2);assert.throws(()=>shortCaptionGroups([...a,...phrase('pereza','b',1.5,2.5,2)]),/non-overlapping/);
 assert.throws(()=>shortCaptionGroups([a[0],{...a[1],end:2.1}]),/share/);
 assert.throws(()=>shortCaptionGroups([a[0],{...a[1],phraseId:undefined}]),/every word/);
 assert.throws(()=>shortCaptionGroups([...a,...phrase('otra','b',2,3),...phrase('vez','a',3,4)]),/contiguous/);
});

test('flat colored emphasis retains an opaque fill and matching glow without metallic bands',async()=>{
 const {TEXT_PRESETS,validateKeywordOverrides}=await import('../src/text-presets.js');
 const {fixture}=await import('./helpers/editor-fixture.js');
 const {loadProject,prepareProject}=await import('../src/local-pipeline.js');
 const {buildPreviewASS}=await import('../src/local-preview.js');
 const {rmSync}=await import('node:fs');
 const f=fixture();try{const p=loadProject(f.profiles.test),base=prepareProject(p),id=base.plan.captions[0].id;
 for(const style of ['yellow','red']){assert.ok(TEXT_PRESETS[style].color);validateKeywordOverrides({[id]:{word:0,level:'exceptional',style}});const a=buildPreviewASS(prepareProject(p,{keywordOverrides:{[id]:{word:0,level:'exceptional',style}}}).plan);const fill=TEXT_PRESETS[style].color.slice(1).match(/../g).reverse().join('');assert.ok(a.includes(`\\1c&H00${fill}&`));assert.ok(a.includes('\\blur12'));}
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
