import test from 'node:test';
import assert from 'node:assert/strict';
import {editorialAcceptance} from '../src/editor-acceptance.js';
test('aesthetic approval requires actual owner review fields and stays tied to one output without declaring V1',()=>{
 const identity={fingerprint:'a'.repeat(64),outputSha256:'b'.repeat(64)},review={captionsReviewed:true,framingReviewed:true,audioReviewed:true,majorChanges:0,minorChanges:3};
 const accepted=editorialAcceptance(review,identity);assert.equal(accepted.pass,true);assert.equal(accepted.v1AutomaticallyDeclared,false);assert.equal(accepted.outputSha256,identity.outputSha256);
 assert.equal(editorialAcceptance({...review,audioReviewed:false},identity).pass,false);assert.equal(editorialAcceptance({...review,majorChanges:1},identity).pass,false);assert.equal(editorialAcceptance({...review,minorChanges:4},identity).pass,false);
 assert.throws(()=>editorialAcceptance({...review,minorChanges:-1},identity));assert.throws(()=>editorialAcceptance({...review,acceptAutomatically:true},identity));
});
