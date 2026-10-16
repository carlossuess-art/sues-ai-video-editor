import test from 'node:test';
import assert from 'node:assert/strict';
import {validateDirectorPlan,enforceDirectorPolicy,compileDirectorEvents} from '../src/director-contract.js';

const policy={
 templateId:'SUES_CALMA',
 camera:{baseZoom:1.04,maxZoom:1.18,zoomReasons:['emphasis','revelation','emotional-turn']},
 motions:['BLURRED_RESOURCE_01','NUMBER_BADGE_GOLD_01'],
 transitions:['cut','soft-fade'],
 constraints:{semanticZoomOnly:true}
};
const plan=()=>({version:'1.0',templateId:'SUES_CALMA',decisions:[
 {type:'zoom',start:1,end:2,reason:'énfasis',rule:'semantic',params:{scale:1.12,reason:'emphasis'}},
 {type:'motion',start:3,end:5,reason:'prueba visual',rule:'support',params:{motionId:'BLURRED_RESOURCE_01'}}
]});

test('director plan validates and compiles',()=>{
 const p=plan();assert.equal(validateDirectorPlan(p),true);
 assert.equal(enforceDirectorPolicy(p,policy),true);
 assert.equal(compileDirectorEvents(p,policy).length,2);
});
test('periodic or unapproved zoom reasons are rejected',()=>{
 const p=plan();p.decisions[0].params.reason='every-5-seconds';
 assert.throws(()=>enforceDirectorPolicy(p,policy));
});
test('motion must be allowed by template',()=>{
 const p=plan();p.decisions[1].params.motionId='RANDOM_EFFECT';
 assert.throws(()=>enforceDirectorPolicy(p,policy));
});
