import test from 'node:test';
import assert from 'node:assert/strict';
import {createPasswordRecord,verifyPassword,createLoginLimiter,authorizedEmail} from '../src/editor-password-auth.js';
test('hash and verify without storing plaintext',()=>{
 const record=createPasswordRecord('LongUniqueSecret-123');
 assert.equal(record.includes('LongUniqueSecret'),false);
 assert.equal(verifyPassword('LongUniqueSecret-123',record),true);
 assert.equal(verifyPassword('incorrect password',record),false);
 assert.equal(verifyPassword('LongUniqueSecret-123','not-a-hash'),false);
});
test('minimum length and salt validation',()=>{
 assert.throws(()=>createPasswordRecord('short'));
 assert.throws(()=>createPasswordRecord('LongUniqueSecret-123',{salt:'bad'}));
});
test('administrator email is explicit',()=>{
 assert.equal(authorizedEmail(' CarlosSuesS@Gmail.com '),false);
 assert.equal(authorizedEmail(' carlossuess@gmail.com '),true);
});
test('rate limiter blocks after fifth failure, resets after window',()=>{
 let clock=0;const l=createLoginLimiter({now:()=>clock});
 for(let i=0;i<5;i++){assert.equal(l.allowed('ip'),true);l.fail('ip');}
 assert.equal(l.allowed('ip'),false);
 clock+=900001;assert.equal(l.allowed('ip'),true);
});
