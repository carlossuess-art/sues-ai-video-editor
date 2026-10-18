import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {compileTemplatePolicy} from '../src/template.js';
import {buildCinematicBrollPlan} from '../src/cinematic-style.js';
const read=p=>JSON.parse(readFileSync(new URL(`../examples/${p}`,import.meta.url)));
const template=()=>read('templates/sues-calma.template.json');
const brand=()=>read('brand-kit.sues.json');
const policy=()=>compileTemplatePolicy(template(),brand());
const slot=(start=5,end=9,tags=['water'])=>({start,end,tags,reason:'Metáfora de agua'});
const asset=(id='a',kind='nature',tags=['water'])=>({id,sourceRef:`fixture:${id}`,kind,tags,duration:10,available:true});
const plan=options=>buildCinematicBrollPlan({policy:policy(),duration:38.31,slots:[slot()],assets:[],...options});

test('CALMA functional template compiles cinematic direction and shared brand tokens',()=>{
 const b=brand();b.id='future-shared';b.fonts.primary='Future Font';b.colors.text='#ABCDEF';b.captions.maxLines=1;b.outro.text='Cierre compartido';
 const p=compileTemplatePolicy(template(),b);
 assert.equal(p.brandKitId,b.id);assert.equal(p.captions.font,b.fonts.primary);
 assert.equal(p.captions.color,b.colors.text);assert.equal(p.captions.maxLines,1);assert.equal(p.outro.text,b.outro.text);
 assert.equal(p.visualStyle.status,'functional');assert.ok(p.visualStyle.sources.includes('retreat'));
 const t=template(),p2=compileTemplatePolicy(t,b);p2.visualStyle.sources.push('mutated');assert.equal(t.visualStyle.sources.length,3);
});
test('no actual footage yields explicit presenter fallback, no invented assets',()=>{
 const p=plan({});assert.equal(p.decisions[0].type,'keep-presenter');assert.equal(p.decisions[0].fallback,'no-matching-footage');assert.equal(p.coverage,0);assert.equal(p.renderReady,false);
});
test('semantic matching accepts retreat clips, preserves voice/captions and is order deterministic',()=>{
 const options={slots:[slot(5,9,['retreat','connection'])],assets:[asset('b','retreat',['retreat']),asset('a','retreat',['retreat','connection'])]};
 const p=plan(options),d=p.decisions[0];assert.equal(d.assetId,'a');assert.equal(d.sourceOut,4);
 assert.equal(d.originalVoice,true);assert.equal(d.sourceAudio,false);assert.equal(d.captions,'preserve');
 assert.deepEqual(plan({...options,assets:[...options.assets].reverse()}),p);
});
test('unrelated, unavailable and too short footage cannot be selected',()=>{
 for(const a of [asset('x','exterior',['city']),{...asset(),available:false},{...asset(),inPoint:8}])assert.equal(plan({assets:[a]}).decisions[0].type,'keep-presenter');
});
test('bookends, presenter gaps and coverage budget prevent continuous b-roll',()=>{
 const assets=Array.from({length:6},(_,i)=>asset(String(i)));
 const p=plan({duration:30,assets,slots:[slot(0,3),slot(4,8),slot(9,12),slot(13,17),slot(20,25),slot(27,30)]});
 assert.deepEqual(p.decisions.map(x=>x.fallback??'selected'),['presenter-bookends','selected','presenter-gap','selected','coverage-budget','presenter-bookends']);
 assert.ok(p.coverage<=.4);
});
test('same asset is not repeatedly selected and in-points remain within footage',()=>{
 const p=plan({assets:[{...asset(),inPoint:2}],slots:[slot(),slot(16,20)]});
 assert.equal(p.decisions[0].sourceIn,2);assert.equal(p.decisions[0].sourceOut,6);
 assert.equal(p.decisions[1].fallback,'no-matching-footage');
});
test('invalid semantic slots, overlapping times and unsafe style settings fail',()=>{
 for(const slots of [[{...slot(),reason:''}],[slot(5,9),slot(8,12)],[slot(37,40)],[slot(5,9,[])]])assert.throws(()=>plan({slots}));
 const t=template();t.visualStyle.broll.allowSourceAudio=true;assert.throws(()=>compileTemplatePolicy(t,brand()),/broll rules/);
 assert.throws(()=>plan({assets:[asset(),asset()]}),/asset id/);
});

test('shared brand outro duration reserves enough closing presenter time',()=>{
 const b=brand();b.outro.duration=6;const p=compileTemplatePolicy(template(),b);
 const result=plan({policy:p,slots:[slot(31,35)],assets:[asset()]});
 assert.equal(result.decisions[0].fallback,'presenter-bookends');
});
