import test from 'node:test';
import assert from 'node:assert/strict';
import {validateCreateEditRequest,validateAdjustment,canTransition} from '../src/app-contract.js';

test('create edit requires known template',()=>{
 assert.equal(validateCreateEditRequest({version:'1.0',sourceRef:'drive:abc',templateId:'SUES_CALMA'}),true);
 assert.throws(()=>validateCreateEditRequest({version:'1.0',sourceRef:'x',templateId:'UNKNOWN'}));
});
test('paid-campaign mode requires geographic banner location',()=>{
 assert.throws(()=>validateCreateEditRequest({version:'1.0',sourceRef:'x',templateId:'SUES_CALMA',campaignMode:true}));
});
test('adjustments are constrained and zoom bounded',()=>{
 assert.equal(validateAdjustment({type:'replace-caption',targetId:'caption-1',value:'Hola'}),true);
 assert.throws(()=>validateAdjustment({type:'change-zoom',targetId:'shot-1',value:2}));
});
test('job transitions prevent duplicate render loops',()=>{
 assert.equal(canTransition('PREVIEW_READY','RENDERING'),true);
 assert.equal(canTransition('RENDERING','RENDERING'),false);
 assert.equal(canTransition('DONE','RENDERING'),false);
});
