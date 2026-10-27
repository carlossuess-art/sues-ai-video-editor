import test from 'node:test';
import assert from 'node:assert/strict';
import {locateSpokenPhrase,proposeSilenceCuts,previewCuts,keptSegments,interpretCutInstruction} from '../src/source-cuts.js';
const t={version:'1.0',language:'es',sourceDuration:10,words:[{text:'Hola',start:.5,end:1},{text:'quédate',start:1.2,end:1.8},{text:'ahora',start:3,end:3.5},{text:'quédate',start:5,end:5.6},{text:'bien',start:7,end:7.4}]};
test('phrase lookup exposes ambiguity',()=>{const r=locateSpokenPhrase(t,'QUÉDATE');assert.equal(r.matches.length,2);assert.equal(r.ambiguous,true);assert.equal(r.requiresConfirmation,true);});
test('silence trimming disabled by default',()=>{const r=proposeSilenceCuts(t);assert.equal(r.enabled,false);assert.ok(r.proposals.length>0);});
test('cut preview remaps transcript and invalidates plan',()=>{const r=previewCuts(t,[{start:1.1,end:1.9}]);assert.equal(r.segments.length,2);assert.equal(r.words.some(w=>w.sourceWordIndex===1),false);assert.equal(r.invalidatesExistingEditPlan,true);});
test('overlaps and total removal rejected',()=>{assert.throws(()=>keptSegments(10,[{start:0,end:6},{start:5,end:7}]));assert.throws(()=>keptSegments(10,[{start:0,end:10}]));});
test('commands require confirmation',()=>{assert.equal(interpretCutInstruction(t,'elimina la parte donde digo «quédate»').matches.length,2);assert.deepEqual(interpretCutInstruction(t,'quita los primeros 5 segundos').matches,[{start:0,end:5}]);assert.equal(interpretCutInstruction(t,'otra cosa').kind,'unsupported');});