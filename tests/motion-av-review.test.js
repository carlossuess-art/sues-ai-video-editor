import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareNarrativeMotionReview} from '../src/motion-templates/narrative-motion-review.js';
import {makeMotionAVReview} from '../src/motion-templates/motion-av-review.js';
function fixture(){
 const text=['¿Y','si','te','escucharas?','Haz','espacio','para','escucharte.'];
 return {version:'1.0',language:'es',sourceDuration:7,words:text.map((x,i)=>({id:'user-word-'+i,text:x,start:i*.3,end:i*.3+.22}))};
}
test('renders seven-column human A/V view with exact anchors',()=>{
 const packet=prepareNarrativeMotionReview(fixture(),{selectedWordIds:['user-word-3','user-word-5']});
 const markdown=makeMotionAVReview(packet);
 assert.ok(markdown.includes('| ID / tiempo fuente / palabras | Voz exacta / anclas | A-roll / cámara | Capas / B-roll / máscaras | Motion / VFX / captions | Audio | Recursos / QA / estado |'));
 assert.ok(markdown.includes('¿Y si te escucharas?'));
 assert.ok(markdown.includes('NO IMPORTABLE'));
 assert.ok(markdown.includes('SUES_CARD_TO_SPACE_DEMO'));
 assert.ok(markdown.includes('no se programa cámara'));
 assert.ok(!markdown.includes('APROBADO POR CARLOS'));
});
test('selector empty cannot be mistaken for approved A/V plan',()=>{
 const packet=prepareNarrativeMotionReview(fixture());
 const md=makeMotionAVReview(packet);
 assert.ok(md.includes('Falta selección de palabras'));
 assert.ok(md.includes('NO IMPORTABLE'));
});
test('reject unrelated source and escape markdown table fields',()=>{
 assert.throws(()=>makeMotionAVReview({schema:'other'}),/Expected/);
 const packet=prepareNarrativeMotionReview(fixture(),{selectedWordIds:['user-word-3']});
 packet.candidates[0].sourceSpeech.quote='¿Y | si te escucharas?';
 assert.ok(makeMotionAVReview(packet).includes('¿Y \\| si'));
});
