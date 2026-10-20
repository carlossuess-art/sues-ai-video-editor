import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {shortCaptionGroups} from '../src/short-captions.js';
import {fontFiles,fitCaptionSize} from '../src/font-kits.js';
import {loadProject,prepareProject} from '../src/local-pipeline.js';
import {buildPreviewASS,buildPreviewFilter} from '../src/local-preview.js';
import {EditorJobs} from '../src/editor-jobs.js';
import {fixture} from './helpers/editor-fixture.js';
const words=text=>text.split(' ').map((text,i)=>({text,start:2+i*.5,end:2.5+i*.5,sourceWordIndex:i,sourceSegmentIndex:0}));
test('short captions retain every source index in order and enforce the selected word grouping',()=>{
 const input=words('Ahora puedes detenerte y sentir. Después respira con mucha calma.');
 for(const maxWords of [1,2,3]){const result=shortCaptionGroups(input,{maxWords});assert.deepEqual(result.flatMap(c=>c.wordIndexes),input.map(w=>w.sourceWordIndex));assert.ok(result.every(c=>c.wordIndexes.length<=maxWords&&c.end>c.start));assert.ok(result.every(c=>!c.text.includes('sentir. Después')));}
});
test('zero-duration ASR tokens stay with a real interval without inventing word timing',()=>{
 const input=words('un mundo. Después respira.');input[1]={...input[1],start:2.5,end:2.5,timingUncertain:true};const result=shortCaptionGroups(input,{maxWords:1});assert.equal(result[0].text,'un mundo.');assert.equal(result[0].start,2);assert.equal(result[0].end,2.5);assert.equal(result[0].timingUncertain,true);assert.deepEqual(result.flatMap(c=>c.wordIndexes),[0,1,2,3]);assert.throws(()=>shortCaptionGroups([{text:'sin tiempo',start:1,end:1,timingUncertain:true}]),/no real timing/);
});
test('font kits preserve legacy names, reject unknown families and refuse unreadably small text',()=>{
 assert.deepEqual(fontFiles('Open Sans'),['OpenSans.ttf','OpenSans-Bold.ttf','OFL.txt']);assert.ok(fontFiles('Inter').includes('metrics.json'));assert.throws(()=>fontFiles('../font'));
 const policy={font:'Inter',fontSize:96,scaleX:94,tracking:-2};assert.equal(fitCaptionSize(['Vuelve a ti'],policy),96);assert.throws(()=>fitCaptionSize(['W'.repeat(24)],policy),/readable size/);
});
test('CALMA creates compact captions, evidence-bound emphasis and a timed blurred focus before caption compositing',()=>{
 const f=fixture();try{const p=prepareProject(loadProject(f.profiles.test));assert.equal(p.plan.policy.captions.font,'Montserrat');assert.ok(p.plan.captions.every(c=>c.wordIndexes.length<=3));assert.ok(p.plan.captions.some(c=>c.emphasisWordIndexes.length));
 const focus=p.plan.semantic.motions.find(m=>m.backgroundTreatment);assert.ok(focus);assert.equal(focus.backgroundTreatment.presenterOccludedIntentionally,true);assert.ok(focus.start>=2&&focus.end<=21);
 const filter=buildPreviewFilter(p.plan),ass=buildPreviewASS(p.plan);assert.ok(filter.indexOf('gblur=')<filter.indexOf('ass=filename='));assert.ok(filter.includes('alpha=1'));assert.ok(filter.includes(`fade=t=in:st=${focus.start}:`));assert.ok(ass.includes('Style: Caption,Montserrat,112,'));assert.ok(ass.includes('\\fscx100'));assert.ok(ass.includes('Style: Outro,Montserrat,44,'));
 const off=prepareProject(loadProject(f.profiles.test),{motions:false,zoomIntensity:0});assert.ok(!buildPreviewFilter(off.plan).includes('gblur='));
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('regrouping cannot apply stale caption ids and undo restores the original grouping and edits',async()=>{
 const f=fixture(),jobs=new EditorJobs({directory:join(f.dir,'jobs'),profiles:f.profiles,autoStart:false});try{let job=jobs.create('test');job=jobs.adjust(job.id,{captionWords:3,captionOverrides:{'seg-001':'Puedes sentir.'}});assert.throws(()=>jobs.adjust(job.id,{captionWords:1,captionOverrides:{'seg-001':'No cambia'}}),/resetting/);job=jobs.adjust(job.id,{captionWords:1});assert.equal(job.settings.captionWords,1);assert.equal(jobs.plan(job.id).manifest.captions[0].text,'Ahora');job=jobs.undo(job.id);assert.equal(job.settings.captionWords,3);assert.equal(jobs.plan(job.id).manifest.captions[0].text,'Puedes sentir.');}finally{await jobs.close();rmSync(f.dir,{recursive:true,force:true});}
});
test('a manually corrected caption stays visible during a focus card from the original transcript',()=>{
 const f=fixture();try{const project=loadProject(f.profiles.test),base=prepareProject(project),focus=base.plan.semantic.motions.find(m=>m.backgroundTreatment),caption=base.plan.captions.find(c=>c.start>=focus.start-1e-6&&c.end<=focus.end+1e-6&&c.wordIndexes.every(i=>focus.evidence.sourceWordIndexes.includes(i)));assert.ok(caption);const changed=prepareProject(project,{captionOverrides:{[caption.id]:'Aquí sigo yo.'}});assert.ok(buildPreviewASS(changed.plan).includes('Aquí sigo yo.'));}finally{rmSync(f.dir,{recursive:true,force:true});}
});
