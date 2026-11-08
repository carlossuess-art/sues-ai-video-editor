import test from 'node:test';import assert from 'node:assert/strict';
import {inspectNativeMediaDependencies as inspect} from '../../src/engine-next/native-media-dependencies.js';
const doc={media:[{id:'base',src:'/media/original.mp4'},{id:'alpha',src:'/media/alpha.png'},{id:'lib',src:'/media/unused.webm'}],clips:[{id:'V1',mediaId:'base'},{id:'V2',mediaId:'alpha'}]};
test('missing active alpha blocks preview, and even unused missing files block portability',()=>{
 const r=inspect(doc,new Set(['original.mp4']));assert.equal(r.assetCount,3);assert.equal(r.missingUsed,1);assert.equal(r.playbackReady,false);assert.equal(r.editableProjectPortable,false);
 assert.deepEqual(r.missing.map(x=>x.filename),['alpha.png','unused.webm']);
 const b=inspect(doc,new Set(['original.mp4','alpha.png']));assert.equal(b.playbackReady,true);assert.equal(b.editableProjectPortable,false);
 const c=inspect(doc,new Set(['original.mp4','alpha.png','unused.webm']));assert.equal(c.editableProjectPortable,true);
});
test('native media paths, duplicate IDs and dangling clip references are rejected',()=>{
 for(const src of ['/media/../secrets.txt','/media/%2e%2e','/api/project','/media/a/b.png','/media/%2Fetc%2Fpasswd','/media/.'])
  assert.throws(()=>inspect({...doc,media:[{id:'base',src}]},new Set()),/Unsafe|missing|Invalid/i,src);
 assert.throws(()=>inspect({...doc,media:[doc.media[0],doc.media[0]]},new Set()),/duplicate/);
 assert.throws(()=>inspect({...doc,media:doc.media.slice(0,1)},new Set(['original.mp4'])),/missing media ID/);
});
test('unverified inventory or malformed project is not interpreted as media ready',()=>{
 assert.throws(()=>inspect(doc,['original.mp4']),/verified media inventory/);
 assert.throws(()=>inspect({media:[]},new Set()),/verified media inventory/);
});
