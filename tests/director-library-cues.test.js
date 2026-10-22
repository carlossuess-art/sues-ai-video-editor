import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {proposeLibraryCues} from '../src/director-library-cues.js';
const transcript=(text)=>({version:'1.0',language:'es',sourceDuration:25,words:text.split(' ').map((w,i)=>({text:w,start:2+i*.45,end:2+(i+1)*.45}))});
test('Director supplies timestamped, review-only candidates from installed source, not remote Drive',()=>{
 const root=mkdtempSync(join(tmpdir(),'sues-cues-'));
 try{
  const lib=join(root,'library');mkdirSync(lib);
  writeFileSync(join(lib,'official-library-v1.json'),JSON.stringify({runtimeItems:[
   {id:'aaa',titleEs:'Cadenas de bloqueo',kind:'video',keywords:['cadena','opresión','bloqueo'],storedInEditor:true,approvedForProduction:false},
   {id:'bbb',titleEs:'Chispas de cambio',kind:'overlay',keywords:['luz','revelación'],storedInEditor:true,approvedForProduction:true},
   {id:'ccc',titleEs:'Música de fondo',kind:'audio',keywords:['bloqueo'],storedInEditor:true},
   {id:'ddd',titleEs:'Tarjeta motion',kind:'native-motion',keywords:['bloqueo'],storedInEditor:true}
  ]}));
  writeFileSync(join(lib,'purchased-source-index-309-v1.json'),JSON.stringify({items:[
   {id:'remote',originalName:'Cadena remota.mp4',categoryHint:['bloqueo'],installedInEditor:false,sourceUrl:'https://private.invalid/file'}
  ]}));
  const t=transcript('Siento opresión y bloqueo. Después veo una luz y revelación. Todo cambia.');
  const a=proposeLibraryCues(root,t);assert.ok(a.cues.length>=1);
  assert.equal(a.approvedToAutoPublish,false);assert.deepEqual(a,proposeLibraryCues(root,t));
  assert.ok(a.cues.some(c=>c.candidates.some(v=>v.assetId==='aaa')));
  assert.ok(a.cues.every(c=>c.candidates.every(v=>v.needsHumanReview&&['video','overlay','image'].includes(v.kind)&&v.assetId!=='remote'&&v.assetId!=='ddd')));
  assert.ok(!JSON.stringify(a).includes('private.invalid'));
  assert.throws(()=>proposeLibraryCues(root,t,{limit:9}),/Límite/);
 }finally{rmSync(root,{recursive:true,force:true});}
});
