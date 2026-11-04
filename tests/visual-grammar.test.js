import test from 'node:test';
import assert from 'node:assert/strict';
import {VISUAL_GRAMMAR_158623,compileVisualBeat,appearanceAtFrame,visualGrammarForProfile} from '../src/visual-grammar.js';
import {visualProfile} from '../src/style-variants.js';
import {completeDirectorCatalog} from '../src/director-context.js';

test('approved 158623 colors, sizes and canvas exact',()=>{
 const s=VISUAL_GRAMMAR_158623;assert.deepEqual(s.canvas,{width:1080,height:1920});
 assert.deepEqual(s.type.families,['Montserrat','Inter','Poppins']);
 assert.equal(s.type.connector.minPx,62);assert.equal(s.type.connector.maxPx,68);
 assert.equal(s.type.hero.minPx,98);assert.equal(s.type.hero.maxPx,115);
 assert.deepEqual([s.type.hero.minRatio,s.type.hero.maxRatio],[1.5,1.8]);
 assert.deepEqual([s.palette.fortune.text,s.palette.money.text,s.palette.contrast.text],['#26F7FD','#59FF00','#FFD000']);
 assert.equal(s.board.outlinePx,6);assert.deepEqual(s.speaker.centerX,[510,520]);
 assert.deepEqual(s.speaker.chestY,[890,1060]);assert.deepEqual(s.board.headingY,[680,890]);
 assert.equal(s.samples.length,7);assert.equal(s.samples[4].lines[1][1],98);
});
test('accumulated lines follow verified word timestamps',()=>{
 const b=compileVisualBeat({layoutMode:'speaker',start:0,end:2,speechCue:'una auténtica FORTUNA',lines:[
  {text:'una auténtica',role:'connector',sizePx:62,at:0},{text:'FORTUNA',role:'fortune',sizePx:115,at:.8}]});
 assert.equal(b.grammarId,VISUAL_GRAMMAR_158623.id);
 assert.equal(b.lines[0].y,890);assert.equal(b.lines[1].y,975);assert.equal(b.lines[1].glow.color,'#00E5FF');
 assert.equal(appearanceAtFrame(b.lines[0],10).visible,true);
 assert.equal(appearanceAtFrame(b.lines[1],10).visible,false);
 assert.equal(appearanceAtFrame(b.lines[0],40).visible,true);
 assert.equal(appearanceAtFrame(b.lines[1],40).visible,true);
});
test('money and board treatments follow approved contract',()=>{
 const b=compileVisualBeat({layoutMode:'fullGraphic',start:0,end:3,speechCue:'Donó 75 MILLONES',lines:[
 {text:'Donó',role:'board',sizePx:80,at:0},{text:'75 MILLONES',role:'money',sizePx:98,at:.4}]});
 assert.equal(b.lines[0].outline.widthPx,6);assert.equal(b.lines[1].outline.widthPx,6);
 assert.equal(b.ambient.opacity,.4);assert.deepEqual(b.objectArea.x,[300,780]);
});
test('reject unknown or invented timings',()=>{
 const b={layoutMode:'speaker',start:0,end:3,speechCue:'Dos palabras'};
 assert.throws(()=>compileVisualBeat({...b,lines:[{text:'palabras',role:'hero',at:3}]}),/time invalid/);
 assert.throws(()=>compileVisualBeat({...b,lines:[{text:'Dos',role:'connector',at:1},{text:'palabras',role:'hero',at:.5}]}),/time invalid/);
 assert.throws(()=>compileVisualBeat({...b,lines:[{text:'Dos',role:'connector',sizePx:25,at:0}]}),/size invalid/);
 assert.throws(()=>compileVisualBeat({...b,lines:[]}),/required/);
});
test('editor profiles and Director catalog share the canonical ID',()=>{
 const a=visualProfile('SUES_DOPAMIN'),b=visualProfile('SUES_CALMA');
 assert.equal(a.visualGrammar.id,b.visualGrammar.id);
 assert.equal(a.visualGrammar.id,visualGrammarForProfile('SUES_DOPAMIN').id);
 assert.equal(a.visualGrammar.intensity,1);assert.equal(b.visualGrammar.intensity,.5);
 assert.equal(completeDirectorCatalog({assets:[],duration:9},{styleId:'SUES_DOPAMIN'}).visualGrammar.id,a.visualGrammar.id);
});
