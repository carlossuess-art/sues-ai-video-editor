import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const plan=JSON.parse(fs.readFileSync(new URL('../src/plan.json',import.meta.url),'utf8'));
test('Escenas contiguas y duración exacta',()=>{
 let cursor=0;
 for(const [name,scene] of Object.entries(plan.scenes)){
  assert.equal(scene.start,cursor,name+' inicia en reloj correcto');
  assert.ok(scene.duration>0);
  cursor+=scene.duration;
 }
 assert.equal(cursor,plan.totalFrames);
 assert.equal(plan.width,1080);
 assert.equal(plan.height,1920);
 assert.equal(plan.fps,30);
});
test('Mecanografiado acumulativo dentro de su escena',()=>{
 const max=plan.scenes.typewriter.duration;
 for(const line of plan.typingLines){
  assert.ok(line.start>=0 && line.start+line.duration<=max,line.text);
  assert.ok(line.text.length>0);
  assert.ok(line.fontSize>=54);
 }
 assert.match(plan.scenes.intro.spoken,/procesos de transformación profunda/);
 assert.match(plan.scenes.typewriter.spoken,/nivel de consciencia/);
 assert.equal(plan.scenes.instagram.spoken,'sígueme.');
 assert.ok(plan.instagramClickLocalFrame<plan.scenes.instagram.duration);
});
