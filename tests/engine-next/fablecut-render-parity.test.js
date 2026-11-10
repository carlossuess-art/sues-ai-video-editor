import test from 'node:test';
import assert from 'node:assert/strict';
import {assertRenderCopyParity} from '../../src/engine-next/fablecut-render-parity.js';
const p={revision:2,media:[{id:'a'}],clips:[{id:'c',props:{x:12}}]};
test('render copy permits only known default additions',()=>{const q=structuredClone(p);q.revision=3;q.media[0].folderId=null;q.clips[0].props.opacity=1;assert.equal(assertRenderCopyParity(p,q,{opacity:1}),true);assert.equal(p.revision,2)});
test('render copy rejects creative changes, unexpected fields and loss',()=>{for(const mut of [q=>q.clips[0].props.x=13,q=>q.clips[0].props.fake=true,q=>delete q.clips[0].props.x,q=>q.revision=4]){const q=structuredClone(p);mut(q);assert.throws(()=>assertRenderCopyParity(p,q,{opacity:1}))}});
