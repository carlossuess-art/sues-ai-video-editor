import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {fixture} from './helpers/editor-fixture.js';
import {createEditorServer} from '../src/editor-server.js';

test('private search is session protected, bounded, and never leaks private Drive URLs',async()=>{
 const f=fixture(),directory=join(f.dir,'jobs');
 const library=join(directory,'library');mkdirSync(library,{recursive:true,mode:0o700});
 writeFileSync(join(library,'official-library-v1.json'),JSON.stringify({runtimeItems:[
  {id:'abc',kind:'video',titleEs:'Cadena · opresión',storedInEditor:true,approvedForProduction:false,keywords:['bloqueo','opresión']}
 ]}));
 writeFileSync(join(library,'purchased-source-index-309-v1.json'),JSON.stringify({items:[
  {id:'def',originalName:'Cadena.mov',categoryHint:['cadena'],sourceUrl:'https://private.invalid/secret'}
 ]}));
 const app=createEditorServer({directory,profiles:f.profiles});
 try{
  const launch=await app.listen(),url=launch.split('/#')[0];
  assert.equal((await fetch(url+'/api/library/search?q=cadena')).status,401);
  const session=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}});
  assert.equal(session.status,200);
  const headers={Cookie:session.headers.get('set-cookie').split(';')[0]};
  const r=await fetch(url+'/api/library/search?q=cadena',{headers});assert.equal(r.status,200);
  const found=await r.json();assert.equal(found.results.length,2);
  assert.equal(found.results[0].availability,'private-operational');assert.equal(found.approvedToAutoPublish,false);
  assert.ok(!JSON.stringify(found).includes('private.invalid'));
  assert.equal((await fetch(url+'/api/library/search?q=cadena&limit=99',{headers})).status,400);
  assert.equal((await fetch(url+'/api/library/search?q=',{headers})).status,400);
 }finally{await app.close();rmSync(f.dir,{recursive:true,force:true});}
});
